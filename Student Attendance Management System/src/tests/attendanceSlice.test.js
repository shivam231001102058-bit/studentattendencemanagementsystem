import { describe, expect, it } from 'vitest'
import attendanceReducer, {
  attendanceStatuses,
  deleteAttendance,
  markAttendance,
  markBulkAttendance,
  updateAttendance,
} from '../features/attendance/attendanceSlice'

const record = {
  studentId: 'STU-001',
  studentName: 'Jordan Lee',
  date: '2026-11-11',
  subject: 'Introduction to Programming',
  semester: '3',
  section: 'A',
  attendanceStatus: 'P',
}

describe('attendanceSlice', () => {
  it('marks attendance with a unique ID and timestamps', () => {
    const state = attendanceReducer(undefined, markAttendance(record))
    const [saved] = state.records

    expect(saved).toMatchObject(record)
    expect(saved.recordId).toBeTruthy()
    expect(saved.createdAt).toBeTruthy()
    expect(saved.updatedAt).toBe(saved.createdAt)
    expect(state.message).toBe('Attendance marked successfully.')
  })

  it('updates an existing record and preserves its ID and creation time', () => {
    const initial = attendanceReducer(undefined, markAttendance(record))
    const existing = initial.records[0]
    const state = attendanceReducer(
      initial,
      updateAttendance(existing.recordId, { attendanceStatus: 'A' }),
    )

    expect(state.records).toHaveLength(1)
    expect(state.records[0]).toMatchObject({
      recordId: existing.recordId,
      createdAt: existing.createdAt,
      attendanceStatus: 'A',
    })
    expect(state.records[0].updatedAt).toBeTruthy()
    expect(state.message).toBe('Attendance updated successfully.')
  })

  it('supports exactly the four attendance statuses', () => {
    for (const [index, attendanceStatus] of attendanceStatuses.entries()) {
      const state = attendanceReducer(
        undefined,
        markAttendance({ ...record, studentId: `STU-00${index + 1}`, attendanceStatus }),
      )

      expect(state.records[0].attendanceStatus).toBe(attendanceStatus)
      expect(state.error).toBeNull()
    }

    expect(attendanceStatuses).toEqual(['P', 'A', 'PL', 'E'])
  })

  it('prevents a duplicate student, subject, and date record', () => {
    const initial = attendanceReducer(undefined, markAttendance(record))
    const state = attendanceReducer(
      initial,
      markAttendance({ ...record, attendanceStatus: 'A' }),
    )

    expect(state.records).toHaveLength(1)
    expect(state.error).toMatch(/already recorded/i)
  })

  it('bulk marks records and updates matching entries without creating duplicates', () => {
    const initial = attendanceReducer(undefined, markAttendance(record))
    const state = attendanceReducer(
      initial,
      markBulkAttendance({
        date: record.date,
        subject: record.subject,
        semester: record.semester,
        section: record.section,
        records: [
          { studentId: record.studentId, studentName: record.studentName, attendanceStatus: 'PL' },
          { studentId: 'STU-002', studentName: 'Taylor Morgan', attendanceStatus: 'E' },
        ],
      }),
    )

    expect(state.records).toHaveLength(2)
    expect(state.records[0]).toMatchObject({
      recordId: initial.records[0].recordId,
      createdAt: initial.records[0].createdAt,
      attendanceStatus: 'PL',
    })
    expect(state.records[1]).toMatchObject({
      studentId: 'STU-002',
      attendanceStatus: 'E',
    })
    expect(state.message).toBe('Attendance saved successfully.')
  })

  it('validates required data, status, and non-empty bulk attendance', () => {
    const missingDate = attendanceReducer(undefined, markAttendance({ ...record, date: '' }))
    const invalidStatus = attendanceReducer(
      undefined,
      markAttendance({ ...record, attendanceStatus: 'L' }),
    )
    const emptyBulk = attendanceReducer(
      undefined,
      markBulkAttendance({
        date: record.date,
        subject: record.subject,
        semester: record.semester,
        section: record.section,
        records: [],
      }),
    )

    expect(missingDate.error).toBe('Enter a valid attendance date.')
    expect(invalidStatus.error).toBe('Select a valid attendance status.')
    expect(emptyBulk.error).toBe('There are no registered students to mark attendance for.')
  })

  it('deletes an attendance record by its unique ID', () => {
    const initial = attendanceReducer(undefined, markAttendance(record))
    const state = attendanceReducer(initial, deleteAttendance(initial.records[0].recordId))

    expect(state.records).toEqual([])
    expect(state.message).toBe('Attendance record deleted.')
  })
})
