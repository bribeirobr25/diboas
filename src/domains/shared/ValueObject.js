/**
 * Base Value Object Class
 * Provides common functionality for all value objects
 */

/**
 * Base Value Object
 */
export class ValueObject {
  constructor(props) {
    this._props = Object.freeze({ ...props })
  }

  /**
   * Get property value
   */
  get(prop) {
    return this._props[prop]
  }

  /**
   * Get all properties
   */
  getProps() {
    return { ...this._props }
  }

  /**
   * Check equality with another value object
   */
  equals(other) {
    if (!other || !(other instanceof ValueObject)) {
      return false
    }

    if (this.constructor !== other.constructor) {
      return false
    }

    return this.deepEquals(this._props, other._props)
  }

  /**
   * Deep equality check
   */
  deepEquals(obj1, obj2) {
    if (obj1 === obj2) {
      return true
    }

    if (obj1 == null || obj2 == null) {
      return false
    }

    if (typeof obj1 !== typeof obj2) {
      return false
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false
      }

      if (!this.deepEquals(obj1[key], obj2[key])) {
        return false
      }
    }

    return true
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return this._props
  }

  /**
   * Convert to string
   */
  toString() {
    return JSON.stringify(this._props)
  }

  /**
   * Create copy with updated properties
   */
  with(updates) {
    return new this.constructor({
      ...this._props,
      ...updates
    })
  }

  /**
   * Validate value object
   */
  validate() {
    // Override in subclasses
    return true
  }
}

/**
 * Money Value Object
 */
export class Money extends ValueObject {
  constructor(amount, currency = 'USD') {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a non-negative number')
    }

    if (!currency || typeof currency !== 'string') {
      throw new Error('Currency must be a valid string')
    }

    super({ amount, currency })
  }

  get amount() {
    return this.get('amount')
  }

  get currency() {
    return this.get('currency')
  }

  /**
   * Add money (same currency only)
   */
  add(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only add Money to Money')
    }

    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies')
    }

    return new Money(this.amount + other.amount, this.currency)
  }

  /**
   * Subtract money (same currency only)
   */
  subtract(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only subtract Money from Money')
    }

    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract different currencies')
    }

    const result = this.amount - other.amount
    if (result < 0) {
      throw new Error('Cannot have negative money')
    }

    return new Money(result, this.currency)
  }

  /**
   * Multiply by factor
   */
  multiply(factor) {
    if (typeof factor !== 'number' || factor < 0) {
      throw new Error('Factor must be a non-negative number')
    }

    return new Money(this.amount * factor, this.currency)
  }

  /**
   * Check if greater than other money
   */
  greaterThan(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only compare Money to Money')
    }

    if (this.currency !== other.currency) {
      throw new Error('Cannot compare different currencies')
    }

    return this.amount > other.amount
  }

  /**
   * Check if less than other money
   */
  lessThan(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only compare Money to Money')
    }

    if (this.currency !== other.currency) {
      throw new Error('Cannot compare different currencies')
    }

    return this.amount < other.amount
  }

  /**
   * Check if equal to other money
   */
  equalTo(other) {
    return this.equals(other)
  }

  /**
   * Format as currency string
   */
  format() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount)
  }

  /**
   * Create zero money
   */
  static zero(currency = 'USD') {
    return new Money(0, currency)
  }
}

/**
 * Email Value Object
 */
export class Email extends ValueObject {
  constructor(value) {
    super({ value: value?.toLowerCase() || '' })
    
    if (!this.isValidEmail(this.value)) {
      throw new Error('Invalid email format')
    }
  }

  get value() {
    return this.get('value')
  }

  /**
   * Get domain part of email
   */
  getDomain() {
    return this.value.split('@')[1]
  }

  /**
   * Get local part of email
   */
  getLocal() {
    return this.value.split('@')[0]
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  toString() {
    return this.value
  }
}

/**
 * Username Value Object
 */
export class Username extends ValueObject {
  constructor(value) {
    super({ value: value || '' })
    
    if (!this.isValidUsername(this.value)) {
      throw new Error('Invalid username format')
    }
  }

  get value() {
    return this.get('value')
  }

  /**
   * Validate username format
   */
  isValidUsername(username) {
    // Must start with @ and contain 3-20 alphanumeric characters or underscores
    const usernameRegex = /^@[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  /**
   * Get username without @ symbol
   */
  getHandle() {
    return this.value.substring(1)
  }

  toString() {
    return this.value
  }
}

/**
 * Address Value Object
 */
export class Address extends ValueObject {
  constructor(props) {
    const { street, city, state, country, postalCode } = props

    if (!street || !city || !country) {
      throw new Error('Street, city, and country are required')
    }

    super({
      street: street.trim(),
      city: city.trim(),
      state: state?.trim() || '',
      country: country.trim().toUpperCase(),
      postalCode: postalCode?.trim() || ''
    })
  }

  get street() {
    return this.get('street')
  }

  get city() {
    return this.get('city')
  }

  get state() {
    return this.get('state')
  }

  get country() {
    return this.get('country')
  }

  get postalCode() {
    return this.get('postalCode')
  }

  /**
   * Format as single line
   */
  toSingleLine() {
    const parts = [this.street, this.city]
    
    if (this.state) {
      parts.push(this.state)
    }
    
    if (this.postalCode) {
      parts.push(this.postalCode)
    }
    
    parts.push(this.country)
    
    return parts.join(', ')
  }

  /**
   * Format as multiple lines
   */
  toMultiLine() {
    const lines = [this.street]
    
    let cityLine = this.city
    if (this.state) {
      cityLine += `, ${this.state}`
    }
    if (this.postalCode) {
      cityLine += ` ${this.postalCode}`
    }
    
    lines.push(cityLine)
    lines.push(this.country)
    
    return lines.join('\n')
  }
}

/**
 * Phone Value Object
 */
export class Phone extends ValueObject {
  constructor(value, countryCode = '+1') {
    const normalized = this.normalizePhone(value)
    
    if (!this.isValidPhone(normalized)) {
      throw new Error('Invalid phone number format')
    }

    super({
      value: normalized,
      countryCode
    })
  }

  get value() {
    return this.get('value')
  }

  get countryCode() {
    return this.get('countryCode')
  }

  /**
   * Normalize phone number (remove all non-digits)
   */
  normalizePhone(phone) {
    return phone.replace(/\D/g, '')
  }

  /**
   * Validate phone number
   */
  isValidPhone(phone) {
    // Basic validation - 10 or 11 digits
    return /^\d{10,11}$/.test(phone)
  }

  /**
   * Format phone number
   */
  format() {
    const digits = this.value
    if (digits.length === 10) {
      return `${this.countryCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (digits.length === 11) {
      return `${this.countryCode} ${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    return `${this.countryCode} ${this.value}`
  }

  toString() {
    return this.format()
  }
}