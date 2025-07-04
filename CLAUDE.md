# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CalAI is a comprehensive nail salon management platform with AI-powered WhatsApp integration for automated appointment scheduling, customer communication, and business management.

## System Architecture

### Core Components
- **WhatsApp Bot Service**: Primary customer interaction via WhatsApp Business API
- **Manager Dashboard**: React/Next.js web application for salon operations
- **Staff Mobile App**: React Native/Flutter app for technicians
- **API Gateway**: Central authentication and rate limiting
- **Backend Services**: Node.js/Express or Python/FastAPI microservices

### Key Services
- **Appointment Service**: CRUD operations, scheduling logic, availability checking
- **WhatsApp Bot Service**: Natural language processing, conversation flows
- **Business Logic Service**: Rules engine, notifications, analytics
- **AI Integration**: Claude/OpenAI API with MCP (Model Context Protocol)

### Database Layer
- **PostgreSQL**: Primary database for appointments, customers, staff
- **Redis**: Caching and session management
- **Vector Database**: AI conversation context and customer preferences

## Development Commands

### Initial Setup
```bash
# Install dependencies (to be established based on chosen stack)
npm install        # For Node.js projects
pip install -r requirements.txt  # For Python projects

# Environment setup
cp .env.example .env
# Configure database, WhatsApp API keys, AI API keys
```

### Development Server
```bash
# Backend services
npm run dev        # Node.js backend
python -m uvicorn main:app --reload  # Python/FastAPI

# Frontend applications
npm run dev        # Manager dashboard
npm run dev:mobile # Staff mobile app
```

### Testing
```bash
# Unit tests
npm test           # Node.js
pytest            # Python

# Integration tests
npm run test:integration
pytest tests/integration/

# E2E tests
npm run test:e2e
```

### Build & Deployment
```bash
# Build applications
npm run build      # Production build
docker build -t calai-backend .

# Database migrations
npm run migrate    # Apply schema changes
npm run seed      # Seed development data
```

## Key Implementation Details

### WhatsApp Integration
- Uses WhatsApp Business API for messaging
- Implements webhook handlers for real-time message processing
- Supports media handling for nail art references
- Template messages for automated notifications

### AI Agent Architecture
- MCP integration for structured data access
- Context-aware conversation handling
- Intent recognition for booking operations
- Natural language understanding in multiple languages

### Google Calendar Integration
- Two-way synchronization with staff calendars
- Real-time conflict detection
- Multi-calendar support per staff member

### Business Rules Engine
- Configurable working hours per staff
- Service duration and pricing rules
- Blackout periods and capacity planning
- Automated reminder system

## Development Phases

### Phase 1: Core Foundation
- Database schema and API design
- Basic appointment CRUD operations
- Google Calendar integration
- Simple manager dashboard

### Phase 2: WhatsApp Integration
- WhatsApp Business API setup
- AI-powered bot with booking capabilities
- Customer notification system

### Phase 3: Advanced Features
- Intelligent scheduling recommendations
- Advanced analytics and reporting
- Staff mobile application
- Payment processing integration

### Phase 4: Optimization & Scale
- Performance optimization
- Predictive scheduling with AI
- Multi-location support
- Advanced business intelligence

## Security Requirements

### Data Protection
- GDPR/CCPA compliant customer data handling
- End-to-end encryption for sensitive data
- Role-based access controls
- Comprehensive audit logging

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure JWT token management
- HTTPS-only communications

## Performance Targets

- WhatsApp message handling: < 2 seconds response time
- System uptime: 99.9% availability
- Error rate: < 0.1% failed booking attempts
- Scalability: Handle 1000+ concurrent users

## Testing Strategy

### Unit Testing
- Service layer business logic
- Database operations
- WhatsApp message handlers
- AI integration components

### Integration Testing
- WhatsApp webhook processing
- Google Calendar synchronization
- Payment processing flows
- Database transaction integrity

### E2E Testing
- Complete booking flows via WhatsApp
- Manager dashboard operations
- Staff mobile app interactions
- Multi-user concurrent scenarios