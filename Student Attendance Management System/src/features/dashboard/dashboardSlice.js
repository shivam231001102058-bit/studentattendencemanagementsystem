import { createSlice } from '@reduxjs/toolkit'

export const initialDashboardState = {
  filters: {
    dateRange: 'all-time',
    subject: '',
    semester: '',
    section: '',
  },
  lowAttendanceThreshold: 45,
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: initialDashboardState,
  reducers: {
    setDashboardDateRange(state, action) {
      state.filters.dateRange = action.payload
    },
    setDashboardSubject(state, action) {
      state.filters.subject = action.payload
    },
    setDashboardSemester(state, action) {
      state.filters.semester = action.payload
    },
    setDashboardSection(state, action) {
      state.filters.section = action.payload
    },
    clearDashboardFilters(state) {
      state.filters = { ...initialDashboardState.filters }
    },
    setLowAttendanceThreshold(state, action) {
      const threshold = Number(action.payload)
      if (Number.isFinite(threshold) && threshold >= 0 && threshold <= 100) {
        state.lowAttendanceThreshold = threshold
      }
    },
  },
})

export const {
  setDashboardDateRange,
  setDashboardSubject,
  setDashboardSemester,
  setDashboardSection,
  clearDashboardFilters,
  setLowAttendanceThreshold,
} = dashboardSlice.actions

export default dashboardSlice.reducer
