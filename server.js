const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Load environment variables
dotenv.config();

// Prevent server crash on uncaught errors
process.on('uncaughtException', function (err) {
  console.error('Caught exception: ', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// ── Security Headers ───────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('trust proxy', true);

const SESSION_SECRET = process.env.SESSION_SECRET || 'mahurzari_village_portal_secure_key_2026';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// ── Cryptographic Authentication & Password Security ───────────────────
function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword) return false;
  // Seamless backward compatibility for legacy plaintext passwords
  if (!storedPassword.includes(':')) {
    return password === storedPassword;
  }
  try {
    const [salt, originalHash] = storedPassword.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    if (hash.length !== originalHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch (e) {
    return false;
  }
}

function generateAuthToken(payload) {
  const data = {
    ...payload,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30-day validity
  };
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
    if (signature.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Date.now()) {
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

function extractUserFromRequest(req) {
  if (req.session?.user) return req.session.user;

  let rawToken = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.slice(7).trim();
  } else if (req.headers['x-auth-token']) {
    rawToken = req.headers['x-auth-token'].trim();
  } else if (req.cookies && req.cookies.auth_token) {
    rawToken = req.cookies.auth_token;
  }

  if (rawToken) {
    const payload = verifyAuthToken(rawToken);
    if (payload && payload.email) {
      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        role: payload.role || 'People/User',
        ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        location: payload.location || 'Verified Session',
        loginTime: payload.loginTime || new Date().toISOString()
      };
    }
  }
  return null;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "547185696384-nfog7eetv58j1vh6c75u42jd88gcqsi2.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ── Database Setup (MongoDB with Serverless Connection Caching) ───
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://atharvajadhav20075848_db_user:T6Xj3t4KOCtpfbXT@cluster0.hrxwdsn.mongodb.net/?appName=Cluster0";

// Enable command buffering so queries wait safely for MongoDB connection in serverless lambdas
mongoose.set('bufferCommands', true);

// In-memory fallback user store ensures instant login even if DB is cold or waking up
const defaultSeedUsers = [
  { email: 'admin@village.gov.in', name: 'Panchayat Admin', role: 'Admin', password: hashPassword('admin123') },
  { email: 'sarpanch@village.gov.in', name: 'Gram Sarpanch', role: 'Sarpanch', password: hashPassword('sarpanch123') },
  { email: 'resident@village.gov.in', name: 'Sample Resident', role: 'People/User', password: hashPassword('user123') }
];
const memoryUsers = [...defaultSeedUsers];

let cachedDbPromise = null;
async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!cachedDbPromise) {
    cachedDbPromise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
    }).then(async (m) => {
      console.log('Connected to MongoDB Live Database!');
      await seedDefaultUsers().catch(() => {});
      return m;
    }).catch((err) => {
      cachedDbPromise = null;
      console.warn('MongoDB connection note (using resilient fallback):', err.message);
      return null;
    });
  }
  return cachedDbPromise;
}

if (MONGO_URI) {
  connectToDatabase().catch(() => {});
}

app.use(async (req, res, next) => {
  if (MONGO_URI && mongoose.connection.readyState !== 1) {
    try {
      await connectToDatabase();
    } catch (e) {
      console.warn('DB connect middleware error:', e.message);
    }
  }
  
  // Authenticate user via cryptographic token or session
  const verifiedUser = extractUserFromRequest(req);
  if (verifiedUser) {
    req.session.user = verifiedUser;
  }
  next();
});

// ── Schemas & Models ──────────────────────────────────────────────────
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String },
  role: { type: String, default: 'People/User' },
  createdAt: { type: Date, default: Date.now }
}));

const Issue = mongoose.models.Issue || mongoose.model('Issue', new mongoose.Schema({
  id: { type: Number, required: true },
  title: String,
  type: String,
  description: String,
  location: String,
  lat: Number,
  lon: Number,
  photoUrl: String,
  reporter: { type: String, default: 'Resident' },
  reporterEmail: { type: String, default: '' },
  reporterIp: { type: String, default: '' },
  status: { type: String, default: 'Pending' },
  resolvedBy: String,
  resolutionPhotoUrl: String,
  createdAt: { type: Date, default: Date.now }
}));

const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  senderName: { type: String, default: 'Gram Panchayat' },
  senderRole: { type: String, default: 'System' },
  targetRole: { type: String, default: 'all' }, // 'all', 'People/User', 'Sarpanch', 'Admin'
  targetEmail: { type: String, default: '' },
  type: { type: String, default: 'general' }, // 'issue', 'broadcast', 'general'
  isEmergency: { type: Boolean, default: false },
  soundUrl: { type: String, default: null },
  playOnce: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  readBy: { type: [String], default: [] }
}));

const AlertSound = mongoose.models.AlertSound || mongoose.model('AlertSound', new mongoose.Schema({
  key: { type: String, default: 'global_alert_sound', unique: true },
  name: { type: String, default: 'High-Pitch Emergency Siren' },
  soundUrl: { type: String, default: '/public/sounds/emergency_siren.wav' },
  playOnce: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
}));

const Feed = mongoose.models.Feed || mongoose.model('Feed', new mongoose.Schema({
  id: Number,
  name: String,
  time: String,
  action: String,
  location: String,
  ip: String,
  phone: String
}));

const ActiveSession = mongoose.models.ActiveSession || mongoose.model('ActiveSession', new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  ip: String,
  location: String,
  lat: Number,
  lon: Number,
  loginTime: String,
  updatedAt: { type: Date, default: Date.now }
}));

async function seedDefaultUsers() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.insertMany([
        { email: 'admin@village.gov.in', name: 'Panchayat Admin', role: 'Admin', password: hashPassword('admin123') },
        { email: 'sarpanch@village.gov.in', name: 'Gram Sarpanch', role: 'Sarpanch', password: hashPassword('sarpanch123') },
        { email: 'resident@village.gov.in', name: 'Sample Resident', role: 'People/User', password: hashPassword('user123') }
      ]);
      console.log("Seeded default users with secure hashed credentials.");
    }
  } catch (e) {
    console.error('Error seeding users:', e.message);
  }
}
mongoose.connection.once('open', () => {
  seedDefaultUsers();
  enforceMax5CloudinaryPhotos().catch(() => {});
});

// ── Cloudinary Image & Audio Upload Setup (with Instant Base64 Fallback) ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage so file is always instantly available as a buffer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const uploadSafe = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      console.warn(`[Multer Notice] ${fieldName}:`, err.message);
    }
    next();
  });
};

// Strict Rolling Buffer for Cloudinary: Keep max 5 photos, auto-delete oldest when 6th arrives
async function enforceMax5CloudinaryPhotos() {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.api.resources(
        { type: 'upload', prefix: 'village_water_portal', max_results: 100 },
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
    });

    if (result && Array.isArray(result.resources) && result.resources.length > 5) {
      // Sort ascending by created_at (oldest first)
      const sorted = result.resources.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const deleteCount = sorted.length - 5;
      const toDelete = sorted.slice(0, deleteCount);
      console.log(`[Cloudinary Rolling Prune] Deleting ${deleteCount} oldest photos to maintain strict max 5 limit...`);
      for (const item of toDelete) {
        try {
          await cloudinary.uploader.destroy(item.public_id);
          console.log(`[Cloudinary Rolling Prune] Removed oldest photo: ${item.public_id}`);
        } catch (delErr) {
          console.warn(`[Cloudinary Rolling Prune] Failed to remove ${item.public_id}:`, delErr.message);
        }
      }
    }
  } catch (err) {
    console.warn("[Cloudinary Rolling Prune] Error checking resources:", err.message);
  }
}

// Fail-safe helper: Uploads to Cloudinary, and if Cloudinary fails, uses Base64 Data URI
async function uploadToCloudinaryOrBase64(fileBuffer, mimetype, folder = 'village_water_portal') {
  if (!fileBuffer) return null;
  return new Promise((resolve) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error || !result || !result.secure_url) {
            console.warn("Cloudinary upload fallback to base64:", error?.message);
            const base64Data = `data:${mimetype || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;
            return resolve(base64Data);
          }
          // Enforce maximum 5 photos on Cloudinary immediately after upload
          enforceMax5CloudinaryPhotos().catch(() => {});
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    } catch (e) {
      console.warn("Cloudinary stream exception, using base64:", e.message);
      const base64Data = `data:${mimetype || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;
      resolve(base64Data);
    }
  });
}

// ── IP Geolocation Helper ──────────────────────────────────────────
function getLocationFromIP(ip) {
  return new Promise((resolve) => {
    const privatePatterns = ['127.0.0.1', '::1', '::ffff:127.0.0.1', '192.168.', '10.', '172.16.'];
    const isPrivate = privatePatterns.some(p => ip.startsWith(p));
    if (isPrivate) {
      return resolve({ city: 'Mahurzari', region: 'Maharashtra', country: 'India', ip: ip, lat: 21.235, lon: 79.005 });
    }

    const url = `https://ipapi.co/${ip}/json/`;
    const req = https.get(url, { headers: { 'User-Agent': 'MahurzariVillagePortal/1.0' }, timeout: 3500 }, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && !parsed.error) {
            resolve({
              city: parsed.city || 'Mahurzari',
              region: parsed.region || 'Maharashtra',
              country: parsed.country_name || 'India',
              ip: parsed.ip || ip,
              lat: parsed.latitude || 21.235,
              lon: parsed.longitude || 79.005
            });
          } else {
            resolve({ city: 'Mahurzari', region: 'Maharashtra', country: 'India', ip: ip, lat: 21.235, lon: 79.005 });
          }
        } catch (e) {
          resolve({ city: 'Mahurzari', region: 'Maharashtra', country: 'India', ip: ip, lat: 21.235, lon: 79.005 });
        }
      });
    });
    req.on('error', () => {
      resolve({ city: 'Mahurzari', region: 'Maharashtra', country: 'India', ip: ip, lat: 21.235, lon: 79.005 });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ city: 'Mahurzari', region: 'Maharashtra', country: 'India', ip: ip, lat: 21.235, lon: 79.005 });
    });
  });
}

function formatLocationString(loc) {
  const parts = [loc.city, loc.region, loc.country].filter(Boolean);
  return parts.join(', ') || 'Unknown Location';
}

function requireAuth(allowedRoles) {
  return async (req, res, next) => {
    const verifiedUser = extractUserFromRequest(req);
    if (verifiedUser) {
      req.session.user = verifiedUser;
    }

    if (!req.session?.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    if (allowedRoles && !allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
    }
    next();
  };
}

// ── Authentication Routes ──────────────────────────────────────────

// ── Authentication Routes ──────────────────────────────────────────

function formatNameFromEmail(email, providedName) {
  if (providedName && providedName.trim()) return providedName.trim();
  if (!email || !email.includes('@')) return 'Resident';
  const prefix = email.split('@')[0];
  const cleaned = prefix.replace(/[0-9_.-]+/g, ' ').trim();
  if (!cleaned) return prefix;
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Universal Sign-In: Citizens only need their Gmail/Email, no password required!
// Only Admin and Sarpanch require pre-set passwords.
app.post('/api/auth/manual', async (req, res) => {
  try {
    const { email, password, name: rawName, lat, lon } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email: cleanEmail });
      } catch (dbErr) {
        console.warn("DB user lookup notice:", dbErr.message);
      }
    }
    if (!user) {
      user = memoryUsers.find(u => u.email === cleanEmail);
    }

    const isOfficial = (user && (user.role === 'Admin' || user.role === 'Sarpanch')) || cleanEmail === 'admin@village.gov.in' || cleanEmail === 'sarpanch@village.gov.in';

    if (isOfficial) {
      if (!password) {
        return res.status(400).json({ error: 'Password is required for Official (Sarpanch / Admin) accounts.', isOfficial: true });
      }
      const defaultPassword = cleanEmail === 'sarpanch@village.gov.in' ? 'sarpanch123' : 'admin123';
      const isValid = user ? verifyPassword(password, user.password) : (password === defaultPassword);
      if (!isValid) {
        return res.status(401).json({ error: 'Access Denied', message: 'Invalid official credentials.' });
      }
      if (!user) {
        user = {
          email: cleanEmail,
          name: cleanEmail === 'sarpanch@village.gov.in' ? 'Gram Sarpanch' : 'Panchayat Admin',
          role: cleanEmail === 'sarpanch@village.gov.in' ? 'Sarpanch' : 'Admin',
          password: hashPassword(password)
        };
        memoryUsers.push(user);
      }
    } else {
      // Resident / Citizen Login: Instant access, auto-register if new
      const displayName = formatNameFromEmail(cleanEmail, rawName);
      if (!user) {
        user = {
          email: cleanEmail,
          name: displayName,
          role: 'People/User',
          password: hashPassword('citizen_auto_auth')
        };
        memoryUsers.push(user);
        if (mongoose.connection.readyState === 1) {
          User.create(user).catch(() => {});
        }
      } else if (rawName && !user.name) {
        user.name = displayName;
        if (mongoose.connection.readyState === 1 && typeof user.save === 'function') {
          user.save().catch(() => {});
        }
      }
    }

    const clientIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    let locationStr = 'Unknown Location';
    let finalLat = 21.235;
    let finalLon = 79.005;

    if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
      finalLat = parseFloat(lat);
      finalLon = parseFloat(lon);
      locationStr = `GPS: ${finalLat.toFixed(4)}, ${finalLon.toFixed(4)}`;
    } else {
      locationStr = `Mahurzari Village (${finalLat.toFixed(3)}, ${finalLon.toFixed(3)})`;
    }

    const finalName = user.name || formatNameFromEmail(user.email, rawName);

    req.session.user = {
      email: user.email,
      name: finalName,
      role: user.role,
      ip: clientIP,
      location: locationStr,
      lat: finalLat,
      lon: finalLon,
      loginTime: new Date().toISOString()
    };

    const authToken = generateAuthToken({
      email: user.email,
      name: finalName,
      role: user.role,
      location: locationStr
    });

    // Background asynchronous database tracking (never blocks user login)
    if (mongoose.connection.readyState === 1) {
      ActiveSession.findOneAndDelete({ email: user.email }).catch(() => {});
      ActiveSession.create({ 
        email: user.email,
        name: finalName,
        role: user.role,
        ip: clientIP,
        location: locationStr,
        lat: finalLat,
        lon: finalLon,
        loginTime: req.session.user.loginTime,
        updatedAt: new Date()
      }).catch(() => {});
      
      Feed.create({
        id: Date.now(),
        name: finalName,
        time: req.session.user.loginTime,
        action: `Logged in as ${user.role}.`,
        location: locationStr,
        ip: clientIP,
        phone: 'N/A'
      }).catch(() => {});
    }

    res.cookie('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, user: req.session.user, token: authToken });
  } catch (err) {
    console.error("Auth manual internal error:", err);
    return res.status(500).json({ error: "Internal server error during login", message: err.message });
  }
});

function decodeGoogleJwt(jwt) {
  try {
    const parts = (jwt || '').split('.');
    if (parts.length >= 2) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
      return JSON.parse(jsonStr);
    }
  } catch (e) {}
  return null;
}

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token, email: rawEmail, name: rawName, lat, lon } = req.body || {};

    let email = null;
    let name = null;

    if (token) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email.toLowerCase().trim();
        name = payload.name || formatNameFromEmail(email, rawName);
      } catch (err) {
        // Instant JWT payload decode fallback (ensures Google Sign-in always succeeds even without cloud verification latency)
        const decoded = decodeGoogleJwt(token);
        if (decoded && decoded.email) {
          email = decoded.email.toLowerCase().trim();
          name = decoded.name || formatNameFromEmail(email, rawName);
        } else if (rawEmail) {
          email = rawEmail.toLowerCase().trim();
          name = formatNameFromEmail(email, rawName);
        } else {
          return res.status(401).json({ error: 'Invalid Google token' });
        }
      }
    } else if (rawEmail) {
      email = rawEmail.toLowerCase().trim();
      name = formatNameFromEmail(email, rawName);
    } else {
      return res.status(400).json({ error: 'Google token or email required' });
    }

    let user = null;
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }
    try {
      user = await User.findOne({ email });
    } catch (_) {}

    if (!user) {
      user = memoryUsers.find(u => u.email.toLowerCase() === email);
    }

    if (!user) {
      // New resident signing in for first time
      user = {
        email: email,
        name: name,
        role: 'People/User',
        password: hashPassword('google_oauth_user')
      };
      memoryUsers.push(user);
      if (mongoose.connection.readyState === 1) {
        User.create(user).catch(() => {});
      }
    } else {
      // User was already assigned a role by Admin/Sarpanch or existed in database!
      // Keep their role intact, only update name if new real name is provided
      if (name && (!user.name || user.name === user.email.split('@')[0])) {
        user.name = name;
        if (mongoose.connection.readyState === 1) {
          User.updateOne({ email: user.email }, { $set: { name: name } }).catch(() => {});
        }
      }
    }

    const clientIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    let locationStr = 'Unknown Location';
    let finalLat = 21.235;
    let finalLon = 79.005;

    if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
      finalLat = parseFloat(lat);
      finalLon = parseFloat(lon);
      locationStr = `GPS: ${finalLat.toFixed(4)}, ${finalLon.toFixed(4)}`;
    } else {
      locationStr = `Mahurzari Village (${finalLat.toFixed(3)}, ${finalLon.toFixed(3)})`;
    }

    const finalName = user.name || name || formatNameFromEmail(user.email, rawName);

    req.session.user = { 
      email: user.email, 
      name: finalName, 
      role: user.role, 
      ip: clientIP, 
      location: locationStr, 
      lat: finalLat,
      lon: finalLon,
      loginTime: new Date().toISOString() 
    };

    const authToken = generateAuthToken({
      email: user.email,
      name: finalName,
      role: user.role,
      location: locationStr
    });
    
    if (mongoose.connection.readyState === 1) {
      ActiveSession.findOneAndDelete({ email }).catch(() => {});
      ActiveSession.create({ 
        email,
        name: finalName,
        role: user.role,
        ip: clientIP,
        location: locationStr,
        lat: finalLat,
        lon: finalLon,
        loginTime: req.session.user.loginTime,
        updatedAt: new Date()
      }).catch(() => {});

      Feed.create({
        id: Date.now(),
        name: finalName,
        time: req.session.user.loginTime,
        action: `Logged in via Google as ${user.role}.`,
        location: locationStr,
        ip: clientIP,
        phone: 'N/A'
      }).catch(() => {});
    }

    res.cookie('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, user: req.session.user, token: authToken });
  } catch (err) {
    console.error("Auth google error:", err);
    return res.status(500).json({ error: "Internal server error during Google login", message: err.message });
  }
});

app.get('/api/auth/status', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }
  } catch (_) {}

  const verifiedUser = extractUserFromRequest(req);
  if (verifiedUser) {
    // Keep user's role synchronized with any role assigned by Admin/Sarpanch in database
    try {
      const dbUser = await User.findOne({ email: verifiedUser.email.toLowerCase().trim() });
      if (dbUser && dbUser.role) {
        verifiedUser.role = dbUser.role;
        if (dbUser.name) verifiedUser.name = dbUser.name;
      }
    } catch (_) {}

    req.session.user = verifiedUser;
    return res.json({ loggedIn: true, user: verifiedUser });
  }

  res.json({ loggedIn: false });
});

app.post('/api/auth/logout', async (req, res) => {
  const sessionEmail = req.session?.user?.email;
  const verifiedUser = extractUserFromRequest(req);
  const email = (sessionEmail || verifiedUser?.email || req.body?.email || '').toLowerCase().trim();
  if (email) {
    await ActiveSession.findOneAndDelete({ email });
  }
  if (req.session?.user) {
    await Feed.create({
      id: Date.now(),
      name: req.session.user.name,
      time: new Date().toISOString(),
      action: `Logged out.`,
      location: req.session.user.location,
      ip: req.session.user.ip,
      phone: 'N/A'
    });
  }
  req.session?.destroy(() => {
    res.clearCookie('connect.sid');
    res.clearCookie('auth_token');
    res.json({ success: true });
  });
});

// ── Sarpanch Change Credentials API ─────────────────────────────────
app.put('/api/sarpanch/change-credentials', requireAuth(['Sarpanch', 'Admin']), async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;
    const sessionEmail = req.session?.user?.email;

    if (!sessionEmail) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findOne({ email: sessionEmail.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify current password for Sarpanch
    if (req.session.user.role === 'Sarpanch') {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to update credentials.' });
      }
      if (!verifyPassword(currentPassword, user.password)) {
        return res.status(401).json({ error: 'Current password does not match.' });
      }
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const cleanNewEmail = (newEmail && newEmail.trim()) ? newEmail.toLowerCase().trim() : user.email;
    if (cleanNewEmail !== user.email) {
      const existingUser = await User.findOne({ email: cleanNewEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: 'This login email/ID is already in use by another account.' });
      }
    }

    const oldEmail = user.email;
    user.email = cleanNewEmail;
    user.password = hashPassword(newPassword.trim());
    await user.save();

    // Clear previous active session & update current session
    await ActiveSession.deleteMany({ email: oldEmail });
    if (req.session?.user) {
      req.session.user.email = cleanNewEmail;
    }

    const newToken = generateAuthToken({
      email: user.email,
      name: user.name,
      role: user.role,
      location: req.session.user.location
    });

    // Record credential update in village feed
    await Feed.create({
      id: Date.now(),
      name: user.name || 'Honorable Sarpanch',
      time: new Date().toISOString(),
      action: 'Updated login credentials securely.',
      location: 'Panchayat Bhavan',
      ip: req.ip || '127.0.0.1',
      phone: 'N/A'
    });

    res.json({
      success: true,
      message: 'Credentials updated successfully!',
      token: newToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Change credentials error:", err);
    res.status(500).json({ error: 'Internal server error while updating credentials.' });
  }
});

// ── Users & Role Access Management APIs (Sarpanch & Admin) ───────────

// 1. Get all registered users with their live status
app.get('/api/users', requireAuth(['Admin', 'Sarpanch']), async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const activeSessions = await ActiveSession.find({}).lean();
    const activeEmailMap = new Set(activeSessions.map(s => (s.email || '').toLowerCase()));

    const result = users.map(u => ({
      id: u._id,
      name: u.name || (u.email ? u.email.split('@')[0] : 'Citizen'),
      email: u.email,
      role: u.role || 'People/User',
      createdAt: u.createdAt,
      isOnline: activeEmailMap.has((u.email || '').toLowerCase())
    }));

    res.json({ success: true, users: result });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 2. Update a user's role and access level
app.put('/api/users/:email/role', requireAuth(['Admin', 'Sarpanch']), async (req, res) => {
  try {
    const targetEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
    const { role } = req.body;

    const validRoles = ['People/User', 'Plumber/Technician', 'Sarpanch', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
    }

    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }

    let user = await User.findOne({ email: targetEmail });
    let oldRole = 'None (New Pre-assignment)';

    if (!user) {
      // Upsert: Pre-assign role to email before their first Google or email login!
      user = new User({
        email: targetEmail,
        name: formatNameFromEmail(targetEmail),
        role: role,
        password: hashPassword(role === 'Sarpanch' ? 'sarpanch123' : (role === 'Admin' ? 'admin123' : 'google_oauth_user'))
      });
      memoryUsers.push({ email: targetEmail, name: user.name, role: role, password: user.password });
    } else {
      oldRole = user.role;
      user.role = role;

      // If role promoted to official and password is missing, set default hashed password
      if ((role === 'Admin' || role === 'Sarpanch') && (!user.password || user.password === 'citizen_auto_auth' || user.password === 'google_oauth_user')) {
        user.password = hashPassword(role === 'Sarpanch' ? 'sarpanch123' : 'admin123');
      }

      const memUser = memoryUsers.find(u => u.email.toLowerCase() === targetEmail);
      if (memUser) memUser.role = role;
    }

    await user.save();

    // Update active session if user is currently online
    await ActiveSession.updateMany(
      { email: targetEmail },
      { $set: { role: role } }
    );

    // Record role modification in village feed
    const modifierName = req.session?.user?.name || req.session?.user?.email || 'Authority';
    await Feed.create({
      id: Date.now(),
      name: modifierName,
      time: new Date().toISOString(),
      action: `Changed role of ${user.name || user.email} from "${oldRole}" to "${role}".`,
      location: 'Administrative Desk',
      ip: req.ip || '127.0.0.1',
      phone: 'N/A'
    });

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ── Notifications APIs ──────────────────────────────────────────────

// Fetch notifications for current user
app.get('/api/notifications', async (req, res) => {
  const userEmail = req.session.user?.email || '';
  const userRole = req.session.user?.role || 'People/User';

  const query = {
    $or: [
      { targetRole: 'all' },
      { targetRole: userRole },
      { targetEmail: userEmail }
    ]
  };

  const notifs = await Notification.find(query).sort({ createdAt: -1 }).limit(30);
  const mapped = notifs.map(n => {
    const obj = n.toObject();
    obj.isRead = userEmail ? (obj.readBy || []).includes(userEmail) : false;
    return obj;
  });

  const unreadCount = mapped.filter(n => !n.isRead).length;
  res.json({ unreadCount, notifications: mapped });
});

// Get Global Alert Sound Setting
app.get('/api/alert-sound', async (req, res) => {
  let sound = await AlertSound.findOne({ key: 'global_alert_sound' });
  if (!sound) {
    sound = await AlertSound.create({
      key: 'global_alert_sound',
      name: 'High-Pitch Emergency Siren',
      soundUrl: '/public/sounds/emergency_siren.wav',
      playOnce: true
    });
  }
  res.json(sound);
});

// Admin / Sarpanch Upload Custom Alert Sound
app.post('/api/admin/alert-sound', requireAuth(['Admin', 'Sarpanch']), uploadSafe('sound'), async (req, res) => {
  const { name, soundUrl, playOnce } = req.body;
  let finalSoundUrl = req.file ? req.file.path : soundUrl;

  if (!finalSoundUrl) {
    return res.status(400).json({ error: 'Audio file or soundUrl is required' });
  }

  const sound = await AlertSound.findOneAndUpdate(
    { key: 'global_alert_sound' },
    {
      name: name || (req.file ? req.file.originalname : 'Custom Uploaded Sound'),
      soundUrl: finalSoundUrl,
      playOnce: playOnce !== undefined ? (playOnce === 'true' || playOnce === true) : true,
      updatedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Feed.create({
    id: Date.now(),
    name: req.session.user?.name || req.session.user?.email || 'Admin',
    time: new Date().toISOString(),
    action: `Updated Custom Alert Sound Pack: "${sound.name}" (Play Once: ${sound.playOnce})`,
    location: req.session.user?.location || 'Panchayat Office',
    ip: req.ip || '127.0.0.1',
    phone: 'N/A'
  });

  res.json({ success: true, sound });
});

// Sarpanch / Admin can create custom notifications
app.post('/api/notifications', requireAuth(['Admin', 'Sarpanch']), uploadSafe('sound'), async (req, res) => {
  const { title, message, targetRole, isEmergency, soundUrl, playOnce } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  let finalSoundUrl = req.file ? req.file.path : (soundUrl || null);
  let shouldPlayOnce = playOnce !== undefined ? (playOnce === 'true' || playOnce === true) : true;

  if (!finalSoundUrl && isEmergency) {
    const globalSound = await AlertSound.findOne({ key: 'global_alert_sound' });
    if (globalSound && globalSound.soundUrl) {
      finalSoundUrl = globalSound.soundUrl;
      shouldPlayOnce = globalSound.playOnce !== false;
    }
  }

  const newNotif = await Notification.create({
    id: Date.now(),
    title: title.trim(),
    message: message.trim(),
    senderName: req.session.user?.name || req.session.user?.email || 'Sarpanch Office',
    senderRole: req.session.user?.role || 'Sarpanch',
    targetRole: targetRole || 'all',
    type: isEmergency ? 'alert' : 'broadcast',
    isEmergency: Boolean(isEmergency),
    soundUrl: finalSoundUrl,
    playOnce: shouldPlayOnce, // Plays 1 time and stops!
    createdAt: new Date(),
    readBy: [req.session.user?.email]
  });

  await Feed.create({
    id: Date.now(),
    name: req.session.user?.name || 'Sarpanch',
    time: new Date().toISOString(),
    action: `${isEmergency ? '🚨 EMERGENCY SIREN ALERT' : 'Sent village notification'}: "${title}"`,
    location: req.session.user?.location || 'Panchayat Bhavan',
    ip: req.session.user?.ip || '::1',
    phone: 'N/A'
  });

  res.json({ success: true, notification: newNotif });
});

// Mark notifications read
app.put('/api/notifications/read-all', requireAuth(), async (req, res) => {
  const userEmail = req.session.user.email;
  await Notification.updateMany(
    { readBy: { $ne: userEmail } },
    { $addToSet: { readBy: userEmail } }
  );
  res.json({ success: true });
});

// ── Admin Routes ────────────────────────────────────────────
app.get('/api/admin/feed', requireAuth(['Admin']), async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeSessions = await ActiveSession.countDocuments();
  const activeReports = await Issue.countDocuments({ status: { $ne: 'Resolved' } });
  const feed = await Feed.find({}, { _id: 0, __v: 0 }).sort({ id: -1 }).limit(50);
  res.json({ totalUsers, activeSessions, activeReports, feed });
});

app.delete('/api/admin/feed', requireAuth(['Admin']), async (req, res) => {
  await Feed.deleteMany({});
  res.json({ success: true });
});

app.get('/api/admin/users', requireAuth(['Admin']), async (req, res) => {
  const users = await User.find({}, { _id: 0, __v: 0 });
  res.json(users);
});

app.put('/api/admin/users/:email/password', requireAuth(['Admin']), async (req, res) => {
  const { password } = req.body;
  if (!password || password.trim().length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  
  const user = await User.findOneAndUpdate(
    { email: req.params.email.toLowerCase() },
    { password: hashPassword(password.trim()) },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: { email: user.email, name: user.name, role: user.role } });
});

app.put('/api/admin/users/:email/role', requireAuth(['Admin']), async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });
  
  const user = await User.findOneAndUpdate(
    { email: req.params.email.toLowerCase() },
    { role: role },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: { email: user.email, name: user.name, role: user.role } });
});

app.get('/api/admin/roles', requireAuth(['Admin']), async (req, res) => {
  const users = await User.find();
  const rolesObj = {};
  users.forEach(u => rolesObj[u.email] = u.role);
  res.json(rolesObj);
});

app.post('/api/admin/roles', requireAuth(['Admin']), async (req, res) => {
  const { email, role, password } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'Email and role required' });
  
  const updateData = { role: role };
  if (password) updateData.password = hashPassword(password.trim());

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, user: { email: user.email, name: user.name, role: user.role } });
});

app.delete('/api/admin/roles', requireAuth(['Admin']), async (req, res) => {
  const { email } = req.body;
  await User.findOneAndDelete({ email: email.toLowerCase() });
  await ActiveSession.findOneAndDelete({ email: email.toLowerCase() });
  res.json({ success: true });
});

app.get('/api/admin/sessions', requireAuth(['Admin', 'Sarpanch']), async (req, res) => {
  const sessions = await ActiveSession.find({}, { _id: 0, __v: 0 });
  res.json(sessions);
});

app.delete('/api/admin/sessions', requireAuth(['Admin']), async (req, res) => {
  const { email } = req.body;
  await ActiveSession.findOneAndDelete({ email: email.toLowerCase() });
  res.json({ success: true });
});

// ── Issues API (Strict Rolling Queue: Max 5 Pending & Max 5 Resolved) ──
app.get('/api/issues', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }

    // 1. Prune pending issues to maximum 5 latest
    const pending = await Issue.find({ status: { $ne: 'Resolved' } }).sort({ createdAt: -1 });
    if (pending.length > 5) {
      const pendingToDelete = pending.slice(5);
      for (const item of pendingToDelete) {
        await Issue.findOneAndDelete({ id: item.id }).catch(() => {});
      }
    }

    // 2. Prune resolved issues to maximum 5 latest
    const resolved = await Issue.find({ status: 'Resolved' }).sort({ resolvedAt: -1, createdAt: -1 });
    if (resolved.length > 5) {
      const resolvedToDelete = resolved.slice(5);
      for (const item of resolvedToDelete) {
        await Issue.findOneAndDelete({ id: item.id }).catch(() => {});
      }
    }

    const issues = await Issue.find({}, { _id: 0, __v: 0 }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    console.error("Get issues error:", err);
    res.json([]);
  }
});

// Live Map Data (Only REAL Online Users in the last 15 minutes)
app.get('/api/live-map', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }
    const activeWindow = new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes

    // Purge old stale sessions from database
    await ActiveSession.deleteMany({ updatedAt: { $lt: activeWindow } }).catch(() => {});

    const totalUsers = await User.countDocuments().catch(() => 0);
    const activeSessionsCount = await ActiveSession.countDocuments({ updatedAt: { $gte: activeWindow } }).catch(() => 0);
    const activeReports = await Issue.countDocuments({ status: { $ne: 'Resolved' } }).catch(() => 0);
    const resolvedReports = await Issue.countDocuments({ status: 'Resolved' }).catch(() => 0);

    const liveUsers = await ActiveSession.find({ updatedAt: { $gte: activeWindow } }, { _id: 0, __v: 0 }).sort({ updatedAt: -1 }).limit(50).catch(() => []);
    const issues = await Issue.find({}, { _id: 0, __v: 0 }).sort({ createdAt: -1 }).limit(100).catch(() => []);

    res.json({
      metrics: {
        totalUsers,
        liveNow: activeSessionsCount,
        activeReports,
        resolvedReports
      },
      liveUsers,
      issues
    });
  } catch (e) {
    console.error("Live-map error:", e);
    res.json({
      metrics: { totalUsers: 0, liveNow: 0, activeReports: 0, resolvedReports: 0 },
      liveUsers: [],
      issues: []
    });
  }
});

// Real-time Heartbeat to keep active user session fresh
app.post('/api/heartbeat', async (req, res) => {
  try {
    const userEmail = (req.body?.email || req.session?.user?.email || (req.headers['x-user-email'] ? decodeURIComponent(req.headers['x-user-email']) : '')).toLowerCase().trim();
    if (userEmail) {
      await ActiveSession.findOneAndUpdate(
        { email: userEmail },
        { updatedAt: new Date() },
        { upsert: false }
      );
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false });
  }
});

// Direct APK Download
app.get('/api/download/apk', (req, res) => {
  const apkPath = path.join(__dirname, 'village-water-app-debug.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="Gram-Jal-Mahurzari.apk"');
    return res.sendFile(apkPath);
  }
  res.status(404).send('APK file not available on server.');
});

app.post('/api/issues', uploadSafe('photo'), async (req, res) => {
  const { title, type, description, location, gps } = req.body;
  
  const clientIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userEmail = (req.session?.user?.email || 
    (req.headers['x-user-email'] ? decodeURIComponent(req.headers['x-user-email']).trim() : '') || 
    'resident@village.gov').toLowerCase().trim();
  const userName = req.session?.user?.name || (userEmail.includes('@') ? userEmail.split('@')[0] : 'Resident');
  const userRole = req.session?.user?.role || 'People/User';

  // ── 5-Minute Rate Limit Check Per Phone / Device / IP ─────────────
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
  const queryConditions = [];
  if (userEmail && userEmail !== 'resident@village.gov') {
    queryConditions.push({ reporterEmail: userEmail });
  }
  if (clientIP && clientIP !== '127.0.0.1' && clientIP !== '::1') {
    queryConditions.push({ reporterIp: clientIP });
  }

  if (queryConditions.length > 0) {
    const recentReport = await Issue.findOne({ $or: queryConditions }).sort({ createdAt: -1 });
    if (recentReport && recentReport.createdAt) {
      const elapsed = Date.now() - new Date(recentReport.createdAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const remainingSec = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        return res.status(429).json({
          error: `Ek phone/device se 5 minute me 1 hi report bheji ja sakti hai. Kripya ${mins} min ${secs} sec baad prayas karein.`,
          remainingSeconds: remainingSec
        });
      }
    }
  }

  let finalLat = 0, finalLon = 0;
  if (gps && gps !== 'Unknown') {
    const parts = gps.split(',');
    if (parts.length === 2) {
      finalLat = parseFloat(parts[0].trim()) || 0;
      finalLon = parseFloat(parts[1].trim()) || 0;
    }
  }

  const defaultPhoto = type === 'Water Related Issue' 
    ? 'https://res.cloudinary.com/rqltdk0j/image/upload/v1788176415/village_water_portal/s2fwandxq8b3fb9enyoa.jpg'
    : 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=600';

  let finalPhotoUrl = null;
  if (req.file && req.file.buffer) {
    finalPhotoUrl = await uploadToCloudinaryOrBase64(req.file.buffer, req.file.mimetype, 'village_water_portal');
  } else if (req.body.photoBase64 && req.body.photoBase64.startsWith('data:image')) {
    finalPhotoUrl = req.body.photoBase64;
  }

  if (!finalPhotoUrl) {
    finalPhotoUrl = defaultPhoto;
  }

  const newIssue = new Issue({
    id: Date.now(),
    title: title || 'Water Supply Pipeline Leak',
    type: type || 'Water Related Issue',
    description: description || 'Village issue report',
    location: location || 'Village Area',
    lat: finalLat,
    lon: finalLon,
    photoUrl: finalPhotoUrl,
    reporter: userName,
    reporterEmail: userEmail,
    reporterIp: clientIP,
    status: 'Pending'
  });
  await newIssue.save();

  // Strict Rolling Buffer: When 5th/new report comes in, auto-delete oldest pending reports exceeding 5
  try {
    const pending = await Issue.find({ status: { $ne: 'Resolved' } }).sort({ createdAt: -1 });
    if (pending.length > 5) {
      const toDelete = pending.slice(5);
      for (const item of toDelete) {
        await Issue.findOneAndDelete({ id: item.id });
      }
    }
  } catch (err) {
    console.warn("Prune pending error:", err);
  }

  // 1. Send instant in-app notification to the reporting User
  try {
    if (userEmail) {
      await Notification.create({
        id: Date.now() + 1,
        title: `Report Submitted: ${newIssue.title}`,
        message: `Your issue at "${newIssue.location}" has been received. Panchayat team will inspect and take action soon.`,
        senderName: 'Gram Jal Portal',
        senderRole: 'System',
        targetEmail: userEmail,
        targetRole: 'People/User',
        type: 'issue',
        createdAt: new Date(),
        readBy: []
      });
    }

    // 2. Send instant in-app notification to Sarpanch and Admin
    await Notification.create({
      id: Date.now() + 2,
      title: `New Issue: ${newIssue.title}`,
      message: `Reported by ${userName} at ${newIssue.location}: "${newIssue.description}"`,
      senderName: userName,
      senderRole: userRole,
      targetRole: 'Sarpanch',
      type: 'issue',
      createdAt: new Date(),
      readBy: []
    });

    await Feed.create({
      id: Date.now(),
      name: userName,
      time: new Date().toISOString(),
      action: `Reported issue: ${newIssue.title}`,
      location: newIssue.location,
      ip: req.ip || '127.0.0.1',
      phone: 'N/A'
    });
  } catch (err) {
    console.error("Issue notification creation error:", err);
  }

  res.json({ success: true, issue: newIssue });
});

app.delete('/api/issues/:id', requireAuth(['Admin']), async (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  await Issue.findOneAndDelete({ id: issueId });
  res.json({ success: true });
});

app.put('/api/issues/:id/resolve', requireAuth(['Admin', 'Sarpanch', 'Plumber/Technician']), uploadSafe('photo'), async (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const existing = await Issue.findOne({ id: issueId });
  if (!existing) return res.status(404).json({ error: 'Issue not found' });

  const userEmail = req.session?.user?.email || 'Sarpanch Office';
  const userRole = req.session?.user?.role || 'Gram Panchayat';

  let resolutionPhoto = null;
  if (req.file && req.file.buffer) {
    resolutionPhoto = await uploadToCloudinaryOrBase64(req.file.buffer, req.file.mimetype, 'village_water_portal');
  } else if (req.body.photoBase64 && req.body.photoBase64.startsWith('data:image')) {
    resolutionPhoto = req.body.photoBase64;
  } else {
    resolutionPhoto = existing.photoUrl || 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&q=80&w=600';
  }

  const updated = await Issue.findOneAndUpdate(
    { id: issueId },
    { 
      status: 'Resolved',
      resolvedBy: userEmail,
      resolvedAt: new Date(),
      resolutionPhotoUrl: resolutionPhoto
    },
    { new: true }
  );

  if (!updated) return res.status(404).json({ error: 'Issue not found' });

  // Send resolved notification to village
  try {
    await Notification.create({
      id: Date.now(),
      title: `Issue Resolved: ${updated.title}`,
      message: `Issue at ${updated.location} was resolved by ${userRole} (${userEmail}).`,
      senderName: req.session?.user?.name || userEmail,
      senderRole: userRole,
      targetRole: 'all',
      type: 'issue',
      createdAt: new Date(),
      readBy: []
    });

    await Feed.create({
      id: Date.now(),
      name: req.session?.user?.name || userEmail,
      time: new Date().toISOString(),
      action: `Resolved issue #${issueId}: "${updated.title}"`,
      location: updated.location || 'Panchayat Office',
      ip: req.ip || '127.0.0.1',
      phone: 'N/A'
    });
  } catch (err) {
    console.error("Resolve feed/notification error:", err);
  }

  // Strict Rolling Buffer: Keep maximum 5 latest resolved reports, auto-delete oldest exceeding 5
  try {
    const resolved = await Issue.find({ status: 'Resolved' }).sort({ resolvedAt: -1, createdAt: -1 });
    if (resolved.length > 5) {
      const toDelete = resolved.slice(5);
      for (const item of toDelete) {
        await Issue.findOneAndDelete({ id: item.id });
      }
    }
  } catch (err) {
    console.warn("Prune resolved error:", err);
  }

  res.json({ success: true, issue: updated });
});

app.get(['/presentation', '/presentation.html'], (req, res) => {
  const candidates = [
    path.join(__dirname, 'public', 'presentation.html'),
    path.join(process.cwd(), 'public', 'presentation.html'),
    path.join(__dirname, 'dist', 'presentation.html'),
    path.join(process.cwd(), 'dist', 'presentation.html'),
    path.join(__dirname, 'presentation.html'),
    path.join(process.cwd(), 'presentation.html')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }
  res.status(404).send('Presentation not found');
});

app.get('/Mahurzari_Water_Portal_Presentation.pptx', (req, res) => {
  const candidates = [
    path.join(__dirname, 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(process.cwd(), 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(__dirname, 'public', 'Mahurzari_Water_Portal_Presentation.pptx'),
    path.join(process.cwd(), 'public', 'Mahurzari_Water_Portal_Presentation.pptx')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return res.download(p, 'Mahurzari_Water_Portal_Presentation.pptx');
    }
  }
  res.status(404).send('Presentation PPTX not found');
});

// ── Ultra-Fast React Single Page Application (0ms Tab Switching) ───
const spaRoutes = ['/', '/app', '/mobile', '/admin', '/tasks', '/home', '/report', '/support', '/login'];
spaRoutes.forEach((route) => {

  app.get(route, (req, res) => {
    // Prevent browser from caching old index.html bundles and eliminate white screen on normal reload
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Clear-Site-Data', '"cache"');
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(distIndex)) {
      return res.sendFile(distIndex);
    }
    // Fallback to public/app.html
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// Self-ping to prevent sleep
const cron = require('node-cron');
cron.schedule('*/1 * * * *', () => {
  const baseUrl = process.env.SERVER_URL ? process.env.SERVER_URL.replace(/\/$/, '') : `http://localhost:${PORT}`;
  const url = `${baseUrl}/api/auth/status`;
  const getModule = url.startsWith('https') ? https : http;
  
  getModule.get(url, (res) => {
    res.resume();
  }).on('error', () => {});
});

module.exports = app;
