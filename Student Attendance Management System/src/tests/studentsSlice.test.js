import { describe, expect, it } from 'vitest'
import studentsReducer, {
  addStudent,
  deleteStudent,
  updateStudent,
} from '../features/students/studentsSlice'

const student = {
  studentId: 'STU-001',
  fullName: 'Jordan Lee',
  department: 'Computer Science',
  semester: '3',
  section: 'A',
  email: 'jordan.lee@college.edu',
  createdDate: '2026-11-11',
}

describe('studentsSlice', () => {
  it('adds a valid student and trims input values', () => {
    const state = studentsReducer(undefined, addStudent({
      ...student,
      fullName: '  Jordan Lee  ',
    }))

    expect(state.items).toEqual([student])
    expect(state.message).toBe('Student added successfully.')
    expect(state.error).toBeNull()
  })

  it('updates a student by its current ID', () => {
    const populated = studentsReducer(undefined, addStudent(student))
    const updated = {
      ...student,
      fullName: 'Jordan Avery Lee',
      email: 'jordan.avery@college.edu',
    }

    const state = studentsReducer(
      populated,
      updateStudent({ studentId: student.studentId, student: updated }),
    )

    expect(state.items).toEqual([updated])
    expect(state.message).toBe('Student updated successfully.')
  })

  it('deletes a student by ID', () => {
    const populated = studentsReducer(undefined, addStudent(student))
    const state = studentsReducer(populated, deleteStudent(student.studentId))

    expect(state.items).toEqual([])
    expect(state.message).toBe('Student deleted successfully.')
  })

  it('prevents duplicate IDs regardless of letter case', () => {
    const populated = studentsReducer(undefined, addStudent(student))
    const state = studentsReducer(
      populated,
      addStudent({ ...student, studentId: 'stu-001', email: 'another@college.edu' }),
    )

    expect(state.items).toHaveLength(1)
    expect(state.error).toBe('A student with this ID already exists.')
  })

  it('prevents changing a student ID to one already assigned to another student', () => {
    const populated = studentsReducer(undefined, addStudent(student))
    const withTwoStudents = studentsReducer(
      populated,
      addStudent({ ...student, studentId: 'STU-002', email: 'another@college.edu' }),
    )
    const state = studentsReducer(
      withTwoStudents,
      updateStudent({
        studentId: 'STU-002',
        student: { ...student, studentId: 'stu-001', email: 'another@college.edu' },
      }),
    )

    expect(state.items.map(({ studentId }) => studentId)).toEqual(['STU-001', 'STU-002'])
    expect(state.error).toBe('A student with this ID already exists.')
  })

  it('rejects missing required fields and malformed email addresses', () => {
    const missingField = studentsReducer(undefined, addStudent({ ...student, section: ' ' }))
    const invalidEmail = studentsReducer(undefined, addStudent({ ...student, email: 'invalid-email' }))

    expect(missingField.items).toHaveLength(0)
    expect(missingField.error).toBe('Section is required.')
    expect(invalidEmail.items).toHaveLength(0)
    expect(invalidEmail.error).toBe('Enter a valid email address.')
  })
})
