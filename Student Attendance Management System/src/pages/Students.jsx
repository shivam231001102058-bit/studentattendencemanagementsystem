import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useAccessibleDialog from '../components/common/useAccessibleDialog'
import Icon from '../components/common/Icon'
import PageIntro from '../components/common/PageIntro'
import {
  clearStudentFeedback,
  addStudent,
  deleteStudent,
  updateStudent,
} from '../features/students/studentsSlice'
import {
  selectAllStudents,
  selectFilteredStudents,
  selectStudentCount,
} from '../features/students/studentsSelectors'
import { departments, sections, semesters } from '../features/students/studentOptions'
import {
  clearStudentFilters,
  setStudentDepartmentFilter,
  setStudentSearch,
  setStudentSectionFilter,
  setStudentSemesterFilter,
} from '../features/filters/filtersSlice'
import StudentForm from '../features/students/StudentForm'
import { fetchStudents } from '../features/students/studentsThunks'

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`)

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function Modal({ title, children, onClose, className = '' }) {
  const dialogRef = useAccessibleDialog(onClose)

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="student-modal-title"
        aria-modal="true"
        className={`student-modal ${className}`}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="student-modal-heading">
          <div>
            <h3 id="student-modal-title">{title}</h3>
          </div>
          <button aria-label="Close dialog" className="modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function StudentDetails({ student, onClose }) {
  return (
    <Modal className="details-modal" onClose={onClose} title="Student details">
      <div className="student-detail-identity">
        <span className="student-initials">
          {student.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
        </span>
        <div>
          <h4>{student.fullName}</h4>
          <span>{student.studentId}</span>
        </div>
      </div>
      <dl className="student-detail-grid">
        <div><dt>Department</dt><dd>{student.department}</dd></div>
        <div><dt>Semester</dt><dd>{student.semester}</dd></div>
        <div><dt>Section</dt><dd>{student.section}</dd></div>
        <div><dt>Email</dt><dd><a href={`mailto:${student.email}`}>{student.email}</a></dd></div>
        <div><dt>Created date</dt><dd>{formatDate(student.createdDate)}</dd></div>
      </dl>
      <div className="modal-actions">
        <button className="button button-secondary" onClick={onClose} type="button">Close</button>
      </div>
    </Modal>
  )
}

function Students() {
  const dispatch = useDispatch()
  const students = useSelector(selectAllStudents)
  const filteredStudents = useSelector(selectFilteredStudents)
  const studentCount = useSelector(selectStudentCount)
  const { search, department, semester, section } = useSelector((state) => state.filters)
  const { error, message, fetch: fetchState } = useSelector((state) => state.students)
  const [editingStudent, setEditingStudent] = useState(null)
  const [viewingStudent, setViewingStudent] = useState(null)
  const [deletingStudent, setDeletingStudent] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const hasFilters = Boolean(search.trim() || department || semester || section)

  function openAddForm() {
    dispatch(clearStudentFeedback())
    setEditingStudent(null)
    setIsFormOpen(true)
  }

  function openEditForm(student) {
    dispatch(clearStudentFeedback())
    setEditingStudent(student)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingStudent(null)
  }

  function saveStudent(student) {
    const normalizedId = student.studentId.toLocaleLowerCase()
    const existing = students.find(
      (item) =>
        item.studentId.toLocaleLowerCase() === normalizedId &&
        item.studentId.toLocaleLowerCase() !== editingStudent?.studentId.toLocaleLowerCase(),
    )

    if (existing) {
      return 'A student with this ID already exists.'
    }

    if (editingStudent) {
      dispatch(updateStudent({ studentId: editingStudent.studentId, student }))
    } else {
      dispatch(addStudent(student))
    }

    closeForm()
    return null
  }

  function confirmDelete() {
    dispatch(deleteStudent(deletingStudent.studentId))
    setDeletingStudent(null)
  }

  return (
    <>
      <PageIntro
        description="Browse and organize student records across your campus."
        eyebrow="CAMPUS DIRECTORY"
        title="Students"
      >
        <button
          aria-busy={fetchState.status === 'loading'}
          className="button button-secondary"
          disabled={fetchState.status === 'loading'}
          onClick={() => dispatch(fetchStudents())}
          type="button"
        >
          {fetchState.status === 'loading' ? 'Refreshing…' : 'Refresh directory'}
        </button>
        <button className="button button-primary" onClick={openAddForm} type="button">
          <span aria-hidden="true">+</span>
          Add student
        </button>
      </PageIntro>

      <div aria-live="polite" className="student-feedback">
        {message && <p className="feedback-success" role="status">{message}</p>}
        {error && <p className="feedback-error" role="alert">{error}</p>}
        {fetchState.status === 'loading' && <p className="feedback-status" role="status">Fetching student records from the mock service…</p>}
        {fetchState.message && <p className="feedback-success" role="status">{fetchState.message}</p>}
        {fetchState.error && <p className="feedback-error" role="alert">{fetchState.error}</p>}
      </div>

      <section aria-label="Student directory" className="panel student-directory">
        <div className="directory-heading">
          <div>
            <h3>Student directory <span className="student-count">{studentCount}</span></h3>
            <p>Manage student records and academic details.</p>
          </div>
          <label className="search-field directory-search">
            <Icon name="search" size={18} />
            <input
              aria-label="Search by student ID or full name"
              onChange={(event) => dispatch(setStudentSearch(event.target.value))}
              placeholder="Search ID or name..."
              type="search"
              value={search}
            />
          </label>
        </div>
        <div aria-label="Student filters" className="student-filters">
          <label className="filter-field">
            <span>Department</span>
            <select
              aria-label="Filter by department"
              onChange={(event) => dispatch(setStudentDepartmentFilter(event.target.value))}
              value={department}
            >
              <option value="">All departments</option>
              {departments.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span>Semester</span>
            <select
              aria-label="Filter by semester"
              onChange={(event) => dispatch(setStudentSemesterFilter(event.target.value))}
              value={semester}
            >
              <option value="">All semesters</option>
              {semesters.map((option) => <option key={option} value={option}>Semester {option}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span>Section</span>
            <select
              aria-label="Filter by section"
              onChange={(event) => dispatch(setStudentSectionFilter(event.target.value))}
              value={section}
            >
              <option value="">All sections</option>
              {sections.map((option) => <option key={option} value={option}>Section {option}</option>)}
            </select>
          </label>
          {hasFilters && (
            <button
              className="clear-filters-button"
              onClick={() => dispatch(clearStudentFilters())}
              type="button"
            >
              Clear filters
            </button>
          )}
          <span className="result-count">
            Showing <strong>{filteredStudents.length}</strong> of {studentCount}
          </span>
        </div>
        <div className="table-scroll student-table-scroll">
          <table className="student-table">
            <thead>
              <tr>
                <th>STUDENT ID</th>
                <th>STUDENT</th>
                <th>DEPARTMENT</th>
                <th>SEMESTER</th>
                <th>SECTION</th>
                <th>CREATED</th>
                <th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.studentId}>
                  <td><span className="student-id">{student.studentId}</span></td>
                  <td>
                    <button className="student-name-button" onClick={() => setViewingStudent(student)} type="button">
                      <span className="student-avatar">
                        {student.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                      </span>
                      <span className="student-name-copy">
                        <strong>{student.fullName}</strong>
                        <span>{student.email}</span>
                      </span>
                    </button>
                  </td>
                  <td>{student.department}</td>
                  <td>{student.semester}</td>
                  <td><span className="section-badge">{student.section}</span></td>
                  <td>{formatDate(student.createdDate)}</td>
                  <td>
                    <div className="student-row-actions">
                      <button aria-label={`View ${student.fullName}`} className="row-action" onClick={() => setViewingStudent(student)} type="button">View</button>
                      <button aria-label={`Edit ${student.fullName}`} className="row-action" onClick={() => openEditForm(student)} type="button">Edit</button>
                      <button aria-label={`Delete ${student.fullName}`} className="row-action row-action-delete" onClick={() => setDeletingStudent(student)} type="button">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td className="student-empty-cell" colSpan="7">
                    <div className="student-empty-state">
                      <span className="student-empty-icon"><Icon name="students" size={23} /></span>
                      <strong>{hasFilters ? 'No matching students' : 'No students yet'}</strong>
                      <span>
                        {hasFilters
                          ? 'Try adjusting your search or filters.'
                          : 'Add a student to start building your campus directory.'}
                      </span>
                      {hasFilters ? (
                        <button className="clear-filters-button" onClick={() => dispatch(clearStudentFilters())} type="button">
                          Clear all filters
                        </button>
                      ) : (
                        <button className="button button-secondary" onClick={openAddForm} type="button">
                          Add your first student
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen && (
        <Modal
          className="student-form-modal"
          onClose={closeForm}
          title={editingStudent ? 'Edit student' : 'Add student'}
        >
          <p className="modal-subtitle">
            {editingStudent
              ? 'Update this student’s academic and contact details.'
              : 'Enter the student’s academic and contact details.'}
          </p>
          <StudentForm key={editingStudent?.studentId ?? 'new-student'} onCancel={closeForm} onSave={saveStudent} student={editingStudent} />
        </Modal>
      )}

      {viewingStudent && (
        <StudentDetails onClose={() => setViewingStudent(null)} student={viewingStudent} />
      )}

      {deletingStudent && (
        <Modal className="confirm-modal" onClose={() => setDeletingStudent(null)} title="Delete student?">
          <p className="confirm-copy">
            Are you sure you want to delete <strong>{deletingStudent.fullName}</strong>? This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="button button-secondary" data-dialog-initial-focus onClick={() => setDeletingStudent(null)} type="button">
              Cancel
            </button>
            <button className="button button-danger" onClick={confirmDelete} type="button">
              Delete student
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default Students
