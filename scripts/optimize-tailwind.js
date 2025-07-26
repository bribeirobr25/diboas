#!/usr/bin/env node

/**
 * Tailwind CSS optimization script
 * Creates a minimal production build by limiting generated utilities
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Highly restrictive Tailwind config that only includes what we actively use
const OPTIMIZED_TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Override defaults to only include what we need
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#ffffff',
      // Only include gray scale we use
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      // Only include specific color variants we actually use
      red: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
      },
      orange: {
        50: '#fff7ed',
        500: '#f97316',
        700: '#ea580c',
      },
      yellow: {
        50: '#fefce8',
        600: '#ca8a04',
      },
      green: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
      },
      blue: {
        50: '#eff6ff',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
      },
      indigo: {
        50: '#eef2ff',
        600: '#7c3aed',
      },
      purple: {
        50: '#faf5ff',
        500: '#a855f7',
        700: '#7c2d12',
      },
      cyan: {
        50: '#ecfeff',
        700: '#0e7490',
      },
      emerald: {
        50: '#ecfdf5',
        600: '#059669',
      },
    },
    // Limit spacing to exactly what we use
    spacing: {
      0: '0px',
      1: '0.25rem',  // 4px
      2: '0.5rem',   // 8px
      3: '0.75rem',  // 12px
      4: '1rem',     // 16px
      6: '1.5rem',   // 24px
      8: '2rem',     // 32px
      auto: 'auto',
      full: '100%',
    },
    fontSize: {
      xs: ['0.75rem', '1rem'],
      sm: ['0.875rem', '1.25rem'],
      base: ['1rem', '1.5rem'],
      lg: ['1.125rem', '1.75rem'],
      xl: ['1.25rem', '1.75rem'],
      '2xl': ['1.5rem', '2rem'],
      '3xl': ['1.875rem', '2.25rem'],
      '4xl': ['2.25rem', '2.5rem'],
    },
    fontWeight: {
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    borderRadius: {
      none: '0px',
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },
    opacity: {
      0: '0',
      50: '0.5',
      100: '1',
    },
    zIndex: {
      10: '10',
      20: '20',
      40: '40',
      50: '50',
    },
    // Disable features we don't use
    animation: {
      spin: 'spin 1s linear infinite',
      pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    keyframes: {
      spin: {
        to: { transform: 'rotate(360deg)' },
      },
      pulse: {
        '50%': { opacity: '0.5' },
      },
    },
  },
  // Drastically reduce what gets generated
  corePlugins: {
    // Disable plugins we don't use
    preflight: true,
    container: false,
    accessibility: false,
    pointerEvents: true,
    visibility: true,
    position: true,
    inset: true,
    isolation: false,
    zIndex: true,
    order: false,
    gridColumn: false,
    gridColumnEnd: false,
    gridColumnStart: false,
    gridRow: false,
    gridRowEnd: false,
    gridRowStart: false,
    float: false,
    clear: false,
    margin: true,
    boxSizing: false,
    lineClamp: true,
    display: true,
    aspectRatio: false,
    size: false,
    height: true,
    maxHeight: true,
    minHeight: true,
    width: true,
    minWidth: true,
    maxWidth: true,
    flex: true,
    flexShrink: true,
    flexGrow: true,
    flexBasis: false,
    tableLayout: false,
    captionSide: false,
    borderCollapse: false,
    borderSpacing: false,
    transformOrigin: false,
    translate: true,
    rotate: true,
    skew: false,
    scale: true,
    transform: true,
    animation: true,
    cursor: true,
    touchAction: false,
    userSelect: true,
    resize: false,
    scrollSnapType: false,
    scrollSnapAlign: false,
    scrollSnapStop: false,
    scrollMargin: false,
    scrollPadding: false,
    listStylePosition: false,
    listStyleType: true,
    listStyleImage: false,
    appearance: false,
    columns: false,
    breakBefore: false,
    breakInside: false,
    breakAfter: false,
    gridAutoColumns: false,
    gridAutoFlow: false,
    gridAutoRows: false,
    gridTemplateColumns: true,
    gridTemplateRows: false,
    flexDirection: true,
    flexWrap: true,
    placeContent: false,
    placeItems: false,
    alignContent: false,
    alignItems: true,
    justifyContent: true,
    justifyItems: false,
    gap: true,
    space: true,
    divideWidth: false,
    divideStyle: false,
    divideColor: false,
    divideOpacity: false,
    placeSelf: false,
    alignSelf: true,
    justifySelf: false,
    overflow: true,
    overscrollBehavior: false,
    scrollBehavior: false,
    textOverflow: true,
    whitespace: true,
    wordBreak: true,
    borderRadius: true,
    borderWidth: true,
    borderStyle: true,
    borderColor: true,
    borderOpacity: false,
    backgroundColor: true,
    backgroundOpacity: false,
    backgroundImage: false,
    gradientColorStops: false,
    backgroundSize: false,
    backgroundAttachment: false,
    backgroundClip: false,
    backgroundPosition: false,
    backgroundRepeat: false,
    backgroundOrigin: false,
    fill: true,
    stroke: false,
    strokeWidth: false,
    objectFit: true,
    objectPosition: false,
    padding: true,
    textAlign: true,
    textColor: true,
    textOpacity: false,
    textDecoration: true,
    textDecorationColor: false,
    textDecorationStyle: false,
    textDecorationThickness: false,
    textUnderlineOffset: false,
    textTransform: true,
    textOverflow: true,
    textIndent: false,
    verticalAlign: true,
    whitespace: true,
    wordBreak: true,
    content: false,
    fontFamily: false,
    fontSize: true,
    fontWeight: true,
    fontVariantNumeric: true,
    letterSpacing: false,
    lineHeight: true,
    listStyleType: true,
    placeholderColor: false,
    placeholderOpacity: false,
    caretColor: false,
    accentColor: false,
    opacity: true,
    backgroundBlendMode: false,
    mixBlendMode: false,
    boxShadow: true,
    boxShadowColor: false,
    outlineWidth: true,
    outlineStyle: true,
    outlineColor: false,
    outlineOffset: false,
    ringWidth: true,
    ringColor: false,
    ringOpacity: false,
    ringOffsetWidth: true,
    ringOffsetColor: false,
    blur: false,
    brightness: false,
    contrast: false,
    dropShadow: false,
    grayscale: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    sepia: false,
    filter: true,
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    backdropFilter: false,
    transitionProperty: true,
    transitionDelay: false,
    transitionDuration: true,
    transitionTimingFunction: true,
    willChange: false,
  },
  plugins: [],
  // Very targeted safelist - only preserve what might be dynamic
  safelist: [
    // Only preserve classes used in design system
    {
      pattern: /^(page|transaction|account|payment|performance|error|dashboard|semantic|balance|portfolio|form|button|nav|modal|status|alert|loading|empty)-/
    },
    // Only preserve colors that are dynamically generated
    'text-green-600',
    'text-red-600', 
    'text-blue-600',
    'text-orange-600',
    'bg-green-50',
    'bg-red-50',
    'bg-blue-50',
    'bg-orange-50',
    'border-green-200',
    'border-red-200',
    'border-blue-200',
    'border-orange-200',
    'animate-spin',
    'sr-only',
  ]
}`

async function optimizeBuild() {
  try {
    console.log('🎯 Starting aggressive CSS optimization...')
    
    // Backup current config
    const configPath = path.join(rootDir, 'tailwind.config.js')
    const backupPath = path.join(rootDir, 'tailwind.config.backup.js')
    
    const originalConfig = await fs.readFile(configPath, 'utf-8')
    await fs.writeFile(backupPath, originalConfig)
    console.log('💾 Backed up tailwind.config.js')
    
    // Use optimized config
    await fs.writeFile(configPath, OPTIMIZED_TAILWIND_CONFIG)
    console.log('🔧 Applied optimized Tailwind configuration')
    
    // Build
    console.log('🏗️  Building with optimized configuration...')
    execSync('NODE_ENV=production pnpm run build', { 
      stdio: 'inherit',
      cwd: rootDir 
    })
    
    // Check file size
    const distFiles = await fs.readdir(path.join(rootDir, 'dist/assets'))
    const cssFile = distFiles.find(file => file.endsWith('.css'))
    
    if (cssFile) {
      const cssPath = path.join(rootDir, 'dist/assets', cssFile)
      const stats = await fs.stat(cssPath)
      const sizeKB = (stats.size / 1024).toFixed(1)
      
      console.log(`📦 CSS bundle size: ${sizeKB} KB`)
      
      if (stats.size < 100 * 1024) {
        console.log('✅ Target achieved: CSS bundle is under 100KB!')
      } else {
        console.log(`🎯 Target: Get below 100KB (currently ${sizeKB}KB)`)
      }
    }
    
    // Restore config
    await fs.writeFile(configPath, originalConfig)
    await fs.unlink(backupPath)
    console.log('🔄 Restored original tailwind.config.js')
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message)
    
    // Try to restore config
    try {
      const configPath = path.join(rootDir, 'tailwind.config.js')
      const backupPath = path.join(rootDir, 'tailwind.config.backup.js')
      const originalConfig = await fs.readFile(backupPath, 'utf-8')
      await fs.writeFile(configPath, originalConfig)
      await fs.unlink(backupPath)
      console.log('🔄 Restored config after error')
    } catch (restoreError) {
      console.error('💥 Failed to restore config:', restoreError.message)
    }
    
    throw error
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeBuild()
    .then(() => console.log('\n🎉 CSS optimization complete!'))
    .catch(error => {
      console.error('💥 Optimization failed:', error)
      process.exit(1)
    })
}