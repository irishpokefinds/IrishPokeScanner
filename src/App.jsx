import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import Generate from './pages/Generate'
import Sales from './pages/Sales'
import Settings from './pages/Settings'
import SyncProducts from './pages/SyncProducts'
import './App.css'

const defaultSettings = {
  storeUrl: 'https://irish-poke-finds.myshopify.com',
  apiToken: '',
  eventName: 'Irish Poké Finds Event',
}

const defaultSales = [
  {
    id: 1,
    sku: 'SKU-001',
    name: 'Charizard EX 2024',
    price: '42.00',
    event: 'Friday Night',
    date: '2026-06-09 18:15',
  },
  {
    id: 2,
    sku: 'SKU-002',
    name: 'Umbreon VMAX',
    price: '36.50',
    event: 'Friday Night',
    date: '2026-06-09 19:05',
  },
]

function App() {
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultSettings
    }

    try {
      return JSON.parse(localStorage.getItem('irish-poke-settings')) || defaultSettings
    } catch {
      return defaultSettings
    }
  })

  const [sales, setSales] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultSales
    }

    try {
      return JSON.parse(localStorage.getItem('irish-poke-sales')) || defaultSales
    } catch {
      return defaultSales
    }
  })

  useEffect(() => {
    localStorage.setItem('irish-poke-settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('irish-poke-sales', JSON.stringify(sales))
  }, [sales])

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />

        <main className="main-content">
          <header className="topbar">
            <div>
              <p className="eyebrow">Event Operations</p>
              <h1>Irish Poké Finds Scanner</h1>
            </div>
            <div className="status-pill">{settings.eventName || 'Ready to scan'}</div>
          </header>

          <Routes>
            <Route path="/" element={<Dashboard sales={sales} settings={settings} />} />
            <Route
              path="/scan"
              element={<Scan sales={sales} setSales={setSales} settings={settings} />}
            />
            <Route path="/generate" element={<Generate />} />
            <Route path="/sync-products" element={<SyncProducts settings={settings} />} />
            <Route path="/sales" element={<Sales sales={sales} />} />
            <Route
              path="/settings"
              element={<Settings settings={settings} setSettings={setSettings} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
