import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it, vi } from 'vitest'
import { createActionMonitoringMiddleware } from '../app/actionMonitoringMiddleware'
import { createAppStore } from '../app/store'
import { markAttendance } from '../features/attendance/attendanceSlice'
import { saveAttendanceRecords } from '../features/attendance/attendanceThunks'
import { addStudent, updateStudent } from '../features/students/studentsSlice'
import { fetchStudents } from '../features/students/studentsThunks'
import subjectsReducer, {
  addSubject,
  deleteSubject,
  selectAllSubjects,
  updateSubject,
} from '../features/subjects/subjectsSlice'
import { createMockStudentAttendanceService } from '../services/mockStudentAttendanceService'

const student = {
  studentId: 'STU-001',
  fullName: 'Jordan Lee',
  department: 'Computer Science',
  semester: '3',
  section: 'A',
  email: 'jordan@college.edu',
  createdDate: '2026-11-11',
}

const attendanceInput = {
  date: '2026-11-11',
  subject: 'Physics',
  semester: '3',
  section: 'A',
  records: [{ studentId: student.studentId, studentName: student.fullName, attendanceStatus: 'P' }],
}

function createStore(mockService = createMockStudentAttendanceService({ delayMs: 0 })) {
  return createAppStore({ getStorage: () => null, mockService })
}

function deferred() {
  let resolve
  const promise = new Promise((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

describe('mock asynchronous Redux workflows', () => {
  it('fetches student snapshots and safely preserves edits made during the request', async () => {
    const request = deferred()
    const mockService = {
      fetchStudents: vi.fn(() => request.promise),
      saveAttendance: vi.fn(),
    }
    const store = createStore(mockService)
    store.dispatch(addStudent(student))

    const fetch = store.dispatch(fetchStudents())
    expect(store.getState().students.fetch.status).toBe('loading')
    store.dispatch(updateStudent({
      studentId: student.studentId,
      student: { ...student, fullName: 'Jordan Avery Lee' },
    }))
    request.resolve([{ ...student }])
    await fetch

    expect(store.getState().students.items).toHaveLength(1)
    expect(store.getState().students.items[0].fullName).toBe('Jordan Avery Lee')
    expect(store.getState().students.fetch).toMatchObject({
      status: 'succeeded',
      message: 'Student directory refreshed.',
      error: null,
    })
  })

  it('records rejected fetches without replacing registered students', async () => {
    const store = createStore(createMockStudentAttendanceService({ delayMs: 0, failFetch: true }))
    store.dispatch(addStudent(student))

    const result = await store.dispatch(fetchStudents())

    expect(fetchStudents.rejected.match(result)).toBe(true)
    expect(store.getState().students.items).toEqual([student])
    expect(store.getState().students.fetch).toMatchObject({
      status: 'failed',
      error: 'Mock student fetch failed. Please try again.',
    })
  })

  it('ignores a repeated fetch request while the first is pending', async () => {
    const request = deferred()
    const mockService = {
      fetchStudents: vi.fn(() => request.promise),
      saveAttendance: vi.fn(),
    }
    const store = createStore(mockService)
    const first = store.dispatch(fetchStudents())
    const repeated = await store.dispatch(fetchStudents())
    request.resolve([])
    await first

    expect(repeated.meta.condition).toBe(true)
    expect(mockService.fetchStudents).toHaveBeenCalledOnce()
  })

  it('saves attendance asynchronously and upserts an existing student/date/subject record', async () => {
    const store = createStore()
    store.dispatch(markAttendance({
      ...attendanceInput.records[0],
      date: attendanceInput.date,
      subject: attendanceInput.subject,
      semester: attendanceInput.semester,
      section: attendanceInput.section,
    }))
    const original = store.getState().attendance.records[0]

    const save = store.dispatch(saveAttendanceRecords({
      ...attendanceInput,
      records: [{ ...attendanceInput.records[0], attendanceStatus: 'E' }],
    }))
    expect(store.getState().attendance.status).toBe('saving')
    await save

    const records = store.getState().attendance.records
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      recordId: original.recordId,
      attendanceStatus: 'E',
    })
    expect(store.getState().attendance).toMatchObject({
      status: 'succeeded',
      message: 'Attendance saved successfully.',
      error: null,
    })
  })

  it('rejects invalid and duplicate attendance requests with visible errors', async () => {
    const duplicateBatch = {
      ...attendanceInput,
      records: [...attendanceInput.records, ...attendanceInput.records],
    }
    const store = createStore()

    const invalid = await store.dispatch(saveAttendanceRecords({
      ...attendanceInput,
      records: [{ ...attendanceInput.records[0], attendanceStatus: 'L' }],
    }))
    expect(saveAttendanceRecords.rejected.match(invalid)).toBe(true)
    expect(store.getState().attendance.records).toEqual([])

    const duplicate = await store.dispatch(saveAttendanceRecords(duplicateBatch))
    expect(saveAttendanceRecords.rejected.match(duplicate)).toBe(true)
    expect(store.getState().attendance.status).toBe('failed')
    expect(store.getState().attendance.error).toMatch(/duplicate student records/i)
  })

  it('handles a simulated attendance service failure without a rejected promise', async () => {
    const store = createStore(createMockStudentAttendanceService({ delayMs: 0, failSave: true }))

    const result = await store.dispatch(saveAttendanceRecords(attendanceInput))

    expect(saveAttendanceRecords.rejected.match(result)).toBe(true)
    expect(store.getState().attendance.records).toEqual([])
    expect(store.getState().attendance.error).toBe('Mock attendance save failed. Please try again.')
  })
})

describe('mock service validation', () => {
  it('returns predictable cloned student snapshots and rejects invalid records', async () => {
    const service = createMockStudentAttendanceService({ delayMs: 0 })
    const response = await service.fetchStudents([student])

    expect(response).toEqual([student])
    expect(response[0]).not.toBe(student)
    await expect(service.fetchStudents([{ ...student, email: 'bad' }]))
      .rejects.toThrow(/invalid email/i)
  })

  it('validates attendance fields and duplicate request keys before returning a result', async () => {
    const service = createMockStudentAttendanceService({ delayMs: 0 })
    const store = createStore()
    const thunkResult = await store.dispatch(saveAttendanceRecords(attendanceInput))
    const record = store.getState().attendance.records[0]
    expect(saveAttendanceRecords.fulfilled.match(thunkResult)).toBe(true)
    await expect(service.saveAttendance([record, record], []))
      .rejects.toThrow(/duplicate student records/i)
    await expect(service.saveAttendance([{ ...record, attendanceStatus: 'L' }], []))
      .rejects.toThrow(/valid required fields/i)
  })
})

describe('subject management slice', () => {
  it('adds, edits, deletes, validates, and selects configured subjects', () => {
    let state = subjectsReducer(undefined, addSubject('  Biology  '))
    expect(state.items).toContain('Biology')

    state = subjectsReducer(state, addSubject('biology'))
    expect(state.items.filter((subject) => subject.toLowerCase() === 'biology')).toHaveLength(1)
    expect(state.error).toMatch(/already exists/i)

    state = subjectsReducer(state, updateSubject({ subject: 'Biology', name: 'Life Science' }))
    expect(state.items).toContain('Life Science')
    expect(state.items).not.toContain('Biology')

    state = subjectsReducer(state, deleteSubject('Life Science'))
    expect(state.items).not.toContain('Life Science')
    expect(state.message).toMatch(/history was preserved/i)
    expect(selectAllSubjects({ subjects: state })).toEqual(state.items)
  })

  it('rejects empty names and duplicate edits', () => {
    const initial = subjectsReducer(undefined, addSubject('Biology'))
    const empty = subjectsReducer(initial, addSubject(' '))
    const invalidType = subjectsReducer(initial, addSubject(123))
    const duplicate = subjectsReducer(
      initial,
      updateSubject({ subject: 'Biology', name: 'Physics' }),
    )

    expect(empty.error).toBe('Subject name is required.')
    expect(invalidType.error).toBe('Subject name is required.')
    expect(duplicate.error).toBe('A subject with this name already exists.')
  })

  it('keeps saved attendance history when a subject is deleted', () => {
    const store = createStore()
    store.dispatch(markAttendance({
      ...attendanceInput.records[0],
      date: attendanceInput.date,
      subject: attendanceInput.subject,
      semester: attendanceInput.semester,
      section: attendanceInput.section,
    }))
    const beforeDelete = store.getState().attendance.records

    store.dispatch(deleteSubject('Physics'))

    expect(store.getState().subjects.items).not.toContain('Physics')
    expect(store.getState().attendance.records).toEqual(beforeDelete)
  })
})

describe('action monitoring middleware', () => {
  it('logs only relevant action type and timestamp, never the action payload', () => {
    const info = vi.fn()
    const store = configureStore({
      reducer: (state = {}) => state,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(createActionMonitoringMiddleware({
          enabled: true,
          logger: { info },
          now: () => new Date('2026-11-11T00:00:00.000Z'),
        })),
    })
    store.dispatch({
      type: 'students/addStudent',
      payload: { fullName: 'Sensitive Name', email: 'private@college.edu' },
    })
    store.dispatch({ type: 'filters/setSearch', payload: 'Jordan' })

    expect(info).toHaveBeenCalledOnce()
    expect(info).toHaveBeenCalledWith('Redux action', {
      type: 'students/addStudent',
      timestamp: '2026-11-11T00:00:00.000Z',
    })
    expect(JSON.stringify(info.mock.calls)).not.toContain('Sensitive Name')
    expect(JSON.stringify(info.mock.calls)).not.toContain('private@college.edu')
  })

  it('does not log when disabled', () => {
    const info = vi.fn()
    const middleware = createActionMonitoringMiddleware({ enabled: false, logger: { info } })
    const invoke = middleware({})( (action) => action )
    invoke({ type: 'attendance/markAttendance', payload: { studentName: 'Private' } })
    expect(info).not.toHaveBeenCalled()
  })
})
