import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Attendance from './pages/Attendance'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import Reports from './pages/Reports'
import Students from './pages/Students'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
