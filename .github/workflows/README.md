# CI/CD Setup for StoryHouse.vip

This repository uses GitHub Actions for automated deployment to Vercel with proper monorepo support.

## Workflow Overview

The `deploy.yml` workflow provides:
- **Change Detection**: Only deploys apps that have changes
- **Dependency Building**: Automatically builds shared packages before app deployment
- **Production Deployments**: Deploys to production on main branch pushes
- **Preview Deployments**: Creates preview deployments for pull requests

## Required Secrets

Set these secrets in your GitHub repository settings:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID_FRONTEND=frontend_project_id
VERCEL_PROJECT_ID_BACKEND=backend_project_id
```

## How to Get Vercel Secrets

1. **VERCEL_TOKEN**: 
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token with deployment permissions

2. **VERCEL_ORG_ID**:
   - Run `vercel` in your project and check `.vercel/project.json`
   - Or find it in your Vercel dashboard URL

3. **PROJECT_IDs**:
   - Import your projects to Vercel
   - Get IDs from project settings or `.vercel/project.json`

## Trigger Conditions

### Production Deployments
- Push to `main` branch
- Only if files in relevant directories changed:
  - Frontend: `apps/frontend/**` or `packages/shared/**`
  - Backend: `apps/backend/**` or `packages/shared/**`

### Preview Deployments
- Pull requests to `main` branch
- Deploys both frontend and backend for testing

## Build Process

1. **Install Dependencies**: `npm ci` from repository root
2. **Build Shared Package**: Compiles TypeScript in `packages/shared`
3. **Build App**: Compiles the specific app with shared package available
4. **Deploy**: Uses Vercel CLI to deploy built artifacts

## Manual Deployment

You can still deploy manually using:

```bash
# Frontend
npm run deploy

# Backend  
npm run deploy:backend

# Both apps
npm run build && npm run deploy && npm run deploy:backend
```

## Troubleshooting

- **Build Failures**: Check that shared package builds first
- **Import Errors**: Verify tsconfig.json path mappings are correct
- **Deploy Failures**: Ensure Vercel tokens have correct permissions