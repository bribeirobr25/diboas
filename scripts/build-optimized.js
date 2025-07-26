#!/usr/bin/env node

/**
 * Optimized build script for CSS bundle reduction
 * Uses targeted Tailwind CSS configuration for production
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Create a minimal Tailwind config for production builds
const MINIMAL_TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Only include what we actually use
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
      diboas: {
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
      }
    },
    spacing: {
      0: '0px',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      32: '8rem',
      40: '10rem',
      48: '12rem',
      56: '14rem',
      64: '16rem',
      96: '24rem',
      auto: 'auto',
      full: '100%',
      screen: '100vh',
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
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
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
    }
  },
  plugins: [],
  safelist: [
    // Only safelist truly dynamic classes
    {
      pattern: /^(page|transaction|account|payment|performance|error|dashboard|semantic|balance|portfolio|form|button|nav|modal|status|alert|loading|empty)-/
    },
    'animate-spin',
    'animate-pulse',
    'sr-only',
  ]
}`

async function createMinimalTailwindConfig() {
  console.log('📝 Creating minimal Tailwind config for production...')
  
  const configPath = path.join(rootDir, 'tailwind.config.production.js')
  await fs.writeFile(configPath, MINIMAL_TAILWIND_CONFIG)
  
  console.log(`✅ Created ${configPath}`)
  return configPath
}

async function buildWithOptimizedConfig() {
  try {
    // Backup original config
    const originalConfig = path.join(rootDir, 'tailwind.config.js')
    const backupConfig = path.join(rootDir, 'tailwind.config.backup.js')
    
    await fs.copyFile(originalConfig, backupConfig)
    console.log('💾 Backed up original tailwind.config.js')
    
    // Create and use minimal config
    const minimalConfigPath = await createMinimalTailwindConfig()
    await fs.copyFile(minimalConfigPath, originalConfig)
    console.log('🔄 Using minimal Tailwind config for build')
    
    // Build with optimized config
    console.log('🏗️  Building with optimized configuration...')
    execSync('NODE_ENV=production pnpm run build', { 
      stdio: 'inherit',
      cwd: rootDir 
    })
    
    // Restore original config
    await fs.copyFile(backupConfig, originalConfig)
    await fs.unlink(backupConfig)
    await fs.unlink(minimalConfigPath)
    console.log('🔄 Restored original tailwind.config.js')
    
    console.log('✨ Optimized build complete!')
    
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    
    // Try to restore original config on error
    try {
      const originalConfig = path.join(rootDir, 'tailwind.config.js')
      const backupConfig = path.join(rootDir, 'tailwind.config.backup.js')
      
      await fs.copyFile(backupConfig, originalConfig)
      await fs.unlink(backupConfig)
      console.log('🔄 Restored original config after error')
    } catch (restoreError) {
      console.error('💥 Failed to restore config:', restoreError.message)
    }
    
    throw error
  }
}

// Run optimized build
if (import.meta.url === `file://${process.argv[1]}`) {
  buildWithOptimizedConfig()
    .then(() => console.log('\n🎉 Optimized production build complete!'))
    .catch(error => {
      console.error('💥 Build failed:', error)
      process.exit(1)
    })
}