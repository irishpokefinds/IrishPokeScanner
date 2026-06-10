import { Link } from 'react-router-dom'

const cards = [
  {
    title: 'Scan Card',
    description: 'Use the camera to read QR codes and pull card details instantly.',
    path: '/scan',
    accent: 'scan',
  },
  {
    title: 'Generate QR Codes',
    description: 'Create printable labels for inventory and event check-in.',
    path: '/generate',
    accent: 'generate',
  },
  {
    title: 'Sales History',
    description: 'Review every recorded sale with date and event-based search.',
    path: '/sales',
    accent: 'sales',
  },
  {
    title: 'Settings',
    description: 'Store Shopify credentials and event information locally.',
    path: '/settings',
    accent: 'settings',
  },
]

function Dashboard({ sales, settings }) {
  const totalValue = sales.reduce((sum, sale) => sum + Number(sale.price), 0)

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operations Overview</p>
          <h2>Irish Poké Finds Scanner</h2>
        </div>
        <div className="chip">{settings.eventName || 'Event Mode'}</div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <p>Sales Recorded</p>
          <strong>{sales.length}</strong>
        </div>
        <div className="metric-card">
          <p>Revenue</p>
          <strong>€{totalValue.toFixed(2)}</strong>
        </div>
        <div className="metric-card">
          <p>Store URL</p>
          <strong>{settings.storeUrl || 'Not configured'}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <Link key={card.title} to={card.path} className={`feature-card ${card.accent}`}>
            <div>
              <p className="eyebrow">{card.title}</p>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <span className="arrow">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Dashboard
