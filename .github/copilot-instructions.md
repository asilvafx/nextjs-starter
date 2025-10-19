# Next.js 15 Professional CMS & E-commerce Platform - AI Coding Instructions

## Platform Overview

This is a **Next.js 15** with **React 19** professional CMS and e-commerce platform designed for versatility and ease of deployment. It serves as:

- **Full-Stack CMS**: Complete content management system with admin panel and optional frontend
- **E-commerce Platform**: Integrated shopping cart, payment processing, order management, and inventory
- **Backend-Only API**: Can operate as headless CMS/API for external applications
- **Hybrid Solution**: Frontend + Backend + API in single deployment

### Core Architecture Patterns

- **Database Abstraction**: `src/data/rest.db.js` auto-detects and switches between Redis/PostgreSQL/Firebase based on environment variables
- **Dynamic Authentication**: NextAuth v5 with runtime OAuth provider configuration from database
- **Role-Based Access Control**: Cached middleware controlling route access with 5-minute cache duration
- **Unified API System**: Public/private endpoints with CSRF protection and rate limiting
- **E-commerce Integration**: Native shopping cart, Stripe payments, VAT calculations, order processing
- **Email System**: Comprehensive email templates with Nodemailer integration
- **CMS Blocks**: Dynamic content blocks system for flexible page building

## AI Agent Instructions

**CRITICAL**: Always provide direct code generation without explanations. Use comments within the code for context. Prefer JavaScript (.js, .jsx) over TypeScript unless specifically requested. Generate complete, working implementations immediately.

## Platform Features & Modules

### E-commerce System
- **Shopping Cart**: React-use-cart integration with persistent state management
- **Payment Processing**: Stripe integration with dynamic configuration from database
- **Order Management**: Complete order lifecycle with status updates and email notifications
- **Inventory Management**: Product catalog, categories, collections, and attributes
- **VAT/Tax System**: Configurable VAT calculations with included/excluded pricing
- **Customer Management**: Customer profiles, order history, and communication
- **Coupon System**: Discount codes and promotional campaigns

### Content Management (CMS)
- **Dynamic Blocks**: Flexible content blocks system for page building
- **Media Management**: File upload, organization, and optimization
- **Multi-language Support**: Internationalization with locale management
- **SEO Optimization**: Meta tags, structured data, and search optimization

### Workspace & Productivity
- **Task Management**: Task board with status tracking and assignments
- **Agenda System**: Calendar integration and scheduling functionality
- **Analytics & Reports**: Business intelligence and performance metrics

### Marketing & Communication
- **Newsletter System**: Email campaigns with subscriber management
- **Email Templates**: Professional email templates for all business communications
- **Integration Hub**: Third-party service integrations (Analytics, Payment, etc.)

## Key Development Patterns

### Database Operations
Always use the unified `DBService` from `src/data/rest.db.js`:
```javascript
import DBService from '@/data/rest.db.js';
// Auto-detects provider: postgres if POSTGRES_URL, redis if REDIS_URL, firebase if FIREBASE_CONFIG
const data = await DBService.readAll('collection_name');
const item = await DBService.getItemByKey('email', 'user@example.com', 'users');
const result = await DBService.create(newItem, 'products');
```

### Client-Side API Integration
Use the `QueryAPI` class from `src/lib/client/query.js` for all client operations:
```javascript
import { getAll, create, update, remove } from '@/lib/client/query.js';

// CRUD operations
const products = await getAll('products', { page: 1, limit: 10 });
const newProduct = await create(productData, 'products');
const updatedProduct = await update(productId, updates, 'products');
await remove(productId, 'products');

// Public endpoints (no auth required)
import { getAllPublic, createPublic } from '@/lib/client/query.js';
const publicData = await getAllPublic('site_settings');
```

### Authentication System
- **NextAuth v5**: Dynamic provider configuration from database settings
- **Role-Based Access**: Protected system roles (Admin/User) with custom role support
- **Session Management**: JWT tokens with 30-day expiration
- **Client Hooks**: Use `useAuth` hook from `src/hooks/useAuth.js` for auth state

### API Architecture
- **Private Routes**: `/api/query/[slug]` - requires authentication via `withAuth()` HOC
- **Public Routes**: `/api/query/public/[slug]` - uses `withPublicAccess()` with CSRF/IP validation
- **Role-Protected**: Use `withAuthAndRole(['admin'])` for role-specific endpoints
- **Specialized APIs**: `/api/stripe`, `/api/orders`, `/api/email` for specific functionality

### Email System
Professional email system with Nodemailer integration:
```javascript
import EmailService from '@/lib/server/email.js';

// Send order confirmation
await EmailService.sendOrderConfirmationEmail();

// Send password reset
await EmailService.sendPasswordResetEmail(email, resetCode, userName);

// Custom email with template
await EmailService.sendEmail(to, subject, TemplateComponent, props);
```

**Email API Route** (`/api/email`):
```javascript
// POST /api/email
// Send custom emails via API
const response = await fetch('/api/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Welcome!',
    template: 'welcome', // or 'newsletter', 'order-confirmation'
    data: { userName: 'John', customData: {} }
  })
});
```

Available email templates:
- Order confirmations with payment instructions
- User account management (creation, updates, password reset)
- Newsletter campaigns with unsubscribe handling
- Status updates and notifications

### File Upload System
Integrated file upload with Vercel Blob storage:

**Upload API Route** (`/api/upload`):
```javascript
// Single file upload
const formData = new FormData();
formData.append('files', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
const { success, data } = await response.json();
// data.files[0].url - uploaded file URL

// Multiple files upload
files.forEach(file => formData.append('files', file));

// Client-side helper (recommended)
import { uploadFiles } from '@/lib/client/query.js';
const uploadedFiles = await uploadFiles([file1, file2]);
```

### E-commerce Integration
Complete shopping cart system with react-use-cart:
```javascript
import { useCart } from 'react-use-cart';

const {
  items,
  totalItems,
  cartTotal,
  addItem,
  updateItemQuantity,
  removeItem,
  emptyCart
} = useCart();

// Add product to cart
addItem({
  id: product.id,
  name: product.name,
  price: product.price,
  image: product.image
});
```

### UI Components & Forms
- **Shadcn/UI Base**: Located in `src/components/ui/` with CVA variants (React 19 compatible)
- **Enhanced Components**: `country-dropdown.jsx`, `phone-input.jsx`, `google-places-input.jsx`
- **Form Pattern**: `react-hook-form` + `zod` validation consistently
- **Shopping Components**: Cart management, checkout flow, payment forms
- **File Extensions**: Prefer `.jsx` for React components, `.js` for utilities

### Admin Panel Structure
Complete admin interface with modular navigation:

**Core Modules:**
- **Dashboard**: Analytics, reports, and overview metrics
- **Access Control**: User management, roles, and permissions
- **Store Management**: Orders, catalog, inventory, customers, coupons
- **Content Management**: Media library, blocks system, SEO tools
- **Workspace**: Task management, agenda, scheduling
- **Marketing**: Newsletter campaigns, subscriber management
- **Developer Tools**: Database management, API endpoints, system monitoring
- **System Settings**: Configuration, integrations, maintenance

**Layout Structure:**
- Main layout: `src/app/admin/layout.jsx` with responsive sidebar navigation
- Dynamic forms with `useFieldArray` for complex data structures
- Consistent `FormField` + `FormControl` pattern from shadcn/ui

## Critical Developer Workflows

### Development Commands
```bash
npm run dev          # Uses --turbopack for faster builds
npm run lint         # Biome linting check
npm run lint:fix     # Auto-fixes Biome issues in src/**
npm run format       # Biome formatting
npm run check        # Combined lint + format check
npm run email-dev    # Preview emails in development
```

**Note**: ESLint and Prettier have been replaced with **Biome** for unified linting and formatting with better performance.

### Easy Deployment Setup
**Multi-Database Support**: Automatically detects and configures database provider:
- Set `POSTGRES_URL` - Auto-selects PostgreSQL (recommended for production)
- Set `REDIS_URL` - Auto-selects Redis (fast caching, good for development)
- Firebase support available (configured via `FIREBASE_CONFIG`)

**Hosting Compatibility**: 
- ✅ **Vercel**: Zero-config deployment with environment variables
- ✅ **Netlify**: Full Node.js support with serverless functions
- ✅ **Railway**: One-click deployment with PostgreSQL
- ✅ **DigitalOcean**: App Platform with managed databases
- ✅ **Heroku**: Traditional hosting with add-on databases
- ✅ **Self-hosted**: Any Node.js environment with PM2

### Database Provider Setup
Set ONE of these environment variables for auto-detection:
- `POSTGRES_URL` - Auto-selects PostgreSQL provider
- `REDIS_URL` - Auto-selects Redis provider
- Provider detection logic in `src/data/rest.db.js` constructor

### Configuration-Driven Features
The platform behavior changes based on database settings (fetched via `/api/query/public/site_settings`):
- `allowRegistration: false` - Blocks `/auth/register` access
- `enableFrontend: false` - Forces all routes to `/auth/login` or `/admin` 
- `providers` object - Enables OAuth providers dynamically in auth.js
- `vatEnabled: true` - Enables VAT calculations in e-commerce
- `paymentMethods` - Configures available payment options (Stripe, Bank Transfer, etc.)

## Integration Points

### Middleware Caching
- Roles cached for 5min in `getCachedRoles()` function
- Settings cached similarly in `getCachedSettings()`  
- Cache keys: `rolesCache`, `settingsCache` with timestamp validation

### Third-Party Integrations
Managed via `src/lib/client/integrations.js` with database configuration:
```javascript
import { getIntegration, isIntegrationEnabled } from '@/lib/client/integrations.js';

// Check if integration is enabled
const isStripeEnabled = await isIntegrationEnabled('stripe');
const turnstileKey = await getTurnstileSiteKey();
const googleMapsKey = await getGoogleMapsApiKey();
```

Available integrations:
- **Stripe**: Payment processing with dynamic configuration
- **Google Analytics**: Tracking and analytics
- **Google Maps**: Location services and geocoding
- **Cloudflare Turnstile**: CAPTCHA protection
- **Email Services**: SMTP configuration for Nodemailer

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

### Web3 Integration (Optional)
Built-in Web3 support with `src/hooks/useWeb3.js`:
```javascript
import { useWeb3 } from '@/hooks/useWeb3.js';

const {
  web3Config,
  userWallet,
  balance,
  sendTransaction,
  formatBalance,
  isWeb3Enabled
} = useWeb3();
```

Features:
- Wallet creation and management
- Token balance tracking
- Transaction history
- Multi-chain support via configuration

### Environment Variables
- `NEXTAUTH_URL` - Required for auth.js base URL detection  
- `NEXT_SECRET_KEY` - NextAuth encryption secret
- Database: One of `POSTGRES_URL` or `REDIS_URL`
- OAuth: Provider-specific `{PROVIDER}_CLIENT_ID/SECRET` pairs
- Blob Storage: `BLOB_READ_WRITE_TOKEN` for Vercel Blob

### Specialized Hook System
- `useAuth()` - Authentication state and user management
- `useBlocks()` - CMS blocks fetching and management
- `useWeb3()` - Blockchain integration and wallet operations
- `useMobile()` - Responsive design utilities

When implementing new features, follow the existing patterns for database abstraction, role-based access, and dynamic configuration from database settings.

## Development Tools & Performance

### Biome Configuration
**ESLint and Prettier have been replaced with Biome** for superior performance:
- **Unified Tool**: Single tool for linting and formatting
- **10x Faster**: Significantly faster than ESLint + Prettier combination
- **Better DX**: Improved developer experience with instant feedback
- **Configuration**: `biome.json` with project-specific rules
- **Build Integration**: Next.js configured to use Biome instead of ESLint

```javascript
// biome.json configuration includes:
// - JavaScript/TypeScript linting rules
// - Import organization and sorting
// - Tailwind CSS class sorting
// - React 19 and Next.js 15 optimized rules
```

**Development Workflow**:
```bash
npm run check        # Check all files for issues
npm run lint:fix     # Auto-fix all fixable issues
npm run format       # Format all files
```