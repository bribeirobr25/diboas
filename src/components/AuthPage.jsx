import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { 
  ArrowLeft, 
  Mail, 
  Chrome, 
  Twitter, 
  Apple,
  Wallet,
  Shield,
  Zap,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import diBoaSLogo from '../assets/diboas-logo.png'

export default function AuthPage() {
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(true)
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [currentProcessingStep, setCurrentProcessingStep] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')

  const processEmailAuthentication = async (e) => {
    e.preventDefault()
    setIsProcessingAuth(true)
    
    // Simulate registration process
    if (isRegistering) {
      setCurrentProcessingStep('Creating diBoaS account...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setCurrentProcessingStep('Setting up your wallet...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setCurrentProcessingStep('Finalizing setup...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    } else {
      setCurrentProcessingStep('Signing you in...')
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    setIsProcessingAuth(false)
    navigate('/app')
  }

  const connectWithSocialProvider = async (providerName) => {
    setIsProcessingAuth(true)
    setCurrentProcessingStep(`Connecting with ${providerName}...`)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (isRegistering) {
      setCurrentProcessingStep('Creating diBoaS account...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setCurrentProcessingStep('Setting up your wallet...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    setIsProcessingAuth(false)
    navigate('/app')
  }

  const connectCryptoWallet = async (walletName) => {
    setIsProcessingAuth(true)
    setCurrentProcessingStep(`Connecting ${walletName} wallet...`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (isRegistering) {
      setCurrentProcessingStep('Creating diBoaS account...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setCurrentProcessingStep('Linking your wallet...')
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    setIsProcessingAuth(false)
    navigate('/app')
  }

  if (isProcessingAuth) {
    return (
      <div className="main-layout center-content" style={{padding: '1rem'}}>
        <Card className="main-card" style={{width: '100%', maxWidth: '28rem'}}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
            </div>
            
            <div className="mb-6">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentProcessingStep}
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we set everything up for you...
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Secure connection established
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Encrypting your data
              </div>
              {isRegistering && (
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Preparing your OneFi experience
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="main-layout center-content" style={{padding: '1rem'}}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 md:top-8 md:left-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="page-title">
            {isRegistering ? 'Join diBoaS' : 'Welcome back'}
          </h1>
          <p className="hero-subtitle" style={{fontSize: '1rem', marginBottom: '1rem'}}>
            {isRegistering 
              ? 'Start your OneFi journey in seconds' 
              : 'Sign in to your OneFi account'
            }
          </p>
        </div>

        <Card className="main-card">
          <CardContent className="p-6">
            {/* OAuth Options */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => connectWithSocialProvider('Google')}
              >
                <Chrome className="w-5 h-5 mr-3 text-blue-600" />
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => connectWithSocialProvider('Apple')}
              >
                <Apple className="w-5 h-5 mr-3 text-gray-800" />
                Continue with Apple
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => connectWithSocialProvider('X')}
              >
                <Twitter className="w-5 h-5 mr-3 text-blue-400" />
                Continue with X
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Crypto Wallet Options */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Wallet className="w-4 h-4 mr-2" />
                Connect with Crypto Wallet
              </h3>
              
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => connectCryptoWallet('MetaMask')}
              >
                <div className="w-5 h-5 mr-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                MetaMask
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => connectCryptoWallet('Phantom')}
              >
                <div className="w-5 h-5 mr-3 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                Phantom
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Email Form */}
            <form onSubmit={processEmailAuthentication} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              
              <Button type="submit" className="sign-in-button">
                <Mail className="w-4 h-4 mr-2" />
                {isRegistering ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Toggle Sign Up/Sign In */}
            <div className="text-center mt-6">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {isRegistering 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            Bank-level security
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Zap className="w-4 h-4 mr-2 text-blue-500" />
            Setup takes less than 30 seconds
          </div>
        </div>
      </div>
    </div>
  )
}

