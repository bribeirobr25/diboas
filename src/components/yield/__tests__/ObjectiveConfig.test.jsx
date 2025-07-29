/**
 * ObjectiveConfig Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import ObjectiveConfig from '../ObjectiveConfig.jsx'

// Mock the navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()]
  }
})

// Mock PageHeader
vi.mock('../../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

describe('ObjectiveConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders objective configuration page with correct title', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    expect(screen.getByText('Configure FinObjective')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2: Choose Objective')).toBeInTheDocument()
  })

  test('displays predefined financial objectives', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
    expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    expect(screen.getByText('Dream Vacation')).toBeInTheDocument()
    expect(screen.getByText('New Car')).toBeInTheDocument()
    expect(screen.getByText('Home Down Payment')).toBeInTheDocument()
    expect(screen.getByText('Education Fund')).toBeInTheDocument()
  })

  test('shows create custom objective option', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    expect(screen.getByText('Create Custom Objective')).toBeInTheDocument()
    expect(screen.getByText('Define your own financial goal')).toBeInTheDocument()
  })

  test('proceeds to configuration step when objective is selected', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Click on Emergency Fund objective
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // Should now show step 2
    expect(screen.getByText('Step 2 of 2: Configuration')).toBeInTheDocument()
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  test('shows custom objective fields when create custom is clicked', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Click on create custom objective
    const customCard = screen.getByText('Create Custom Objective').closest('.objective-config__custom-card')
    fireEvent.click(customCard)

    // Should show custom fields
    expect(screen.getByText('Objective Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Start a Business')).toBeInTheDocument()
  })

  test('displays financial parameter inputs', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Select an objective first
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // Check for financial inputs
    expect(screen.getByText('Target Amount (USD)')).toBeInTheDocument()
    expect(screen.getByText('Timeframe (Months)')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument() // Emergency fund default
    expect(screen.getByDisplayValue('12')).toBeInTheDocument() // Emergency fund default timeframe
  })

  test('displays risk level selection options', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Select an objective first
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // Check for risk levels
    expect(screen.getByText('Conservative')).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.getByText('Balanced')).toBeInTheDocument()
    expect(screen.getByText('Aggressive')).toBeInTheDocument()
  })

  test('validates form inputs before allowing strategy creation', async () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Select an objective
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // Clear the amount field
    const amountInput = screen.getByDisplayValue('5000')
    fireEvent.change(amountInput, { target: { value: '' } })

    // Button should be disabled
    expect(screen.getByText('Complete Configuration')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Complete Configuration/ })).toBeDisabled()
  })

  test('enables strategy creation when all fields are valid', async () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Select an objective
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // All fields should be pre-filled, button should be enabled
    await waitFor(() => {
      expect(screen.getByText('Create Strategy')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create Strategy/ })).not.toBeDisabled()
    })
  })

  test('navigates to strategy manager when strategy is created', async () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Select an objective
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // Click create strategy
    const createButton = screen.getByRole('button', { name: /Create Strategy/ })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/yield/manage?strategy=new')
    })
  })

  test('shows objective tips for predefined objectives', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Select emergency fund
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // Check for tips
    expect(screen.getByText('Tips for Emergency Fund')).toBeInTheDocument()
    expect(screen.getByText('Aim for 3-6 months of expenses')).toBeInTheDocument()
  })

  test('handles back navigation correctly', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // From step 1, back should go to yield category
    const backButton = screen.getAllByText('Back')[0] // Get first back button
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/category/yield')
  })

  test('allows custom risk level selection', () => {
    render(
      <BrowserRouter>
        <ObjectiveConfig />
      </BrowserRouter>
    )

    // Select an objective
    const emergencyFundCard = screen.getByText('Emergency Fund').closest('.objective-config__objective-card')
    fireEvent.click(emergencyFundCard)

    // Click on moderate risk level
    const moderateRisk = screen.getByText('Moderate').closest('.objective-config__risk-card')
    fireEvent.click(moderateRisk)

    // The moderate risk card should be selected (have ring styling)
    expect(moderateRisk).toHaveClass('ring-2', 'ring-blue-500')
  })
})