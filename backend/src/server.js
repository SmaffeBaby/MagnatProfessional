import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { getMainText } from './cache/mainTextCache.js'

const {
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:3000',
  SUPABASE_URL = 'http://localhost:8000',
  SUPABASE_PUBLIC_URL = SUPABASE_URL,
  SUPABASE_ANON_KEY = process.env.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY,
  SUPABASE_STORAGE_BUCKET = 'photos',
  SUPABASE_HOME_PANELS_BUCKET = 'home-panels',
  SUPABASE_STORAGE_PUBLIC = 'true',
} = process.env

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY or ANON_KEY is required')
}

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
})

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

app.use(cors({ origin: CORS_ORIGIN.split(',').map((origin) => origin.trim()) }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'magnat-professional-backend',
    supabaseUrl: SUPABASE_URL,
  })
})

app.get('/api/storage/buckets', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      throw error
    }

    res.json({ buckets: data })
  } catch (error) {
    next(error)
  }
})

app.get('/api/main-text', async (req, res, next) => {
  try {
    const payload = await getMainText(supabase)
    const etag = `"${payload.updatedAt}"`

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end()
      return
    }

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
        ETag: etag,
      })
      .json(payload)
  } catch (error) {
    next(error)
  }
})

app.get('/api/home-panels', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('home_panels')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      })
      .json({
        panels: data.map(panelFromDatabase),
      })
  } catch (error) {
    next(error)
  }
})

app.get('/api/about-us', async (_req, res, next) => {
  try {
    const content = await getAboutUsContent()

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      })
      .json({ content })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    res.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/auth/me', requireAdminAuth, (req, res) => {
  res.json({ user: req.user })
})

app.get('/api/admin/home-panels', requireAdminAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('home_panels')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      panels: data.map(panelFromDatabase),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/home-panels', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = panelToDatabase(req.body)
    const { data, error } = await supabase
      .from('home_panels')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ panel: panelFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/home-panels/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = panelToDatabase(req.body)
    const { data, error } = await supabase
      .from('home_panels')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ panel: panelFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/home-panels/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('home_panels')
      .delete()
      .eq('id', req.params.id)

    if (error) {
      throw error
    }

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/about-us', requireAdminAuth, async (_req, res, next) => {
  try {
    const content = await getAboutUsContent()
    res.json({ content })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/about-us', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = aboutUsToDatabase(req.body)
    const { data, error } = await supabase
      .from('about_us_content')
      .upsert({ id: true, ...payload }, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ content: aboutUsFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/storage/upload', requireAdminAuth, upload.single('file'), async (req, res, next) => {
  try {
    const result = await uploadStorageFile(req, {
      defaultBucket: SUPABASE_HOME_PANELS_BUCKET,
      allowRequestBucket: false,
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

app.post('/api/storage/upload', upload.single('file'), async (req, res, next) => {
  try {
    const result = await uploadStorageFile(req, {
      defaultBucket: SUPABASE_STORAGE_BUCKET,
      allowRequestBucket: true,
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
  })
})

async function ensureBucket(bucket) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw listError
  }

  const existingBucket = buckets.find((item) => item.name === bucket)

  if (existingBucket) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, bucketOptions())

  if (createError) {
    throw createError
  }
}

function bucketOptions() {
  return {
    public: SUPABASE_STORAGE_PUBLIC === 'true',
    fileSizeLimit: 100 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
  }
}

async function requireAdminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      res.status(401).json({ error: 'Authorization token is required' })
      return
    }

    const { data, error } = await supabaseAuth.auth.getUser(token)

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired authorization token' })
      return
    }

    req.user = data.user
    next()
  } catch (error) {
    next(error)
  }
}

async function uploadStorageFile(req, { defaultBucket, allowRequestBucket }) {
  if (!req.file) {
    const error = new Error('Form field "file" is required')
    error.status = 400
    throw error
  }

  const bucket = allowRequestBucket && req.body.bucket ? req.body.bucket : defaultBucket
  await ensureBucket(bucket)

  const extension = extensionFromFile(req.file.originalname)
  const safeName = sanitizeBaseName(req.file.originalname)
  const objectPath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}${extension}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  const publicUrl = publicUrlData.publicUrl.replace(SUPABASE_URL, SUPABASE_PUBLIC_URL)

  return {
    bucket,
    path: data.path,
    publicUrl,
  }
}

function panelFromDatabase(panel) {
  return {
    id: panel.id,
    title: panel.title,
    titleEn: panel.title_en,
    sortOrder: panel.sort_order,
    gradientFromColor: panel.gradient_from_color,
    gradientFromOpacity: Number(panel.gradient_from_opacity),
    gradientToColor: panel.gradient_to_color,
    gradientToOpacity: Number(panel.gradient_to_opacity),
    gradientToPosition: panel.gradient_to_position,
    imagePath: panel.image_path,
    imageUrl: panel.image_url,
    videoPath: panel.video_path,
    videoUrl: panel.video_url,
    posterPath: panel.poster_path,
    posterUrl: panel.poster_url,
    linkPath: panel.link_path,
    tileType: panel.tile_type,
    createdAt: panel.created_at,
    updatedAt: panel.updated_at,
  }
}

function panelToDatabase(panel) {
  const title = String(panel.title || '').trim()
  const linkPath = normalizeInternalPath(panel.linkPath)
  const tileType = panel.tileType === 'vertical' ? 'vertical' : 'wide'
  const sortOrder = Number.isFinite(Number(panel.sortOrder)) ? Number(panel.sortOrder) : 0
  const gradientFromColor = normalizeHexColor(panel.gradientFromColor, '#DA2128')
  const gradientFromOpacity = clampNumber(panel.gradientFromOpacity, 0, 1, 1)
  const gradientToColor = normalizeHexColor(panel.gradientToColor, '#DA2128')
  const gradientToOpacity = clampNumber(panel.gradientToOpacity, 0, 1, 0)
  const gradientToPosition = Math.round(clampNumber(panel.gradientToPosition, 0, 100, 70))

  if (!title) {
    const error = new Error('Title is required')
    error.status = 400
    throw error
  }

  return {
    title,
    title_en: normalizeOptionalText(panel.titleEn),
    sort_order: sortOrder,
    gradient_from_color: gradientFromColor,
    gradient_from_opacity: gradientFromOpacity,
    gradient_to_color: gradientToColor,
    gradient_to_opacity: gradientToOpacity,
    gradient_to_position: gradientToPosition,
    image_path: panel.imagePath || null,
    image_url: panel.imageUrl || null,
    video_path: panel.videoPath || null,
    video_url: panel.videoUrl || null,
    poster_path: panel.posterPath || null,
    poster_url: panel.posterUrl || null,
    link_path: linkPath,
    tile_type: tileType,
  }
}

async function getAboutUsContent() {
  const { data, error } = await supabase
    .from('about_us_content')
    .select('*')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return aboutUsFromDatabase(data)
}

function aboutUsFromDatabase(content) {
  return {
    text: content?.text || '',
    textEn: content?.text_en || null,
    buttonText: content?.button_text || '',
    buttonTextEn: content?.button_text_en || null,
    updatedAt: content?.updated_at || null,
  }
}

function aboutUsToDatabase(content) {
  return {
    text: String(content.text || '').trim(),
    text_en: normalizeOptionalText(content.textEn),
    button_text: String(content.buttonText || '').trim(),
    button_text_en: normalizeOptionalText(content.buttonTextEn),
  }
}

function normalizeOptionalText(value) {
  const normalized = String(value || '').trim()
  return normalized || null
}

function normalizeHexColor(value, fallback) {
  const normalized = String(value || '').trim()
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toUpperCase() : fallback
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.min(max, Math.max(min, number))
}

function normalizeInternalPath(path) {
  const fallback = '/'
  const rawPath = String(path || fallback).trim()

  if (!rawPath || rawPath.includes('://') || rawPath.startsWith('//')) {
    return fallback
  }

  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`
}

function sanitizeBaseName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image'
}

function extensionFromFile(fileName) {
  const match = fileName.match(/\.[a-z0-9]+$/i)
  return match ? match[0].toLowerCase() : ''
}

app.listen(PORT, () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`)
})
