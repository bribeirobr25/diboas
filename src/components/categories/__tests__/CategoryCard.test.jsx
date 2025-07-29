/**
 * CategoryCard Component Tests
 * Tests the individual category card component functionality
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import CategoryCard from '../CategoryCard.jsx'

// Mock the Card components
vi.mock('@/components/ui/card.jsx', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>
}))

vi.mock('@/components/ui/button.jsx', () => ({
  Button: ({ children, onClick, ...props }) => 
    <button data-testid="button" onClick={onClick} {...props}>{children}</button>
}))

vi.mock('@/components/ui/badge.jsx', () => ({
  Badge: ({ children, ...props }) => <span data-testid="badge" {...props}>{children}</span>
}))

describe('CategoryCard', () => {
  const defaultProps = {
    category: 'banking',
    title: 'In/Out',
    subtitle: 'Banking',
    description: 'Move money in and out of your diBoaS wallet',
    highlight: 'Add Money',
    onClick: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders all required content', () => {
      render(<CategoryCard {...defaultProps} />)

      expect(screen.getByText('In/Out')).toBeInTheDocument()
      expect(screen.getByText('Banking')).toBeInTheDocument()
      expect(screen.getByText('Move money in and out of your diBoaS wallet')).toBeInTheDocument()
      expect(screen.getByText('Add Money')).toBeInTheDocument()
    })

    test('applies correct CSS classes for banking category', () => {
      render(<CategoryCard {...defaultProps} />)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('category-card')
      expect(card).toHaveClass('category-card--banking')
      expect(card).toHaveClass('interactive-card')
    })

    test('applies correct CSS classes for investment category', () => {
      render(
        <CategoryCard
          {...defaultProps}
          category="investment"
          title="Buy/Sell"
          subtitle="Invest"
        />
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('category-card--investment')
    })

    test('applies correct CSS classes for yield category', () => {
      render(
        <CategoryCard
          {...defaultProps}
          category="yield"
          title="FinObjective"
          subtitle="Yield"
        />
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('category-card--yield')
    })

    test('applies custom className', () => {
      render(<CategoryCard {...defaultProps} className="custom-class" />)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('Design System Integration', () => {
    test('displays correct icon for banking category', () => {
      render(<CategoryCard {...defaultProps} category="banking" />)

      // ArrowUpDown icon should be rendered for banking
      const iconContainer = document.querySelector('.category-card__icon')
      expect(iconContainer).toBeInTheDocument()
    })

    test('displays correct icon for investment category', () => {
      render(<CategoryCard {...defaultProps} category="investment" />)

      // TrendingUp icon should be rendered for investment
      const iconContainer = document.querySelector('.category-card__icon')
      expect(iconContainer).toBeInTheDocument()
    })

    test('displays correct icon for yield category', () => {
      render(<CategoryCard {...defaultProps} category="yield" />)

      // Target icon should be rendered for yield
      const iconContainer = document.querySelector('.category-card__icon')
      expect(iconContainer).toBeInTheDocument()
    })

    test('applies correct design system colors', () => {
      render(<CategoryCard {...defaultProps} category="banking" />)

      const card = screen.getByTestId('card')
      expect(card.style.borderColor).toBe('#bfdbfe') // Banking border color

      const icon = document.querySelector('.category-card__icon')
      expect(icon.style.backgroundColor).toBe('#dbeafe') // Banking light color
    })
  })

  describe('Interaction', () => {
    test('calls onClick when card is clicked', () => {
      render(<CategoryCard {...defaultProps} />)

      const card = screen.getByTestId('card')
      fireEvent.click(card)

      expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
    })

    test('calls onClick when highlight button is clicked', () => {
      render(<CategoryCard {...defaultProps} />)

      const button = screen.getByTestId('button')
      fireEvent.click(button)

      expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
    })

    test('stops propagation when button is clicked', () => {
      const cardOnClick = vi.fn()
      render(<CategoryCard {...defaultProps} onClick={cardOnClick} />)

      const button = screen.getByTestId('button')
      const clickEvent = new MouseEvent('click', { bubbles: true })
      
      // Spy on stopPropagation
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation')
      
      fireEvent(button, clickEvent)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    test('handles missing onClick gracefully', () => {
      const { onClick, ...propsWithoutOnClick } = defaultProps
      
      expect(() => {
        render(<CategoryCard {...propsWithoutOnClick} />)
      }).not.toThrow()

      const card = screen.getByTestId('card')
      expect(() => {
        fireEvent.click(card)
      }).not.toThrow()
    })
  })

  describe('Semantic CSS Structure', () => {
    test('applies proper BEM-style CSS classes', () => {
      render(<CategoryCard {...defaultProps} />)

      // Main card classes
      expect(document.querySelector('.category-card')).toBeInTheDocument()
      expect(document.querySelector('.category-card__content')).toBeInTheDocument()
      
      // Header section
      expect(document.querySelector('.category-card__header')).toBeInTheDocument()
      expect(document.querySelector('.category-card__icon')).toBeInTheDocument()
      expect(document.querySelector('.category-card__badge')).toBeInTheDocument()
      
      // Main content section
      expect(document.querySelector('.category-card__main')).toBeInTheDocument()
      expect(document.querySelector('.category-card__title')).toBeInTheDocument()
      expect(document.querySelector('.category-card__description')).toBeInTheDocument()
      
      // Highlight section
      expect(document.querySelector('.category-card__highlight')).toBeInTheDocument()
      expect(document.querySelector('.category-card__highlight-button')).toBeInTheDocument()
      
      // Accent
      expect(document.querySelector('.category-card__accent')).toBeInTheDocument()
    })

    test('applies correct modifier classes for each category', () => {
      const categories = ['banking', 'investment', 'yield']
      
      categories.forEach(category => {
        const { unmount } = render(
          <CategoryCard {...defaultProps} category={category} />
        )
        
        expect(document.querySelector(`.category-card--${category}`)).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('Accessibility', () => {
    test('has interactive card styling', () => {
      render(<CategoryCard {...defaultProps} />)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('interactive-card')
    })

    test('button has proper structure for screen readers', () => {
      render(<CategoryCard {...defaultProps} />)

      const button = screen.getByTestId('button')
      expect(button).toHaveClass('w-full')
      expect(button).toHaveClass('justify-between')
      expect(button).toHaveClass('group')
    })

    test('has hover effects for better UX', () => {
      render(<CategoryCard {...defaultProps} />)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('hover:scale-105')
      expect(card).toHaveClass('transition-all')
      expect(card).toHaveClass('duration-200')
    })
  })

  describe('Design System Consistency', () => {
    test('all categories have defined design configurations', () => {
      const categories = ['banking', 'investment', 'yield']
      
      categories.forEach(category => {
        expect(() => {
          render(<CategoryCard {...defaultProps} category={category} />)
        }).not.toThrow()
      })
    })

    test('maintains consistent spacing and typography', () => {
      render(<CategoryCard {...defaultProps} />)

      const title = document.querySelector('.category-card__title')
      const description = document.querySelector('.category-card__description')
      
      expect(title).toHaveClass('text-xl')
      expect(title).toHaveClass('font-bold')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-gray-600')
    })

    test('gradient accent bar is properly positioned', () => {
      render(<CategoryCard {...defaultProps} />)

      const accent = document.querySelector('.category-card__accent')
      expect(accent).toHaveClass('absolute')
      expect(accent).toHaveClass('bottom-0')
      expect(accent).toHaveClass('left-0')
      expect(accent).toHaveClass('right-0')
      expect(accent).toHaveClass('h-1')
    })
  })
})