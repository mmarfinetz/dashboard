# Marketing Insights Dashboard - Development Guide

## Build/Run Commands
- `npm run dev` - Start development server (frontend)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint to check for code issues
- `npm run preview` - Preview production build locally
- `npm run server` - Run backend API server
- `npm run dev:all` - Run frontend and backend concurrently
- `npx vitest <file>` - Run a single test file
- `npx vitest run` - Run all tests
- `npx nodemon server/server.js` - Run server with auto-reload

## Code Style Guidelines
- **Formatting**: 2 space indentation, semicolons required
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Components**: React functional components with hooks
- **Imports Order**: React core, third-party libraries, local components, styles
- **State Management**: React hooks for component state (useState, useEffect)
- **Error Handling**: try/catch for async with detailed error messages
- **API Integration**: Dedicated service modules with consistent error handling
- **Documentation**: JSDoc style comments for functions
- **Styling**: TailwindCSS for responsive UI with utility classes
- **Charts**: Recharts library for data visualizations

## Project Structure
- **Frontend**: React/Vite application with TailwindCSS
- **Backend**: Express server with API endpoints
- **server/services/**: API integrations (Google Ads, Facebook)
- **server/utils/**: Helper functions for data processing
- **Dashboard.jsx**: Parent component with marketing platforms tabs
- **FacebookDashboard.jsx**: Facebook metrics with charts

## Common Patterns
- Data transformation with map/reduce for API responses
- Filtering data with date ranges (7/30/all days)
- Responsive chart implementation with dynamic resizing
- Mock data generation for development and testing