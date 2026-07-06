import crypto from 'node:crypto'
import test from 'node:test'
import assert from 'node:assert/strict'

process.env.NODE_ENV = 'test'

const { buildProductPayload, buildShopifyOAuthCookieOptions, normalizeShopDomain, normalizeStoreUrl, verifyShopifyHmac } = await import('../server.js')

test('normalizeShopDomain strips scheme and trailing slashes', () => {
  assert.equal(normalizeShopDomain('https://demo-store.myshopify.com/'), 'demo-store.myshopify.com')
  assert.equal(normalizeShopDomain('demo-store.myshopify.com/admin'), 'demo-store.myshopify.com')
})

test('buildProductPayload preserves Shopify product metadata', () => {
  const product = {
    id: 101,
    title: 'Charizard EX',
    handle: 'charizard-ex',
    images: [{ src: 'https://cdn.example.com/charizard.png' }],
  }
  const variant = {
    id: 202,
    inventory_item_id: 303,
    sku: 'SKU-1',
    price: '19.99',
    inventory_quantity: 4,
  }

  const payload = buildProductPayload(product, variant)

  assert.equal(payload.productId, 101)
  assert.equal(payload.variantId, 202)
  assert.equal(payload.sku, 'SKU-1')
  assert.equal(payload.name, 'Charizard EX')
  assert.equal(payload.inventoryQuantity, 4)
  assert.equal(payload.handle, 'charizard-ex')
})

test('normalizeStoreUrl preserves https scheme and removes trailing slashes', () => {
  assert.equal(normalizeStoreUrl('https://demo-store.myshopify.com/'), 'https://demo-store.myshopify.com')
  assert.equal(normalizeStoreUrl('demo-store.myshopify.com'), 'https://demo-store.myshopify.com')
})

test('verifyShopifyHmac validates signed query values', () => {
  const secret = 'super-secret'
  const params = {
    shop: 'demo-store.myshopify.com',
    state: 'abc123',
    code: 'def456',
  }

  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
  const message = sortedEntries.map(([key, value]) => `${key}=${value}`).join('&')
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex')

  assert.equal(verifyShopifyHmac({ ...params, hmac }, secret), true)
})

test('buildShopifyOAuthCookieOptions uses secure httpOnly cookies for HTTPS requests', () => {
  const options = buildShopifyOAuthCookieOptions({
    secure: true,
    headers: {
      'x-forwarded-proto': 'https',
    },
  })

  assert.equal(options.httpOnly, true)
  assert.equal(options.sameSite, 'lax')
  assert.equal(options.secure, true)
  assert.equal(options.signed, true)
})
