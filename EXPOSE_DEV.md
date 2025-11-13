# Exposing Your Local Dev Environment

## Option 1: ngrok (Recommended)

### Installation
```bash
# macOS
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

### Setup
1. Sign up for a free account at https://ngrok.com
2. Get your authtoken from the dashboard
3. Configure ngrok:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Usage
```bash
# Expose your Laravel Herd site (default port is usually 80 or 8080)
ngrok http realkinkmen.test

# Or if you know the port:
ngrok http 80
# or
ngrok http 8080
```

ngrok will give you a URL like `https://abc123.ngrok-free.app` that you can share.

### Update .env
After starting ngrok, update your `.env` file:
```env
APP_URL=https://abc123.ngrok-free.app
SANCTUM_STATEFUL_DOMAINS=abc123.ngrok-free.app
```

---

## Option 2: Cloudflare Tunnel (Free, No Signup for Basic Use)

### Installation
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared
```

### Usage
```bash
# Expose your site
cloudflared tunnel --url http://realkinkmen.test:80

# Or specify port
cloudflared tunnel --url http://localhost:8080
```

### Update .env
After starting the tunnel, update your `.env`:
```env
APP_URL=https://<random-subdomain>.trycloudflare.com
SANCTUM_STATEFUL_DOMAINS=<random-subdomain>.trycloudflare.com
```

---

## Option 3: localtunnel (Simple, No Signup)

### Installation
```bash
npm install -g localtunnel
```

### Usage
```bash
# Expose port 80 (or whatever port Herd uses)
lt --port 80

# Or with a custom subdomain (if available)
lt --port 80 --subdomain your-custom-name
```

### Update .env
```env
APP_URL=https://your-custom-name.loca.lt
SANCTUM_STATEFUL_DOMAINS=your-custom-name.loca.lt
```

---

## Important Notes

1. **After updating .env, clear Laravel config cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

2. **Security Considerations:**
   - This exposes your local dev environment to the internet
   - Don't use production credentials
   - Consider using a password or IP whitelist if available
   - ngrok free tier has a request inspection page (can be disabled with `--request-header-add`)

3. **Finding Your Herd Port:**
   - Check Herd settings or run: `lsof -i -P | grep LISTEN | grep php`
   - Or check Herd's site configuration

4. **For HTTPS (required for some features):**
   - ngrok and Cloudflare Tunnel provide HTTPS automatically
   - localtunnel also provides HTTPS

5. **Session/Cookie Issues:**
   - Make sure `SANCTUM_STATEFUL_DOMAINS` includes your tunnel domain
   - You may need to clear browser cookies after changing domains

---

## Quick Start (ngrok)

```bash
# 1. Install ngrok
brew install ngrok/ngrok/ngrok

# 2. Sign up and get authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_TOKEN

# 3. Start tunnel (adjust port if needed)
ngrok http realkinkmen.test

# 4. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)

# 5. Update .env
# APP_URL=https://abc123.ngrok-free.app
# SANCTUM_STATEFUL_DOMAINS=abc123.ngrok-free.app

# 6. Clear cache
php artisan config:clear

# 7. Share the URL!
```

