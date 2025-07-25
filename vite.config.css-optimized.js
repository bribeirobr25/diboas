import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CSS optimization configuration
export default defineConfig({
  plugins: [react()],
  css: {
    // CSS optimization settings
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        // Enable CSS custom properties optimization
        charset: false
      }
    }
  },
  build: {
    cssCodeSplit: true, // Enable CSS code splitting
    cssMinify: 'esbuild', // Use esbuild for CSS minification
    rollupOptions: {
      output: {
        // Separate CSS for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (ext === 'css') {
            return 'assets/styles/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    }
  }
})