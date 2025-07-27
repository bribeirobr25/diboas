import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Copy, CheckCircle, QrCode, AlertCircle } from 'lucide-react'

// Mock wallet addresses for demo - in production these would come from the wallet service
const WALLET_ADDRESSES = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
  SOL: '7VBUjZWV7rUPkUFN7XM7jUPkUFN7XM7jUPkUFN7XM7j',
  SUI: '0x0000000000000000000000000000000000000000000000000000000000000001'
}

const SUPPORTED_ASSETS = {
  BTC: { 
    chains: ['BTC'], 
    assets: ['BTC', 'USDT'],
    icon: '₿',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  },
  ETH: { 
    chains: ['ETH Layer 1'], 
    assets: ['ETH', 'USDC', 'USDT'],
    icon: 'Ξ',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  SOL: { 
    chains: ['SOL'], 
    assets: ['SOL', 'USDC', 'USDT'],
    icon: '◎',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200'
  },
  SUI: { 
    chains: ['SUI'], 
    assets: ['SUI', 'USDC', 'USDT'],
    icon: 'Ⓢ',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200'
  }
}

export default function WalletAddressDisplay() {
  const [selectedChain, setSelectedChain] = useState('SOL') // Default to SOL
  const [copiedAddress, setCopiedAddress] = useState(null)
  const [showQR, setShowQR] = useState(false)

  const handleCopyAddress = (chain) => {
    const address = WALLET_ADDRESSES[chain]
    navigator.clipboard.writeText(address)
    setCopiedAddress(chain)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const selectedChainInfo = SUPPORTED_ASSETS[selectedChain]
  const selectedAddress = WALLET_ADDRESSES[selectedChain]

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Network</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {Object.entries(SUPPORTED_ASSETS).map(([chain, info]) => (
            <Button
              key={chain}
              variant={selectedChain === chain ? 'default' : 'outline'}
              className={`h-auto py-3 ${
                selectedChain !== chain ? `${info.bgColor} ${info.textColor} ${info.borderColor}` : ''
              }`}
              onClick={() => setSelectedChain(chain)}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">{info.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{chain}</div>
                  <div className="text-xs opacity-75">
                    {info.assets.join(', ')}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <Card className={`${selectedChainInfo.borderColor} border-2`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {selectedChain} Wallet Address
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQR(!showQR)}
                  className="p-1"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyAddress(selectedChain)}
                  className="p-1"
                >
                  {copiedAddress === selectedChain ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${selectedChainInfo.bgColor} font-mono text-xs break-all`}>
              {selectedAddress}
            </div>

            {showQR && (
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                {/* QR Code would be generated here */}
                <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                  QR Code
                </div>
              </div>
            )}

            <div className={`flex items-start gap-2 p-3 rounded-lg ${selectedChainInfo.bgColor}`}>
              <AlertCircle className={`w-4 h-4 ${selectedChainInfo.textColor} flex-shrink-0 mt-0.5`} />
              <div className="text-xs space-y-1">
                <p className={selectedChainInfo.textColor}>
                  <strong>Important:</strong> Only send {selectedChainInfo.assets.join(', ')} on {selectedChain} network
                </p>
                <p className={selectedChainInfo.textColor}>
                  Sending other assets or using wrong network will result in permanent loss
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}