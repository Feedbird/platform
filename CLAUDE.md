# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Feedbird is a social media management platform built with Next.js 15, React 19, and TypeScript. It allows users to create, manage, and publish content across multiple social platforms including Facebook, Instagram, LinkedIn, Pinterest, YouTube, TikTok, and Google Business.

## Key Architecture Components

### State Management
- **Central Store**: `src/lib/store/use-feedbird-store.ts` - Zustand-based store managing workspaces, brands, boards, posts, and social connections
- **Persistence**: Uses sessionStorage for client-side state persistence with proper hydration handling
- **Loading States**: Centralized loading management via `src/lib/utils/loading/loading-store.ts`

### Multi-Platform Social Integration
- **Platform Abstraction**: `src/lib/social/platforms/` contains platform-specific implementations
- **OAuth Flow**: `src/app/api/oauth/[platform]/` handles authentication for each social platform
- **Media Processing**: `media-processing/conversion.ts` handles platform-specific media conversion and optimization
- **Publishing**: Platform-specific API routes in `src/app/api/social/[platform]/` for content publishing

### Content Management System
- **Boards**: Content organization system with customizable rules and templates
- **Posts**: Support for multi-version content with blocks, comments, and approval workflows
- **Media**: Supports images and videos with conversion for platform compliance
- **Versioning**: Complete version history with commenting system for collaboration

### UI Components
- **Design System**: Comprehensive component library in `src/components/ui/` using Radix UI primitives
- **Layout**: App shell with sidebar navigation (`src/components/layout/`)
- **Content Editing**: Rich content editing interfaces with preview capabilities
- **Data Tables**: Advanced table components for content management

## Development Commands

```bash
# Development server with Turbopack (faster builds)
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Lint code
npm run lint
```

## Key Environment Variables

The platform requires OAuth credentials for each social platform:
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI`
- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`
- `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`, `PINTEREST_REDIRECT_URI`
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`

## Media Processing

The platform includes sophisticated media processing capabilities:
- **Conversion**: Automatic conversion to platform-specific requirements (dimensions, codecs, bitrates)
- **Storage**: Integration with R2 storage for media hosting
- **Optimization**: Smart resizing and compression based on platform constraints
- **FFmpeg Integration**: Server-side video processing with fluent-ffmpeg

## Database and Storage

- **Client-side State**: Zustand store with sessionStorage persistence
- **Media Storage**: Cloudflare R2 for media files
- **No Traditional Database**: Uses client-side state management for data persistence

## Import Paths

- Uses TypeScript path mapping with `@/*` pointing to `./src/*`
- Absolute imports preferred over relative paths

## Platform-Specific Notes

- **TikTok**: Special handling for sandbox environment limitations
- **Pinterest**: Uses board-based organization system
- **Instagram**: Supports both personal and business account types
- **YouTube**: Requires Google OAuth with specific scopes
- **LinkedIn**: Company page publishing support

## Testing and Quality

- TypeScript strict mode enabled
- Next.js App Router with server components
- No test framework currently configured - consider adding Jest/Vitest for testing
- ESLint configuration via `next lint`