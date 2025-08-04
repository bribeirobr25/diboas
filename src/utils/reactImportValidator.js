/**
 * React Import Validation Utility
 * Validates and ensures proper React hook imports to prevent crashes
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Common React hooks that require imports
const REACT_HOOKS = [
  'useState',
  'useEffect',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef',
  'useImperativeHandle',
  'useLayoutEffect',
  'useDebugValue',
  'useDeferredValue',
  'useId',
  'useInsertionEffect',
  'useSyncExternalStore',
  'useTransition'
]

// React Router hooks
const REACT_ROUTER_HOOKS = [
  'useNavigate',
  'useLocation',
  'useParams',
  'useSearchParams',
  'useLoaderData',
  'useActionData',
  'useNavigation',
  'useSubmit',
  'useFetcher',
  'useMatches',
  'useRevalidator',
  'useRouteError',
  'useOutletContext'
]

/**
 * Analyzes a React component file for missing hook imports
 * @param {string} filePath - Path to the React component file
 * @returns {Object} Analysis result with missing imports and recommendations
 */
export function analyzeReactImports(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  // Find React imports
  const reactImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]react['"]/)
  const reactRouterImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]react-router-dom['"]/)
  
  const importedReactHooks = reactImportMatch 
    ? reactImportMatch[1].split(',').map(hook => hook.trim()).filter(Boolean)
    : []
    
  const importedRouterHooks = reactRouterImportMatch
    ? reactRouterImportMatch[1].split(',').map(hook => hook.trim()).filter(Boolean)
    : []

  // Find hook usage in the file
  const usedReactHooks = []
  const usedRouterHooks = []
  const missingReactHooks = []
  const missingRouterHooks = []

  // Check for React hooks usage
  REACT_HOOKS.forEach(hook => {
    const hookRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g')
    if (hookRegex.test(content)) {
      usedReactHooks.push(hook)
      if (!importedReactHooks.includes(hook)) {
        missingReactHooks.push(hook)
      }
    }
  })

  // Check for React Router hooks usage
  REACT_ROUTER_HOOKS.forEach(hook => {
    const hookRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g')
    if (hookRegex.test(content)) {
      usedRouterHooks.push(hook)
      if (!importedRouterHooks.includes(hook)) {
        missingRouterHooks.push(hook)
      }
    }
  })

  return {
    filePath,
    analysis: {
      reactImports: {
        imported: importedReactHooks,
        used: usedReactHooks,
        missing: missingReactHooks
      },
      routerImports: {
        imported: importedRouterHooks,
        used: usedRouterHooks,
        missing: missingRouterHooks
      },
      hasIssues: missingReactHooks.length > 0 || missingRouterHooks.length > 0,
      recommendations: generateRecommendations(missingReactHooks, missingRouterHooks, content)
    }
  }
}

/**
 * Generate recommendations for fixing missing imports
 */
function generateRecommendations(missingReactHooks, missingRouterHooks, content) {
  const recommendations = []

  if (missingReactHooks.length > 0) {
    const reactImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]react['"]/)
    if (reactImportMatch) {
      const currentImports = reactImportMatch[1].split(',').map(s => s.trim()).filter(Boolean)
      const allImports = [...currentImports, ...missingReactHooks].sort()
      recommendations.push({
        type: 'fix-react-imports',
        description: 'Add missing React hook imports',
        currentLine: reactImportMatch[0],
        suggestedLine: `import { ${allImports.join(', ')} } from 'react'`,
        missingHooks: missingReactHooks
      })
    } else {
      recommendations.push({
        type: 'add-react-imports',
        description: 'Add React import with missing hooks',
        suggestedLine: `import { ${missingReactHooks.join(', ')} } from 'react'`,
        missingHooks: missingReactHooks
      })
    }
  }

  if (missingRouterHooks.length > 0) {
    const routerImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]react-router-dom['"]/)
    if (routerImportMatch) {
      const currentImports = routerImportMatch[1].split(',').map(s => s.trim()).filter(Boolean)
      const allImports = [...currentImports, ...missingRouterHooks].sort()
      recommendations.push({
        type: 'fix-router-imports',
        description: 'Add missing React Router hook imports',
        currentLine: routerImportMatch[0],
        suggestedLine: `import { ${allImports.join(', ')} } from 'react-router-dom'`,
        missingHooks: missingRouterHooks
      })
    } else {
      recommendations.push({
        type: 'add-router-imports',
        description: 'Add React Router import with missing hooks',
        suggestedLine: `import { ${missingRouterHooks.join(', ')} } from 'react-router-dom'`,
        missingHooks: missingRouterHooks
      })
    }
  }

  return recommendations
}

/**
 * Scans multiple React component files for import issues
 * @param {string[]} filePaths - Array of file paths to analyze
 * @returns {Object[]} Array of analysis results
 */
export function batchAnalyzeReactImports(filePaths) {
  return filePaths.map(filePath => {
    try {
      return analyzeReactImports(filePath)
    } catch (error) {
      return {
        filePath,
        error: error.message,
        analysis: null
      }
    }
  })
}

/**
 * Development helper: Validates imports at runtime
 * Should only be used in development mode
 */
export function validateReactImportsAtRuntime() {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  // Create a proxy for React hooks to catch missing imports
  const originalError = console.error
  console.error = function(...args) {
    const errorMessage = args.join(' ')
    
    // Check for common React hook errors
    if (errorMessage.includes('is not defined') && 
        REACT_HOOKS.some(hook => errorMessage.includes(hook))) {
      console.warn('🚨 React Import Validator: Detected missing React hook import!')
      console.warn('💡 Check your React imports and ensure all used hooks are imported.')
      
      // Try to identify the missing hook
      const missingHook = REACT_HOOKS.find(hook => errorMessage.includes(`${hook} is not defined`))
      if (missingHook) {
        console.warn(`💡 Missing hook: ${missingHook}`)
        console.warn(`💡 Add this to your React import: import { ..., ${missingHook} } from 'react'`)
      }
    }
    
    // Call original error handler
    originalError.apply(console, args)
  }
}

export default {
  analyzeReactImports,
  batchAnalyzeReactImports,
  validateReactImportsAtRuntime,
  REACT_HOOKS,
  REACT_ROUTER_HOOKS
}