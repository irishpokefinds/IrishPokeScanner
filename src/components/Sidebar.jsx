import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◉' },
  { to: '/scan', label: 'Scan Card', icon: '◎' },
  { to: '/generate', label: 'Generate QR', icon: '◌' },
  { to: '/sync-products', label: 'Sync Products', icon: '◐' },
  { to: '/sales', label: 'Sales History', icon: '◍' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">IP</div>
        <div>
          <p className="brand-name">Irish Poké Finds</p>
          <p className="brand-subtitle">Scanner Dashboard</p>
        </div>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Ready for Shopify sync</p>
        <span>Live inventory workflow</span>
      </div>
    </aside>
  )
}

export default Sidebar
