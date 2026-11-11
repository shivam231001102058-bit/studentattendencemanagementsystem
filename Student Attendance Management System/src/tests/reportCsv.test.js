import { describe, expect, it, vi } from 'vitest'
import {
  buildReportCsv,
  createReportFilename,
  downloadReportCsv,
  escapeCsvCell,
} from '../features/reports/reportCsv'

describe('report CSV export', () => {
  it('writes headers and report rows using only report columns', () => {
    const csv = buildReportCsv([{
      studentId: 'STU-001',
      studentName: 'Jordan Lee',
      subject: 'Physics',
      date: '2026-11-11',
      semester: '3',
      section: 'A',
      attendanceStatus: 'P',
      totalRecords: 1,
      totalApplicableRecords: 1,
      presentCount: 1,
      absentCount: 0,
      officialEngagementCount: 0,
      internshipPlacedCount: 0,
      attendancePercentage: 100,
      email: 'private@college.edu',
    }])

    expect(csv).toContain('"Student ID","Student name","Subject","Date"')
    expect(csv).toContain('"STU-001","Jordan Lee","Physics","2026-11-11"')
    expect(csv).toContain('"Attendance percentage","Attendance status"')
    expect(csv).not.toContain('private@college.edu')
  })

  it('escapes commas, double quotes, newlines, and special characters', () => {
    expect(escapeCsvCell('Taylor, "T" Morgan')).toBe('"Taylor, ""T"" Morgan"')
    expect(escapeCsvCell('Line one\nLine two')).toBe('"Line one\nLine two"')
    expect(escapeCsvCell('A; B, C')).toBe('"A; B, C"')
  })

  it('returns an empty result without CSV content for empty reports', () => {
    expect(buildReportCsv([])).toBe('')
    expect(downloadReportCsv({ rows: [], reportType: 'daily' })).toEqual({
      downloaded: false,
      reason: 'empty',
    })
  })

  it('creates a meaningful filename based on report type and date', () => {
    expect(createReportFilename('student', new Date(2026, 10, 11))).toBe(
      'student-attendance-report-2026-11-11.csv',
    )
  })

  it('downloads the file and revokes the temporary object URL', () => {
    const link = {
      style: {},
      click: vi.fn(),
      remove: vi.fn(),
    }
    const documentObject = {
      body: { append: vi.fn() },
      createElement: vi.fn(() => link),
    }
    const urlApi = {
      createObjectURL: vi.fn(() => 'blob:report'),
      revokeObjectURL: vi.fn(),
    }

    const result = downloadReportCsv({
      rows: [{ studentId: 'STU-001' }],
      reportType: 'daily',
      documentObject,
      urlApi,
      BlobConstructor: Blob,
    })

    expect(result.downloaded).toBe(true)
    expect(link.download).toMatch(/^daily-attendance-report-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(link.click).toHaveBeenCalledOnce()
    expect(link.remove).toHaveBeenCalledOnce()
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })
})
