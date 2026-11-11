import { configureStore } from '@reduxjs/toolkit'
import { createActionMonitoringMiddleware } from './actionMonitoringMiddleware'
import { mockStudentAttendanceService } from '../services/mockStudentAttendanceService'
import attendanceReducer, {
  initialAttendanceState,
} from '../features/attendance/attendanceSlice'
import dashboardReducer, {
  initialDashboardState,
} from '../features/dashboard/dashboardSlice'
import filtersReducer from '../features/filters/filtersSlice'
import reportsReducer from '../features/reports/reportsSlice'
import subjectsReducer, {
  initialSubjectsState,
} from '../features/subjects/subjectsSlice'
import studentsReducer, {
  initialStudentsState,
} from '../features/students/studentsSlice'
import {
  getBrowserStorage,
  loadPersistedData,
} from './persistence/persistence'
import { createPersistenceMiddleware } from './persistence/persistenceMiddleware'
import persistenceReducer, {
  initialPersistenceStatus,
} from './persistence/persistenceStatusSlice'

export function createAppStore({
  getStorage = getBrowserStorage,
  mockService = mockStudentAttendanceService,
} = {}) {
  const { data, error } = loadPersistedData(getStorage)

  return configureStore({
    reducer: {
      students: studentsReducer,
      attendance: attendanceReducer,
      filters: filtersReducer,
      dashboard: dashboardReducer,
      reports: reportsReducer,
      subjects: subjectsReducer,
      persistence: persistenceReducer,
    },
    preloadedState: {
      students: {
        ...initialStudentsState,
        items: data?.students ?? [],
      },
      attendance: {
        ...initialAttendanceState,
        records: data?.attendance ?? [],
      },
      dashboard: {
        ...initialDashboardState,
        lowAttendanceThreshold:
          data?.settings.lowAttendanceThreshold ??
          initialDashboardState.lowAttendanceThreshold,
      },
      subjects: {
        ...initialSubjectsState,
        items: data?.subjects ?? initialSubjectsState.items,
      },
      persistence: {
        ...initialPersistenceStatus,
        error,
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: { mockStudentAttendanceService: mockService } },
      }).concat(
        createPersistenceMiddleware(getStorage),
        createActionMonitoringMiddleware(),
      ),
  })
}

export const store = createAppStore()
