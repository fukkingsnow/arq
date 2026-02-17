# Development Environment Configuration

## Project Location

**Local Project Path (Windows):**
```
D:\arq
```

**Git Repository:**
```
https://github.com/fukkingsnow/arq
```

## Quick Start Commands

### Navigate to Project
```powershell
cd D:\arq
```

### Install Dependencies
```powershell
npm install
```

### Build Project
```powershell
npm run build
```

### Run Development Server
```powershell
npm run start:dev
```

### Run Production Server
```powershell
npm run start
```

## API Configuration

**Backend URL:** `http://localhost:8000`
**API Prefix:** `/api/v1`
**Port:** `8000`

## Key Files

- **Source:** `src/`
- **Documentation:** `docs/`
- **Database:** PostgreSQL on `localhost:5432` (or `5433` if remapped)
- **Cache:** Redis on `localhost:6379`

## Development Notes

- Always rebuild after code changes: `npm run build`
- Development server supports hot reload with `npm run start:dev`
- Port 8000 must remain fixed (no changes allowed)
- If port conflicts exist, kill interfering processes

## Next Steps

1. Navigate to project: `cd D:\arq`
2. Install dependencies: `npm install` (if not done)
3. Build: `npm run build`
4. Start dev server: `npm run start:dev`
5. API will be available at: `http://localhost:8000/api/v1`
