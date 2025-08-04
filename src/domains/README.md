# Domain Structure

This directory contains the domain model following Domain-Driven Design (DDD) principles.

## Domain Boundaries

### Core Domains
- **Account**: User accounts, authentication, and profiles
- **Balance**: Wallet balances and financial state
- **Transaction**: All transaction types and processing
- **Strategy**: Investment strategies and goals
- **Market**: Market data and pricing

### Supporting Domains
- **Notification**: User notifications and alerts
- **Analytics**: Performance tracking and reporting
- **Integration**: External service integrations

## Structure

Each domain follows this structure:
```
domain/
├── models/       # Domain entities and value objects
├── repositories/ # Data access interfaces
├── services/     # Domain services
├── events/       # Domain events
└── index.js      # Public API
```

## Principles
- Domain logic is isolated from infrastructure
- Each domain has clear boundaries
- Dependencies flow inward (infrastructure → application → domain)
- Domain events communicate between bounded contexts