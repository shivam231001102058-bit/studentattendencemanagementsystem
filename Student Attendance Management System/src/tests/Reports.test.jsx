import { configureStore } from '@reduxjs/toolkit'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import attendanceReducer, { markAttendance } from '../features/attendance/attendanceSlice'
import reportsReducer from '../features/reports/reportsSlice'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'
import Reports from '../pages/Reports'

const student = {
  studentId: 'STU-001',
  fullName: 'Jordan Lee',
  department: 'Computer Science',
  semester: '3',
  section: 'A',
  email: 'jordan@college.edu',
  createdDate: '2026-01-01',
}

function renderReports(withData = false) {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      attendance: attendanceReducer,
      reports: reportsReducer,
    },
  })

  if (withData) {
    store.dispatch(addStudent(student))
    store.dispatch(markAttendance({
      studentId: student.studentId,
      studentName: student.fullName,
      date: '2026-01-05',
      subject: 'Physics',
      semester: student.semester,
      section: student.section,
      attendanceStatus: 'P',
    }))
  }

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Reports />
      </MemoryRouter>
    </Provider>,
  )
}

describe('Reports page', () => {
  it('shows an empty state and disables export when records are absent', () => {
    renderReports()

    expect(screen.getByText('No attendance records yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeDisabled()
  })

  it('shows report rows, validates date ranges, and clears filters', async () => {
    const user = userEvent.setup()
    renderReports(true)

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled()

    await user.selectOptions(screen.getByLabelText('Report type'), 'subject')
    expect(within(screen.getByRole('region', { name: 'Report results' }))
      .getByRole('heading', { name: 'Subject-wise attendance' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Physics' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Report start date'), '2026-02-01')
    await user.type(screen.getByLabelText('Report end date'), '2026-01-01')
    expect(screen.getByRole('alert')).toHaveTextContent('End date cannot be earlier than start date.')
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled()
  })
})
