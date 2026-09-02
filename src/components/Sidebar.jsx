import { NavLink } from 'react-router-dom'
import logo from '../assets/scanner-logo.png'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/scan', label: 'Scan', icon: '▥' },
  { to: '/generate', label: 'Generate QR', icon: '▦' },
  { to: '/sync-products', label: 'Products', icon: '↻' },
  { to: '/sales', label: 'Recent Sales', icon: '◷' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <img className="brand-logo" src={logo} alt="Irish Poké Finds Scanner" />
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
        <div className="user-avatar">●</div>
        <div><p>Irish Poké Finds</p><span>Scanner online</span></div>
        <b>›</b>
      </div>
    </aside>
  )
}

export default Sidebar
