import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App.jsx'

describe('App skeleton', () => {
  it('renders the application heading', () => {
    render(<App />)
    expect(screen.getByText('StartupFund')).toBeInTheDocument()
  })

  it('renders the tagline copy', () => {
    render(<App />)
    expect(
      screen.getByText(/connecting founders with investors/i),
    ).toBeInTheDocument()
  })
})
