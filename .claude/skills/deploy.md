# Deploy Procedures

## Backend → Render
1. Ensure Dockerfile exists at backend/FoodMatch/src/FoodMatch.Api/Dockerfile
2. Push to GitHub
3. Render: New → Web Service → Docker → connect repo
4. Set env var: CONNECTION_STRINGS__DEFAULTCONNECTION=[supabase_conn_string]
5. Set env var: ASPNETCORE_ENVIRONMENT=Production
6. Deploy

## Frontend → Vercel
1. Set VITE_API_URL in .env.production
2. Push to GitHub
3. Vercel: Import → Vite framework → deploy
4. Set env vars in Vercel dashboard

## Database → Supabase
1. Create project at supabase.com
2. Run SQL migrations via SQL Editor
3. Get connection string (Session Pooler mode)
4. Enable pgcrypto extension

## Post-Deploy Checklist
- [ ] CORS configured for Vercel domain
- [ ] SignalR transport: WebSocket with LongPolling fallback
- [ ] HTTPS working (required for Geolocation API)
- [ ] Health endpoint responding: GET /api/health
