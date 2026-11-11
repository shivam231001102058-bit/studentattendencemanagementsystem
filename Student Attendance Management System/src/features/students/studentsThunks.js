import { createAsyncThunk } from '@reduxjs/toolkit'

export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (_, { extra, getState, rejectWithValue }) => {
    try {
      return await extra.mockStudentAttendanceService.fetchStudents(
        getState().students.items,
      )
    } catch (error) {
      return rejectWithValue(error.message || 'Student records could not be fetched.')
    }
  },
  {
    condition: (_, { getState }) => getState().students.fetch.status !== 'loading',
  },
)
