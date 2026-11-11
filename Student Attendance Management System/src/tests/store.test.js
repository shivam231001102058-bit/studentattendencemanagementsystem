import { describe, expect, it } from 'vitest'
import { store } from '../app/store'

describe('Redux store', () => {
  it('registers the initial state for each feature slice', () => {
    const state = store.getState()

    expect(Object.keys(state)).toEqual([
      'students',
      'attendance',
      'filters',
      'dashboard',
      'reports',
      'subjects',
      'persistence',
    ])
    expect(state.students).toMatchObject({ items: [], status: 'idle', error: null })
    expect(state.attendance).toMatchObject({ records: [], status: 'idle', error: null })
    expect(state.filters).toMatchObject({
      search: '',
      dateRange: 'this-week',
      department: '',
      semester: '',
      section: '',
    })
    expect(state.dashboard).toMatchObject({
      filters: {
        dateRange: 'all-time',
        subject: '',
        semester: '',
        section: '',
      },
      lowAttendanceThreshold: 45,
    })
    expect(state.reports).toMatchObject({ status: 'idle', error: null })
    expect(state.subjects.items).toContain('Physics')
    expect(state.persistence).toEqual({ error: null })
  })
})
