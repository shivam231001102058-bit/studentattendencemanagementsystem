import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { dismissPersistenceError } from '../../app/persistence/persistenceStatusSlice'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const dispatch = useDispatch()
  const persistenceError = useSelector((state) => state.persistence.error)

  useEffect(() => {
    if (!sidebarOpen) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  function closeSidebar() {
    setSidebarOpen(false)
    menuButtonRef.current?.focus()
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
      <div className="main-panel">
        <Topbar
          menuButtonRef={menuButtonRef}
          onMenuClick={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />
        <main className="page-content">
          {persistenceError && (
            <div className="persistence-notice" role="alert">
              <span>{persistenceError}</span>
              <button
                aria-label="Dismiss storage warning"
                onClick={() => dispatch(dismissPersistenceError())}
                type="button"
              >
                ×
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
