// Mock advanced rate limiter for testing
export const checkGeneralRateLimit = (key, options) => ({
  allowed: true,
  remaining: 100,
  resetTime: Date.now() + 60000
})

export default { checkGeneralRateLimit }