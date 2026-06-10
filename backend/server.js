import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const SHOPIFY_API_VERSION = '2024-10'
const SHOPIFY_TEST_API_VERSION = '2025-01'
const SHOPIFY_SCOPES = 'read_products,read_inventory,write_inventory,read_locations'
const FRONTEND_URL = 'http://localhost:5173'
const BACKEND_URL = 'https://accessing-trainers-soviet-dis.trycloudflare.com'
const persistedConfigPath = path.join(process.cwd(), '.shopify-config.json')
const runtimeShopifyConfig = loadPersistedShopifyConfig()
const oauthStateStore = new Map()

app.use(cors({ origin: true }))
app.use(express.json())

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ success: false, error: 'Invalid JSON payload.' })
  }

  return next(error)
})

function normalizeStoreUrl(storeUrl) {
  if (!storeUrl) {
    return ''
  }

  const trimmedStoreUrl = storeUrl.trim().replace(/\/+$/, '')

  if (/^https?:\/\//i.test(trimmedStoreUrl)) {
    return trimmedStoreUrl
  }

  return `https://${trimmedStoreUrl}`
}

function normalizeShopDomain(shop) {
  if (!shop) {
    return ''
  }

  const trimmedShop = shop.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  return trimmedShop.split('/')[0]
}

function isPlaceholderValue(value) {
  if (typeof value !== 'string') {
    return false
  }

  const trimmedValue = value.trim().toLowerCase()
  return !trimmedValue || ['your-shopify-store', 'your-admin-api-token', 'your-access-token', 'your-api-key', 'your-api-secret', 'placeholder', 'changeme'].some((candidate) => trimmedValue.includes(candidate))
}

function loadPersistedShopifyConfig() {
  try {
    if (fs.existsSync(persistedConfigPath)) {
      const data = JSON.parse(fs.readFileSync(persistedConfigPath, 'utf8'))
      return {
        shop: data.shop || '',
        accessToken: data.accessToken || '',
      }
    }
  } catch (error) {
    console.error('Unable to load Shopify config from disk:', error.message)
  }

  return {
    shop: '',
    accessToken: '',
  }
}

function persistShopifyConfig() {
  try {
    fs.writeFileSync(persistedConfigPath, JSON.stringify(runtimeShopifyConfig, null, 2))
  } catch (error) {
    console.error('Unable to persist Shopify config:', error.message)
  }
}

function buildRedirectTarget(pathname) {
  return `${FRONTEND_URL}${pathname}`
}

function getShopifyConfig() {
  const storeUrl = process.env.SHOPIFY_STORE_URL?.trim() || runtimeShopifyConfig.shop
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN?.trim() || process.env.SHOPIFY_OAUTH_ACCESS_TOKEN?.trim() || runtimeShopifyConfig.accessToken
  const isConfigured = Boolean(storeUrl && accessToken && !isPlaceholderValue(storeUrl) && !isPlaceholderValue(accessToken))

  return {
    storeUrl,
    accessToken,
    isConfigured,
  }
}

function getShopifyBaseUrl() {
  const { storeUrl, isConfigured } = getShopifyConfig()

  if (!isConfigured) {
    throw new Error('Shopify access token missing. Please install the app first.')
  }

  return normalizeStoreUrl(storeUrl)
}

function getShopifyHeaders() {
  const { accessToken, isConfigured } = getShopifyConfig()

  if (!isConfigured) {
    throw new Error('Shopify access token missing. Please install the app first.')
  }

  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken,
  }
}

function buildProductPayload(product, variant) {
  return {
    productId: product.id,
    variantId: variant.id,
    inventoryItemId: variant.inventory_item_id,
    sku: variant.sku || '',
    title: product.title || '',
    price: variant.price || '0',
    inventoryQuantity: variant.inventory_quantity ?? 0,
    imageUrl: product.images?.[0]?.src || '',
    handle: product.handle || '',
  }
}

async function fetchShopifyJson(url, options = {}) {
  const response = await fetch(url, options)

  if (!response.ok) {
    let responseBody = ''

    try {
      responseBody = await response.text()
    } catch {
      responseBody = ''
    }

    console.error('[Shopify API Error]', {
      statusCode: response.status,
      responseBody,
      url,
    })
  }

  return response
}

function verifyShopifyHmac(params, secret) {
  const { hmac, ...rest } = params

  if (!hmac || !secret) {
    return false
  }

  const sortedEntries = Object.entries(rest)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))

  const message = sortedEntries.map(([key, value]) => `${key}=${value}`).join('&')
  const expectedHmac = crypto.createHmac('sha256', secret).update(message).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(hmac))
}

app.post('/api/shopify/config', (req, res) => {
  const { shop, accessToken } = req.body || {}

  if (!shop || !accessToken) {
    return res.status(400).json({ success: false, error: 'shop and accessToken are required.' })
  }

  runtimeShopifyConfig.shop = normalizeShopDomain(String(shop))
  runtimeShopifyConfig.accessToken = String(accessToken).trim()
  persistShopifyConfig()

  return res.json({ success: true, shopifyConfigured: true })
})

app.get('/api/shopify/install', (_req, res) => {
  const shop = normalizeShopDomain(_req.query.shop)
  const apiKey = process.env.SHOPIFY_API_KEY?.trim()
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim()

  if (!shop) {
    return res.status(400).send('Shop is required.')
  }

  if (!apiKey || !apiSecret || isPlaceholderValue(apiKey) || isPlaceholderValue(apiSecret)) {
    return res.status(500).send('Shopify API key and secret are missing from backend/.env')
  }

  const state = crypto.randomBytes(16).toString('hex')
  oauthStateStore.set(state, { shop, createdAt: Date.now() })
  const redirectUri = encodeURIComponent(`${BACKEND_URL}/api/shopify/callback`)
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(apiKey)}&scope=${encodeURIComponent(SHOPIFY_SCOPES)}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}`

  return res.redirect(installUrl)
})

app.get('/api/shopify/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query
  const apiKey = process.env.SHOPIFY_API_KEY?.trim()
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim()
  const normalizedShop = normalizeShopDomain(shop)
  const stateRecord = oauthStateStore.get(state)

  if (!normalizedShop || !code || !state || !stateRecord || stateRecord.shop !== normalizedShop) {
    return res.redirect(`${buildRedirectTarget('/settings')}?shopify=error&message=${encodeURIComponent('Invalid OAuth state.')}`)
  }

  if (!verifyShopifyHmac(req.query, apiSecret)) {
    return res.redirect(`${buildRedirectTarget('/settings')}?shopify=error&message=${encodeURIComponent('Invalid Shopify HMAC.')}`)
  }

  try {
    const tokenResponse = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${body}`)
    }

    const payload = await tokenResponse.json()
    const accessToken = payload.access_token

    if (!accessToken) {
      throw new Error('Shopify did not return an access token.')
    }

    runtimeShopifyConfig.shop = normalizedShop
    runtimeShopifyConfig.accessToken = accessToken
    persistShopifyConfig()
    oauthStateStore.delete(state)

    return res.redirect(`${buildRedirectTarget('/settings')}?shopify=connected`)
  } catch (error) {
    console.error('Shopify OAuth callback failed:', error.message)
    return res.redirect(`${buildRedirectTarget('/settings')}?shopify=error&message=${encodeURIComponent(error.message)}`)
  }
})

app.get('/api/health', (_req, res) => {
  const { isConfigured } = getShopifyConfig()

  if (!isConfigured) {
    return res.status(503).json({
      status: 'error',
      shopifyConfigured: false,
      message: 'Shopify app not installed yet. Start the OAuth install flow from Settings.',
    })
  }

  return res.json({
    status: 'ok',
    shopifyConfigured: true,
  })
})

app.get('/health', (_req, res) => {
  const { isConfigured } = getShopifyConfig()

  if (!isConfigured) {
    return res.status(503).json({
      status: 'error',
      shopifyConfigured: false,
      message: 'Shopify app not installed yet. Start the OAuth install flow from Settings.',
    })
  }

  return res.json({ status: 'ok', shopifyConfigured: true })
})

app.get('/api/test-shopify', async (_req, res) => {
  try {
    const baseUrl = getShopifyBaseUrl()
    const headers = getShopifyHeaders()
    const response = await fetchShopifyJson(`${baseUrl}/admin/api/${SHOPIFY_TEST_API_VERSION}/shop.json`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const message = `Shopify test request failed with ${response.status}`
      return res.status(response.status).json({
        success: false,
        statusCode: response.status,
        error: message,
      })
    }

    const payload = await response.json()
    const shopName = payload?.shop?.name || payload?.shop?.domain || ''

    return res.json({
      success: true,
      shopName,
    })
  } catch (error) {
    console.error('Shopify test request failed:', error.message)
    return res.status(502).json({
      success: false,
      error: error.message,
    })
  }
})

app.get('/api/products', async (_req, res) => {
  try {
    const baseUrl = getShopifyBaseUrl()
    const headers = getShopifyHeaders()
    const response = await fetchShopifyJson(`${baseUrl}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,title,handle,images,variants`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Shopify request failed with ${response.status}`)
    }

    const payload = await response.json()
    const normalizedProducts = (payload.products || [])
      .filter((product) => product?.status !== 'draft')
      .flatMap((product) => {
        const variants = product.variants || []
        return variants.map((variant) => buildProductPayload(product, variant))
      })

    res.json({ products: normalizedProducts })
  } catch (error) {
    console.error('Failed to fetch Shopify products:', error.message)
    res.status(502).json({
      error: 'Failed to fetch products from Shopify.',
      message: error.message,
    })
  }
})

app.post('/api/sell', async (req, res) => {
  try {
    const { sku, inventoryItemId } = req.body || {}

    if (!sku && !inventoryItemId) {
      return res.status(400).json({ error: 'SKU or inventory item ID is required.' })
    }

    const baseUrl = getShopifyBaseUrl()
    const headers = getShopifyHeaders()
    const productsResponse = await fetchShopifyJson(`${baseUrl}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,title,handle,images,variants`, {
      method: 'GET',
      headers,
    })

    if (!productsResponse.ok) {
      throw new Error(`Product fetch failed with ${productsResponse.status}`)
    }

    const productPayload = await productsResponse.json()
    const products = productPayload.products || []
    let matchedVariant = null
    let matchedProduct = null

    for (const product of products) {
      const variants = product.variants || []
      const foundVariant = variants.find((variant) => {
        const matchesSku = sku && (variant.sku || '').trim().toUpperCase() === sku.trim().toUpperCase()
        const matchesInventoryItem = inventoryItemId && variant.inventory_item_id === inventoryItemId
        return matchesSku || matchesInventoryItem
      })

      if (foundVariant) {
        matchedVariant = foundVariant
        matchedProduct = product
        break
      }
    }

    if (!matchedVariant || !matchedProduct) {
      return res.status(404).json({ error: 'No matching Shopify product or variant was found.' })
    }

    const currentInventory = Number(matchedVariant.inventory_quantity ?? 0)
    const nextInventory = Math.max(0, currentInventory - 1)

    const updateResponse = await fetchShopifyJson(`${baseUrl}/admin/api/${SHOPIFY_API_VERSION}/variants/${matchedVariant.id}.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        variant: {
          id: matchedVariant.id,
          inventory_quantity: nextInventory,
        },
      }),
    })

    if (!updateResponse.ok) {
      throw new Error(`Inventory update failed with ${updateResponse.status}`)
    }

    res.json({
      success: true,
      product: buildProductPayload(matchedProduct, matchedVariant),
      inventoryQuantity: nextInventory,
    })
  } catch (error) {
    console.error('Failed to process sale:', error.message)
    res.status(502).json({
      error: 'Failed to update inventory in Shopify.',
      message: error.message,
    })
  }
})

const { isConfigured } = getShopifyConfig()

app.listen(PORT, () => {
  console.log(`Irish Poké backend running on port ${PORT}`)

  if (!isConfigured) {
    console.warn('Shopify app not installed yet. Start the OAuth install flow from Settings.')
  }
})
