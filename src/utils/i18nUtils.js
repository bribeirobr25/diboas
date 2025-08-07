/**
 * FinTech Internationalization Utilities
 * Provides comprehensive i18n support for global financial applications
 */

/**
 * Supported languages and regions
 */
export const SUPPORTED_LOCALES = {
  'en-US': { name: 'English (US)', currency: 'USD', direction: 'ltr' },
  'en-GB': { name: 'English (UK)', currency: 'GBP', direction: 'ltr' },
  'es-ES': { name: 'Español (España)', currency: 'EUR', direction: 'ltr' },
  'es-MX': { name: 'Español (México)', currency: 'MXN', direction: 'ltr' },
  'fr-FR': { name: 'Français (France)', currency: 'EUR', direction: 'ltr' },
  'de-DE': { name: 'Deutsch (Deutschland)', currency: 'EUR', direction: 'ltr' },
  'it-IT': { name: 'Italiano (Italia)', currency: 'EUR', direction: 'ltr' },
  'pt-BR': { name: 'Português (Brasil)', currency: 'BRL', direction: 'ltr' },
  'zh-CN': { name: '中文 (简体)', currency: 'CNY', direction: 'ltr' },
  'ja-JP': { name: '日本語', currency: 'JPY', direction: 'ltr' },
  'ko-KR': { name: '한국어', currency: 'KRW', direction: 'ltr' },
  'ar-SA': { name: 'العربية', currency: 'SAR', direction: 'rtl' },
  'he-IL': { name: 'עברית', currency: 'ILS', direction: 'rtl' }
}

/**
 * Financial translations for common terms
 */
export const FINANCIAL_TRANSLATIONS = {
  'en-US': {
    // Common financial terms
    balance: 'Balance',
    amount: 'Amount',
    transaction: 'Transaction',
    transfer: 'Transfer',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    fee: 'Fee',
    total: 'Total',
    currency: 'Currency',
    account: 'Account',
    
    // Transaction types
    sent: 'Sent',
    received: 'Received',
    investment: 'Investment',
    rewards: 'Rewards',
    payment: 'Payment',
    
    // Status messages
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    
    // Error messages
    insufficientFunds: 'Insufficient funds',
    invalidAmount: 'Invalid amount',
    networkError: 'Network error occurred',
    
    // Success messages
    transactionSuccessful: 'Transaction completed successfully',
    transferSuccessful: 'Transfer completed successfully',
    
    // Regulatory terms
    kyc: 'Know Your Customer',
    aml: 'Anti-Money Laundering',
    compliance: 'Compliance',
    verification: 'Verification',
    
    // UI elements
    submit: 'Submit',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    
    // Time formats
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    thisMonth: 'This month',
    
    // Accessibility
    closeDialog: 'Close dialog',
    openMenu: 'Open menu',
    showPassword: 'Show password',
    hidePassword: 'Hide password'
  },
  
  'es-ES': {
    balance: 'Saldo',
    amount: 'Cantidad',
    transaction: 'Transacción',
    transfer: 'Transferencia',
    deposit: 'Depósito',
    withdrawal: 'Retiro',
    fee: 'Comisión',
    total: 'Total',
    currency: 'Moneda',
    account: 'Cuenta',
    
    sent: 'Enviado',
    received: 'Recibido',
    investment: 'Inversión',
    rewards: 'Recompensas',
    payment: 'Pago',
    
    pending: 'Pendiente',
    completed: 'Completado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    
    insufficientFunds: 'Fondos insuficientes',
    invalidAmount: 'Cantidad inválida',
    networkError: 'Error de red',
    
    transactionSuccessful: 'Transacción completada exitosamente',
    transferSuccessful: 'Transferencia completada exitosamente',
    
    kyc: 'Conozca a su Cliente',
    aml: 'Antilavado de Dinero',
    compliance: 'Cumplimiento',
    verification: 'Verificación',
    
    submit: 'Enviar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    back: 'Atrás',
    next: 'Siguiente',
    loading: 'Cargando...',
    
    today: 'Hoy',
    yesterday: 'Ayer',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
    
    closeDialog: 'Cerrar diálogo',
    openMenu: 'Abrir menú',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña'
  },
  
  'fr-FR': {
    balance: 'Solde',
    amount: 'Montant',
    transaction: 'Transaction',
    transfer: 'Virement',
    deposit: 'Dépôt',
    withdrawal: 'Retrait',
    fee: 'Frais',
    total: 'Total',
    currency: 'Devise',
    account: 'Compte',
    
    sent: 'Envoyé',
    received: 'Reçu',
    investment: 'Investissement',
    rewards: 'Récompenses',
    payment: 'Paiement',
    
    pending: 'En attente',
    completed: 'Terminé',
    failed: 'Échoué',
    cancelled: 'Annulé',
    
    insufficientFunds: 'Fonds insuffisants',
    invalidAmount: 'Montant invalide',
    networkError: 'Erreur réseau',
    
    transactionSuccessful: 'Transaction terminée avec succès',
    transferSuccessful: 'Virement terminé avec succès',
    
    kyc: 'Connaissance Client',
    aml: 'Lutte Anti-Blanchiment',
    compliance: 'Conformité',
    verification: 'Vérification',
    
    submit: 'Envoyer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    loading: 'Chargement...',
    
    today: "Aujourd'hui",
    yesterday: 'Hier',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    
    closeDialog: 'Fermer la boîte de dialogue',
    openMenu: 'Ouvrir le menu',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe'
  }
}

/**
 * Get current locale from various sources
 */
export const getCurrentLocale = () => {
  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search)
  const urlLocale = urlParams.get('locale')
  if (urlLocale && SUPPORTED_LOCALES[urlLocale]) {
    return urlLocale
  }
  
  // Check localStorage
  const savedLocale = localStorage.getItem('diboas_locale')
  if (savedLocale && SUPPORTED_LOCALES[savedLocale]) {
    return savedLocale
  }
  
  // Check browser language
  const browserLocale = navigator.language
  if (SUPPORTED_LOCALES[browserLocale]) {
    return browserLocale
  }
  
  // Check language without region
  const langOnly = browserLocale.split('-')[0]
  const matchingLocale = Object.keys(SUPPORTED_LOCALES)
    .find(locale => locale.startsWith(langOnly))
  
  if (matchingLocale) {
    return matchingLocale
  }
  
  // Default to English (US)
  return 'en-US'
}

/**
 * Set locale and persist preference
 */
export const setLocale = (locale) => {
  if (!SUPPORTED_LOCALES[locale]) {
    logger.warn(`Unsupported locale: ${locale}`)
    return false
  }
  
  localStorage.setItem('diboas_locale', locale)
  
  // Update document attributes for accessibility
  document.documentElement.lang = locale
  document.documentElement.dir = SUPPORTED_LOCALES[locale].direction
  
  // Trigger custom event for locale change
  window.dispatchEvent(new CustomEvent('localeChange', { detail: { locale } }))
  
  return true
}

/**
 * Translation function
 */
export const t = (key, locale = null, interpolations = {}) => {
  const currentLocale = locale || getCurrentLocale()
  const translations = FINANCIAL_TRANSLATIONS[currentLocale] || FINANCIAL_TRANSLATIONS['en-US']
  
  let translation = translations[key] || key
  
  // Handle interpolations
  Object.entries(interpolations).forEach(([placeholder, value]) => {
    translation = translation.replace(`{{${placeholder}}}`, value)
  })
  
  return translation
}

/**
 * Currency formatting utilities
 */
export const formatCurrency = (amount, locale = null, currency = null) => {
  const currentLocale = locale || getCurrentLocale()
  const localeInfo = SUPPORTED_LOCALES[currentLocale]
  const currencyCode = currency || localeInfo.currency
  
  try {
    const formatter = new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    
    return formatter.format(amount)
  } catch (error) {
    logger.warn(`Currency formatting error: ${error.message}`)
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

/**
 * Number formatting utilities
 */
export const formatNumber = (number, locale = null, options = {}) => {
  const currentLocale = locale || getCurrentLocale()
  
  try {
    const formatter = new Intl.NumberFormat(currentLocale, options)
    return formatter.format(number)
  } catch (error) {
    logger.warn(`Number formatting error: ${error.message}`)
    return number.toString()
  }
}

/**
 * Date and time formatting utilities
 */
export const formatDateTime = (date, locale = null, options = {}) => {
  const currentLocale = locale || getCurrentLocale()
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  try {
    const formatter = new Intl.DateTimeFormat(currentLocale, {
      ...defaultOptions,
      ...options
    })
    
    return formatter.format(new Date(date))
  } catch (error) {
    logger.warn(`Date formatting error: ${error.message}`)
    return new Date(date).toLocaleString()
  }
}

/**
 * Relative time formatting
 */
export const formatRelativeTime = (date, locale = null) => {
  const currentLocale = locale || getCurrentLocale()
  
  try {
    const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' })
    const now = new Date()
    const targetDate = new Date(date)
    const diffInSeconds = Math.floor((targetDate - now) / 1000)
    
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second')
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute')
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour')
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (Math.abs(diffInDays) < 30) {
      return rtf.format(diffInDays, 'day')
    }
    
    const diffInMonths = Math.floor(diffInDays / 30)
    return rtf.format(diffInMonths, 'month')
    
  } catch (error) {
    logger.warn(`Relative time formatting error: ${error.message}`)
    return formatDateTime(date, locale, { month: 'short', day: 'numeric' })
  }
}

/**
 * Pluralization utilities
 */
export const pluralize = (count, single, plural, locale = null) => {
  const currentLocale = locale || getCurrentLocale()
  
  try {
    const pr = new Intl.PluralRules(currentLocale)
    const rule = pr.select(count)
    
    if (rule === 'one') {
      return single
    } else {
      return plural || `${single}s`
    }
  } catch (error) {
    logger.warn(`Pluralization error: ${error.message}`)
    return count === 1 ? single : (plural || `${single}s`)
  }
}

/**
 * RTL support utilities
 */
export const isRTL = (locale = null) => {
  const currentLocale = locale || getCurrentLocale()
  return SUPPORTED_LOCALES[currentLocale]?.direction === 'rtl'
}

/**
 * React hooks for internationalization
 */
import { useState, useEffect } from 'react'
import logger from './logger'

export const useLocale = () => {
  const [locale, setLocaleState] = useState(getCurrentLocale())
  
  useEffect(() => {
    const handleLocaleChange = (event) => {
      setLocaleState(event.detail.locale)
    }
    
    window.addEventListener('localeChange', handleLocaleChange)
    return () => window.removeEventListener('localeChange', handleLocaleChange)
  }, [])
  
  const changeLocale = (newLocale) => {
    if (setLocale(newLocale)) {
      setLocaleState(newLocale)
    }
  }
  
  return {
    locale,
    changeLocale,
    isRTL: isRTL(locale),
    localeInfo: SUPPORTED_LOCALES[locale]
  }
}

export const useTranslation = () => {
  const { locale } = useLocale()
  
  const translate = (key, interpolations = {}) => {
    return t(key, locale, interpolations)
  }
  
  return {
    t: translate,
    locale,
    formatCurrency: (amount, currency) => formatCurrency(amount, locale, currency),
    formatNumber: (number, options) => formatNumber(number, locale, options),
    formatDateTime: (date, options) => formatDateTime(date, locale, options),
    formatRelativeTime: (date) => formatRelativeTime(date, locale),
    pluralize: (count, single, plural) => pluralize(count, single, plural, locale)
  }
}

/**
 * Financial regulatory text by region
 */
export const REGULATORY_TEXTS = {
  'en-US': {
    depositInsurance: 'Deposits are FDIC insured up to $250,000 per depositor.',
    riskDisclosure: 'Investment products are not FDIC insured and may lose value.',
    privacyPolicy: 'Your privacy is protected under the Gramm-Leach-Bliley Act.',
    dataProtection: 'We protect your personal information in accordance with US federal regulations.'
  },
  'en-GB': {
    depositInsurance: 'Deposits are protected by the Financial Services Compensation Scheme up to £85,000.',
    riskDisclosure: 'Investment products are not covered by FSCS and may lose value.',
    privacyPolicy: 'Your data is protected under UK GDPR and Data Protection Act 2018.',
    dataProtection: 'We process your data in accordance with FCA regulations.'
  },
  'es-ES': {
    depositInsurance: 'Los depósitos están garantizados por el Fondo de Garantía de Depósitos hasta 100.000€.',
    riskDisclosure: 'Los productos de inversión no están garantizados y pueden perder valor.',
    privacyPolicy: 'Sus datos están protegidos bajo el RGPD europeo.',
    dataProtection: 'Procesamos sus datos conforme a la normativa del Banco de España.'
  }
}

export const getRegulatoryText = (key, locale = null) => {
  const currentLocale = locale || getCurrentLocale()
  const texts = REGULATORY_TEXTS[currentLocale] || REGULATORY_TEXTS['en-US']
  return texts[key] || texts[key.replace(/([A-Z])/g, '_$1').toLowerCase()]
}

export default {
  SUPPORTED_LOCALES,
  getCurrentLocale,
  setLocale,
  t,
  formatCurrency,
  formatNumber,
  formatDateTime,
  formatRelativeTime,
  pluralize,
  isRTL,
  useLocale,
  useTranslation,
  getRegulatoryText
}