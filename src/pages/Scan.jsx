import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
  adjustLocalProductInventory,
  findLocalProductBySku,
  loadLocalProducts,
  saveLocalProducts,
} from '../services/localProducts'
import { sellProductViaBackend } from '../services/backend'

function Scan({ setSales, settings }) {
  const [scannedSku, setScannedSku] = useState('')
  const [scanActive, setScanActive] = useState(true)
  const [product, setProduct] = useState(null)
  const [localProducts, setLocalProducts] = useState(() => loadLocalProducts())
  const [statusMessage, setStatusMessage] = useState(
    'Point your camera at a card QR code to begin scanning.',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [saleComplete, setSaleComplete] = useState(false)
  const [lastSoldSku, setLastSoldSku] = useState('')
  const [lastSale, setLastSale] = useState(null)

  useEffect(() => {
    setLocalProducts(loadLocalProducts())
  }, [])

  useEffect(() => {
    if (!scanActive) {
      return undefined
    }

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      },
      false,
    )

    scanner.render(
      (decodedText) => {
        const normalizedSku = decodedText.trim().toUpperCase()

        if (lastSoldSku && normalizedSku === lastSoldSku) {
          setScannedSku(normalizedSku)
          setStatusMessage('This card has already been sold. Undo the last sale to scan it again.')
          scanner.clear().catch(() => undefined)
          return
        }

        setScannedSku(normalizedSku)
        setScanActive(false)
        setIsLoading(true)
        setSaleComplete(false)
        setStatusMessage(`Looking up ${normalizedSku} in the synced product database...`)

        const matchedProduct = findLocalProductBySku(localProducts, normalizedSku)

        if (matchedProduct) {
          const displayName = matchedProduct.cardName || matchedProduct.name || matchedProduct.title || 'Untitled Card'
          setProduct({
            title: displayName,
            image: matchedProduct.imageUrl,
            price: matchedProduct.price,
            inventory: matchedProduct.inventoryQuantity,
            sku: matchedProduct.sku,
            variantId: matchedProduct.variantId,
            inventoryItemId: matchedProduct.inventoryItemId,
          })
          setStatusMessage(`Found ${displayName}`)
        } else {
          setProduct(null)
          setStatusMessage('No matching locally synced product was found for this SKU.')
        }

        setIsLoading(false)
        scanner.clear().catch(() => undefined)
      },
      () => undefined,
    )

    return () => {
      scanner.clear().catch(() => undefined)
    }
  }, [lastSoldSku, localProducts, scanActive, settings.apiToken, settings.storeUrl])

  const handleCancel = () => {
    setScannedSku('')
    setProduct(null)
    setSaleComplete(false)
    setScanActive(true)
    setStatusMessage('Camera ready. Scan another card when you are prepared.')
  }

  const handleSell = async () => {
    if (!product) {
      setStatusMessage('No product is ready to sell yet.')
      return
    }

    const sale = {
      id: Date.now(),
      sku: scannedSku,
      name: product.title,
      price: product.price,
      event: settings.eventName || 'Event Sale',
      date: new Date().toLocaleString(),
      syncStatus: 'pending',
    }

    try {
      setIsLoading(true)

      const updatedProducts = adjustLocalProductInventory(localProducts, scannedSku, -1)
      saveLocalProducts(updatedProducts)
      setLocalProducts(updatedProducts)

      await sellProductViaBackend({
        sku: scannedSku,
        inventoryItemId: product.inventoryItemId,
      })

      setSales((currentSales) => [sale, ...currentSales])
      setLastSale(sale)
      setLastSoldSku(scannedSku)
      setSaleComplete(true)
      setStatusMessage('Sale Complete')
    } catch (error) {
      setSales((currentSales) => [sale, ...currentSales])
      setLastSale(sale)
      setLastSoldSku(scannedSku)
      setSaleComplete(true)
      setStatusMessage(`Sale Complete. Shopify sync pending: ${error.message}`)
    } finally {
      setIsLoading(false)
      setScanActive(true)
    }
  }

  const handleUndoLastSale = () => {
    if (!lastSale) {
      setStatusMessage('There is no recent sale to undo.')
      return
    }

    const restoredProducts = adjustLocalProductInventory(localProducts, lastSale.sku, 1)
    saveLocalProducts(restoredProducts)
    setLocalProducts(restoredProducts)
    setSales((currentSales) => currentSales.filter((sale) => sale.id !== lastSale.id))
    setLastSale(null)
    setLastSoldSku('')
    setSaleComplete(false)
    setScannedSku('')
    setProduct(null)
    setScanActive(true)
    setStatusMessage('Last sale undone.')
  }

  return (
    <section style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>Scan Card</p>
          <h2 style={styles.title}>Fast checkout for busy card shows</h2>
        </div>
        <div style={styles.badge}>Camera ready</div>
      </div>

      <div style={styles.contentCard}>
        <div style={styles.cameraPanel}>
          <div id="reader" style={styles.readerFrame} />
          <p style={styles.helperText}>{statusMessage}</p>
        </div>

        <div style={styles.resultPanel}>
          {scannedSku ? (
            <>
              <div style={styles.resultCard}>
                <div style={styles.imageFrame}>
                  {product?.image ? (
                    <img src={product.image} alt={product.title} style={styles.image} />
                  ) : (
                    <span style={styles.imagePlaceholderText}>Card Image</span>
                  )}
                </div>

                <div style={styles.detailStack}>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Scanned SKU</span>
                    <strong style={styles.value}>{scannedSku}</strong>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Card Name</span>
                    <span style={styles.valueMuted}>{product?.title || 'Pending'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Price</span>
                    <span style={styles.valueMuted}>{product ? `$${product.price}` : 'Pending'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Inventory</span>
                    <span style={styles.valueMuted}>{product ? product.inventory : 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button
                  type="button"
                  onClick={handleSell}
                  style={styles.sellButton}
                  disabled={isLoading || !product}
                >
                  {isLoading ? 'Processing…' : saleComplete ? 'Sale Complete' : 'Sell Card'}
                </button>
                <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                  Cancel
                </button>
                {lastSale ? (
                  <button type="button" onClick={handleUndoLastSale} style={styles.undoButton}>
                    Undo Last Sale
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>Waiting for a QR scan</p>
              <p style={styles.emptyText}>
                The scanner will display the matching Shopify product details here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    color: '#f9efc8',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  eyebrow: {
    margin: '0 0 4px',
    fontSize: '0.74rem',
    textTransform: 'uppercase',
    letterSpacing: '0.24em',
    color: '#d9b24e',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)',
    color: '#fff4c8',
  },
  badge: {
    border: '1px solid rgba(217, 178, 78, 0.3)',
    background: 'rgba(217, 178, 78, 0.12)',
    color: '#ffd667',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '0.9rem',
  },
  contentCard: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
  },
  cameraPanel: {
    border: '1px solid rgba(217, 178, 78, 0.2)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '14px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
  },
  readerFrame: {
    minHeight: '280px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #0f0f0f, #1a1406)',
    border: '1px solid rgba(217,178,78,0.2)',
    overflow: 'hidden',
  },
  helperText: {
    margin: '10px 2px 0',
    color: '#c6b26b',
  },
  resultPanel: {
    border: '1px solid rgba(217, 178, 78, 0.2)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '14px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
  },
  resultCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  imageFrame: {
    minHeight: '150px',
    borderRadius: '16px',
    border: '1px dashed rgba(217, 178, 78, 0.38)',
    background: 'rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholderText: {
    color: '#d3b959',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  detailStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(217,178,78,0.16)',
  },
  label: {
    color: '#ccac51',
    fontSize: '0.92rem',
  },
  value: {
    color: '#fff3c0',
    textAlign: 'right',
  },
  valueMuted: {
    color: '#c2b06f',
    textAlign: 'right',
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '14px',
  },
  sellButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0d0900',
    background: 'linear-gradient(135deg, #3f9d4f, #236b32)',
    cursor: 'pointer',
  },
  cancelButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#fff0f0',
    background: 'linear-gradient(135deg, #b23a3a, #7b1f1f)',
    cursor: 'pointer',
  },
  undoButton: {
    border: '1px solid rgba(217, 178, 78, 0.24)',
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#fff3c0',
    background: 'rgba(217, 178, 78, 0.12)',
    cursor: 'pointer',
  },
  emptyState: {
    border: '1px dashed rgba(217,178,78,0.3)',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minHeight: '220px',
    justifyContent: 'center',
  },
  emptyTitle: {
    margin: 0,
    color: '#fff4c8',
    fontWeight: 700,
  },
  emptyText: {
    margin: 0,
    color: '#c6b26b',
  },
}

export default Scan
