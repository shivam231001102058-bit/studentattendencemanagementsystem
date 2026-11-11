import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'
import attendanceReducer, { markAttendance } from '../features/attendance/attendanceSlice'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'
import {
  selectAttendanceHistory,
  selectStudentsForAttendance,
} from '../features/attendance/attendanceSelectors'

const student = (studentId, semester, section) => ({
  studentId,
  fullName: `Student ${studentId}`,
  department: 'Computer Science',
  semester,
  section,
  email: `${studentId.toLowerCase()}@college.edu`,
  createdDate: '2026-11-11',
})

function createStore() {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      attendance: attendanceReducer,
    },
  })
  store.dispatch(addStudent(student('STU-001', '3', 'A')))
  store.dispatch(addStudent(student('STU-002', '3', 'B')))
  store.dispatch(addStudent(student('STU-003', '4', 'A')))
  return store
}

describe('attendance selectors', () => {
  it('filters registered students by both semester and section', () => {
    const state = createStore().getState()

    expect(selectStudentsForAttendance(state, '3', 'A')).toMatchObject([
      { studentId: 'STU-001' },
    ])
    expect(selectStudentsForAttendance(state, '3', 'B')).toMatchObject([
      { studentId: 'STU-002' },
    ])
    expect(selectStudentsForAttendance(state, '', 'A')).toEqual([])
    expect(selectStudentsForAttendance(state, '5', 'A')).toEqual([])
  })

  it('memoizes the matching registered-student result', () => {
    const state = createStore().getState()

    expect(selectStudentsForAttendance(state, '3', 'A')).toBe(
      selectStudentsForAttendance(state, '3', 'A'),
    )
  })

  it('selects attendance history in reverse chronological order', () => {
    const store = createStore()
    store.dispatch(markAttendance({
      studentId: 'STU-001',
      studentName: 'Student One',
      date: '2026-11-10',
      subject: 'Physics',
      semester: '3',
      section: 'A',
      attendanceStatus: 'P',
    }))
    store.dispatch(markAttendance({
      studentId: 'STU-001',
      studentName: 'Student One',
      date: '2026-11-11',
      subject: 'Physics',
      semester: '3',
      section: 'A',
      attendanceStatus: 'A',
    }))

    expect(selectAttendanceHistory(store.getState()).map(({ date }) => date)).toEqual([
      '2026-11-11',
      '2026-11-10',
    ])
  })
})
