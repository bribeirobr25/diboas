/**
 * Examples of how to use Feature Flags in diBoaS components
 * These examples show different patterns for feature flag usage
 */

import { useFeatureFlag, useFeatureFlags, useABTest } from '../../hooks/useFeatureFlags.js'
import { FEATURE_FLAGS } from '../../config/featureFlags.js'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Wallet, TrendingUp, Palette, Bot } from 'lucide-react'

/**
 * Example 1: Simple boolean feature flag
 */
export function CryptoWalletExample() {
  const isCryptoEnabled = useFeatureFlag(FEATURE_FLAGS.CRYPTO_WALLET_INTEGRATION)

  if (!isCryptoEnabled) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-4 text-center">
          <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Crypto wallets coming soon!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
          <Badge variant="secondary" className="text-xs">New</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button className="w-full">Connect MetaMask</Button>
          <Button className="w-full" variant="outline">Connect Phantom</Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Example 2: Multiple feature flags at once
 */
export function DashboardFeatures() {
  const features = useFeatureFlags([
    FEATURE_FLAGS.NEW_DASHBOARD_DESIGN,
    FEATURE_FLAGS.AI_FINANCIAL_ADVISOR,
    FEATURE_FLAGS.DARK_MODE,
    FEATURE_FLAGS.DEFI_INVESTMENTS
  ])

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Available Features</h3>
      
      {features[FEATURE_FLAGS.NEW_DASHBOARD_DESIGN] && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium">Enhanced Dashboard</h4>
                <p className="text-sm text-gray-600">New improved layout and analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {features[FEATURE_FLAGS.AI_FINANCIAL_ADVISOR] && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Bot className="w-5 h-5 text-purple-600" />
              <div>
                <h4 className="font-medium">AI Financial Advisor</h4>
                <p className="text-sm text-gray-600">Get personalized investment advice</p>
              </div>
              <Badge variant="secondary">Beta</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {features[FEATURE_FLAGS.DARK_MODE] && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="font-medium">Dark Mode</h4>
                <p className="text-sm text-gray-600">Switch to dark theme</p>
              </div>
              <Button size="sm" variant="outline">Toggle</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {features[FEATURE_FLAGS.DEFI_INVESTMENTS] && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">DeFi Investments</h4>
                <p className="text-sm text-gray-600">Access to yield farming and liquidity pools</p>
              </div>
              <Badge variant="default">Premium</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Example 3: A/B Testing usage
 */
export function TradingInterfaceExample() {
  const abTest = useABTest(FEATURE_FLAGS.HIGH_FREQUENCY_TRADING)

  if (!abTest.isInTest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Basic Trading</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Standard trading interface</p>
          <Button className="mt-3">Start Trading</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Advanced Trading</span>
          <Badge variant="outline">Variant {abTest.variant}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Enhanced trading with {abTest.features.join(', ')}
          </p>
          
          {abTest.features.includes('advanced_charts') && (
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm font-medium text-blue-800">Advanced Charts Available</p>
            </div>
          )}
          
          {abTest.features.includes('ai_recommendations') && (
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-sm font-medium text-purple-800">AI Trading Recommendations</p>
            </div>
          )}
          
          <Button className="w-full">Start Advanced Trading</Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Example 4: Conditional rendering with fallback
 */
export function ConditionalFeatureExample() {
  const isAdvancedAnalyticsEnabled = useFeatureFlag(FEATURE_FLAGS.ADVANCED_ANALYTICS)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        {isAdvancedAnalyticsEnabled ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+12.5%</div>\n                <div className="text-sm text-gray-600">Portfolio Growth</div>\n              </div>\n              <div className="text-center">\n                <div className="text-2xl font-bold text-blue-600">94</div>\n                <div className="text-sm text-gray-600">Trade Score</div>\n              </div>\n              <div className="text-center">\n                <div className="text-2xl font-bold text-purple-600">A+</div>\n                <div className="text-sm text-gray-600">Risk Rating</div>\n              </div>\n            </div>\n            <Button className="w-full">View Detailed Analytics</Button>\n          </div>\n        ) : (\n          <div className="text-center py-6">\n            <p className="text-sm text-gray-600 mb-3">\n              Basic analytics available. Upgrade for advanced insights.\n            </p>\n            <Button variant="outline">Upgrade to Premium</Button>\n          </div>\n        )}\n      </CardContent>\n    </Card>\n  )\n}\n\n/**\n * Example 5: Regional feature differences\n */\nexport function RegionalFeaturesExample() {\n  const features = useFeatureFlags([\n    FEATURE_FLAGS.SOCIAL_LOGIN_PROVIDERS,\n    FEATURE_FLAGS.DEFI_INVESTMENTS,\n    FEATURE_FLAGS.AI_FINANCIAL_ADVISOR\n  ])\n\n  return (\n    <Card>\n      <CardHeader>\n        <CardTitle>Available in Your Region</CardTitle>\n      </CardHeader>\n      <CardContent>\n        <div className="space-y-2">\n          <div className="flex items-center justify-between">\n            <span className="text-sm">Social Login (Apple, Google)</span>\n            <Badge variant={features[FEATURE_FLAGS.SOCIAL_LOGIN_PROVIDERS] ? "default" : "secondary"}>\n              {features[FEATURE_FLAGS.SOCIAL_LOGIN_PROVIDERS] ? "Available" : "Coming Soon"}\n            </Badge>\n          </div>\n          \n          <div className="flex items-center justify-between">\n            <span className="text-sm">DeFi Investments</span>\n            <Badge variant={features[FEATURE_FLAGS.DEFI_INVESTMENTS] ? "default" : "secondary"}>\n              {features[FEATURE_FLAGS.DEFI_INVESTMENTS] ? "Available" : "Restricted"}\n            </Badge>\n          </div>\n          \n          <div className="flex items-center justify-between">\n            <span className="text-sm">AI Financial Advisor</span>\n            <Badge variant={features[FEATURE_FLAGS.AI_FINANCIAL_ADVISOR] ? "default" : "secondary"}>\n              {features[FEATURE_FLAGS.AI_FINANCIAL_ADVISOR] ? "Beta Access" : "Not Available"}\n            </Badge>\n          </div>\n        </div>\n      </CardContent>\n    </Card>\n  )\n}\n\n/**\n * Example 6: Kill switch demonstration\n */\nexport function EmergencyFeaturesExample() {\n  const isTradingDisabled = useFeatureFlag(FEATURE_FLAGS.DISABLE_TRADING)\n  const isWithdrawalsDisabled = useFeatureFlag(FEATURE_FLAGS.DISABLE_WITHDRAWALS)\n\n  if (isTradingDisabled || isWithdrawalsDisabled) {\n    return (\n      <Card className="border-red-200 bg-red-50">\n        <CardContent className="p-4">\n          <div className="text-center">\n            <h4 className="font-medium text-red-800 mb-2">Service Notice</h4>\n            <div className="space-y-1 text-sm text-red-700">\n              {isTradingDisabled && <p>Trading is temporarily disabled</p>}\n              {isWithdrawalsDisabled && <p>Withdrawals are temporarily disabled</p>}\n            </div>\n            <p className="text-xs text-red-600 mt-2">\n              We'll restore service as soon as possible\n            </p>\n          </div>\n        </CardContent>\n      </Card>\n    )\n  }\n\n  return (\n    <Card>\n      <CardContent className="p-4">\n        <div className="text-center">\n          <h4 className="font-medium text-green-800 mb-2">All Systems Operational</h4>\n          <p className="text-sm text-green-700">Trading and withdrawals are available</p>\n          <div className="mt-3 space-x-2">\n            <Button size="sm">Trade Now</Button>\n            <Button size="sm" variant="outline">Withdraw Funds</Button>\n          </div>\n        </div>\n      </CardContent>\n    </Card>\n  )\n}