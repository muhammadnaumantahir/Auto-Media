# Video Automation Platform - Development Roadmap

## Overview
Multi-user platform where each user:
- Links their Google Sheet (video source)
- Manages posting to YouTube, Facebook, Snapchat, TikTok
- Tracks status of each video
- Uses AI for metadata generation

---

## Phase Breakdown (8-12 weeks)

```
Phase 1: Auth & UI Foundation (Week 1-2)
  ├─ User registration/login
  ├─ Dashboard skeleton
  ├─ Google OAuth setup
  └─ Database setup

Phase 2: Google Sheets Integration (Week 2-3)
  ├─ Connect Google Sheet API
  ├─ Parse sheet data
  ├─ Display videos in dashboard
  └─ Create job queue for monitoring

Phase 3: Platform Integrations (Week 3-5)
  ├─ YouTube API setup
  ├─ Facebook Graph API
  ├─ Snapchat API
  └─ TikTok API

Phase 4: Video Processing & Posting (Week 5-7)
  ├─ Download from Google Drive
  ├─ Upload to platforms
  ├─ Status tracking
  └─ Error handling & retries

Phase 5: AI Metadata Generation (Week 7-8)
  ├─ Ollama integration
  ├─ Auto-generate titles/descriptions
  ├─ Hashtag generation
  └─ SEO optimization

Phase 6: Analytics & Polish (Week 8-12)
  ├─ Dashboard analytics
  ├─ Scheduling optimization
  ├─ Bulk operations
  └─ Production deployment
```

---

# PHASE 1: Auth & UI Foundation (Week 1-2)

## Architecture Overview

```
Frontend (React)
  ├─ Login/Register
  ├─ Dashboard
  ├─ Settings page
  └─ Google Sheet linker

Backend (Node.js + Express)
  ├─ Auth routes
  ├─ User management
  └─ Database ops

Database (PostgreSQL)
  ├─ users table
  ├─ sheets_connection table
  ├─ videos table
  └─ posting_logs table
```

---

## Database Schema (Phase 1)

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sheets Connection Table
```sql
CREATE TABLE sheets_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sheet_id VARCHAR(255) NOT NULL,
  sheet_name VARCHAR(255),
  sheet_url TEXT,
  google_access_token TEXT, -- encrypted
  google_refresh_token TEXT, -- encrypted
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMP,
  sync_interval INTEGER DEFAULT 3600, -- in seconds
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, sheet_id)
);
```

### Videos Table (Minimal for Phase 1)
```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sheet_connection_id INTEGER REFERENCES sheets_connections(id),
  row_id INTEGER, -- reference to sheet row number
  video_link VARCHAR(1000),
  title VARCHAR(300),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, posted, failed
  platforms VARCHAR(500), -- comma-separated: youtube,facebook,snapchat
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Platform Accounts Table
```sql
CREATE TABLE platform_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50), -- youtube, facebook, snapchat, tiktok
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  account_id VARCHAR(255),
  account_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Frontend Structure (React)

### Pages
```
src/
├─ pages/
│  ├─ Login.jsx           # Email/password + Google OAuth
│  ├─ Register.jsx        # Signup form
│  ├─ Dashboard.jsx       # Main interface
│  ├─ Settings.jsx        # User settings
│  ├─ SheetConnect.jsx    # Link Google Sheet
│  └─ NotFound.jsx
├─ components/
│  ├─ Navbar.jsx
│  ├─ Sidebar.jsx
│  ├─ SheetViewer.jsx     # Display sheet data
│  ├─ VideoCard.jsx       # Video status card
│  ├─ StatusBadge.jsx     # Status indicator
│  └─ Modal.jsx           # Reusable modal
├─ services/
│  ├─ authService.js      # API calls for auth
│  ├─ sheetsService.js    # Google Sheets API calls
│  └─ api.js              # Axios instance
├─ context/
│  └─ AuthContext.jsx     # Global auth state
├─ hooks/
│  └─ useAuth.js          # Custom hook
└─ App.jsx
```

### Key Pages Detail

#### **Dashboard.jsx** (Main UI)
```
┌─────────────────────────────────────────────┐
│         Navigation Bar (Logo, Profile)      │
├─────────────────────────────────────────────┤
│ Sidebar          │                          │
│ • Dashboard      │   Main Content Area      │
│ • My Sheets      │                          │
│ • Platform Accts │   ┌────────────────────┐│
│ • Settings       │   │ Your Sheet: Q4 Plan ││
│ • Logout         │   │ 45 videos pending   ││
│                  │   │                    ││
│                  │   │ [+ Connect Sheet]  ││
│                  │   │                    ││
│                  │   │ Videos Table:      ││
│                  │   │ ┌─────────────────┐││
│                  │   │ │ ID│ Title│Status││
│                  │   │ │──┼──────┼──────││
│                  │   │ │1 │Video1│Draft ││
│                  │   │ │2 │Video2│Posted││
│                  │   │ │3 │Video3│Failed││
│                  │   │ └─────────────────┘││
│                  │   └────────────────────┘│
└─────────────────────────────────────────────┘
```

#### **SheetConnect.jsx** (Connect Google Sheet)
```
┌────────────────────────────────────────┐
│  Link Your Google Sheet                │
├────────────────────────────────────────┤
│  Step 1: Authenticate Google            │
│  [✓] Google OAuth Connected             │
│                                         │
│  Step 2: Select Sheet                   │
│  Sheet URL: [________________________]   │
│  [Fetch Sheets]                         │
│                                         │
│  Available sheets:                      │
│  ○ Q4 Videos                            │
│  ● Q4 Videos - Upload Plan (Selected)   │
│  ○ Archive                              │
│                                         │
│  Step 3: Map Columns                    │
│  Video Link Column: [Link▼]             │
│  Title Column: [Title▼]                 │
│  Status Column: [Status▼]               │
│  Platforms Column: [Platforms▼]         │
│                                         │
│  Sync Frequency: [Every 1 hour▼]        │
│                                         │
│  [< Back]  [Connect Sheet]              │
└────────────────────────────────────────┘
```

---

## Backend Structure (Node.js + Express)

### Project Setup
```
backend/
├─ src/
│  ├─ routes/
│  │  ├─ auth.js         # POST /auth/register, /auth/login
│  │  ├─ sheets.js       # POST /sheets/connect, GET /sheets/list
│  │  ├─ videos.js       # GET /videos, PUT /videos/:id
│  │  └─ platforms.js    # POST /platforms/connect
│  ├─ controllers/
│  │  ├─ authController.js
│  │  ├─ sheetsController.js
│  │  └─ videosController.js
│  ├─ middleware/
│  │  ├─ auth.js         # JWT verification
│  │  └─ errorHandler.js
│  ├─ models/
│  │  └─ User.js         # Database queries
│  ├─ config/
│  │  ├─ database.js
│  │  ├─ env.js
│  │  └─ googleOAuth.js
│  └─ app.js
├─ .env
└─ package.json
```

### Key API Endpoints (Phase 1)

```
AUTH
POST   /api/auth/register          # Email + password signup
POST   /api/auth/login             # Email + password login
POST   /api/auth/google            # Google OAuth callback
GET    /api/auth/me                # Get current user
POST   /api/auth/logout            # Logout

SHEETS
POST   /api/sheets/connect         # Connect Google Sheet
GET    /api/sheets/list            # Get user's connected sheets
GET    /api/sheets/:id/preview     # Get sheet preview (first 10 rows)
DELETE /api/sheets/:id             # Disconnect sheet
PUT    /api/sheets/:id             # Update column mappings

VIDEOS (minimal Phase 1)
GET    /api/videos                 # Get all user's videos
GET    /api/videos/:id             # Get single video
PUT    /api/videos/:id             # Update video status/metadata
```

---

## Implementation Checklist - Phase 1

### Week 1
- [ ] Setup Express server + PostgreSQL
- [ ] Setup JWT auth with bcrypt
- [ ] Implement user registration/login
- [ ] Create User model & database
- [ ] Setup Google OAuth (create credentials in Google Cloud)
- [ ] Add Google OAuth login endpoint
- [ ] Create frontend project (React + Vite)
- [ ] Build Login & Register pages
- [ ] Setup AuthContext for state management
- [ ] Add protected routes (PrivateRoute wrapper)

### Week 2
- [ ] Create SheetConnection model & database
- [ ] Build Google Sheets API integration
- [ ] Create /api/sheets/connect endpoint
- [ ] Build SheetConnect.jsx component
- [ ] Create Videos model & database
- [ ] Build Dashboard page skeleton
- [ ] Add sheet preview functionality
- [ ] Display videos in table format
- [ ] Add Navbar & Sidebar
- [ ] Test auth flow end-to-end
- [ ] Deploy to Railway or Render (dev environment)

---

## Tech Stack Summary - Phase 1

### Frontend
- **React 18** + Vite
- **React Router** v6 (navigation)
- **Axios** (API calls)
- **TailwindCSS** (styling)
- **React Context** (auth state)

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (database)
- **JWT** (authentication)
- **bcryptjs** (password hashing)
- **google-auth-library** (OAuth)
- **google-spreadsheet** (Sheets API)
- **dotenv** (environment variables)

### Deployment (Phase 1)
- **Backend**: Railway/Render (free tier)
- **Frontend**: Vercel (free tier)
- **Database**: Railway PostgreSQL

### Cost: $0 (all free tiers)

---

## Detailed Example: Login Flow

### Frontend (React)
```jsx
// pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Video Automation</h1>
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="my-4 flex items-center">
          <hr className="flex-1" />
          <span className="px-2 text-gray-500">OR</span>
          <hr className="flex-1" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-gray-300 p-2 rounded font-bold hover:bg-gray-100"
        >
          🔵 Login with Google
        </button>

        <p className="text-center mt-4">
          Don't have an account? <a href="/register" className="text-blue-600">Register</a>
        </p>
      </div>
    </div>
  );
}
```

### Backend (Express)
```javascript
// routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.post('/logout', authController.logout);

module.exports = router;
```

```javascript
// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/video_automation

# JWT
JWT_SECRET=your_super_secret_key_change_this

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## Phase 2 Preview (Week 2-3)

Once Phase 1 is done, you'll:
1. Get full Google Sheet data (all rows/columns)
2. Parse custom column mappings (video_link, title, status, platforms)
3. Create video records from sheet rows
4. Setup automatic syncing (poll sheet every hour)
5. Display live video data in dashboard

```javascript
// Phase 2 example
const sheetsData = [
  { 
    row_id: 1, 
    video_link: 'https://drive.google.com/file/d/xxx',
    title: 'How to Setup Node.js',
    status: 'pending',
    platforms: 'youtube,facebook'
  },
  { 
    row_id: 2,
    video_link: 'https://drive.google.com/file/d/yyy',
    title: 'React Hooks Tutorial',
    status: 'posted',
    platforms: 'youtube'
  }
];
// These become Video records in DB, synced automatically
```

---

## Quick Start Commands

```bash
# Backend
cd backend
npm install
npm run dev          # Starts on port 5000

# Frontend
cd frontend
npm install
npm run dev          # Starts on port 5173
```

Then visit: `http://localhost:5173`

---

## Summary: Phase 1 Deliverables

✅ **User authentication** (email/password + Google OAuth)  
✅ **Multi-user system** (each user isolated)  
✅ **Dashboard skeleton** (ready for content)  
✅ **Google Sheet connection UI** (link Google accounts)  
✅ **Database schema** (ready for phases 2-6)  
✅ **Protected routes** (only logged-in users see dashboard)  

**Estimated time: 10-14 days** for experienced full-stack dev

Next step: Phase 2 (Google Sheets full integration + video syncing)
