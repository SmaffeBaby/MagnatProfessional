import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
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
  SUPABASE_BUCKET_FILE_SIZE_LIMIT = String(50 * 1024 * 1024),
  SUPABASE_STORAGE_PUBLIC = 'true',
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

    const cards = await attachArticleBlocksToCards(data)

    res.json({
      cards: cards.map((card) => portfolioCardFromDatabase(card, panel.slug)),
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
      ? await savePortfolioCardArticleBlocks(data.id, req.body.articleBlocks)
      : []

    res.status(201).json({
      card: portfolioCardFromDatabase({ ...data, articleBlocks }, panel.slug),
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
      ? await savePortfolioCardArticleBlocks(data.id, req.body.articleBlocks)
      : (await attachArticleBlocksToCards([data]))[0]?.articleBlocks || []

    res.json({
      card: portfolioCardFromDatabase({ ...data, articleBlocks }, panel.slug),
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
    const content = await getDescriptionContent()
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

    res.json({ content: descriptionFromDatabase(data) })
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
    const content = await getDirectorTextContent()
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

    res.json({ content: directorTextFromDatabase(data) })
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
      items: data.map(clientItemFromDatabase),
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

    res.status(201).json({ item: clientItemFromDatabase(data) })
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

    res.json({ item: clientItemFromDatabase(data) })
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

function normalizeArticleBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return []
  }

  return blocks.map((block, blockIndex) => {
    const layout = ['single-wide', 'two-medium', 'three-vertical'].includes(block?.layout)
      ? block.layout
      : 'single-wide'
    const imageGroups = normalizeArticleImageGroups(block, layout)
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

function normalizeArticleImages(images) {
  if (!Array.isArray(images)) {
    return []
  }

  return images
    .map((image, imageIndex) => ({
      id: String(image?.id || crypto.randomUUID()),
      path: image?.path || null,
      url: String(image?.url || '').trim(),
      alt: String(image?.alt || '').trim(),
      sortOrder: imageIndex,
    }))
    .filter((image) => image.url)
}

function normalizeArticleImageGroups(block, fallbackLayout = 'single-wide') {
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
          images: normalizeArticleImages(group?.images),
          sortOrder: groupIndex,
        }
      })
      .filter((group) => group.images.length > 0 || group.layout)
  }

  const images = normalizeArticleImages(block?.images)

  return images.length > 0
    ? [{
        id: String(block?.imageGroupId || crypto.randomUUID()),
        layout: fallbackLayout,
        images,
        sortOrder: 0,
      }]
    : []
}

function articleBlockFromDatabase(block) {
  const normalizedBlock = normalizeArticleBlocks([{ layout: block.layout, images: block.images || [] }])[0]

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
  const normalized = normalizeArticleBlocks([block])[0]

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

async function attachArticleBlocksToCards(cards) {
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
    blocks.push(articleBlockFromDatabase(block))
    blocksByCardId.set(block.card_id, blocks)
  }

  return cards.map((card) => {
    const tableBlocks = blocksByCardId.get(card.id)

    return {
      ...card,
      articleBlocks: tableBlocks && tableBlocks.length > 0
        ? tableBlocks
        : normalizeArticleBlocks(card.article_blocks),
    }
  })
}

async function savePortfolioCardArticleBlocks(cardId, blocks) {
  const normalizedBlocks = normalizeArticleBlocks(blocks)

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

  return data.map(articleBlockFromDatabase)
}

function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function panelFromDatabase(panel) {
  return {
    id: panel.id,
    title: panel.title,
    titleEn: panel.title_en,
    slug: panel.slug || slugify(panel.title),
    detailText: panel.detail_text || '',
    detailTextEn: panel.detail_text_en,
    mascotPath: panel.mascot_path,
    mascotUrl: panel.mascot_url,
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
    mascot_url: panel.mascotUrl || null,
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
    link_path: `/portfolio/${slug}/`,
    tile_type: tileType,
  }
}

function portfolioCardFromDatabase(card, panelSlug) {
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
    imageUrl: card.image_url,
    videoPath: card.video_path,
    videoUrl: card.video_url,
    posterPath: card.poster_path,
    posterUrl: card.poster_url,
    caseHeroPath: card.case_hero_path,
    caseHeroUrl: card.case_hero_url,
    linkPath: `/portfolio/${panelSlug}/${slug}/`,
    tileType: card.tile_type,
    articleBlocks: Array.isArray(card.articleBlocks)
      ? normalizeArticleBlocks(card.articleBlocks)
      : normalizeArticleBlocks(card.article_blocks),
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
    image_url: card.imageUrl || null,
    video_path: card.videoPath || null,
    video_url: card.videoUrl || null,
    poster_path: card.posterPath || null,
    poster_url: card.posterUrl || null,
    tile_type: tileType,
    article_blocks: normalizeArticleBlocks(card.articleBlocks),
  }

  if (Object.prototype.hasOwnProperty.call(card, 'caseHeroPath')) {
    payload.case_hero_path = card.caseHeroPath || null
  }

  if (Object.prototype.hasOwnProperty.call(card, 'caseHeroUrl')) {
    payload.case_hero_url = card.caseHeroUrl || null
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

async function getDescriptionContent() {
  const { data, error } = await supabase
    .from('description_content')
    .select('*')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return descriptionFromDatabase(data)
}

function descriptionFromDatabase(content) {
  return {
    text: content?.text || '',
    textEn: content?.text_en || null,
    cardText: content?.card_text || '',
    cardTextEn: content?.card_text_en || null,
    desktopPlaquePath: content?.desktop_plaque_path || null,
    desktopPlaqueUrl: content?.desktop_plaque_url || null,
    tabletPlaquePath: content?.tablet_plaque_path || null,
    tabletPlaqueUrl: content?.tablet_plaque_url || null,
    mobilePlaquePath: content?.mobile_plaque_path || null,
    mobilePlaqueUrl: content?.mobile_plaque_url || null,
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
    desktop_plaque_url: content.desktopPlaqueUrl || null,
    tablet_plaque_path: content.tabletPlaquePath || null,
    tablet_plaque_url: content.tabletPlaqueUrl || null,
    mobile_plaque_path: content.mobilePlaquePath || null,
    mobile_plaque_url: content.mobilePlaqueUrl || null,
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

async function getDirectorTextContent() {
  const { data, error } = await supabase
    .from('director_text_content')
    .select('*')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return directorTextFromDatabase(data)
}

function directorTextFromDatabase(content) {
  return {
    text: content?.text || '',
    textEn: content?.text_en || null,
    photoPath: content?.photo_path || null,
    photoUrl: content?.photo_url || null,
    thumbnailPath: content?.thumbnail_path || null,
    thumbnailUrl: content?.thumbnail_url || null,
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
    photo_url: content.photoUrl || null,
    thumbnail_path: content.thumbnailPath || null,
    thumbnail_url: content.thumbnailUrl || null,
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

function clientItemFromDatabase(item) {
  return {
    id: item.id,
    sortOrder: item.sort_order,
    imagePath: item.image_path,
    imageUrl: item.image_url,
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
    image_url: imageUrl,
    link_url: normalizeOptionalUrl(item.linkUrl),
  }
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
