# ARQ Development Dashboard

## Overview
Modular React TypeScript dashboard for ARQ development platform with real-time task monitoring, API testing, and task management.

## Project Structure

```
src/frontend/dashboard/
├── index.tsx              # Main app entry point with tab navigation
├── ARQDashboard.tsx       # Real-time task monitoring component
├── APITester.tsx          # Interactive API testing interface
├── TaskCreator.tsx        # Task creation form component
└── README.md              # This file
```

## Components

### index.tsx
Main application wrapper that provides:
- Tabbed navigation (Dashboard/API Tester/Create Task)
- Server health status monitoring
- Layout with header, nav, main content, footer

### ARQDashboard.tsx
Real-time task monitoring:
- Fetches tasks from `/api/v1/arq/tasks`
- Health monitoring from `/api/v1/arq/health`
- Auto-refresh every 5 seconds
- Task status visualization
- System metrics display

### APITester.tsx
Interactive API testing tool:
- Supports GET/POST/PUT/DELETE methods
- JSON body editor for mutations
- Response display with timing
- Real-time API endpoint testing

### TaskCreator.tsx
Task creation interface:
- Description textarea input
- Priority selector (low/medium/high)
- POST to `/start-development` endpoint
- Success/error notifications

- ### TaskMonitor.tsx

Real-time task monitoring component:

- Fetches tasks from `/api/v1/arq/tasks`
- Auto-refresh every 1-10 seconds (configurable)
- Task status visualization (running/completed/failed)
- Iteration progress display
- Collapsible detailed task info
- Task metrics display (files changed, lines added, code quality)

## Installation

### Prerequisites
- Node.js 14+
- React 17+
- TypeScript 4+

### Setup

```bash
# Install dependencies in project root
npm install

# Compile TypeScript
npm run build

# Start development server (if configured)
npm start
```

## API Integration

### Base URL
`https://arq-ai.ru/api/v1/arq`

### Endpoints Used
- `GET /health` - Server health check
- `GET /tasks` - List all tasks
- `POST /start-development` - Create new task

## Environment Variables

If needed, create `.env` file:

```
REACT_APP_API_BASE_URL=https://arq-ai.ru/api/v1/arq
REACT_APP_REFRESH_INTERVAL=5000
```

## Development

### Hot Reload
Dashboard components support hot reloading during development. Simply edit component files and save.

### TypeScript Checking
```bash
npx tsc --noEmit
```

### Building for Production
```bash
npm run build
```

## Features

✅ Real-time task monitoring
✅ API endpoint testing without Postman
✅ Task creation with priorities
✅ Server health status
✅ Responsive layout
✅ Auto-refresh data
✅ TypeScript type safety
✅ Error handling

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Task filtering and sorting
- [ ] User authentication
- [ ] Dark/Light mode toggle
- [ ] Export task data
- [ ] Advanced API testing (headers, auth)
- [ ] Logging and history
- [ ] Performance metrics

## Troubleshooting

### Server Offline Error
Ensure backend is running at `arq-ai.ru` and accessible

### CORS Issues
Backend must have CORS enabled for `localhost` and dashboard domain

### Tasks Not Loading
Check `/api/v1/arq/tasks` endpoint is working:
```bash
curl https://arq-ai.ru/api/v1/arq/tasks
```

## Contributing

When adding new components:
1. Follow existing folder structure
2. Use TypeScript interfaces
3. Add prop documentation
4. Test API integration
5. Update this README

## License

Part of ARQ Development Platform
