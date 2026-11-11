import { summarizeAttendanceRecords } from './attendanceCalculations'

export const attendanceStatusChartDetails = [
  { key: 'presentCount', status: 'P', label: 'Present', color: '#299b72' },
  { key: 'absentCount', status: 'A', label: 'Absent', color: '#cf5963' },
  { key: 'internshipPlacedCount', status: 'PL', label: 'Internship placed', color: '#8162c8' },
  { key: 'officialEngagementCount', status: 'E', label: 'Official engagement', color: '#d49a3d' },
]

export function buildAttendanceDistributionData(records) {
  const summary = summarizeAttendanceRecords(records)

  if (!summary.totalRecords) return []

  return attendanceStatusChartDetails.map((detail) => ({
    ...detail,
    count: summary[detail.key],
    share: (summary[detail.key] / summary.totalRecords) * 100,
  }))
}

export function buildSubjectAttendanceChartData(records) {
  const groupedRecords = new Map()

  records.forEach((record) => {
    const group = groupedRecords.get(record.subject) ?? []
    group.push(record)
    groupedRecords.set(record.subject, group)
  })

  return [...groupedRecords.entries()]
    .map(([subject, group]) => {
      const summary = summarizeAttendanceRecords(group)
      return {
        subject,
        attendancePercentage: summary.attendancePercentage,
        totalRecords: summary.totalRecords,
        totalApplicableRecords: summary.totalApplicableRecords,
        presentCount: summary.presentCount,
        absentCount: summary.absentCount,
        internshipPlacedCount: summary.internshipPlacedCount,
        officialEngagementCount: summary.officialEngagementCount,
      }
    })
    .sort((first, second) => first.subject.localeCompare(second.subject))
}

function getPeriodKey(date, grouping) {
  return grouping === 'monthly' ? date.slice(0, 7) : date
}

function getPeriodLabel(period, grouping) {
  if (grouping === 'daily') return period

  const date = new Date(`${period}-01T00:00:00.000Z`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  })
}

export function buildAttendanceTrendData(records, grouping = 'daily') {
  const groupedRecords = new Map()

  records.forEach((record) => {
    const period = getPeriodKey(record.date, grouping)
    const group = groupedRecords.get(period) ?? []
    group.push(record)
    groupedRecords.set(period, group)
  })

  return [...groupedRecords.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([period, group]) => ({
      period,
      label: getPeriodLabel(period, grouping),
      ...summarizeAttendanceRecords(group),
    }))
}

export function buildSemesterAttendanceChartData(records) {
  const groupedRecords = new Map()

  records.forEach((record) => {
    const semester = String(record.semester)
    const group = groupedRecords.get(semester) ?? []
    group.push(record)
    groupedRecords.set(semester, group)
  })

  return [...groupedRecords.entries()]
    .map(([semester, group]) => ({
      semester,
      label: `Semester ${semester}`,
      ...summarizeAttendanceRecords(group),
    }))
    .sort((first, second) => first.semester.localeCompare(second.semester, undefined, { numeric: true }))
}
