import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'
import attendanceReducer, { markAttendance } from '../features/attendance/attendanceSlice'
import dashboardReducer, {
  setDashboardDateRange,
  setDashboardSection,
  setDashboardSemester,
  setDashboardSubject,
  setLowAttendanceThreshold,
} from '../features/dashboard/dashboardSlice'
import {
  selectAttendanceStatistics,
  selectFilteredAttendanceRecords,
  selectLowAttendanceStudents,
  selectStudentAttendancePercentage,
  selectStudentAttendanceSummaries,
  selectSubjectWiseStatistics,
  selectTotalStudents,
} from '../features/dashboard/dashboardSelectors'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'

const today = new Date().toISOString().slice(0, 10)

const makeStudent = (studentId, semester = '3', section = 'A') => ({
  studentId,
  fullName: `Student ${studentId}`,
  department: 'Computer Science',
  semester,
  section,
  email: `${studentId.toLowerCase()}@college.edu`,
  createdDate: today,
})

const makeRecord = (
  studentId,
  attendanceStatus,
  { subject = 'Programming', semester = '3', section = 'A', date = today } = {},
) => ({
  studentId,
  studentName: `Student ${studentId}`,
  date,
  subject,
  semester,
  section,
  attendanceStatus,
})

function createStore() {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      attendance: attendanceReducer,
      dashboard: dashboardReducer,
    },
  })

  ;[
    makeStudent('STU-001'),
    makeStudent('STU-002'),
    makeStudent('STU-003', '4', 'B'),
    makeStudent('STU-004'),
  ].forEach((student) => store.dispatch(addStudent(student)))

  const records = [
    makeRecord('STU-001', 'P', { date: offsetDate(0) }),
    makeRecord('STU-001', 'A', { date: offsetDate(1) }),
    makeRecord('STU-001', 'E', { date: offsetDate(2) }),
    makeRecord('STU-001', 'PL', { date: offsetDate(3) }),
    makeRecord('STU-002', 'P', { date: offsetDate(0) }),
    makeRecord('STU-002', 'A', { date: offsetDate(1) }),
    makeRecord('STU-002', 'A', { date: offsetDate(2) }),
    makeRecord('STU-002', 'A', { date: offsetDate(3) }),
    makeRecord('STU-002', 'A', { date: offsetDate(4) }),
    makeRecord('STU-003', 'A', { subject: 'Mathematics', semester: '4', section: 'B' }),
    makeRecord('STU-004', 'P', { subject: 'Mathematics', date: '2020-01-01' }),
  ]
  records.forEach((record) => store.dispatch(markAttendance(record)))

  return store
}

function offsetDate(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

describe('dashboard analytics selectors', () => {
  it('counts students and attendance statuses from Redux records', () => {
    const state = createStore().getState()

    expect(selectTotalStudents(state)).toBe(4)
    expect(selectAttendanceStatistics(state)).toMatchObject({
      totalRecords: 11,
      totalApplicableRecords: 10,
      presentCount: 3,
      absentCount: 6,
      internshipPlacedCount: 1,
      officialEngagementCount: 1,
    })
  })

  it('calculates individual percentages with placement excluded and engagement included', () => {
    const state = createStore().getState()

    expect(selectStudentAttendancePercentage(state, 'STU-001')).toBeCloseTo(66.67, 2)
    expect(selectStudentAttendanceSummaries(state)[0]).toMatchObject({
      studentId: 'STU-001',
      totalAttendanceRecords: 4,
      totalApplicableAttendanceRecords: 3,
      presentCount: 1,
      absentCount: 1,
      internshipPlacedCount: 1,
      officialEngagementCount: 1,
      attendancePercentage: 66.66666666666666,
    })
  })

  it('applies the 45 percent low-attendance threshold and excludes students without records', () => {
    const store = createStore()
    const lowAttendance = selectLowAttendanceStudents(store.getState())

    expect(lowAttendance.map(({ studentId }) => studentId)).toEqual(['STU-002', 'STU-003'])
    store.dispatch(setLowAttendanceThreshold(50))
    expect(selectLowAttendanceStudents(store.getState()).map(({ studentId }) => studentId)).toEqual([
      'STU-002',
      'STU-003',
    ])
    store.dispatch(setLowAttendanceThreshold(70))
    expect(selectLowAttendanceStudents(store.getState()).map(({ studentId }) => studentId)).toEqual([
      'STU-001',
      'STU-002',
      'STU-003',
    ])
  })

  it('does not warn students exactly at the configured threshold', () => {
    const store = configureStore({
      reducer: {
        students: studentsReducer,
        attendance: attendanceReducer,
        dashboard: dashboardReducer,
      },
    })
    store.dispatch(addStudent(makeStudent('STU-BOUNDARY')))

    for (let index = 0; index < 20; index += 1) {
      store.dispatch(markAttendance(makeRecord(
        'STU-BOUNDARY',
        index < 9 ? 'P' : 'A',
        { subject: `Class ${index}` },
      )))
    }

    expect(selectStudentAttendancePercentage(store.getState(), 'STU-BOUNDARY')).toBe(45)
    expect(selectLowAttendanceStudents(store.getState())).toEqual([])
  })

  it('handles zero applicable attendance without division by zero', () => {
    const store = configureStore({
      reducer: {
        students: studentsReducer,
        attendance: attendanceReducer,
        dashboard: dashboardReducer,
      },
    })
    store.dispatch(addStudent(makeStudent('STU-ZERO')))

    expect(selectStudentAttendancePercentage(store.getState(), 'STU-ZERO')).toBe(0)
    expect(selectStudentAttendanceSummaries(store.getState())[0]).toMatchObject({
      totalAttendanceRecords: 0,
      totalApplicableAttendanceRecords: 0,
      attendancePercentage: 0,
    })
    expect(selectLowAttendanceStudents(store.getState())).toEqual([])
  })

  it('computes subject totals and excludes internship placement from applicable percentages', () => {
    const subjects = selectSubjectWiseStatistics(createStore().getState())

    expect(subjects).toEqual([
      expect.objectContaining({
        subject: 'Mathematics',
        totalRecords: 2,
        totalApplicableRecords: 2,
        presentCount: 1,
        absentCount: 1,
        officialEngagementCount: 0,
        attendancePercentage: 50,
      }),
      expect.objectContaining({
        subject: 'Programming',
        totalRecords: 9,
        totalApplicableRecords: 8,
        presentCount: 2,
        absentCount: 5,
        internshipPlacedCount: 1,
        officialEngagementCount: 1,
        attendancePercentage: 37.5,
      }),
    ])
  })

  it('combines date range, subject, semester, and section dashboard filters', () => {
    const store = createStore()
    store.dispatch(setDashboardDateRange('last-7-days'))
    store.dispatch(setDashboardSubject('Programming'))
    store.dispatch(setDashboardSemester('3'))
    store.dispatch(setDashboardSection('A'))

    expect(selectFilteredAttendanceRecords(store.getState())).toHaveLength(9)
    expect(selectTotalStudents(store.getState())).toBe(3)
    expect(selectAttendanceStatistics(store.getState()).totalRecords).toBe(9)
    expect(selectSubjectWiseStatistics(store.getState()).map(({ subject }) => subject)).toEqual([
      'Programming',
    ])

    store.dispatch(setDashboardDateRange('all-time'))
    expect(selectFilteredAttendanceRecords(store.getState())).toHaveLength(9)
  })

  it('memoizes selector output until its Redux inputs change', () => {
    const state = createStore().getState()

    expect(selectAttendanceStatistics(state)).toBe(selectAttendanceStatistics(state))
    expect(selectSubjectWiseStatistics(state)).toBe(selectSubjectWiseStatistics(state))
    expect(selectStudentAttendanceSummaries(state)).toBe(selectStudentAttendanceSummaries(state))
  })
})
