/**
 * Enhanced Onfido KYC Provider
 * Handles identity verification through Onfido's API
 * Supports document verification, facial recognition, and compliance checks
 */

import secureLogger from '../../../../utils/secureLogger.js'

export class OnfidoEnhancedProvider {
  constructor(config = {}) {
    this.apiToken = config.apiToken
    this.baseUrl = config.baseUrl || 'https://api.onfido.com/v3.6'
    this.webhookToken = config.webhookToken
    this.timeout = config.timeout || 30000
    this.region = config.region || 'US'
    
    if (!this.apiToken) {
      throw new Error('Onfido API token is required')
    }
  }

  /**
   * Health check for Onfido API
   */
  async healthCheck() {
    try {
      // Test API connectivity
      const response = await this.makeRequest('GET', '/addresses/pick')
      
      return {
        healthy: response.status === 200,
        responseTime: Date.now() - this.lastRequestTime,
        provider: 'onfido'
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        provider: 'onfido'
      }
    }
  }

  /**
   * Create an applicant
   */
  async createApplicant(applicantData) {
    try {
      const payload = {
        first_name: applicantData.firstName,
        last_name: applicantData.lastName,
        email: applicantData.email,
        dob: applicantData.dateOfBirth, // Format: YYYY-MM-DD
        address: applicantData.address ? {
          line1: applicantData.address.line1,
          line2: applicantData.address.line2,
          town: applicantData.address.city,
          state: applicantData.address.state,
          postcode: applicantData.address.postalCode,
          country: applicantData.address.country
        } : undefined,
        phone_number: applicantData.phoneNumber,
        id_numbers: applicantData.idNumbers || []
      }

      const response = await this.makeRequest('POST', '/applicants', payload)
      
      if (response.data.id) {
        secureLogger.audit('ONFIDO_APPLICANT_CREATED', {
          applicantId: response.data.id,
          email: applicantData.email
        })

        return {
          success: true,
          applicantId: response.data.id,
          href: response.data.href,
          provider: 'onfido'
        }
      }

      throw new Error('Failed to create Onfido applicant')

    } catch (error) {
      secureLogger.audit('ONFIDO_APPLICANT_ERROR', {
        error: error.message,
        email: applicantData.email
      })

      return {
        success: false,
        error: error.message,
        provider: 'onfido'
      }
    }
  }

  /**
   * Upload document for verification
   */
  async uploadDocument(applicantId, documentData) {
    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append('type', documentData.type) // 'passport', 'driving_licence', 'national_identity_card'
      formData.append('side', documentData.side || 'front') // 'front', 'back'
      formData.append('issuing_country', documentData.issuingCountry || 'USA')
      
      if (documentData.file) {
        formData.append('file', documentData.file)
      } else if (documentData.base64) {
        // Convert base64 to blob
        const byteCharacters = atob(documentData.base64.split(',')[1])
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/jpeg' })
        formData.append('file', blob, 'document.jpg')
      }

      const response = await this.makeRequest(
        'POST', 
        `/applicants/${applicantId}/documents`, 
        formData,
        { 'Content-Type': 'multipart/form-data' }
      )
      
      if (response.data.id) {
        secureLogger.audit('ONFIDO_DOCUMENT_UPLOADED', {
          applicantId,
          documentId: response.data.id,
          type: documentData.type
        })

        return {
          success: true,
          documentId: response.data.id,
          type: response.data.type,
          side: response.data.side,
          href: response.data.href,
          provider: 'onfido'
        }
      }

      throw new Error('Failed to upload document')

    } catch (error) {
      secureLogger.audit('ONFIDO_DOCUMENT_ERROR', {
        error: error.message,
        applicantId,
        documentType: documentData.type
      })

      return {
        success: false,
        error: error.message,
        provider: 'onfido'
      }
    }
  }

  /**
   * Create a check (verification process)
   */
  async createCheck(applicantId, checkData = {}) {
    try {
      const payload = {
        type: checkData.type || 'express',
        reports: checkData.reports || [
          { name: 'document' },
          { name: 'facial_similarity_photo' }
        ],
        applicant_provides_data: checkData.applicantProvidesData || false,
        asynchronous: checkData.asynchronous !== false,
        suppress_form_emails: checkData.suppressFormEmails || false,
        redirect_uri: checkData.redirectUri,
        webhook_ids: checkData.webhookIds || []
      }

      const response = await this.makeRequest('POST', `/applicants/${applicantId}/checks`, payload)
      
      if (response.data.id) {
        secureLogger.audit('ONFIDO_CHECK_CREATED', {
          applicantId,
          checkId: response.data.id,
          type: payload.type
        })

        return {
          success: true,
          checkId: response.data.id,
          status: response.data.status,
          result: response.data.result,
          href: response.data.href,
          reports: response.data.reports,
          provider: 'onfido'
        }
      }

      throw new Error('Failed to create check')

    } catch (error) {
      secureLogger.audit('ONFIDO_CHECK_ERROR', {
        error: error.message,
        applicantId
      })

      return {
        success: false,
        error: error.message,
        provider: 'onfido'
      }
    }
  }

  /**
   * Get check status and results
   */
  async getCheck(applicantId, checkId) {
    try {
      const response = await this.makeRequest('GET', `/applicants/${applicantId}/checks/${checkId}`)
      
      if (response.data) {
        return {
          success: true,
          checkId: response.data.id,
          status: response.data.status,
          result: response.data.result,
          completedAt: response.data.completed_at_iso8601,
          reports: response.data.reports,
          provider: 'onfido'
        }
      }

      throw new Error('Check not found')

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'onfido'
      }
    }
  }

  /**
   * Create SDK token for frontend integration
   */
  async createSdkToken(applicantId, referrer = '*') {
    try {
      const payload = {
        applicant_id: applicantId,
        referrer: referrer
      }

      const response = await this.makeRequest('POST', '/sdk_token', payload)
      
      if (response.data.token) {
        secureLogger.audit('ONFIDO_SDK_TOKEN_CREATED', {
          applicantId
        })

        return {
          success: true,
          token: response.data.token,
          provider: 'onfido'
        }
      }

      throw new Error('Failed to create SDK token')

    } catch (error) {
      secureLogger.audit('ONFIDO_SDK_TOKEN_ERROR', {
        error: error.message,
        applicantId
      })

      return {
        success: false,
        error: error.message,
        provider: 'onfido'
      }
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, endpoint, data = null, customHeaders = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const headers = {
        'Authorization': `Token token=${this.apiToken}`,
        'User-Agent': 'diBoaS/1.0',
        ...customHeaders
      }

      // Don't set Content-Type for FormData
      if (!(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }

      const options = {
        method: method,
        headers: headers,
        signal: AbortSignal.timeout(this.timeout)
      }

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        if (data instanceof FormData) {
          options.body = data
        } else {
          options.body = JSON.stringify(data)
        }
      }

      this.lastRequestTime = Date.now()
      
      const response = await fetch(url, options)
      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage = responseData.error?.message || responseData.message || 'Unknown error'
        throw new Error(`Onfido API error: ${response.status} - ${errorMessage}`)
      }

      return {
        status: response.status,
        data: responseData
      }

    } catch (error) {
      secureLogger.audit('ONFIDO_REQUEST_ERROR', {
        method,
        endpoint,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      documentVerification: true,
      facialRecognition: true,
      addressVerification: true,
      backgroundChecks: true,
      livenessDetection: true,
      supportedDocuments: [
        'passport',
        'driving_licence',
        'national_identity_card',
        'residence_permit'
      ],
      supportedCountries: ['US', 'UK', 'EU', 'AU', 'CA', 'IN'],
      provider: 'onfido'
    }
  }
}

export default OnfidoEnhancedProvider