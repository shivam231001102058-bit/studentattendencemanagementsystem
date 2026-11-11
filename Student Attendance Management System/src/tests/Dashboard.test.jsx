import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import attendanceReducer, { markAttendance } from '../features/attendance/attendanceSlice'
import dashboardReducer from '../features/dashboard/dashboardSlice'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'
import Dashboard from '../pages/Dashboard'

const student = {
  studentId: 'STU-001',
  fullName: 'Jordan Lee',
  department: 'Computer Science',
  semester: '3',
  section: 'A',
  email: 'jordan@college.edu',
  createdDate: '2026-11-11',
}

function renderDashboard(withData = false) {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      attendance: attendanceReducer,
      dashboard: dashboardReducer,
    },
  })

  if (withData) {
    store.dispatch(addStudent(student))
    store.dispatch(markAttendance({
      studentId: student.studentId,
      studentName: student.fullName,
      date: new Date().toISOString().slice(0, 10),
      subject: 'Programming',
      semester: student.semester,
      section: student.section,
      attendanceStatus: 'A',
    }))
  }

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </Provider>,
  )
}

describe('Dashboard analytics', () => {
  it('shows useful empty states with no records and actual Redux counts', () => {
    renderDashboard()

    expect(screen.getByText('No registered students yet')).toBeInTheDocument()
    expect(screen.getByText('No attendance data yet')).toBeInTheDocument()
    expect(screen.getByText('No subject attendance data')).toBeInTheDocument()
    expect(screen.getByText('Registered students')).toBeInTheDocument()
    expect(screen.getByText('Attendance records')).toBeInTheDocument()
  })

  it('renders actual student statistics and allows changing analytics filters', async () => {
    const user = userEvent.setup()
    renderDashboard(true)

    expect(screen.getAllByText('Jordan Lee')).toHaveLength(2)
    expect(screen.getAllByText('STU-001')).toHaveLength(1)
    expect(screen.getAllByText('Programming')).toHaveLength(2)
    expect(screen.getByLabelText('Low attendance threshold percentage')).toHaveValue(45)

    await user.selectOptions(screen.getByLabelText('Dashboard subject'), 'Programming')
    await user.selectOptions(screen.getByLabelText('Dashboard semester'), '3')
    await user.selectOptions(screen.getByLabelText('Dashboard section'), 'A')
    expect(screen.getAllByText('Jordan Lee')).toHaveLength(2)
    expect(screen.getByText('STU-001 · Semester 3, Section A')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Dashboard date range'), 'last-7-days')
    fireEvent.change(screen.getByLabelText('Low attendance threshold percentage'), {
      target: { value: '100' },
    })
    expect(screen.getAllByText('Jordan Lee')).toHaveLength(2)
  })
})
