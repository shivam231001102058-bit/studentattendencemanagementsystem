import { attendanceStatuses } from '../../features/attendance/attendanceSlice'
import { initialSubjectsState } from '../../features/subjects/subjectsSlice'

export const persistenceKey = 'student-attendance-management-system'
export const persistenceVersion = 1

const studentFields = [
  'studentId',
  'fullName',
  'department',
  'semester',
  'section',
  'email',
  'createdDate',
]

const attendanceFields = [
  'recordId',
  'studentId',
  'studentName',
  'date',
  'subject',
  'semester',
  'section',
  'attendanceStatus',
  'createdAt',
  'updatedAt',
]

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isStudent(student) {
  return (
    isObject(student) &&
    studentFields.every((field) => typeof student[field] === 'string' && student[field].trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email) &&
    isDate(student.createdDate)
  )
}

function isAttendanceRecord(record) {
  return (
    isObject(record) &&
    attendanceFields.every((field) => typeof record[field] === 'string' && record[field].trim()) &&
    isDate(record.date) &&
    attendanceStatuses.includes(record.attendanceStatus) &&
    isTimestamp(record.createdAt) &&
    isTimestamp(record.updatedAt)
  )
}

function hasUniqueValues(items, getValue) {
  const seen = new Set()
  for (const item of items) {
    const value = getValue(item).toLocaleLowerCase()
    if (seen.has(value)) return false
    seen.add(value)
  }
  return true
}

function hasUniqueAttendanceKeys(records) {
  const seen = new Set()
  for (const record of records) {
    const key = `${record.studentId.toLocaleLowerCase()}|${record.subject.toLocaleLowerCase()}|${record.date}`
    if (seen.has(key)) return false
    seen.add(key)
  }
  return true
}

export function validatePersistedData(value) {
  if (
    !isObject(value) ||
    value.version !== persistenceVersion ||
    !Array.isArray(value.students) ||
    !Array.isArray(value.attendance) ||
    !isObject(value.settings)
  ) {
    return null
  }

  if (
    !value.students.every(isStudent) ||
    !hasUniqueValues(value.students, (student) => student.studentId) ||
    !value.attendance.every(isAttendanceRecord) ||
    !hasUniqueValues(value.attendance, (record) => record.recordId) ||
    !hasUniqueAttendanceKeys(value.attendance) ||
    (value.subjects !== undefined &&
      (!Array.isArray(value.subjects) ||
        !value.subjects.every((subject) => typeof subject === 'string' && subject.trim()) ||
        !hasUniqueValues(value.subjects, (subject) => subject))) ||
    !Number.isFinite(value.settings.lowAttendanceThreshold) ||
    value.settings.lowAttendanceThreshold < 0 ||
    value.settings.lowAttendanceThreshold > 100
  ) {
    return null
  }

  return {
    students: value.students.map((student) =>
      Object.fromEntries(studentFields.map((field) => [field, student[field]])),
    ),
    attendance: value.attendance.map((record) =>
      Object.fromEntries(attendanceFields.map((field) => [field, record[field]])),
    ),
    subjects: value.subjects?.map((subject) => subject.trim()) ?? initialSubjectsState.items.slice(),
    settings: {
      lowAttendanceThreshold: value.settings.lowAttendanceThreshold,
    },
  }
}

export function getBrowserStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function loadPersistedData(getStorage = getBrowserStorage) {
  let storage
  try {
    storage = getStorage()
    if (!storage) {
      return {
        data: null,
        error: 'Local storage is unavailable. Changes will not persist across reloads.',
      }
    }

    const serialized = storage.getItem(persistenceKey)
    if (serialized === null) return { data: null, error: null }

    const parsed = JSON.parse(serialized)
    const data = validatePersistedData(parsed)
    if (!data) {
      return {
        data: null,
        error: 'Saved data is invalid or from an unsupported version. Starting with an empty state.',
      }
    }

    return { data, error: null }
  } catch {
    return {
      data: null,
      error: 'Saved data could not be read. Starting with an empty state.',
    }
  }
}

export function serializePersistedState(state) {
  return JSON.stringify({
    version: persistenceVersion,
    students: state.students.items,
    attendance: state.attendance.records,
    subjects: state.subjects.items,
    settings: {
      lowAttendanceThreshold: state.dashboard.lowAttendanceThreshold,
    },
  })
}
