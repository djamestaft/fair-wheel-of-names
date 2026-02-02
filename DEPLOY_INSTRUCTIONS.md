# Deploy to Vercel - Instructions

Vercel CLI login requires interactive terminal, so here's the easier way:

## Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/new
2. **Connect GitHub:** Click "Continue with GitHub"
3. **Import repository:** Select `djamestaft/fair-wheel-of-names`
4. **Configure project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./fair-wheel-of-names/`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add your Sanity credentials:
     ```
     NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
     NEXT_PUBLIC_SANITY_DATASET=production
     SANITY_API_READ_TOKEN=your-read-token
     SANITY_API_WRITE_TOKEN=your-write-token
     ```
6. **Deploy:** Click "Deploy"

That's it! Vercel will give you a URL like:
```
https://fair-wheel-of-names.vercel.app
```

## Option 2: Deploy via CLI (Requires Login)

If you want to use CLI, run:
```bash
cd fair-wheel-of-names
vercel login
vercel --prod
```

Follow the prompts to authenticate and deploy.

## Environment Variables

You'll need these from Sanity:
1. Go to https://www.sanity.io/manage
2. Open your project
3. Go to **API** > **Tokens**
4. Create tokens with permissions:
   - Read token: `SANITY_API_READ_TOKEN`
   - Write token: `SANITY_API_WRITE_TOKEN`
5. Your Project ID is in the project settings

## Next Steps After Deployment

1. **Test the site:** Open your Vercel URL
2. **Create teams:** Go to `your-site.vercel.app/admin`
3. **Add members:** Use Sanity Studio
4. **Spin the wheel!**

## Custom Domain (Optional)

1. Go to Vercel project Settings > Domains
2. Add custom domain (e.g., wheel.yourdomain.com)
3. Update DNS records as instructed by Vercel
4. Wait for SSL certificate (usually 1-24 hours)
