# Vyapar Automate - Instagram Comment to DM Automation

Instagram Reels aur Posts par aane wale comments ko automatically detect karke instant **Public Comment Reply** aur **Private Direct Message (DM)** bhejne ka ManyChat-style official Meta Graph API automation dashboard.

---

## 🚀 Key Features

- **⚡ Instant Comment-to-DM Trigger**: Jab koi user aapke Reel ya Post par keyword (jaise `"LINK"`, `"PRICE"`, `"PDF"`, `"COURSE"`) comment karega, system instant DM aur comment reply dispatch karega.
- **🛡️ Anti-Spam Public Reply Rotation**: Ek se zyada comment reply variations configure karein taaki Instagram automated activity ko spam mark na kare.
- **👤 Dynamic User Placeholders**: DM templates me `{username}` use karein taaki message personalized ho (e.g., *"Hey {username}! Here is your link..."*).
- **🧪 Interactive Event Simulator**: Bina live Instagram post kiye dashboard se hi comment events test karein aur instant preview dekhein.
- **🔗 Official Meta Webhooks**: Secure Webhook verification (`GET`) aur live event streaming (`POST`) with token matching.
- **📊 Live Activity & KPI Dashboard**: Comments processed, matched keywords, DMs delivered aur active rules ki real-time monitoring.
- **💾 Dual Storage Support**:
  - MongoDB Atlas (production ke liye)
  - Automatic Embedded Local Database (zero setup instant testing ke liye)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI & Styling**: Tailwind CSS, Lucide Icons
- **Database**: Mongoose (MongoDB) + Built-in Local Persistent Fallback
- **API**: Official Meta Graph API v21.0 & Instagram Send API

---

## 🏃 Quick Start (Local Run)

### 1. Development Server Start Karein:
```bash
npm run dev
```
Browser me open karein: [http://localhost:3000](http://localhost:3000)

### 2. Built-in Simulator se Test Karein:
1. Dashboard me **"Test Simulator"** tab par click karein.
2. Commenter username aur comment text enter karein (e.g. *"Please send me the pdf guide!"*).
3. **"Simulate Comment Event"** click karein.
4. Aapko instant visual preview dikhega:
   - Matched Rule & Keyword
   - Public comment reply variation
   - Private DM message delivered

---

## 🌐 Official Meta (Instagram) Live Connection Setup

Apne professional / creator Instagram account ko connect karne ke liye:

### Step 1: Meta Developer App Create Karein
1. [Meta for Developers](https://developers.facebook.com/apps) par jaakar **Create App** click karein.
2. App Type me **Business** select karein.

### Step 2: Instagram Graph API & Webhooks Add Karein
1. App Dashboard ke **Add Products** section se **Webhooks** aur **Instagram Graph API** add karein.

### Step 3: Webhook Setup Karein
1. Webhooks page par drop-down se **Instagram** select karein.
2. **Callback URL**: `https://your-domain.com/api/instagram/webhook` *(Local testing ke liye `ngrok http 3000` ka public URL use karein)*.
3. **Verify Token**: `vyapar_automate_verify_token_123` (ya jo aapne `.env.local` me set kiya hai).
4. **"Verify and Save"** par click karein.
5. Instagram Webhook fields me se **`comments`** field ko **Subscribe** karein.

### Step 4: Page Access Token Generate Karein
Graph API Explorer ya App Roles se Long-lived Page Access Token generate karein jisme ye permissions hon:
- `instagram_basic`
- `instagram_manage_comments`
- `instagram_manage_messages`
- `pages_show_list`
- `pages_read_engagement`

### Step 5: Dashboard Settings me Credentials Save Karein
Dashboard ke **"Meta API Settings"** tab me apna Page Access Token, Instagram Business Account ID aur Facebook Page ID paste karke Save karein!

---

## 📁 Project Structure

```
VM-automation/
├── app/
│   ├── api/
│   │   ├── instagram/
│   │   │   ├── test/route.ts       # Test comment simulator
│   │   │   └── webhook/route.ts    # Official Meta Webhook (GET & POST)
│   │   ├── logs/route.ts           # Activity logs & stats API
│   │   ├── rules/
│   │   │   ├── route.ts            # Fetch & create automation rules
│   │   │   └── [id]/route.ts       # Toggle / edit / delete rule
│   │   └── settings/route.ts       # Meta API settings management
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Full interactive UI Dashboard
├── lib/
│   ├── db/
│   │   └── mongoose.ts             # MongoDB connection utility
│   ├── instagram/
│   │   └── api.ts                  # Meta Graph API client & rule engine
│   ├── models/                     # Mongoose schemas (Rule, Log, Settings)
│   └── services/
│       └── store.ts                # Unified database & local storage layer
├── .env.example
├── .env.local
└── package.json
```
