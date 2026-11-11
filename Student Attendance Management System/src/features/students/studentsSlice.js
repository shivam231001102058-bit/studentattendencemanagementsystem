import { createSlice } from '@reduxjs/toolkit'
import { fetchStudents } from './studentsThunks'

export const initialStudentsState = {
  items: [],
  status: 'idle',
  error: null,
  message: null,
  fetch: {
    status: 'idle',
    error: null,
    message: null,
  },
}

const requiredFields = [
  ['studentId', 'Student ID'],
  ['fullName', 'Full name'],
  ['department', 'Department'],
  ['semester', 'Semester'],
  ['section', 'Section'],
  ['email', 'Email'],
  ['createdDate', 'Created date'],
]

function normalizeStudent(student) {
  return Object.fromEntries(
    requiredFields.map(([field]) => [
      field,
      String(student?.[field] ?? '').trim(),
    ]),
  )
}

function validateStudent(student) {
  for (const [field, label] of requiredFields) {
    if (!student[field]) {
      return `${label} is required.`
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    return 'Enter a valid email address.'
  }

  return null
}

function hasDuplicateId(items, studentId, exceptId) {
  const normalizedId = studentId.toLocaleLowerCase()
  const normalizedExceptId = exceptId?.toLocaleLowerCase()

  return items.some(
    (student) =>
      student.studentId.toLocaleLowerCase() === normalizedId &&
      student.studentId.toLocaleLowerCase() !== normalizedExceptId,
  )
}

const studentsSlice = createSlice({
  name: 'students',
  initialState: initialStudentsState,
  reducers: {
    addStudent: {
      reducer(state, action) {
        state.error = null
        state.message = null
        state.fetch.message = null
        state.fetch.error = null

        const student = normalizeStudent(action.payload)
        const validationError = validateStudent(student)

        if (validationError) {
          state.error = validationError
          return
        }

        if (hasDuplicateId(state.items, student.studentId)) {
          state.error = 'A student with this ID already exists.'
          return
        }

        state.items.push(student)
        state.message = 'Student added successfully.'
      },
    },
    updateStudent: {
      reducer(state, action) {
        state.error = null
        state.message = null
        state.fetch.message = null
        state.fetch.error = null

        const { studentId, student: updatedStudent } = action.payload
        const index = state.items.findIndex(
          (item) => item.studentId.toLocaleLowerCase() === String(studentId).toLocaleLowerCase(),
        )

        if (index === -1) {
          state.error = 'Student not found.'
          return
        }

        const student = normalizeStudent(updatedStudent)
        const validationError = validateStudent(student)

        if (validationError) {
          state.error = validationError
          return
        }

        if (hasDuplicateId(state.items, student.studentId, studentId)) {
          state.error = 'A student with this ID already exists.'
          return
        }

        state.items[index] = student
        state.message = 'Student updated successfully.'
      },
    },
    deleteStudent(state, action) {
      state.error = null
      state.message = null
      state.fetch.message = null
      state.fetch.error = null

      const studentId = String(action.payload).toLocaleLowerCase()
      const index = state.items.findIndex(
        (student) => student.studentId.toLocaleLowerCase() === studentId,
      )

      if (index === -1) {
        state.error = 'Student not found.'
        return
      }

      state.items.splice(index, 1)
      state.message = 'Student deleted successfully.'
    },
    clearStudentFeedback(state) {
      state.error = null
      state.message = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.fetch.status = 'loading'
        state.fetch.error = null
        state.fetch.message = null
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        const existingIds = new Set(
          state.items.map((student) => student.studentId.toLocaleLowerCase()),
        )
        action.payload.forEach((student) => {
          const id = student.studentId.toLocaleLowerCase()
          if (!existingIds.has(id)) {
            state.items.push(student)
            existingIds.add(id)
          }
        })
        state.fetch.status = 'succeeded'
        state.fetch.error = null
        state.fetch.message = action.payload.length
          ? 'Student directory refreshed.'
          : 'No student records were available from the mock service.'
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.fetch.status = 'failed'
        state.fetch.error = action.payload ?? action.error.message ?? 'Student records could not be fetched.'
        state.fetch.message = null
      })
  },
})

export const {
  addStudent,
  updateStudent,
  deleteStudent,
  clearStudentFeedback,
} = studentsSlice.actions

export default studentsSlice.reducer
