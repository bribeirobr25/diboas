import { Button } from '@/components/ui/button.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'
import { Bell, Settings, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import diBoaSLogo from '../../assets/diboas-logo.png'

/**
 * Reusable header component for app pages
 * Eliminates header duplication across components
 */
export default function PageHeader({ 
  showBackButton = false, 
  backTo = '/',
  showUserActions = false,
  title = null
}) {
  const navigate = useNavigate()

  return (
    <header className="page-header">
      <div className="content-container">
        <div className="main-navigation">
          <div className="header-navigation-section">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backTo)}
                className="ghost-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <img src={diBoaSLogo} alt="diBoaS Logo" className="h-8 w-auto" />
            {title && <h1 className="section-title">{title}</h1>}
          </div>
          
          {showUserActions && (
            <div className="header-actions-section">
              <Button variant="ghost" size="sm" className="ghost-button">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="ghost-button">
                <Settings className="w-5 h-5" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}