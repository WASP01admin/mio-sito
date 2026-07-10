# WASP Deployment to Hostinger - Complete Guide

**Date:** July 7, 2026  
**Target:** www.waspnest.org  
**Hosting:** Hostinger Cloud (Node.js enabled)  

---

## **Your Hostinger Credentials**

```
Website: https://www.waspnest.org
Server: server1700 (Germany)
IP: 92.113.19.9

FTP Host: ftp://92.113.19.9 or ftp://waspnest.org
FTP Username: u654299043
FTP Password: [PROTECTED]
Upload Path: public_html

Node.js: Supported (Next.js explicitly listed)
```

---

## **Deployment Steps**

### **Step 1: Build the App (LOCAL)**
```bash
cd C:\Users\robbu\Documents\mio-sito\web
npm run build
```
✓ Creates optimized production build in `.next/` folder

### **Step 2: Prepare Files for Upload**
After build completes, you'll have:
- `.next/` — Compiled app (upload)
- `public/` — Static assets (upload)
- `node_modules/` — Dependencies (do NOT upload, install on server)
- `package.json` — Dependencies list (upload)
- `package-lock.json` — Lock file (upload)
- `.env.local` — Environment variables (upload, but use production values)

### **Step 3: Upload via FTP**
Use FileZilla or Windows built-in FTP:

**FileZilla Setup:**
1. Open FileZilla
2. File → Site Manager → New site
   - Protocol: FTP
   - Host: `ftp://92.113.19.9`
   - Username: `u654299043`
   - Password: `AnimalFarm1984!`
3. Connect
4. Navigate to `public_html/` on the remote side
5. Upload these files/folders:
   - `.next/` (the compiled app)
   - `public/` (static assets)
   - `package.json`
   - `package-lock.json`
   - `.env.production` (see Step 5)

**Windows CMD FTP:**
```batch
ftp 92.113.19.9
# Login: u654299043 / AnimalFarm1984!
cd public_html
put package.json
put package-lock.json
# Upload .next and public folders recursively
```

### **Step 4: Install Dependencies on Server**
Connect to Hostinger via SSH or cPanel Terminal:

```bash
cd ~/public_html
npm install --production
```

This installs only production dependencies (smaller footprint).

### **Step 5: Create Production Environment File**
Create `.env.production` on the server with:

```env
# Use your production domain (not localhost)
NEXT_PUBLIC_SITE_URL=https://www.waspnest.org
NEXT_PUBLIC_SUPABASE_URL=https://oxjefazubltzaazesujp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mRiGFC52Q9hiDIeCOxsnCQ_bcIEQLlq
SUPABASE_SERVICE_ROLE_KEY=sb_secret_jAyDMKXAzzANL7o8Cc_d3A_Ywt_4Y1e
RESEND_API_KEY=re_PDiio6Uz_CstEzTPkZZUzF1tP5qQf7Mfk
RESEND_FROM_EMAIL=noreply@waspnest.org
ADMIN_PASSWORD_HASH=493409dac9c2d471adb24d4be063f619:b2e738d1b7793d4a2ec0cb0c0f27364c49bbb62a580e94940dd1090b8499e3b3fce5351825f7cacdde4d312eee33ef8934f0b55f3cb5ba8c66ad0a685ae35e7b
ADMIN_SESSION_SECRET=ac5cc2ee32f5587c5cac25cb7d83b5c6cfe33b5b1e374a8f53f5196c82f6b4f3
CHAT_AUTH_SECRET=e764c5fe78081afc6644866267b7dbd5f59b982c9cdffc48434754c09fc5cc9a
NEXT_PUBLIC_CHAT_SERVICE_URL=https://www.waspnest.org:4000
CLEANUP_SECRET=wasp-image-cleanup-secret-key-2024
ASSOCIATION_SESSION_SECRET=f1e2d3c4b5a6978869584756453423212e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b
```

### **Step 6: Configure Node.js in Hostinger cPanel**

1. Go to **Hostinger cPanel**
2. Navigate to **Node.js** or **Applications**
3. Click **Create Application**
4. Settings:
   - **Node.js Version:** 20.x (or latest)
   - **Application Root:** `/public_html/`
   - **App URL:** `https://www.waspnest.org`
   - **Startup File:** `node_modules/.bin/next start`
   - **Environment:** Production
5. Click **Create**
6. Start the application

### **Step 7: Verify Deployment**

Visit: `https://www.waspnest.org`

Check:
- ✅ Homepage loads
- ✅ Maps display with 5,223 associations
- ✅ Registration flow works
- ✅ Admin panel accessible at `/admin`
- ✅ Chat system connects
- ✅ Email links work (using waspnest.org domain)

### **Step 8: Monitor & Troubleshoot**

**Check server logs in cPanel:**
- Applications → Node.js → Application Logs
- Look for errors in startup or runtime

**Common issues:**
- 502 Bad Gateway → App crashed, check logs
- 404 on routes → Build didn't include routes
- Database errors → Check .env.production credentials
- Chat not working → Check CHAT_AUTH_SECRET and chat-service deployment

---

## **Chat Service Deployment (SEPARATE)**

The chat service runs on port 4000 and needs separate deployment:

```bash
cd C:\Users\robbu\Documents\mio-sito\chat-service
npm run build
# Upload chat-service to Hostinger
# Create separate Node.js app for port 4000
```

Configure in cPanel as second Node.js app on port 4000.

---

## **Post-Deployment Checklist**

- [ ] Production build created successfully
- [ ] Files uploaded to public_html via FTP
- [ ] Dependencies installed on server (`npm install --production`)
- [ ] .env.production created with production domain
- [ ] Node.js app created and started in cPanel
- [ ] www.waspnest.org is accessible
- [ ] Homepage loads and shows maps
- [ ] Admin panel works (`/admin`)
- [ ] Chat service deployed and running
- [ ] Email sender shows noreply@waspnest.org
- [ ] SSL certificate active (HTTPS)
- [ ] Backups configured in Hostinger

---

## **Rollback Plan**

If something breaks:
1. Go to Hostinger Node.js apps
2. Stop the application
3. Check Application Logs for errors
4. Fix .env or rebuild locally
5. Re-upload the `.next/` folder
6. Restart application

---

## **Support**

- **Hostinger Support:** https://hpanel.hostinger.com/support
- **Next.js Docs:** https://nextjs.org/docs
- **Your database:** Supabase (cloud, no server-side action needed)
- **Your chat service:** Separate Node.js app running on port 4000

---

**Ready to deploy!** Once the production build completes, follow these steps in order.
