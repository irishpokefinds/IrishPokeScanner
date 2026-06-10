const SHOPIFY_API_VERSION = '2024-10'

function normalizeStoreUrl(storeUrl) {
  if (!storeUrl) {
    return ''
  }

  return storeUrl.trim().replace(/\/+$/, '')
}

function buildShopifyHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken,
  }
}

export async function fetchShopifyProductBySku({ storeUrl, accessToken, sku }) {
  if (!storeUrl || !accessToken || !sku) {
    return null
  }

  const normalizedStoreUrl = normalizeStoreUrl(storeUrl)
  const endpoint = `${normalizedStoreUrl}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,title,images,variants`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: buildShopifyHeaders(accessToken),
  })

  if (!response.ok) {
    throw new Error(`Shopify request failed with ${response.status}`)
  }

  const payload = await response.json()
  const products = payload.products || []
  const normalizedSku = sku.trim().toUpperCase()

  for (const product of products) {
    const matchingVariant = (product.variants || []).find((variant) => {
      return (variant.sku || '').trim().toUpperCase() === normalizedSku
    })

    if (matchingVariant) {
      return {
        shopifyProductId: product.id,
        variantId: matchingVariant.id,
        inventoryItemId: matchingVariant.inventory_item_id,
        title: product.title,
        image: product.images?.[0]?.src || '',
        price: matchingVariant.price,
        inventory: matchingVariant.inventory_quantity ?? 0,
      }
    }
  }

  return null
}

export async function updateShopifyVariantInventory({ storeUrl, accessToken, variantId, quantity }) {
  if (!storeUrl || !accessToken || !variantId) {
    return null
  }

  const normalizedStoreUrl = normalizeStoreUrl(storeUrl)
  const endpoint = `${normalizedStoreUrl}/admin/api/${SHOPIFY_API_VERSION}/variants/${variantId}.json`

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: buildShopifyHeaders(accessToken),
    body: JSON.stringify({
      variant: {
        id: variantId,
        inventory_quantity: quantity,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Inventory update failed with ${response.status}`)
  }

  return response.json()
}
