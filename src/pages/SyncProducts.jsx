import { useEffect, useMemo, useState } from 'react'
import { fetchProductsFromBackend } from '../services/backend'

const STORAGE_KEY = 'irish-poke-products'
const LAST_SYNC_KEY = 'irish-poke-last-sync'

function SyncProducts({ settings }) {
  const [products, setProducts] = useState(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [lastSync, setLastSync] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return localStorage.getItem(LAST_SYNC_KEY) || ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [status, setStatus] = useState('Ready to sync products from Shopify.')
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState({ total: 0, downloaded: 0 })
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return products
    }

    return products.filter((product) => {
      return (
        product.sku?.toLowerCase().includes(query) ||
        product.cardName?.toLowerCase().includes(query)
      )
    })
  }, [products, searchQuery])

  const handleSync = async () => {
    setIsSyncing(true)
    setOfflineMode(false)
    setErrorMessage('')
    setStatus('Downloading products from Shopify...')
    setProgress({ total: 0, downloaded: 0 })

    try {
      const syncedProducts = await fetchProductsFromBackend()
      const normalizedProducts = syncedProducts.map((product) => ({
        productId: product.productId,
        variantId: product.variantId,
        inventoryItemId: product.inventoryItemId,
        sku: product.sku || '',
        cardName: product.title || '',
        price: product.price || '0',
        inventoryQuantity: product.inventoryQuantity ?? 0,
        imageUrl: product.imageUrl || '',
        handle: product.handle || '',
      }))

      setProducts(normalizedProducts)
      setProgress({ total: normalizedProducts.length, downloaded: normalizedProducts.length })
      setStatus(`Downloaded ${normalizedProducts.length} products successfully.`)

      const syncStamp = new Date().toLocaleString()
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_SYNC_KEY, syncStamp)
      }
      setLastSync(syncStamp)
    } catch (error) {
      const backendError = error instanceof Error ? error.message : 'Unable to reach the Shopify backend.'
      setErrorMessage(backendError)
      setStatus(`Sync failed: ${backendError}`)
      setProgress({ total: products.length, downloaded: 0 })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <section style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>Sync Products</p>
          <h2 style={styles.title}>Download products from Shopify for offline card show use</h2>
        </div>
        <div style={styles.badge}>Offline ready</div>
      </div>

      <div style={styles.panel}>
        <button type="button" onClick={handleSync} style={styles.primaryButton} disabled={isSyncing}>
          {isSyncing ? 'Syncing…' : 'Sync Products from Shopify'}
        </button>

        <div style={styles.statusGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Total products found</span>
            <strong style={styles.statValue}>{progress.total || products.length}</strong>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Products downloaded</span>
            <strong style={styles.statValue}>{progress.downloaded || products.length}</strong>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Last sync date/time</span>
            <strong style={styles.statValue}>{lastSync || 'Not synced yet'}</strong>
          </div>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.min(100, ((progress.downloaded || products.length) / Math.max(1, progress.total || products.length)) * 100)}%`,
            }}
          />
        </div>

        <p style={errorMessage ? styles.errorText : styles.statusText}>{status}</p>
        {offlineMode ? <p style={styles.offlineText}>Using locally cached product database.</p> : null}
      </div>

      <div style={styles.panel}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>Last Sync</p>
            <p style={styles.lastSyncText}>{lastSync ? `Last synced: ${lastSync}` : 'No sync completed yet.'}</p>
          </div>
        </div>

        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by SKU or card name"
          style={styles.input}
        />

        <div style={styles.list}
>
          {filteredProducts.map((product) => (
            <div key={`${product.productId}-${product.variantId}`} style={styles.cardRow}>
              <div style={styles.imageFrame}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.cardName} style={styles.image} />
                ) : (
                  <span style={styles.imagePlaceholder}>No Image</span>
                )}
              </div>
              <div style={styles.cardDetails}>
                <strong style={styles.cardName}>{product.cardName || 'Untitled Card'}</strong>
                <p style={styles.detailText}>SKU: {product.sku || '—'}</p>
                <p style={styles.detailText}>Price: {product.price || '—'}</p>
                <p style={styles.detailText}>Stock: {product.inventoryQuantity ?? 0}</p>
              </div>
            </div>
          ))}
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
  panel: {
    border: '1px solid rgba(217, 178, 78, 0.2)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '16px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#120b00',
    background: 'linear-gradient(135deg, #d9b24e, #8a6110)',
    cursor: 'pointer',
    width: '100%',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  statBox: {
    border: '1px solid rgba(217,178,78,0.16)',
    borderRadius: '12px',
    padding: '10px',
    background: 'rgba(0,0,0,0.2)',
  },
  statLabel: {
    display: 'block',
    color: '#cdbb7b',
    fontSize: '0.88rem',
  },
  statValue: {
    display: 'block',
    marginTop: '4px',
    color: '#fff3c0',
    fontSize: '1.2rem',
  },
  progressTrack: {
    height: '10px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    marginTop: '12px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #d9b24e, #ffd76d)',
    transition: 'width 180ms ease',
  },
  statusText: {
    margin: '10px 0 0',
    color: '#c6b26b',
  },
  errorText: {
    margin: '10px 0 0',
    color: '#ff8f8f',
    fontWeight: 600,
  },
  offlineText: {
    margin: '6px 0 0',
    color: '#ffb347',
  },
  lastSyncText: {
    margin: 0,
    color: '#c6b26b',
  },
  input: {
    width: '100%',
    border: '1px solid rgba(217, 178, 78, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    background: 'rgba(0,0,0,0.28)',
    color: '#fff8db',
    marginTop: '10px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  cardRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    padding: '10px',
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(217,178,78,0.14)',
  },
  imageFrame: {
    width: '64px',
    height: '64px',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0,
    background: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    color: '#c6b26b',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
  },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  cardName: {
    color: '#fff3c0',
  },
  detailText: {
    margin: 0,
    color: '#c6b26b',
    fontSize: '0.92rem',
  },
}

export default SyncProducts
