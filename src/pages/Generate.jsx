import { useState } from 'react'
import QRCode from 'qrcode'

function Generate() {
  const [sku, setSku] = useState('')
  const [cardName, setCardName] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [status, setStatus] = useState('Enter a SKU and card name to generate a label.')

  const handleGenerate = async () => {
    if (!sku.trim()) {
      setStatus('Please enter a SKU before generating a QR code.')
      return
    }

    const valueToEncode = `${sku.trim()}::${cardName.trim() || 'Untitled Card'}`
    const dataUrl = await QRCode.toDataURL(valueToEncode)
    setQrDataUrl(dataUrl)
    setStatus(`QR label generated for ${sku.trim()}.`)
  }

  const handleDownloadPng = () => {
    if (!qrDataUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${sku.trim() || 'label'}.png`
    link.click()
  }

  const handlePrintLabel = () => {
    window.print()
  }

  return (
    <section style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>Generate QR Codes</p>
          <h2 style={styles.title}>Create print-ready labels for card shows</h2>
        </div>
        <div style={styles.badge}>Print ready</div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.panel}>
          <label style={styles.label} htmlFor="sku">
            SKU
          </label>
          <input
            id="sku"
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="SKU-001"
            style={styles.input}
          />

          <label style={styles.label} htmlFor="cardName">
            Card Name
          </label>
          <input
            id="cardName"
            value={cardName}
            onChange={(event) => setCardName(event.target.value)}
            placeholder="Charizard EX 2024"
            style={styles.input}
          />

          <div style={styles.buttonRow}>
            <button type="button" onClick={handleGenerate} style={styles.primaryButton}>
              Generate QR Code
            </button>
            <button type="button" onClick={handleDownloadPng} style={styles.secondaryButton}>
              Download PNG
            </button>
            <button type="button" onClick={handlePrintLabel} style={styles.secondaryButton}>
              Print Label
            </button>
          </div>

          <button type="button" style={styles.bulkButton}>
            Bulk Import
          </button>
          <p style={styles.helperText}>{status}</p>
        </div>

        <div style={styles.previewPanel}>
          {qrDataUrl ? (
            <div style={styles.previewCard}>
              <img src={qrDataUrl} alt="Generated QR code" style={styles.qrImage} />
              <div style={styles.previewMeta}>
                <strong>{cardName || 'Untitled Card'}</strong>
                <span>{sku || 'SKU pending'}</span>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>QR preview will appear here</p>
              <p style={styles.emptyText}>Generate a label to preview and print it.</p>
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
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
  },
  panel: {
    border: '1px solid rgba(217, 178, 78, 0.2)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '16px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#e3c25a',
    fontSize: '0.94rem',
  },
  input: {
    width: '100%',
    border: '1px solid rgba(217, 178, 78, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    background: 'rgba(0,0,0,0.28)',
    color: '#fff8db',
    marginBottom: '10px',
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '4px',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '12px',
    padding: '12px 14px',
    fontWeight: 700,
    color: '#120b00',
    background: 'linear-gradient(135deg, #d9b24e, #8a6110)',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid rgba(217, 178, 78, 0.25)',
    borderRadius: '12px',
    padding: '12px 14px',
    fontWeight: 700,
    color: '#fff3c0',
    background: 'rgba(217, 178, 78, 0.12)',
    cursor: 'pointer',
  },
  bulkButton: {
    width: '100%',
    border: '1px dashed rgba(217, 178, 78, 0.35)',
    borderRadius: '12px',
    padding: '12px 14px',
    marginTop: '10px',
    color: '#e3c25a',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
  },
  helperText: {
    margin: '10px 0 0',
    color: '#c6b26b',
  },
  previewPanel: {
    border: '1px solid rgba(217, 178, 78, 0.2)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '16px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
  },
  previewCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '280px',
  },
  qrImage: {
    width: '200px',
    height: '200px',
    borderRadius: '16px',
    background: '#fff',
    padding: '8px',
  },
  previewMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: '#fff3c0',
  },
  emptyState: {
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px dashed rgba(217, 178, 78, 0.3)',
    borderRadius: '16px',
    color: '#c6b26b',
    textAlign: 'center',
    padding: '16px',
  },
  emptyTitle: {
    margin: 0,
    color: '#fff4c8',
    fontWeight: 700,
  },
  emptyText: {
    margin: '4px 0 0',
  },
}

export default Generate
