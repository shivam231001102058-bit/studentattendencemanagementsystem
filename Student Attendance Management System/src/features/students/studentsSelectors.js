import { createSelector } from '@reduxjs/toolkit'

const selectStudentItems = (state) => state.students.items
const selectStudentFilters = (state) => state.filters

export const selectAllStudents = createSelector(
  [selectStudentItems],
  (students) => students.slice(),
)

export const selectFilteredStudents = createSelector(
  [selectAllStudents, selectStudentFilters],
  (students, filters) => {
    const search = filters.search.trim().toLocaleLowerCase()

    return students.filter((student) => {
      const matchesSearch =
        !search ||
        student.studentId.toLocaleLowerCase().includes(search) ||
        student.fullName.toLocaleLowerCase().includes(search)

      return (
        matchesSearch &&
        (!filters.department || student.department === filters.department) &&
        (!filters.semester || String(student.semester) === String(filters.semester)) &&
        (!filters.section || student.section === filters.section)
      )
    })
  },
)

export const selectStudentCount = createSelector(
  [selectAllStudents],
  (students) => students.length,
)

export const selectStudentById = createSelector(
  [selectAllStudents, (_state, studentId) => studentId],
  (students, studentId) =>
    students.find(
      (student) =>
        student.studentId.toLocaleLowerCase() === String(studentId).toLocaleLowerCase(),
    ),
)
