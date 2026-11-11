import { createSelector } from '@reduxjs/toolkit'
import { summarizeAttendanceRecords } from '../attendance/attendanceCalculations'
import {
  buildAttendanceDistributionData,
  buildAttendanceTrendData,
  buildSemesterAttendanceChartData,
  buildSubjectAttendanceChartData,
} from '../attendance/attendanceChartData'

const selectStudents = (state) => state.students.items
const selectAttendanceRecords = (state) => state.attendance.records
const selectDashboardFilters = (state) => state.dashboard.filters
const selectThreshold = (state) => state.dashboard.lowAttendanceThreshold
const selectStudentId = (_state, studentId) => studentId

function getDateStart(dateRange) {
  if (dateRange === 'all-time') return ''

  const days = dateRange === 'last-7-days' ? 7 : 30
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, '0'),
    String(start.getDate()).padStart(2, '0'),
  ].join('-')
}

function matchesDashboardFilters(record, filters) {
  const dateStart = getDateStart(filters.dateRange)

  return (
    (!dateStart || record.date >= dateStart) &&
    (!filters.subject || record.subject === filters.subject) &&
    (!filters.semester || String(record.semester) === filters.semester) &&
    (!filters.section || record.section === filters.section)
  )
}

function getStudentMetrics(student, records) {
  const studentRecords = records.filter(
    (record) =>
      record.studentId.toLocaleLowerCase() === student.studentId.toLocaleLowerCase(),
  )
  const attendance = summarizeAttendanceRecords(studentRecords)

  return {
    studentId: student.studentId,
    studentName: student.fullName,
    department: student.department,
    semester: student.semester,
    section: student.section,
    totalAttendanceRecords: attendance.totalRecords,
    totalApplicableAttendanceRecords: attendance.totalApplicableRecords,
    presentCount: attendance.presentCount,
    absentCount: attendance.absentCount,
    internshipPlacedCount: attendance.internshipPlacedCount,
    officialEngagementCount: attendance.officialEngagementCount,
    attendancePercentage: attendance.attendancePercentage,
  }
}

export const selectFilteredAttendanceRecords = createSelector(
  [selectAttendanceRecords, selectDashboardFilters],
  (records, filters) => records.filter((record) => matchesDashboardFilters(record, filters)),
)

export const selectFilteredDashboardStudents = createSelector(
  [selectStudents, selectDashboardFilters],
  (students, filters) =>
    students.filter(
      (student) =>
        (!filters.semester || String(student.semester) === filters.semester) &&
        (!filters.section || student.section === filters.section),
    ),
)

export const selectTotalStudents = createSelector(
  [selectFilteredDashboardStudents],
  (students) => students.length,
)

export const selectAttendanceStatistics = createSelector(
  [selectFilteredAttendanceRecords],
  summarizeAttendanceRecords,
)

export const selectStudentAttendanceSummaries = createSelector(
  [selectFilteredDashboardStudents, selectFilteredAttendanceRecords],
  (students, records) => students.map((student) => getStudentMetrics(student, records)),
)

export const selectStudentAttendancePercentage = createSelector(
  [selectFilteredDashboardStudents, selectFilteredAttendanceRecords, selectStudentId],
  (students, records, studentId) => {
    const student = students.find(
      (item) => item.studentId.toLocaleLowerCase() === String(studentId).toLocaleLowerCase(),
    )
    return student ? getStudentMetrics(student, records).attendancePercentage : 0
  },
)

export const selectLowAttendanceStudents = createSelector(
  [selectStudentAttendanceSummaries, selectThreshold],
  (students, threshold) =>
    students.filter(
      (student) =>
        student.totalApplicableAttendanceRecords > 0 &&
        student.attendancePercentage < threshold,
    ),
)

export const selectSubjectWiseStatistics = createSelector(
  [selectFilteredAttendanceRecords],
  buildSubjectAttendanceChartData,
)

export const selectDashboardAttendanceDistribution = createSelector(
  [selectFilteredAttendanceRecords],
  buildAttendanceDistributionData,
)

export const selectDashboardSubjectChartData = selectSubjectWiseStatistics

export const selectDashboardTrendData = createSelector(
  [
    selectFilteredAttendanceRecords,
    (_state, grouping = 'daily') => grouping,
  ],
  buildAttendanceTrendData,
)

export const selectSemesterWiseAttendanceChartData = createSelector(
  [selectFilteredAttendanceRecords],
  buildSemesterAttendanceChartData,
)
