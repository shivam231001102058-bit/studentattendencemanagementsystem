import { describe, expect, it } from 'vitest'
import { createAppStore } from '../app/store'
import {
  loadPersistedData,
  persistenceKey,
  persistenceVersion,
} from '../app/persistence/persistence'
import { setStudentSearch } from '../features/filters/filtersSlice'
import { addStudent } from '../features/students/studentsSlice'
import { markAttendance } from '../features/attendance/attendanceSlice'
import { setLowAttendanceThreshold } from '../features/dashboard/dashboardSlice'
import { addSubject } from '../features/subjects/subjectsSlice'

const student = {
  studentId: 'STU-001',
  fullName: 'Jordan Lee',
  department: 'Computer Science',
  semester: '3',
  section: 'A',
  email: 'jordan@college.edu',
  createdDate: '2026-11-11',
}

const attendance = {
  recordId: 'record-1',
  studentId: 'STU-001',
  studentName: 'Jordan Lee',
  date: '2026-11-11',
  subject: 'Physics',
  semester: '3',
  section: 'A',
  attendanceStatus: 'P',
  createdAt: '2026-11-11T09:00:00.000Z',
  updatedAt: '2026-11-11T09:00:00.000Z',
}

function createStorage(initialValue = null) {
  const values = new Map()
  const writes = []
  if (initialValue !== null) values.set(persistenceKey, initialValue)

  return {
    writes,
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      writes.push([key, value])
      values.set(key, value)
    },
    seed(key, value) {
      values.set(key, value)
    },
    read(key) {
      return values.get(key)
    },
  }
}

function persistedPayload(overrides = {}) {
  return {
    version: persistenceVersion,
    students: [student],
    attendance: [attendance],
    settings: { lowAttendanceThreshold: 62 },
    ...overrides,
  }
}

describe('Redux local persistence', () => {
  it('saves student records after a valid student change', () => {
    const storage = createStorage()
    const store = createAppStore({ getStorage: () => storage })

    store.dispatch(addStudent(student))
    const saved = JSON.parse(storage.read(persistenceKey))

    expect(saved.students).toEqual([student])
    expect(saved.attendance).toEqual([])
    expect(saved.settings.lowAttendanceThreshold).toBe(45)
    expect(storage.writes).toHaveLength(1)
  })

  it('saves attendance records and does not persist transient messages', () => {
    const storage = createStorage()
    const store = createAppStore({ getStorage: () => storage })

    store.dispatch(markAttendance(attendance))
    const saved = JSON.parse(storage.read(persistenceKey))

    expect(saved.attendance).toEqual([attendance])
    expect(saved.students).toEqual([])
    expect(saved.attendance[0]).not.toHaveProperty('message')
    expect(storage.writes).toHaveLength(1)
  })

  it('restores validated students and attendance before store initialization returns', () => {
    const storage = createStorage(JSON.stringify(persistedPayload()))
    const store = createAppStore({ getStorage: () => storage })

    expect(store.getState().students.items).toEqual([student])
    expect(store.getState().attendance.records).toEqual([attendance])
    expect(store.getState().dashboard.lowAttendanceThreshold).toBe(62)
    expect(storage.writes).toHaveLength(0)
  })

  it('persists and restores the attendance threshold setting', () => {
    const storage = createStorage()
    const store = createAppStore({ getStorage: () => storage })

    store.dispatch(setLowAttendanceThreshold(55))
    expect(JSON.parse(storage.read(persistenceKey)).settings.lowAttendanceThreshold).toBe(55)

    const restoredStore = createAppStore({ getStorage: () => storage })
    expect(restoredStore.getState().dashboard.lowAttendanceThreshold).toBe(55)
  })

  it('persists subject configuration and restores older version-one data with defaults', () => {
    const storage = createStorage()
    const store = createAppStore({ getStorage: () => storage })
    store.dispatch(addSubject('Biology'))

    expect(JSON.parse(storage.read(persistenceKey)).subjects).toContain('Biology')
    const restored = createAppStore({ getStorage: () => storage })
    expect(restored.getState().subjects.items).toContain('Biology')

    const legacyStorage = createStorage(JSON.stringify(persistedPayload()))
    const legacyStore = createAppStore({ getStorage: () => legacyStorage })
    expect(legacyStore.getState().subjects.items).toContain('Physics')
    expect(legacyStorage.writes).toHaveLength(0)
  })

  it('falls back safely on malformed JSON without overwriting it at startup', () => {
    const storage = createStorage('{bad json')
    const store = createAppStore({ getStorage: () => storage })

    expect(store.getState().students.items).toEqual([])
    expect(store.getState().attendance.records).toEqual([])
    expect(store.getState().persistence.error).toMatch(/could not be read/i)
    expect(storage.writes).toHaveLength(0)

    store.dispatch(setStudentSearch('STU'))
    expect(storage.writes).toHaveLength(0)
  })

  it('rejects invalid stored records and uses safe initial state', () => {
    const invalid = persistedPayload({
      students: [{ ...student, email: 'bad email' }],
    })
    const storage = createStorage(JSON.stringify(invalid))
    const store = createAppStore({ getStorage: () => storage })

    expect(store.getState().students.items).toEqual([])
    expect(store.getState().attendance.records).toEqual([])
    expect(store.getState().dashboard.lowAttendanceThreshold).toBe(45)
    expect(store.getState().persistence.error).toMatch(/invalid/i)
    expect(storage.writes).toHaveLength(0)
  })

  it('reports missing storage and safely continues in memory', () => {
    const store = createAppStore({ getStorage: () => null })

    expect(store.getState().persistence.error).toMatch(/unavailable/i)
    store.dispatch(addStudent(student))
    expect(store.getState().students.items).toEqual([student])
    expect(store.getState().persistence.error).toMatch(/could not be saved/i)
  })

  it('handles storage access errors while reading and writing', () => {
    const storageError = new Error('Storage access denied')
    const store = createAppStore({
      getStorage: () => ({
        getItem() {
          throw storageError
        },
        setItem() {
          throw storageError
        },
      }),
    })

    expect(store.getState().persistence.error).toMatch(/could not be read/i)
    store.dispatch(addStudent(student))
    expect(store.getState().students.items).toEqual([student])
    expect(store.getState().persistence.error).toMatch(/could not be saved/i)
  })

  it('does not write for unrelated Redux actions or unpersisted UI settings', () => {
    const storage = createStorage()
    const store = createAppStore({ getStorage: () => storage })

    store.dispatch(setStudentSearch('Jordan'))
    store.dispatch({ type: 'attendance/clearAttendanceFeedback' })
    store.dispatch({ type: 'dashboard/setDashboardSubject', payload: 'Physics' })

    expect(storage.writes).toHaveLength(0)
  })

  it('clears the storage warning after a later persistence write succeeds', () => {
    let canWrite = false
    const storage = {
      getItem() {
        return null
      },
      setItem() {
        if (!canWrite) throw new Error('Quota exceeded')
      },
    }
    const store = createAppStore({ getStorage: () => storage })

    store.dispatch(addStudent(student))
    expect(store.getState().persistence.error).toMatch(/could not be saved/i)

    canWrite = true
    store.dispatch(setLowAttendanceThreshold(50))
    expect(store.getState().persistence.error).toBeNull()
  })

  it('loads absent storage without reporting an error', () => {
    expect(loadPersistedData(() => createStorage())).toEqual({ data: null, error: null })
  })
})
