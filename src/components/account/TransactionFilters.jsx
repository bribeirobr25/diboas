/**
 * Transaction Filters Component
 * Provides comprehensive filtering for transaction history
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter
} from 'lucide-react'

// Primary filter categories
const FILTER_CATEGORIES = {
  all: {
    id: 'all',
    label: 'All',
    icon: null,
    color: 'bg-gray-100 text-gray-800'
  },
  banking: {
    id: 'banking',
    label: 'Banking',
    icon: ArrowUpCircle,
    color: 'bg-blue-100 text-blue-800'
  },
  investment: {
    id: 'investment',
    label: 'Investment',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-800'
  },
  yield: {
    id: 'yield',
    label: 'Yield',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-800'
  }
}

// Time periods
const TIME_PERIODS = {
  week: {
    id: 'week',
    label: 'Last Week',
    days: 7
  },
  month: {
    id: 'month',
    label: 'Last Month',
    days: 30
  },
  three_months: {
    id: 'three_months',
    label: 'Last 3 Months',
    days: 90
  },
  six_months: {
    id: 'six_months',
    label: 'Last 6 Months',
    days: 180
  },
  all_time: {
    id: 'all_time',
    label: 'All Time',
    days: null
  }
}

// Secondary filters
const SECONDARY_FILTERS = {
  banking: {
    all: { id: 'all', label: 'All', icon: null },
    in: { id: 'in', label: 'Money In', icon: ArrowDownCircle, types: ['add', 'receive'] },
    out: { id: 'out', label: 'Money Out', icon: ArrowUpCircle, types: ['send', 'withdraw'] }
  },
  investment: {
    all: { id: 'all', label: 'All', icon: null },
    buy: { id: 'buy', label: 'Buy', icon: TrendingUp, types: ['buy'] },
    sell: { id: 'sell', label: 'Sell', icon: TrendingDown, types: ['sell'] }
  },
  yield: {
    all: { id: 'all', label: 'All', icon: null },
    stake: { id: 'stake', label: 'Stake', icon: TrendingUp, types: ['stake', 'yield'] },
    unstake: { id: 'unstake', label: 'Unstake', icon: TrendingDown, types: ['unstake'] }
  }
}

export default function TransactionFilters({ onFiltersChange, transactions = [] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('all_time')
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters()
  }, [searchQuery, selectedCategory, selectedPeriod, selectedSecondaryFilter, transactions])

  const applyFilters = () => {
    let filtered = [...transactions]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(query) ||
        tx.type?.toLowerCase().includes(query) ||
        tx.asset?.toLowerCase().includes(query) ||
        tx.txHash?.toLowerCase().includes(query) ||
        tx.amount?.toString().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === selectedCategory)
    }

    // Apply time period filter
    if (selectedPeriod !== 'all_time') {
      const period = TIME_PERIODS[selectedPeriod]
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - period.days)
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.createdAt)
        return txDate >= cutoffDate
      })
    }

    // Apply secondary filter
    if (selectedSecondaryFilter !== 'all' && selectedCategory !== 'all') {
      const secondaryFilter = SECONDARY_FILTERS[selectedCategory]?.[selectedSecondaryFilter]
      if (secondaryFilter?.types) {
        filtered = filtered.filter(tx => secondaryFilter.types.includes(tx.type))
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Notify parent component
    onFiltersChange({
      filtered,
      filters: {
        searchQuery,
        category: selectedCategory,
        period: selectedPeriod,
        secondaryFilter: selectedSecondaryFilter
      }
    })
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedSecondaryFilter('all') // Reset secondary filter when category changes
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedPeriod('all_time')
    setSelectedSecondaryFilter('all')
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (searchQuery) count++
    if (selectedCategory !== 'all') count++
    if (selectedPeriod !== 'all_time') count++
    if (selectedSecondaryFilter !== 'all') count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="transaction-filters space-y-4">
      {/* Search and primary controls */}
      <div className="transaction-filters__primary flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="transaction-filters__search flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="transaction-filters__toggle flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="transaction-filters__advanced space-y-4 p-4 border rounded-lg bg-gray-50">
          {/* Category Filter */}
          <div className="transaction-filters__category">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(FILTER_CATEGORIES).map((category) => {
                const IconComponent = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`transaction-filters__category-btn ${
                      selectedCategory === category.id ? '' : 'hover:bg-gray-100'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
                    {category.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Time Period Filter */}
          <div className="transaction-filters__period">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Time Period
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(TIME_PERIODS).map((period) => (
                <Button
                  key={period.id}
                  variant={selectedPeriod === period.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`transaction-filters__period-btn ${
                    selectedPeriod === period.id ? '' : 'hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Secondary Filters (shown when category is selected) */}
          {selectedCategory !== 'all' && SECONDARY_FILTERS[selectedCategory] && (
            <div className="transaction-filters__secondary">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(SECONDARY_FILTERS[selectedCategory]).map((filter) => {
                  const IconComponent = filter.icon
                  return (
                    <Button
                      key={filter.id}
                      variant={selectedSecondaryFilter === filter.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSecondaryFilter(filter.id)}
                      className={`transaction-filters__secondary-btn ${
                        selectedSecondaryFilter === filter.id ? '' : 'hover:bg-gray-100'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
                      {filter.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="transaction-filters__clear flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export filter configurations for use in other components
export { FILTER_CATEGORIES, TIME_PERIODS, SECONDARY_FILTERS }