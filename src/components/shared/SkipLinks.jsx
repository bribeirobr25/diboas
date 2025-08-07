/**
 * Skip Links Component
 * Navigation aids for keyboard and screen reader users
 */

import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useSkipLinks } from '@/hooks/useAccessibility.jsx'

export default function SkipLinks({ links = [], className }) {
  const [isVisible, setIsVisible] = useState(false)
  const skipLinksRef = useRef(null)

  // Default skip links if none provided
  const defaultLinks = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'navigation', label: 'Skip to navigation' },
    { id: 'footer', label: 'Skip to footer' }
  ]

  const skipLinks = links.length > 0 ? links : defaultLinks

  const handleFocus = () => setIsVisible(true)
  const handleBlur = () => setIsVisible(false)

  const handleSkip = (targetId) => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus({ preventScroll: false })
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleKeyDown = (e, targetId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSkip(targetId)
    }
  }

  return (
    <div
      ref={skipLinksRef}
      className={cn(
        'fixed top-0 left-0 z-[9999] flex flex-col',
        'transform -translate-y-full transition-transform duration-200',
        isVisible && 'translate-y-0',
        className
      )}
      role="navigation"
      aria-label="Skip links"
    >
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={(e) => {
            e.preventDefault()
            handleSkip(link.id)
          }}
          onKeyDown={(e) => handleKeyDown(e, link.id)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'bg-purple-700 text-white px-4 py-2 text-sm font-medium',
            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-700',
            'hover:bg-purple-800 transition-colors',
            'first:rounded-t-md last:rounded-b-md'
          )}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

// Skip link target wrapper component
export function SkipTarget({ 
  id, 
  children, 
  className,
  as: Component = 'div',
  ...props 
}) {
  const targetRef = useRef(null)

  useEffect(() => {
    // Make the target focusable
    if (targetRef.current) {
      targetRef.current.setAttribute('tabindex', '-1')
    }
  }, [])

  return (
    <Component
      ref={targetRef}
      id={id}
      className={cn('focus:outline-none', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

// Main content wrapper with skip target
export function MainContent({ children, className, ...props }) {
  return (
    <SkipTarget
      id="main-content"
      as="main"
      className={cn('flex-1', className)}
      role="main"
      {...props}
    >
      {children}
    </SkipTarget>
  )
}

// Navigation wrapper with skip target
export function NavigationSection({ children, className, ...props }) {
  return (
    <SkipTarget
      id="navigation"
      as="nav"
      className={className}
      role="navigation"
      aria-label="Main navigation"
      {...props}
    >
      {children}
    </SkipTarget>
  )
}

// Footer wrapper with skip target
export function FooterSection({ children, className, ...props }) {
  return (
    <SkipTarget
      id="footer"
      as="footer"
      className={className}
      role="contentinfo"
      {...props}
    >
      {children}
    </SkipTarget>
  )
}

// Landmark regions for better navigation
export function LandmarkRegion({ 
  region, 
  label, 
  children, 
  className,
  ...props 
}) {
  const regionProps = {
    role: region,
    'aria-label': label,
    className,
    ...props
  }

  switch (region) {
    case 'banner':
      return <header {...regionProps}>{children}</header>
    case 'main':
      return <main {...regionProps}>{children}</main>
    case 'contentinfo':
      return <footer {...regionProps}>{children}</footer>
    case 'navigation':
      return <nav {...regionProps}>{children}</nav>
    case 'complementary':
      return <aside {...regionProps}>{children}</aside>
    case 'search':
      return <div {...regionProps}>{children}</div>
    default:
      return <section {...regionProps}>{children}</section>
  }
}

// Breadcrumb navigation with proper ARIA
export function BreadcrumbNavigation({ items = [], className, ...props }) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex', className)}
      {...props}
    >
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          
          return (
            <li key={item.href || item.label} className="flex items-center">
              {!isLast ? (
                <>
                  <a
                    href={item.href}
                    className="text-purple-600 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                  >
                    {item.label}
                  </a>
                  <span className="mx-2 text-gray-400" aria-hidden="true">
                    /
                  </span>
                </>
              ) : (
                <span
                  className="text-gray-700 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}