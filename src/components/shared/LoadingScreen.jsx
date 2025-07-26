import { Card, CardContent } from '@/components/ui/card.jsx'
import { Loader2, CheckCircle } from 'lucide-react'
import diBoaSLogo from '../../assets/diboas-logo.png'

/**
 * Reusable loading screen component
 * Eliminates loading state duplication across components
 */
export default function LoadingScreen({ 
  currentStep = 'Loading...', 
  isRegistering = false,
  // _completedSteps = []
}) {
  const defaultSteps = [
    'Secure connection established',
    'Encrypting your data'
  ]

  const registrationStep = 'Preparing your OneFi experience'

  const allSteps = isRegistering 
    ? [...defaultSteps, registrationStep]
    : defaultSteps

  return (
    <div className="main-layout center-content" style={{padding: '1rem'}}>
      <Card className="main-card" style={{width: '100%', maxWidth: '28rem'}}>
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
          </div>
          
          <div className="mb-6">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="section-title">
              {currentStep}
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we set everything up for you...
            </p>
          </div>
          
          <div className="space-y-2">
            {allSteps.map((step, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                {step}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}