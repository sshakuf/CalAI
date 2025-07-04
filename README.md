# CalAI - Nail Salon Management System

A comprehensive nail salon management platform with AI-powered WhatsApp integration for automated appointment scheduling, customer communication, and business management.

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js (if building backend services)
- Git

### Database Setup

1. **Start the database services:**
   ```bash
   docker compose up -d
   ```

2. **Verify services are running:**
   ```bash
   docker ps
   ```
   You should see three containers: `nail-salon-db`, `nail-salon-redis`, and `nail-salon-adminer`

3. **Database Connection:**
   - **PostgreSQL:** `postgresql://nail_admin:your_secure_password@localhost:5432/nail_salon`
   - **Redis:** `redis://localhost:6379`
   - **Database Admin UI:** http://localhost:8080 (Adminer)

### Environment Configuration

Copy `.env` file and configure your API keys:
```bash
cp .env .env.local
# Edit .env.local with your actual API keys
```

### Database Management

**View logs:**
```bash
docker compose logs -f db
```

**Stop services:**
```bash
docker compose down
```

**Reset database (WARNING: This will delete all data):**
```bash
docker compose down -v
docker compose up -d
```

## Database Schema

The system includes the following main entities:

### Core Tables
- **businesses** - Salon information and settings
- **staff** - Employees with Google Calendar integration
- **services** - Available services with pricing
- **customers** - Customer information and preferences
- **appointments** - Appointment bookings with calendar sync

### Communication
- **whatsapp_conversations** - WhatsApp chat threads
- **whatsapp_messages** - Individual messages with AI processing
- **notifications** - Notification queue and templates

### Operations
- **payments** - Payment transactions
- **staff_schedules** - Working hours and availability
- **analytics_snapshots** - Business metrics
- **audit_logs** - System audit trail

## Connection String

```
postgresql://nail_admin:your_secure_password@localhost:5432/nail_salon
```

## Next Steps

1. Configure your WhatsApp Business API credentials
2. Set up Google Calendar API integration
3. Configure AI API keys (OpenAI/Claude)
4. Build and deploy your backend services
5. Set up the manager dashboard frontend
6. Configure notification templates

## Architecture

- **Database:** PostgreSQL with Redis for caching
- **Backend:** Node.js/Express or Python/FastAPI
- **Frontend:** React/Next.js for manager dashboard
- **Mobile:** React Native/Flutter for staff app
- **AI:** Claude/OpenAI with MCP integration
- **Communication:** WhatsApp Business API

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS for all connections
- Implement proper authentication and authorization
- Regular security audits and updates