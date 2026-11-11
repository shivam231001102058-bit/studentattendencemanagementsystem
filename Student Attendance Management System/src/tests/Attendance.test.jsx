import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import attendanceReducer, { markAttendance } from '../features/attendance/attendanceSlice'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'
import subjectsReducer from '../features/subjects/subjectsSlice'
import { mockStudentAttendanceService } from '../services/mockStudentAttendanceService'
import Attendance from '../pages/Attendance'

const students = [
  {
    studentId: 'STU-001',
    fullName: 'Jordan Lee',
    department: 'Computer Science',
    semester: '3',
    section: 'A',
    email: 'jordan@college.edu',
    createdDate: '2026-11-11',
  },
  {
    studentId: 'STU-002',
    fullName: 'Taylor Morgan',
    department: 'Engineering',
    semester: '3',
    section: 'B',
    email: 'taylor@college.edu',
    createdDate: '2026-11-11',
  },
]

function renderAttendance(includeStudents = true, initialRecords = []) {
  const store = configureStore({
    reducer: {
      attendance: attendanceReducer,
      students: studentsReducer,
      subjects: subjectsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: { mockStudentAttendanceService } },
      }),
  })
  if (includeStudents) {
    students.forEach((student) => store.dispatch(addStudent(student)))
  }
  initialRecords.forEach((record) => store.dispatch(markAttendance(record)))

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <Attendance />
        </MemoryRouter>
      </Provider>,
    ),
    store,
  }
}

async function selectClass(user) {
  await user.selectOptions(screen.getByLabelText('Subject'), 'Physics')
  await user.selectOptions(screen.getByLabelText('Semester'), '3')
  await user.selectOptions(screen.getByLabelText('Section'), 'A')
}

describe('Attendance page', () => {
  it('uses configured subjects for new attendance while retaining deleted names in history', async () => {
    const user = userEvent.setup()
    renderAttendance(true, [{
      studentId: students[0].studentId,
      studentName: students[0].fullName,
      date: '2026-11-11',
      subject: 'Physics',
      semester: '3',
      section: 'A',
      attendanceStatus: 'P',
    }])
    await user.selectOptions(screen.getByLabelText('Subject'), 'Physics')
    await user.click(screen.getByRole('button', { name: 'Edit subject Physics' }))
    const subjectName = screen.getByLabelText('Subject name')
    await user.clear(subjectName)
    await user.type(subjectName, 'Physics Lab')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByLabelText('Subject')).toHaveValue(''))
    expect(screen.getByLabelText('Subject').querySelector('option[value="Physics"]')).toBeNull()
    expect(screen.getByLabelText('Subject').querySelector('option[value="Physics Lab"]'))
      .toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Attendance history' })).getByText('Physics'))
      .toBeInTheDocument()
  })

  it('validates required class selections and students before saving', async () => {
    const user = userEvent.setup()
    renderAttendance(false)

    fireEvent.submit(screen.getByRole('button', { name: 'Save attendance' }).closest('form'))
    expect(screen.getByRole('alert')).toHaveTextContent('Subject is required.')
    expect(screen.getByLabelText('Subject')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Subject')).toHaveAttribute('aria-describedby', 'attendance-form-error')

    await selectClass(user)
    fireEvent.submit(screen.getByRole('button', { name: 'Save attendance' }).closest('form'))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'There are no registered students in the selected semester and section.',
    )
  })

  it('shows only registered students for the selected semester and section', async () => {
    const user = userEvent.setup()
    renderAttendance()

    await selectClass(user)
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
    expect(screen.queryByText('Taylor Morgan')).not.toBeInTheDocument()
  })

  it('marks attendance in bulk, loads existing statuses, and edits a history record', async () => {
    const user = userEvent.setup()
    renderAttendance()
    await selectClass(user)

    await user.click(screen.getByRole('button', { name: 'Save attendance' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select an attendance status for every listed student.',
    )

    await user.selectOptions(screen.getByLabelText('Attendance status for Jordan Lee'), 'PL')
    await user.click(screen.getByRole('button', { name: 'Save attendance' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Attendance saved successfully.'))
    expect(screen.getByText('Internship Placed')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Attendance status for Jordan Lee'), 'P')
    await user.click(screen.getByRole('button', { name: 'Save attendance' }))
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Attendance history' })).getAllByRole('row')).toHaveLength(2))
    expect(within(screen.getByRole('region', { name: 'Attendance history' })).getAllByRole('row')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('Attendance saved successfully.')
    expect(screen.getByLabelText('Attendance status for Jordan Lee')).toHaveValue('P')

    await user.click(screen.getByRole('button', { name: /Edit attendance for Jordan Lee/ }))
    const dialog = within(screen.getByRole('dialog'))
    await user.selectOptions(dialog.getByLabelText(/Attendance status/), 'E')
    await user.click(dialog.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Official Engagement')).toBeInTheDocument()
  })

  it('displays saved attendance records in history', () => {
    renderAttendance(true, [{
      studentId: students[0].studentId,
      studentName: students[0].fullName,
      date: '2026-11-11',
      subject: 'Physics',
      semester: '3',
      section: 'A',
      attendanceStatus: 'A',
    }])

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
    expect(screen.getByText('Absent')).toBeInTheDocument()
  })
})
