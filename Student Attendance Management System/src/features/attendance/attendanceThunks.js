import { createAsyncThunk } from '@reduxjs/toolkit'
import { markBulkAttendance } from './attendanceSlice'

export const saveAttendanceRecords = createAsyncThunk(
  'attendance/saveAttendance',
  async (input, { extra, getState, rejectWithValue }) => {
    if (!input || !Array.isArray(input.records)) {
      return rejectWithValue('Attendance records must be provided as a list.')
    }

    try {
      const prepared = markBulkAttendance(input).payload
      const records = await extra.mockStudentAttendanceService.saveAttendance(
        prepared.records,
        getState().attendance.records,
      )
      return { ...prepared, records }
    } catch (error) {
      return rejectWithValue(error.message || 'Attendance could not be saved.')
    }
  },
  {
    condition: (_, { getState }) => getState().attendance.status !== 'saving',
  },
)
