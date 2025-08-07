# diBoaS File Naming Conventions

> **Coding Standards: Standardized File and Directory Naming**  
> This document establishes consistent naming conventions across the diBoaS codebase.

## Overview

Consistent naming conventions improve code readability, maintainability, and developer experience. This document standardizes naming patterns across all file types and directories.

## File Extension Standards

### React Components
- **Extension**: Always `.jsx` for files containing React components
- **Reason**: Clear distinction between React and vanilla JavaScript

```javascript
// ✅ Correct
AppDashboard.jsx
TransactionPage.jsx
UserProfile.jsx

// ❌ Incorrect
AppDashboard.js  // Contains React component
```

### React Hooks
- **Extension**: `.js` for hooks that don't return JSX
- **Extension**: `.jsx` for hooks that return JSX components
- **Reason**: Hooks are functions, use .js unless they return JSX

```javascript
// ✅ Correct - Hooks returning data/state
useAuthentication.js
useMarketData.js
useAssetPrices.js

// ✅ Correct - Hooks returning JSX
useToastProvider.jsx
useModalRenderer.jsx
```

### Services and Utilities
- **Extension**: Always `.js`
- **Reason**: Pure JavaScript without React

```javascript
// ✅ Correct
DataManager.js
feeCalculations.js
secureStorage.js
```

### Test Files
- **Component tests**: `.test.jsx`
- **Service/utility tests**: `.test.js`
- **Integration tests**: `.integration.test.js`

```javascript
// ✅ Correct
AppDashboard.test.jsx        // Testing React component
DataManager.test.js          // Testing service
userWorkflow.integration.test.js  // Integration test
```

## File Naming Patterns

### Components
- **Pattern**: `PascalCase`
- **Reason**: Standard React convention

```javascript
// ✅ Correct
AppDashboard.jsx
TransactionPage.jsx
UserProfile.jsx
LoadingSpinner.jsx

// ❌ Incorrect
app-dashboard.jsx     // kebab-case
appDashboard.jsx      // camelCase
loading-spinner.jsx   // kebab-case
```

### Hooks
- **Pattern**: `camelCase` with "use" prefix
- **Reason**: Standard React hooks convention

```javascript
// ✅ Correct
useAuthentication.js
useMarketData.js
useAssetPrices.js
useMobileDetection.js

// ❌ Incorrect
use-mobile.js         // kebab-case
UseAuthentication.js  // PascalCase
marketDataHook.js     // Missing "use" prefix
```

### Services
- **Pattern**: `PascalCase` for class-based services, `camelCase` for utility modules
- **Reason**: Aligns with JavaScript conventions

```javascript
// ✅ Correct - Class-based services
DataManager.js
IntegrationManager.js
SecurityManager.js

// ✅ Correct - Utility modules  
feeCalculations.js
secureStorage.js
apiHelpers.js
```

### Utilities
- **Pattern**: `camelCase`
- **Reason**: Standard JavaScript convention for modules

```javascript
// ✅ Correct
feeCalculations.js
performanceOptimizations.js
localStorageHelper.js

// ❌ Incorrect
fee-calculations.js   // kebab-case
FeeCalculations.js    // PascalCase (unless class)
```

### Test Files
- **Pattern**: `ComponentName.test.jsx` or `ComponentName.descriptive.test.jsx`
- **Reason**: Clear test identification and grouping

```javascript
// ✅ Correct - Basic component test
AppDashboard.test.jsx
TransactionPage.test.jsx

// ✅ Correct - Descriptive test
TransactionPage.navigation.test.jsx
UserProfile.validation.test.jsx

// ❌ Incorrect
AppDashboard.spec.jsx          // Use .test not .spec
transaction-page-test.jsx      // kebab-case
```

## Directory Naming Patterns

### Standard Directories
- **Pattern**: `camelCase`
- **Reason**: Consistent with JavaScript naming

```
// ✅ Correct
src/
  components/
  hooks/
  services/
  utils/
  errorHandling/
  traditionalFinance/    // Not traditional-finance
  marketData/           // Not market-data

// ❌ Incorrect  
src/
  error-handling/       // kebab-case
  traditional-finance/  // kebab-case
  market-data/          // kebab-case
```

### Special Directories
- **Pattern**: Keep established conventions
- **Examples**: `__tests__`, `__mocks__`, `node_modules`

## Special Cases and Exceptions

### UI Component Library
- **Current state**: Uses kebab-case (external library pattern)
- **Decision**: Keep as-is to avoid breaking changes
- **Reason**: UI libraries often use kebab-case (Material-UI, Ant Design pattern)

```javascript
// ✅ Current (acceptable exception)
src/components/ui/
  alert-dialog.jsx
  dropdown-menu.jsx
  input-otp.jsx

// Note: These follow external UI library conventions
```

### Legacy Files
- **Pattern**: Maintain existing naming if widely imported
- **Strategy**: Gradual migration with alias imports

## Implementation Strategy

### Phase 1: New Files (Active)
- All new files follow standardized conventions
- Immediate enforcement via development guidelines

### Phase 2: Safe Migrations (Gradual)
- Rename files with minimal import impact
- Update imports systematically
- Test after each batch of changes

### Phase 3: Complex Migrations (Future)
- Handle files with extensive import usage
- Use build tools for automated renaming
- Coordinate with team for breaking changes

## Current Non-Standard Files

### Priority 1: Easy Fixes
```bash
# Hook naming inconsistency
src/hooks/use-mobile.js → src/hooks/useMobile.js

# Directory naming  
src/domains/traditional-finance/ → src/domains/traditionalFinance/
```

### Priority 2: Review Required
```bash
# UI components (evaluate impact)
src/components/ui/alert-dialog.jsx → AlertDialog.jsx (if migrating)

# Test file patterns (standardize gradually)
Various test files with inconsistent naming patterns
```

## Tooling and Automation

### ESLint Rules
```javascript
// Recommended ESLint configuration
{
  "rules": {
    "react/jsx-filename-extension": [1, { "extensions": [".jsx"] }]
  }
}
```

### File Templates
Create templates for consistent file creation:
- Component template with proper naming
- Hook template with proper naming  
- Service template with proper naming
- Test template with proper naming

## Migration Checklist

- [ ] Document current naming conventions ✅
- [ ] Identify priority files for renaming
- [ ] Create automated migration scripts (if needed)
- [ ] Update imports systematically
- [ ] Test after migrations
- [ ] Update build configuration if needed

## Examples

### Complete File Naming Examples

```
src/
├── components/
│   ├── AppDashboard.jsx                    ✅ PascalCase component
│   ├── TransactionPage.jsx                 ✅ PascalCase component
│   ├── ui/
│   │   ├── alert-dialog.jsx                ✅ Exception (UI library pattern)
│   │   └── button.jsx                      ✅ Exception (UI library pattern)
│   └── shared/
│       └── LoadingSpinner.jsx              ✅ PascalCase component
├── hooks/
│   ├── useAuthentication.js                ✅ camelCase hook (.js)
│   ├── useToastProvider.jsx               ✅ camelCase hook (.jsx - returns JSX)
│   └── useMobile.js                       ✅ Fixed from use-mobile.js
├── services/
│   ├── DataManager.js                     ✅ PascalCase service class
│   └── apiClient.js                       ✅ camelCase utility
├── utils/
│   ├── feeCalculations.js                 ✅ camelCase utility
│   └── secureStorage.js                   ✅ camelCase utility
└── __tests__/
    ├── AppDashboard.test.jsx              ✅ Component test
    ├── DataManager.test.js                ✅ Service test
    └── userWorkflow.integration.test.js   ✅ Integration test
```

## Benefits

### Developer Experience
- **Predictable file names** make navigation easier
- **Clear file types** from extensions
- **Consistent patterns** reduce cognitive load

### Tool Integration
- **Better IDE support** with proper extensions
- **Improved build tools** integration
- **Enhanced linting** capabilities

### Maintainability
- **Easier refactoring** with consistent patterns
- **Clearer code organization** 
- **Reduced confusion** between file types

---

## Enforcement

### Code Reviews
- Check naming conventions in all PRs
- Require updates for non-standard names
- Document exceptions with reasons

### Automated Tools
- ESLint rules for file naming
- Pre-commit hooks for validation
- Build warnings for violations

---

*These conventions ensure consistent, maintainable, and scalable file organization across the diBoaS codebase.*