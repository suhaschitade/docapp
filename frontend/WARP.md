# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server (must build first)
npm start
```

### Code Quality & Testing
```bash
# Run all quality checks (type checking, linting, formatting)
npm run quality

# Fix all code quality issues automatically
npm run quality:fix

# Individual commands
npm run type-check    # TypeScript type checking
npm run lint         # ESLint checking
npm run lint:fix     # ESLint with auto-fix
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted correctly
```

### End-to-End Testing (Playwright)
```bash
# Run all E2E tests
npm test

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests interactively
npm run test:debug

# View test reports
npm run test:report
```

### PWA Development
```bash
# Generate PWA icons (run after changing icon source)
node scripts/generate-icons.js

# Build and validate PWA (complete PWA build process)
./scripts/pwa-build.sh
```

## Architecture Overview

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Radix UI primitives + Headless UI + Heroicons
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **PWA**: next-pwa with service worker

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard
│   ├── appointments/       # Appointment management
│   ├── patients/          # Patient management (under manage-patients/)
│   ├── treatments/        # Treatment management
│   ├── notifications/     # Notification center
│   ├── profile/          # User profile
│   └── offline/          # PWA offline fallback
├── components/            # Reusable React components
│   ├── ui/               # UI components (Button, Modal, Select, etc.)
│   └── ConfirmDialog.tsx # Global confirmation dialog
├── lib/
│   ├── api/              # Backend API service layer
│   └── auth.ts           # Authentication utilities
├── hooks/                # Custom React hooks
├── services/            # External services (empty currently)
└── pages/               # Legacy pages (if any)
```

### Backend Integration
- **API Base URL**: Configured via `NEXT_PUBLIC_API_BASE_URL` environment variable
- **Default Backend**: ASP.NET Core API running on `http://localhost:5145`
- **Authentication**: JWT tokens stored in localStorage
- **API Services**: Typed TypeScript services in `src/lib/api/`

### Design System
- **Theme**: Medical/healthcare focused with blue-purple gradients
- **Components**: Glassmorphism effects with backdrop blur
- **Icons**: Heroicons for consistency
- **Responsive**: Mobile-first design approach
- **Accessibility**: Screen reader friendly, keyboard navigation

## Key Features

### Progressive Web App (PWA)
- **Installable**: Works as native app on desktop and mobile
- **Offline Support**: Cached content available offline
- **Service Worker**: Handles caching and background sync
- **Push Notifications**: Framework ready (not implemented)
- **Auto-updates**: Seamless update experience

### Medical Practice Management
- **Patient Management**: Search, create, edit patients with demographics
- **Treatment Tracking**: Chemotherapy, surgery, radiation therapy management  
- **Appointment System**: Scheduling and calendar integration
- **Role-Based Access**: Doctor, Nurse, Staff, Admin permissions
- **Clinical Workflow**: Complete treatment lifecycle management

### API Services Architecture
All backend integration follows a consistent pattern:
```typescript
// Each service exports typed functions for CRUD operations
export const patientService = {
  getPatients: (params) => Promise<Patient[]>,
  createPatient: (data) => Promise<Patient>,
  updatePatient: (id, data) => Promise<Patient>,
  deletePatient: (id) => Promise<void>
}
```

## Development Environment

### Environment Configuration
- **Local Development**: Uses `.env.local` file
- **Backend URL**: `NEXT_PUBLIC_API_BASE_URL=http://localhost:5145`
- **Hot Reload**: Automatic on file changes

### Authentication Flow
1. User logs in via main page (login form)
2. JWT token stored in localStorage
3. All API requests include `Authorization: Bearer {token}` header
4. Role-based page access control in components

### Testing Strategy
- **E2E Testing**: Playwright tests in `tests/` directory
- **Test Configuration**: Runs against `http://localhost:3000`
- **Browser Support**: Chrome, Firefox, Safari (WebKit)
- **CI/CD Ready**: Configured for CI environments

## Important Development Notes

### API Integration Patterns
- All API services use consistent error handling
- JWT tokens automatically included in requests
- TypeScript interfaces match backend DTOs exactly
- Services handle both success and error responses gracefully

### Component Development
- UI components in `src/components/ui/` follow Radix UI patterns  
- Form validation uses React Hook Form + Zod schemas
- State management through React hooks (no external state library)
- Responsive design using Tailwind breakpoint classes

### PWA Considerations
- Service worker handles offline functionality automatically
- Install prompts managed by `PWAInstallBanner` component
- Offline fallback page at `/offline`
- Cache strategies configured in `next.config.js`

### Role-Based Features
When developing role-restricted features, follow this pattern:
```typescript
const allowedRoles = ['Doctor', 'Staff', 'Admin'];
if (!allowedRoles.includes(userRole)) {
  // Show access denied message
  return;
}
```

### Medical Data Handling
- Patient data includes demographics, phone numbers, medical history
- Treatment data tracks therapy types, dosages, schedules, side effects
- All clinical data follows healthcare data standards
- Audit trails maintained for regulatory compliance

## Backend Dependencies

This frontend expects a running ASP.NET Core backend with these endpoints:
- `/api/auth/login` - Authentication
- `/api/patients/*` - Patient management
- `/api/treatments/*` - Treatment management  
- `/api/appointments/*` - Appointment scheduling
- `/api/notifications/*` - User notifications
- `/api/doctors/*` - Doctor/provider management
- `/api/investigations/*` - Lab results and imaging

The backend should be running on `http://localhost:5145` for local development.
