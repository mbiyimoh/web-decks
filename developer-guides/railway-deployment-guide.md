# Railway Deployment Guide

This guide covers deploying the web-decks application to Railway, including configuration, troubleshooting, and common operations.

## 0. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │    GitHub        │                                                    │
│  │   Repository     │                                                    │
│  └────────┬────────┘                                                    │
│           │ Push to main                                                │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     RAILWAY PLATFORM                             │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ 1. BUILD PHASE (Nixpacks)                               │    │   │
│  │  │    ├── Detects Next.js project                          │    │   │
│  │  │    ├── npm install                                      │    │   │
│  │  │    ├── npm run build                                    │    │   │
│  │  │    └── Creates container image                          │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                          │                                       │   │
│  │                          ▼                                       │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ 2. DEPLOY PHASE                                         │    │   │
│  │  │    ├── Starts container                                 │    │   │
│  │  │    ├── Runs: next start -H 0.0.0.0 -p $PORT            │    │   │
│  │  │    ├── Waits for health check (/api/health)            │    │   │
│  │  │    └── Routes traffic to container                      │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                          │                                       │   │
│  │                          ▼                                       │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ 3. RUNTIME                                              │    │   │
│  │  │    ├── Edge proxy receives requests                     │    │   │
│  │  │    ├── Routes to container on internal port             │    │   │
│  │  │    ├── Container serves Next.js app                     │    │   │
│  │  │    └── Health checks every 30s                          │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Environment Variables:                                                 │
│  ├── PORT (auto-provided by Railway)                                   │
│  ├── SESSION_SECRET (manual - 32-byte hex)                             │
│  ├── TRADEBLOCK_PASSWORD (manual - client password)                    │
│  ├── PLYA_PASSWORD (manual - client password)                          │
│  └── NEXT_PUBLIC_BASE_URL (optional - for OG images)                   │
│                                                                         │
│  Production URL: https://web-decks-production.up.railway.app           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1. Dependencies & Key Functions

### External Services

| Service | Purpose |
|---------|---------|
| Railway | Hosting, CI/CD, environment management |
| GitHub | Source control, triggers deployments |
| Nixpacks | Build system (auto-detects Next.js) |

### Configuration Files

| File | Purpose |
|------|---------|
| `railway.toml` | Deployment configuration |
| `package.json` | Build scripts, dependencies |
| `next.config.js` | Next.js configuration |
| `.env.example` | Environment variable template |

### Environment Variables

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `PORT` | Yes | Railway (auto) | Dynamically assigned port |
| `SESSION_SECRET` | Yes | Manual | 32-byte hex for session encryption |
| `TRADEBLOCK_PASSWORD` | Yes | Manual | Tradeblock portal password |
| `PLYA_PASSWORD` | Yes | Manual | PLYA portal password |
| `NEXT_PUBLIC_BASE_URL` | No | Manual | Base URL for OG images |
| `NODE_ENV` | Yes | Railway (auto) | Set to "production" |

## 2. User Experience Flow

### Deployment Workflow

1. **Developer pushes to main branch**
2. **Railway detects push** → triggers build
3. **Nixpacks builds** → `npm install` + `npm run build`
4. **Container starts** → runs `next start -H 0.0.0.0 -p $PORT`
5. **Health check passes** → `/api/health` returns 200
6. **Traffic routed** → app is live

### Manual Deployment

```bash
# From project directory (after railway link)
railway up

# Deploy without following logs
railway up --detach
```

### Viewing Status

```bash
# Current deployment status
railway status

# Live deployment logs
railway logs

# Build logs
railway logs -b
```

## 3. File & Code Mapping

### Critical Files

| File | Responsibility |
|------|----------------|
| `railway.toml` | **Master config** - start command, health check |
| `package.json` | Build script (`npm run build`), start fallback |
| `app/api/health/route.ts` | Health check endpoint |
| `app/layout.tsx` | Base URL for OG images |
| `.env.example` | Environment variable documentation |

### railway.toml Breakdown

```toml
# Build configuration
[build]
builder = "NIXPACKS"           # Auto-detect Next.js

# Deploy configuration
[deploy]
startCommand = "next start -H 0.0.0.0 -p $PORT"  # CRITICAL
healthcheckPath = "/api/health"                   # Must return 200
healthcheckTimeout = 100                          # Seconds
restartPolicyType = "ON_FAILURE"                  # Auto-restart
restartPolicyMaxRetries = 10                      # Max retries
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

**Requirements:**
- Must return HTTP 200
- Must not require authentication
- Must not redirect
- Must respond within timeout (100s)

## 4. Connections to Other Parts

### Build Dependencies

```
package.json scripts
    │
    ├── build: "next build"
    │   └── Compiles app, generates .next/
    │
    └── start: "next start -H 0.0.0.0 -p ${PORT:-3000}"
        └── Fallback if railway.toml missing
```

### Environment Variable Flow

```
Railway Dashboard / CLI
    │
    └──▶ Container Environment
            │
            ├──▶ process.env.PORT (runtime)
            ├──▶ process.env.SESSION_SECRET (lib/session.ts)
            ├──▶ process.env.TRADEBLOCK_PASSWORD (lib/clients.ts)
            ├──▶ process.env.PLYA_PASSWORD (lib/clients.ts)
            └──▶ process.env.NEXT_PUBLIC_BASE_URL (app/layout.tsx)
```

### Configuration Priority

```
1. railway.toml (highest priority)
2. Railway Dashboard settings
3. package.json scripts (fallback)
```

## 5. Critical Notes & Pitfalls

### The 502 Bad Gateway Problem

**Symptom:** App logs "Ready on http://localhost:3000" but all requests return 502.

**Root cause:** Next.js binds to `localhost` by default, which is only accessible from inside the container. Railway's proxy routes traffic to `0.0.0.0`.

**Solution:** Always use `-H 0.0.0.0`:
```toml
startCommand = "next start -H 0.0.0.0 -p $PORT"
```

**What you'll see in logs:**
```
# WRONG (causes 502)
Ready on http://localhost:3000

# CORRECT (works)
Ready on http://0.0.0.0:8080
```

### Health Check Requirements

| Requirement | Why |
|-------------|-----|
| Return HTTP 200 | Railway expects 200, not 204 or 30x |
| No authentication | Health checks come from `healthcheck.railway.app` |
| No HTTPS redirect | Health checks use HTTP internally |
| Fast response | Default timeout is 100 seconds |

**Middleware must not block health checks:**
```typescript
// middleware.ts - health check path excluded
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
```

### Environment Variable Gotchas

1. **SESSION_SECRET must be exactly 32 bytes hex (64 characters)**
   ```bash
   # Generate correctly
   openssl rand -hex 32
   ```

2. **Don't hardcode PORT**
   ```typescript
   // WRONG
   const port = 3000;

   // CORRECT
   const port = process.env.PORT || 3000;
   ```

3. **NEXT_PUBLIC_ prefix for client-side vars**
   ```typescript
   // Only server-side (not exposed to browser)
   process.env.SESSION_SECRET

   // Available in browser
   process.env.NEXT_PUBLIC_BASE_URL
   ```

### Restart Policy

```toml
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

- App restarts automatically on crash
- Max 10 retries before giving up
- Prevents infinite restart loops
- Check logs if hitting retry limit

## 6. Common Development Scenarios

### Scenario 1: Initial Railway Setup

**Steps:**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   # OR
   brew install railway
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Link project:**
   ```bash
   cd /path/to/web-decks
   railway link
   # Select project from list
   ```

4. **Set environment variables:**
   ```bash
   railway variables --set "SESSION_SECRET=$(openssl rand -hex 32)"
   railway variables --set "TRADEBLOCK_PASSWORD=your_password"
   railway variables --set "PLYA_PASSWORD=your_password"
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

**Verification:**
```bash
# Check deployment
railway status

# View logs
railway logs

# Test health check
curl https://your-app.up.railway.app/api/health
```

### Scenario 2: Adding a New Client Password

**Steps:**

1. **Add to Railway:**
   ```bash
   railway variables --set "NEWCLIENT_PASSWORD=secure_password"
   ```

2. **Verify it's set:**
   ```bash
   railway variables | grep NEWCLIENT
   ```

3. **Redeploy** (if already deployed):
   ```bash
   railway redeploy
   ```

**Common mistakes:**
- Forgetting to add to Railway after local `.env`
- Typo in variable name (must match `lib/clients.ts`)

**Verification:**
- Visit the new client portal
- Enter password, should authenticate

### Scenario 3: Debugging 502 Errors

**Diagnostic steps:**

1. **Check start command in railway.toml:**
   ```bash
   cat railway.toml | grep startCommand
   # Must include -H 0.0.0.0 -p $PORT
   ```

2. **Check deployment logs:**
   ```bash
   railway logs
   # Look for "Ready on http://..." line
   # Should show 0.0.0.0, NOT localhost
   ```

3. **Check health endpoint:**
   ```bash
   curl -I https://your-app.up.railway.app/api/health
   # Should return HTTP 200
   ```

4. **Check if requests reach container:**
   ```bash
   railway logs | grep -i "request\|error"
   # If no request logs, traffic isn't reaching container
   ```

5. **Check Railway dashboard:**
   - Service Settings → Networking → Target Port
   - Should be empty (use PORT env var) or match PORT

**Common fixes:**
- Add `-H 0.0.0.0` to start command
- Ensure health check endpoint exists
- Ensure middleware doesn't block health checks

### Scenario 4: Rolling Back a Deployment

**Steps:**

1. **View deployment history:**
   - Go to Railway Dashboard
   - Select service
   - Click "Deployments" tab
   - Find previous working deployment

2. **Rollback:**
   - Click on previous deployment
   - Click "Redeploy" button

**OR via git:**
```bash
# Revert commit
git revert HEAD
git push origin main
# Railway auto-deploys the revert
```

### Scenario 5: Viewing Production Logs

**Real-time logs:**
```bash
railway logs
```

**Build logs:**
```bash
railway logs -b
```

**Filter logs:**
```bash
railway logs | grep -i error
railway logs | grep -i "api/auth"
```

**Dashboard logs:**
- Go to Railway Dashboard
- Select service
- Click "Logs" tab
- Filter by: `@httpStatus:500`, `@path:/api/auth`

## 7. Testing Strategy

### Pre-Deployment Checklist

- [ ] `npm run build` succeeds locally
- [ ] `npm run start` works locally
- [ ] `/api/health` returns 200
- [ ] All env vars documented in `.env.example`
- [ ] No hardcoded localhost URLs
- [ ] No hardcoded port numbers

### Post-Deployment Checklist

- [ ] Health check passes (no 502)
- [ ] Landing page loads
- [ ] Client portal login works
- [ ] Protected routes require authentication
- [ ] OG images generate correctly

### Smoke Tests

```bash
# Health check
curl https://your-app.up.railway.app/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Landing page
curl -I https://your-app.up.railway.app/
# Expected: HTTP 200

# Protected route redirect
curl -I https://your-app.up.railway.app/client-portals/plya/project-proposal
# Expected: HTTP 307 redirect to /client-portals/plya

# Auth endpoint
curl -X POST https://your-app.up.railway.app/api/auth/plya \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'
# Expected: {"error":"Invalid password"}
```

### Debugging Tips

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| 502 Bad Gateway | Wrong host binding | Start command has `-H 0.0.0.0` |
| 500 on login | Missing env var | `railway variables` |
| Build fails | Dependency issue | `railway logs -b` |
| Infinite restarts | App crash | `railway logs`, check for errors |
| Slow cold starts | Large bundle | Consider ISR caching |

## 8. Quick Reference

### Railway CLI Commands

| Command | Purpose |
|---------|---------|
| `railway login` | Authenticate CLI |
| `railway link` | Link directory to project |
| `railway up` | Deploy from local |
| `railway up --detach` | Deploy without following logs |
| `railway logs` | View deployment logs |
| `railway logs -b` | View build logs |
| `railway status` | View deployment status |
| `railway variables` | List env vars |
| `railway variables --set "KEY=value"` | Set env var |
| `railway redeploy` | Redeploy current version |
| `railway domain` | View/configure domains |
| `railway shell` | SSH into container |
| `railway run <cmd>` | Run command with Railway env |

### Configuration Summary

**railway.toml:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "next start -H 0.0.0.0 -p $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Required env vars:**
```bash
SESSION_SECRET=<64 hex characters>
TRADEBLOCK_PASSWORD=<password>
PLYA_PASSWORD=<password>
```

**Optional env vars:**
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Critical Files Checklist

1. `railway.toml` - Deployment configuration
2. `package.json` - Build/start scripts
3. `app/api/health/route.ts` - Health check endpoint
4. `.env.example` - Environment variable documentation
5. `app/layout.tsx` - Base URL configuration

### URLs

| Environment | URL |
|-------------|-----|
| Production | `https://web-decks-production.up.railway.app` |
| Health check | `https://[app].up.railway.app/api/health` |
| Railway Dashboard | `https://railway.app/project/[id]` |

### Common Constants

| Constant | Value | Rationale |
|----------|-------|-----------|
| Health check timeout | 100s | Allow for cold starts |
| Max restart retries | 10 | Prevent infinite loops |
| Session expiry | 7 days | User convenience |
| PORT | Dynamic | Railway assigns at runtime |
