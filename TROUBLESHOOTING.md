# Frontend "Failed to Fetch" Error - Troubleshooting Guide

## Problem Summary
The error "Failed to fetch" is occurring in the DoctorDashboard component when it tries to load consultation data. This is typically caused by:

1. **Backend server not running** at `http://localhost:8000`
2. **Network connectivity issues** between frontend (3000) and backend (8000)
3. **Missing or invalid authentication token**
4. **Silent error catching** - errors were being caught but not logged

## Root Cause
The original code had several issues:

```javascript
// BEFORE: Silent error catching
const fetchAll = useCallback(async () => {
  try {
    const [qRes, aRes, nRes] = await Promise.all([...]);
    if (qRes.ok) setQueue(...);
    if (aRes.ok) setAssigned(...);
    if (nRes.ok) setNotifications(...);
  } catch (e) {} // ❌ Errors silently ignored!
  finally { setLoading(false); }
}, [token]);

// No token guard - fetches even if no token!
useEffect(() => { 
  fetchAll(); // ❌ Runs without checking if token exists
  const i = setInterval(fetchAll, 30000); 
  return () => clearInterval(i); 
}, [fetchAll]); // ❌ Missing 'token' dependency!
```

## Fixes Applied

### 1. Added Backend Connectivity Check
```javascript
useEffect(() => {
  console.log("🔍 Checking backend connectivity...");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  fetch("http://localhost:8000/health", { 
    method: "GET",
    signal: controller.signal
  })
    .then(r => {
      clearTimeout(timeoutId);
      if (r.ok) {
        console.log("✅ Backend is online");
      } else {
        console.warn("⚠️ Backend responded with:", r.status);
      }
    })
    .catch(e => {
      clearTimeout(timeoutId);
      console.error("❌ Backend connection failed:", e.message);
      alert("⚠️ Cannot connect to backend. Please ensure the server is running on localhost:8000");
    });
}, []);
```

### 2. Added Token Guard & Better Error Logging
```javascript
const fetchAll = useCallback(async () => {
  // ✅ Guard: Don't fetch if no token available
  if (!token) {
    console.warn("⚠️ No token available, skipping fetch");
    setLoading(false);
    return;
  }

  try {
    console.log("📡 Fetching consultation data...");
    const [qRes, aRes, nRes] = await Promise.all([...]);
    
    // ✅ Log individual failures
    if (!qRes.ok) console.warn("Queue fetch failed:", qRes.status);
    if (!aRes.ok) console.warn("Assigned fetch failed:", aRes.status);
    if (!nRes.ok) console.warn("Notifications fetch failed:", nRes.status);
    
    if (qRes.ok) setQueue((await qRes.json()).consultations || []);
    if (aRes.ok) setAssigned((await aRes.json()).consultations || []);
    if (nRes.ok) setNotifications((await nRes.json()).notifications || []);
    
    console.log("✅ Data fetched successfully");
  } catch (e) {
    // ✅ Log errors instead of silently catching
    console.error("❌ Error fetching consultation data:", e);
  } finally {
    setLoading(false);
  }
}, [token]);

// ✅ Check token & add it to dependencies
useEffect(() => {
  if (!token) {
    console.warn("⚠️ Skipping data fetch - no token available");
    setLoading(false);
    return;
  }
  
  fetchAll();
  const i = setInterval(fetchAll, 30000);
  return () => clearInterval(i);
}, [fetchAll, token]); // ✅ Added token dependency
```

### 3. Improved Other Fetch Calls
- Added error logging to `selectedConsultation` fetch
- Added try-catch to `handleReject` function
- Added proper error messages to alert users

## How to Troubleshoot

### Step 1: Check Backend Status
```bash
# In a terminal, check if backend is running
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","message":"MedAI API v3.0 running"}
```

### Step 2: Check Browser Console
Open DevTools (F12) → Console tab and look for:
- ✅ "✅ Backend is online" - Backend is reachable
- ❌ "❌ Backend connection failed" - Backend is not running

### Step 3: Start the Backend (if not running)
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Step 4: Verify Frontend Can Access Backend
Run this in the browser console:
```javascript
// Create a quick test
fetch("http://localhost:8000/health")
  .then(r => r.json())
  .then(d => console.log("✅ Backend OK:", d))
  .catch(e => console.error("❌ Failed:", e.message))
```

### Step 5: Check Network Tab
In DevTools → Network tab:
- Look for failed requests to `http://localhost:8000/api/v1/*`
- Check the response and status code
- Look for CORS errors in the response headers

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Failed to fetch" with no other errors | Backend not running. Start it with `python -m uvicorn main:app --reload --port 8000` |
| 401 Unauthorized | Token expired or invalid. Clear localStorage and log in again |
| 503 Service Unavailable | Backend crashed. Check terminal for errors |
| CORS error in console | Backend CORS configuration issue (unlikely, already has `allow_origins=["*"]`) |
| Timeout errors | Backend is slow or unresponsive. Check backend terminal |

## Testing the Diagnostic Tool

A diagnostic tool has been created at:
```
frontend/src/utils/backendTest.js
```

To use it in the browser console:
```javascript
import { testBackendConnectivity } from './utils/backendTest.js';
testBackendConnectivity();
```

This will:
1. Test `/health` endpoint
2. Test `/api/v1/health` endpoint
3. Test `/api/v1/auth/login` endpoint
4. Test `/api/v1/consultations/queue` (if logged in)
5. Display detailed results and troubleshooting steps

## Files Modified
- `frontend/src/pages/DoctorDashboard.jsx` - Added backend check, improved error handling
- `frontend/src/utils/backendTest.js` - Created diagnostic tool

## Next Steps
1. Ensure backend is running: `python -m uvicorn main:app --reload --port 8000`
2. Clear browser cache and localStorage (or just refresh)
3. Open DevTools → Console and look for error messages
4. Verify the backend health check shows "✅ Backend is online"
5. Test the diagnostic tool if issues persist
