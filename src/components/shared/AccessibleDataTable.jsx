/**
 * Accessible Data Table Component
 * Table with proper ARIA attributes, keyboard navigation, and screen reader support
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useKeyboardNavigation, useAnnouncer } from '@/hooks/useAccessibility.jsx'
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import AccessibleButton from './AccessibleButton.jsx'

export default function AccessibleDataTable({
  data = [],
  columns = [],
  caption,
  sortable = true,
  filterable = false,
  selectable = false,
  className,
  emptyMessage = "No data available",
  loading = false,
  onSort,
  onFilter,
  onSelect,
  ...props
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterText, setFilterText] = useState('')
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [focusedCell, setFocusedCell] = useState({ row: -1, col: -1 })
  
  const tableRef = useRef(null)
  const { announce } = useAnnouncer()

  // Filter data
  const filteredData = filterText
    ? data.filter(row =>
        columns.some(col =>
          String(row[col.key] || '').toLowerCase().includes(filterText.toLowerCase())
        )
      )
    : data

  // Sort data
  const sortedData = sortConfig.key
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue === bValue) return 0
        
        const result = aValue < bValue ? -1 : 1
        return sortConfig.direction === 'asc' ? result : -result
      })
    : filteredData

  const handleSort = (columnKey) => {
    if (!sortable) return

    const direction = 
      sortConfig.key === columnKey && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc'
    
    setSortConfig({ key: columnKey, direction })
    onSort?.({ key: columnKey, direction })
    
    const column = columns.find(col => col.key === columnKey)
    announce(`Table sorted by ${column?.label || columnKey} ${direction}ending`)
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(sortedData.map((_, index) => index)))
      announce(`Selected all ${sortedData.length} rows`)
    } else {
      setSelectedRows(new Set())
      announce('Deselected all rows')
    }
    onSelect?.(checked ? sortedData : [])
  }

  const handleSelectRow = (index, checked) => {
    const newSelectedRows = new Set(selectedRows)
    if (checked) {
      newSelectedRows.add(index)
    } else {
      newSelectedRows.delete(index)
    }
    setSelectedRows(newSelectedRows)
    
    const selectedData = sortedData.filter((_, i) => newSelectedRows.has(i))
    onSelect?.(selectedData)
    
    announce(checked ? 'Row selected' : 'Row deselected')
  }

  const handleKeyDown = (e) => {
    if (!tableRef.current) return

    const { key } = e
    const maxRow = sortedData.length - 1
    const maxCol = columns.length - 1 + (selectable ? 1 : 0)

    switch (key) {
      case 'ArrowUp':
        e.preventDefault()
        setFocusedCell(prev => ({
          ...prev,
          row: Math.max(-1, prev.row - 1)
        }))
        break

      case 'ArrowDown':
        e.preventDefault()
        setFocusedCell(prev => ({
          ...prev,
          row: Math.min(maxRow, prev.row + 1)
        }))
        break

      case 'ArrowLeft':
        e.preventDefault()
        setFocusedCell(prev => ({
          ...prev,
          col: Math.max(0, prev.col - 1)
        }))
        break

      case 'ArrowRight':
        e.preventDefault()
        setFocusedCell(prev => ({
          ...prev,
          col: Math.min(maxCol, prev.col + 1)
        }))
        break

      case 'Home':
        e.preventDefault()
        if (e.ctrlKey) {
          setFocusedCell({ row: -1, col: 0 })
        } else {
          setFocusedCell(prev => ({ ...prev, col: 0 }))
        }
        break

      case 'End':
        e.preventDefault()
        if (e.ctrlKey) {
          setFocusedCell({ row: maxRow, col: maxCol })
        } else {
          setFocusedCell(prev => ({ ...prev, col: maxCol }))
        }
        break

      case 'Enter':
      case ' ':
        if (focusedCell.row === -1 && sortable) {
          // Header row - sort column
          const columnIndex = selectable ? focusedCell.col - 1 : focusedCell.col
          if (columnIndex >= 0 && columnIndex < columns.length) {
            e.preventDefault()
            handleSort(columns[columnIndex].key)
          }
        } else if (selectable && focusedCell.col === 0 && focusedCell.row >= 0) {
          // Selection column
          e.preventDefault()
          const isSelected = selectedRows.has(focusedCell.row)
          handleSelectRow(focusedCell.row, !isSelected)
        }
        break
    }
  }

  useEffect(() => {
    const table = tableRef.current
    if (table) {
      table.addEventListener('keydown', handleKeyDown)
      return () => table.removeEventListener('keydown', handleKeyDown)
    }
  }, [focusedCell, selectedRows, sortConfig])

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ChevronsUpDown className="w-4 h-4" />
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />
  }

  const isAllSelected = selectedRows.size === sortedData.length && sortedData.length > 0
  const isPartiallySelected = selectedRows.size > 0 && selectedRows.size < sortedData.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter */}
      {filterable && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter data..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value)
                onFilter?.(e.target.value)
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-label="Filter table data"
            />
          </div>
          {filterText && (
            <span className="text-sm text-gray-600">
              {sortedData.length} of {data.length} rows
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table
          ref={tableRef}
          role="table"
          aria-label={caption || "Data table"}
          tabIndex={0}
          className="min-w-full divide-y divide-gray-200"
          {...props}
        >
          {caption && (
            <caption className="sr-only">
              {caption}
            </caption>
          )}

          <thead className="bg-gray-50">
            <tr role="row">
              {/* Select all column */}
              {selectable && (
                <th
                  role="columnheader"
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500',
                    focusedCell.row === -1 && focusedCell.col === 0 && 'ring-2 ring-purple-500'
                  )}
                  tabIndex={-1}
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={isPartiallySelected ? 'indeterminate' : undefined}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    aria-label={isAllSelected ? 'Deselect all rows' : 'Select all rows'}
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((column, index) => {
                const colIndex = selectable ? index + 1 : index
                const isFocused = focusedCell.row === -1 && focusedCell.col === colIndex
                const isSorted = sortConfig.key === column.key

                return (
                  <th
                    key={column.key}
                    role="columnheader"
                    aria-sort={
                      isSorted 
                        ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                        : sortable ? 'none' : undefined
                    }
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                      sortable && 'cursor-pointer hover:bg-gray-100',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500',
                      isFocused && 'ring-2 ring-purple-500'
                    )}
                    tabIndex={-1}
                    onClick={() => sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, rowIndex) => (
                  <motion.tr
                    key={rowIndex}
                    role="row"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'hover:bg-gray-50',
                      selectedRows.has(rowIndex) && 'bg-purple-50'
                    )}
                  >
                    {/* Selection column */}
                    {selectable && (
                      <td
                        role="gridcell"
                        className={cn(
                          'px-6 py-4 whitespace-nowrap',
                          'focus:outline-none focus:ring-2 focus:ring-purple-500',
                          focusedCell.row === rowIndex && focusedCell.col === 0 && 'ring-2 ring-purple-500'
                        )}
                        tabIndex={-1}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRows.has(rowIndex)}
                          onChange={(e) => handleSelectRow(rowIndex, e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                      </td>
                    )}

                    {/* Data columns */}
                    {columns.map((column, colIndex) => {
                      const cellIndex = selectable ? colIndex + 1 : colIndex
                      const isFocused = focusedCell.row === rowIndex && focusedCell.col === cellIndex
                      const cellValue = row[column.key]

                      return (
                        <td
                          key={column.key}
                          role="gridcell"
                          className={cn(
                            'px-6 py-4 whitespace-nowrap text-sm',
                            column.numeric ? 'text-right font-mono' : 'text-gray-900',
                            'focus:outline-none focus:ring-2 focus:ring-purple-500',
                            isFocused && 'ring-2 ring-purple-500'
                          )}
                          tabIndex={-1}
                        >
                          {column.render ? column.render(cellValue, row, rowIndex) : cellValue}
                        </td>
                      )
                    })}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Table info */}
      {sortedData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {sortedData.length} of {data.length} rows
            {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
          </div>
          
          {(sortConfig.key || filterText) && (
            <div className="flex items-center space-x-4">
              {sortConfig.key && (
                <span>
                  Sorted by {columns.find(col => col.key === sortConfig.key)?.label} 
                  ({sortConfig.direction})
                </span>
              )}
              {filterText && (
                <AccessibleButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterText('')
                    onFilter?.('')
                  }}
                  ariaLabel="Clear filter"
                >
                  Clear filter
                </AccessibleButton>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}