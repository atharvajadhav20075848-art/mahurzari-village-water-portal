const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const http = require('http');
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('trust proxy', true);

app.use(session({
  secret: process.env.SESSION_SECRET || 'gram-panchayat-water-secret-key-12345',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 } // 1 year persistent session
}));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "547185696384-nfog7eetv58j1vh6c75u42jd88gcqsi2.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ── Database Setup (MongoDB with Serverless Caching) ───────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://atharvajadhav20075848_db_user:T6Xj3t4KOCtpfbXT@cluster0.hrxwdsn.mongodb.net/?appName=Cluster0";

let isConnecting = false;
async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (isConnecting) {
    await new Promise(resolve => mongoose.connection.once('open', resolve));
    return mongoose.connection;
  }
  try {
    isConnecting = true;
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Live Database!');
    await seedDefaultUsers();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
  } finally {
    isConnecting = false;
  }
}
connectToDatabase();

app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectToDatabase();
  }
  
  // Global Session Auto-Hydration for Serverless environments
  if (!req.session.user && req.headers['x-user-email']) {
    try {
      const decodedEmail = decodeURIComponent(req.headers['x-user-email']).toLowerCase().trim();
      const user = await User.findOne({ email: decodedEmail });
      if (user) {
        req.session.user = {
          email: user.email,
          name: user.email.split('@')[0],
          role: user.role,
          ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
          location: 'Saved Device',
          loginTime: new Date().toISOString()
        };
      }
    } catch(e) {}
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
        { email: 'admin@village.gov.in', name: 'Panchayat Admin', role: 'Admin', password: 'admin123' },
        { email: 'sarpanch@village.gov.in', name: 'Gram Sarpanch', role: 'Sarpanch', password: 'sarpanch123' },
        { email: 'resident@village.gov.in', name: 'Sample Resident', role: 'People/User', password: 'user123' }
      ]);
      console.log("Seeded default users to MongoDB.");
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
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "rqltdk0j",
  api_key: process.env.CLOUDINARY_API_KEY || "456694174673441",
  api_secret: process.env.CLOUDINARY_API_SECRET || "I4-h0pKuAsiCQtG0e4ZCNylQZzM"
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
      return resolve({ city: 'Pune', region: 'Maharashtra', country: 'India', ip: ip, lat: 18.5204, lon: 73.8567 });
    }

    const url = `http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon,query`;
    http.get(url, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'success') {
            resolve({
              city: parsed.city || 'Unknown',
              region: parsed.regionName || '',
              country: parsed.country || '',
              ip: parsed.query || ip,
              lat: parsed.lat || 0,
              lon: parsed.lon || 0
            });
          } else {
            resolve({ city: 'Unknown', region: '', country: '', ip: ip, lat: 0, lon: 0 });
          }
        } catch (e) {
          resolve({ city: 'Unknown', region: '', country: '', ip: ip, lat: 0, lon: 0 });
        }
      });
    }).on('error', () => {
      resolve({ city: 'Unknown', region: '', country: '', ip: ip, lat: 0, lon: 0 });
    });
  });
}

function formatLocationString(loc) {
  const parts = [loc.city, loc.region, loc.country].filter(Boolean);
  return parts.join(', ') || 'Unknown Location';
}

function requireAuth(allowedRoles) {
  return async (req, res, next) => {
    // If session lost in serverless cold start, try restoring from x-user-email header
    if (!req.session.user && req.headers['x-user-email']) {
      try {
        const decodedEmail = decodeURIComponent(req.headers['x-user-email']).toLowerCase().trim();
        const user = await User.findOne({ email: decodedEmail });
        if (user) {
          req.session.user = {
            email: user.email,
            name: user.email.split('@')[0],
            role: user.role,
            ip: req.ip || '127.0.0.1',
            location: 'Saved Device',
            loginTime: new Date().toISOString()
          };
        }
      } catch(e) {}
    }

    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
    if (allowedRoles && !allowedRoles.includes(req.session.user.role)) return res.status(403).json({ error: 'Forbidden' });
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
  const { email, password, name: rawName, lat, lon } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: cleanEmail });
  const isOfficial = (user && (user.role === 'Admin' || user.role === 'Sarpanch')) || cleanEmail === 'admin@village.gov.in' || cleanEmail === 'sarpanch@village.gov.in';

  if (isOfficial) {
    if (!password) {
      return res.status(400).json({ error: 'Password is required for Official accounts' });
    }
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Access Denied', message: 'Invalid official credentials.' });
    }
  } else {
    // Resident / Citizen Login: Instant access, auto-register if new
    const displayName = formatNameFromEmail(cleanEmail, rawName);
    if (!user) {
      user = await User.create({
        email: cleanEmail,
        name: displayName,
        role: 'People/User',
        password: 'citizen_auto_auth'
      });
    } else if (rawName && !user.name) {
      user.name = displayName;
      await user.save();
    }
  }

  const clientIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  let locationStr = 'Unknown Location';
  let finalLat = 0;
  let finalLon = 0;

  if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
    finalLat = parseFloat(lat);
    finalLon = parseFloat(lon);
    locationStr = `GPS: ${finalLat.toFixed(5)}, ${finalLon.toFixed(5)}`;
  } else {
    const location = await getLocationFromIP(clientIP);
    locationStr = formatLocationString(location);
    finalLat = location.lat || 21.235; // Default to Mahurzari, Nagpur area
    finalLon = location.lon || 79.005;
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

  await ActiveSession.findOneAndDelete({ email: user.email });
  await ActiveSession.create({ 
    email: user.email,
    name: finalName,
    role: user.role,
    ip: clientIP,
    location: locationStr,
    lat: finalLat,
    lon: finalLon,
    loginTime: req.session.user.loginTime,
    updatedAt: new Date()
  });
  
  await Feed.create({
    id: Date.now(),
    name: finalName,
    time: req.session.user.loginTime,
    action: `Logged in as ${user.role}.`,
    location: locationStr,
    ip: clientIP,
    phone: 'N/A'
  });

  res.json({ success: true, user: req.session.user });
});

app.post('/api/auth/google', async (req, res) => {
  const { token, email: rawEmail, name: rawName, lat, lon } = req.body;

  let email, name;

  if (token) {
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      email = payload.email.toLowerCase().trim();
      name = payload.name || formatNameFromEmail(email, rawName);
    } catch (err) {
      if (rawEmail) {
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

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email: email,
      name: name,
      role: 'People/User',
      password: 'google_oauth_user'
    });
  }

  const clientIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  let locationStr = 'Unknown Location';
  let finalLat = 0;
  let finalLon = 0;

  if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
    finalLat = parseFloat(lat);
    finalLon = parseFloat(lon);
    locationStr = `GPS: ${finalLat.toFixed(5)}, ${finalLon.toFixed(5)}`;
  } else {
    const location = await getLocationFromIP(clientIP);
    locationStr = formatLocationString(location);
    finalLat = location.lat || 21.235;
    finalLon = location.lon || 79.005;
  }

  const finalName = user.name || name || formatNameFromEmail(user.email, rawName);

  req.session.user = { 
    email, 
    name: finalName, 
    role: user.role, 
    ip: clientIP, 
    location: locationStr, 
    lat: finalLat,
    lon: finalLon,
    loginTime: new Date().toISOString() 
  };
  
  await ActiveSession.findOneAndDelete({ email });
  await ActiveSession.create({ 
    email,
    name: finalName,
    role: user.role,
    ip: clientIP,
    location: locationStr,
    lat: finalLat,
    lon: finalLon,
    loginTime: req.session.user.loginTime,
    updatedAt: new Date()
  });

  await Feed.create({
    id: Date.now(),
    name: finalName,
    time: req.session.user.loginTime,
    action: `Logged in via Google as ${user.role}.`,
    location: locationStr,
    ip: clientIP,
    phone: 'N/A'
  });

  res.json({ success: true, user: req.session.user });
});

app.get('/api/auth/status', async (req, res) => {
  if (!req.session.user && req.headers['x-user-email']) {
    try {
      const decodedEmail = decodeURIComponent(req.headers['x-user-email']).toLowerCase().trim();
      const user = await User.findOne({ email: decodedEmail });
      if (user) {
        req.session.user = {
          email: user.email,
          name: user.email.split('@')[0],
          role: user.role,
          ip: req.ip || '127.0.0.1',
          location: 'Saved Device',
          loginTime: new Date().toISOString()
        };
      }
    } catch(e) {}
  }

  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const email = (req.body?.email || req.session?.user?.email || (req.headers['x-user-email'] ? decodeURIComponent(req.headers['x-user-email']) : '')).toLowerCase().trim();
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
    res.json({ success: true });
  });
});

// ── Sarpanch Change Credentials API ─────────────────────────────────
app.put('/api/sarpanch/change-credentials', async (req, res) => {
  try {
    const { currentEmail, newEmail, newPassword } = req.body;
    const headerEmail = req.headers['x-user-email'] ? decodeURIComponent(req.headers['x-user-email']).toLowerCase().trim() : null;
    const sessionEmail = req.session?.user?.email;

    const targetEmail = (currentEmail || headerEmail || sessionEmail || '').toLowerCase().trim();

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    // Locate Sarpanch account by email, or role 'Sarpanch'
    let user = null;
    if (targetEmail) {
      user = await User.findOne({ email: targetEmail });
    }
    if (!user) {
      user = await User.findOne({ role: 'Sarpanch' });
    }
    if (!user) {
      return res.status(404).json({ error: 'Sarpanch account not found.' });
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
    user.password = newPassword.trim();
    user.role = 'Sarpanch';
    await user.save();

    // Clear previous active session & update current session
    await ActiveSession.deleteMany({ email: oldEmail });
    if (req.session?.user) {
      req.session.user.email = cleanNewEmail;
      req.session.user.role = 'Sarpanch';
    }

    // Record credential update in village feed
    await Feed.create({
      id: Date.now(),
      name: user.name || 'Honorable Sarpanch',
      time: new Date().toISOString(),
      action: 'Updated Sarpanch administrative login credentials.',
      location: 'Panchayat Bhavan',
      ip: req.ip || '127.0.0.1',
      phone: 'N/A'
    });

    res.json({
      success: true,
      message: 'Sarpanch credentials updated successfully!',
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
  if (!password) return res.status(400).json({ error: 'Password is required' });
  
  const user = await User.findOneAndUpdate(
    { email: req.params.email.toLowerCase() },
    { password: password },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user });
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
  res.json({ success: true, user });
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
  if (password) updateData.password = password;

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, user });
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
    // 1. Prune pending issues to maximum 5 latest
    const pending = await Issue.find({ status: { $ne: 'Resolved' } }).sort({ createdAt: -1 });
    if (pending.length > 5) {
      const pendingToDelete = pending.slice(5);
      for (const item of pendingToDelete) {
        await Issue.findOneAndDelete({ id: item.id });
      }
    }

    // 2. Prune resolved issues to maximum 5 latest
    const resolved = await Issue.find({ status: 'Resolved' }).sort({ resolvedAt: -1, createdAt: -1 });
    if (resolved.length > 5) {
      const resolvedToDelete = resolved.slice(5);
      for (const item of resolvedToDelete) {
        await Issue.findOneAndDelete({ id: item.id });
      }
    }

    const issues = await Issue.find({}, { _id: 0, __v: 0 }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Live Map Data (Only REAL Online Users in the last 15 minutes)
app.get('/api/live-map', async (req, res) => {
  try {
    const activeWindow = new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes

    // Purge old stale sessions from database
    await ActiveSession.deleteMany({ updatedAt: { $lt: activeWindow } });

    const totalUsers = await User.countDocuments();
    const activeSessionsCount = await ActiveSession.countDocuments({ updatedAt: { $gte: activeWindow } });
    const activeReports = await Issue.countDocuments({ status: { $ne: 'Resolved' } });
    const resolvedReports = await Issue.countDocuments({ status: 'Resolved' });

    const liveUsers = await ActiveSession.find({ updatedAt: { $gte: activeWindow } }, { _id: 0, __v: 0 }).sort({ updatedAt: -1 }).limit(50);
    const issues = await Issue.find({}, { _id: 0, __v: 0 }).sort({ createdAt: -1 }).limit(100);

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
    res.status(500).json({ error: e.message });
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

app.put('/api/issues/:id/resolve', uploadSafe('photo'), async (req, res) => {
  const issueId = parseInt(req.params.id, 10);
  const existing = await Issue.findOne({ id: issueId });
  if (!existing) return res.status(404).json({ error: 'Issue not found' });

  const userEmail = req.session?.user?.email || (req.headers['x-user-email'] ? decodeURIComponent(req.headers['x-user-email']) : null) || 'Sarpanch Office';
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

// ── Ultra-Fast React Single Page Application (0ms Tab Switching) ───
const spaRoutes = ['/', '/app', '/mobile', '/admin', '/tasks', '/home', '/report', '/support', '/login'];
spaRoutes.forEach((route) => {
  app.get(route, (req, res) => {
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
const https = require('https');
cron.schedule('*/1 * * * *', () => {
  const baseUrl = process.env.SERVER_URL ? process.env.SERVER_URL.replace(/\/$/, '') : `http://localhost:${PORT}`;
  const url = `${baseUrl}/api/auth/status`;
  const getModule = url.startsWith('https') ? https : http;
  
  getModule.get(url, (res) => {
    res.resume();
  }).on('error', () => {});
});

module.exports = app;
