module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/*.html',
    './index.html'
  ],
  css: ['./src/**/*.css'],
  whitelist: [
    // Keep these classes even if not detected
    'error-boundary-container',
    'performance-dashboard-card',
    'transaction-status-compact'
  ],
  whitelistPatterns: [
    // Keep classes matching these patterns
    /^semantic-/,
    /^transaction-/,
    /^account-/,
    /^payment-/,
    /^performance-/
  ],
  extractors: [
    {
      extractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
      extensions: ['js', 'jsx', 'ts', 'tsx']
    }
  ]
}