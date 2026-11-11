import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { attendanceStatusChartDetails } from '../../features/attendance/attendanceChartData'

const trendSeries = attendanceStatusChartDetails.map((status) => ({
  key: status.key,
  label: status.label,
  color: status.color,
}))

function percentage(value) {
  return `${Number(value.toFixed(1))}%`
}

function attendanceRateDescription(item) {
  return item.totalApplicableRecords
    ? `${percentage(item.attendancePercentage)} from ${item.totalApplicableRecords} applicable records`
    : 'No applicable attendance records'
}

function ChartPanel({ title, description, children, className = '' }) {
  return (
    <article aria-labelledby={`chart-title-${title.replaceAll(' ', '-').toLowerCase()}`} className={`panel attendance-chart-panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h3 id={`chart-title-${title.replaceAll(' ', '-').toLowerCase()}`}>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </article>
  )
}

function ChartEmpty() {
  return (
    <div className="chart-empty-state" role="status">
      No attendance records match the current filters.
    </div>
  )
}

function DataSummary({ label, children }) {
  return <p className="chart-data-summary" aria-label={label}>{children}</p>
}

function AttendanceDistributionChart({ data }) {
  const chartData = data.filter((item) => item.count > 0)
  const accessibleSummary = attendanceStatusChartDetails
    .map((item) => `${item.label}: ${data.find((entry) => entry.status === item.status)?.count ?? 0}`)
    .join('; ')

  return (
    <ChartPanel
      title="Attendance status distribution"
      description="Record share by status. Internship placement is included in this distribution only."
    >
      {chartData.length ? (
        <>
          <div className="attendance-chart-plot" role="img" aria-label={`Attendance status distribution. ${accessibleSummary}.`}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="54%"
                  outerRadius="78%"
                  paddingAngle={2}
                >
                  {chartData.map((item) => <Cell key={item.status} fill={item.color} />)}
                </Pie>
                <Tooltip formatter={(value, _name, item) => [
                  `${value} (${Number(item.payload.share.toFixed(1))}%)`,
                  item.payload.label,
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="chart-status-legend" aria-label="Attendance status counts">
            {attendanceStatusChartDetails.map((item) => {
              const value = data.find((entry) => entry.status === item.status)
              return (
                <li key={item.status}>
                  <span className="chart-legend-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <span>{item.label}</span>
                  <strong>{value?.count ?? 0}</strong>
                </li>
              )
            })}
          </ul>
          <DataSummary label="Attendance distribution summary">
            Distribution percentages use all {data.reduce((total, item) => total + item.count, 0)} records; regular attendance percentages exclude Internship Placed.
          </DataSummary>
        </>
      ) : <ChartEmpty />}
    </ChartPanel>
  )
}

function SubjectAttendanceChart({ data }) {
  const accessibleSummary = data
    .map((item) => `${item.subject}: ${attendanceRateDescription(item)}`)
    .join('; ')
  const chartData = data.map((item) => ({
    ...item,
    chartAttendancePercentage: item.totalApplicableRecords ? item.attendancePercentage : null,
  }))

  return (
    <ChartPanel
      title="Subject-wise attendance"
      description="Attendance percentage by subject; Internship Placed records are excluded."
    >
      {data.length ? (
        <>
          <div className="attendance-chart-plot attendance-chart-wide" role="img" aria-label={`Subject-wise attendance percentages. ${accessibleSummary}.`}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 8 }}>
                <CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" interval="preserveStartEnd" tick={{ fill: '#77839a', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#77839a', fontSize: 10 }} />
                <Tooltip formatter={(value, _name, item) => [
                  item.payload.totalApplicableRecords
                    ? `${percentage(Number(value))} · ${item.payload.totalApplicableRecords} applicable records`
                    : 'No applicable attendance records',
                  'Attendance',
                ]} />
                <Bar dataKey="chartAttendancePercentage" name="Attendance" fill="#5275df" radius={[5, 5, 0, 0]} maxBarSize={54} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DataSummary label="Subject attendance summary">{accessibleSummary}.</DataSummary>
        </>
      ) : <ChartEmpty />}
    </ChartPanel>
  )
}

function AttendanceTrendChart({ data, grouping, onGroupingChange }) {
  const accessibleSummary = data
    .map((item) => `${item.label}: ${item.totalRecords} records, ${item.presentCount} present, ${item.absentCount} absent, ${item.internshipPlacedCount} internship placed, ${item.officialEngagementCount} official engagement`)
    .join('; ')

  return (
    <ChartPanel
      title="Attendance activity trend"
      description="Recorded status counts over time; choose a daily or monthly view."
      className="attendance-trend-panel"
    >
      <div className="chart-grouping-control" role="group" aria-label="Attendance trend grouping">
        {['daily', 'monthly'].map((value) => (
          <button
            aria-pressed={grouping === value}
            className={grouping === value ? 'is-selected' : ''}
            key={value}
            onClick={() => onGroupingChange(value)}
            type="button"
          >
            {value === 'daily' ? 'Daily' : 'Monthly'}
          </button>
        ))}
      </div>
      {data.length ? (
        <>
          <div className="attendance-chart-plot attendance-chart-wide" role="img" aria-label={`Attendance trend, ${grouping}. ${accessibleSummary}.`}>
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={data} margin={{ top: 12, right: 16, left: -12, bottom: 8 }}>
                <CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" />
                <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fill: '#77839a', fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#77839a', fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {trendSeries.map((series) => (
                  <Line
                    activeDot={{ r: 4 }}
                    dataKey={series.key}
                    dot={data.length < 14}
                    key={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2}
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <DataSummary label="Attendance activity summary">{accessibleSummary}.</DataSummary>
        </>
      ) : <ChartEmpty />}
    </ChartPanel>
  )
}

function SemesterAttendanceChart({ data }) {
  const accessibleSummary = data
    .map((item) => `${item.label}: ${attendanceRateDescription(item)}`)
    .join('; ')
  const chartData = data.map((item) => ({
    ...item,
    chartAttendancePercentage: item.totalApplicableRecords ? item.attendancePercentage : null,
  }))

  return (
    <ChartPanel
      title="Semester-wise comparison"
      description="Attendance percentage across semesters; Internship Placed records are excluded."
    >
      {data.length ? (
        <>
          <div className="attendance-chart-plot" role="img" aria-label={`Semester attendance comparison. ${accessibleSummary}.`}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 8 }}>
                <CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#77839a', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#77839a', fontSize: 10 }} />
                <Tooltip formatter={(value, _name, item) => [
                  item.payload.totalApplicableRecords
                    ? `${percentage(Number(value))} · ${item.payload.totalApplicableRecords} applicable records`
                    : 'No applicable attendance records',
                  'Attendance',
                ]} />
                <Bar dataKey="chartAttendancePercentage" name="Attendance" fill="#4a9b83" radius={[5, 5, 0, 0]} maxBarSize={58} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DataSummary label="Semester attendance summary">{accessibleSummary}.</DataSummary>
        </>
      ) : <ChartEmpty />}
    </ChartPanel>
  )
}

export default function AttendanceCharts({
  distributionData,
  subjectData,
  trendData,
  trendGrouping,
  onTrendGroupingChange,
  semesterData,
  showSemesterChart = false,
  className = '',
}) {
  return (
    <div className={`attendance-chart-grid ${className}`}>
      <AttendanceDistributionChart data={distributionData} />
      <SubjectAttendanceChart data={subjectData} />
      <AttendanceTrendChart
        data={trendData}
        grouping={trendGrouping}
        onGroupingChange={onTrendGroupingChange}
      />
      {showSemesterChart && <SemesterAttendanceChart data={semesterData} />}
    </div>
  )
}
