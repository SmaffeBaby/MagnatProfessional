import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'

const {
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:3000',
  SUPABASE_URL = 'http://localhost:8000',
  SUPABASE_PUBLIC_URL = SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY,
  SUPABASE_STORAGE_BUCKET = 'photos',
  SUPABASE_STORAGE_PUBLIC = 'true',
} = process.env

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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

app.post('/api/storage/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Form field "file" is required' })
      return
    }

    const bucket = req.body.bucket || SUPABASE_STORAGE_BUCKET
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

    res.status(201).json({
      bucket,
      path: data.path,
      publicUrl,
    })
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
  const shouldBePublic = SUPABASE_STORAGE_PUBLIC === 'true'

  if (existingBucket) {
    if (existingBucket.public !== shouldBePublic) {
      const { error: updateError } = await supabase.storage.updateBucket(bucket, bucketOptions())

      if (updateError) {
        throw updateError
      }
    }

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
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  }
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
