import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'
import attendanceReducer, { markAttendance } from '../features/attendance/attendanceSlice'
import reportsReducer, {
  clearReportFilters,
  setReportEndDate,
  setReportSearch,
  setReportSection,
  setReportSemester,
  setReportStartDate,
  setReportSubject,
  setReportType,
  validateReportDateRange,
} from '../features/reports/reportsSlice'
import {
  selectFilteredReportRecords,
  selectReportData,
} from '../features/reports/reportSelectors'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'

const studentRecords = [
  {
    studentId: 'STU-001',
    fullName: 'Jordan Lee',
    department: 'Computer Science',
    semester: '3',
    section: 'A',
    email: 'jordan@college.edu',
    createdDate: '2026-01-01',
  },
  {
    studentId: 'STU-002',
    fullName: 'Taylor, "T" Morgan',
    department: 'Engineering',
    semester: '4',
    section: 'B',
    email: 'taylor@college.edu',
    createdDate: '2026-01-01',
  },
]

const attendanceRecords = [
  {
    studentId: 'STU-001',
    studentName: 'Jordan Lee',
    date: '2026-01-05',
    subject: 'Physics',
    semester: '3',
    section: 'A',
    attendanceStatus: 'P',
  },
  {
    studentId: 'STU-001',
    studentName: 'Jordan Lee',
    date: '2026-01-06',
    subject: 'Physics',
    semester: '3',
    section: 'A',
    attendanceStatus: 'A',
  },
  {
    studentId: 'STU-001',
    studentName: 'Jordan Lee',
    date: '2026-02-05',
    subject: 'Chemistry',
    semester: '3',
    section: 'A',
    attendanceStatus: 'E',
  },
  {
    studentId: 'STU-001',
    studentName: 'Jordan Lee',
    date: '2026-02-06',
    subject: 'Chemistry',
    semester: '3',
    section: 'A',
    attendanceStatus: 'PL',
  },
  {
    studentId: 'STU-002',
    studentName: 'Taylor, "T" Morgan',
    date: '2026-02-07',
    subject: 'Physics',
    semester: '4',
    section: 'B',
    attendanceStatus: 'A',
  },
]

function createStore() {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      attendance: attendanceReducer,
      reports: reportsReducer,
    },
  })
  studentRecords.forEach((student) => store.dispatch(addStudent(student)))
  attendanceRecords.forEach((record) => store.dispatch(markAttendance(record)))
  return store
}

describe('report selectors', () => {
  it('builds daily, monthly, student-wise, subject-wise, and semester-wise reports', () => {
    const store = createStore()
    const expectedTypes = {
      daily: 5,
      monthly: 2,
      student: 2,
      subject: 2,
      semester: 2,
    }

    Object.entries(expectedTypes).forEach(([type, count]) => {
      store.dispatch(setReportType(type))
      expect(selectReportData(store.getState()).rows).toHaveLength(count)
    })

    store.dispatch(setReportType('monthly'))
    expect(selectReportData(store.getState()).rows.map(({ period }) => period)).toEqual([
      '2026-01',
      '2026-02',
    ])
    store.dispatch(setReportType('student'))
    expect(selectReportData(store.getState()).rows[0].studentName).toBe('Jordan Lee')
    store.dispatch(setReportType('subject'))
    expect(selectReportData(store.getState()).rows.map(({ subject }) => subject)).toEqual([
      'Chemistry',
      'Physics',
    ])
    store.dispatch(setReportType('semester'))
    expect(selectReportData(store.getState()).rows.map(({ semester }) => semester)).toEqual([
      '3',
      '4',
    ])
  })

  it('combines student, subject, semester, section, and inclusive date filters', () => {
    const store = createStore()
    store.dispatch(setReportSearch('jordan'))
    store.dispatch(setReportSubject('Physics'))
    store.dispatch(setReportSemester('3'))
    store.dispatch(setReportSection('A'))
    store.dispatch(setReportStartDate('2026-01-06'))
    store.dispatch(setReportEndDate('2026-01-06'))

    expect(selectFilteredReportRecords(store.getState())).toHaveLength(1)
    expect(selectReportData(store.getState()).rows[0]).toMatchObject({
      studentId: 'STU-001',
      attendanceStatus: 'A',
      date: '2026-01-06',
    })

    store.dispatch(setReportSearch('STU-002'))
    expect(selectFilteredReportRecords(store.getState())).toEqual([])
  })

  it('validates actual dates and rejects an end date earlier than the start date', () => {
    expect(validateReportDateRange('2026-02-30', '')).toBe('Enter a valid start date.')
    expect(validateReportDateRange('', '2026-02-30')).toBe('Enter a valid end date.')
    expect(validateReportDateRange('2026-02-02', '2026-02-01')).toBe(
      'End date cannot be earlier than start date.',
    )
    expect(validateReportDateRange('2026-02-01', '2026-02-02')).toBeNull()
  })

  it('calculates report attendance with P and E attended and PL excluded', () => {
    const store = createStore()
    store.dispatch(setReportSearch('STU-001'))
    const { summary } = selectReportData(store.getState())

    expect(summary).toMatchObject({
      totalRecords: 4,
      totalApplicableRecords: 3,
      presentCount: 1,
      absentCount: 1,
      officialEngagementCount: 1,
      internshipPlacedCount: 1,
      attendancePercentage: (2 / 3) * 100,
    })
  })

  it('handles zero applicable records with a zero percentage', () => {
    const store = createStore()
    store.dispatch(setReportSubject('Chemistry'))
    store.dispatch(setReportSearch('STU-001'))
    store.dispatch(setReportStartDate('2026-02-06'))
    store.dispatch(setReportEndDate('2026-02-06'))

    expect(selectReportData(store.getState()).summary).toMatchObject({
      totalRecords: 1,
      totalApplicableRecords: 0,
      internshipPlacedCount: 1,
      attendancePercentage: 0,
    })
  })

  it('clears all report filters and memoizes selectors', () => {
    const store = createStore()
    store.dispatch(setReportSubject('Physics'))
    store.dispatch(setReportStartDate('2026-01-05'))
    store.dispatch(clearReportFilters())
    const state = store.getState()

    expect(state.reports.filters).toEqual({
      search: '',
      subject: '',
      semester: '',
      section: '',
      startDate: '',
      endDate: '',
    })
    expect(selectReportData(state)).toBe(selectReportData(state))
  })
})
