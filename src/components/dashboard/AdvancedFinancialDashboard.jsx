/**
 * Advanced Financial Dashboard
 * Comprehensive financial overview with insights, tax optimization, lending, and portfolio analysis
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dataManager } from '../../services/DataManager.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import logger from '../../utils/logger'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Shield,
  Brain,
  Coins,
  FileText,
  BarChart3,
  Activity,
  Users,
  Percent,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Settings
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

const MOCK_USER_PROFILE = {
  userId: 'demo_user_12345',
  riskTolerance: 'Moderate',
  annualIncome: 85000,
  filingStatus: 'single',
  taxYear: 2024,
  hasRetirementAccounts: true,
  charitableGiving: true
}

export default function AdvancedFinancialDashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  useEffect(() => {
    loadDashboardData()
  }, [selectedTimeframe])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const dashboard = await dataManager.getFinancialDashboard(MOCK_USER_PROFILE)
      setDashboardData(dashboard)
    } catch (error) {
      logger.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-blue-100 text-blue-800 border-blue-200',
      'info': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[priority] || colors.info
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 ml-3">Loading advanced financial dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Financial Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Comprehensive portfolio insights and advanced financial features
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="1y">1 Year</option>
              </select>
              <Button variant="outline" onClick={loadDashboardData}>
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Action Items
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.alerts.map((alert, index) => (
                <Card key={index} className={`border-l-4 ${getPriorityColor(alert.priority)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      <div className="text-xs text-gray-500">{alert.type}</div>
                    </div>
                    <h4 className="font-semibold mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    <p className="text-xs font-medium text-purple-600">{alert.action}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="lending" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Lending
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tax
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Market
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Portfolio Overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboardData?.overview?.totalValue)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Coins className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardData?.overview?.availableBalance)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Invested</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(dashboardData?.overview?.investedAmount)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Strategies</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(dashboardData?.overview?.strategyBalance)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Yield Overview */}
                {dashboardData?.overview?.yieldData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Percent className="w-5 h-5" />
                        Yield Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Active Strategies</p>
                          <p className="text-xl font-bold text-purple-600">
                            {dashboardData.overview.yieldData.activeStrategies}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Earning</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(dashboardData.overview.yieldData.totalEarning)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Avg APY</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatPercentage(dashboardData.overview.yieldData.avgAPY)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Goals Progress</p>
                          <p className="text-xl font-bold text-orange-600">
                            {formatPercentage(dashboardData.overview.yieldData.goalsProgress)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Portfolio Health */}
              <div className="space-y-6">
                {dashboardData?.insights?.health && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Portfolio Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className={`text-4xl font-bold mb-2 ${getHealthColor(dashboardData.insights.health.overallScore)}`}>
                          {dashboardData.insights.health.overallScore}
                        </div>
                        <p className="text-lg font-semibold text-gray-700">
                          {dashboardData.insights.health.healthLevel}
                        </p>
                        <Progress 
                          value={dashboardData.insights.health.overallScore} 
                          className="mt-4"
                        />
                      </div>
                      
                      {dashboardData.insights.health.metrics && (
                        <div className="space-y-2">
                          {Object.entries(dashboardData.insights.health.metrics).map(([metric, score]) => (
                            <div key={metric} className="flex justify-between items-center">
                              <span className="text-sm capitalize">{metric.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className={`font-semibold ${getHealthColor(score)}`}>
                                {score}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/yield/configure')}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Create New Strategy
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('lending')}
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Explore Lending
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('tax')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Tax Optimization
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('insights')}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      View All Insights
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            {dashboardData?.insights?.portfolio?.insights ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Portfolio Insights</h2>
                  <Badge className="bg-blue-100 text-blue-800">
                    {dashboardData.insights.portfolio.insights.length} Insights
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboardData.insights.portfolio.insights.map((insight, index) => (
                    <Card key={index} className="border-l-4 border-purple-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <CardDescription>{insight.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{insight.description}</p>
                        {insight.impact && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm text-gray-600">Impact:</span>
                            <span className="font-semibold">
                              {typeof insight.impact === 'number' 
                                ? formatPercentage(insight.impact)
                                : insight.impact
                              }
                            </span>
                          </div>
                        )}
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-purple-800">
                            💡 {insight.recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Generating insights...</p>
              </div>
            )}
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization">
            <div className="space-y-8">
              {/* Rebalancing Recommendations */}
              {dashboardData?.optimization?.rebalancing?.needsRebalancing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Portfolio Rebalancing
                    </CardTitle>
                    <CardDescription>
                      Recommended adjustments to optimize your portfolio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.optimization.rebalancing.actions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{action.asset}</p>
                            <p className="text-sm text-gray-600">
                              {action.action} by {formatCurrency(action.valueDifference)}
                            </p>
                          </div>
                          <Badge className={action.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {action.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Automation Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Automation Opportunities
                  </CardTitle>
                  <CardDescription>
                    Set up automated strategies to optimize your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold mb-2">Scheduled Deposits</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Automate monthly contributions to your strategies
                      </p>
                      <Button size="sm" variant="outline">
                        Set Up Automation
                      </Button>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold mb-2">Rebalancing</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Automatically rebalance when allocation drifts
                      </p>
                      <Button size="sm" variant="outline">
                        Enable Auto-Rebalance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lending Tab */}
          <TabsContent value="lending">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Lending Opportunities</h2>
                <Button onClick={() => navigate('/lending/pools')}>
                  <Coins className="w-4 h-4 mr-2" />
                  Explore All Pools
                </Button>
              </div>

              {dashboardData?.opportunities?.lending?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.opportunities.lending.slice(0, 6).map((pool) => (
                    <Card key={pool.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{pool.name}</span>
                          <Badge className={pool.riskLevel === 'low' ? 'bg-green-100 text-green-800' : 
                                         pool.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-red-100 text-red-800'}>
                            {pool.riskLevel}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{pool.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Target APY:</span>
                            <span className="font-semibold text-green-600">
                              {formatPercentage(pool.targetAPY)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Liquidity:</span>
                            <span className="font-semibold">
                              {formatCurrency(pool.totalLiquidity)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Utilization:</span>
                            <span className="font-semibold">
                              {((pool.utilizedLiquidity / pool.totalLiquidity) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={(pool.utilizedLiquidity / pool.totalLiquidity) * 100} 
                            className="h-2"
                          />
                          <div className="pt-2">
                            <Button className="w-full" size="sm">
                              {pool.id === 'flash_loans' ? 'Execute Flash Loan' : 'Provide Liquidity'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">Loading lending opportunities...</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tax Tab */}
          <TabsContent value="tax">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Tax Optimization</h2>
                <Button onClick={() => navigate('/tax/report')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Full Report
                </Button>
              </div>

              {dashboardData?.optimization?.tax ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Tax Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Optimization Recommendations</CardTitle>
                      <CardDescription>
                        Potential tax savings: {formatCurrency(dashboardData.optimization.tax.totalPotentialSavings)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.optimization.tax.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                            <p className="text-sm font-medium text-green-600">
                              Potential Savings: {formatCurrency(rec.potentialSavings)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tax Loss Harvesting */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tax Loss Harvesting</CardTitle>
                      <CardDescription>
                        Opportunities to offset capital gains
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboardData.optimization.tax.harvestingOpportunities ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-gray-600">Total Opportunities</p>
                              <p className="text-2xl font-bold text-red-600">
                                {dashboardData.optimization.tax.harvestingOpportunities.totalOpportunities}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-600">Potential Savings</p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(dashboardData.optimization.tax.harvestingOpportunities.totalPotentialSavings)}
                              </p>
                            </div>
                          </div>
                          <Button className="w-full">
                            Review Harvesting Opportunities
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="text-gray-600">No harvesting opportunities found</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">Loading tax optimization data...</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Market Tab */}
          <TabsContent value="market">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold">Market Intelligence</h2>

              {dashboardData?.insights?.market && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Market Conditions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Market Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold mb-2 capitalize">
                          {dashboardData.insights.market.condition}
                        </div>
                        <p className="text-gray-600 mb-4">
                          {dashboardData.insights.market.description}
                        </p>
                        <Progress 
                          value={dashboardData.insights.market.confidence * 100} 
                          className="h-3"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Confidence: {(dashboardData.insights.market.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Indicators */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(dashboardData.insights.market.indicators).map(([key, indicator]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{indicator.name}</p>
                              <p className="text-sm text-gray-600">{indicator.interpretation}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {typeof indicator.value === 'number' 
                                  ? indicator.value.toFixed(2)
                                  : indicator.value
                                }
                              </p>
                              <div className="flex items-center gap-1">
                                {indicator.trend === 'increasing' ? (
                                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-xs text-gray-500">{indicator.trend}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Last updated: {dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated).toLocaleString() : 'Loading...'}</p>
          <p className="mt-1">Data powered by advanced financial analytics and AI insights</p>
        </div>
      </div>
    </div>
  )
}