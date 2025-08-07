# Accessibility Guide

This guide documents the accessibility features and standards implemented in the OneFi Financial Platform to ensure WCAG 2.1 AA compliance and inclusive user experience.

## Table of Contents

- [Overview](#overview)
- [Accessibility Standards](#accessibility-standards)
- [Components](#components)
- [Testing](#testing)
- [Guidelines](#guidelines)
- [Tools and Utilities](#tools-and-utilities)

## Overview

The OneFi platform is built with accessibility as a core principle, ensuring that all users, including those with disabilities, can effectively use our financial services. We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.

### Key Accessibility Features

- **Keyboard Navigation** - Full keyboard support for all interactive elements
- **Screen Reader Support** - Comprehensive ARIA attributes and semantic HTML  
- **Focus Management** - Proper focus handling and visual focus indicators
- **Color Contrast** - WCAG AA compliant color ratios
- **Responsive Design** - Accessible across all device sizes
- **Motion Preferences** - Respects user's reduced motion preferences

## Accessibility Standards

### WCAG 2.1 AA Compliance

We adhere to the four principles of accessibility:

1. **Perceivable** - Information must be presentable in ways users can perceive
2. **Operable** - Interface components must be operable by all users
3. **Understandable** - Information and UI operation must be understandable
4. **Robust** - Content must be robust enough for various assistive technologies

### Success Criteria Met

- **1.4.3 Contrast (Minimum)** - 4.5:1 contrast ratio for normal text
- **1.4.6 Contrast (Enhanced)** - 7:1 contrast ratio for enhanced contrast mode
- **2.1.1 Keyboard** - All functionality available via keyboard
- **2.1.2 No Keyboard Trap** - Users can navigate away from any component
- **2.4.3 Focus Order** - Logical tab order throughout the application
- **2.4.7 Focus Visible** - Clear visual focus indicators
- **3.3.2 Labels or Instructions** - Form inputs have clear labels
- **4.1.2 Name, Role, Value** - Proper ARIA attributes for all components

## Components

### Accessible Button

Enhanced button component with full accessibility support:

```jsx
import AccessibleButton from '@/components/shared/AccessibleButton'

// Basic usage
<AccessibleButton 
  onClick={handleClick}
  ariaLabel="Save transaction"
>
  Save
</AccessibleButton>

// Loading state
<AccessibleButton 
  loading={isLoading}
  loadingText="Processing transaction..."
>
  Submit Payment
</AccessibleButton>

// Icon button
<IconButton
  icon={DeleteIcon}
  ariaLabel="Delete transaction"
  onClick={handleDelete}
/>
```

**Features:**
- Proper ARIA attributes (`aria-label`, `aria-describedby`, `aria-pressed`)
- Keyboard navigation (Enter/Space key support)
- Loading states with screen reader announcements
- Focus management with visible focus indicators
- Reduced motion support

### Accessible Modal

Modal component with focus trapping and proper ARIA roles:

```jsx
import AccessibleModal from '@/components/shared/AccessibleModal'

<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Transaction"
  description="Please review the transaction details"
  role="alertdialog"
>
  <TransactionDetails />
</AccessibleModal>
```

**Features:**
- Focus trapping within modal
- Automatic focus management (save/restore)
- Escape key to close
- Proper ARIA roles (`dialog`, `alertdialog`)
- Screen reader announcements

### Accessible Form Components

Form elements with comprehensive accessibility support:

```jsx
import { 
  FormField, 
  AccessibleInput, 
  AccessibleSelect,
  AccessibleCheckbox,
  AccessibleRadioGroup 
} from '@/components/shared/AccessibleForm'

// Form field with validation
<FormField
  label="Transaction Amount"
  description="Enter the amount in USD"
  error={errors.amount}
  required
>
  {(fieldProps) => (
    <AccessibleInput
      {...fieldProps}
      type="number"
      placeholder="0.00"
      value={amount}
      onChange={handleAmountChange}
    />
  )}
</FormField>

// Radio group
<AccessibleRadioGroup
  name="transactionType"
  label="Transaction Type"
  value={selectedType}
  onChange={setSelectedType}
  options={[
    { value: 'send', label: 'Send Money', description: 'Transfer to another user' },
    { value: 'buy', label: 'Buy Crypto', description: 'Purchase cryptocurrency' }
  ]}
/>
```

**Features:**
- Automatic label association
- Error message announcements
- Field validation with inline feedback
- Password visibility toggle
- Proper fieldset/legend for radio groups

### Accessible Data Table

Sortable and filterable table with keyboard navigation:

```jsx
import AccessibleDataTable from '@/components/shared/AccessibleDataTable'

<AccessibleDataTable
  data={transactions}
  columns={[
    { key: 'date', label: 'Date', sortable: true },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount', numeric: true }
  ]}
  caption="Transaction History"
  sortable={true}
  filterable={true}
  selectable={true}
  onSort={handleSort}
  onSelect={handleSelect}
/>
```

**Features:**
- Full keyboard navigation (arrow keys, home/end)
- Sortable columns with ARIA sort attributes
- Row selection with announcements
- Filter functionality
- Proper table semantics

### Skip Links

Navigation aids for screen readers and keyboard users:

```jsx
import SkipLinks, { MainContent, NavigationSection } from '@/components/shared/SkipLinks'

// Skip links at top of page
<SkipLinks />

// Main content area
<MainContent>
  <h1>Dashboard</h1>
  <TransactionList />
</MainContent>

// Navigation section
<NavigationSection>
  <MainNavigation />
</NavigationSection>
```

**Features:**
- Skip to main content
- Skip to navigation
- Skip to footer
- Smooth scrolling to targets
- Visible on focus

## Testing

### Automated Testing

We use multiple tools for automated accessibility testing:

```javascript
// Accessibility checker utility
import { runAccessibilityAudit } from '@/utils/accessibilityChecker'

// Run comprehensive audit
const results = runAccessibilityAudit()
console.log(results)

// Check color contrast
import { checkColorContrast } from '@/utils/accessibilityChecker'
const contrast = checkColorContrast('#ffffff', '#1e40af')
// { ratio: 8.59, AA: true, AAA: true, level: 'AAA' }
```

### Manual Testing

#### Keyboard Navigation Testing

1. **Tab Navigation**
   - Use Tab key to navigate through all interactive elements
   - Verify logical tab order
   - Ensure all focusable elements receive focus
   - Check that focus is visible

2. **Keyboard Shortcuts**
   - Arrow keys for table/menu navigation
   - Enter/Space for activation
   - Escape for dismissing modals/menus
   - Home/End for first/last items

#### Screen Reader Testing

Test with popular screen readers:
- **NVDA** (Windows)
- **JAWS** (Windows)  
- **VoiceOver** (macOS)
- **TalkBack** (Android)

#### Testing Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible
- [ ] Tab order is logical and intuitive
- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Loading states are communicated
- [ ] Modal focus is trapped
- [ ] Skip links are functional
- [ ] Color contrast meets WCAG AA standards
- [ ] Content is readable without color
- [ ] Text can be resized to 200% without scrolling
- [ ] Motion respects user preferences

### Accessibility Testing Tools

```javascript
// Jest + jest-axe for unit tests
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<TransactionForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})

// Playwright for E2E accessibility testing
import { injectAxe, checkA11y } from 'axe-playwright'

test('page should be accessible', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  await checkA11y(page)
})
```

## Guidelines

### Design Guidelines

#### Color and Contrast

```css
/* WCAG AA compliant color combinations */
:root {
  --primary-bg: #1e40af;     /* Blue */
  --primary-text: #ffffff;   /* White - 8.59:1 ratio */
  
  --secondary-bg: #f3f4f6;   /* Light gray */
  --secondary-text: #1f2937; /* Dark gray - 12.63:1 ratio */
  
  --error-bg: #fef2f2;       /* Light red */
  --error-text: #dc2626;     /* Red - 5.36:1 ratio */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --primary-bg: #000000;
    --primary-text: #ffffff;
    border-width: 2px;
  }
}
```

#### Typography

```css
/* Readable font sizes */
body {
  font-size: 16px;    /* Base size */
  line-height: 1.5;   /* Adequate line spacing */
}

h1 { font-size: 2rem; }    /* 32px */
h2 { font-size: 1.5rem; }  /* 24px */
h3 { font-size: 1.25rem; } /* 20px */

/* Scalable typography */
@media (max-width: 768px) {
  body { font-size: 18px; } /* Larger on mobile */
}
```

#### Motion and Animation

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Development Guidelines

#### Semantic HTML

```jsx
// Use proper semantic elements
<main>
  <section aria-labelledby="transactions-heading">
    <h2 id="transactions-heading">Recent Transactions</h2>
    <table>
      <caption>Your recent financial transactions</caption>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Description</th>
          <th scope="col">Amount</th>
        </tr>
      </thead>
      <tbody>
        {/* Table rows */}
      </tbody>
    </table>
  </section>
</main>
```

#### ARIA Best Practices

```jsx
// Proper ARIA usage
<button
  aria-label="Delete transaction"
  aria-describedby="delete-help"
  aria-expanded={isMenuOpen}
  aria-controls="action-menu"
>
  <TrashIcon aria-hidden="true" />
</button>

<div id="delete-help" className="sr-only">
  This action cannot be undone
</div>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

<div aria-live="assertive" aria-atomic="true">
  {errorMessage}
</div>
```

#### Focus Management

```jsx
// Custom focus hook
function useFocusManagement() {
  const saveFocus = () => {
    previousFocus.current = document.activeElement
  }
  
  const restoreFocus = () => {
    if (previousFocus.current) {
      previousFocus.current.focus()
    }
  }
  
  const trapFocus = (containerRef) => {
    // Focus trapping implementation
  }
  
  return { saveFocus, restoreFocus, trapFocus }
}
```

### Content Guidelines

#### Alternative Text

```jsx
// Descriptive alt text for images
<img 
  src="chart.png" 
  alt="Portfolio performance chart showing 12% growth over the last month"
/>

// Empty alt for decorative images
<img src="decoration.png" alt="" role="presentation" />

// Icon alternatives
<button>
  <SaveIcon aria-hidden="true" />
  <span className="sr-only">Save transaction</span>
</button>
```

#### Form Labels and Instructions

```jsx
// Clear, descriptive labels
<label htmlFor="amount">
  Transaction Amount (USD)
  <span className="required" aria-label="required">*</span>
</label>
<input 
  id="amount"
  type="number"
  aria-describedby="amount-help amount-error"
  aria-required="true"
  aria-invalid={hasError}
/>
<div id="amount-help">
  Enter the amount you want to send (minimum $5.00)
</div>
{hasError && (
  <div id="amount-error" role="alert">
    Amount must be at least $5.00
  </div>
)}
```

## Tools and Utilities

### Accessibility Hooks

```jsx
// Keyboard navigation
const { activeIndex, getItemProps } = useKeyboardNavigation(items, {
  orientation: 'vertical',
  loop: true,
  onSelect: handleSelect
})

// Screen reader announcements
const { announce } = useAnnouncer()
announce('Transaction completed successfully')

// Reduced motion detection
const prefersReducedMotion = useReducedMotion()

// High contrast detection  
const isHighContrast = useHighContrast()

// Focus management
const { trapFocus, saveFocus, restoreFocus } = useFocusManagement()
```

### Accessibility Checker

```javascript
// Automated accessibility auditing
import { 
  runAccessibilityAudit,
  generateAccessibilityReport,
  startAccessibilityMonitoring 
} from '@/utils/accessibilityChecker'

// Run audit
const results = runAccessibilityAudit()

// Generate report
const report = generateAccessibilityReport(results)

// Continuous monitoring
const stopMonitoring = startAccessibilityMonitoring((results) => {
  console.log('Accessibility issues found:', results.issues.length)
})
```

### Browser Extensions

Recommended accessibility testing extensions:

- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Performance and accessibility audits
- **Accessibility Insights** - Microsoft's accessibility testing tool

## Resources

### Standards and Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Testing Tools
- [axe Accessibility Testing](https://www.deque.com/axe/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)

### Screen Readers
- [NVDA Screen Reader](https://www.nvaccess.org/download/)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver Guide](https://www.apple.com/accessibility/mac/vision/)

---

Accessibility is not just compliance—it's about creating inclusive experiences for all users. 🌟