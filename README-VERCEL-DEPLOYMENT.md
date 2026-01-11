# Vercel Deployment Guide

## Steps to Deploy on Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts and your app will be deployed!

### Option 2: Deploy via Vercel Dashboard

1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect the settings
6. Click "Deploy"

## Important Notes

- The `vercel.json` file is already configured
- No environment variables needed for basic functionality
- The app will automatically work on Vercel's serverless platform

## After Deployment

Your app will be live at: `https://your-project-name.vercel.app`

Created by **Prince Malhotra**
