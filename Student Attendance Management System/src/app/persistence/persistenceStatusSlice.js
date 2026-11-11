import { createSlice } from '@reduxjs/toolkit'

export const initialPersistenceStatus = {
  error: null,
}

const persistenceStatusSlice = createSlice({
  name: 'persistence',
  initialState: initialPersistenceStatus,
  reducers: {
    persistenceFailed(state, action) {
      state.error = action.payload
    },
    persistenceRecovered(state) {
      state.error = null
    },
    dismissPersistenceError(state) {
      state.error = null
    },
  },
})

export const {
  persistenceFailed,
  persistenceRecovered,
  dismissPersistenceError,
} = persistenceStatusSlice.actions

export default persistenceStatusSlice.reducer
