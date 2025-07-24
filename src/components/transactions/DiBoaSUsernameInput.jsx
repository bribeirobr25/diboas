import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Search, QrCode, Copy, Clock, User } from 'lucide-react'
import { searchUsernames, getRecentUsernames, saveRecentUsername } from '../../utils/userDatabase.js'

export default function DiBoaSUsernameInput({
  value,
  onChange,
  className,
  validationErrors
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [recentUsernames, setRecentUsernames] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Load recent usernames on component mount
  useEffect(() => {
    setRecentUsernames(getRecentUsernames())
  }, [])

  // Generate suggestions based on input
  const generateSuggestions = useCallback(async (input) => {
    if (!input || input === '@') {
      // Show recent usernames when no input or just '@'
      return recentUsernames.map(username => ({ username, isRecent: true }))
    }

    const searchTerm = input.startsWith('@') ? input.slice(1) : input
    
    try {
      setIsLoading(true)
      // Search for matching users
      const matchingUsers = await searchUsernames(searchTerm, 5)
      return matchingUsers.map(username => ({ 
        username, 
        isRecent: recentUsernames.includes(username) 
      }))
    } catch (error) {
      console.error('Error searching usernames:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [recentUsernames])

  // Handle input change
  const handleInputChange = async (e) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Generate suggestions and open dropdown
    const newSuggestions = await generateSuggestions(newValue)
    setSuggestions(newSuggestions)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  // Handle input focus
  const handleFocus = async () => {
    const suggestions = await generateSuggestions(value)
    setSuggestions(suggestions)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (username) => {
    const formattedUsername = `@${username}`
    onChange(formattedUsername)
    saveRecentUsername(formattedUsername)
    setRecentUsernames(getRecentUsernames()) // Refresh recent usernames
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
          handleSuggestionSelect(suggestions[highlightedIndex].username)
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

  return (
    <div className="relative">
      <div className="recipient-input-container">
        <Input
          ref={inputRef}
          id="recipient"
          name="recipient"
          placeholder="Enter @username (e.g., @john123)"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`pl-10 ${validationErrors?.recipient ? 'border-red-500 focus:border-red-500' : ''} ${className || ''}`}
        />
        <Search className="search-icon" />
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

      {/* Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Header section */}
          {!isLoading && (
            <>
              {value === '' || value === '@' ? (
                <>
                  {recentUsernames.length > 0 && (
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Recent
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="w-3 h-3 mr-1" />
                    Suggestions
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          )}

          {/* Suggestions list */}
          {!isLoading && suggestions.map((suggestion, index) => (
            <button
              key={suggestion.username}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion.username)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">@</span>
                  <span className="font-medium">{suggestion.username}</span>
                </div>
                {suggestion.isRecent && (
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Recent</span>
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* No results message */}
          {!isLoading && suggestions.length === 0 && value && value !== '@' && (
            <div className="p-4 text-center text-gray-500">
              <User className="w-4 h-4 mx-auto mb-1 opacity-50" />
              <span className="text-sm">No users found</span>
            </div>
          )}
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