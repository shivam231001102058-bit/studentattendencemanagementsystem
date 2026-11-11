import { createSlice } from '@reduxjs/toolkit'

export const reportTypes = [
  { value: 'daily', label: 'Daily attendance' },
  { value: 'monthly', label: 'Monthly attendance' },
  { value: 'student', label: 'Student-wise attendance' },
  { value: 'subject', label: 'Subject-wise attendance' },
  { value: 'semester', label: 'Semester-wise attendance' },
]

export const initialReportsState = {
  status: 'idle',
  error: null,
  reportType: 'daily',
  filters: {
    search: '',
    subject: '',
    semester: '',
    section: '',
    startDate: '',
    endDate: '',
  },
  validationError: null,
}

function isValidDate(value) {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function validateReportDateRange(startDate, endDate) {
  if (!isValidDate(startDate)) return 'Enter a valid start date.'
  if (!isValidDate(endDate)) return 'Enter a valid end date.'
  if (startDate && endDate && endDate < startDate) {
    return 'End date cannot be earlier than start date.'
  }
  return null
}

const reportsSlice = createSlice({
  name: 'reports',
  initialState: initialReportsState,
  reducers: {
    setReportType(state, action) {
      if (reportTypes.some((type) => type.value === action.payload)) {
        state.reportType = action.payload
      }
    },
    setReportSearch(state, action) {
      state.filters.search = action.payload
    },
    setReportSubject(state, action) {
      state.filters.subject = action.payload
    },
    setReportSemester(state, action) {
      state.filters.semester = action.payload
    },
    setReportSection(state, action) {
      state.filters.section = action.payload
    },
    setReportStartDate(state, action) {
      state.filters.startDate = action.payload
      state.validationError = validateReportDateRange(
        state.filters.startDate,
        state.filters.endDate,
      )
    },
    setReportEndDate(state, action) {
      state.filters.endDate = action.payload
      state.validationError = validateReportDateRange(
        state.filters.startDate,
        state.filters.endDate,
      )
    },
    clearReportFilters(state) {
      state.filters = { ...initialReportsState.filters }
      state.validationError = null
    },
  },
})

export const {
  setReportType,
  setReportSearch,
  setReportSubject,
  setReportSemester,
  setReportSection,
  setReportStartDate,
  setReportEndDate,
  clearReportFilters,
} = reportsSlice.actions

export default reportsSlice.reducer
