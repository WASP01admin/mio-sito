# FileZilla FTP Upload Instructions

This is the **fastest and most reliable** way to upload your build to Hostinger.

## Step 1: Download FileZilla (if you don't have it)
- Download: https://filezilla-project.org/download.php?type=client
- Install and launch FileZilla

## Step 2: Add New Site in FileZilla

In FileZilla, go to **File → Site Manager**:

```
New Site (name it "WASP Production")
  Protocol: FTP
  Host: ftp://92.113.19.9
  Port: 21
  Encryption: Only use plain FTP
  Login Type: Normal
  User: u654299043
  Password: AnimalFarm1984!
```

Click **Connect**

## Step 3: Upload Build Files

**Left panel (Local):** Navigate to `C:\Users\robbu\Documents\mio-sito\web`
**Right panel (Remote):** You should be in `/public_html`

### Upload in this order:

#### 1️⃣ **package.json** and **package-lock.json**
   - Drag from left panel → right panel
   - ✓ These are small, upload quickly

#### 2️⃣ **public/** folder
   - Right-click `public` → Copy
   - Paste in remote `/public_html`
   - Wait for completion (should be quick)

#### 3️⃣ **.next/** folder (the important one!)
   - Right-click `.next` → Copy
   - Paste in remote `/public_html`
   - ⏱️ This is ~500MB, may take 5-15 minutes depending on connection
   - **Do NOT interrupt!** The upload status bar shows progress

## Step 4: Verify Upload

Once FileZilla shows all transfers complete:
- Refresh remote panel (F5)
- Confirm you see:
  ```
  public_html/
  ├── .next/
  ├── public/
  ├── package.json
  └── package-lock.json
  ```

## Step 5: Server Setup (via SSH)

After files are uploaded, connect via SSH:

```bash
ssh u654299043@92.113.19.9
# Password: AnimalFarm1984!

cd ~/public_html
npm install --production
```

This installs dependencies on the server (~2-3 minutes).

## Step 6: Create Environment File

Still in SSH, create `.env.production`:

```bash
cat > .env.production << 'EOF'
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
EOF
```

Press Enter, then type `exit` to logout.

## Step 7: Start App in Hostinger cPanel

1. Log into https://hpanel.hostinger.com
2. Go to **Applications** (or **Node.js**)
3. Click **Create Application**
4. Settings:
   - **Node.js Version:** 20.x
   - **Application Root:** `/public_html/`
   - **Startup File:** `node_modules/.bin/next start`
   - **Application URL:** `https://www.waspnest.org`
5. Click **Create** → **Start**

## Step 8: Test Deployment

Visit: **https://www.waspnest.org**

Expected to see:
- ✅ WASP homepage loads
- ✅ Map displays with 5,223+ associations
- ✅ Registration form works
- ✅ Admin panel accessible at `/admin`

## Troubleshooting

**"502 Bad Gateway"** → App crashed
- Check cPanel Applications → logs
- Check `.env.production` has all required keys

**"Cannot find .next"** → Files didn't upload
- Check FileZilla transfer completed
- Refresh remote panel (F5)
- Verify `.next` folder exists in `public_html`

**"Cannot load database"** → Wrong credentials
- Check `.env.production` spelling exactly
- Verify Supabase credentials are correct
- SSH in and run: `cat .env.production`

**Chat not working** → Need to deploy chat-service separately
- Will handle after main site is live

---

**Estimated total time: 30-40 minutes**
- 15-20 min: FileZilla upload
- 5 min: npm install
- 3 min: cPanel setup
- 5 min: testing

You got this! 🚀
