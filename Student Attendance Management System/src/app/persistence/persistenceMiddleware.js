import {
  getBrowserStorage,
  persistenceKey,
  serializePersistedState,
} from './persistence'
import {
  persistenceFailed,
  persistenceRecovered,
} from './persistenceStatusSlice'

function hasPersistedStateChanged(previousState, currentState) {
  return (
    previousState.students.items !== currentState.students.items ||
    previousState.attendance.records !== currentState.attendance.records ||
    previousState.subjects.items !== currentState.subjects.items ||
    previousState.dashboard.lowAttendanceThreshold !==
      currentState.dashboard.lowAttendanceThreshold
  )
}

export function createPersistenceMiddleware(getStorage = getBrowserStorage) {
  return (api) => (next) => (action) => {
    const previousState = api.getState()
    const result = next(action)
    const currentState = api.getState()

    if (!hasPersistedStateChanged(previousState, currentState)) {
      return result
    }

    try {
      const storage = getStorage()
      if (!storage) {
        throw new Error('Local storage is unavailable.')
      }
      storage.setItem(persistenceKey, serializePersistedState(currentState))
      if (currentState.persistence.error) {
        api.dispatch(persistenceRecovered())
      }
    } catch {
      api.dispatch(
        persistenceFailed('Changes could not be saved to local storage. Check browser storage availability.'),
      )
    }

    return result
  }
}
