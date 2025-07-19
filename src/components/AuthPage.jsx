import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
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
  Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import diBoaSLogo from '../assets/diboas-logo.png'
import { useAuthentication } from '../hooks/useAuthentication.js'
import LoadingScreen from './shared/LoadingScreen.jsx'
import ErrorAlert from './shared/ErrorAlert.jsx'

export default function AuthPage() {
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  
  const {
    isProcessingAuth,
    currentProcessingStep,
    authError,
    processEmailAuthentication: processAuth,
    connectWithSocialProvider,
    connectCryptoWallet,
    clearError,
    retryAuthentication
  } = useAuthentication()

  const processEmailAuthentication = async (e) => {
    e.preventDefault()
    clearError() // Clear any previous errors
    await processAuth(userEmail, userPassword, isRegistering)
  }
  
  const handleProviderAuth = async (providerName) => {
    clearError()
    await connectWithSocialProvider(providerName, isRegistering)
  }
  
  const handleWalletAuth = async (walletName) => {
    clearError()
    await connectCryptoWallet(walletName, isRegistering)
  }

  if (isProcessingAuth) {
    return (
      <LoadingScreen 
        currentStep={currentProcessingStep}
        isRegistering={isRegistering}
      />
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

        {/* Error Display */}
        {authError && (
          <ErrorAlert 
            error={authError}
            onRetry={retryAuthentication}
            onDismiss={clearError}
            className="mb-6"
          />
        )}

        <Card className="main-card">
          <CardContent className="p-6">
            {/* OAuth Options */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => handleProviderAuth('Google')}
                disabled={isProcessingAuth}
              >
                <Chrome className="w-5 h-5 mr-3 text-blue-600" />
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => handleProviderAuth('Apple')}
                disabled={isProcessingAuth}
              >
                <Apple className="w-5 h-5 mr-3 text-gray-800" />
                Continue with Apple
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => handleProviderAuth('X')}
                disabled={isProcessingAuth}
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
                onClick={() => handleWalletAuth('MetaMask')}
                disabled={isProcessingAuth}
              >
                <div className="w-5 h-5 mr-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                MetaMask
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 text-left justify-start"
                onClick={() => handleWalletAuth('Phantom')}
                disabled={isProcessingAuth}
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
              
              <Button 
                type="submit" 
                className="sign-in-button"
                disabled={isProcessingAuth || !userEmail.trim() || !userPassword.trim()}
              >
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

