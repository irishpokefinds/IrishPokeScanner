const LOCAL_PRODUCTS_KEY = 'irish-poke-products'

// Local product cache used by the scan workflow and future Shopify sync features.
export function loadLocalProducts() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    return JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveLocalProducts(products) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products))
}

export function findLocalProductBySku(products, sku) {
  const normalizedSku = (sku || '').trim().toUpperCase()

  return products.find((product) => (product.sku || '').trim().toUpperCase() === normalizedSku) || null
}

export function adjustLocalProductInventory(products, sku, delta) {
  const normalizedSku = (sku || '').trim().toUpperCase()

  return products.map((product) => {
    if ((product.sku || '').trim().toUpperCase() !== normalizedSku) {
      return product
    }

    const currentInventory = Number(product.inventoryQuantity || 0)
    const nextInventory = Math.max(0, currentInventory + delta)

    return {
      ...product,
      inventoryQuantity: nextInventory,
    }
  })
}
