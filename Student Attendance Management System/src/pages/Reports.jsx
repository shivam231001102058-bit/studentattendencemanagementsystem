import { Suspense, lazy, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/common/Icon'
import PageIntro from '../components/common/PageIntro'
import { sections, semesters } from '../features/students/studentOptions'
import {
  clearReportFilters,
  reportTypes,
  setReportEndDate,
  setReportSearch,
  setReportSection,
  setReportSemester,
  setReportStartDate,
  setReportSubject,
  setReportType,
} from '../features/reports/reportsSlice'
import {
  selectFilteredReportRecords,
  selectReportData,
  selectReportError,
  selectReportOptions,
} from '../features/reports/reportSelectors'
import { downloadReportCsv } from '../features/reports/reportCsv'
import {
  selectReportAttendanceDistribution,
  selectReportSubjectChartData,
  selectReportTrendData,
} from '../features/reports/reportChartSelectors'
import { attendanceStatusLabels } from '../features/attendance/attendanceSlice'

const AttendanceCharts = lazy(() => import('../components/common/AttendanceCharts'))

const reportColumns = {
  daily: [
    ['Student ID', 'studentId'],
    ['Student name', 'studentName'],
    ['Subject', 'subject'],
    ['Date', 'date'],
    ['Semester', 'semester'],
    ['Section', 'section'],
    ['Status', 'attendanceStatus'],
  ],
  monthly: [
    ['Month', 'period'],
    ['Total records', 'totalRecords'],
    ['Applicable', 'totalApplicableRecords'],
    ['Present', 'presentCount'],
    ['Absent', 'absentCount'],
    ['Official engagement', 'officialEngagementCount'],
    ['Internship placed', 'internshipPlacedCount'],
    ['Attendance', 'attendancePercentage'],
  ],
  student: [
    ['Student ID', 'studentId'],
    ['Student name', 'studentName'],
    ['Semester', 'semester'],
    ['Section', 'section'],
    ['Total records', 'totalRecords'],
    ['Applicable', 'totalApplicableRecords'],
    ['Present', 'presentCount'],
    ['Absent', 'absentCount'],
    ['Official engagement', 'officialEngagementCount'],
    ['Internship placed', 'internshipPlacedCount'],
    ['Attendance', 'attendancePercentage'],
  ],
  subject: [
    ['Subject', 'subject'],
    ['Total records', 'totalRecords'],
    ['Applicable', 'totalApplicableRecords'],
    ['Present', 'presentCount'],
    ['Absent', 'absentCount'],
    ['Official engagement', 'officialEngagementCount'],
    ['Internship placed', 'internshipPlacedCount'],
    ['Attendance', 'attendancePercentage'],
  ],
  semester: [
    ['Semester', 'semester'],
    ['Section', 'section'],
    ['Total records', 'totalRecords'],
    ['Applicable', 'totalApplicableRecords'],
    ['Present', 'presentCount'],
    ['Absent', 'absentCount'],
    ['Official engagement', 'officialEngagementCount'],
    ['Internship placed', 'internshipPlacedCount'],
    ['Attendance', 'attendancePercentage'],
  ],
}

const summaryCards = [
  ['Total applicable records', 'totalApplicableRecords'],
  ['Present', 'presentCount'],
  ['Absent', 'absentCount'],
  ['Official engagement', 'officialEngagementCount'],
  ['Internship placed', 'internshipPlacedCount'],
  ['Attendance', 'attendancePercentage'],
]

function percentage(value) {
  return `${Number(value.toFixed(1))}%`
}

function getCellValue(row, field) {
  if (field === 'attendanceStatus') {
    return `${row.attendanceStatus} — ${attendanceStatusLabels[row.attendanceStatus] ?? row.attendanceStatus}`
  }
  if (field === 'attendancePercentage') {
    return percentage(row[field] ?? 0)
  }
  return row[field] ?? '—'
}

function Reports() {
  const dispatch = useDispatch()
  const { reportType, filters } = useSelector((state) => state.reports)
  const dateError = useSelector(selectReportError)
  const report = useSelector(selectReportData)
  const filteredRecords = useSelector(selectFilteredReportRecords)
  const { subjects } = useSelector(selectReportOptions)
  const [exportMessage, setExportMessage] = useState('')
  const [trendGrouping, setTrendGrouping] = useState('daily')
  const columns = reportColumns[reportType]
  const hasFilters = Object.values(filters).some(Boolean)
  const distributionChartData = useSelector(selectReportAttendanceDistribution)
  const subjectChartData = useSelector(selectReportSubjectChartData)
  const trendChartData = useSelector((state) => selectReportTrendData(state, trendGrouping))

  function exportReport() {
    setExportMessage('')
    const result = downloadReportCsv({ rows: report.rows, reportType })
    if (!result.downloaded) {
      setExportMessage('There are no report results to export.')
    }
  }

  function clearFilters() {
    dispatch(clearReportFilters())
    setExportMessage('')
  }

  return (
    <>
      <PageIntro
        description="Build attendance reports from your registered students and saved attendance records."
        eyebrow="CAMPUS INSIGHTS"
        title="Reports"
      >
        <button
          className="button button-primary"
          disabled={!report.rows.length || Boolean(dateError)}
          onClick={exportReport}
          type="button"
        >
          <Icon name="reports" size={16} />
          Export CSV
        </button>
      </PageIntro>

      <div aria-live="polite" className="report-feedback">
        {dateError && <p className="feedback-error" id="report-date-error" role="alert">{dateError}</p>}
        {exportMessage && <p className="feedback-error" role="status">{exportMessage}</p>}
      </div>

      <section aria-label="Report filters" className="panel report-filter-panel">
        <div className="report-filter-heading">
          <div>
            <h3>Report filters</h3>
            <p>Choose a report and combine filters to narrow the results.</p>
          </div>
          {hasFilters && (
            <button className="clear-filters-button" onClick={clearFilters} type="button">
              Clear filters
            </button>
          )}
        </div>
        <div className="report-filter-grid">
          <label className="report-filter-control report-type-control">
            <span>Report type</span>
            <select
              aria-label="Report type"
              onChange={(event) => dispatch(setReportType(event.target.value))}
              value={reportType}
            >
              {reportTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="report-filter-control">
            <span>Student</span>
            <input
              aria-label="Filter by student ID or name"
              onChange={(event) => dispatch(setReportSearch(event.target.value))}
              placeholder="Search ID or name"
              type="search"
              value={filters.search}
            />
          </label>
          <label className="report-filter-control">
            <span>Subject</span>
            <select aria-label="Filter by subject" onChange={(event) => dispatch(setReportSubject(event.target.value))} value={filters.subject}>
              <option value="">All subjects</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="report-filter-control">
            <span>Semester</span>
            <select aria-label="Filter by semester" onChange={(event) => dispatch(setReportSemester(event.target.value))} value={filters.semester}>
              <option value="">All semesters</option>
              {semesters.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
            </select>
          </label>
          <label className="report-filter-control">
            <span>Section</span>
            <select aria-label="Filter by section" onChange={(event) => dispatch(setReportSection(event.target.value))} value={filters.section}>
              <option value="">All sections</option>
              {sections.map((section) => <option key={section} value={section}>Section {section}</option>)}
            </select>
          </label>
          <label className="report-filter-control">
            <span>Start date</span>
            <input
              aria-label="Report start date"
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? 'report-date-error' : undefined}
              onChange={(event) => dispatch(setReportStartDate(event.target.value))}
              type="date"
              value={filters.startDate}
            />
          </label>
          <label className="report-filter-control">
            <span>End date</span>
            <input
              aria-label="Report end date"
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? 'report-date-error' : undefined}
              onChange={(event) => dispatch(setReportEndDate(event.target.value))}
              type="date"
              value={filters.endDate}
            />
          </label>
        </div>
      </section>

      <section aria-label="Report summary" className="report-summary-grid">
        {summaryCards.map(([label, key]) => (
          <article className="report-summary-card" key={key}>
            <span>{label}</span>
            <strong>{key === 'attendancePercentage'
              ? percentage(report.summary.attendancePercentage)
              : report.summary[key]}</strong>
          </article>
        ))}
      </section>

      <section aria-label="Filtered attendance charts">
        <Suspense fallback={<div className="chart-loading-state" role="status">Loading attendance charts...</div>}>
          <AttendanceCharts
            className="report-chart-grid"
            distributionData={distributionChartData}
            subjectData={subjectChartData}
            trendData={trendChartData}
            trendGrouping={trendGrouping}
            onTrendGroupingChange={setTrendGrouping}
          />
        </Suspense>
      </section>

      <section aria-label="Report results" className="panel report-results-panel">
        <div className="panel-heading report-results-heading">
          <div>
            <h3>{reportTypes.find((type) => type.value === reportType)?.label}</h3>
            <p>
              {report.rows.length} {report.rows.length === 1 ? 'result' : 'results'} · {filteredRecords.length} matching attendance {filteredRecords.length === 1 ? 'record' : 'records'}
            </p>
          </div>
          {!hasFilters && (
            <button className="button button-secondary report-clear-button" onClick={clearFilters} type="button">
              Clear filters
            </button>
          )}
        </div>
        {dateError ? (
          <div className="report-empty-state">
            <span className="report-empty-symbol">!</span>
            <strong>Check the report date range</strong>
            <span>{dateError}</span>
          </div>
        ) : report.rows.length ? (
          <div className="table-scroll report-table-scroll">
            <table className="report-table">
              <thead>
                <tr>{columns.map(([label]) => <th key={label}>{label.toUpperCase()}</th>)}</tr>
              </thead>
              <tbody>
                {report.rows.map((row, index) => (
                  <tr key={row.recordId ?? `${row.studentId ?? row.subject ?? row.semester}-${row.date}-${index}`}>
                    {columns.map(([, field]) => (
                      <td key={field}>{getCellValue(row, field)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="report-empty-state">
            <span className="report-empty-symbol"><Icon name="reports" size={21} /></span>
            <strong>{hasFilters ? 'No records match these filters' : 'No attendance records yet'}</strong>
            <span>
              {hasFilters
                ? 'Adjust or clear your filters to see available report results.'
                : 'Record attendance before generating reports.'}
            </span>
          </div>
        )}
      </section>
    </>
  )
}

export default Reports
