# Clerk Authentication Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZW5vdWdoLWdvc2hhd2stODMuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_Lx331dAvc1RPIpO0a6hnvAlvBFgAUNrYZGGcVQy8Aj
```

## Features Implemented

### 1. Authentication Flow
- **Unauthorized users**: See landing page without sidebar/header
- **Authorized users**: Access the full application with sidebar/header
- **Sign out**: Returns to landing page and clears user data

### 2. Landing Page (`/landing`)
- Beautiful, responsive landing page with your brand
- Sign-up and Sign-in buttons using Clerk's modal components
- Feature highlights and call-to-action sections
- Clean, modern design with gradient background
- **No sidebar or header** - clean standalone experience

### 3. User Management
- **Zustand Store Integration**: User data is stored in your existing Zustand store
- **Automatic Sync**: Clerk user data automatically syncs with your store
- **User Interface**: Added `User` interface to your store with methods:
  - `setUser(user: User | null)`
  - `clearUser()`

### 4. Sign Out Integration
- **Existing Button**: Connected your existing sign-out button in workspace switcher
- **Clerk Integration**: Uses Clerk's `signOut()` method
- **Store Cleanup**: Clears user data from Zustand store on sign out
- **Redirect**: Automatically redirects to landing page

### 5. Layout Management
- **Conditional Rendering**: Landing page shows without app components
- **Main App**: Full application with sidebar/header for authenticated users
- **Seamless Transition**: No page reloads, smooth authentication flow

## How It Works

1. **Layout** (`src/app/layout.tsx`): Conditionally renders landing page or main app
2. **User Sync** (`src/hooks/use-clerk-user-sync.ts`): Syncs Clerk user with Zustand store
3. **Landing Page** (`src/app/landing/page.tsx`): Public landing page for unauthorized users
4. **Workspace Switcher** (`src/components/workspace/workspace-switcher.tsx`): Sign out functionality
5. **Store** (`src/lib/store/use-feedbird-store.ts`): User management added to existing store

## Getting Started

1. Add the environment variables to `.env.local`
2. Restart your development server
3. Visit your app - unauthorized users will see the landing page
4. Sign up or sign in to access the main dashboard
5. Use the sign-out button in the workspace switcher to test the flow

## User Data Structure

The user data is stored in your Zustand store with this interface:

```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
}
```

## Customization

- Modify the landing page design in `src/app/landing/page.tsx`
- Update user data structure in `src/lib/store/use-feedbird-store.ts`
- Adjust authentication flow in `src/app/layout.tsx`
- Customize Clerk components and styling as needed

## Key Benefits

✅ **No Database Required**: Uses your existing Zustand store
✅ **Existing UI Preserved**: All your current components work unchanged
✅ **Clean Landing Page**: No sidebar/header for unauthorized users
✅ **Seamless Integration**: Works with your existing sign-out button
✅ **User Data Sync**: Automatic synchronization between Clerk and your store 