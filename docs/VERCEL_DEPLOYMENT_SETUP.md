# Vercel Deployment Setup Guide

## Problem
The CI/CD pipeline is failing with the error: "No existing credentials found. Please run 'vercel login' or pass '--token'"

## Solution
You need to add the following GitHub secrets to your repository:

### Required GitHub Secrets:
1. **VERCEL_TOKEN** - Your Vercel authentication token
2. **VERCEL_ORG_ID** - Your Vercel organization ID
3. **VERCEL_PROJECT_ID_FRONTEND** - The Vercel project ID for the frontend app
4. **VERCEL_PROJECT_ID_BACKEND** - The Vercel project ID for the backend app

### Steps to Fix:

#### 1. Get Your Vercel Token
```bash
# Install Vercel CLI locally if you haven't already
npm i -g vercel

# Login to Vercel
vercel login

# Generate a token at https://vercel.com/account/tokens
# Create a new token with full access
```

#### 2. Get Your Organization and Project IDs
```bash
# Navigate to your frontend directory
cd apps/frontend

# Link to Vercel project (if not already linked)
vercel link

# The .vercel/project.json file will contain orgId and projectId
cat .vercel/project.json

# Do the same for backend
cd ../backend
vercel link
cat .vercel/project.json
```

#### 3. Add Secrets to GitHub
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following repository secrets:
   - `VERCEL_TOKEN`: Your token from step 1
   - `VERCEL_ORG_ID`: `team_BsORABKeULvzhE8sYWJSopdD`
   - `VERCEL_PROJECT_ID_FRONTEND`: `prj_Sxfu83KdBmsYpLSlAodvZgCPeqFI`
   - `VERCEL_PROJECT_ID_BACKEND`: `prj_zH9Rv7bvMkhtydELqoGIrgFaa8bx`

#### 4. Verify Setup
After adding the secrets, re-run the failed workflow to verify the deployment works correctly.

## Alternative: Using Environment Variables in Vercel

If you prefer not to use the Vercel CLI in CI/CD, you can also:
1. Set up the projects manually in Vercel dashboard
2. Use Vercel's GitHub integration instead of the manual deployment workflow

## Troubleshooting
- Make sure the token has not expired
- Verify all 4 secrets are properly set in GitHub
- Check that the project IDs match the actual Vercel projects
- Ensure the Vercel projects exist and are properly configured