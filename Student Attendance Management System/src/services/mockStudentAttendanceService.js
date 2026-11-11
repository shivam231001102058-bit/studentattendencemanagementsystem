import { attendanceStatuses } from '../features/attendance/attendanceSlice'

const requiredStudentFields = [
  'studentId',
  'fullName',
  'department',
  'semester',
  'section',
  'email',
  'createdDate',
]

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validateStudents(students) {
  if (!Array.isArray(students)) throw new Error('Student records must be an array.')
  const ids = new Set()
  for (const student of students) {
    if (!student || requiredStudentFields.some((field) => !String(student[field] ?? '').trim())) {
      throw new Error('A student record is missing required fields.')
    }
    if (requiredStudentFields.some((field) => typeof student[field] !== 'string')) {
      throw new Error('Student fields must be text values.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      throw new Error('A student record has an invalid email address.')
    }
    if (!isValidDate(student.createdDate)) {
      throw new Error('A student record has an invalid created date.')
    }
    const id = student.studentId.toLocaleLowerCase()
    if (ids.has(id)) throw new Error('The student response contains duplicate IDs.')
    ids.add(id)
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isTimestamp(value) {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value))
}

function validateAttendance(records, existingRecords) {
  if (!Array.isArray(records) || !records.length) {
    throw new Error('Attendance records must be a non-empty array.')
  }

  const keys = new Set()
  const recordIds = new Set()
  for (const record of records) {
    if (
      !record ||
      !isNonEmptyString(record.studentId) ||
      !isNonEmptyString(record.studentName) ||
      !isValidDate(record.date) ||
      !isNonEmptyString(record.subject) ||
      !isNonEmptyString(record.semester) ||
      !isNonEmptyString(record.section) ||
      !attendanceStatuses.includes(record.attendanceStatus) ||
      !isNonEmptyString(record.recordId) ||
      !isTimestamp(record.createdAt) ||
      !isTimestamp(record.updatedAt)
    ) {
      throw new Error('An attendance record is missing valid required fields.')
    }

    const key = `${record.studentId.toLocaleLowerCase()}|${record.subject.toLocaleLowerCase()}|${record.date}`
    if (keys.has(key)) throw new Error('The attendance request contains duplicate student records.')
    keys.add(key)
    if (recordIds.has(record.recordId)) {
      throw new Error('The attendance request contains duplicate record IDs.')
    }
    recordIds.add(record.recordId)

    const conflictingId = existingRecords.find(
      (existing) =>
        existing.recordId === record.recordId &&
        `${existing.studentId.toLocaleLowerCase()}|${existing.subject.toLocaleLowerCase()}|${existing.date}` !== key,
    )
    if (conflictingId) throw new Error('An attendance record ID is already in use.')
  }
}

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

export function createMockStudentAttendanceService({ delayMs = 20, failFetch = false, failSave = false } = {}) {
  return {
    async fetchStudents(studentSnapshot) {
      await wait(delayMs)
      if (failFetch) throw new Error('Mock student fetch failed. Please try again.')
      validateStudents(studentSnapshot)
      return studentSnapshot.map((student) => ({ ...student }))
    },
    async saveAttendance(records, existingRecords = []) {
      await wait(delayMs)
      if (failSave) throw new Error('Mock attendance save failed. Please try again.')
      validateAttendance(records, existingRecords)
      return records.map((record) => ({ ...record }))
    },
  }
}

export const mockStudentAttendanceService = createMockStudentAttendanceService()
