# Mockup Services TypeScript Definitions

This directory contains comprehensive TypeScript definitions for all Mockup Services in the diBoaS platform.

## Overview

The Mockup Services are development-time API simulators that provide realistic responses for various third-party integrations. These TypeScript definitions enable:

- **Type Safety**: Catch type-related errors at development time
- **IntelliSense**: Better IDE support with autocomplete and documentation
- **Documentation**: Self-documenting code through type interfaces
- **Consistency**: Standardized interfaces across all mockup services

## Files

### `mockup-services.d.ts`
Core type definitions for the main Mockup Services:
- `MockupAnalyticsDataProviderService`
- `MockupFeeProviderService` 
- `MockupAssetMetadataProviderService`
- `MockupAuthenticationProviderService`
- `MockupConfigurationProviderService`

### `mockup-extended.d.ts`
Extended type definitions for specialized Mockup Services:
- Balance, Market Data, Strategy services
- Transaction, Payment, UI configuration services
- Security, Risk, Tax, Workflow services

### `index.d.ts`
Main entry point that re-exports all types and provides utility types.

### `jsdoc.json`
JSDoc configuration for generating documentation from the Mockup Services.

## Usage

### Basic Import
```typescript
import type { 
  MockupFeeProviderService,
  FeeStructure,
  AllFeeData 
} from '../services/types/index.js'
```

### Runtime Import with Types
```javascript
// JavaScript file with JSDoc types
/**
 * @typedef {import('./services/types/index.js').MockupFeeProviderService} FeeService
 */

import { mockupFeeProviderService } from './services/fees/MockupFeeProviderService.js'

/**
 * @param {FeeService} feeService
 * @returns {Promise<number>}
 */
async function calculateFees(feeService) {
  const fees = await feeService.getAllFeeData()
  return fees.diboas.add + fees.network.SOL
}
```

### TypeScript Usage
```typescript
import { mockupFeeProviderService } from '../services/fees/MockupFeeProviderService.js'
import type { AllFeeData, FeeStructure } from '../services/types/index.js'

async function processFees(): Promise<number> {
  const feeData: AllFeeData = await mockupFeeProviderService.getAllFeeData()
  const diboasFees: FeeStructure = feeData.diboas
  
  return diboasFees.add + diboasFees.withdraw
}
```

## Key Interfaces

### Common Interfaces

#### `HealthCheckResponse`
Standard health check response for all services:
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: number
  latency?: number
  error?: string
}
```

#### `MockupServiceBase`
Base interface implemented by all mockup services:
```typescript
interface MockupServiceBase {
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}
```

### Service-Specific Types

Each service has comprehensive type definitions covering:
- Input parameters and options
- Response data structures  
- Configuration objects
- Error types
- Metric and monitoring data

## Benefits

### Development Experience
- **Autocomplete**: IDE suggestions for method names and parameters
- **Error Prevention**: Catch typos and type mismatches early
- **Documentation**: Hover tooltips with method descriptions
- **Refactoring**: Safe renaming and restructuring

### Code Quality
- **Consistency**: Standardized interfaces across services
- **Self-Documentation**: Types serve as living documentation
- **Testing**: Better test coverage with type-aware assertions
- **Maintainability**: Clear contracts between components

## Best Practices

### JSDoc Integration
Add JSDoc type annotations to JavaScript files:
```javascript
/**
 * @typedef {import('../types/index.js').MockupFeeProviderService} FeeService
 * @param {FeeService} service - The fee provider service
 * @returns {Promise<number>} Total fees
 */
async function getTotalFees(service) {
  const data = await service.getAllFeeData()
  return data.diboas.add
}
```

### Type Guards
Use type guards for runtime type checking:
```typescript
import { isMockupService } from '../services/types/index.js'

function processService(service: unknown) {
  if (isMockupService(service)) {
    // TypeScript knows service is MockupServiceBase
    return service.healthCheck()
  }
  throw new Error('Invalid service')
}
```

### Error Handling
Use typed error responses:
```typescript
import type { MockupServiceResponse } from '../services/types/index.js'

function handleResponse<T>(response: MockupServiceResponse<T>): T {
  if (!response.success) {
    throw new Error(`Service error: ${response.error?.message}`)
  }
  return response.data!
}
```

## Maintenance

### Adding New Services
1. Create type interface in appropriate `.d.ts` file
2. Add module declaration for runtime import
3. Update main `index.d.ts` export
4. Add JSDoc typedefs to JavaScript implementation

### Updating Existing Types
1. Modify interface definitions
2. Update JSDoc comments in implementation files
3. Run type checking to ensure compatibility
4. Update documentation as needed

## IDE Configuration

### VS Code
Add to `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.validate.enable": true,
  "js/ts.implicitProjectConfig.checkJs": true
}
```

### TypeScript Config
Ensure `tsconfig.json` includes type definitions:
```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "include": [
    "src/**/*",
    "src/services/types/**/*.d.ts"
  ]
}
```

## Related Documentation

- [Mockup Services Architecture](../README.md)
- [Individual Service Documentation](../../docs/mockup-services/)
- [TypeScript Configuration](../../../tsconfig.json)
- [Development Guidelines](../../../docs/DEVELOPMENT.md)