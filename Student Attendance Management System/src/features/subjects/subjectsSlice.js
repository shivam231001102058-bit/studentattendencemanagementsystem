import { createSelector, createSlice } from '@reduxjs/toolkit'
import { attendanceSubjects } from '../attendance/attendanceOptions'

export const initialSubjectsState = {
  items: attendanceSubjects.slice(),
  error: null,
  message: null,
}

function normalizeSubject(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function findDuplicate(items, value, exceptValue) {
  const normalized = value.toLocaleLowerCase()
  const except = exceptValue?.toLocaleLowerCase()
  return items.some((subject) => {
    const current = subject.toLocaleLowerCase()
    return current === normalized && current !== except
  })
}

const subjectsSlice = createSlice({
  name: 'subjects',
  initialState: initialSubjectsState,
  reducers: {
    addSubject(state, action) {
      state.error = null
      state.message = null
      const subject = normalizeSubject(action.payload)
      if (!subject) {
        state.error = 'Subject name is required.'
        return
      }
      if (findDuplicate(state.items, subject)) {
        state.error = 'A subject with this name already exists.'
        return
      }
      state.items.push(subject)
      state.message = 'Subject added successfully.'
    },
    updateSubject(state, action) {
      state.error = null
      state.message = null
      const { subject: original, name } = action.payload ?? {}
      const index = state.items.findIndex(
        (item) => item.toLocaleLowerCase() === String(original).toLocaleLowerCase(),
      )
      const updated = normalizeSubject(name)
      if (index === -1) {
        state.error = 'Subject not found.'
        return
      }
      if (!updated) {
        state.error = 'Subject name is required.'
        return
      }
      if (findDuplicate(state.items, updated, original)) {
        state.error = 'A subject with this name already exists.'
        return
      }
      state.items[index] = updated
      state.message = 'Subject updated successfully.'
    },
    deleteSubject(state, action) {
      state.error = null
      state.message = null
      const subject = String(action.payload).toLocaleLowerCase()
      const index = state.items.findIndex((item) => item.toLocaleLowerCase() === subject)
      if (index === -1) {
        state.error = 'Subject not found.'
        return
      }
      state.items.splice(index, 1)
      state.message = 'Subject deleted. Existing attendance history was preserved.'
    },
    clearSubjectFeedback(state) {
      state.error = null
      state.message = null
    },
  },
})

const selectSubjectItems = (state) => state.subjects.items

export const selectAllSubjects = createSelector(
  [selectSubjectItems],
  (subjects) => subjects.slice(),
)

export const {
  addSubject,
  updateSubject,
  deleteSubject,
  clearSubjectFeedback,
} = subjectsSlice.actions

export default subjectsSlice.reducer
