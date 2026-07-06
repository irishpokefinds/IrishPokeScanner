import { useEffect, useState } from 'react'

function Settings({ settings, setSettings }) {
  const [form, setForm] = useState(settings)
  const [message, setMessage] = useState('Your settings stay on this device for now.')
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/$/, '') || '/api'

  useEffect(() => {
    setForm(settings)
  }, [settings])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const status = params.get('shopify')
    const errorMessage = params.get('message')

    if (status === 'connected') {
      setMessage('Shopify connected successfully. Sync Products and Sell Card will use the stored shop access token.')
    } else if (status === 'error') {
      setMessage(errorMessage ? `Shopify connection failed: ${errorMessage}` : 'Shopify connection failed.')
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    const normalizedSettings = {
      ...form,
      storeUrl: form.storeUrl.trim(),
      eventName: form.eventName.trim(),
      defaultPrinter: form.defaultPrinter.trim(),
    }

    setSettings(normalizedSettings)
    if (typeof window !== 'undefined') {
      localStorage.setItem('irish-poke-settings', JSON.stringify(normalizedSettings))
    }
    setMessage('Settings saved locally and ready for Shopify OAuth installation.')
  }

  const handleConnectShopify = (event) => {
    event.preventDefault()
    const shop = form.storeUrl.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')

    if (!shop) {
      setMessage('Enter your Shopify store URL before connecting.')
      return
    }

    if (typeof window !== 'undefined') {
    window.location.assign(`https://irishpokescanner.onrender.com/api/shopify/install?shop=${encodeURIComponent(shop)}`)
  }

  return (
    <section style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>Settings</p>
          <h2 style={styles.title}>Store event and print preferences locally</h2>
        </div>
        <div style={styles.badge}>Local only</div>
      </div>

      <form onSubmit={handleSave} style={styles.formCard}>
        <label style={styles.label} htmlFor="storeUrl">
          Shopify Store URL
        </label>
        <input
          id="storeUrl"
          name="storeUrl"
          value={form.storeUrl}
          onChange={handleChange}
          placeholder="https://your-store.myshopify.com"
          style={styles.input}
        />

        <button type="button" onClick={handleConnectShopify} style={styles.connectButton}>
          Connect Shopify App
        </button>

        <label style={styles.label} htmlFor="eventName">
          Event Name
        </label>
        <input
          id="eventName"
          name="eventName"
          value={form.eventName}
          onChange={handleChange}
          placeholder="Summer Showdown"
          style={styles.input}
        />

        <label style={styles.label} htmlFor="defaultPrinter">
          Default Printer
        </label>
        <input
          id="defaultPrinter"
          name="defaultPrinter"
          value={form.defaultPrinter}
          onChange={handleChange}
          placeholder="Label Printer"
          style={styles.input}
        />

        <button type="submit" style={styles.saveButton}>
          Save Settings
        </button>
        <p style={styles.helperText}>{message}</p>
      </form>
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
  formCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid rgba(217, 178, 78, 0.2)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '16px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
  },
  label: {
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
  },
  saveButton: {
    border: 'none',
    borderRadius: '12px',
    padding: '12px 14px',
    marginTop: '6px',
    fontWeight: 700,
    color: '#120b00',
    background: 'linear-gradient(135deg, #d9b24e, #8a6110)',
    cursor: 'pointer',
  },
  connectButton: {
    border: '1px solid rgba(217, 178, 78, 0.24)',
    borderRadius: '12px',
    padding: '12px 14px',
    fontWeight: 700,
    color: '#fff9e1',
    background: 'rgba(217, 178, 78, 0.14)',
    cursor: 'pointer',
  },
  helperText: {
    margin: 0,
    color: '#c6b26b',
  },
}

export default Settings
