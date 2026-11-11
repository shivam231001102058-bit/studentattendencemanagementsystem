import { createSlice } from '@reduxjs/toolkit'

export const attendanceStatuses = ['P', 'A', 'PL', 'E']

export const attendanceStatusLabels = {
  P: 'Present',
  A: 'Absent',
  PL: 'Internship Placed',
  E: 'Official Engagement',
}

export const initialAttendanceState = {
  records: [],
  status: 'idle',
  error: null,
  message: null,
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false
  }

  const parsed = new Date(`${date}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

function validateRecord(record) {
  if (!record.studentId) return 'Student ID is required.'
  if (!record.studentName) return 'Student name is required.'
  if (!isValidDate(record.date ?? '')) return 'Enter a valid attendance date.'
  if (!record.subject) return 'Subject is required.'
  if (!String(record.semester ?? '').trim()) return 'Semester is required.'
  if (!record.section) return 'Section is required.'
  if (!attendanceStatuses.includes(record.attendanceStatus)) {
    return 'Select a valid attendance status.'
  }
  return null
}

function duplicateIndex(records, candidate, exceptRecordId) {
  return records.findIndex(
    (record) =>
      record.recordId !== exceptRecordId &&
      record.studentId.toLocaleLowerCase() === candidate.studentId.toLocaleLowerCase() &&
      record.subject.toLocaleLowerCase() === candidate.subject.toLocaleLowerCase() &&
      record.date === candidate.date,
  )
}

function createAttendanceMetadata(record) {
  const timestamp = new Date().toISOString()

  return {
    ...record,
    studentId: String(record.studentId ?? '').trim(),
    studentName: String(record.studentName ?? '').trim(),
    date: String(record.date ?? '').trim(),
    subject: String(record.subject ?? '').trim(),
    semester: String(record.semester ?? '').trim(),
    section: String(record.section ?? '').trim(),
    recordId: record.recordId ?? globalThis.crypto.randomUUID(),
    createdAt: record.createdAt ?? timestamp,
    updatedAt: record.updatedAt ?? timestamp,
  }
}

function applyBulkAttendance(state, { records }) {
  state.error = null
  state.message = null

  if (!records.length) {
    state.error = 'There are no registered students to mark attendance for.'
    return
  }

  const batchKeys = new Set()
  const batchRecordIds = new Set()
  for (const record of records) {
    const validationError = validateRecord(record)
    if (validationError) {
      state.error = validationError
      return
    }

    const key = `${record.studentId.toLocaleLowerCase()}|${record.subject.toLocaleLowerCase()}|${record.date}`
    if (batchKeys.has(key)) {
      state.error = 'The attendance list contains a duplicate student entry.'
      return
    }
    batchKeys.add(key)

    const existingIndex = duplicateIndex(state.records, record)
    if (batchRecordIds.has(record.recordId)) {
      state.error = 'The attendance list contains a duplicate record ID.'
      return
    }
    batchRecordIds.add(record.recordId)
    if (
      existingIndex === -1 &&
      state.records.some((item) => item.recordId === record.recordId)
    ) {
      state.error = 'An attendance record with this ID already exists.'
      return
    }
  }

  for (const record of records) {
    const existingIndex = duplicateIndex(state.records, record)
    if (existingIndex !== -1) {
      state.records[existingIndex] = {
        ...state.records[existingIndex],
        ...record,
        recordId: state.records[existingIndex].recordId,
        createdAt: state.records[existingIndex].createdAt,
        updatedAt: record.updatedAt,
      }
    } else {
      state.records.push(record)
    }
  }

  state.message = 'Attendance saved successfully.'
}

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: initialAttendanceState,
  reducers: {
    markAttendance: {
      prepare(record) {
        return { payload: createAttendanceMetadata(record) }
      },
      reducer(state, action) {
        state.error = null
        state.message = null

        const record = action.payload
        const validationError = validateRecord(record)
        if (validationError) {
          state.error = validationError
          return
        }

        if (duplicateIndex(state.records, record) !== -1) {
          state.error = 'Attendance is already recorded for this student, subject, and date. Update the existing record instead.'
          return
        }

        if (state.records.some((item) => item.recordId === record.recordId)) {
          state.error = 'An attendance record with this ID already exists.'
          return
        }

        state.records.push(record)
        state.message = 'Attendance marked successfully.'
      },
    },
    updateAttendance: {
      reducer(state, action) {
        state.error = null
        state.message = null

        const { recordId, changes } = action.payload
        const index = state.records.findIndex((record) => record.recordId === recordId)

        if (index === -1) {
          state.error = 'Attendance record not found.'
          return
        }

        const updatedRecord = createAttendanceMetadata({
          ...state.records[index],
          ...changes,
          recordId,
          createdAt: state.records[index].createdAt,
        })
        const validationError = validateRecord(updatedRecord)
        if (validationError) {
          state.error = validationError
          return
        }

        if (duplicateIndex(state.records, updatedRecord, recordId) !== -1) {
          state.error = 'Attendance is already recorded for this student, subject, and date.'
          return
        }

        state.records[index] = {
          ...updatedRecord,
          recordId,
          createdAt: state.records[index].createdAt,
          updatedAt: action.payload.updatedAt,
        }
        state.message = 'Attendance updated successfully.'
      },
      prepare(recordId, changes) {
        return {
          payload: {
            recordId,
            changes,
            updatedAt: new Date().toISOString(),
          },
        }
      },
    },
    deleteAttendance(state, action) {
      state.error = null
      state.message = null
      const index = state.records.findIndex((record) => record.recordId === action.payload)

      if (index === -1) {
        state.error = 'Attendance record not found.'
        return
      }

      state.records.splice(index, 1)
      state.message = 'Attendance record deleted.'
    },
    markBulkAttendance: {
      prepare({ date, subject, semester, section, records }) {
        return {
          payload: {
            date,
            subject,
            semester,
            section,
            records: records.map((record) =>
              createAttendanceMetadata({
                ...record,
                date,
                subject,
                semester,
                section,
              }),
            ),
          },
        }
      },
      reducer(state, action) {
        applyBulkAttendance(state, action.payload)
      },
    },
    clearAttendanceFeedback(state) {
      state.error = null
      state.message = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase('attendance/saveAttendance/pending', (state) => {
        state.status = 'saving'
        state.error = null
        state.message = null
      })
      .addCase('attendance/saveAttendance/fulfilled', (state, action) => {
        applyBulkAttendance(state, action.payload)
        state.status = state.error ? 'failed' : 'succeeded'
      })
      .addCase('attendance/saveAttendance/rejected', (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message ?? 'Attendance could not be saved.'
        state.message = null
      })
  },
})

export const {
  markAttendance,
  updateAttendance,
  deleteAttendance,
  markBulkAttendance,
  clearAttendanceFeedback,
} = attendanceSlice.actions

export default attendanceSlice.reducer
