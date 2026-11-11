import { useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import {
  addSubject,
  clearSubjectFeedback,
  deleteSubject,
  selectAllSubjects,
  updateSubject,
} from './subjectsSlice'

function SubjectManager({ onSubjectRemoved = () => {} }) {
  const dispatch = useDispatch()
  const store = useStore()
  const subjects = useSelector(selectAllSubjects)
  const { error, message } = useSelector((state) => state.subjects)
  const [newSubject, setNewSubject] = useState('')
  const [editing, setEditing] = useState(null)

  function submitNewSubject(event) {
    event.preventDefault()
    dispatch(addSubject(newSubject))
    if (!store.getState().subjects.error) setNewSubject('')
  }

  function submitEdit(event) {
    event.preventDefault()
    dispatch(updateSubject(editing))
    if (!store.getState().subjects.error) {
      onSubjectRemoved(editing.subject)
      setEditing(null)
    }
  }

  function confirmDelete(subject) {
    const confirmed = globalThis.confirm(
      `Remove ${subject} from the subject choices? Existing attendance history will remain unchanged.`,
    )
    if (confirmed) {
      dispatch(deleteSubject(subject))
      onSubjectRemoved(subject)
    }
  }

  return (
    <section aria-labelledby="manage-subjects-heading" className="panel subject-management-panel">
      <div className="panel-heading">
        <div>
          <h3 id="manage-subjects-heading">Manage subjects</h3>
          <p>Changes affect new attendance entries; saved history is preserved.</p>
        </div>
      </div>
      <div aria-live="polite">
        {message && <p className="feedback-success" role="status">{message}</p>}
        {error && <p className="feedback-error" role="alert">{error}</p>}
      </div>
      <form className="subject-add-form" onSubmit={submitNewSubject}>
        <label className="attendance-field">
          <span>New subject name</span>
          <input
            onChange={(event) => {
              setNewSubject(event.target.value)
              dispatch(clearSubjectFeedback())
            }}
            value={newSubject}
          />
        </label>
        <button className="button button-secondary" type="submit">Add subject</button>
      </form>
      <ul aria-label="Configured subjects" className="subject-management-list">
        {subjects.map((subject) => (
          <li key={subject}>
            {editing?.subject === subject ? (
              <form className="subject-edit-form" onSubmit={submitEdit}>
                <label className="visually-hidden" htmlFor="edit-subject-name">Subject name</label>
                <input
                  id="edit-subject-name"
                  onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                  value={editing.name}
                />
                <button className="row-action" type="submit">Save</button>
                <button className="row-action" onClick={() => setEditing(null)} type="button">Cancel</button>
              </form>
            ) : (
              <>
                <span>{subject}</span>
                <span className="subject-actions">
                  <button
                    aria-label={`Edit subject ${subject}`}
                    className="row-action"
                    onClick={() => {
                      dispatch(clearSubjectFeedback())
                      setEditing({ subject, name: subject })
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    aria-label={`Delete subject ${subject}`}
                    className="row-action row-action-delete"
                    onClick={() => confirmDelete(subject)}
                    type="button"
                  >
                    Delete
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
        {subjects.length === 0 && <li>No configured subjects. Add one to mark attendance.</li>}
      </ul>
    </section>
  )
}

export default SubjectManager
