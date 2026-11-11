import { Link, NavLink } from 'react-router-dom'
import Icon from '../common/Icon'

const navigation = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/students', label: 'Students', icon: 'students' },
  { to: '/attendance', label: 'Attendance', icon: 'attendance' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
]

function Sidebar({ open, onNavigate }) {
  return (
    <>
      <button
        aria-label="Close navigation"
        aria-hidden={!open}
        className={`sidebar-backdrop ${open ? 'is-visible' : ''}`}
        disabled={!open}
        onClick={onNavigate}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <aside aria-label="Campus navigation" className={`sidebar ${open ? 'is-open' : ''}`} id="primary-sidebar">
        <Link aria-label="Campus overview" className="brand" onClick={onNavigate} to="/">
          <span className="brand-mark">C</span>
          <span className="brand-copy">
            <strong>Campus</strong>
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <p className="nav-section-label">OVERVIEW</p>
        <nav aria-label="Main navigation" className="side-nav">
          {navigation.map(({ to, label, icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                `nav-link${isActive ? ' is-active' : ''}`
              }
              end={end}
              key={to}
              onClick={onNavigate}
              to={to}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="term-card">
            <span className="term-icon">
              <Icon name="calendar" size={18} />
            </span>
            <div>
              <span>ACADEMIC YEAR</span>
              <strong>2025 – 2026</strong>
            </div>
          </div>
          <div className="sidebar-profile">
            <div aria-hidden="true" className="avatar avatar-admin">AM</div>
            <div className="profile-copy">
              <strong>Alex Morgan</strong>
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
