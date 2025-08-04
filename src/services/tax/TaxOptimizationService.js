/**
 * Tax Optimization Service
 * Provides tax-efficient investment strategies, loss harvesting, and compliance features
 */

import logger from '../../utils/logger.js'
import secureLogger from '../../utils/secureLogger.js'

export const TAX_STRATEGIES = {
  TAX_LOSS_HARVESTING: 'tax_loss_harvesting',
  LONG_TERM_CAPITAL_GAINS: 'long_term_capital_gains',
  TAX_ADVANTAGED_ACCOUNTS: 'tax_advantaged_accounts',
  MUNICIPAL_BONDS: 'municipal_bonds',
  INDEX_FUND_EFFICIENCY: 'index_fund_efficiency'
}

export const TAX_BRACKETS = {
  US_2024: {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11601, max: 47150, rate: 0.12 },
      { min: 47151, max: 100525, rate: 0.22 },
      { min: 100526, max: 191650, rate: 0.24 },
      { min: 191651, max: 243725, rate: 0.32 },
      { min: 243726, max: 609350, rate: 0.35 },
      { min: 609351, max: Infinity, rate: 0.37 }
    ],
    marriedFilingJointly: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23201, max: 94300, rate: 0.12 },
      { min: 94301, max: 201050, rate: 0.22 },
      { min: 201051, max: 383900, rate: 0.24 },
      { min: 383901, max: 487450, rate: 0.32 },
      { min: 487451, max: 731200, rate: 0.35 },
      { min: 731201, max: Infinity, rate: 0.37 }
    ]
  }
}

export const CAPITAL_GAINS_RATES = {
  shortTerm: 'ordinary_income', // Taxed as ordinary income
  longTerm: {
    single: [
      { min: 0, max: 47025, rate: 0.00 },
      { min: 47026, max: 518900, rate: 0.15 },
      { min: 518901, max: Infinity, rate: 0.20 }
    ],
    marriedFilingJointly: [
      { min: 0, max: 94050, rate: 0.00 },
      { min: 94051, max: 583750, rate: 0.15 },
      { min: 583751, max: Infinity, rate: 0.20 }
    ]
  }
}

class TaxOptimizationService {
  constructor() {
    this.taxReports = new Map()
    this.harvestingOpportunities = new Map()
    this.cacheTimeout = 24 * 60 * 60 * 1000 // 24 hours
    
    logger.info('Tax optimization service initialized')
  }

  /**
   * Calculate tax liability for investment portfolio
   */
  async calculateTaxLiability(portfolio, userProfile) {
    try {
      const taxYear = userProfile.taxYear || new Date().getFullYear()
      const filingStatus = userProfile.filingStatus || 'single'
      const income = userProfile.annualIncome || 0

      let totalCapitalGains = 0
      let totalCapitalLosses = 0
      let shortTermGains = 0
      let longTermGains = 0
      let dividendIncome = 0
      let interestIncome = 0

      const positionAnalysis = []

      // Analyze each position for tax implications
      for (const position of portfolio.positions) {
        const analysis = await this.analyzePositionTaxImplications(position, taxYear)
        positionAnalysis.push(analysis)

        if (analysis.capitalGains > 0) {
          totalCapitalGains += analysis.capitalGains
          if (analysis.holdingPeriod <= 365) {
            shortTermGains += analysis.capitalGains
          } else {
            longTermGains += analysis.capitalGains
          }
        } else {
          totalCapitalLosses += Math.abs(analysis.capitalGains)
        }

        dividendIncome += analysis.dividendIncome || 0
        interestIncome += analysis.interestIncome || 0
      }

      // Calculate net capital gains/losses
      const netCapitalGains = Math.max(0, totalCapitalGains - totalCapitalLosses)
      const capitalLossCarryforward = Math.max(0, totalCapitalLosses - totalCapitalGains - 3000)

      // Calculate taxes
      const ordinaryIncomeTax = this.calculateOrdinaryIncomeTax(
        income + shortTermGains + dividendIncome + interestIncome,
        filingStatus
      )

      const capitalGainsTax = this.calculateCapitalGainsTax(
        longTermGains,
        income,
        filingStatus
      )

      const totalTaxLiability = ordinaryIncomeTax + capitalGainsTax

      const taxAnalysis = {
        taxYear,
        filingStatus,
        totalIncome: income,
        capitalGains: {
          shortTerm: shortTermGains,
          longTerm: longTermGains,
          total: totalCapitalGains,
          net: netCapitalGains
        },
        capitalLosses: totalCapitalLosses,
        capitalLossCarryforward,
        dividendIncome,
        interestIncome,
        taxes: {
          ordinaryIncome: ordinaryIncomeTax,
          capitalGains: capitalGainsTax,
          total: totalTaxLiability
        },
        positionAnalysis,
        effectiveTaxRate: (totalTaxLiability / Math.max(income + netCapitalGains, 1)) * 100,
        marginalTaxRate: this.getMarginalTaxRate(income, filingStatus) * 100,
        calculatedAt: new Date().toISOString()
      }

      secureLogger.audit('TAX_LIABILITY_CALCULATED', {
        taxYear,
        totalTaxLiability: totalTaxLiability.toFixed(2),
        netCapitalGains: netCapitalGains.toFixed(2)
      })

      return taxAnalysis
    } catch (error) {
      logger.error('Tax liability calculation failed:', error)
      throw error
    }
  }

  /**
   * Identify tax loss harvesting opportunities
   */
  async identifyHarvestingOpportunities(portfolio, minLossThreshold = 1000) {
    try {
      const opportunities = []
      const currentDate = new Date()

      for (const position of portfolio.positions) {
        const unrealizedLoss = position.currentValue - position.costBasis
        
        if (unrealizedLoss < -minLossThreshold) {
          // Check wash sale rule (30-day rule)
          const daysSinceLastPurchase = this.getDaysSinceLastPurchase(position)
          const canHarvest = daysSinceLastPurchase > 30

          const opportunity = {
            positionId: position.id,
            asset: position.asset,
            protocol: position.protocol,
            currentValue: position.currentValue,
            costBasis: position.costBasis,
            unrealizedLoss: Math.abs(unrealizedLoss),
            potentialTaxSavings: Math.abs(unrealizedLoss) * this.getMarginalTaxRate(75000, 'single'), // Estimate
            canHarvest,
            washSaleRisk: !canHarvest,
            daysSinceLastPurchase,
            recommendation: canHarvest ? 'HARVEST_NOW' : 'WAIT_FOR_WASH_SALE_PERIOD',
            alternativeAssets: await this.findSimilarAssets(position.asset),
            harvestingStrategy: this.getHarvestingStrategy(position)
          }

          opportunities.push(opportunity)
        }
      }

      // Sort by potential tax savings
      opportunities.sort((a, b) => b.potentialTaxSavings - a.potentialTaxSavings)

      const summary = {
        totalOpportunities: opportunities.length,
        totalPotentialLoss: opportunities.reduce((sum, opp) => sum + opp.unrealizedLoss, 0),
        totalPotentialSavings: opportunities.reduce((sum, opp) => sum + opp.potentialTaxSavings, 0),
        immediatelyHarvestable: opportunities.filter(opp => opp.canHarvest).length,
        opportunities,
        generatedAt: new Date().toISOString()
      }

      return summary
    } catch (error) {
      logger.error('Tax loss harvesting analysis failed:', error)
      throw error
    }
  }

  /**
   * Generate tax optimization recommendations
   */
  async generateTaxOptimizationRecommendations(portfolio, userProfile) {
    try {
      const recommendations = []
      const taxAnalysis = await this.calculateTaxLiability(portfolio, userProfile)
      const harvestingOpportunities = await this.identifyHarvestingOpportunities(portfolio)

      // Tax Loss Harvesting Recommendations
      if (harvestingOpportunities.totalOpportunities > 0) {
        recommendations.push({
          strategy: TAX_STRATEGIES.TAX_LOSS_HARVESTING,
          priority: 'high',
          title: 'Tax Loss Harvesting Opportunities',
          description: `Harvest ${harvestingOpportunities.immediatelyHarvestable} positions to save up to $${harvestingOpportunities.totalPotentialSavings.toFixed(2)} in taxes`,
          potentialSavings: harvestingOpportunities.totalPotentialSavings,
          implementation: {
            actions: harvestingOpportunities.opportunities
              .filter(opp => opp.canHarvest)
              .slice(0, 3) // Top 3 opportunities
              .map(opp => ({
                action: 'sell_and_replace',
                asset: opp.asset,
                amount: opp.currentValue,
                replacementAsset: opp.alternativeAssets[0],
                taxSavings: opp.potentialTaxSavings
              }))
          }
        })
      }

      // Long-term Capital Gains Strategy
      const shortTermPositions = portfolio.positions.filter(pos => 
        this.getHoldingPeriod(pos) <= 365 && (pos.currentValue - pos.costBasis) > 0
      )

      if (shortTermPositions.length > 0) {
        const potentialSavings = shortTermPositions.reduce((sum, pos) => {
          const gain = pos.currentValue - pos.costBasis
          const shortTermTax = gain * this.getMarginalTaxRate(userProfile.annualIncome, userProfile.filingStatus)
          const longTermTax = gain * this.getCapitalGainsRate(userProfile.annualIncome, userProfile.filingStatus)
          return sum + (shortTermTax - longTermTax)
        }, 0)

        if (potentialSavings > 500) {
          recommendations.push({
            strategy: TAX_STRATEGIES.LONG_TERM_CAPITAL_GAINS,
            priority: 'medium',
            title: 'Hold for Long-Term Capital Gains',
            description: `Hold ${shortTermPositions.length} positions longer to qualify for preferential long-term capital gains rates`,
            potentialSavings,
            implementation: {
              actions: shortTermPositions.map(pos => ({
                action: 'hold_until_long_term',
                asset: pos.asset,
                currentHoldingPeriod: this.getHoldingPeriod(pos),
                daysToLongTerm: 365 - this.getHoldingPeriod(pos),
                potentialSavings: (pos.currentValue - pos.costBasis) * 
                  (this.getMarginalTaxRate(userProfile.annualIncome, userProfile.filingStatus) - 
                   this.getCapitalGainsRate(userProfile.annualIncome, userProfile.filingStatus))
              }))
            }
          })
        }
      }

      // Tax-Efficient Asset Allocation
      if (userProfile.hasRetirementAccounts) {
        recommendations.push({
          strategy: TAX_STRATEGIES.TAX_ADVANTAGED_ACCOUNTS,
          priority: 'medium',
          title: 'Optimize Asset Location',
          description: 'Place tax-inefficient investments in tax-advantaged accounts',
          potentialSavings: this.estimateAssetLocationSavings(portfolio, userProfile),
          implementation: {
            actions: [
              {
                action: 'move_to_tax_advantaged',
                recommendation: 'Place high-yield bonds and REITs in 401(k)/IRA accounts',
                rationale: 'Avoid ordinary income tax on interest and dividends'
              },
              {
                action: 'keep_in_taxable',
                recommendation: 'Keep index funds and growth stocks in taxable accounts',
                rationale: 'Benefit from preferential capital gains rates and tax-loss harvesting'
              }
            ]
          }
        })
      }

      // Municipal Bonds for High Earners
      if (userProfile.annualIncome > 100000) {
        const municipalBondYield = 3.5 // Estimate
        const taxableEquivalentYield = municipalBondYield / (1 - this.getMarginalTaxRate(userProfile.annualIncome, userProfile.filingStatus))
        
        if (taxableEquivalentYield > 4.5) { // If competitive with other investments
          recommendations.push({
            strategy: TAX_STRATEGIES.MUNICIPAL_BONDS,
            priority: 'low',
            title: 'Consider Municipal Bonds',
            description: `Tax-free municipal bonds offer ${taxableEquivalentYield.toFixed(2)}% taxable-equivalent yield`,
            potentialSavings: this.estimateMunicipalBondSavings(portfolio, userProfile),
            implementation: {
              actions: [{
                action: 'allocate_to_municipal_bonds',
                recommendedAllocation: '10-20% of fixed income allocation',
                taxableEquivalentYield: taxableEquivalentYield.toFixed(2) + '%'
              }]
            }
          })
        }
      }

      // Index Fund Tax Efficiency
      const highTurnoverFunds = portfolio.positions.filter(pos => 
        pos.assetType === 'mutual_fund' && (pos.turnoverRate || 0) > 50
      )

      if (highTurnoverFunds.length > 0) {
        recommendations.push({
          strategy: TAX_STRATEGIES.INDEX_FUND_EFFICIENCY,
          priority: 'medium',
          title: 'Switch to Tax-Efficient Index Funds',
          description: 'Replace high-turnover funds with low-cost index funds',
          potentialSavings: this.estimateIndexFundSavings(highTurnoverFunds, userProfile),
          implementation: {
            actions: highTurnoverFunds.map(fund => ({
              action: 'replace_with_index_fund',
              currentFund: fund.asset,
              recommendedReplacement: this.getIndexFundReplacement(fund),
              currentTurnoverRate: fund.turnoverRate + '%',
              estimatedAnnualTaxSavings: fund.currentValue * 0.01 // Estimate 1% savings
            }))
          }
        })
      }

      // Sort recommendations by potential savings
      recommendations.sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0))

      return {
        recommendations,
        taxAnalysis,
        harvestingOpportunities,
        totalPotentialSavings: recommendations.reduce((sum, rec) => sum + (rec.potentialSavings || 0), 0),
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Tax optimization recommendations failed:', error)
      throw error
    }
  }

  /**
   * Generate year-end tax planning report
   */
  async generateYearEndTaxReport(portfolio, userProfile) {
    try {
      const currentYear = new Date().getFullYear()
      const taxAnalysis = await this.calculateTaxLiability(portfolio, userProfile)
      const harvestingOpportunities = await this.identifyHarvestingOpportunities(portfolio)

      // Calculate projected tax liability
      const projectedTaxLiability = taxAnalysis.taxes.total

      // Identify year-end opportunities
      const yearEndActions = []

      // Tax loss harvesting before year-end
      if (harvestingOpportunities.immediatelyHarvestable > 0) {
        yearEndActions.push({
          action: 'harvest_tax_losses',
          deadline: `December 31, ${currentYear}`,
          potentialSavings: harvestingOpportunities.totalPotentialSavings,
          description: `Harvest ${harvestingOpportunities.immediatelyHarvestable} losing positions to offset gains`
        })
      }

      // Realize long-term gains if in 0% bracket
      if (this.getCapitalGainsRate(userProfile.annualIncome, userProfile.filingStatus) === 0) {
        const unrealizedGains = portfolio.positions
          .filter(pos => this.getHoldingPeriod(pos) > 365 && (pos.currentValue - pos.costBasis) > 0)
          .reduce((sum, pos) => sum + (pos.currentValue - pos.costBasis), 0)

        if (unrealizedGains > 1000) {
          yearEndActions.push({
            action: 'realize_gains_at_zero_rate',
            deadline: `December 31, ${currentYear}`,
            potentialSavings: 0, // Already at 0% rate
            description: `Realize $${unrealizedGains.toFixed(2)} in long-term gains tax-free`
          })
        }
      }

      // Roth IRA conversions
      if (userProfile.hasTraditionalIRA && taxAnalysis.marginalTaxRate < 22) {
        yearEndActions.push({
          action: 'roth_conversion',
          deadline: `December 31, ${currentYear}`,
          potentialSavings: 'Tax-free growth',
          description: 'Consider Roth IRA conversion while in lower tax bracket'
        })
      }

      // Charitable giving
      if (userProfile.charitableGiving && projectedTaxLiability > 5000) {
        yearEndActions.push({
          action: 'charitable_giving',
          deadline: `December 31, ${currentYear}`,
          potentialSavings: projectedTaxLiability * 0.1, // Estimate 10% reduction
          description: 'Bunch charitable deductions to maximize tax benefit'
        })
      }

      const report = {
        taxYear: currentYear,
        projectedTaxLiability,
        currentTaxSituation: taxAnalysis,
        yearEndActions,
        quarterlyEstimates: this.calculateQuarterlyEstimates(projectedTaxLiability),
        importantDeadlines: [
          { date: `December 31, ${currentYear}`, description: 'Tax loss harvesting deadline' },
          { date: `January 15, ${currentYear + 1}`, description: 'Q4 estimated tax payment due' },
          { date: `April 15, ${currentYear + 1}`, description: 'Tax return filing deadline' }
        ],
        recommendations: await this.generateTaxOptimizationRecommendations(portfolio, userProfile),
        generatedAt: new Date().toISOString()
      }

      // Cache the report
      this.taxReports.set(`${userProfile.userId}_${currentYear}`, report)

      return report
    } catch (error) {
      logger.error('Year-end tax report generation failed:', error)
      throw error
    }
  }

  /**
   * Calculate wash sale violations
   */
  identifyWashSaleViolations(transactions, saleDate, asset) {
    const washSalePeriod = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    const saleTime = new Date(saleDate).getTime()

    const potentialViolations = transactions.filter(tx => {
      const txTime = new Date(tx.timestamp).getTime()
      const timeDifference = Math.abs(txTime - saleTime)
      
      return tx.asset === asset &&
             tx.type === 'buy' &&
             timeDifference <= washSalePeriod &&
             txTime !== saleTime
    })

    return potentialViolations.map(violation => ({
      transactionId: violation.id,
      purchaseDate: violation.timestamp,
      amount: violation.amount,
      daysFromSale: Math.abs(new Date(violation.timestamp).getTime() - saleTime) / (24 * 60 * 60 * 1000),
      violation: true
    }))
  }

  /**
   * Helper methods
   */
  calculateOrdinaryIncomeTax(income, filingStatus) {
    const brackets = TAX_BRACKETS.US_2024[filingStatus] || TAX_BRACKETS.US_2024.single
    let tax = 0
    let remainingIncome = income

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break

      const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min + 1)
      tax += taxableAtThisBracket * bracket.rate
      remainingIncome -= taxableAtThisBracket
    }

    return tax
  }

  calculateCapitalGainsTax(longTermGains, income, filingStatus) {
    const rates = CAPITAL_GAINS_RATES.longTerm[filingStatus] || CAPITAL_GAINS_RATES.longTerm.single
    
    for (const bracket of rates) {
      if (income >= bracket.min && income <= bracket.max) {
        return longTermGains * bracket.rate
      }
    }

    return longTermGains * 0.20 // Default to highest rate
  }

  getMarginalTaxRate(income, filingStatus) {
    const brackets = TAX_BRACKETS.US_2024[filingStatus] || TAX_BRACKETS.US_2024.single
    
    for (const bracket of brackets) {
      if (income >= bracket.min && income <= bracket.max) {
        return bracket.rate
      }
    }

    return 0.37 // Highest bracket
  }

  getCapitalGainsRate(income, filingStatus) {
    const rates = CAPITAL_GAINS_RATES.longTerm[filingStatus] || CAPITAL_GAINS_RATES.longTerm.single
    
    for (const bracket of rates) {
      if (income >= bracket.min && income <= bracket.max) {
        return bracket.rate
      }
    }

    return 0.20
  }

  async analyzePositionTaxImplications(position, taxYear) {
    // Mock implementation - in production would analyze actual transaction history
    const holdingPeriod = this.getHoldingPeriod(position)
    const unrealizedGain = position.currentValue - position.costBasis
    
    return {
      positionId: position.id,
      asset: position.asset,
      costBasis: position.costBasis,
      currentValue: position.currentValue,
      holdingPeriod,
      isLongTerm: holdingPeriod > 365,
      capitalGains: unrealizedGain,
      dividendIncome: position.dividendIncome || 0,
      interestIncome: position.interestIncome || 0
    }
  }

  getHoldingPeriod(position) {
    const purchaseDate = new Date(position.purchaseDate || Date.now() - 200 * 24 * 60 * 60 * 1000)
    const currentDate = new Date()
    return Math.floor((currentDate - purchaseDate) / (24 * 60 * 60 * 1000))
  }

  getDaysSinceLastPurchase(position) {
    // Mock implementation
    return Math.floor(Math.random() * 100) + 10
  }

  async findSimilarAssets(asset) {
    // Mock implementation - would find similar but not substantially identical assets
    const alternatives = {
      'BTC': ['ETH', 'WBTC'],
      'ETH': ['BTC', 'AVAX'],
      'USDC': ['USDT', 'DAI'],
      'SPY': ['VTI', 'SPTM'],
      'QQQ': ['VGT', 'FTEC']
    }

    return alternatives[asset] || ['USDC']
  }

  getHarvestingStrategy(position) {
    if (position.currentValue < position.costBasis * 0.8) {
      return 'IMMEDIATE_HARVEST'
    } else if (position.currentValue < position.costBasis * 0.95) {
      return 'MONITOR_FOR_HARVEST'
    }
    return 'HOLD'
  }

  estimateAssetLocationSavings(portfolio, userProfile) {
    // Estimate savings from optimal asset location
    return userProfile.annualIncome * 0.005 // 0.5% of income estimate
  }

  estimateMunicipalBondSavings(portfolio, userProfile) {
    const fixedIncomeAllocation = portfolio.totalValue * 0.3 // Assume 30% fixed income
    const marginalRate = this.getMarginalTaxRate(userProfile.annualIncome, userProfile.filingStatus)
    return fixedIncomeAllocation * 0.04 * marginalRate // 4% yield * tax rate
  }

  estimateIndexFundSavings(highTurnoverFunds, userProfile) {
    return highTurnoverFunds.reduce((sum, fund) => {
      return sum + (fund.currentValue * 0.01) // 1% annual tax drag estimate
    }, 0)
  }

  getIndexFundReplacement(fund) {
    const replacements = {
      'FSKAX': 'FXAIX', // Fidelity Total Market -> S&P 500
      'VTSAX': 'VTIAX', // Vanguard Total -> International
    }

    return replacements[fund.asset] || 'VTI' // Default to total market
  }

  calculateQuarterlyEstimates(annualTaxLiability) {
    const quarterlyAmount = annualTaxLiability / 4
    
    return [
      { quarter: 'Q1', dueDate: 'April 15', amount: quarterlyAmount },
      { quarter: 'Q2', dueDate: 'June 17', amount: quarterlyAmount },
      { quarter: 'Q3', dueDate: 'September 16', amount: quarterlyAmount },
      { quarter: 'Q4', dueDate: 'January 15', amount: quarterlyAmount }
    ]
  }
}

// Create singleton instance
export const taxOptimizationService = new TaxOptimizationService()
export default taxOptimizationService