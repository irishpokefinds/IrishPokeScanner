import { Link } from 'react-router-dom'

function Dashboard({ sales, settings }) {
  const totalValue = sales.reduce((sum, sale) => sum + Number(sale.price), 0)
  const recentSales = sales.slice(0, 4)

  return (
    <section className="page-section">
      <div className="dashboard-heading">
        <div>
          <h2>Scanner Dashboard</h2>
          <p>Scan cards, track sales and manage your event inventory.</p>
        </div>
      </div>

      <div className="metrics-grid dashboard-metrics">
        <div className="metric-card cyan">
          <div><p>Items Scanned</p><strong>{sales.length}</strong><small>Ready for your next scan</small></div><i>▥</i>
        </div>
        <div className="metric-card green">
          <div><p>Sales Value</p><strong>€{totalValue.toFixed(2)}</strong><small>Recorded revenue</small></div><i>€</i>
        </div>
        <div className="metric-card orange">
          <div><p>Event</p><strong className="metric-event">{settings.eventName || 'Event mode'}</strong><small>Currently active</small></div><i>◉</i>
        </div>
      </div>

      <div className="scanner-hero">
        <div className="scanner-copy">
          <h3>Scanner</h3>
          <p>Scan a QR code to look up a card</p>
          <Link to="/scan" className="scanner-input">
            <span>▥</span><b>Open camera scanner</b><em>Scan</em>
          </Link>
          <div className="or-divider"><span>OR</span></div>
          <Link to="/sync-products" className="lookup-name">⌕ &nbsp; Look up synced products</Link>
        </div>
        <div className="scanner-art" aria-hidden="true"><div className="phone"><div className="barcode">|||||||||</div></div></div>
      </div>

      <div className="dashboard-lower">
        <section className="activity-panel">
          <div className="panel-heading"><h3>Recent Sales</h3><Link to="/sales">View all</Link></div>
          {recentSales.length ? recentSales.map((sale) => (
            <div className="activity-row" key={sale.id}>
              <span className="activity-icon">▦</span>
              <div><strong>{sale.name}</strong><small>{sale.sku} · {sale.event}</small></div>
              <b>€{Number(sale.price).toFixed(2)}</b>
            </div>
          )) : <p className="empty-activity">Your recent sales will appear here.</p>}
        </section>
        <section className="activity-panel shortcuts">
          <div className="panel-heading"><h3>Quick Actions</h3></div>
          <Link to="/generate"><span>▦</span><div><strong>Generate QR labels</strong><small>Create print-ready card labels</small></div><b>›</b></Link>
          <Link to="/sync-products"><span>↻</span><div><strong>Sync Shopify products</strong><small>Refresh your offline inventory</small></div><b>›</b></Link>
          <Link to="/settings"><span>⚙</span><div><strong>Scanner settings</strong><small>Store, event and printer setup</small></div><b>›</b></Link>
        </section>
      </div>
    </section>
  )
}

export default Dashboard
