# Accessibility Intelligence Platform - Frontend

This is the frontend for the Accessibility Intelligence Platform, a civic technology project for SIH 2026.

## Overview

A Next.js-based web application that helps users discover evidence-backed accessibility information for venues across India.

**Key Principle:** This is NOT a generic "accessible places" directory. The platform focuses on:
- **WHERE** exactly accessibility exists (specific entrance/location)
- **WHAT** accessibility feature exists (specific attributes)
- **HOW** reliable the information is (verification status)
- **WHERE** the evidence came from (source/provenance)
- **WHEN** it was observed/verified (freshness)

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives + custom components
- **Icons:** Lucide React
- **Testing:** Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/Search page
│   ├── venues/[id]/       # Venue detail page
│   ├── nearby/            # Nearby venues page
│   └── about/             # About page
├── components/
│   ├── ui/                # Base UI primitives
│   ├── venue-card.tsx     # Venue display
│   ├── search-bar.tsx     # Search functionality
│   ├── map-view.tsx       # Map visualization
│   ├── accessibility-attributes.tsx
│   ├── evidence.tsx
│   ├── verification-badge.tsx
│   ├── report-form.tsx
│   └── layout.tsx         # Header, Footer
├── lib/
│   ├── api/
│   │   ├── types.ts       # API TypeScript types
│   │   └── client.ts      # API client
│   └── utils.ts           # Utility functions
└── __tests__/             # Test files
```

## Features

### Search & Discovery
- Text search for venues
- Category filters
- Location-based search
- Nearby venue discovery (geolocation)

### Venue Display
- Detailed venue information
- Accessibility attributes grouped by category
- Evidence with verification status
- Source hierarchy display
- Confidence indicators

### Accessibility Focus
- Semantic HTML
- Keyboard navigation
- Screen reader support
- Focus management
- Reduced motion support
- High contrast support

### Mobile Responsive
- Mobile-first design
- Touch-friendly interactions
- Responsive layouts
- Optimized for on-the-go use

## Demo Data

The frontend includes clearly marked demo data for development purposes. All demo venues and attributes are labeled with "DEMO DATA" to ensure they are not mistaken for real information.

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Integration

The frontend consumes the backend API as documented in `docs/API_CONTRACT.md`. The API client in `lib/api/client.ts` provides:

- Type-safe API methods
- Error handling
- Fallback to demo data when API is unavailable

## Known Limitations

1. **Map:** Placeholder implementation - real map provider integration pending
2. **Authentication:** Not implemented
3. **Real-time updates:** No WebSocket support
4. **Offline:** No service worker

## Accessibility Commitment

As a platform about accessibility, we prioritize:
- WCAG 2.1 AA compliance
- Semantic HTML5
- ARIA where needed
- Keyboard navigation
- Focus indicators
- Screen reader testing

## Contributing

This is part of a multi-agent SIH 2026 project:
- **OpenCode #1:** Backend/Database
- **OpenCode #2:** Frontend (this repository)
- **Claude:** Research/Data
- **User:** Integration/Architecture

## License

Internal Hackathon Project - SIH 2026
