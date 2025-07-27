/**
 * Advanced Mode Toggle Component
 * Allows users to toggle between simple and advanced transaction display
 */

import { Switch } from '@/components/ui/switch.jsx'
import { Label } from '@/components/ui/label.jsx'
import { useUserSettings } from '../../utils/userSettings.js'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.jsx'

export default function AdvancedModeToggle({ className = '' }) {
  const { settings, toggleAdvancedTransactionDetails } = useUserSettings()

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Switch
          id="advanced-mode"
          checked={settings.showAdvancedTransactionDetails}
          onCheckedChange={toggleAdvancedTransactionDetails}
        />
        <Label htmlFor="advanced-mode" className="cursor-pointer">
          Advanced Transaction Details
        </Label>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              Enable advanced mode to see detailed breakdowns of exchange transactions, 
              including separate send/receive entries for on-chain swaps and sells.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}