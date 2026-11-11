import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import filtersReducer from '../features/filters/filtersSlice'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'
import Students from '../pages/Students'
import { mockStudentAttendanceService } from '../services/mockStudentAttendanceService'

function renderStudents() {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      filters: filtersReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: { mockStudentAttendanceService } },
      }),
  })
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <Students />
      </MemoryRouter>
    </Provider>,
  )

  return { ...view, store }
}

async function fillStudentForm(user, { email = 'jordan@college.edu', fullName = 'Jordan Lee' } = {}) {
  const dialog = within(screen.getByRole('dialog'))
  await user.type(dialog.getByLabelText(/student id/i), 'STU-001')
  await user.type(dialog.getByLabelText(/full name/i), fullName)
  await user.selectOptions(dialog.getByLabelText(/department/i), 'Computer Science')
  await user.selectOptions(dialog.getByLabelText(/semester/i), '3')
  await user.selectOptions(dialog.getByLabelText(/section/i), 'A')
  await user.type(dialog.getByLabelText(/email address/i), email)
}

describe('Students page', () => {
  it('refreshes the directory through the async mock service and reports an empty result', async () => {
    renderStudents()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh directory' }))

    expect(screen.getByText('Fetching student records from the mock service…')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'No student records were available from the mock service.',
      )
    })
  })

  it('validates required fields and email before saving', async () => {
    const user = userEvent.setup()
    renderStudents()
    await user.click(screen.getByRole('button', { name: 'Add student' }))

    fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    expect(screen.getByRole('alert')).toHaveTextContent('Student ID is required.')
    expect(within(screen.getByRole('dialog')).getByLabelText(/student id/i))
      .toHaveAttribute('aria-invalid', 'true')
    expect(within(screen.getByRole('dialog')).getByLabelText(/student id/i))
      .toHaveAttribute('aria-describedby', 'student-form-error')

    await fillStudentForm(user, { email: 'not-an-email' })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.')
  })

  it('adds, views, edits, and deletes a student through the directory', async () => {
    const user = userEvent.setup()
    renderStudents()
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    await fillStudentForm(user)
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add student' }),
    )

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Student added successfully.')

    await user.click(screen.getByRole('button', { name: 'View Jordan Lee' }))
    expect(screen.getByRole('dialog', { name: 'Student details' })).toHaveTextContent('Computer Science')
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))

    await user.click(screen.getByRole('button', { name: 'Edit Jordan Lee' }))
    const fullName = within(screen.getByRole('dialog')).getByLabelText(/full name/i)
    await user.clear(fullName)
    await user.type(fullName, 'Jordan Avery Lee')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Jordan Avery Lee')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Jordan Avery Lee' }))
    expect(screen.getByRole('dialog', { name: 'Delete student?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete student' }))
    expect(screen.getByText('No students yet')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Student deleted successfully.')
  })

  it('closes the confirmation dialog with Escape without deleting the student', async () => {
    const user = userEvent.setup()
    renderStudents()
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    await fillStudentForm(user)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add student' }))
    await user.click(screen.getByRole('button', { name: 'Delete Jordan Lee' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete student?' })
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
  })

  it('searches and filters the directory and can clear all filters', async () => {
    const user = userEvent.setup()
    const { store } = renderStudents()
    const add = (studentId, fullName, department, semester, section) => ({
      studentId,
      fullName,
      department,
      semester,
      section,
      email: `${studentId.toLowerCase()}@college.edu`,
      createdDate: '2026-11-11',
    })

    store.dispatch(addStudent(add('STU-001', 'Jordan Lee', 'Computer Science', '3', 'A')))
    store.dispatch(addStudent(add('STU-002', 'Taylor Morgan', 'Engineering', '5', 'B')))
    store.dispatch(addStudent(add('STU-003', 'Jordan Avery', 'Computer Science', '3', 'B')))

    await user.type(
      screen.getByRole('searchbox', { name: 'Search by student ID or full name' }),
      'jordan',
    )
    await user.selectOptions(screen.getByLabelText('Filter by department'), 'Computer Science')
    await user.selectOptions(screen.getByLabelText('Filter by semester'), '3')
    await user.selectOptions(screen.getByLabelText('Filter by section'), 'B')
    expect(screen.getByText('Jordan Avery')).toBeInTheDocument()
    expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument()
    expect(screen.queryByText('Taylor Morgan')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    const directory = screen.getByRole('region', { name: 'Student directory' })
    expect(within(directory).getByText('Jordan Lee')).toBeInTheDocument()
    expect(within(directory).getByText('Jordan Avery')).toBeInTheDocument()
    expect(within(directory).getByText('Taylor Morgan')).toBeInTheDocument()
  })
})
