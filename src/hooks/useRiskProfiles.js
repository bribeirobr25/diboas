/**
 * Risk Profiles Hook
 * Handles real-time risk profile retrieval via MockupRiskProfileProviderService
 */

import { useState, useEffect, useCallback } from 'react'
import { mockupRiskProfileProviderService } from '../services/risk/MockupRiskProfileProviderService'
import logger from '../utils/logger'

export const useRiskProfiles = () => {
  const [riskProfiles, setRiskProfiles] = useState({})
  const [questionnaire, setQuestionnaire] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isTimeout, setIsTimeout] = useState(false)

  // Load risk profiles with 5-second timeout
  const loadRiskProfiles = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    setIsTimeout(false)

    // Set up 5-second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        setIsTimeout(true)
        reject(new Error('Risk profiles loading timeout - please try again'))
      }, 5000)
    })

    try {
      // Race between profile loading and timeout
      const riskData = await Promise.race([
        mockupRiskProfileProviderService.getAllRiskData(),
        timeoutPromise
      ])

      // Convert profiles to legacy format for component compatibility
      const formattedProfiles = {}
      riskData.profiles.forEach(profile => {
        const legacyName = profile.name
        formattedProfiles[legacyName] = {
          label: profile.name,
          apy: `${profile.apyRange.min}-${profile.apyRange.max}%`,
          description: profile.description,
          color: `${profile.bgColor} ${profile.color}`,
          riskScore: profile.riskScore
        }
      })

      setRiskProfiles(formattedProfiles)
      setQuestionnaire(riskData.questionnaire)
      
      logger.debug('useRiskProfiles: Loaded real-time risk profiles:', formattedProfiles)
      return formattedProfiles
    } catch (err) {
      logger.error('useRiskProfiles: Failed to load risk profiles:', err)
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get risk profile by ID
  const getRiskProfileById = useCallback(async (profileId) => {
    try {
      const profile = await mockupRiskProfileProviderService.getRiskProfileById(profileId)
      if (!profile) return null

      return {
        label: profile.name,
        apy: `${profile.apyRange.min}-${profile.apyRange.max}%`,
        description: profile.description,
        color: `${profile.bgColor} ${profile.color}`,
        riskScore: profile.riskScore
      }
    } catch (err) {
      logger.error('useRiskProfiles: Failed to get risk profile by ID:', err)
      return null
    }
  }, [])

  // Calculate risk profile recommendation
  const calculateRiskRecommendation = useCallback(async (answers) => {
    try {
      const recommendation = await mockupRiskProfileProviderService.calculateRiskProfile(answers)
      
      if (recommendation.recommendedProfile) {
        return {
          profile: {
            label: recommendation.recommendedProfile.name,
            apy: `${recommendation.recommendedProfile.apyRange.min}-${recommendation.recommendedProfile.apyRange.max}%`,
            description: recommendation.recommendedProfile.description,
            color: `${recommendation.recommendedProfile.bgColor} ${recommendation.recommendedProfile.color}`,
            riskScore: recommendation.recommendedProfile.riskScore
          },
          totalScore: recommendation.totalScore,
          maxScore: recommendation.maxScore,
          confidence: recommendation.confidence
        }
      }
      
      return null
    } catch (err) {
      logger.error('useRiskProfiles: Failed to calculate risk recommendation:', err)
      return null
    }
  }, [])

  // Get risk profiles suitable for amount
  const getRiskProfilesForAmount = useCallback(async (amount) => {
    try {
      const profiles = await mockupRiskProfileProviderService.getRiskProfilesForAmount(amount)
      
      const formattedProfiles = {}
      profiles.forEach(profile => {
        const legacyName = profile.name
        formattedProfiles[legacyName] = {
          label: profile.name,
          apy: `${profile.apyRange.min}-${profile.apyRange.max}%`,
          description: profile.description,
          color: `${profile.bgColor} ${profile.color}`,
          riskScore: profile.riskScore
        }
      })
      
      return formattedProfiles
    } catch (err) {
      logger.error('useRiskProfiles: Failed to get risk profiles for amount:', err)
      return {}
    }
  }, [])

  // Get market-adjusted APY ranges
  const getMarketAdjustedRanges = useCallback(async () => {
    try {
      const marketData = await mockupRiskProfileProviderService.getMarketAdjustedRanges()
      
      const adjustedProfiles = {}
      marketData.adjustedProfiles.forEach(profile => {
        const legacyName = profile.name
        adjustedProfiles[legacyName] = {
          label: profile.name,
          apy: `${profile.currentApyRange.min.toFixed(1)}-${profile.currentApyRange.max.toFixed(1)}%`,
          description: profile.description,
          color: `${profile.bgColor} ${profile.color}`,
          riskScore: profile.riskScore,
          marketAdjustment: true
        }
      })
      
      return {
        profiles: adjustedProfiles,
        marketConditions: marketData.marketConditions
      }
    } catch (err) {
      logger.error('useRiskProfiles: Failed to get market-adjusted ranges:', err)
      return { profiles: {}, marketConditions: null }
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    loadRiskProfiles()
  }, [loadRiskProfiles])

  return {
    riskProfiles,
    questionnaire,
    isLoading,
    error,
    isTimeout,
    loadRiskProfiles,
    getRiskProfileById,
    calculateRiskRecommendation,
    getRiskProfilesForAmount,
    getMarketAdjustedRanges
  }
}