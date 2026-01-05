# Reels Dashboard

Full-stack dashboard for managing Instagram Reels automation system.

## Tech Stack

- **Backend**: Bun + Hono + Drizzle ORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript + shadcn/ui + Tailwind CSS
- **Auth**: Google OAuth (single admin user)
- **State**: Zustand + React Query
- **Deployment**: Coolify (Docker)

## Project Structure

```
reels-dashboard/
├── backend/              # Hono API server
│   ├── src/
│   │   ├── db/          # Drizzle schema & connection
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth middleware
│   │   └── services/    # Business logic
│   ├── drizzle/         # Migrations (generated)
│   ├── .env.example     # Environment template
│   └── index.ts         # Server entry
│
├── frontend/            # React SPA
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── stores/      # Zustand stores
│   │   ├── lib/         # Utilities
│   │   └── hooks/       # Custom hooks
│   └── index.html
│
└── shared/              # Shared TypeScript types
    └── types.ts
```

## Setup

### Prerequisites

- Bun >= 1.3.5
- PostgreSQL >= 14
- Google OAuth credentials

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy environment file and configure:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Set up database:
```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Or push schema directly (dev only)
bun run db:push
```

4. Start development server:
```bash
bun run dev
```

Server runs on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Create environment file:
```bash
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

3. Start development server:
```bash
bun run dev
```

Frontend runs on `http://localhost:5173`

## Database Schema

- **users**: Dashboard admin users (Google OAuth)
- **sessions**: User sessions
- **instagram_accounts**: Connected Instagram accounts
- **approvals**: Reel approval queue
- **notifications**: User notifications
- **system_logs**: System activity logs
- **settings**: Dashboard configuration
- **analytics_snapshots**: Analytics data cache
- **workflow_status**: n8n workflow status

## API Endpoints

### Authentication
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Approvals
- `GET /api/approvals` - List approvals
- `GET /api/approvals/:id` - Get approval
- `POST /api/approvals/:id/approve` - Approve reel
- `POST /api/approvals/:id/reject` - Reject reel
- `PATCH /api/approvals/:id` - Update approval

### Accounts
- `GET /api/accounts` - List Instagram accounts
- `GET /api/accounts/:id` - Get account
- `PATCH /api/accounts/:id/toggle` - Toggle active status

### Analytics
- `GET /api/analytics/overview` - Analytics overview
- `GET /api/analytics/account/:id` - Account analytics

### Workflows
- `GET /api/workflows` - List workflows
- `GET /api/workflows/:id` - Get workflow
- `POST /api/workflows/:id/toggle` - Toggle workflow

### Settings
- `GET /api/settings` - List settings
- `GET /api/settings/:key` - Get setting
- `PUT /api/settings/:key` - Update setting

### Logs
- `GET /api/logs` - List system logs

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

## Development

### Backend
```bash
cd backend
bun run dev           # Start with hot reload
bun run db:studio     # Open Drizzle Studio
```

### Frontend
```bash
cd frontend
bun run dev           # Start Vite dev server
bun run build         # Build for production
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL
- `SESSION_SECRET` - Session encryption key
- `ADMIN_EMAIL` - Allowed admin email
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port (default: 3001)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL

## Next Steps

1. Configure Google OAuth credentials
2. Set up PostgreSQL database
3. Run database migrations
4. Create initial admin user
5. Build frontend components
6. Set up WebSocket for real-time updates
7. Configure Coolify deployment

## License

Private - Internal use only
