# Vercel Deployment Instructions

## 🚀 Prerequisites
1. Backend deployed on Render/Railway/Heroku with HTTPS URL
2. Environment variables configured

## 🔧 Environment Variables Setup
In Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## 📦 Build Configuration
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🛠️ Common Issues & Solutions

### Issue 1: Build Fails
**Solution**: Update build script from `tsc -b` to `tsc`

### Issue 2: API Calls Fail
**Solution**: Set `VITE_API_URL` environment variable in Vercel

### Issue 3: Routes Not Working
**Solution**: Updated `vercel.json` with proper rewrites

### Issue 4: CORS Issues
**Solution**: Backend CORS should allow Vercel domain

## ✅ Deployment Steps
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

## 🔍 Debugging
- Check Vercel Function Logs
- Verify environment variables
- Test API endpoints directly
- Check browser console for errors
