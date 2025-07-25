export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          mergeLonghand: true,
          mergeRules: true,
          reduceIdents: true,
          zindex: true,
          discardUnused: true,
          minifySelectors: true,
          minifyParams: true,
          colormin: true,
          convertValues: true,
          discardDuplicates: true,
          discardEmpty: true,
          mergeIdents: true,
          reduceTransforms: true,
          svgo: true,
          normalizeCharset: true,
          normalizeDisplayValues: true,
          normalizePositions: true,
          normalizeRepeatStyle: true,
          normalizeString: true,
          normalizeTimingFunctions: true,
          normalizeUnicode: true,
          normalizeUrl: true,
          orderedValues: true,
          reduceInitial: true,
        }]
      }
    } : {})
  },
}