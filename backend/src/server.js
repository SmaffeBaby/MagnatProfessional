import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import nodemailer from 'nodemailer'
import pg from 'pg'
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
  SUPABASE_PORTFOLIO_BUCKET = 'portfolio',
  PUBLIC_API_CACHE_TTL_MS = String(5 * 60 * 1000),
  MEDIA_CACHE_TTL_MS = String(24 * 60 * 60 * 1000),
  MEDIA_CACHE_MAX_BYTES = String(256 * 1024 * 1024),
  SUPABASE_BUCKET_FILE_SIZE_LIMIT = String(50 * 1024 * 1024),
  SUPABASE_STORAGE_PUBLIC = 'true',
  PROJECT_REQUEST_NOTIFY_EMAIL = 'develop1@lightdigital.ru',
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_SECURE = 'false',
  POSTGRES_HOST = 'db',
  POSTGRES_PORT = '5432',
  POSTGRES_DB = 'postgres',
  POSTGRES_USER = 'postgres',
  POSTGRES_PASSWORD,
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

const { Client: PgClient } = pg
const publicApiCache = new Map()
const mediaCache = new Map()
let mediaCacheBytes = 0
let mailTransporter = null

app.use(cors({ origin: CORS_ORIGIN.split(',').map((origin) => origin.trim()) }))
app.use(express.json())
app.use(publicApiCacheMiddleware)
app.use(clearPublicApiCacheAfterMutations)

app.get('/api/media/:bucket/*', async (req, res, next) => {
  try {
    const bucket = req.params.bucket
    const objectPath = req.params[0]

    if (!bucket || !objectPath) {
      res.status(400).json({ error: 'Media bucket and path are required' })
      return
    }

    const media = await getCachedStorageObject(bucket, objectPath)
    sendMediaResponse(req, res, media)
  } catch (error) {
    next(error)
  }
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'magnat-professional-backend',
    supabaseUrl: SUPABASE_URL,
  })
})

app.get('/robots.txt', (req, res) => {
  const origin = requestOrigin(req)

  res
    .type('text/plain')
    .send([
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${origin}/sitemap.xml`,
      '',
    ].join('\n'))
})

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const origin = requestOrigin(req)
    const entries = await buildSitemapEntries()
    const urls = entries
      .map((entry) => [
        '  <url>',
        `    <loc>${escapeXml(`${origin}${entry.path}`)}</loc>`,
        entry.updatedAt ? `    <lastmod>${escapeXml(new Date(entry.updatedAt).toISOString())}</lastmod>` : '',
        entry.changeFrequency ? `    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>` : '',
        entry.priority !== null && entry.priority !== undefined ? `    <priority>${Number(entry.priority).toFixed(1)}</priority>` : '',
        '  </url>',
      ].filter(Boolean).join('\n'))
      .join('\n')

    res
      .type('application/xml')
      .send([
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        '</urlset>',
      ].join('\n'))
  } catch (error) {
    next(error)
  }
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

app.get('/api/seo', async (req, res, next) => {
  try {
    const path = normalizeSeoPath(req.query.path || '/')
    const entry = await getSeoEntryForPath(path)

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      })
      .json(entry)
  } catch (error) {
    next(error)
  }
})

app.get('/api/portfolio/:panelSlug/:cardSlug', async (req, res, next) => {
  try {
    const { data: panel, error: panelError } = await supabase
      .from('home_panels')
      .select('*')
      .eq('slug', req.params.panelSlug)
      .maybeSingle()

    if (panelError) {
      throw panelError
    }

    if (!panel) {
      res.status(404).json({ error: 'Portfolio panel not found' })
      return
    }

    const { data: cards, error: cardsError } = await supabase
      .from('portfolio_cards')
      .select('*')
      .eq('panel_id', panel.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (cardsError) {
      throw cardsError
    }

    const cardsWithArticleBlocks = await attachArticleBlocksToCards(cards)
    const currentIndex = cardsWithArticleBlocks.findIndex((card) => card.slug === req.params.cardSlug)

    if (currentIndex === -1) {
      res.status(404).json({ error: 'Portfolio card not found' })
      return
    }

    const mappedCards = cardsWithArticleBlocks.map((card) => portfolioCardFromDatabase(card, panel.slug))
    const previousCard = mappedCards[(currentIndex - 1 + mappedCards.length) % mappedCards.length] || null
    const nextCard = mappedCards[(currentIndex + 1) % mappedCards.length] || null

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      })
      .json({
        panel: panelFromDatabase(panel),
        card: mappedCards[currentIndex],
        previousCard: previousCard?.id === mappedCards[currentIndex]?.id ? null : previousCard,
        nextCard: nextCard?.id === mappedCards[currentIndex]?.id ? null : nextCard,
      })
  } catch (error) {
    next(error)
  }
})

app.get('/api/portfolio/:panelSlug', async (req, res, next) => {
  try {
    const { data: panel, error: panelError } = await supabase
      .from('home_panels')
      .select('*')
      .eq('slug', req.params.panelSlug)
      .maybeSingle()

    if (panelError) {
      throw panelError
    }

    if (!panel) {
      res.status(404).json({ error: 'Portfolio panel not found' })
      return
    }

    const { data: cards, error: cardsError } = await supabase
      .from('portfolio_cards')
      .select('*')
      .eq('panel_id', panel.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (cardsError) {
      throw cardsError
    }

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      })
      .json({
        panel: panelFromDatabase(panel),
        cards: (await attachArticleBlocksToCards(cards)).map((card) => portfolioCardFromDatabase(card, panel.slug)),
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

app.get('/api/description', async (_req, res, next) => {
  try {
    const content = await getDescriptionContent()

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      })
      .json({ content })
  } catch (error) {
    next(error)
  }
})

app.get('/api/stats', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('stats_items')
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
        items: data.map(statsItemFromDatabase),
      })
  } catch (error) {
    next(error)
  }
})

app.get('/api/director-text', async (_req, res, next) => {
  try {
    const content = await getDirectorTextContent()

    res
      .set({
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      })
      .json({ content })
  } catch (error) {
    next(error)
  }
})

app.get('/api/hystory-company', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('hystory_company_items')
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
        items: data.map(hystoryCompanyItemFromDatabase),
      })
  } catch (error) {
    next(error)
  }
})

app.get('/api/privacy', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('privacy_blocks')
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
        blocks: data.map(privacyBlockFromDatabase),
      })
  } catch (error) {
    next(error)
  }
})

app.get('/api/mission-values', async (_req, res, next) => {
  try {
    const content = await getMissionValuesContent()
    const { data, error } = await supabase
      .from('mission_values_cards')
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
        content,
        cards: data.map(missionValuesCardFromDatabase),
      })
  } catch (error) {
    next(error)
  }
})

app.get('/api/clients', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients_items')
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
        items: data.map(clientItemFromDatabase),
      })
  } catch (error) {
    next(error)
  }
})

app.post('/api/project-requests', async (req, res, next) => {
  try {
    const payload = projectRequestToDatabase(req.body)
    const { data, error } = await supabase
      .from('project_requests')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const request = projectRequestFromDatabase(data)
    sendProjectRequestNotification(request).catch((mailError) => {
      console.error('Failed to send project request notification', mailError)
    })

    res.status(201).json({ request })
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

app.get('/api/admin/seo', requireAdminAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('seo_entries')
      .select('*')
      .order('path', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      entries: data.map(seoEntryFromDatabase),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/seo', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = seoEntryToDatabase(req.body)
    const { data, error } = await supabase
      .from('seo_entries')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ entry: seoEntryFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/seo/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = seoEntryToDatabase(req.body)
    const { data, error } = await supabase
      .from('seo_entries')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ entry: seoEntryFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/seo/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('seo_entries')
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
      panels: data.map((panel) => panelFromDatabase(panel, { proxyMedia: false })),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/home-panels/:panelId/cards', requireAdminAuth, async (req, res, next) => {
  try {
    const panel = await getPanelById(req.params.panelId)
    const { data, error } = await supabase
      .from('portfolio_cards')
      .select('*')
      .eq('panel_id', req.params.panelId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    const cards = await attachArticleBlocksToCards(data, { proxyMedia: false })

    res.json({
      cards: cards.map((card) => portfolioCardFromDatabase(card, panel.slug, { proxyMedia: false })),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/home-panels/:panelId/cards', requireAdminAuth, async (req, res, next) => {
  try {
    const panel = await getPanelById(req.params.panelId)
    const payload = portfolioCardToDatabase(req.body, panel)
    const { data, error } = await supabase
      .from('portfolio_cards')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const articleBlocks = Array.isArray(req.body.articleBlocks)
      ? await savePortfolioCardArticleBlocks(data.id, req.body.articleBlocks, { proxyMedia: false })
      : []

    res.status(201).json({
      card: portfolioCardFromDatabase({ ...data, articleBlocks }, panel.slug, { proxyMedia: false }),
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/home-panels/:panelId/cards/:cardId', requireAdminAuth, async (req, res, next) => {
  try {
    const panel = await getPanelById(req.params.panelId)
    const payload = portfolioCardToDatabase(req.body, panel)
    const { data, error } = await supabase
      .from('portfolio_cards')
      .update(payload)
      .eq('id', req.params.cardId)
      .eq('panel_id', req.params.panelId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const articleBlocks = Array.isArray(req.body.articleBlocks)
      ? await savePortfolioCardArticleBlocks(data.id, req.body.articleBlocks, { proxyMedia: false })
      : (await attachArticleBlocksToCards([data], { proxyMedia: false }))[0]?.articleBlocks || []

    res.json({
      card: portfolioCardFromDatabase({ ...data, articleBlocks }, panel.slug, { proxyMedia: false }),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/home-panels/:panelId/cards/:cardId', requireAdminAuth, async (req, res, next) => {
  try {
    const { data: card, error: fetchError } = await supabase
      .from('portfolio_cards')
      .select('*')
      .eq('id', req.params.cardId)
      .eq('panel_id', req.params.panelId)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    const cardWithArticleBlocks = (await attachArticleBlocksToCards(card ? [card] : []))[0] || card

    const { error } = await supabase
      .from('portfolio_cards')
      .delete()
      .eq('id', req.params.cardId)
      .eq('panel_id', req.params.panelId)

    if (error) {
      throw error
    }

    await deleteStorageFiles(SUPABASE_PORTFOLIO_BUCKET, collectMediaPaths(cardWithArticleBlocks))
    res.status(204).end()
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

    res.status(201).json({ panel: panelFromDatabase(data, { proxyMedia: false }) })
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

    res.json({ panel: panelFromDatabase(data, { proxyMedia: false }) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/home-panels/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { data: panel, error: panelFetchError } = await supabase
      .from('home_panels')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle()

    if (panelFetchError) {
      throw panelFetchError
    }

    const { data: cards, error: cardsFetchError } = await supabase
      .from('portfolio_cards')
      .select('*')
      .eq('panel_id', req.params.id)

    if (cardsFetchError) {
      throw cardsFetchError
    }

    const { error } = await supabase
      .from('home_panels')
      .delete()
      .eq('id', req.params.id)

    if (error) {
      throw error
    }

    await deleteStorageFiles(SUPABASE_HOME_PANELS_BUCKET, collectMediaPaths(panel))
    const cardsWithArticleBlocks = await attachArticleBlocksToCards(cards)

    await deleteStorageFiles(SUPABASE_PORTFOLIO_BUCKET, [
      ...(panel?.mascot_path ? [panel.mascot_path] : []),
      ...cardsWithArticleBlocks.flatMap(collectMediaPaths),
    ])
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

app.get('/api/admin/description', requireAdminAuth, async (_req, res, next) => {
  try {
    const content = await getDescriptionContent({ proxyMedia: false })
    res.json({ content })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/description', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = descriptionToDatabase(req.body)
    const { data, error } = await supabase
      .from('description_content')
      .upsert({ id: true, ...payload }, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ content: descriptionFromDatabase(data, { proxyMedia: false }) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/stats', requireAdminAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('stats_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      items: data.map(statsItemFromDatabase),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/stats', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = statsItemToDatabase(req.body)
    const { data, error } = await supabase
      .from('stats_items')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ item: statsItemFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/stats/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = statsItemToDatabase(req.body)
    const { data, error } = await supabase
      .from('stats_items')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ item: statsItemFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/stats/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('stats_items')
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

app.get('/api/admin/director-text', requireAdminAuth, async (_req, res, next) => {
  try {
    const content = await getDirectorTextContent({ proxyMedia: false })
    res.json({ content })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/director-text', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = directorTextToDatabase(req.body)
    const { data, error } = await supabase
      .from('director_text_content')
      .upsert({ id: true, ...payload }, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ content: directorTextFromDatabase(data, { proxyMedia: false }) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/hystory-company', requireAdminAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('hystory_company_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      items: data.map(hystoryCompanyItemFromDatabase),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/hystory-company', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = hystoryCompanyItemToDatabase(req.body)
    const { data, error } = await supabase
      .from('hystory_company_items')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ item: hystoryCompanyItemFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/hystory-company/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = hystoryCompanyItemToDatabase(req.body)
    const { data, error } = await supabase
      .from('hystory_company_items')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ item: hystoryCompanyItemFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/hystory-company/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('hystory_company_items')
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

app.get('/api/admin/privacy', requireAdminAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('privacy_blocks')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      blocks: data.map(privacyBlockFromDatabase),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/privacy', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = privacyBlockToDatabase(req.body)
    const { data, error } = await supabase
      .from('privacy_blocks')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ block: privacyBlockFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/privacy/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = privacyBlockToDatabase(req.body)
    const { data, error } = await supabase
      .from('privacy_blocks')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ block: privacyBlockFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/privacy/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('privacy_blocks')
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

app.get('/api/admin/mission-values', requireAdminAuth, async (_req, res, next) => {
  try {
    const content = await getMissionValuesContent()
    const { data, error } = await supabase
      .from('mission_values_cards')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      content,
      cards: data.map(missionValuesCardFromDatabase),
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/mission-values', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = missionValuesContentToDatabase(req.body)
    const { data, error } = await supabase
      .from('mission_values_content')
      .upsert({ id: true, ...payload }, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ content: missionValuesContentFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/mission-values/cards', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = missionValuesCardToDatabase(req.body)
    const { data, error } = await supabase
      .from('mission_values_cards')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ card: missionValuesCardFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/mission-values/cards/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = missionValuesCardToDatabase(req.body)
    const { data, error } = await supabase
      .from('mission_values_cards')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ card: missionValuesCardFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/mission-values/cards/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('mission_values_cards')
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

app.get('/api/admin/clients', requireAdminAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      items: data.map((item) => clientItemFromDatabase(item, { proxyMedia: false })),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/clients', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = clientItemToDatabase(req.body)
    const { data, error } = await supabase
      .from('clients_items')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ item: clientItemFromDatabase(data, { proxyMedia: false }) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/admin/clients/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const payload = clientItemToDatabase(req.body)
    const { data, error } = await supabase
      .from('clients_items')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ item: clientItemFromDatabase(data, { proxyMedia: false }) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/clients/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { data: item, error: fetchError } = await supabase
      .from('clients_items')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    const { error } = await supabase
      .from('clients_items')
      .delete()
      .eq('id', req.params.id)

    if (error) {
      throw error
    }

    await deleteStorageFiles('clients', collectMediaPaths(item))
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/project-requests', requireAdminAuth, async (req, res, next) => {
  try {
    const status = String(req.query.status || '').trim()
    const search = String(req.query.search || '').trim()
    const allowedStatuses = new Set(['new', 'in_progress', 'closed'])

    let query = supabase
      .from('project_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (allowedStatuses.has(status)) {
      query = query.eq('status', status)
    }

    if (search) {
      const pattern = `%${escapePostgrestLike(search)}%`
      query = query.or(`name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern},message.ilike.${pattern}`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const { count, error: countError } = await supabase
      .from('project_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')

    if (countError) {
      throw countError
    }

    res.json({
      requests: data.map(projectRequestFromDatabase),
      newCount: count || 0,
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/admin/project-requests/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const status = normalizeProjectRequestStatus(req.body.status)
    const { data, error } = await supabase
      .from('project_requests')
      .update({ status })
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ request: projectRequestFromDatabase(data) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/project-requests/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('project_requests')
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

app.post('/api/admin/storage/upload', requireAdminAuth, upload.single('file'), async (req, res, next) => {
  try {
    const result = await uploadStorageFile(req, {
      defaultBucket: SUPABASE_HOME_PANELS_BUCKET,
      allowRequestBucket: true,
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/storage/file', requireAdminAuth, async (req, res, next) => {
  try {
    const bucket = String(req.body.bucket || '').trim()
    const path = String(req.body.path || '').trim()

    if (!bucket || !path) {
      res.status(400).json({ error: 'Bucket and path are required' })
      return
    }

    await deleteStorageFiles(bucket, [path])
    res.status(204).end()
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
    const { error: updateError } = await supabase.storage.updateBucket(bucket, bucketOptions())

    if (updateError) {
      throw updateError
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
    fileSizeLimit: Number(SUPABASE_BUCKET_FILE_SIZE_LIMIT) || 50 * 1024 * 1024,
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

async function deleteStorageFiles(bucket, paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))]

  if (!bucket || uniquePaths.length === 0) {
    return
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove(uniquePaths)

  if (error) {
    console.warn(`Failed to delete files from bucket ${bucket}:`, error.message)
  }

  for (const path of uniquePaths) {
    clearMediaCache(bucket, path)
  }
}

function clearMediaCache(bucket, objectPath) {
  const cacheKey = `${bucket}/${objectPath}`
  const cached = mediaCache.get(cacheKey)

  if (!cached) {
    return
  }

  mediaCache.delete(cacheKey)
  mediaCacheBytes -= cached.size
}

function publicApiCacheMiddleware(req, res, next) {
  if (req.method !== 'GET' || !isCacheablePublicApiPath(req.path)) {
    next()
    return
  }

  const cacheKey = req.originalUrl
  const now = Date.now()
  const cached = publicApiCache.get(cacheKey)

  if (cached && now - cached.cachedAt < Number(PUBLIC_API_CACHE_TTL_MS)) {
    res
      .status(cached.statusCode)
      .set(cached.headers)
      .json(cached.body)
    return
  }

  const originalJson = res.json.bind(res)

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      publicApiCache.set(cacheKey, {
        body,
        statusCode: res.statusCode,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
        cachedAt: Date.now(),
      })
    }

    return originalJson(body)
  }

  next()
}

function clearPublicApiCacheAfterMutations(req, res, next) {
  res.on('finish', () => {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)

    if (isMutation && req.path.startsWith('/api/') && res.statusCode < 400) {
      publicApiCache.clear()
    }
  })

  next()
}

function isCacheablePublicApiPath(path) {
  if (!path.startsWith('/api/')) {
    return false
  }

  return ![
    '/api/admin',
    '/api/health',
    '/api/media',
    '/api/storage',
  ].some((prefix) => path.startsWith(prefix))
}

async function getCachedStorageObject(bucket, objectPath) {
  const cacheKey = `${bucket}/${objectPath}`
  const now = Date.now()
  const cached = mediaCache.get(cacheKey)

  if (cached && now - cached.cachedAt < Number(MEDIA_CACHE_TTL_MS)) {
    cached.lastAccessedAt = now
    return cached
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(objectPath)

  if (error) {
    error.status = error.statusCode || 404
    throw error
  }

  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = data.type || getContentType(objectPath)
  const payload = {
    bucket,
    objectPath,
    buffer,
    contentType,
    size: buffer.byteLength,
    cachedAt: now,
    lastAccessedAt: now,
  }

  setMediaCache(cacheKey, payload)
  return payload
}

function setMediaCache(cacheKey, payload) {
  const existing = mediaCache.get(cacheKey)

  if (existing) {
    mediaCacheBytes -= existing.size
  }

  mediaCache.set(cacheKey, payload)
  mediaCacheBytes += payload.size
  pruneMediaCache()
}

function pruneMediaCache() {
  const maxBytes = Number(MEDIA_CACHE_MAX_BYTES)

  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    return
  }

  while (mediaCacheBytes > maxBytes && mediaCache.size > 0) {
    const [oldestKey, oldestValue] = [...mediaCache.entries()]
      .sort((first, second) => first[1].lastAccessedAt - second[1].lastAccessedAt)[0]

    mediaCache.delete(oldestKey)
    mediaCacheBytes -= oldestValue.size
  }
}

function sendMediaResponse(req, res, media) {
  const range = req.headers.range
  const headers = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': media.contentType,
  }

  if (!range) {
    res
      .status(200)
      .set({
        ...headers,
        'Content-Length': media.size,
      })
      .send(media.buffer)
    return
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range)

  if (!match) {
    res.status(416).set('Content-Range', `bytes */${media.size}`).end()
    return
  }

  const start = match[1] ? Number(match[1]) : 0
  const end = match[2] ? Number(match[2]) : media.size - 1

  if (start >= media.size || end >= media.size || start > end) {
    res.status(416).set('Content-Range', `bytes */${media.size}`).end()
    return
  }

  res
    .status(206)
    .set({
      ...headers,
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${media.size}`,
    })
    .send(media.buffer.subarray(start, end + 1))
}

function getContentType(objectPath) {
  const extension = objectPath.split('.').pop()?.toLowerCase()

  return {
    avif: 'image/avif',
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    mov: 'video/quicktime',
    mp4: 'video/mp4',
    png: 'image/png',
    svg: 'image/svg+xml',
    webm: 'video/webm',
    webp: 'image/webp',
  }[extension] || 'application/octet-stream'
}

function proxyStorageUrl(url, path, bucket) {
  if (!url) {
    return path && bucket ? buildMediaUrl(bucket, path) : null
  }

  const parsed = parsePublicStorageUrl(url)
  if (parsed) {
    return buildMediaUrl(parsed.bucket, parsed.path)
  }

  return path && bucket ? buildMediaUrl(bucket, path) : url
}

function storageUrl(url, path, bucket, options = {}) {
  return options.proxyMedia === false
    ? publicStorageUrl(url, path, bucket)
    : proxyStorageUrl(url, path, bucket)
}

function publicStorageUrl(url, path, bucket) {
  if (url) {
    const parsedProxyUrl = parseProxiedMediaUrl(url)

    if (parsedProxyUrl) {
      return buildPublicStorageUrl(parsedProxyUrl.bucket, parsedProxyUrl.path)
    }

    return url
  }

  return path && bucket ? buildPublicStorageUrl(bucket, path) : null
}

function buildPublicStorageUrl(bucket, objectPath) {
  const encodedPath = String(objectPath)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${SUPABASE_PUBLIC_URL.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`
}

function buildMediaUrl(bucket, objectPath) {
  const encodedPath = String(objectPath)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `/api/media/${encodeURIComponent(bucket)}/${encodedPath}`
}

function parsePublicStorageUrl(url) {
  try {
    const parsedUrl = new URL(url)
    const marker = '/storage/v1/object/public/'
    const markerIndex = parsedUrl.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    const storagePath = parsedUrl.pathname.slice(markerIndex + marker.length)
    const [bucket, ...pathParts] = storagePath.split('/').map((part) => decodeURIComponent(part))

    if (!bucket || pathParts.length === 0) {
      return null
    }

    return {
      bucket,
      path: pathParts.join('/'),
    }
  } catch (_error) {
    return null
  }
}

function parseProxiedMediaUrl(url) {
  try {
    const parsedUrl = new URL(url, 'http://localhost')
    const marker = '/api/media/'
    const markerIndex = parsedUrl.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    const storagePath = parsedUrl.pathname.slice(markerIndex + marker.length)
    const [bucket, ...pathParts] = storagePath.split('/').map((part) => decodeURIComponent(part))

    if (!bucket || pathParts.length === 0) {
      return null
    }

    return {
      bucket,
      path: pathParts.join('/'),
    }
  } catch (_error) {
    return null
  }
}

function collectMediaPaths(item) {
  if (!item) {
    return []
  }

  const articleBlocks = Array.isArray(item.articleBlocks)
    ? item.articleBlocks
    : Array.isArray(item.article_blocks)
      ? item.article_blocks
      : []

  return [
    item.image_path,
    item.video_path,
    item.poster_path,
    item.case_hero_path,
    ...articleBlocks.flatMap((block) => (
      Array.isArray(block?.imageGroups)
        ? block.imageGroups.flatMap((group) => (
            Array.isArray(group?.images) ? group.images.map((image) => image?.path) : []
          ))
        : Array.isArray(block?.images)
          ? block.images.map((image) => image?.path)
          : []
    )),
  ].filter(Boolean)
}

function normalizeArticleBlocks(blocks, options = {}) {
  if (!Array.isArray(blocks)) {
    return []
  }

  return blocks.map((block, blockIndex) => {
    const layout = ['single-wide', 'two-medium', 'three-vertical'].includes(block?.layout)
      ? block.layout
      : 'single-wide'
    const imageGroups = normalizeArticleImageGroups(block, layout, options)
    const images = imageGroups.flatMap((group) => group.images)

    return {
      id: String(block?.id || crypto.randomUUID()),
      title: String(block?.title || '').trim(),
      titleEn: normalizeOptionalText(block?.titleEn),
      text: String(block?.text || '').trim(),
      textEn: normalizeOptionalText(block?.textEn),
      layout,
      images,
      imageGroups,
      sortOrder: blockIndex,
    }
  })
}

function normalizeArticleImages(images, options = {}) {
  if (!Array.isArray(images)) {
    return []
  }

  return images
    .map((image, imageIndex) => ({
      id: String(image?.id || crypto.randomUUID()),
      path: image?.path || null,
      url: storageUrl(String(image?.url || '').trim(), image?.path, SUPABASE_PORTFOLIO_BUCKET, options),
      alt: String(image?.alt || '').trim(),
      sortOrder: imageIndex,
    }))
    .filter((image) => image.url)
}

function normalizeArticleImageGroups(block, fallbackLayout = 'single-wide', options = {}) {
  const groups = Array.isArray(block?.imageGroups) && block.imageGroups.some((item) => Array.isArray(item?.images))
    ? block.imageGroups
    : Array.isArray(block?.images) && block.images.some((item) => Array.isArray(item?.images))
      ? block.images
      : null

  if (groups) {
    return groups
      .map((group, groupIndex) => {
        const layout = ['single-wide', 'two-medium', 'three-vertical'].includes(group?.layout)
          ? group.layout
          : fallbackLayout

        return {
          id: String(group?.id || crypto.randomUUID()),
          layout,
          images: normalizeArticleImages(group?.images, options),
          sortOrder: groupIndex,
        }
      })
      .filter((group) => group.images.length > 0 || group.layout)
  }

  const images = normalizeArticleImages(block?.images, options)

  return images.length > 0
    ? [{
        id: String(block?.imageGroupId || crypto.randomUUID()),
        layout: fallbackLayout,
        images,
        sortOrder: 0,
      }]
    : []
}

function articleBlockFromDatabase(block, options = {}) {
  const normalizedBlock = normalizeArticleBlocks([{ layout: block.layout, images: block.images || [] }], options)[0]

  return {
    id: block.id,
    title: block.title || '',
    titleEn: block.title_en,
    text: block.text || '',
    textEn: block.text_en,
    layout: ['single-wide', 'two-medium', 'three-vertical'].includes(block.layout)
      ? block.layout
      : 'single-wide',
    images: normalizedBlock?.images || [],
    imageGroups: normalizedBlock?.imageGroups || [],
    sortOrder: block.sort_order,
  }
}

function articleBlockToDatabase(block, cardId, index) {
  const normalized = normalizeArticleBlocks([block], { proxyMedia: false })[0]

  return {
    id: isUuid(normalized.id) ? normalized.id : crypto.randomUUID(),
    card_id: cardId,
    title: normalized.title,
    title_en: normalized.titleEn,
    text: normalized.text,
    text_en: normalized.textEn,
    layout: normalized.layout,
    images: normalized.imageGroups,
    sort_order: index,
  }
}

async function attachArticleBlocksToCards(cards, options = {}) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return []
  }

  const cardIds = cards.map((card) => card.id).filter(Boolean)
  const { data, error } = await supabase
    .from('portfolio_card_article_blocks')
    .select('*')
    .in('card_id', cardIds)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const blocksByCardId = new Map()

  for (const block of data || []) {
    const blocks = blocksByCardId.get(block.card_id) || []
    blocks.push(articleBlockFromDatabase(block, options))
    blocksByCardId.set(block.card_id, blocks)
  }

  return cards.map((card) => {
    const tableBlocks = blocksByCardId.get(card.id)

    return {
      ...card,
      articleBlocks: tableBlocks && tableBlocks.length > 0
        ? tableBlocks
        : normalizeArticleBlocks(card.article_blocks, options),
    }
  })
}

async function savePortfolioCardArticleBlocks(cardId, blocks, options = {}) {
  const normalizedBlocks = normalizeArticleBlocks(blocks, { proxyMedia: false })

  const { error: deleteError } = await supabase
    .from('portfolio_card_article_blocks')
    .delete()
    .eq('card_id', cardId)

  if (deleteError) {
    throw deleteError
  }

  if (normalizedBlocks.length === 0) {
    return []
  }

  const payload = normalizedBlocks.map((block, index) => articleBlockToDatabase(block, cardId, index))
  const { data, error } = await supabase
    .from('portfolio_card_article_blocks')
    .insert(payload)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data.map((block) => articleBlockFromDatabase(block, options))
}

function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function getSeoEntryForPath(path) {
  const normalizedPath = normalizeSeoPath(path)
  const { data, error } = await supabase
    .from('seo_entries')
    .select('*')
    .eq('path', normalizedPath)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return {
      entry: seoEntryFromDatabase(data),
      fallback: false,
    }
  }

  return {
    entry: await buildFallbackSeoEntry(normalizedPath),
    fallback: true,
  }
}

async function buildSitemapEntries() {
  const entriesByPath = new Map()
  const addEntry = (entry) => {
    const path = normalizeSeoPath(entry.path)

    entriesByPath.set(path, {
      path,
      priority: entry.priority ?? 0.5,
      changeFrequency: entry.changeFrequency || entry.change_frequency || 'weekly',
      updatedAt: entry.updatedAt || entry.updated_at || null,
    })
  }

  const { data: seoEntries, error: seoError } = await supabase
    .from('seo_entries')
    .select('*')

  if (seoError) {
    throw seoError
  }

  for (const entry of seoEntries || []) {
    if (!String(entry.robots || '').includes('noindex')) {
      addEntry(seoEntryFromDatabase(entry))
    }
  }

  const { data: panels, error: panelsError } = await supabase
    .from('home_panels')
    .select('slug, updated_at')

  if (panelsError) {
    throw panelsError
  }

  for (const panel of panels || []) {
    addEntry({
      path: `/portfolio/${panel.slug}`,
      priority: 0.7,
      changeFrequency: 'monthly',
      updatedAt: panel.updated_at,
    })
  }

  const { data: cards, error: cardsError } = await supabase
    .from('portfolio_cards')
    .select('slug, panel_id, updated_at, home_panels(slug)')

  if (cardsError) {
    throw cardsError
  }

  for (const card of cards || []) {
    const panelSlug = card.home_panels?.slug

    if (!panelSlug) {
      continue
    }

    addEntry({
      path: `/portfolio/${panelSlug}/${card.slug}`,
      priority: 0.6,
      changeFrequency: 'monthly',
      updatedAt: card.updated_at,
    })
  }

  return [...entriesByPath.values()]
    .sort((first, second) => first.path.localeCompare(second.path))
}

async function buildFallbackSeoEntry(path) {
  const [panelSlug, cardSlug] = portfolioSlugsFromPath(path)

  if (panelSlug && cardSlug) {
    const cardSeo = await buildPortfolioCardSeoEntry(path, panelSlug, cardSlug)

    if (cardSeo) {
      return cardSeo
    }
  }

  if (panelSlug) {
    const panelSeo = await buildPortfolioPanelSeoEntry(path, panelSlug)

    if (panelSeo) {
      return panelSeo
    }
  }

  return fallbackSeoByPath(path)
}

async function buildPortfolioPanelSeoEntry(path, panelSlug) {
  const { data: panel, error } = await supabase
    .from('home_panels')
    .select('*')
    .eq('slug', panelSlug)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!panel) {
    return null
  }

  return {
    ...fallbackSeoByPath('/portfolio'),
    id: `fallback-panel-${panel.slug}`,
    scope: 'group',
    path,
    title: panel.title,
    titleEn: panel.title_en || null,
    description: panel.detail_text || null,
    descriptionEn: panel.detail_text_en || null,
    canonicalPath: path,
    ogImageUrl: publicStorageUrl(panel.poster_url || panel.image_url, panel.poster_path || panel.image_path, SUPABASE_HOME_PANELS_BUCKET),
  }
}

async function buildPortfolioCardSeoEntry(path, panelSlug, cardSlug) {
  const { data: panel, error: panelError } = await supabase
    .from('home_panels')
    .select('*')
    .eq('slug', panelSlug)
    .maybeSingle()

  if (panelError) {
    throw panelError
  }

  if (!panel) {
    return null
  }

  const { data: card, error: cardError } = await supabase
    .from('portfolio_cards')
    .select('*')
    .eq('panel_id', panel.id)
    .eq('slug', cardSlug)
    .maybeSingle()

  if (cardError) {
    throw cardError
  }

  if (!card) {
    return null
  }

  return {
    ...fallbackSeoByPath('/portfolio'),
    id: `fallback-case-${card.slug}`,
    scope: 'case',
    path,
    title: card.title,
    titleEn: card.title_en || null,
    description: panel.detail_text || null,
    descriptionEn: panel.detail_text_en || null,
    canonicalPath: path,
    ogImageUrl: publicStorageUrl(card.case_hero_url || card.poster_url || card.image_url, card.case_hero_path || card.poster_path || card.image_path, SUPABASE_PORTFOLIO_BUCKET),
  }
}

function fallbackSeoByPath(path) {
  const entries = {
    '/': {
      title: 'Magnat Professional',
      titleEn: 'Magnat Professional',
      description: 'Magnat Professional',
      descriptionEn: 'Magnat Professional',
      priority: 1,
    },
    '/portfolio': {
      title: 'Портфолио | Magnat Professional',
      titleEn: 'Portfolio | Magnat Professional',
      description: 'Портфолио Magnat Professional',
      descriptionEn: 'Magnat Professional portfolio',
      priority: 0.9,
    },
    '/about': {
      title: 'О нас | Magnat Professional',
      titleEn: 'About us | Magnat Professional',
      description: 'О компании Magnat Professional',
      descriptionEn: 'About Magnat Professional',
      priority: 0.8,
    },
    '/contacts': {
      title: 'Контакты | Magnat Professional',
      titleEn: 'Contacts | Magnat Professional',
      description: 'Контакты Magnat Professional',
      descriptionEn: 'Magnat Professional contacts',
      priority: 0.8,
    },
    '/privacy': {
      title: 'Политика обработки персональных данных | Magnat Professional',
      titleEn: 'Privacy policy | Magnat Professional',
      description: 'Политика обработки персональных данных Magnat Professional',
      descriptionEn: 'Magnat Professional privacy policy',
      priority: 0.3,
    },
  }
  const entry = entries[path] || entries['/']

  return {
    id: `fallback-${path}`,
    scope: 'page',
    path,
    title: entry.title,
    titleEn: entry.titleEn,
    description: entry.description,
    descriptionEn: entry.descriptionEn,
    keywords: null,
    keywordsEn: null,
    hashtags: null,
    hashtagsEn: null,
    ogTitle: null,
    ogTitleEn: null,
    ogDescription: null,
    ogDescriptionEn: null,
    ogImageUrl: null,
    canonicalPath: path,
    robots: 'index,follow',
    priority: entry.priority,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    structuredData: null,
    metrics: null,
    createdAt: null,
    updatedAt: null,
  }
}

function seoEntryFromDatabase(entry) {
  return {
    id: entry.id,
    scope: entry.scope,
    path: entry.path,
    title: entry.title,
    titleEn: entry.title_en,
    description: entry.description,
    descriptionEn: entry.description_en,
    keywords: entry.keywords,
    keywordsEn: entry.keywords_en,
    hashtags: entry.hashtags,
    hashtagsEn: entry.hashtags_en,
    ogTitle: entry.og_title,
    ogTitleEn: entry.og_title_en,
    ogDescription: entry.og_description,
    ogDescriptionEn: entry.og_description_en,
    ogImageUrl: entry.og_image_url,
    canonicalPath: entry.canonical_path,
    robots: entry.robots,
    priority: entry.priority === null || entry.priority === undefined ? null : Number(entry.priority),
    changeFrequency: entry.change_frequency,
    structuredData: entry.structured_data ? JSON.stringify(entry.structured_data, null, 2) : null,
    metrics: entry.metrics ? JSON.stringify(entry.metrics, null, 2) : null,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }
}

function seoEntryToDatabase(entry) {
  const path = normalizeSeoPath(entry.path || '/')
  const title = String(entry.title || '').trim()
  const allowedScopes = new Set(['page', 'group', 'case', 'element', 'custom'])
  const allowedChangeFrequency = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
  const scope = allowedScopes.has(entry.scope) ? entry.scope : 'page'
  const changeFrequency = allowedChangeFrequency.has(entry.changeFrequency) ? entry.changeFrequency : 'weekly'

  if (!title) {
    const error = new Error('Title is required')
    error.status = 400
    throw error
  }

  return {
    scope,
    path,
    title,
    title_en: normalizeOptionalText(entry.titleEn),
    description: normalizeOptionalText(entry.description),
    description_en: normalizeOptionalText(entry.descriptionEn),
    keywords: normalizeOptionalText(entry.keywords),
    keywords_en: normalizeOptionalText(entry.keywordsEn),
    hashtags: normalizeOptionalText(entry.hashtags),
    hashtags_en: normalizeOptionalText(entry.hashtagsEn),
    og_title: normalizeOptionalText(entry.ogTitle),
    og_title_en: normalizeOptionalText(entry.ogTitleEn),
    og_description: normalizeOptionalText(entry.ogDescription),
    og_description_en: normalizeOptionalText(entry.ogDescriptionEn),
    og_image_url: normalizeOptionalSeoUrl(entry.ogImageUrl),
    canonical_path: entry.canonicalPath ? normalizeSeoPath(entry.canonicalPath) : path,
    robots: normalizeOptionalText(entry.robots) || 'index,follow',
    priority: clampNumber(entry.priority, 0, 1, 0.5),
    change_frequency: changeFrequency,
    structured_data: parseOptionalJson(entry.structuredData, 'Structured data JSON-LD'),
    metrics: parseOptionalJson(entry.metrics, 'Metrics JSON'),
  }
}

function portfolioSlugsFromPath(path) {
  const parts = normalizeSeoPath(path).split('/').filter(Boolean)

  if (parts[0] !== 'portfolio') {
    return []
  }

  return [parts[1], parts[2]]
}

function normalizeSeoPath(path) {
  const rawPath = String(path || '/').trim().split('?')[0].split('#')[0] || '/'
  const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`

  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : '/'
}

function parseOptionalJson(value, label) {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return null
  }

  try {
    return JSON.parse(normalized)
  } catch (_error) {
    const error = new Error(`${label} must be valid JSON`)
    error.status = 400
    throw error
  }
}

function requestOrigin(req) {
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http'
  const host = req.get('x-forwarded-host') || req.get('host') || `localhost:${PORT}`

  return `${protocol}://${host}`
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeOptionalSeoUrl(value) {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('/') || /^https?:\/\//i.test(normalized)) {
    return normalized
  }

  return `https://${normalized}`
}

function panelFromDatabase(panel, options = {}) {
  return {
    id: panel.id,
    title: panel.title,
    titleEn: panel.title_en,
    slug: panel.slug || slugify(panel.title),
    detailText: panel.detail_text || '',
    detailTextEn: panel.detail_text_en,
    mascotPath: panel.mascot_path,
    mascotUrl: storageUrl(panel.mascot_url, panel.mascot_path, SUPABASE_PORTFOLIO_BUCKET, options),
    sortOrder: panel.sort_order,
    gradientFromColor: panel.gradient_from_color,
    gradientFromOpacity: Number(panel.gradient_from_opacity),
    gradientToColor: panel.gradient_to_color,
    gradientToOpacity: Number(panel.gradient_to_opacity),
    gradientToPosition: panel.gradient_to_position,
    imagePath: panel.image_path,
    imageUrl: storageUrl(panel.image_url, panel.image_path, SUPABASE_HOME_PANELS_BUCKET, options),
    videoPath: panel.video_path,
    videoUrl: storageUrl(panel.video_url, panel.video_path, SUPABASE_HOME_PANELS_BUCKET, options),
    posterPath: panel.poster_path,
    posterUrl: storageUrl(panel.poster_url, panel.poster_path, SUPABASE_HOME_PANELS_BUCKET, options),
    linkPath: `/portfolio/${panel.slug || slugify(panel.title)}/`,
    tileType: panel.tile_type,
    createdAt: panel.created_at,
    updatedAt: panel.updated_at,
  }
}

function panelToDatabase(panel) {
  const title = String(panel.title || '').trim()
  const slug = normalizeSlug(panel.slug || title)
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
    slug,
    detail_text: String(panel.detailText || '').trim(),
    detail_text_en: normalizeOptionalText(panel.detailTextEn),
    mascot_path: panel.mascotPath || null,
    mascot_url: publicStorageUrl(panel.mascotUrl, panel.mascotPath, SUPABASE_PORTFOLIO_BUCKET),
    sort_order: sortOrder,
    gradient_from_color: gradientFromColor,
    gradient_from_opacity: gradientFromOpacity,
    gradient_to_color: gradientToColor,
    gradient_to_opacity: gradientToOpacity,
    gradient_to_position: gradientToPosition,
    image_path: panel.imagePath || null,
    image_url: publicStorageUrl(panel.imageUrl, panel.imagePath, SUPABASE_HOME_PANELS_BUCKET),
    video_path: panel.videoPath || null,
    video_url: publicStorageUrl(panel.videoUrl, panel.videoPath, SUPABASE_HOME_PANELS_BUCKET),
    poster_path: panel.posterPath || null,
    poster_url: publicStorageUrl(panel.posterUrl, panel.posterPath, SUPABASE_HOME_PANELS_BUCKET),
    link_path: `/portfolio/${slug}/`,
    tile_type: tileType,
  }
}

function portfolioCardFromDatabase(card, panelSlug, options = {}) {
  const slug = card.slug || slugify(card.title)

  return {
    id: card.id,
    panelId: card.panel_id,
    title: card.title,
    titleEn: card.title_en,
    slug,
    sortOrder: card.sort_order,
    gradientFromColor: card.gradient_from_color,
    gradientFromOpacity: Number(card.gradient_from_opacity),
    gradientToColor: card.gradient_to_color,
    gradientToOpacity: Number(card.gradient_to_opacity),
    gradientToPosition: card.gradient_to_position,
    imagePath: card.image_path,
    imageUrl: storageUrl(card.image_url, card.image_path, SUPABASE_PORTFOLIO_BUCKET, options),
    videoPath: card.video_path,
    videoUrl: storageUrl(card.video_url, card.video_path, SUPABASE_PORTFOLIO_BUCKET, options),
    posterPath: card.poster_path,
    posterUrl: storageUrl(card.poster_url, card.poster_path, SUPABASE_PORTFOLIO_BUCKET, options),
    caseHeroPath: card.case_hero_path,
    caseHeroUrl: storageUrl(card.case_hero_url, card.case_hero_path, SUPABASE_PORTFOLIO_BUCKET, options),
    linkPath: `/portfolio/${panelSlug}/${slug}/`,
    tileType: card.tile_type,
    articleBlocks: Array.isArray(card.articleBlocks)
      ? normalizeArticleBlocks(card.articleBlocks, options)
      : normalizeArticleBlocks(card.article_blocks, options),
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  }
}

function portfolioCardToDatabase(card, panel) {
  const title = String(card.title || '').trim()
  const slug = normalizeSlug(card.slug || title)
  const tileType = card.tileType === 'wide' ? 'wide' : 'vertical'
  const sortOrder = Number.isFinite(Number(card.sortOrder)) ? Number(card.sortOrder) : 0
  const gradientFromColor = normalizeHexColor(card.gradientFromColor, '#DA2128')
  const gradientFromOpacity = clampNumber(card.gradientFromOpacity, 0, 1, 1)
  const gradientToColor = normalizeHexColor(card.gradientToColor, '#DA2128')
  const gradientToOpacity = clampNumber(card.gradientToOpacity, 0, 1, 0)
  const gradientToPosition = Math.round(clampNumber(card.gradientToPosition, 0, 100, 70))

  if (!title) {
    const error = new Error('Title is required')
    error.status = 400
    throw error
  }

  const payload = {
    panel_id: panel.id,
    title,
    title_en: normalizeOptionalText(card.titleEn),
    slug,
    sort_order: sortOrder,
    gradient_from_color: gradientFromColor,
    gradient_from_opacity: gradientFromOpacity,
    gradient_to_color: gradientToColor,
    gradient_to_opacity: gradientToOpacity,
    gradient_to_position: gradientToPosition,
    image_path: card.imagePath || null,
    image_url: publicStorageUrl(card.imageUrl, card.imagePath, SUPABASE_PORTFOLIO_BUCKET),
    video_path: card.videoPath || null,
    video_url: publicStorageUrl(card.videoUrl, card.videoPath, SUPABASE_PORTFOLIO_BUCKET),
    poster_path: card.posterPath || null,
    poster_url: publicStorageUrl(card.posterUrl, card.posterPath, SUPABASE_PORTFOLIO_BUCKET),
    tile_type: tileType,
    article_blocks: normalizeArticleBlocks(card.articleBlocks, { proxyMedia: false }),
  }

  if (Object.prototype.hasOwnProperty.call(card, 'caseHeroPath')) {
    payload.case_hero_path = card.caseHeroPath || null
  }

  if (Object.prototype.hasOwnProperty.call(card, 'caseHeroUrl')) {
    payload.case_hero_url = publicStorageUrl(card.caseHeroUrl, card.caseHeroPath, SUPABASE_PORTFOLIO_BUCKET)
  }

  return payload
}

async function getPanelById(panelId) {
  const { data, error } = await supabase
    .from('home_panels')
    .select('*')
    .eq('id', panelId)
    .single()

  if (error) {
    throw error
  }

  return data
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

async function getDescriptionContent(options = {}) {
  const { data, error } = await supabase
    .from('description_content')
    .select('*')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return descriptionFromDatabase(data, options)
}

function descriptionFromDatabase(content, options = {}) {
  return {
    text: content?.text || '',
    textEn: content?.text_en || null,
    cardText: content?.card_text || '',
    cardTextEn: content?.card_text_en || null,
    desktopPlaquePath: content?.desktop_plaque_path || null,
    desktopPlaqueUrl: storageUrl(content?.desktop_plaque_url, content?.desktop_plaque_path, 'description', options),
    tabletPlaquePath: content?.tablet_plaque_path || null,
    tabletPlaqueUrl: storageUrl(content?.tablet_plaque_url, content?.tablet_plaque_path, 'description', options),
    mobilePlaquePath: content?.mobile_plaque_path || null,
    mobilePlaqueUrl: storageUrl(content?.mobile_plaque_url, content?.mobile_plaque_path, 'description', options),
    updatedAt: content?.updated_at || null,
  }
}

function descriptionToDatabase(content) {
  return {
    text: String(content.text || '').trim(),
    text_en: normalizeOptionalText(content.textEn),
    card_text: String(content.cardText || '').trim(),
    card_text_en: normalizeOptionalText(content.cardTextEn),
    desktop_plaque_path: content.desktopPlaquePath || null,
    desktop_plaque_url: publicStorageUrl(content.desktopPlaqueUrl, content.desktopPlaquePath, 'description'),
    tablet_plaque_path: content.tabletPlaquePath || null,
    tablet_plaque_url: publicStorageUrl(content.tabletPlaqueUrl, content.tabletPlaquePath, 'description'),
    mobile_plaque_path: content.mobilePlaquePath || null,
    mobile_plaque_url: publicStorageUrl(content.mobilePlaqueUrl, content.mobilePlaquePath, 'description'),
  }
}

function statsItemFromDatabase(item) {
  return {
    id: item.id,
    numberText: item.number_text,
    sortOrder: item.sort_order,
    text: item.text,
    textEn: item.text_en,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

function statsItemToDatabase(item) {
  const numberText = String(item.numberText || '').trim()
  const text = String(item.text || '').trim()
  const sortOrder = Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 0

  if (!numberText) {
    const error = new Error('Number is required')
    error.status = 400
    throw error
  }

  if (!text) {
    const error = new Error('Text is required')
    error.status = 400
    throw error
  }

  return {
    number_text: numberText,
    sort_order: sortOrder,
    text,
    text_en: normalizeOptionalText(item.textEn),
  }
}

async function getDirectorTextContent(options = {}) {
  const { data, error } = await supabase
    .from('director_text_content')
    .select('*')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return directorTextFromDatabase(data, options)
}

function directorTextFromDatabase(content, options = {}) {
  return {
    text: content?.text || '',
    textEn: content?.text_en || null,
    photoPath: content?.photo_path || null,
    photoUrl: storageUrl(content?.photo_url, content?.photo_path, 'director-text', options),
    thumbnailPath: content?.thumbnail_path || null,
    thumbnailUrl: storageUrl(content?.thumbnail_url, content?.thumbnail_path, 'director-text', options),
    name: content?.name || '',
    nameEn: content?.name_en || null,
    position: content?.position || '',
    positionEn: content?.position_en || null,
    updatedAt: content?.updated_at || null,
  }
}

function directorTextToDatabase(content) {
  return {
    text: String(content.text || '').trim(),
    text_en: normalizeOptionalText(content.textEn),
    photo_path: content.photoPath || null,
    photo_url: publicStorageUrl(content.photoUrl, content.photoPath, 'director-text'),
    thumbnail_path: content.thumbnailPath || null,
    thumbnail_url: publicStorageUrl(content.thumbnailUrl, content.thumbnailPath, 'director-text'),
    name: String(content.name || '').trim(),
    name_en: normalizeOptionalText(content.nameEn),
    position: String(content.position || '').trim(),
    position_en: normalizeOptionalText(content.positionEn),
  }
}

function hystoryCompanyItemFromDatabase(item) {
  return {
    id: item.id,
    year: item.year,
    sortOrder: item.sort_order,
    title: item.title,
    titleEn: item.title_en,
    text: item.text,
    textEn: item.text_en,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

function hystoryCompanyItemToDatabase(item) {
  const year = String(item.year || '').trim()
  const title = String(item.title || '').trim()
  const text = String(item.text || '').trim()
  const sortOrder = Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 0

  if (!year) {
    const error = new Error('Year is required')
    error.status = 400
    throw error
  }

  if (!title) {
    const error = new Error('Title is required')
    error.status = 400
    throw error
  }

  if (!text) {
    const error = new Error('Text is required')
    error.status = 400
    throw error
  }

  return {
    year,
    sort_order: sortOrder,
    title,
    title_en: normalizeOptionalText(item.titleEn),
    text,
    text_en: normalizeOptionalText(item.textEn),
  }
}

function normalizePrivacyTableRows(rows) {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row) => ({
      left: String(row?.left || '').trim(),
      right: String(row?.right || '').trim(),
    }))
    .filter((row) => row.left || row.right)
}

function privacyBlockFromDatabase(block) {
  return {
    id: block.id,
    type: block.block_type,
    sortOrder: block.sort_order,
    title: block.title,
    titleEn: block.title_en,
    text: block.text,
    textEn: block.text_en,
    tableRows: Array.isArray(block.table_rows) ? block.table_rows : [],
    tableRowsEn: Array.isArray(block.table_rows_en) ? block.table_rows_en : [],
    createdAt: block.created_at,
    updatedAt: block.updated_at,
  }
}

function privacyBlockToDatabase(block) {
  const type = block.type === 'table' ? 'table' : 'text'
  const title = String(block.title || '').trim()
  const text = String(block.text || '').trim()
  const tableRows = normalizePrivacyTableRows(block.tableRows)
  const sortOrder = Number.isFinite(Number(block.sortOrder)) ? Number(block.sortOrder) : 0

  if (!title) {
    const error = new Error('Title is required')
    error.status = 400
    throw error
  }

  if (type === 'text' && !text) {
    const error = new Error('Text is required')
    error.status = 400
    throw error
  }

  if (type === 'table' && tableRows.length === 0) {
    const error = new Error('Table rows are required')
    error.status = 400
    throw error
  }

  return {
    block_type: type,
    sort_order: sortOrder,
    title,
    title_en: normalizeOptionalText(block.titleEn),
    text,
    text_en: normalizeOptionalText(block.textEn),
    table_rows: tableRows,
    table_rows_en: normalizePrivacyTableRows(block.tableRowsEn),
  }
}

async function getMissionValuesContent() {
  const { data, error } = await supabase
    .from('mission_values_content')
    .select('*')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return missionValuesContentFromDatabase(data)
}

function missionValuesContentFromDatabase(content) {
  return {
    mainText: content?.main_text || '',
    mainTextEn: content?.main_text_en || null,
    mainTextHtml: content?.main_text_html || '',
    mainTextHtmlEn: content?.main_text_html_en || null,
    updatedAt: content?.updated_at || null,
  }
}

function missionValuesContentToDatabase(content) {
  return {
    main_text: plainTextFromHtml(content.mainTextHtml) || String(content.mainText || '').trim(),
    main_text_en: normalizeOptionalText(plainTextFromHtml(content.mainTextHtmlEn) || content.mainTextEn),
    main_text_html: normalizeRichText(content.mainTextHtml || content.mainText),
    main_text_html_en: normalizeOptionalText(normalizeRichText(content.mainTextHtmlEn || content.mainTextEn)),
  }
}

function missionValuesCardFromDatabase(card) {
  return {
    id: card.id,
    sortOrder: card.sort_order,
    title: card.title,
    titleEn: card.title_en,
    text: card.text,
    textEn: card.text_en,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  }
}

function missionValuesCardToDatabase(card) {
  const title = String(card.title || '').trim()
  const text = String(card.text || '').trim()
  const sortOrder = Number.isFinite(Number(card.sortOrder)) ? Number(card.sortOrder) : 0

  if (!title) {
    const error = new Error('Title is required')
    error.status = 400
    throw error
  }

  if (!text) {
    const error = new Error('Text is required')
    error.status = 400
    throw error
  }

  return {
    sort_order: sortOrder,
    title,
    title_en: normalizeOptionalText(card.titleEn),
    text,
    text_en: normalizeOptionalText(card.textEn),
  }
}

function clientItemFromDatabase(item, options = {}) {
  return {
    id: item.id,
    sortOrder: item.sort_order,
    imagePath: item.image_path,
    imageUrl: storageUrl(item.image_url, item.image_path, 'clients', options),
    linkUrl: item.link_url,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

function clientItemToDatabase(item) {
  const imageUrl = String(item.imageUrl || '').trim()
  const sortOrder = Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 0

  if (!imageUrl) {
    const error = new Error('Image is required')
    error.status = 400
    throw error
  }

  return {
    sort_order: sortOrder,
    image_path: item.imagePath || null,
    image_url: publicStorageUrl(imageUrl, item.imagePath, 'clients'),
    link_url: normalizeOptionalUrl(item.linkUrl),
  }
}

function projectRequestFromDatabase(request) {
  return {
    id: request.id,
    name: request.name,
    phone: request.phone,
    email: request.email,
    message: request.message,
    status: request.status,
    source: request.source,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  }
}

function projectRequestToDatabase(request) {
  const name = String(request.name || '').trim()
  const phone = String(request.phone || '').trim()
  const email = String(request.email || '').trim()
  const message = String(request.message || '').trim()

  if (!name) {
    const error = new Error('Name is required')
    error.status = 400
    throw error
  }

  if (!phone && !email) {
    const error = new Error('Phone or email is required')
    error.status = 400
    throw error
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Email is invalid')
    error.status = 400
    throw error
  }

  return {
    name,
    phone,
    email,
    message,
    status: 'new',
    source: String(request.source || 'project-form').trim().slice(0, 120) || 'project-form',
  }
}

function normalizeProjectRequestStatus(status) {
  const normalized = String(status || '').trim()

  if (['new', 'in_progress', 'closed'].includes(normalized)) {
    return normalized
  }

  const error = new Error('Request status is invalid')
  error.status = 400
  throw error
}

function escapePostgrestLike(value) {
  return String(value).replace(/[,%]/g, (character) => `\\${character}`)
}

async function sendProjectRequestNotification(request) {
  const transporter = getMailTransporter()

  if (!transporter) {
    console.warn('SMTP_HOST is not set, skipping project request email notification')
    return
  }

  await Promise.all([
    PROJECT_REQUEST_NOTIFY_EMAIL
      ? sendProjectRequestAdminNotification(transporter, request)
      : Promise.resolve(),
    request.email
      ? sendProjectRequestCustomerNotification(transporter, request)
      : Promise.resolve(),
  ])
}

async function sendProjectRequestAdminNotification(transporter, request) {
  const rows = [
    ['Имя', request.name],
    ['Телефон', request.phone || 'Не указан'],
    ['Email', request.email || 'Не указан'],
    ['Сообщение', request.message || 'Не указано'],
    ['Источник', request.source || 'project-form'],
    ['Дата', new Date(request.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })],
  ]

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER || `Magnat Professional <no-reply@${SMTP_HOST}>`,
    to: PROJECT_REQUEST_NOTIFY_EMAIL,
    subject: `Новая заявка с сайта Magnat Professional: ${request.name}`,
    text: rows.map(([label, value]) => `${label}: ${value}`).join('\n'),
    html: `
      <h2>Новая заявка с сайта Magnat Professional</h2>
      <table cellpadding="8" cellspacing="0" border="0">
        ${rows.map(([label, value]) => `
          <tr>
            <td><strong>${escapeHtml(label)}</strong></td>
            <td>${escapeHtml(value)}</td>
          </tr>
        `).join('')}
      </table>
    `,
  })
}

async function sendProjectRequestCustomerNotification(transporter, request) {
  const from = SMTP_FROM || SMTP_USER || `Magnat Professional <no-reply@${SMTP_HOST}>`
  const subject = 'Ваша заявка в Magnat Professional получена'
  const text = [
    `${request.name}, здравствуйте!`,
    '',
    'Спасибо за заявку. Мы получили ваше обращение и скоро свяжемся с вами.',
    '',
    'Ваши данные:',
    `Телефон: ${request.phone || 'Не указан'}`,
    `Email: ${request.email}`,
    `Сообщение: ${request.message || 'Не указано'}`,
    '',
    'Magnat Professional',
  ].join('\n')

  await transporter.sendMail({
    from,
    to: request.email,
    replyTo: PROJECT_REQUEST_NOTIFY_EMAIL || SMTP_USER || undefined,
    subject,
    text,
    html: `
      <h2>${escapeHtml(request.name)}, здравствуйте!</h2>
      <p>Спасибо за заявку. Мы получили ваше обращение и скоро свяжемся с вами.</p>
      <h3>Ваши данные</h3>
      <table cellpadding="8" cellspacing="0" border="0">
        <tr>
          <td><strong>Телефон</strong></td>
          <td>${escapeHtml(request.phone || 'Не указан')}</td>
        </tr>
        <tr>
          <td><strong>Email</strong></td>
          <td>${escapeHtml(request.email)}</td>
        </tr>
        <tr>
          <td><strong>Сообщение</strong></td>
          <td>${escapeHtml(request.message || 'Не указано')}</td>
        </tr>
      </table>
      <p>Magnat Professional</p>
    `,
  })
}

function getMailTransporter() {
  if (!SMTP_HOST) {
    return null
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER && SMTP_PASS
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS,
          }
        : undefined,
    })
  }

  return mailTransporter
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeRichText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

function plainTextFromHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeOptionalText(value) {
  const normalized = String(value || '').trim()
  return normalized || null
}

function normalizeOptionalUrl(value) {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return null
  }

  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`
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

function normalizeSlug(value) {
  const slug = slugify(value)

  if (!slug) {
    const error = new Error('Slug is required')
    error.status = 400
    throw error
  }

  return slug
}

function slugify(value) {
  const transliterated = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[а]/g, 'a')
    .replace(/[б]/g, 'b')
    .replace(/[в]/g, 'v')
    .replace(/[г]/g, 'g')
    .replace(/[д]/g, 'd')
    .replace(/[её]/g, 'e')
    .replace(/[ж]/g, 'zh')
    .replace(/[з]/g, 'z')
    .replace(/[и]/g, 'i')
    .replace(/[й]/g, 'y')
    .replace(/[к]/g, 'k')
    .replace(/[л]/g, 'l')
    .replace(/[м]/g, 'm')
    .replace(/[н]/g, 'n')
    .replace(/[о]/g, 'o')
    .replace(/[п]/g, 'p')
    .replace(/[р]/g, 'r')
    .replace(/[с]/g, 's')
    .replace(/[т]/g, 't')
    .replace(/[у]/g, 'u')
    .replace(/[ф]/g, 'f')
    .replace(/[х]/g, 'h')
    .replace(/[ц]/g, 'ts')
    .replace(/[ч]/g, 'ch')
    .replace(/[ш]/g, 'sh')
    .replace(/[щ]/g, 'sch')
    .replace(/[ъь]/g, '')
    .replace(/[ы]/g, 'y')
    .replace(/[э]/g, 'e')
    .replace(/[ю]/g, 'yu')
    .replace(/[я]/g, 'ya')

  return transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
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

async function ensureDatabaseSchema() {
  if (!POSTGRES_PASSWORD) {
    console.warn('POSTGRES_PASSWORD is not set, skipping database schema migration')
    return
  }

  const client = new PgClient({
    host: POSTGRES_HOST,
    port: Number(POSTGRES_PORT),
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
  })

  await client.connect()

  try {
    await client.query(`
      create extension if not exists "pgcrypto";

      alter table if exists public.home_panels
        add column if not exists slug text,
        add column if not exists detail_text text not null default '',
        add column if not exists detail_text_en text,
        add column if not exists mascot_path text,
        add column if not exists mascot_url text;

      update public.home_panels
      set slug = lower(regexp_replace(id::text, '[^a-zA-Z0-9]+', '-', 'g'))
      where slug is null or slug = '';

      alter table if exists public.home_panels
        alter column slug set not null;

      create unique index if not exists home_panels_slug_unique
        on public.home_panels (slug);

      create table if not exists public.portfolio_cards (
        id uuid primary key default gen_random_uuid(),
        panel_id uuid not null references public.home_panels(id) on delete cascade,
        title text not null,
        title_en text,
        slug text not null,
        sort_order integer not null default 0,
        gradient_from_color text not null default '#DA2128',
        gradient_from_opacity numeric(4, 3) not null default 1,
        gradient_to_color text not null default '#DA2128',
        gradient_to_opacity numeric(4, 3) not null default 0,
        gradient_to_position integer not null default 70,
        image_path text,
        image_url text,
        video_path text,
        video_url text,
        poster_path text,
        poster_url text,
        case_hero_path text,
        case_hero_url text,
        tile_type text not null default 'vertical',
        article_blocks jsonb not null default '[]'::jsonb,
        created_at timestamp with time zone not null default now(),
        updated_at timestamp with time zone not null default now(),
        constraint portfolio_cards_tile_type_check check (tile_type in ('wide', 'vertical')),
        constraint portfolio_cards_gradient_from_color_check check (gradient_from_color ~ '^#[0-9A-Fa-f]{6}$'),
        constraint portfolio_cards_gradient_to_color_check check (gradient_to_color ~ '^#[0-9A-Fa-f]{6}$'),
        constraint portfolio_cards_gradient_from_opacity_check check (gradient_from_opacity >= 0 and gradient_from_opacity <= 1),
        constraint portfolio_cards_gradient_to_opacity_check check (gradient_to_opacity >= 0 and gradient_to_opacity <= 1),
        constraint portfolio_cards_gradient_to_position_check check (gradient_to_position >= 0 and gradient_to_position <= 100)
      );

      create unique index if not exists portfolio_cards_panel_slug_unique
        on public.portfolio_cards (panel_id, slug);

      alter table if exists public.portfolio_cards
        add column if not exists article_blocks jsonb not null default '[]'::jsonb,
        add column if not exists case_hero_path text,
        add column if not exists case_hero_url text;

      create table if not exists public.portfolio_card_article_blocks (
        id uuid primary key default gen_random_uuid(),
        card_id uuid not null references public.portfolio_cards(id) on delete cascade,
        title text not null default '',
        title_en text,
        text text not null default '',
        text_en text,
        layout text not null default 'single-wide',
        images jsonb not null default '[]'::jsonb,
        sort_order integer not null default 0,
        created_at timestamp with time zone not null default now(),
        updated_at timestamp with time zone not null default now(),
        constraint portfolio_card_article_blocks_layout_check
          check (layout in ('single-wide', 'two-medium', 'three-vertical'))
      );

      create index if not exists portfolio_card_article_blocks_card_sort_idx
        on public.portfolio_card_article_blocks (card_id, sort_order, created_at);

      insert into public.portfolio_card_article_blocks (
        id,
        card_id,
        title,
        title_en,
        text,
        text_en,
        layout,
        images,
        sort_order
      )
      select
        case
          when block.value->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then (block.value->>'id')::uuid
          else gen_random_uuid()
        end,
        card.id,
        coalesce(block.value->>'title', ''),
        nullif(block.value->>'titleEn', ''),
        coalesce(block.value->>'text', ''),
        nullif(block.value->>'textEn', ''),
        case
          when block.value->>'layout' in ('single-wide', 'two-medium', 'three-vertical')
            then block.value->>'layout'
          else 'single-wide'
        end,
        coalesce(block.value->'images', '[]'::jsonb),
        coalesce((block.value->>'sortOrder')::integer, block.ordinality - 1)
      from public.portfolio_cards card
      cross join lateral jsonb_array_elements(card.article_blocks) with ordinality as block(value, ordinality)
      where jsonb_array_length(card.article_blocks) > 0
        and not exists (
          select 1
          from public.portfolio_card_article_blocks existing
          where existing.card_id = card.id
        );

      create or replace function public.set_portfolio_cards_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;

      drop trigger if exists set_portfolio_cards_updated_at on public.portfolio_cards;

      create trigger set_portfolio_cards_updated_at
      before update on public.portfolio_cards
      for each row
      execute function public.set_portfolio_cards_updated_at();

      create or replace function public.set_portfolio_card_article_blocks_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;

      drop trigger if exists set_portfolio_card_article_blocks_updated_at on public.portfolio_card_article_blocks;

      create trigger set_portfolio_card_article_blocks_updated_at
      before update on public.portfolio_card_article_blocks
      for each row
      execute function public.set_portfolio_card_article_blocks_updated_at();

      alter table public.portfolio_cards enable row level security;
      alter table public.portfolio_card_article_blocks enable row level security;

      drop policy if exists "Portfolio cards are publicly readable." on public.portfolio_cards;
      create policy "Portfolio cards are publicly readable."
        on public.portfolio_cards for select
        using (true);

      drop policy if exists "Portfolio card article blocks are publicly readable." on public.portfolio_card_article_blocks;
      create policy "Portfolio card article blocks are publicly readable."
        on public.portfolio_card_article_blocks for select
        using (true);

      create table if not exists public.seo_entries (
        id uuid primary key default gen_random_uuid(),
        scope text not null default 'page',
        path text not null,
        title text not null,
        title_en text,
        description text,
        description_en text,
        keywords text,
        keywords_en text,
        hashtags text,
        hashtags_en text,
        og_title text,
        og_title_en text,
        og_description text,
        og_description_en text,
        og_image_url text,
        canonical_path text,
        robots text not null default 'index,follow',
        priority numeric(2, 1) not null default 0.5,
        change_frequency text not null default 'weekly',
        structured_data jsonb,
        metrics jsonb,
        created_at timestamp with time zone not null default now(),
        updated_at timestamp with time zone not null default now(),
        constraint seo_entries_scope_check check (scope in ('page', 'group', 'case', 'element', 'custom')),
        constraint seo_entries_path_check check (
          path ~ '^/' and
          path !~ '^//' and
          path !~ '://'
        ),
        constraint seo_entries_canonical_path_check check (
          canonical_path is null or (
            canonical_path ~ '^/' and
            canonical_path !~ '^//' and
            canonical_path !~ '://'
          )
        ),
        constraint seo_entries_priority_check check (priority >= 0 and priority <= 1),
        constraint seo_entries_change_frequency_check check (
          change_frequency in ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')
        )
      );

      create unique index if not exists seo_entries_path_unique
        on public.seo_entries (path);

      create or replace function public.set_seo_entries_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;

      drop trigger if exists set_seo_entries_updated_at on public.seo_entries;

      create trigger set_seo_entries_updated_at
      before update on public.seo_entries
      for each row
      execute function public.set_seo_entries_updated_at();

      alter table public.seo_entries enable row level security;

      drop policy if exists "SEO entries are publicly readable." on public.seo_entries;
      create policy "SEO entries are publicly readable."
        on public.seo_entries for select
        using (true);

      insert into public.seo_entries (
        scope,
        path,
        title,
        title_en,
        description,
        description_en,
        canonical_path,
        robots,
        priority,
        change_frequency
      )
      values
        ('page', '/', 'Magnat Professional', 'Magnat Professional', 'Magnat Professional', 'Magnat Professional', '/', 'index,follow', 1, 'weekly'),
        ('page', '/portfolio', 'Портфолио | Magnat Professional', 'Portfolio | Magnat Professional', 'Портфолио Magnat Professional', 'Magnat Professional portfolio', '/portfolio', 'index,follow', 0.9, 'weekly'),
        ('page', '/about', 'О нас | Magnat Professional', 'About us | Magnat Professional', 'О компании Magnat Professional', 'About Magnat Professional', '/about', 'index,follow', 0.8, 'monthly'),
        ('page', '/contacts', 'Контакты | Magnat Professional', 'Contacts | Magnat Professional', 'Контакты Magnat Professional', 'Magnat Professional contacts', '/contacts', 'index,follow', 0.8, 'monthly'),
        ('page', '/privacy', 'Политика обработки персональных данных | Magnat Professional', 'Privacy policy | Magnat Professional', 'Политика обработки персональных данных Magnat Professional', 'Magnat Professional privacy policy', '/privacy', 'index,follow', 0.3, 'yearly')
      on conflict (path) do nothing;

      create table if not exists public.privacy_blocks (
        id uuid primary key default gen_random_uuid(),
        block_type text not null default 'text',
        sort_order integer not null default 0,
        title text not null,
        title_en text,
        text text not null default '',
        text_en text,
        table_rows jsonb not null default '[]'::jsonb,
        table_rows_en jsonb not null default '[]'::jsonb,
        created_at timestamp with time zone not null default now(),
        updated_at timestamp with time zone not null default now(),
        constraint privacy_blocks_type_check check (block_type in ('text', 'table'))
      );

      create or replace function public.set_privacy_blocks_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;

      drop trigger if exists set_privacy_blocks_updated_at on public.privacy_blocks;

      create trigger set_privacy_blocks_updated_at
      before update on public.privacy_blocks
      for each row
      execute function public.set_privacy_blocks_updated_at();

      alter table public.privacy_blocks enable row level security;

      drop policy if exists "Privacy blocks are publicly readable." on public.privacy_blocks;
      create policy "Privacy blocks are publicly readable."
        on public.privacy_blocks for select
        using (true);

      create table if not exists public.project_requests (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        phone text not null default '',
        email text not null default '',
        message text not null default '',
        status text not null default 'new',
        source text not null default 'project-form',
        created_at timestamp with time zone not null default now(),
        updated_at timestamp with time zone not null default now(),
        constraint project_requests_status_check check (status in ('new', 'in_progress', 'closed')),
        constraint project_requests_contact_check check (phone <> '' or email <> '')
      );

      create index if not exists project_requests_status_created_idx
        on public.project_requests (status, created_at desc);

      create or replace function public.set_project_requests_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;

      drop trigger if exists set_project_requests_updated_at on public.project_requests;

      create trigger set_project_requests_updated_at
      before update on public.project_requests
      for each row
      execute function public.set_project_requests_updated_at();

      alter table public.project_requests enable row level security;
    `)

    const { rows: panels } = await client.query('select id, title, slug from public.home_panels order by created_at asc')
    const usedSlugs = new Set()

    for (const panel of panels) {
      let nextSlug = slugify(panel.title) || String(panel.id)
      const baseSlug = nextSlug
      let index = 2

      while (usedSlugs.has(nextSlug)) {
        nextSlug = `${baseSlug}-${index}`
        index += 1
      }

      usedSlugs.add(nextSlug)

      if (panel.slug !== nextSlug) {
        await client.query('update public.home_panels set slug = $1 where id = $2', [nextSlug, panel.id])
      }
    }
  } finally {
    await client.end()
  }
}

ensureDatabaseSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on http://0.0.0.0:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to prepare database schema', error)
    process.exit(1)
  })
