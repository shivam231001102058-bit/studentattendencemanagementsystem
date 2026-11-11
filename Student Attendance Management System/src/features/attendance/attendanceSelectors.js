import { createSelector } from '@reduxjs/toolkit'

const selectRecords = (state) => state.attendance.records
const selectRegisteredStudents = (state) => state.students.items

export const selectAttendanceHistory = createSelector(
  [selectRecords],
  (records) =>
    [...records].sort(
      (first, second) =>
        second.date.localeCompare(first.date) ||
        second.createdAt.localeCompare(first.createdAt),
    ),
)

export const selectStudentsForAttendance = createSelector(
  [
    selectRegisteredStudents,
    (_state, semester) => String(semester ?? ''),
    (_state, _semester, section) => String(section ?? ''),
  ],
  (students, semester, section) =>
    semester && section
      ? students.filter(
          (student) =>
            String(student.semester) === semester && student.section === section,
        )
      : [],
)
