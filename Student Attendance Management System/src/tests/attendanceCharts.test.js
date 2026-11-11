import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'
import attendanceReducer, { markAttendance } from '../features/attendance/attendanceSlice'
import {
  buildAttendanceDistributionData,
  buildAttendanceTrendData,
  buildSemesterAttendanceChartData,
  buildSubjectAttendanceChartData,
} from '../features/attendance/attendanceChartData'
import dashboardReducer, {
  setDashboardSubject,
} from '../features/dashboard/dashboardSlice'
import {
  selectDashboardAttendanceDistribution,
  selectDashboardSubjectChartData,
  selectDashboardTrendData,
  selectSemesterWiseAttendanceChartData,
} from '../features/dashboard/dashboardSelectors'
import reportsReducer, { setReportSubject } from '../features/reports/reportsSlice'
import {
  selectReportAttendanceDistribution,
  selectReportSubjectChartData,
  selectReportTrendData,
} from '../features/reports/reportChartSelectors'
import studentsReducer from '../features/students/studentsSlice'

const records = [
  makeRecord('STU-001', 'P', '2026-01-03', 'Physics', '3'),
  makeRecord('STU-002', 'A', '2026-01-04', 'Physics', '3'),
  makeRecord('STU-003', 'PL', '2026-02-05', 'Chemistry', '4'),
  makeRecord('STU-004', 'E', '2026-02-06', 'Chemistry', '4'),
]

function makeRecord(studentId, attendanceStatus, date, subject, semester) {
  return {
    studentId,
    studentName: studentId,
    date,
    subject,
    semester,
    section: 'A',
    attendanceStatus,
  }
}

function createStore(withRecords = true) {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      attendance: attendanceReducer,
      dashboard: dashboardReducer,
      reports: reportsReducer,
    },
  })

  if (withRecords) records.forEach((record) => store.dispatch(markAttendance(record)))
  return store
}

describe('attendance chart data', () => {
  it('prepares status distribution for P, A, PL, and E using record shares', () => {
    const data = buildAttendanceDistributionData(records)

    expect(data.map(({ status, count }) => [status, count])).toEqual([
      ['P', 1],
      ['A', 1],
      ['PL', 1],
      ['E', 1],
    ])
    expect(data.every(({ share }) => share === 25)).toBe(true)
  })

  it('prepares subject attendance percentages with E included and PL excluded', () => {
    expect(buildSubjectAttendanceChartData(records)).toEqual([
      expect.objectContaining({
        subject: 'Chemistry',
        presentCount: 0,
        absentCount: 0,
        internshipPlacedCount: 1,
        officialEngagementCount: 1,
        totalApplicableRecords: 1,
        attendancePercentage: 100,
      }),
      expect.objectContaining({
        subject: 'Physics',
        totalApplicableRecords: 2,
        attendancePercentage: 50,
      }),
    ])
  })

  it('prepares daily and monthly activity trends', () => {
    const daily = buildAttendanceTrendData(records)
    const monthly = buildAttendanceTrendData(records, 'monthly')

    expect(daily.map(({ period, totalRecords }) => [period, totalRecords])).toEqual([
      ['2026-01-03', 1],
      ['2026-01-04', 1],
      ['2026-02-05', 1],
      ['2026-02-06', 1],
    ])
    expect(monthly.map(({ period, totalRecords }) => [period, totalRecords])).toEqual([
      ['2026-01', 2],
      ['2026-02', 2],
    ])
    expect(monthly[1]).toMatchObject({
      presentCount: 0,
      absentCount: 0,
      internshipPlacedCount: 1,
      officialEngagementCount: 1,
      totalApplicableRecords: 1,
      attendancePercentage: 100,
    })
  })

  it('prepares semester attendance comparisons with shared calculation rules', () => {
    expect(buildSemesterAttendanceChartData(records)).toEqual([
      expect.objectContaining({
        semester: '3',
        totalApplicableRecords: 2,
        attendancePercentage: 50,
      }),
      expect.objectContaining({
        semester: '4',
        internshipPlacedCount: 1,
        officialEngagementCount: 1,
        totalApplicableRecords: 1,
        attendancePercentage: 100,
      }),
    ])
  })

  it('returns empty chart data when there are no records', () => {
    expect(buildAttendanceDistributionData([])).toEqual([])
    expect(buildSubjectAttendanceChartData([])).toEqual([])
    expect(buildAttendanceTrendData([])).toEqual([])
    expect(buildAttendanceTrendData([], 'monthly')).toEqual([])
    expect(buildSemesterAttendanceChartData([])).toEqual([])
  })

  it('derives dashboard chart data from filtered dashboard selectors', () => {
    const store = createStore()
    store.dispatch(setDashboardSubject('Physics'))
    const state = store.getState()

    expect(selectDashboardAttendanceDistribution(state).map(({ status, count }) => [status, count])).toEqual([
      ['P', 1],
      ['A', 1],
      ['PL', 0],
      ['E', 0],
    ])
    expect(selectDashboardSubjectChartData(state).map(({ subject }) => subject)).toEqual(['Physics'])
    expect(selectDashboardTrendData(state).map(({ totalRecords }) => totalRecords)).toEqual([1, 1])
    expect(selectDashboardTrendData(state, 'monthly')).toMatchObject([
      { period: '2026-01', totalRecords: 2, attendancePercentage: 50 },
    ])
    expect(selectSemesterWiseAttendanceChartData(state).map(({ semester }) => semester)).toEqual(['3'])
  })

  it('derives report chart data from currently filtered report records', () => {
    const store = createStore()
    store.dispatch(setReportSubject('Chemistry'))
    const state = store.getState()

    expect(selectReportAttendanceDistribution(state).map(({ status, count }) => [status, count])).toEqual([
      ['P', 0],
      ['A', 0],
      ['PL', 1],
      ['E', 1],
    ])
    expect(selectReportSubjectChartData(state)).toMatchObject([
      {
        subject: 'Chemistry',
        totalApplicableRecords: 1,
        attendancePercentage: 100,
      },
    ])
    expect(selectReportTrendData(state, 'monthly')).toMatchObject([
      {
        period: '2026-02',
        totalRecords: 2,
        totalApplicableRecords: 1,
        attendancePercentage: 100,
      },
    ])
  })

  it('keeps dashboard and report chart selectors empty with no attendance', () => {
    const state = createStore(false).getState()

    expect(selectDashboardAttendanceDistribution(state)).toEqual([])
    expect(selectDashboardSubjectChartData(state)).toEqual([])
    expect(selectDashboardTrendData(state)).toEqual([])
    expect(selectSemesterWiseAttendanceChartData(state)).toEqual([])
    expect(selectReportAttendanceDistribution(state)).toEqual([])
    expect(selectReportSubjectChartData(state)).toEqual([])
    expect(selectReportTrendData(state)).toEqual([])
  })
})
