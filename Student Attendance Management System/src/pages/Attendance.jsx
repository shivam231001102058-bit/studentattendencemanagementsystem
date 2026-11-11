import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useAccessibleDialog from '../components/common/useAccessibleDialog'
import Icon from '../components/common/Icon'
import PageIntro from '../components/common/PageIntro'
import { sections, semesters } from '../features/students/studentOptions'
import { selectAllStudents } from '../features/students/studentsSelectors'
import {
  attendanceStatusLabels,
  attendanceStatuses,
  clearAttendanceFeedback,
  deleteAttendance,
  updateAttendance,
} from '../features/attendance/attendanceSlice'
import { saveAttendanceRecords } from '../features/attendance/attendanceThunks'
import {
  selectAttendanceHistory,
  selectStudentsForAttendance,
} from '../features/attendance/attendanceSelectors'
import SubjectManager from '../features/subjects/SubjectManager'
import { selectAllSubjects } from '../features/subjects/subjectsSlice'

function getToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`)

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function Modal({ title, children, onClose }) {
  const dialogRef = useAccessibleDialog(onClose)

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="attendance-modal-title"
        aria-modal="true"
        className="student-modal attendance-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="student-modal-heading">
          <h3 id="attendance-modal-title">{title}</h3>
          <button aria-label="Close dialog" className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        {children}
      </section>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`attendance-status status-${status.toLowerCase()}`}>
      <span>{status}</span>
      {attendanceStatusLabels[status]}
    </span>
  )
}

function Attendance() {
  const dispatch = useDispatch()
  const subjects = useSelector(selectAllSubjects)
  const students = useSelector(selectAllStudents)
  const records = useSelector(selectAttendanceHistory)
  const registeredCount = students.length
  const { error, message, status } = useSelector((state) => state.attendance)
  const [date, setDate] = useState(getToday)
  const [subject, setSubject] = useState('')
  const [semester, setSemester] = useState('')
  const [section, setSection] = useState('')
  const [statusDrafts, setStatusDrafts] = useState({})
  const [formError, setFormError] = useState('')
  const [invalidField, setInvalidField] = useState('')
  const [editingRecord, setEditingRecord] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [deletingRecord, setDeletingRecord] = useState(null)
  const isSaving = status === 'saving'
  const matchingStudents = useSelector((state) =>
    selectStudentsForAttendance(state, semester, section),
  )

  const recordByStudent = useMemo(() => {
    const lookup = new Map()
    records.forEach((record) => {
      if (
        record.date === date &&
        record.subject === subject &&
        String(record.semester) === String(semester) &&
        record.section === section
      ) {
        lookup.set(record.studentId.toLocaleLowerCase(), record)
      }
    })
    return lookup
  }, [records, date, subject, semester, section])

  const missingStatuses = matchingStudents.filter(
    (student) =>
      !attendanceStatuses.includes(
        statusDrafts[student.studentId] ??
          recordByStudent.get(student.studentId.toLocaleLowerCase())?.attendanceStatus,
      ),
  )

  function changeField(setter) {
    return (event) => {
      dispatch(clearAttendanceFeedback())
      setStatusDrafts({})
      setFormError('')
      setInvalidField('')
      setter(event.target.value)
    }
  }

  function showFormError(message, field = '') {
    setFormError(message)
    setInvalidField(field)
    if (field && field !== 'students') {
      requestAnimationFrame(() => document.getElementById(field)?.focus())
    }
  }

  function handleSave(event) {
    event.preventDefault()
    if (isSaving) return

    setFormError('')
    if (!date) {
      showFormError('Date is required.', 'attendance-date')
      return
    }
    if (!subject) {
      showFormError('Subject is required.', 'attendance-subject')
      return
    }
    if (!semester) {
      showFormError('Semester is required.', 'attendance-semester')
      return
    }
    if (!section) {
      showFormError('Section is required.', 'attendance-section')
      return
    }
    if (!matchingStudents.length) {
      showFormError('There are no registered students in the selected semester and section.', 'students')
      return
    }
    if (missingStatuses.length) {
      showFormError(
        'Select an attendance status for every listed student.',
        `attendance-${missingStatuses[0].studentId}`,
      )
      return
    }

    const attendanceRows = matchingStudents.map((student) => ({
      studentId: student.studentId,
      studentName: student.fullName,
      attendanceStatus:
        statusDrafts[student.studentId] ??
        recordByStudent.get(student.studentId.toLocaleLowerCase()).attendanceStatus,
    }))

    dispatch(saveAttendanceRecords({
      date,
      subject,
      semester,
      section,
      records: attendanceRows,
    }))
  }

  function openRecordEditor(record) {
    setEditingRecord(record)
    setEditStatus(record.attendanceStatus)
  }

  function saveRecordEdit(event) {
    event.preventDefault()
    if (!attendanceStatuses.includes(editStatus)) return

    dispatch(updateAttendance(editingRecord.recordId, {
      attendanceStatus: editStatus,
    }))
    setEditingRecord(null)
  }

  function confirmDelete() {
    dispatch(deleteAttendance(deletingRecord.recordId))
    setDeletingRecord(null)
  }

  return (
    <>
      <PageIntro
        description="Record and review class attendance using registered student records."
        eyebrow="CLASS RECORDS"
        title="Attendance"
      />

      <div aria-live="polite" className="attendance-feedback">
        {isSaving && <p className="feedback-status" role="status">Saving attendance…</p>}
        {message && <p className="feedback-success" role="status">{message}</p>}
        {error && <p className="feedback-error" role="alert">{error}</p>}
        {formError && <p className="feedback-error" id="attendance-form-error" role="alert">{formError}</p>}
      </div>

      <SubjectManager
        onSubjectRemoved={(removedSubject) => {
          if (subject === removedSubject) {
            setSubject('')
            setStatusDrafts({})
          }
        }}
      />

      <section aria-labelledby="mark-attendance-heading" className="panel mark-attendance-panel">
        <div className="panel-heading attendance-panel-heading">
          <div>
            <h3 id="mark-attendance-heading">Mark attendance</h3>
            <p>Select a class and mark each registered student’s status.</p>
          </div>
          <span className="registered-count">{registeredCount} registered {registeredCount === 1 ? 'student' : 'students'}</span>
        </div>

        <form noValidate onSubmit={handleSave}>
          <div className="attendance-filters">
            <label className="attendance-field">
              <span>Date <b aria-hidden="true">*</b></span>
              <input
                aria-describedby={invalidField === 'attendance-date' ? 'attendance-form-error' : undefined}
                aria-invalid={invalidField === 'attendance-date'}
                aria-label="Attendance date"
                id="attendance-date"
                onChange={changeField(setDate)}
                required
                type="date"
                value={date}
              />
            </label>
            <label className="attendance-field">
              <span>Subject <b aria-hidden="true">*</b></span>
              <select
                aria-describedby={invalidField === 'attendance-subject' ? 'attendance-form-error' : undefined}
                aria-invalid={invalidField === 'attendance-subject'}
                aria-label="Subject"
                id="attendance-subject"
                onChange={changeField(setSubject)}
                required
                value={subject}
              >
                <option value="">Select subject</option>
                {subjects.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="attendance-field">
              <span>Semester <b aria-hidden="true">*</b></span>
              <select
                aria-describedby={invalidField === 'attendance-semester' ? 'attendance-form-error' : undefined}
                aria-invalid={invalidField === 'attendance-semester'}
                aria-label="Semester"
                id="attendance-semester"
                onChange={changeField(setSemester)}
                required
                value={semester}
              >
                <option value="">Select semester</option>
                {semesters.map((option) => <option key={option} value={option}>Semester {option}</option>)}
              </select>
            </label>
            <label className="attendance-field">
              <span>Section <b aria-hidden="true">*</b></span>
              <select
                aria-describedby={invalidField === 'attendance-section' ? 'attendance-form-error' : undefined}
                aria-invalid={invalidField === 'attendance-section'}
                aria-label="Section"
                id="attendance-section"
                onChange={changeField(setSection)}
                required
                value={section}
              >
                <option value="">Select section</option>
                {sections.map((option) => <option key={option} value={option}>Section {option}</option>)}
              </select>
            </label>
          </div>

          <div className="attendance-student-list">
            {!semester || !section ? (
              <div className="attendance-prompt">
                <span className="student-empty-icon"><Icon name="attendance" size={22} /></span>
                <strong>Select a semester and section</strong>
                <span>Registered students in that class will appear here.</span>
              </div>
            ) : matchingStudents.length === 0 ? (
              <div className="attendance-prompt">
                <span className="student-empty-icon"><Icon name="students" size={22} /></span>
                <strong>No registered students found</strong>
                <span>There are no students in Semester {semester}, Section {section}.</span>
              </div>
            ) : (
              <div className="table-scroll attendance-roster-scroll">
                <table className="attendance-roster">
                  <thead>
                    <tr><th>STUDENT</th><th>STUDENT ID</th><th>ATTENDANCE STATUS</th></tr>
                  </thead>
                  <tbody>
                    {matchingStudents.map((student) => {
                      const existingRecord = recordByStudent.get(student.studentId.toLocaleLowerCase())
                      const currentStatus = statusDrafts[student.studentId] ??
                        existingRecord?.attendanceStatus ?? ''

                      return (
                        <tr key={student.studentId}>
                          <td>
                            <span className="roster-student">
                              <span className="student-avatar">
                                {student.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                              </span>
                              <span className="student-name-copy">
                                <strong>{student.fullName}</strong>
                                <span>{student.email}</span>
                              </span>
                            </span>
                          </td>
                          <td><span className="student-id">{student.studentId}</span></td>
                          <td>
                            <label className="visually-hidden" htmlFor={`attendance-${student.studentId}`}>
                              Attendance status for {student.fullName}
                            </label>
                            <select
                              aria-describedby={invalidField === `attendance-${student.studentId}` ? 'attendance-form-error' : undefined}
                              aria-invalid={invalidField === `attendance-${student.studentId}`}
                              className={`roster-status-select${currentStatus ? ` selected-${currentStatus.toLowerCase()}` : ''}`}
                              id={`attendance-${student.studentId}`}
                              onChange={(event) =>
                                {
                                  setFormError('')
                                  setInvalidField('')
                                  setStatusDrafts((drafts) => ({
                                    ...drafts,
                                    [student.studentId]: event.target.value,
                                  }))
                                }
                              }
                              required
                              value={currentStatus}
                            >
                              <option value="">Select status</option>
                              {attendanceStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status} — {attendanceStatusLabels[status]}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="attendance-save-row">
            <span className="attendance-help">
              {matchingStudents.length > 0
                ? `${matchingStudents.length} students in this class`
                : 'No attendance changes will be saved until students are selected.'}
            </span>
            <button className="button button-primary" disabled={isSaving} type="submit">
              {isSaving ? 'Saving attendance…' : 'Save attendance'}
            </button>
          </div>
        </form>
      </section>

      <section aria-label="Attendance history" className="panel attendance-history-panel">
        <div className="panel-heading">
          <div>
            <h3>Attendance history <span className="student-count">{records.length}</span></h3>
            <p>Previously saved attendance records.</p>
          </div>
        </div>
        <div className="table-scroll attendance-history-scroll">
          <table className="attendance-history-table">
            <thead>
              <tr>
                <th>STUDENT</th><th>DATE</th><th>SUBJECT</th><th>SEMESTER</th>
                <th>SECTION</th><th>STATUS</th><th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.recordId}>
                  <td>
                    <span className="student-name-copy">
                      <strong>{record.studentName}</strong>
                      <span>{record.studentId}</span>
                    </span>
                  </td>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.subject}</td>
                  <td>{record.semester}</td>
                  <td><span className="section-badge">{record.section}</span></td>
                  <td><StatusBadge status={record.attendanceStatus} /></td>
                  <td>
                    <div className="student-row-actions">
                      <button aria-label={`Edit attendance for ${record.studentName} on ${formatDate(record.date)} for ${record.subject}`} className="row-action" onClick={() => openRecordEditor(record)} type="button">
                        Edit
                      </button>
                      <button aria-label={`Delete attendance for ${record.studentName} on ${formatDate(record.date)} for ${record.subject}`} className="row-action row-action-delete" onClick={() => setDeletingRecord(record)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td className="student-empty-cell" colSpan="7">
                    <div className="student-empty-state">
                      <span className="student-empty-icon"><Icon name="calendar" size={22} /></span>
                      <strong>No attendance records yet</strong>
                      <span>Saved attendance will appear here.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingRecord && (
        <Modal onClose={() => setEditingRecord(null)} title="Edit attendance">
          <p className="modal-subtitle">
            {editingRecord.studentName} · {editingRecord.studentId} · {formatDate(editingRecord.date)} · {editingRecord.subject}
          </p>
          <form onSubmit={saveRecordEdit}>
            <label className="form-field">
              <span>Attendance status <b aria-hidden="true">*</b></span>
              <select onChange={(event) => setEditStatus(event.target.value)} required value={editStatus}>
                {attendanceStatuses.map((status) => (
                  <option key={status} value={status}>{status} — {attendanceStatusLabels[status]}</option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={() => setEditingRecord(null)} type="button">Cancel</button>
              <button className="button button-primary" type="submit">Save changes</button>
            </div>
          </form>
        </Modal>
      )}

      {deletingRecord && (
        <Modal onClose={() => setDeletingRecord(null)} title="Delete attendance record?">
          <p className="confirm-copy">
            Delete the attendance record for <strong>{deletingRecord.studentName}</strong> on {formatDate(deletingRecord.date)}?
          </p>
          <div className="modal-actions">
            <button className="button button-secondary" data-dialog-initial-focus onClick={() => setDeletingRecord(null)} type="button">Cancel</button>
            <button className="button button-danger" onClick={confirmDelete} type="button">Delete record</button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default Attendance
