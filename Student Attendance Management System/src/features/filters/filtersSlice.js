import { createSlice } from '@reduxjs/toolkit'

const filtersSlice = createSlice({
  name: 'filters',
  initialState: {
    search: '',
    dateRange: 'this-week',
    department: '',
    semester: '',
    section: '',
  },
  reducers: {
    setStudentSearch(state, action) {
      state.search = action.payload
    },
    setStudentDepartmentFilter(state, action) {
      state.department = action.payload
    },
    setStudentSemesterFilter(state, action) {
      state.semester = action.payload
    },
    setStudentSectionFilter(state, action) {
      state.section = action.payload
    },
    clearStudentFilters(state) {
      state.search = ''
      state.department = ''
      state.semester = ''
      state.section = ''
    },
  },
})

export const {
  setStudentSearch,
  setStudentDepartmentFilter,
  setStudentSemesterFilter,
  setStudentSectionFilter,
  clearStudentFilters,
} = filtersSlice.actions

export default filtersSlice.reducer
