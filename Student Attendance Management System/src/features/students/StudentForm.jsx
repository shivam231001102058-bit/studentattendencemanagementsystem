import { useState } from 'react'
import { departments, sections, semesters } from './studentOptions'

function getToday() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

function StudentForm({ student, onCancel, onSave }) {
  const [formData, setFormData] = useState(
    student ?? {
      studentId: '',
      fullName: '',
      department: '',
      semester: '',
      section: '',
      email: '',
      createdDate: getToday(),
    },
  )
  const [formError, setFormError] = useState('')
  const [invalidField, setInvalidField] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setInvalidField('')
    setFormError('')
  }

  function showFieldError(field, message) {
    setInvalidField(field)
    setFormError(message)
    requestAnimationFrame(() => {
      document.querySelector(`[name="${field}"]`)?.focus()
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const required = [
      ['studentId', 'Student ID'],
      ['fullName', 'Full name'],
      ['department', 'Department'],
      ['semester', 'Semester'],
      ['section', 'Section'],
      ['email', 'Email'],
      ['createdDate', 'Created date'],
    ]
    const missing = required.find(([field]) => !String(formData[field] ?? '').trim())

    if (missing) {
      showFieldError(missing[0], `${missing[1]} is required.`)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      showFieldError('email', 'Enter a valid email address.')
      return
    }

    const error = onSave(
      Object.fromEntries(
        required.map(([field]) => [field, String(formData[field]).trim()]),
      ),
    )

    if (error) {
      setInvalidField('studentId')
      setFormError(error)
    }
  }

  function invalidProps(field) {
    return invalidField === field
      ? { 'aria-invalid': true, 'aria-describedby': 'student-form-error' }
      : {}
  }

  return (
    <form className="student-form" noValidate onSubmit={handleSubmit}>
      <div className="student-form-grid">
        <label className="form-field">
          <span>Student ID <b aria-hidden="true">*</b></span>
          <input
            autoComplete="off"
            autoFocus
            name="studentId"
            onChange={updateField}
            placeholder="e.g. STU-2026-001"
            required
            value={formData.studentId}
            {...invalidProps('studentId')}
          />
        </label>
        <label className="form-field">
          <span>Full name <b aria-hidden="true">*</b></span>
          <input
            autoComplete="name"
            name="fullName"
            onChange={updateField}
            placeholder="Enter student's full name"
            required
            value={formData.fullName}
            {...invalidProps('fullName')}
          />
        </label>
        <label className="form-field">
          <span>Department <b aria-hidden="true">*</b></span>
          <select {...invalidProps('department')} name="department" onChange={updateField} required value={formData.department}>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </label>
        <div className="form-field-pair">
          <label className="form-field">
            <span>Semester <b aria-hidden="true">*</b></span>
            <select {...invalidProps('semester')} name="semester" onChange={updateField} required value={formData.semester}>
              <option value="">Select</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section <b aria-hidden="true">*</b></span>
            <select {...invalidProps('section')} name="section" onChange={updateField} required value={formData.section}>
              <option value="">Select</option>
              {sections.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="form-field">
          <span>Email address <b aria-hidden="true">*</b></span>
          <input
            autoComplete="email"
            name="email"
            onChange={updateField}
            placeholder="student@college.edu"
            required
            type="email"
            value={formData.email}
            {...invalidProps('email')}
          />
        </label>
        <label className="form-field">
          <span>Created date <b aria-hidden="true">*</b></span>
          <input aria-readonly="true" name="createdDate" readOnly required type="date" value={formData.createdDate} />
        </label>
      </div>
      {formError && <p className="form-error" id="student-form-error" role="alert">{formError}</p>}
      <p className="form-required-note"><b aria-hidden="true">*</b> Required fields</p>
      <div className="modal-actions">
        <button className="button button-secondary" onClick={onCancel} type="button">Cancel</button>
        <button className="button button-primary" type="submit">
          {student ? 'Save changes' : 'Add student'}
        </button>
      </div>
    </form>
  )
}

export default StudentForm
