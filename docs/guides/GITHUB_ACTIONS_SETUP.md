# GitHub Actions Deployment Setup

## Quick Setup Guide

### 1. Get Vercel Secrets

You'll need to gather these 4 secrets from Vercel:

#### A. VERCEL_TOKEN
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name like "GitHub Actions"
4. Copy the token

#### B. VERCEL_ORG_ID
**Your value**: `team_BsORABKeULvzhE8sYWJSopdD`

#### C. VERCEL_PROJECT_ID_FRONTEND
**Your value**: `prj_djEWUWp8D8QGXdWLtD1TOp6BvngC`

#### D. VERCEL_PROJECT_ID_BACKEND
**Your value**: `prj_zH9Rv7bvMkhtydELqoGIrgFaa8bx`

### 2. Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:
   - Name: `STORYHOUSE_GHA_VERCEL` → Value: (your token) ✅ Already added!
   - Name: `VERCEL_ORG_ID` → Value: `team_BsORABKeULvzhE8sYWJSopdD`
   - Name: `VERCEL_PROJECT_ID_FRONTEND` → Value: `prj_djEWUWp8D8QGXdWLtD1TOp6BvngC`
   - Name: `VERCEL_PROJECT_ID_BACKEND` → Value: `prj_zH9Rv7bvMkhtydELqoGIrgFaa8bx`

### 3. Test the Deployment

1. Go to Actions tab in GitHub
2. Find "🚀 Deploy to Vercel (Manual/PR)"
3. Click "Run workflow"
4. Choose which apps to deploy:
   - Deploy frontend: ✓
   - Deploy backend: ✓
5. Click "Run workflow"

### 4. Monitor Deployment

- Watch the workflow progress in the Actions tab
- Each deployment will show its URL when complete
- Check both:
  - Frontend: https://storyhouse.vip
  - Backend: https://api.storyhouse.vip

## Workflow Features

- **Manual Trigger**: Deploy on demand
- **PR Previews**: Automatic preview deployments for pull requests
- **Smart Detection**: Only deploys changed apps
- **Production Ready**: Deploys with `--prod` flag

## Troubleshooting

If deployment fails:
1. Check the workflow logs in GitHub Actions
2. Verify all 4 secrets are set correctly
3. Ensure Vercel projects exist for both apps
4. Check that the token has deployment permissions

## Next Steps

Once working, you can:
- Enable the CI workflow for automated testing
- Set up branch protection rules
- Configure deployment environments in GitHub