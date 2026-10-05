# Pali Memorize Vue - Cloudflare Pages Deployment

This Vue.js project is configured for deployment on Cloudflare Pages with Workers.

## Project Structure

```
vue-project/
├── dist/                 # Build output for deployment
├── src/                  # Source code
├── functions/            # Cloudflare Workers functions
├── _redirects            # Redirect rules
├── _headers              # Custom headers
├── wrangler.toml         # Workers configuration
├── package.json          # Dependencies and scripts
└── vite.config.ts       # Vite build configuration
```

## Deployment Configuration

### Cloudflare Pages Configuration

1. **Build Command**: `npm run build`
2. **Build Output Directory**: `dist/`
3. **Root Directory**: `vue-project/`

### Cloudflare Workers Configuration

The project includes a Workers function (`functions/_redirects.js`) that:
- Handles static asset serving
- Adds security headers
- Supports client-side routing
- Provides proper caching strategies

### Security Headers

The project includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

## Deployment Steps

### Option 1: Using Cloudflare Pages Dashboard

1. Push your code to a Git repository
2. Connect the repository to Cloudflare Pages
3. Set the build command to `npm run build`
4. Set the output directory to `dist/`
5. Deploy

### Option 2: Using Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
npm run deploy

# Deploy to staging
npm run deploy:staging
```

### Option 3: Using GitHub Actions

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '22'
        cache: 'npm'
    - run: npm install
    - run: npm run build
    - uses: cloudflare/pages-action@v1
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        projectName: pali-memorize-vue
        directory: dist/
```

## Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- Vue 3 with TypeScript
- Vite for fast development and building
- Cloudflare Workers for serverless functions
- Static asset optimization
- Security headers
- Proper caching strategies
- Client-side routing support

## Environment Variables

Create a `.env` file for environment-specific variables:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_APP_NAME=Pali Memorize Vue
```

## Troubleshooting

### Build Issues

If you encounter build errors:
1. Ensure all dependencies are installed: `npm install`
2. Check TypeScript types: `npm run type-check`
3. Clear the build cache: `rm -rf dist/ node_modules/.vite`

### Deployment Issues

If deployment fails:
1. Check Cloudflare Pages logs
2. Verify build command and output directory
3. Ensure API tokens have proper permissions
4. Check for syntax errors in Workers functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build
5. Submit a pull request