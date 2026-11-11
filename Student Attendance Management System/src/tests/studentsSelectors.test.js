import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'
import filtersReducer, {
  setStudentDepartmentFilter,
  setStudentSearch,
  setStudentSectionFilter,
  setStudentSemesterFilter,
} from '../features/filters/filtersSlice'
import studentsReducer, { addStudent } from '../features/students/studentsSlice'
import {
  selectAllStudents,
  selectFilteredStudents,
  selectStudentById,
  selectStudentCount,
} from '../features/students/studentsSelectors'

const students = [
  {
    studentId: 'STU-001',
    fullName: 'Jordan Lee',
    department: 'Computer Science',
    semester: '3',
    section: 'A',
    email: 'jordan@college.edu',
    createdDate: '2026-11-11',
  },
  {
    studentId: 'STU-002',
    fullName: 'Taylor Morgan',
    department: 'Engineering',
    semester: '5',
    section: 'B',
    email: 'taylor@college.edu',
    createdDate: '2026-11-11',
  },
  {
    studentId: 'STU-003',
    fullName: 'Jordan Avery',
    department: 'Computer Science',
    semester: '3',
    section: 'B',
    email: 'avery@college.edu',
    createdDate: '2026-11-11',
  },
]

function createStore() {
  const store = configureStore({
    reducer: {
      students: studentsReducer,
      filters: filtersReducer,
    },
  })
  students.forEach((student) => store.dispatch(addStudent(student)))
  return store
}

describe('student selectors', () => {
  it('selects all students, the count, and a student by ID', () => {
    const state = createStore().getState()

    expect(selectAllStudents(state)).toHaveLength(3)
    expect(selectStudentCount(state)).toBe(3)
    expect(selectStudentById(state, 'stu-002')).toMatchObject({ fullName: 'Taylor Morgan' })
    expect(selectStudentById(state, 'unknown')).toBeUndefined()
  })

  it('combines case-insensitive ID/name search and all selected filters', () => {
    const store = createStore()
    store.dispatch(setStudentSearch('stu-002'))
    expect(selectFilteredStudents(store.getState())).toEqual([students[1]])

    store.dispatch(setStudentSearch('jordan'))
    store.dispatch(setStudentDepartmentFilter('Computer Science'))
    store.dispatch(setStudentSemesterFilter('3'))
    store.dispatch(setStudentSectionFilter('B'))

    expect(selectFilteredStudents(store.getState())).toEqual([students[2]])
  })

  it('memoizes results when the selector inputs have not changed', () => {
    const state = createStore().getState()

    expect(selectFilteredStudents(state)).toBe(selectFilteredStudents(state))
    expect(selectAllStudents(state)).toBe(selectAllStudents(state))
  })
})
