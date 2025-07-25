import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Image optimization configuration for Vite
export default defineConfig({
  plugins: [
    react(),
    // Add image optimization plugin when available
    // Example: viteImageOptimize({
    //   gifsicle: { optimizationLevel: 7 },
    //   mozjpeg: { quality: 80 },
    //   pngquant: { quality: [0.65, 0.8] },
    //   svgo: { plugins: [{ name: 'removeViewBox', active: false }] },
    //   webp: { quality: 75 }
    // })
  ],
  build: {
    // Image asset handling
    assetsInlineLimit: 0, // Don't inline any assets
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
            return `assets/images/[name]-[hash].[ext]`
          }
          return `assets/[name]-[hash].[ext]`
        }
      }
    }
  }
})