import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  ArrowUpDown, 
  TrendingUp, 
  Target,
  ArrowRight
} from 'lucide-react'

// Category Design System
const CATEGORY_DESIGN = {
  banking: {
    primary: '#2563eb',
    light: '#dbeafe',
    border: '#bfdbfe',
    icon: ArrowUpDown,
    gradient: 'from-blue-500 to-blue-600'
  },
  investment: {
    primary: '#059669',
    light: '#d1fae5',
    border: '#a7f3d0',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-emerald-600'
  },
  yield: {
    primary: '#7c3aed',
    light: '#ede9fe',
    border: '#c4b5fd',
    icon: Target,
    gradient: 'from-violet-500 to-violet-600'
  }
}

export default function CategoryCard({ 
  category, 
  title, 
  subtitle, 
  description, 
  highlight, 
  onClick,
  className = '' 
}) {
  const design = CATEGORY_DESIGN[category]
  const IconComponent = design.icon

  return (
    <Card 
      className={`category-card category-card--${category} interactive-card transition-all duration-200 hover:scale-105 cursor-pointer ${className}`}
      onClick={onClick}
      style={{ borderColor: design.border }}
    >
      <CardContent className="category-card__content p-6">
        {/* Header with Icon and Badge */}
        <div className="category-card__header flex items-start justify-between mb-4">
          <div 
            className="category-card__icon p-3 rounded-xl"
            style={{ backgroundColor: design.light }}
          >
            <IconComponent 
              className="w-6 h-6" 
              style={{ color: design.primary }}
            />
          </div>
          
          <Badge 
            className="category-card__badge text-xs px-2 py-1"
            style={{ 
              backgroundColor: design.light,
              color: design.primary,
              border: `1px solid ${design.border}`
            }}
          >
            {subtitle}
          </Badge>
        </div>

        {/* Content */}
        <div className="category-card__main">
          <h3 className="category-card__title text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="category-card__description text-sm text-gray-600 mb-4">
            {description}
          </p>
          
          {/* Highlight Action */}
          <div className="category-card__highlight">
            <Button
              variant="outline"
              size="sm"
              className="category-card__highlight-button w-full justify-between group"
              style={{ 
                borderColor: design.border,
                color: design.primary
              }}
              onClick={(e) => {
                e.stopPropagation()
                onClick?.()
              }}
            >
              <span className="font-medium">{highlight}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Gradient Accent */}
        <div 
          className={`category-card__accent absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${design.gradient} rounded-b-lg`}
        />
      </CardContent>
    </Card>
  )
}