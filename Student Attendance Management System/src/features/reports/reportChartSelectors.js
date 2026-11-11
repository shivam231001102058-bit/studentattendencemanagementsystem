import { createSelector } from '@reduxjs/toolkit'
import {
  buildAttendanceDistributionData,
  buildAttendanceTrendData,
  buildSubjectAttendanceChartData,
} from '../attendance/attendanceChartData'
import { selectFilteredReportRecords } from './reportSelectors'

export const selectReportAttendanceDistribution = createSelector(
  [selectFilteredReportRecords],
  buildAttendanceDistributionData,
)

export const selectReportSubjectChartData = createSelector(
  [selectFilteredReportRecords],
  buildSubjectAttendanceChartData,
)

export const selectReportTrendData = createSelector(
  [
    selectFilteredReportRecords,
    (_state, grouping = 'daily') => grouping,
  ],
  buildAttendanceTrendData,
)
