import { useNavigate } from 'react-router-dom'
import { useFeatureFlag } from '../../config/featureFlags.js'
import CategoryCard from './CategoryCard.jsx'

// Category Configuration
const CATEGORIES = {
  banking: {
    id: 'banking',
    title: 'In/Out',
    subtitle: 'Banking',
    description: 'Move money in and out of your diBoaS wallet',
    highlight: 'Add Money',
    route: '/category/banking'
  },
  investment: {
    id: 'investment',
    title: 'Buy/Sell',
    subtitle: 'Invest',
    description: 'Build your portfolio with crypto and tokenized assets',
    highlight: 'Crypto',
    route: '/category/investment'
  },
  yield: {
    id: 'yield',
    title: 'FinObjective',
    subtitle: 'Yield',
    description: 'Grow your wealth with goal-driven DeFi strategies',
    highlight: 'Emergency Fund',
    route: '/category/yield'
  }
}

export default function CategoryDashboard({ className = '' }) {
  const navigate = useNavigate()
  const isCategoriesEnabled = useFeatureFlag('CATEGORIES_NAVIGATION')

  const handleCategoryClick = (category) => {
    const categoryConfig = CATEGORIES[category.id]
    navigate(categoryConfig.route)
  }

  // Feature flag fallback - if categories disabled, don't render
  if (!isCategoriesEnabled) {
    return null
  }

  return (
    <section className={`category-dashboard ${className}`}>
      {/* Section Header */}
      <div className="category-dashboard__header mb-6">
        <h2 className="category-dashboard__title text-2xl font-bold text-gray-900 mb-2">
          What would you like to do?
        </h2>
        <p className="category-dashboard__description text-gray-600">
          Choose a category to get started with your financial journey
        </p>
      </div>

      {/* Category Grid - Side by side on desktop */}
      <div className="category-dashboard__grid desktop-categories-horizontal grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.values(CATEGORIES).map((category) => (
          <CategoryCard
            key={category.id}
            category={category.id}
            title={category.title}
            subtitle={category.subtitle}
            description={category.description}
            highlight={category.highlight}
            onClick={() => handleCategoryClick(category)}
            className="category-dashboard__card"
          />
        ))}
      </div>

      {/* Helper Text */}
      <div className="category-dashboard__footer mt-6 text-center">
        <p className="text-sm text-gray-500">
          New to diBoaS? Start with <span className="font-medium text-blue-600">In/Out</span> to add money to your wallet
        </p>
      </div>
    </section>
  )
}

// Export category configuration for use in other components
export { CATEGORIES }