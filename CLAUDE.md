# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5.6 project using React 19.1.0, TypeScript, and Tailwind CSS v4. The project uses the App Router architecture and Turbopack for faster builds.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start
```

Development server runs on http://localhost:3000 by default.

## Architecture

**Framework**: Next.js with App Router (not Pages Router)
- All routes are defined in the `app/` directory
- Uses React Server Components by default
- `app/layout.tsx` is the root layout wrapping all pages
- `app/page.tsx` is the home page

**Styling**: Tailwind CSS v4 with PostCSS
- Global styles in `app/globals.css`
- Tailwind configured via `@tailwindcss/postcss` plugin in `postcss.config.mjs`
- Uses Geist and Geist Mono fonts from `next/font/google`

**TypeScript Configuration**:
- Path alias `@/*` maps to the root directory
- Strict mode enabled
- Target: ES2017

**Build Tool**: Turbopack is enabled for both dev and build scripts
