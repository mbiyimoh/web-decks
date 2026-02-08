---
description: Push to GitHub and verify Railway deployment with automated error detection and fixing
category: workflow
allowed-tools: Bash(git:*), Bash(railway:*), Bash(curl:*), Read, Edit, Task
---

Push changes to GitHub and verify that Railway deployments complete successfully. If errors are detected, investigate and fix them, then repeat until clean deployment.

## Railway Service

This project has one Railway service:
- `web-decks` - Next.js 14 full-stack application (33strategies.ai)

## Workflow Steps

### Step 1: Push to GitHub

Check for uncommitted changes and push:

```bash
git status --porcelain && git push
```

If there are uncommitted changes, ask the user if they want to commit first (or use `/git:commit`).

### Step 2: Wait for Deployment

Railway auto-deploys on push. Wait ~30 seconds for deployment to start, then check logs:

```bash
sleep 30
```

### Step 3: Check Railway Logs

Check the service for errors:

```bash
railway logs --service web-decks 2>&1 | tail -50
```

Look for:
- Build failures (`error`, `ERR!`, `failed`)
- Runtime errors (`Error:`, `TypeError`, `Cannot find module`)
- Deployment issues (`exited`, `crashed`, `OOMKilled`)
- Successful indicators (`listening on`, `server running`, `Build succeeded`)

### Step 4: Error Handling

If errors are found:
1. Identify the root cause from logs
2. Fix the issue in code
3. Commit and push the fix
4. Return to Step 2 (wait and re-check)

Common issues:
- **Missing dependencies**: Check package.json, run `npm install`
- **TypeScript errors**: Check for type issues in the error stack
- **Environment variables**: Verify Railway env vars are set
- **Port binding**: Ensure server binds to `0.0.0.0` and uses `process.env.PORT`

### Step 5: Verify Health

Once logs show successful deployment, verify health endpoint:

```bash
# Health check (should return 200 with JSON response)
curl -s -o /dev/null -w "%{http_code}" https://web-decks-production.up.railway.app/api/health

# Or check the custom domain
curl -s -o /dev/null -w "%{http_code}" https://33strategies.ai/api/health
```

Expected results:
- HTTP 200 from health endpoint

### Step 6: Report

Provide a concise summary:
- Push status
- Deployment status
- Any errors encountered and fixes applied
- Final health check results

## Efficiency Notes

- Only show relevant log excerpts (errors and success indicators)
- Skip verbose explanations during iteration loops
- Report final status concisely
