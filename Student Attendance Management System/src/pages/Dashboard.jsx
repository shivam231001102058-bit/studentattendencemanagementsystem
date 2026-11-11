import { Suspense, lazy, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Icon from '../components/common/Icon'
import PageIntro from '../components/common/PageIntro'
import { sections, semesters } from '../features/students/studentOptions'
import {
  clearDashboardFilters,
  setDashboardDateRange,
  setDashboardSection,
  setDashboardSemester,
  setDashboardSubject,
  setLowAttendanceThreshold,
} from '../features/dashboard/dashboardSlice'
import {
  selectAttendanceStatistics,
  selectDashboardAttendanceDistribution,
  selectDashboardSubjectChartData,
  selectDashboardTrendData,
  selectLowAttendanceStudents,
  selectSemesterWiseAttendanceChartData,
  selectStudentAttendanceSummaries,
  selectSubjectWiseStatistics,
  selectTotalStudents,
} from '../features/dashboard/dashboardSelectors'

const AttendanceCharts = lazy(() => import('../components/common/AttendanceCharts'))

const dateRanges = [
  { value: 'all-time', label: 'All time' },
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
]

const metrics = [
  { label: 'Registered students', key: 'totalStudents', icon: 'students', tone: 'blue' },
  { label: 'Attendance records', key: 'totalRecords', icon: 'calendar', tone: 'violet' },
  { label: 'Present', key: 'presentCount', icon: 'attendance', tone: 'green' },
  { label: 'Absent', key: 'absentCount', icon: 'reports', tone: 'amber' },
  { label: 'Internship placed', key: 'internshipPlacedCount', icon: 'students', tone: 'purple' },
  { label: 'Official engagement', key: 'officialEngagementCount', icon: 'calendar', tone: 'teal' },
]

function percentage(value) {
  return `${Number(value.toFixed(1))}%`
}

function MetricCard({ label, value, icon, tone }) {
  return (
    <article className="metric-card analytics-metric-card">
      <div className={`metric-icon tone-${tone}`}><Icon name={icon} size={19} /></div>
      <p className="metric-label">{label}</p>
      <div className="metric-value-row"><strong>{value}</strong></div>
    </article>
  )
}

function AttendanceBadge({ count, status }) {
  return <span className={`analytics-status analytics-${status}`}>{count}</span>
}

function Dashboard() {
  const [trendGrouping, setTrendGrouping] = useState('daily')
  const dispatch = useDispatch()
  const filters = useSelector((state) => state.dashboard.filters)
  const threshold = useSelector((state) => state.dashboard.lowAttendanceThreshold)
  const totalStudents = useSelector(selectTotalStudents)
  const attendance = useSelector(selectAttendanceStatistics)
  const studentSummaries = useSelector(selectStudentAttendanceSummaries)
  const lowAttendanceStudents = useSelector(selectLowAttendanceStudents)
  const subjects = useSelector(selectSubjectWiseStatistics)
  const distributionChartData = useSelector(selectDashboardAttendanceDistribution)
  const subjectChartData = useSelector(selectDashboardSubjectChartData)
  const trendChartData = useSelector((state) => selectDashboardTrendData(state, trendGrouping))
  const semesterChartData = useSelector(selectSemesterWiseAttendanceChartData)
  const allStudents = useSelector((state) => state.students.items)
  const allRecords = useSelector((state) => state.attendance.records)
  const availableSubjects = [...new Set(allRecords.map((record) => record.subject))]
    .sort((first, second) => first.localeCompare(second))
  const hasFilters = Boolean(
    filters.dateRange !== 'all-time' || filters.subject || filters.semester || filters.section,
  )
  const visibleStatistics = {
    ...attendance,
    totalStudents,
  }
  const visibleSummaries = studentSummaries

  function changeFilter(action) {
    return (event) => dispatch(action(event.target.value))
  }

  return (
    <>
      <PageIntro
        description="A live overview of registered students and recorded attendance."
        eyebrow="CAMPUS ANALYTICS"
        title="Dashboard"
      >
        <Link className="button button-primary" to="/attendance">
          Mark attendance <Icon name="arrowRight" size={17} />
        </Link>
      </PageIntro>

      <section aria-label="Dashboard analytics filters" className="panel dashboard-filter-panel">
        <div className="dashboard-filter-heading">
          <div>
            <h3>Analytics filters</h3>
            <p>Apply filters to attendance and student summaries.</p>
          </div>
          {hasFilters && (
            <button className="clear-filters-button" onClick={() => dispatch(clearDashboardFilters())} type="button">
              Reset filters
            </button>
          )}
        </div>
        <div className="dashboard-filters">
          <label className="dashboard-filter">
            <span>Date range</span>
            <select
              aria-label="Dashboard date range"
              onChange={changeFilter(setDashboardDateRange)}
              value={filters.dateRange}
            >
              {dateRanges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
            </select>
          </label>
          <label className="dashboard-filter">
            <span>Subject</span>
            <select aria-label="Dashboard subject" onChange={changeFilter(setDashboardSubject)} value={filters.subject}>
              <option value="">All subjects</option>
              {availableSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="dashboard-filter">
            <span>Semester</span>
            <select aria-label="Dashboard semester" onChange={changeFilter(setDashboardSemester)} value={filters.semester}>
              <option value="">All semesters</option>
              {semesters.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
            </select>
          </label>
          <label className="dashboard-filter">
            <span>Section</span>
            <select aria-label="Dashboard section" onChange={changeFilter(setDashboardSection)} value={filters.section}>
              <option value="">All sections</option>
              {sections.map((section) => <option key={section} value={section}>Section {section}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section aria-label="Attendance statistics" className="metrics-grid analytics-metrics-grid">
        {metrics.map(({ key, ...metric }) => (
          <MetricCard
            key={key}
            {...metric}
            value={key === 'totalStudents'
              ? visibleStatistics.totalStudents
              : visibleStatistics[key]}
          />
        ))}
      </section>

      <section aria-label="Dashboard attendance charts">
        <Suspense fallback={<div className="chart-loading-state" role="status">Loading attendance charts...</div>}>
          <AttendanceCharts
            distributionData={distributionChartData}
            subjectData={subjectChartData}
            trendData={trendChartData}
            trendGrouping={trendGrouping}
            onTrendGroupingChange={setTrendGrouping}
            semesterData={semesterChartData}
            showSemesterChart
          />
        </Suspense>
      </section>

      <section className="dashboard-grid analytics-grid">
        <article className="panel analytics-panel student-analytics-panel">
          <div className="panel-heading">
            <div>
              <h3>Student attendance summary</h3>
              <p>Attendance rates use present and official engagement as attended; internship placement is excluded.</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="analytics-table student-analytics-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>RECORDS</th>
                  <th>PRESENT</th>
                  <th>ABSENT</th>
                  <th>PLACED</th>
                  <th>ENGAGEMENT</th>
                  <th>ATTENDANCE</th>
                </tr>
              </thead>
              <tbody>
                {visibleSummaries.map((student) => (
                  <tr key={student.studentId}>
                    <td>
                      <span className="student-name-copy">
                        <strong>{student.studentName}</strong>
                        <span>{student.studentId}</span>
                      </span>
                    </td>
                    <td>{student.totalAttendanceRecords}</td>
                    <td><AttendanceBadge count={student.presentCount} status="present" /></td>
                    <td><AttendanceBadge count={student.absentCount} status="absent" /></td>
                    <td><AttendanceBadge count={student.internshipPlacedCount} status="placed" /></td>
                    <td><AttendanceBadge count={student.officialEngagementCount} status="engagement" /></td>
                    <td>
                      <strong className={student.attendancePercentage < threshold && student.totalApplicableAttendanceRecords ? 'low-rate-text' : ''}>
                        {percentage(student.attendancePercentage)}
                      </strong>
                      {student.totalApplicableAttendanceRecords === 0 && <span className="no-rate-note">No applicable records</span>}
                    </td>
                  </tr>
                ))}
                {visibleSummaries.length === 0 && (
                  <tr>
                    <td className="student-empty-cell" colSpan="7">
                      <div className="student-empty-state">
                        <span className="student-empty-icon"><Icon name="students" size={22} /></span>
                        <strong>{allStudents.length ? 'No students match these filters' : 'No registered students yet'}</strong>
                        <span>Student attendance summaries will appear when students are registered.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel analytics-panel low-attendance-panel">
          <div className="panel-heading">
            <div>
              <h3>Low attendance</h3>
              <p>Students below the attendance threshold</p>
            </div>
            <label className="threshold-control">
              <span>Threshold</span>
              <input
                aria-label="Low attendance threshold percentage"
                max="100"
                min="0"
                onChange={(event) => dispatch(setLowAttendanceThreshold(event.target.value))}
                type="number"
                value={threshold}
              />
              <span>%</span>
            </label>
          </div>
          {lowAttendanceStudents.length > 0 ? (
            <ul className="low-attendance-list">
              {lowAttendanceStudents.map((student) => (
                <li key={student.studentId}>
                  <span className="low-attendance-icon" aria-hidden="true">!</span>
                  <span className="low-attendance-name">
                    <strong>{student.studentName}</strong>
                    <small>{student.studentId} · Semester {student.semester}, Section {student.section}</small>
                  </span>
                  <strong className="low-rate-text">{percentage(student.attendancePercentage)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <div className="analytics-empty-state">
              <span className="analytics-empty-icon">{attendance.totalApplicableRecords ? '✓' : '—'}</span>
              <strong>{attendance.totalApplicableRecords ? 'No students below threshold' : 'No attendance data yet'}</strong>
              <span>
                {attendance.totalApplicableRecords
                  ? `Students with no applicable records are excluded. Threshold: ${threshold}%.`
                  : 'Record attendance to identify students who may need support.'}
              </span>
            </div>
          )}
        </article>
      </section>

      <section className="panel analytics-panel subject-analytics-panel">
        <div className="panel-heading">
          <div>
            <h3>Subject-wise attendance</h3>
            <p>Internship placed records are excluded from applicable totals and attendance percentages.</p>
          </div>
          <span className="student-count">{subjects.length} subjects</span>
        </div>
        <div className="table-scroll">
          <table className="analytics-table subject-analytics-table">
            <thead>
              <tr>
                <th>SUBJECT</th>
                <th>TOTAL RECORDS</th>
                <th>APPLICABLE</th>
                <th>PRESENT</th>
                <th>ABSENT</th>
                <th>ENGAGEMENT</th>
                <th>ATTENDANCE</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.subject}>
                  <td><strong>{subject.subject}</strong></td>
                  <td>{subject.totalRecords}</td>
                  <td>{subject.totalApplicableRecords}</td>
                  <td><AttendanceBadge count={subject.presentCount} status="present" /></td>
                  <td><AttendanceBadge count={subject.absentCount} status="absent" /></td>
                  <td><AttendanceBadge count={subject.officialEngagementCount} status="engagement" /></td>
                  <td><strong>{percentage(subject.attendancePercentage)}</strong></td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td className="student-empty-cell" colSpan="7">
                    <div className="student-empty-state">
                      <span className="student-empty-icon"><Icon name="reports" size={22} /></span>
                      <strong>No subject attendance data</strong>
                      <span>Subject statistics will appear here after attendance is recorded.</span>
                      <Link className="button button-secondary" to="/attendance">Go to attendance</Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="analytics-footnote">
        Showing {attendance.totalRecords} of {allRecords.length} attendance records · {totalStudents} of {allStudents.length} students match the current class filters.
      </p>
    </>
  )
}

export default Dashboard
