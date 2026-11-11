export function summarizeAttendanceRecords(records) {
  const summary = {
    totalRecords: records.length,
    presentCount: 0,
    absentCount: 0,
    internshipPlacedCount: 0,
    officialEngagementCount: 0,
  }

  records.forEach((record) => {
    if (record.attendanceStatus === 'P') summary.presentCount += 1
    if (record.attendanceStatus === 'A') summary.absentCount += 1
    if (record.attendanceStatus === 'PL') summary.internshipPlacedCount += 1
    if (record.attendanceStatus === 'E') summary.officialEngagementCount += 1
  })

  const totalApplicableRecords =
    summary.presentCount + summary.absentCount + summary.officialEngagementCount

  return {
    ...summary,
    totalApplicableRecords,
    attendancePercentage: totalApplicableRecords
      ? ((summary.presentCount + summary.officialEngagementCount) / totalApplicableRecords) * 100
      : 0,
  }
}
