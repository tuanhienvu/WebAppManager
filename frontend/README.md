# WebApp Manager - Frontend

Next.js frontend application for the WebApp Manager.

## Tech Stack

- **Framework:** Next.js 16
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── pages/           # Next.js pages
│   │   ├── _app.tsx     # App wrapper
│   │   ├── _document.tsx # HTML document
│   │   ├── index.tsx    # Home page
│   │   ├── login.tsx    # Login page
│   │   ├── settings.tsx # Settings page
│   │   ├── tokens.tsx   # Tokens page
│   │   ├── versions.tsx # Versions page
│   │   ├── audit-logs.tsx # Audit logs page
│   │   ├── permissions.tsx # Permissions page
│   │   └── api-docs.tsx # API documentation
│   │
│   ├── components/      # React components
│   │   ├── Layout.tsx   # Main layout
│   │   ├── Logo.tsx     # Logo component
│   │   ├── Modal.tsx    # Modal component
│   │   ├── MessagePopup.tsx # Message popup
│   │   ├── LanguageSwitcher.tsx # Language selector
│   │   └── icons/       # Icon components
│   │
│   ├── contexts/        # React contexts
│   │   └── LanguageContext.tsx # i18n context
│   │
│   ├── hooks/           # Custom React hooks
│   │   └── useCurrentUser.ts # User authentication hook
│   │
│   ├── lib/             # Utilities
│   │   ├── api-client.ts # API fetch wrapper
│   │   ├── auth-session.ts # Session utilities
│   │   ├── authorization.ts # Permission system
│   │   ├── translations.ts # i18n translations
│   │   ├── date-format.ts # Date formatting
│   │   └── prisma-constants.ts # Shared constants
│   │
│   ├── styles/          # CSS styles
│   │   └── globals.css  # Global styles
│   │
│   └── types/           # TypeScript types
│       └── company.ts   # Company types
│
├── public/              # Static assets
│   ├── favicon.ico
│   ├── Logo.jpg
│   └── uploads/         # Uploaded files
│
├── next.config.ts       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.mjs   # PostCSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Features

### 🔐 Authentication
- Login/logout functionality
- Session-based authentication
- Protected routes with `withAuth` HOC

### 👥 User Management
- View and manage users
- Role-based access control (Admin, Manager, User)
- User permissions

### 📦 Software Management
- Create, read, update, delete software entries
- Track software versions
- Manage access tokens

### 🎫 Token Management
- Generate access tokens
- Validate tokens
- Track token usage

### 📊 Audit Logs
- View system activity logs
- Filter by action and token

### ⚙️ Settings
- Company profile
- Contact information
- Social media links

### 🌐 Internationalization
- English and Vietnamese support
- Language switcher component
- Translations in `lib/translations.ts`

## Pages

### Public Pages
- `/login` - Login page

### Protected Pages
All other pages require authentication:
- `/` - Dashboard
- `/settings` - Settings
- `/tokens` - Token management
- `/versions` - Version management
- `/audit-logs` - Audit logs
- `/permissions` - Permission management
- `/privacy` - Privacy policy
- `/api-docs` - API documentation

## API Integration

The frontend communicates with the backend API using the `api-client.ts` utility:

```typescript
import { apiFetch } from '@/lib/api-client';

// Example API call
const response = await apiFetch('/api/software', {
  method: 'GET',
  credentials: 'include', // Important for cookies
});
```

### API Base URL

The API base URL is configured via `NEXT_PUBLIC_API_BASE_URL` environment variable:

- **Development:** `http://localhost:5000`
- **Production:** Set to your backend API URL

## Styling

The app uses Tailwind CSS 4 for styling:

- Utility-first CSS framework
- Responsive design
- Dark mode support (can be enabled)
- Custom configurations in `tailwind.config.js`

## Authentication Flow

1. User visits protected page
2. `withAuth` HOC checks for session
3. If no session, redirect to `/login`
4. User logs in via `/api/auth/login`
5. Backend sets session cookie
6. User is redirected to requested page

## Protected Routes

Use the `withAuth` HOC to protect pages:

```typescript
import { withAuth } from '@/lib/auth-session';

export const getServerSideProps = withAuth(async (context) => {
  // Page logic here
  return { props: {} };
});
```

## Components

### Layout
Main layout component with navigation, header, and footer.

### Modal
Reusable modal component for forms and dialogs.

### MessagePopup
Toast-style notifications for success/error messages.

### LanguageSwitcher
Toggle between English and Vietnamese.

## Hooks

### useCurrentUser
Custom hook to get current user from session:

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';

function MyComponent() {
  const { user, isLoading, error } = useCurrentUser();
  // ...
}
```

## Internationalization

The app supports multiple languages:

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return <h1>{t('welcome')}</h1>;
}
```

Add translations in `src/lib/translations.ts`.

## Build and Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in `.next/` directory.

### Start Production Server

```bash
npm start
```

### Deploy to Vercel

The easiest way to deploy is to use Vercel:

1. Connect your repository to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` - Your backend API URL
3. Deploy

### Deploy to Other Platforms

You can also deploy to:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Any Node.js hosting service

Make sure to set the `NEXT_PUBLIC_API_BASE_URL` environment variable.

## Troubleshooting

### API Calls Failing
- Check `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Verify backend is running
- Check browser console for CORS errors

### Styles Not Loading
- Clear `.next` directory and rebuild
- Check `tailwind.config.js` paths

### Session Not Persisting
- Ensure `credentials: 'include'` is set in fetch calls
- Check cookie settings in browser
- Verify backend CORS configuration

## Development Tips

1. Use React DevTools for debugging
2. Check Network tab for API calls
3. Use `console.log` for debugging (remove in production)
4. Hot reload works automatically in dev mode
5. TypeScript will catch many errors before runtime

