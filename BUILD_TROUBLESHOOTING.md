# ARQ Build & Deployment Troubleshooting Guide

## Current Issue

**Status**: Deployment failing with exit code 217
**Error**: npm dependencies installation failure
**Location**: GitHub Actions workflow

## Root Cause Analysis

The deployment is failing during npm installation with status code 217. This typically indicates:

1. **Corrupted package-lock.json**
2. **Incompatible peer dependencies**
3. **Missing native dependencies**
4. **Out-of-memory during build**

## Solutions

### Solution 1: Clean npm Cache and Reinstall

```bash
# Local machine
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install

# Verify installation
npm list
```

### Solution 2: Force Update package-lock.json

```bash
# Update package lock
npm install --legacy-peer-deps

# Commit changes
git add package-lock.json
git commit -m "fix: Update package-lock.json for dependency compatibility"
```

### Solution 3: GitHub Actions Workflow Fix

Update `.github/workflows/deploy.yml`:

```yaml
name: Deploy ARQ to Beget Server
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci --legacy-peer-deps
          npm run build
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.BEGET_HOST }}
          username: ${{ secrets.BEGET_USERNAME }}
          key: ${{ secrets.BEGET_SSH_KEY }}
          script: |
            cd /path/to/arq
            git pull origin main
            npm ci --legacy-peer-deps
            npm run build
            pm2 restart arq || pm2 start npm --name "arq" -- start
```

### Solution 4: Dependency Version Management

**Update package.json with compatible versions:**

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@octokit/rest": "^20.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

## Deployment Checklist

- [ ] Clear npm cache locally
- [ ] Delete node_modules and package-lock.json
- [ ] Run npm install with --legacy-peer-deps
- [ ] Test build locally: `npm run build`
- [ ] Test start: `npm start`
- [ ] Update GitHub Actions workflow
- [ ] Commit changes: `git add . && git commit -m "fix: Resolve npm dependency issues"`
- [ ] Push to main: `git push origin main`
- [ ] Monitor GitHub Actions for successful deployment
- [ ] Verify production deployment

## Verification Steps

### Local Verification

```bash
# 1. Check Node version
node --version  # Should be v18+
npm --version   # Should be 9+

# 2. Install dependencies
npm ci --legacy-peer-deps

# 3. Build TypeScript
npm run build

# 4. Run application
npm start

# 5. Test endpoints
curl http://localhost:3000/arq/health
```

### Production Verification

```bash
# SSH into server
ssh user@arq-ai.ru

# Check application status
pm2 status arq

# Check logs
pm2 logs arq --lines 50

# Check port
netstat -tlnp | grep 3000

# Test endpoint
curl http://localhost:3000/arq/health
```

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 217 | npm install failure | Clear cache, use --legacy-peer-deps |
| 1 | General error | Check logs for specific error |
| 127 | Command not found | Ensure npm is installed |
| 128 | Memory exceeded | Increase available memory |

## Prevention Strategies

### 1. Dependency Lock
```bash
# Use npm ci instead of npm install in CI
npm ci --legacy-peer-deps
```

### 2. Node Version Management
```bash
# Use .nvmrc for consistent Node versions
echo "18.19.0" > .nvmrc
```

### 3. Regular Dependency Audits
```bash
npm audit
npm audit fix
```

### 4. Workspace Optimization
```bash
# Reduce build time
npm ci --omit=dev
npm run build
```

## GitHub Secrets Required

Ensure these secrets are configured in GitHub:

- `BEGET_HOST`: Your Beget server hostname
- `BEGET_USERNAME`: SSH username
- `BEGET_SSH_KEY`: SSH private key (use raw content, not file)
- `BEGET_SSH_PORT`: SSH port (usually 22)

## Support & Debugging

### Enable Verbose Logging

```bash
# Local debugging
npm install --verbose
npm run build --verbose

# GitHub Actions
# Add this to workflow:
env:
  DEBUG: '*'
```

### Check System Resources

```bash
# Check available memory
free -h

# Check disk space
df -h

# Check CPU
uptime
```

## Next Steps

1. **Immediate**: Implement Solution 1 (clean install)
2. **Short-term**: Update GitHub Actions workflow (Solution 3)
3. **Long-term**: Monitor deployment and maintain dependencies

## Monitoring

Set up alerts for:
- Deployment failures
- Build timeout (>10 min)
- High memory usage (>80%)
- Disk space (>90%)

---

**Last Updated**: December 23, 2025
**Status**: In Active Development
**Priority**: HIGH - Blocking production deployment
