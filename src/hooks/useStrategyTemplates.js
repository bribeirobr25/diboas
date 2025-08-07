/**
 * Strategy Templates Hook
 * Handles real-time strategy template retrieval via MockupStrategyTemplateProviderService
 */

import { useState, useEffect, useCallback } from 'react'
import { mockupStrategyTemplateProviderService } from '../services/strategies/MockupStrategyTemplateProviderService'
import logger from '../utils/logger'

export const useStrategyTemplates = () => {
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isTimeout, setIsTimeout] = useState(false)

  // Load strategy templates with 5-second timeout
  const loadStrategyTemplates = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    setIsTimeout(false)

    // Set up 5-second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        setIsTimeout(true)
        reject(new Error('Strategy templates loading timeout - please try again'))
      }, 5000)
    })

    try {
      // Race between template loading and timeout
      const strategyData = await Promise.race([
        mockupStrategyTemplateProviderService.getAllStrategyData(),
        timeoutPromise
      ])

      // Convert templates to legacy format for component compatibility
      const formattedTemplates = {}
      strategyData.templates.forEach(template => {
        // Map new format to legacy ObjectiveConfig format
        const legacyId = template.id.replace('_', '-')
        formattedTemplates[legacyId] = {
          id: legacyId,
          title: template.title,
          description: template.description,
          icon: template.icon,
          defaultImage: template.defaultImage,
          suggestedAmount: Math.min(template.suggestedAmount, 1000), // Cap for UI consistency
          suggestedTarget: template.suggestedAmount,
          riskLevel: mapRiskLevel(template.riskLevel),
          expectedAPY: formatAPYRange(template.riskLevel),
          timeline: mapTimeframe(template.timeframe),
          color: mapCategoryColor(template.category)
        }
      })

      setTemplates(formattedTemplates)
      setCategories(strategyData.categories)
      
      logger.debug('useStrategyTemplates: Loaded real-time strategy templates:', formattedTemplates)
      return formattedTemplates
    } catch (err) {
      logger.error('useStrategyTemplates: Failed to load strategy templates:', err)
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Map risk level to legacy format
  const mapRiskLevel = useCallback((riskLevel) => {
    const mapping = {
      'conservative': 'Conservative',
      'moderate': 'Moderate',
      'balanced': 'Balanced',
      'aggressive': 'Aggressive'
    }
    return mapping[riskLevel] || 'Moderate'
  }, [])

  // Format APY range based on risk level
  const formatAPYRange = useCallback((riskLevel) => {
    const ranges = {
      'conservative': '3-5%',
      'moderate': '5-8%',
      'balanced': '8-15%',
      'aggressive': '12-25%'
    }
    return ranges[riskLevel] || '5-8%'
  }, [])

  // Map timeframe to legacy format
  const mapTimeframe = useCallback((timeframe) => {
    if (!timeframe) return '6-to-12-months'
    
    if (timeframe.includes('month') && timeframe.includes('3-6')) return 'up-to-6-months'
    if (timeframe.includes('month') && (timeframe.includes('6-18') || timeframe.includes('1-2'))) return '6-to-12-months'
    if (timeframe.includes('year') || timeframe.includes('10+')) return 'more-than-12-months'
    
    return '6-to-12-months'
  }, [])

  // Map category to color scheme
  const mapCategoryColor = useCallback((category) => {
    const colors = {
      'safety': 'bg-red-100 text-red-600',
      'lifestyle': 'bg-amber-100 text-amber-600', 
      'major_purchase': 'bg-blue-100 text-blue-600',
      'retirement': 'bg-purple-100 text-purple-600',
      'education': 'bg-green-100 text-green-600',
      'life_events': 'bg-pink-100 text-pink-600',
      'business': 'bg-indigo-100 text-indigo-600'
    }
    return colors[category] || 'bg-gray-100 text-gray-600'
  }, [])

  // Get template by ID
  const getTemplateById = useCallback((templateId) => {
    return templates[templateId]
  }, [templates])

  // Get templates by category
  const getTemplatesByCategory = useCallback(async (category) => {
    try {
      const categoryTemplates = await mockupStrategyTemplateProviderService.getTemplatesByCategory(category)
      return categoryTemplates.reduce((acc, template) => {
        const legacyId = template.id.replace('_', '-')
        acc[legacyId] = {
          id: legacyId,
          title: template.title,
          description: template.description,
          icon: template.icon,
          defaultImage: template.defaultImage,
          suggestedAmount: Math.min(template.suggestedAmount, 1000),
          suggestedTarget: template.suggestedAmount,
          riskLevel: mapRiskLevel(template.riskLevel),
          expectedAPY: formatAPYRange(template.riskLevel),
          timeline: mapTimeframe(template.timeframe),
          color: mapCategoryColor(template.category)
        }
        return acc
      }, {})
    } catch (err) {
      logger.error('useStrategyTemplates: Failed to load templates by category:', err)
      return {}
    }
  }, [mapRiskLevel, formatAPYRange, mapTimeframe, mapCategoryColor])

  // Initialize on mount
  useEffect(() => {
    loadStrategyTemplates()
  }, [loadStrategyTemplates])

  return {
    templates,
    categories,
    isLoading,
    error,
    isTimeout,
    loadStrategyTemplates,
    getTemplateById,
    getTemplatesByCategory
  }
}