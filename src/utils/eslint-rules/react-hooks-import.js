/**
 * ESLint Rule: react-hooks-import
 * Detects missing React hook imports to prevent runtime crashes
 */

const REACT_HOOKS = [
  'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback',
  'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect',
  'useDebugValue', 'useDeferredValue', 'useId', 'useInsertionEffect',
  'useSyncExternalStore', 'useTransition'
]

const REACT_ROUTER_HOOKS = [
  'useNavigate', 'useLocation', 'useParams', 'useSearchParams',
  'useLoaderData', 'useActionData', 'useNavigation', 'useSubmit',
  'useFetcher', 'useMatches', 'useRevalidator', 'useRouteError',
  'useOutletContext'
]

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure React hooks are properly imported before use',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingReactHook: 'React hook "{{hook}}" is used but not imported from "react"',
      missingRouterHook: 'React Router hook "{{hook}}" is used but not imported from "react-router-dom"',
      addReactImport: 'Add {{hook}} to React imports',
      addRouterImport: 'Add {{hook}} to React Router imports',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode()
    let reactImports = new Set()
    let routerImports = new Set()
    const usedHooks = {
      react: new Set(),
      router: new Set()
    }

    return {
      // Collect import declarations
      ImportDeclaration(node) {
        if (node.source.value === 'react') {
          node.specifiers.forEach(spec => {
            if (spec.type === 'ImportSpecifier') {
              reactImports.add(spec.imported.name)
            }
          })
        } else if (node.source.value === 'react-router-dom') {
          node.specifiers.forEach(spec => {
            if (spec.type === 'ImportSpecifier') {
              routerImports.add(spec.imported.name)
            }
          })
        }
      },

      // Check for hook usage
      CallExpression(node) {
        if (node.callee.type === 'Identifier') {
          const hookName = node.callee.name

          // Check React hooks
          if (REACT_HOOKS.includes(hookName)) {
            usedHooks.react.add(hookName)
            if (!reactImports.has(hookName)) {
              context.report({
                node: node.callee,
                messageId: 'missingReactHook',
                data: { hook: hookName },
                fix(fixer) {
                  return fixReactImport(fixer, sourceCode, hookName, reactImports)
                }
              })
            }
          }

          // Check React Router hooks
          if (REACT_ROUTER_HOOKS.includes(hookName)) {
            usedHooks.router.add(hookName)
            if (!routerImports.has(hookName)) {
              context.report({
                node: node.callee,
                messageId: 'missingRouterHook',
                data: { hook: hookName },
                fix(fixer) {
                  return fixRouterImport(fixer, sourceCode, hookName, routerImports)
                }
              })
            }
          }
        }
      },
    }

    function fixReactImport(fixer, sourceCode, hookName, currentImports) {
      const importDeclarations = sourceCode.ast.body.filter(
        node => node.type === 'ImportDeclaration'
      )

      const reactImportNode = importDeclarations.find(
        node => node.source.value === 'react'
      )

      if (reactImportNode) {
        // Add to existing React import
        const specifiers = reactImportNode.specifiers
        const lastSpecifier = specifiers[specifiers.length - 1]
        
        if (lastSpecifier && lastSpecifier.type === 'ImportSpecifier') {
          return fixer.insertTextAfter(lastSpecifier, `, ${hookName}`)
        }
      } else {
        // Create new React import
        const firstImport = importDeclarations[0]
        const newImport = `import { ${hookName} } from 'react'\n`
        
        if (firstImport) {
          return fixer.insertTextBefore(firstImport, newImport)
        } else {
          // Insert at the beginning of the file
          return fixer.insertTextBefore(sourceCode.ast.body[0], newImport)
        }
      }
    }

    function fixRouterImport(fixer, sourceCode, hookName, currentImports) {
      const importDeclarations = sourceCode.ast.body.filter(
        node => node.type === 'ImportDeclaration'
      )

      const routerImportNode = importDeclarations.find(
        node => node.source.value === 'react-router-dom'
      )

      if (routerImportNode) {
        // Add to existing React Router import
        const specifiers = routerImportNode.specifiers
        const lastSpecifier = specifiers[specifiers.length - 1]
        
        if (lastSpecifier && lastSpecifier.type === 'ImportSpecifier') {
          return fixer.insertTextAfter(lastSpecifier, `, ${hookName}`)
        }
      } else {
        // Create new React Router import
        const reactImport = importDeclarations.find(
          node => node.source.value === 'react'
        )
        const newImport = `import { ${hookName} } from 'react-router-dom'\n`
        
        if (reactImport) {
          return fixer.insertTextAfter(reactImport, newImport)
        } else {
          const firstImport = importDeclarations[0]
          if (firstImport) {
            return fixer.insertTextBefore(firstImport, newImport)
          } else {
            return fixer.insertTextBefore(sourceCode.ast.body[0], newImport)
          }
        }
      }
    }
  },
}