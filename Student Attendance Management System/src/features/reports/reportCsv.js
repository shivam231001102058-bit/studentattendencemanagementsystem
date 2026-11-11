const csvColumns = [
  ['Period', 'period'],
  ['Student ID', 'studentId'],
  ['Student name', 'studentName'],
  ['Subject', 'subject'],
  ['Date', 'date'],
  ['Semester', 'semester'],
  ['Section', 'section'],
  ['Total records', 'totalRecords'],
  ['Applicable records', 'totalApplicableRecords'],
  ['Present', 'presentCount'],
  ['Absent', 'absentCount'],
  ['Official engagement', 'officialEngagementCount'],
  ['Internship placed', 'internshipPlacedCount'],
  ['Attendance percentage', 'attendancePercentage'],
  ['Attendance status', 'attendanceStatus'],
]

export function escapeCsvCell(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

export function buildReportCsv(rows) {
  if (!rows.length) return ''

  const header = csvColumns.map(([label]) => escapeCsvCell(label)).join(',')
  const body = rows.map((row) =>
    csvColumns.map(([, field]) => {
      if (field === 'attendancePercentage') {
        return escapeCsvCell(
          row[field] === undefined || row[field] === null
            ? ''
            : `${Number(row[field].toFixed(2))}%`,
        )
      }
      return escapeCsvCell(row[field])
    }).join(','),
  )

  return `\uFEFF${[header, ...body].join('\r\n')}\r\n`
}

export function createReportFilename(reportType, date = new Date()) {
  const reportName = String(reportType)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  const timestamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

  return `${reportName}-attendance-report-${timestamp}.csv`
}

export function downloadReportCsv({
  rows,
  reportType,
  documentObject = globalThis.document,
  urlApi = globalThis.URL,
  BlobConstructor = globalThis.Blob,
}) {
  if (!rows.length) {
    return { downloaded: false, reason: 'empty' }
  }

  const csv = buildReportCsv(rows)
  const blob = new BlobConstructor([csv], { type: 'text/csv;charset=utf-8' })
  const objectUrl = urlApi.createObjectURL(blob)
  const link = documentObject.createElement('a')
  link.href = objectUrl
  link.download = createReportFilename(reportType)
  link.style.display = 'none'
  documentObject.body.append(link)
  try {
    link.click()
  } finally {
    link.remove()
    urlApi.revokeObjectURL(objectUrl)
  }

  return { downloaded: true, filename: link.download }
}
