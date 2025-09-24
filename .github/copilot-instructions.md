# Next.js 15 Enterprise Starter - AI Coding Instructions

## Architecture Overview

This is a **Next.js 15** enterprise starter with multi-database support, role-based authentication, and admin panel. Key architectural patterns:

- **Database Abstraction**: `src/data/rest.db.js` acts as a provider registry that auto-detects and switches between Redis/PostgreSQL based on environment variables
- **Dynamic Auth**: `src/auth.js` fetches OAuth provider configs from database at runtime using `buildAuthConfig()`
- **Role-Based Middleware**: `src/middleware.js` caches roles/settings for 5 minutes and controls route access dynamically
- **API Layer**: Unified query system with public/private endpoints in `src/app/api/query/`

## Key Patterns & Conventions

### Database Operations
Always use the unified `DBService` from `src/data/rest.db.js`:
```javascript
import DBService from '@/data/rest.db.js';
// Auto-detects provider: postgres if POSTGRES_URL, else redis if REDIS_URL
const data = await DBService.readAll('collection_name');
```

### Authentication Flow
- NextAuth v5 with dynamic provider loading from database settings
- Custom credentials provider calls `/auth/api/handler` for validation
- Settings fetched via `fetchSettings()` function configures OAuth providers at runtime
- Use `useAuth` hook from `src/hooks/useAuth.js` for client-side auth state

### API Routes Structure
- **Private**: `/api/query/[slug]` - requires authentication via `withAuth()` HOC
- **Public**: `/api/query/public/[slug]` - uses `withPublicAccess()` with CSRF/IP validation
- **Role-Protected**: Use `withAuthAndRole(['admin'])` for role-specific endpoints

### UI Components (Shadcn/UI)
- Located in `src/components/ui/` - use class-variance-authority (CVA) for variants
- Custom components extend base with additional props (see `country-dropdown.tsx`, `phone-input.tsx`)
- Forms use `react-hook-form` + `zod` validation pattern consistently

### Admin Panel Architecture
- Layout: `src/app/admin/layout.jsx` with `layoutWrapper.jsx` for shared UI
- Settings: `src/app/admin/system/settings/page.jsx` - dynamic form with useFieldArray for arrays
- Uses `FormField` + `FormControl` pattern from shadcn/ui consistently

## Critical Developer Workflows

### Development Commands
```bash
npm run dev          # Uses --turbopack for faster builds
npm run lint:fix     # Auto-fixes ESLint issues in src/**
npm run format       # Prettier formatting
npm run email-dev    # Preview emails in development
```

### Database Provider Setup
Set ONE of these environment variables:
- `POSTGRES_URL` - Auto-selects PostgreSQL provider
- `REDIS_URL` - Auto-selects Redis provider
- Provider detection logic in `src/data/rest.db.js` constructor

### Settings-Driven Features
The app behavior changes based on database settings (fetched via `/api/query/public/site_settings`):
- `allowRegistration: false` - Blocks `/auth/register` access
- `enableFrontend: false` - Forces all routes to `/auth/login` or `/admin` 
- `providers` object - Enables OAuth providers dynamically in auth.js

## Integration Points

### Middleware Caching
- Roles cached for 5min in `getCachedRoles()` function
- Settings cached similarly in `getCachedSettings()`  
- Cache keys: `rolesCache`, `settingsCache` with timestamp validation

### Form Patterns
Dynamic arrays use `useFieldArray`:
```javascript
const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialNetworks"
});
```

### Authentication HOCs
- `withAuth(handler)` - Basic auth required
- `withAuthAndRole(['admin'])(handler)` - Role-based protection
- `withPublicAccess(handler, options)` - Public with CSRF/IP validation

## Project-Specific Conventions

### File Organization
- **Database**: `src/data/` - Provider implementations (redis.db.js, postgres.db.js)
- **API Routes**: `src/app/api/query/` vs `src/app/api/query/public/`
- **Auth**: `src/auth.js` (config), `src/lib/server/auth.js` (middleware), `src/hooks/useAuth.js` (client)
- **UI**: `src/components/ui/` (shadcn), `src/components/` (custom components)

### Error Handling
- API routes return `{ success: boolean, data?: any, error?: string }` format
- Client queries use QueryAPI class from `src/lib/client/query.js`
- Toast notifications via `sonner` library consistently

### Environment Variables
- `NEXTAUTH_URL` - Required for auth.js base URL detection  
- `NEXT_SECRET` - NextAuth encryption secret
- Database: One of `POSTGRES_URL` or `REDIS_URL`
- OAuth: Provider-specific `{PROVIDER}_CLIENT_ID/SECRET` pairs

When implementing new features, follow the existing patterns for database abstraction, role-based access, and dynamic configuration from database settings.