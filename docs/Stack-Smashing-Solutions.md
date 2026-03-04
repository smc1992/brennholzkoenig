# Stack Smashing Error - Comprehensive Solutions

## Problem Description

The Docker build fails with:
```
*** stack smashing detected ***: terminated
/bin/bash: line 1: 9 Aborted (core dumped) sudo apt-get update
ERROR: process "/bin/bash -ol pipefail -c sudo apt-get update && sudo apt-get install -y --no-install-recommends curl wget" did not complete successfully: exit code: 134
```

## Root Cause

Nixpacks automatically tries to install additional packages via `apt-get`, which causes a stack smashing error in certain environments. This is a known issue with specific Nixpacks versions and Ubuntu base images.

## Solution Hierarchy (Try in Order)

### Solution 1: Minimal Nixpacks Configuration

**File:** `nixpacks-minimal.toml`

```toml
[phases.setup]
nixPkgs = ["nodejs_18"]

[phases.install]
cmds = [
  "npm config set fund false",
  "npm config set audit false",
  "npm ci --only=production --no-optional"
]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"

[variables]
NODE_ENV = "production"
PORT = "3000"
NEXT_TELEMETRY_DISABLED = "1"
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
NPM_CONFIG_PRODUCTION = "true"
NPM_CONFIG_FUND = "false"
NPM_CONFIG_AUDIT = "false"
NPM_CONFIG_UPDATE_NOTIFIER = "false"

[providers]
apt = false
```

**Usage:**
1. Rename current `nixpacks.toml` to `nixpacks-backup.toml`
2. Rename `nixpacks-minimal.toml` to `nixpacks.toml`
3. Deploy again

### Solution 2: Standard Alpine Dockerfile

**File:** `Dockerfile.alpine`

Use the existing Alpine-based Dockerfile which avoids Nixpacks entirely:

```bash
# In your deployment platform, specify:
# Dockerfile: Dockerfile.alpine
```

### Solution 3: Node.js-Only Dockerfile

**File:** `Dockerfile.node`

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
```

### Solution 4: Platform-Specific Configurations

#### For Railway:
```bash
# Use nixpacks-minimal.toml
# Set environment variable: NIXPACKS_CONFIG_FILE=nixpacks-minimal.toml
```

#### For Vercel:
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

#### For Netlify:
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"
  NEXT_TELEMETRY_DISABLED = "1"
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
```

#### For DigitalOcean App Platform:
```yaml
# .do/app.yaml
name: brennholzkoenig
services:
- name: web
  source_dir: /
  github:
    repo: your-repo
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: NEXT_TELEMETRY_DISABLED
    value: "1"
  - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
    value: "true"
```

## Troubleshooting Steps

### Step 1: Check Current Configuration
```bash
# Verify current nixpacks.toml
cat nixpacks.toml

# Check for any custom Dockerfile
ls -la Dockerfile*
```

### Step 2: Clean Build
```bash
# Clear any cached builds
# Platform-specific commands vary
```

### Step 3: Test Locally
```bash
# Test with Docker locally
docker build -f Dockerfile.alpine -t test-build .
docker run -p 3000:3000 test-build
```

### Step 4: Environment Variables

Ensure these are set in your deployment platform:
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
NPM_CONFIG_PRODUCTION=true
```

## Platform Migration Guide

If the current platform continues to have issues:

### Recommended Platforms:
1. **Vercel** (Best for Next.js)
2. **Netlify** (Good alternative)
3. **Railway** (With custom Dockerfile)
4. **DigitalOcean App Platform** (Reliable)

### Migration Checklist:
- [ ] Export environment variables
- [ ] Update DNS settings
- [ ] Test deployment with minimal config
- [ ] Verify all features work
- [ ] Update CI/CD if applicable

## Success Indicators

Your deployment is successful when:
- [ ] Build completes without stack smashing errors
- [ ] Application starts on specified port
- [ ] All pages load correctly
- [ ] PDF generation works (if using Puppeteer)
- [ ] Database connections are stable

## Emergency Fallback

If all else fails, use this minimal package.json script:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT",
    "deploy": "npm run build && npm run start"
  }
}
```

And deploy with basic Node.js buildpack without Nixpacks.