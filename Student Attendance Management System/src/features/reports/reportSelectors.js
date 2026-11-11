import { createSelector } from '@reduxjs/toolkit'
import { summarizeAttendanceRecords } from '../attendance/attendanceCalculations'

const selectAttendanceRecords = (state) => state.attendance.records
const selectRegisteredStudents = (state) => state.students.items
const selectReportFilters = (state) => state.reports.filters
const selectReportType = (state) => state.reports.reportType
const selectReportValidationError = (state) => state.reports.validationError

function matchesFilters(record, filters, students) {
  if (filters.startDate && record.date < filters.startDate) return false
  if (filters.endDate && record.date > filters.endDate) return false
  if (filters.subject && record.subject !== filters.subject) return false
  if (filters.semester && String(record.semester) !== filters.semester) return false
  if (filters.section && record.section !== filters.section) return false

  if (filters.search.trim()) {
    const query = filters.search.trim().toLocaleLowerCase()
    const matchingStudent = students.find(
      (student) =>
        student.studentId.toLocaleLowerCase() === record.studentId.toLocaleLowerCase(),
    )
    const studentName = matchingStudent?.fullName ?? record.studentName
    if (
      !record.studentId.toLocaleLowerCase().includes(query) &&
      !studentName.toLocaleLowerCase().includes(query)
    ) {
      return false
    }
  }

  return true
}

const selectFilteredRecords = createSelector(
  [
    selectAttendanceRecords,
    selectRegisteredStudents,
    selectReportFilters,
    selectReportValidationError,
  ],
  (records, students, filters, validationError) =>
    validationError || validateFilters(filters)
      ? []
      : records.filter((record) => matchesFilters(record, filters, students)),
)

function validateFilters(filters) {
  return Boolean(filters.startDate && filters.endDate && filters.endDate < filters.startDate)
}

function aggregateRecords(records, getKey, getFields) {
  const groups = new Map()

  records.forEach((record) => {
    const key = getKey(record)
    if (!groups.has(key)) {
      groups.set(key, {
        ...getFields(record),
        records: [],
      })
    }
    groups.get(key).records.push(record)
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      ...summarizeAttendanceRecords(group.records),
      semester:
        group.semester === 'All'
          ? 'All'
          : getDistinctValue(group.records, 'semester'),
      section:
        group.section === 'All'
          ? 'All'
          : getDistinctValue(group.records, 'section'),
    }))
    .sort((first, second) =>
      String(first.sortKey).localeCompare(String(second.sortKey)),
    )
}

function getDistinctValue(records, field) {
  const values = [...new Set(records.map((record) => String(record[field])))]
  return values.length === 1 ? values[0] : 'Multiple'
}

function buildReportRows(type, records) {
  if (type === 'daily') {
    return [...records]
      .sort((first, second) => second.date.localeCompare(first.date))
      .map((record) => ({
        ...record,
        ...summarizeAttendanceRecords([record]),
        sortKey: record.date,
      }))
  }

  if (type === 'monthly') {
    return aggregateRecords(
      records,
      (record) => record.date.slice(0, 7),
      (record) => ({
        date: record.date.slice(0, 7),
        period: record.date.slice(0, 7),
        subject: 'All subjects',
        semester: 'All',
        section: 'All',
        sortKey: record.date.slice(0, 7),
      }),
    )
  }

  return []
}

function buildAggregatedReportRows(type, records, students) {
  if (type === 'student') {
    return aggregateRecords(
      records,
      (record) => record.studentId.toLocaleLowerCase(),
      (record) => ({
        studentId: record.studentId,
        studentName:
          students.find(
            (student) =>
              student.studentId.toLocaleLowerCase() === record.studentId.toLocaleLowerCase(),
          )?.fullName ?? record.studentName,
        subject: 'All subjects',
        date: '',
        semester: record.semester,
        section: record.section,
        sortKey: record.studentName,
      }),
    )
  }

  if (type === 'subject') {
    return aggregateRecords(
      records,
      (record) => record.subject,
      (record) => ({
        studentId: '',
        studentName: '',
        subject: record.subject,
        date: '',
        semester: record.semester,
        section: record.section,
        sortKey: record.subject,
      }),
    )
  }

  return aggregateRecords(
    records,
    (record) => String(record.semester),
    (record) => ({
      studentId: '',
      studentName: '',
      subject: 'All subjects',
      date: '',
      semester: String(record.semester),
      section: record.section,
      sortKey: String(record.semester).padStart(3, '0'),
    }),
  )
}

export const selectFilteredReportRecords = selectFilteredRecords
export const selectReportRows = createSelector(
  [selectFilteredRecords, selectReportType, selectRegisteredStudents],
  (records, type, students) => {
    if (type === 'daily' || type === 'monthly') return buildReportRows(type, records)
    return buildAggregatedReportRows(type, records, students)
  },
)

export const selectReportSummary = createSelector(
  [selectFilteredRecords],
  (records) => summarizeAttendanceRecords(records),
)

export const selectReportError = (state) => selectReportValidationError(state)

export const selectReportData = createSelector(
  [selectReportRows, selectReportSummary, selectFilteredRecords, selectReportType],
  (rows, summary, records, reportType) => ({
    rows,
    summary,
    filteredRecordCount: records.length,
    reportType,
  }),
)

export const selectReportOptions = createSelector(
  [selectAttendanceRecords],
  (records) => ({
    subjects: [...new Set(records.map((record) => record.subject))].sort(),
  }),
)
