# Expense Tracker - Next.js Frontend

A modern frontend for the Expense Tracker application built with Next.js 16.

## Tech Stack

- **Framework:** Next.js 16 with Turbopack
- **Styling:** Tailwind CSS v4
- **Data Fetching:** React Server Components
- **Auth:** Auth.js (NextAuth) + Backend JWT
- **State Management:** Zustand
- **Validation:** Zod
- **Charts:** Recharts
- **2FA:** Speakeasy (TOTP-RFC4226) for admin
- **Notifications:** React Hot Toast

## Features

### User Features (matches mobile app)
- Login/Register with email & password
- Dashboard with monthly overview and analytics
- Expense management (CRUD operations)
- Category-based expense tracking
- Group management for shared expenses
- Expense history with search and filtering
- Profile management
- Dark/Light/System theme support


## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create `.env.local` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-min-32-chars
   NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
   ADMIN_2FA_SECRET=your-admin-2fa-secret
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   └── auth/[...nextauth]/  # Auth.js configuration
│   │   ├── admin/           # Admin routes
│   │   │   ├── login/       # Admin login with 2FA
│   │   │   └── dashboard/   # Admin dashboard
│   │   ├── expenses/        # Expense pages
│   │   ├── groups/          # Group pages
│   │   ├── history/         # Expense history
│   │   ├── profile/         # User profile
│   │   └── login/          # User login/register
│   ├── components/
│   │   ├── charts/          # Recharts components
│   │   ├── layout/         # AppShell navigation
│   │   └── ui/             # Reusable UI components
│   ├── lib/
│   │   ├── api.ts          # Backend API client
│   │   ├── axios.ts        # Axios instance with interceptors
│   │   └── admin-2fa.ts   # 2FA utilities (speakeasy)
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript types
├── middleware.ts            # Route protection
└── next.config.ts          # Next.js configuration
```

## Admin 2FA Setup

1. Navigate to `/admin/login`
2. Enter admin credentials (configure in the page or via env vars)
3. Set up 2FA:
   - Click "Setup 2FA"
   - Scan QR code with authenticator app
   - Or manually enter the secret key
   - Verify with 6-digit code from app

## Theme System

The app uses a custom theme matching the mobile app's design:
- **Primary:** `#7C5CFA` (Purple)
- **Accent:** `#FF7A45` (Orange)
- **Background:** `#F6F4FB` (Light) / `#120F1D` (Dark)

Theme can be toggled via the profile page or the sun/moon icon in the header.

## API Integration

The frontend connects to the existing Express.js backend:
- All API calls go through `/api/v1` endpoints
- JWT tokens are stored in localStorage and attached via Axios interceptors
- Automatic token refresh on 401 errors
- Supports all backend features: auth, expenses, groups, analytics

## Build

```bash
npm run build
```

The build uses Turbopack for 5x-10x faster compilation.

## License

MIT
