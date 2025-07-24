import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Search, QrCode, Copy, Clock, Wallet } from 'lucide-react'
import { 
  getRecentWalletAddresses, 
  saveRecentWalletAddress,
  detectAddressNetwork
} from '../../utils/walletAddressDatabase.js'

export default function WalletAddressInput({
  value,
  onChange,
  className,
  validationErrors
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [recentAddresses, setRecentAddresses] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [detectedNetwork, setDetectedNetwork] = useState(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Load recent addresses on component mount
  useEffect(() => {
    setRecentAddresses(getRecentWalletAddresses())
  }, [])

  // Detect network when value changes
  useEffect(() => {
    const network = detectAddressNetwork(value)
    setDetectedNetwork(network)
  }, [value])

  // Generate suggestions based on input
  const generateSuggestions = useCallback(async (input) => {
    // Only show recent addresses - no search functionality
    return recentAddresses.map(item => ({ ...item, isRecent: true }))
  }, [recentAddresses])

  // Handle input change
  const handleInputChange = async (e) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Only show suggestions if input is empty (recent addresses)
    if (!newValue) {
      const newSuggestions = await generateSuggestions(newValue)
      setSuggestions(newSuggestions)
      setIsOpen(true)
      setHighlightedIndex(-1)
    } else {
      setIsOpen(false)
    }
  }

  // Handle input focus
  const handleFocus = async () => {
    // Only show recent addresses when focusing on empty field
    if (!value) {
      const suggestions = await generateSuggestions(value)
      setSuggestions(suggestions)
      setIsOpen(true)
      setHighlightedIndex(-1)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (address) => {
    onChange(address)
    saveRecentWalletAddress(address)
    setRecentAddresses(getRecentWalletAddresses()) // Refresh recent addresses
    setIsOpen(false)
    setHighlightedIndex(-1)
  }


  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[highlightedIndex].address)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get network badge color
  const getNetworkBadgeColor = (network) => {
    const colors = {
      'BTC': 'bg-orange-100 text-orange-700 border-orange-200',
      'ETH': 'bg-blue-100 text-blue-700 border-blue-200', 
      'SOL': 'bg-purple-100 text-purple-700 border-purple-200',
      'SUI': 'bg-cyan-100 text-cyan-700 border-cyan-200'
    }
    return colors[network] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="relative">
      <div className="recipient-input-container">
        <Input
          ref={inputRef}
          id="recipient"
          name="recipient"
          placeholder="Enter wallet address"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`pl-10 pr-16 font-mono ${validationErrors?.recipient ? 'border-red-500 focus:border-red-500' : ''} ${className || ''}`}
        />
        <Search className="search-icon" />
        
        {/* Network Detection Badge */}
        {detectedNetwork && value && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <Badge 
              variant="outline" 
              className={`text-xs px-2 py-1 ${getNetworkBadgeColor(detectedNetwork)}`}
            >
              {detectedNetwork}
            </Badge>
          </div>
        )}
        
        <div className="input-actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {/* QR Code scanner logic */}}
          >
            <QrCode className="h-4 w-4" />
          </Button>
          <Button
            type="button" 
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {/* Paste from clipboard logic */}}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {/* Recent Addresses Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Header section */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              Recent Addresses
            </div>
          </div>

          {/* Recent addresses list */}
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.address}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion.address)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <Wallet className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium truncate">
                      {suggestion.displayAddress || suggestion.address}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  {suggestion.network && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0.5 ${getNetworkBadgeColor(suggestion.network)}`}
                    >
                      {suggestion.network}
                    </Badge>
                  )}
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Validation Error */}
      {validationErrors?.recipient && (
        <p className="text-sm text-red-600 mt-1">
          {validationErrors.recipient.message}
        </p>
      )}
    </div>
  )
}