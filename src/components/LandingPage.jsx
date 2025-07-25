import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  TrendingUp, 
  Smartphone, 
  DollarSign,
  PieChart,
  Send,
  CreditCard,
  Wallet,
  BookOpen,
  Star,
  Users,
  Globe,
  Lock,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PAGE_SEO_CONFIG, useSEO } from '../utils/seoUtils.js'
import SEOHelmet from './SEOHelmet.jsx'
import diBoaSLogo from '../assets/diboas-logo.png'

// PERFORMANCE: Lazy load large mascot images
const mascotFinancialBasics = new URL('../assets/mascot-financial-basics.png', import.meta.url).href
const mascotInvestmentGuide = new URL('../assets/mascot-investment-guide.png', import.meta.url).href  
const mascotCryptoDefi = new URL('../assets/mascot-crypto-defi.png', import.meta.url).href

export default function LandingPage() {
  const navigationHelper = useNavigate()
  const [isMobileNavigationMenuOpen, setIsMobileNavigationMenuOpen] = useState(false)
  const [activeFinancePlatformTab, setActiveFinancePlatformTab] = useState('traditional')

  // SEO configuration for homepage
  const landingPageSEOConfiguration = PAGE_SEO_CONFIG.home
  useSEO(landingPageSEOConfiguration)

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHelmet
        title={landingPageSEOConfiguration.title}
        description={landingPageSEOConfiguration.description}
        keywords={landingPageSEOConfiguration.keywords}
        structuredData={landingPageSEOConfiguration.structuredData}
        url="https://diboas.com/"
        type="website"
      />
      
      <div className="main-layout">
      {/* Navigation */}
      <nav className="page-header">
        <div className="content-container">
          <div className="main-navigation">
            <div className="flex items-center">
            <div className="flex-shrink-0">
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-10 w-auto" />
              <p className="text-xs text-gray-500">OneFi Platform</p>
            </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  How it Works
                </a>
                <a href="#learn" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Learn
                </a>
                <Button 
                  className="get-started-button"
                  onClick={() => navigationHelper('/auth')}
                >
                  Get Started
                </Button>
              </div>
            </div>
            
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileNavigationMenuOpen(!isMobileNavigationMenuOpen)}
              >
                {isMobileNavigationMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileNavigationMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a href="#features" className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                How it Works
              </a>
              <a href="#learn" className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
                Learn
              </a>
              <Button 
                className="diboas-button w-full mt-2"
                onClick={() => navigationHelper('/auth')}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              Introducing OneFi - Unified Finance
            </Badge>
            
            <h1 className="hero-title">
              Finance as easy as buying{' '}
              <span className="gradient-text">coffee</span>
            </h1>
            
            <p className="hero-subtitle">
              diBoaS unifies Traditional Finance with Decentralized Finance, making investment accessible to everyone. 
              No complexity, no barriers - just simple, secure financial freedom.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="cta-button"
                onClick={() => navigationHelper('/auth')}
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button className="secondary-button" style={{padding: '1rem 2rem', fontSize: '1.125rem'}}>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-page-section--compact bg-white">
        <div className="page-container">
          <div className="stats-grid">
            <div>
              <h3 className="stats-number">5B+</h3>
              <p className="text-lg font-semibold text-gray-900 mb-1">Global FinTech Users</p>
              <p className="text-sm text-gray-600">Worldwide users ready for crypto</p>
            </div>
            <div>
              <h3 className="stats-number">560M</h3>
              <p className="text-lg font-semibold text-gray-900 mb-1">Crypto Users</p>
              <p className="text-sm text-gray-600">Current crypto adoption</p>
            </div>
            <div>
              <h3 className="stats-number">5M</h3>
              <p className="text-lg font-semibold text-gray-900 mb-1">DeFi Users</p>
              <p className="text-sm text-gray-600">Target for expansion</p>
            </div>
            <div>
              <h3 className="stats-number">3</h3>
              <p className="text-lg font-semibold text-gray-900 mb-1">Max Clicks</p>
              <p className="text-sm text-gray-600">Maximum clicks for any action</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transactions Section */}
      <section className="landing-page-section diboas-gradient text-white">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              All Transactions in 1 Click
            </h2>
            <p className="text-xl text-blue-100">
              Experience the simplicity of OneFi. Every financial action is just one click away.
            </p>
          </div>
          
          <div className="transaction-actions-grid">
            {[
              { icon: <Wallet className="w-8 h-8" />, label: 'Deposit', color: 'bg-green-500' },
              { icon: <TrendingUp className="w-8 h-8" />, label: 'Buy', color: 'bg-blue-500' },
              { icon: <DollarSign className="w-8 h-8" />, label: 'Sell', color: 'bg-orange-500' },
              { icon: <Send className="w-8 h-8" />, label: 'Send', color: 'bg-purple-500' },
              { icon: <ArrowRight className="w-8 h-8" />, label: 'Transfer', color: 'bg-cyan-500' },
              { icon: <CreditCard className="w-8 h-8" />, label: 'Withdraw', color: 'bg-red-500' },
              { icon: <PieChart className="w-8 h-8" />, label: 'Invest', color: 'bg-indigo-500' }
            ].map((action) => (
              <Card key={action.label} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${action.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-white">{action.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-page-section bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose diBoaS?
            </h2>
            <p className="text-xl text-gray-600">
              We&apos;re solving the biggest challenges in finance and crypto adoption
            </p>
          </div>
          
          <div className="feature-grid">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="feature-icon blue-gradient">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  1-Click Transactions
                </h3>
                <p className="text-gray-600">
                  Deposit, buy, sell, send, transfer, withdraw, and invest with just one click plus selection and agreement.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="feature-icon purple-gradient">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Unified Finance
                </h3>
                <p className="text-gray-600">
                  Seamlessly bridge Traditional Finance and DeFi in one platform - the OneFi approach.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="feature-icon green-gradient">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Educational Mascots
                </h3>
                <p className="text-gray-600">
                  Learn with friendly mascots that explain complex financial concepts through gamification.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="feature-icon orange-gradient">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Mobile-First Design
                </h3>
                <p className="text-gray-600">
                  Optimized for mobile with intuitive touch interactions and responsive design.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Demo Section */}
      <section id="how-it-works" className="landing-page-section bg-white">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Traditional Finance meets DeFi
            </h2>
            <p className="text-xl text-gray-600">
              Switch seamlessly between traditional and decentralized finance
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg p-1 shadow-sm">
                <Button
                  variant={activeFinancePlatformTab === 'traditional' ? 'default' : 'ghost'}
                  onClick={() => setActiveFinancePlatformTab('traditional')}
                  className={activeFinancePlatformTab === 'traditional' ? 'diboas-button' : ''}
                >
                  Traditional Finance
                </Button>
                <Button
                  variant={activeFinancePlatformTab === 'defi' ? 'default' : 'ghost'}
                  onClick={() => setActiveFinancePlatformTab('defi')}
                  className={activeFinancePlatformTab === 'defi' ? 'diboas-button' : ''}
                >
                  DeFi
                </Button>
              </div>
            </div>
            
            {activeFinancePlatformTab === 'traditional' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Traditional Banking Made Simple
                  </h3>
                  <ul className="space-y-4 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Bank transfers and payments
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Credit and debit card management
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Investment portfolios
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Savings and loans
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Checking Account</span>
                      <span className="font-bold text-green-600">$2,450.00</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Savings Account</span>
                      <span className="font-bold text-green-600">$15,230.50</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Investment Portfolio</span>
                      <span className="font-bold text-green-600">$8,750.25</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeFinancePlatformTab === 'defi' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    DeFi Made Accessible
                  </h3>
                  <ul className="space-y-4 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Yield farming and staking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Decentralized exchanges (DEX)
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Liquidity provision
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Cross-chain transactions
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                      <span className="font-medium">ETH Staking</span>
                      <span className="font-bold text-purple-600">2.5 ETH</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                      <span className="font-medium">LP Tokens</span>
                      <span className="font-bold text-purple-600">$3,420.75</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                      <span className="font-medium">Yield Farming</span>
                      <span className="font-bold text-green-600">+12.5% APY</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="learn" className="landing-page-section bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Learn with Friendly Mascots
            </h2>
            <p className="text-xl text-gray-600">
              Our educational mascots make complex financial concepts fun and easy to understand
            </p>
          </div>
          
          <div className="education-grid">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <img src={mascotFinancialBasics} alt="Financial Basics Mascot" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Financial Basics
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn the fundamentals of personal finance, budgeting, and saving with interactive lessons.
                </p>
                <Button variant="outline" className="w-full">
                  Start Learning
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <img src={mascotInvestmentGuide} alt="Investment Guide Mascot" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Investment Guide
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover investment strategies, risk management, and portfolio diversification techniques.
                </p>
                <Button variant="outline" className="w-full">
                  Explore Investing
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <img src={mascotCryptoDefi} alt="Crypto & DeFi Mascot" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Crypto & DeFi
                </h3>
                <p className="text-gray-600 mb-4">
                  Understand cryptocurrency, blockchain technology, and decentralized finance protocols.
                </p>
                <Button variant="outline" className="w-full">
                  Learn Crypto
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-page-section diboas-gradient text-white">
        <div className="page-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience OneFi?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join millions of users who are already enjoying simplified, unified finance. Start your journey with diBoaS today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
              onClick={() => navigationHelper('/auth')}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white landing-page-section--compact">
        <div className="page-container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-8 w-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Making finance accessible to everyone through the power of OneFi.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Learn</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Education Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Webinars</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 diBoaS. All rights reserved. Making finance accessible to everyone.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}

