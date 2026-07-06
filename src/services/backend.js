const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/$/, '')
const API_BASE_URL = configuredBaseUrl || '/api'

export async function fetchProductsFromBackend() {
  const response = await fetch(`${API_BASE_URL}/products`)

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message || 'Unable to sync products from the backend.')
  }

  const payload = await response.json()
  return payload.products || []
}

export async function sellProductViaBackend({ sku, inventoryItemId }) {
  const response = await fetch(`${API_BASE_URL}/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sku, inventoryItemId }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message || 'Unable to update Shopify inventory right now.')
  }

  return response.json()
}
