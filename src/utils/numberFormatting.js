/**
 * Safe Number Formatting Utilities
 * Prevents .toFixed() crashes and type conversion errors
 */

/**
 * Safely format a number to fixed decimal places
 * Handles all edge cases: null, undefined, strings, objects, etc.
 * @param {any} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 4)
 * @param {number} fallback - Fallback value if conversion fails (default: 0)
 * @returns {string} Safely formatted number string
 */
export const safeToFixed = (value, decimals = 4, fallback = 0) => {
  try {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      return fallback.toFixed(decimals)
    }

    // Convert to number
    const numValue = typeof value === 'number' ? value : parseFloat(value)

    // Check if conversion resulted in valid number
    if (isNaN(numValue) || !isFinite(numValue)) {
      return fallback.toFixed(decimals)
    }

    return numValue.toFixed(decimals)
  } catch (error) {
    // Final fallback for any unexpected errors
    return fallback.toFixed(decimals)
  }
}

/**
 * Safely convert any value to a number
 * @param {any} value - Value to convert
 * @param {number} fallback - Fallback value if conversion fails (default: 0)
 * @returns {number} Safely converted number
 */
export const safeToNumber = (value, fallback = 0) => {
  try {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      return fallback
    }

    // Already a number
    if (typeof value === 'number') {
      return isNaN(value) || !isFinite(value) ? fallback : value
    }

    // Convert string/other types to number
    const numValue = parseFloat(value)
    return isNaN(numValue) || !isFinite(numValue) ? fallback : numValue
  } catch (error) {
    return fallback
  }
}

/**
 * Format currency with safe number handling
 * @param {any} value - Value to format as currency
 * @param {string} currency - Currency symbol (default: '$')
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const safeCurrencyFormat = (value, currency = '$', decimals = 2) => {
  const safeValue = safeToFixed(value, decimals, 0)
  return `${currency}${safeValue}`
}

/**
 * Format percentage with safe number handling
 * @param {any} value - Value to format as percentage (should be decimal, e.g., 0.05 for 5%)
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export const safePercentageFormat = (value, decimals = 2) => {
  const numValue = safeToNumber(value, 0)
  const percentage = numValue * 100
  return `${safeToFixed(percentage, decimals, 0)}%`
}

/**
 * Validate if a fee breakdown object has proper numeric values
 * @param {Object} feeBreakdown - Fee breakdown object to validate
 * @returns {Object} Sanitized fee breakdown with safe numeric values
 */
export const sanitizeFeeBreakdown = (feeBreakdown) => {
  if (!feeBreakdown || typeof feeBreakdown !== 'object') {
    return {
      breakdown: {
        diboas: 0,
        network: 0,
        dex: 0,
        provider: 0,
        defi: 0
      },
      total: 0
    }
  }

  const sanitized = {
    breakdown: {},
    total: safeToNumber(feeBreakdown.total, 0)
  }

  // Sanitize breakdown object - handle both old and new structure
  if (feeBreakdown.breakdown && typeof feeBreakdown.breakdown === 'object') {
    sanitized.breakdown = {
      diboas: safeToNumber(feeBreakdown.breakdown.diboas || feeBreakdown.breakdown.diBoaS?.amount || feeBreakdown.diBoaS, 0),
      network: safeToNumber(feeBreakdown.breakdown.network?.amount || feeBreakdown.breakdown.network || feeBreakdown.network, 0),
      dex: safeToNumber(feeBreakdown.breakdown.dex?.amount || feeBreakdown.breakdown.dex || feeBreakdown.dex, 0),
      provider: safeToNumber(feeBreakdown.breakdown.provider?.amount || feeBreakdown.breakdown.provider || feeBreakdown.provider, 0),
      defi: safeToNumber(feeBreakdown.breakdown.defi?.amount || feeBreakdown.breakdown.defi || feeBreakdown.defi, 0)
    }
  } else {
    // Fallback to direct properties from fee calculator
    sanitized.breakdown = {
      diboas: safeToNumber(feeBreakdown.diBoaS || feeBreakdown.diboas, 0),
      network: safeToNumber(feeBreakdown.network, 0),
      dex: safeToNumber(feeBreakdown.dex, 0),
      provider: safeToNumber(feeBreakdown.provider, 0),
      defi: safeToNumber(feeBreakdown.defi, 0)
    }
  }

  return sanitized
}

/**
 * Safe number comparison for financial calculations
 * @param {any} a - First value
 * @param {any} b - Second value
 * @param {string} operator - Comparison operator ('>', '<', '>=', '<=', '==', '!=')
 * @returns {boolean} Comparison result
 */
export const safeNumberCompare = (a, b, operator = '>=') => {
  const numA = safeToNumber(a, 0)
  const numB = safeToNumber(b, 0)

  switch (operator) {
    case '>': return numA > numB
    case '<': return numA < numB
    case '>=': return numA >= numB
    case '<=': return numA <= numB
    case '==': return Math.abs(numA - numB) < 0.0001 // Floating point safe equality
    case '!=': return Math.abs(numA - numB) >= 0.0001
    default: return numA >= numB
  }
}

/**
 * Create a default fee structure for fallback scenarios
 * @param {number} amount - Transaction amount
 * @returns {Object} Default fee structure
 */
export const createDefaultFeeStructure = (amount = 0) => {
  const safeAmount = safeToNumber(amount, 0)
  
  return {
    breakdown: {
      diboas: safeAmount * 0.0009, // 0.09%
      network: 0.05, // Fixed network fee
      dex: safeAmount * 0.005, // 0.5%
      provider: 0,
      defi: 0
    },
    total: (safeAmount * 0.0009) + 0.05 + (safeAmount * 0.005)
  }
}