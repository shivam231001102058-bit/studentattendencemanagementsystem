import { Provider } from 'react-redux'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { store } from '../app/store'
import App from '../App'

function renderApp(initialEntry = '/') {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </Provider>,
  )
}

describe('application routes', () => {
  it('renders the dashboard with summary information', () => {
    renderApp()

    expect(screen.getByRole('heading', { level: 2, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Attendance statistics' })).toBeInTheDocument()
    expect(screen.getByText('Registered students')).toBeInTheDocument()
  })

  it('renders the student directory route', () => {
    renderApp('/students')

    expect(screen.getByRole('heading', { level: 2, name: 'Students' })).toBeInTheDocument()
    expect(screen.getByText('No students yet')).toBeInTheDocument()
  })

  it('renders a not found page for unknown routes', () => {
    renderApp('/unknown')

    expect(screen.getByRole('heading', { level: 3, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to dashboard' })).toHaveAttribute('href', '/')
  })

  it('opens and closes the mobile navigation with Escape and route selection', async () => {
    renderApp()
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveFocus()

    fireEvent.click(menuButton)
    fireEvent.click(screen.getByRole('link', { name: 'Students' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Students' })).toBeInTheDocument()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Students' })).toHaveAttribute('aria-current', 'page')
  })
})
