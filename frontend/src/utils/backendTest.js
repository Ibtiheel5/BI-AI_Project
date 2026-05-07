/**
 * Backend Connectivity Diagnostic Tool
 * Run this to test if the backend is properly connected
 */

export async function testBackendConnectivity() {
  const results = {
    health: null,
    apiHealth: null,
    auth: null,
    consultations: null,
    errors: []
  };

  console.log("🔍 Starting backend connectivity tests...\n");

  // Test 1: Health endpoint
  try {
    console.log("Test 1: Health endpoint (/health)");
    const res = await fetch("http://localhost:8000/health", { 
      signal: AbortSignal.timeout(3000)
    });
    results.health = {
      status: res.status,
      ok: res.ok,
      data: await res.json()
    };
    console.log(`✅ /health: ${res.status} OK\n`);
  } catch (e) {
    results.health = { error: e.message };
    results.errors.push(`❌ /health failed: ${e.message}`);
    console.error(`❌ /health: ${e.message}\n`);
  }

  // Test 2: API Health endpoint
  try {
    console.log("Test 2: API Health endpoint (/api/v1/health)");
    const res = await fetch("http://localhost:8000/api/v1/health", {
      signal: AbortSignal.timeout(3000)
    });
    results.apiHealth = {
      status: res.status,
      ok: res.ok,
      data: await res.json()
    };
    console.log(`✅ /api/v1/health: ${res.status} OK\n`);
  } catch (e) {
    results.apiHealth = { error: e.message };
    results.errors.push(`❌ /api/v1/health failed: ${e.message}`);
    console.error(`❌ /api/v1/health: ${e.message}\n`);
  }

  // Test 3: Auth endpoints
  try {
    console.log("Test 3: Auth endpoint (/api/v1/auth/login)");
    const res = await fetch("http://localhost:8000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "username=test&password=test",
      signal: AbortSignal.timeout(3000)
    });
    results.auth = {
      status: res.status,
      ok: res.ok,
      message: "Endpoint reachable"
    };
    console.log(`✅ /api/v1/auth/login: ${res.status} (reachable)\n`);
  } catch (e) {
    results.auth = { error: e.message };
    results.errors.push(`❌ /api/v1/auth/login failed: ${e.message}`);
    console.error(`❌ /api/v1/auth/login: ${e.message}\n`);
  }

  // Test 4: Consultations endpoint (requires auth)
  try {
    console.log("Test 4: Consultations endpoint (/api/v1/consultations/queue)");
    const token = localStorage.getItem("medai-token");
    if (!token) {
      results.consultations = { 
        error: "No token found",
        message: "Cannot test authenticated endpoint without token"
      };
      console.warn("⚠️ No token found - skipping authenticated endpoint test\n");
    } else {
      const res = await fetch("http://localhost:8000/api/v1/consultations/queue", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000)
      });
      results.consultations = {
        status: res.status,
        ok: res.ok,
        message: "Endpoint reachable"
      };
      console.log(`✅ /api/v1/consultations/queue: ${res.status}\n`);
    }
  } catch (e) {
    results.consultations = { error: e.message };
    results.errors.push(`❌ /api/v1/consultations/queue failed: ${e.message}`);
    console.error(`❌ /api/v1/consultations/queue: ${e.message}\n`);
  }

  // Summary
  console.log("═══════════════════════════════════════════════════");
  console.log("DIAGNOSTIC SUMMARY");
  console.log("═══════════════════════════════════════════════════\n");

  if (results.errors.length === 0) {
    console.log("✅ All tests passed! Backend is healthy.");
  } else {
    console.log(`⚠️ ${results.errors.length} test(s) failed:`);
    results.errors.forEach(err => console.log(err));
    
    console.log("\n🔧 TROUBLESHOOTING STEPS:");
    console.log("1. Check if backend server is running: npm run backend");
    console.log("2. Verify backend is on localhost:8000");
    console.log("3. Check browser console for CORS errors");
    console.log("4. Check backend terminal for error messages");
    console.log("5. Restart the backend server");
  }

  console.log("\n📊 Full Results:");
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Helper function using AbortSignal.timeout if available
function getAbortSignal(ms) {
  if (AbortSignal.timeout) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
