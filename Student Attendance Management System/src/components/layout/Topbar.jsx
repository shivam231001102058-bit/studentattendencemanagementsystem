import { useLocation } from 'react-router-dom'
import Icon from '../common/Icon'

const titles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/reports': 'Reports',
}

const currentDate = new Date()
const currentDateLabel = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
}).format(currentDate)
const currentDateValue = currentDate.toISOString().slice(0, 10)

function Topbar({ onMenuClick, menuButtonRef, sidebarOpen }) {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Page not found'

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <button
          aria-label="Open navigation"
          aria-controls="primary-sidebar"
          aria-expanded={sidebarOpen}
          className="menu-button"
          onClick={onMenuClick}
          ref={menuButtonRef}
          type="button"
        >
          <Icon name="menu" />
        </button>
        <div>
          <span className="breadcrumb">Campus / {title}</span>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <span className="today-label">
          <Icon name="calendar" size={17} />
          <time dateTime={currentDateValue}>{currentDateLabel}</time>
        </span>
        <div aria-hidden="true" className="avatar avatar-topbar">
          AM
        </div>
      </div>
    </header>
  )
}

export default Topbar
