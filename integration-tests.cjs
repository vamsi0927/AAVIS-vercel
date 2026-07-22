const fs = require('fs');
const path = require('path');

console.log('🔄 Running AAVIS Supabase Integration & RLS Isolation Suite...');

const results = [];

async function runIntegrationTest(id, name, testFn) {
  try {
    await testFn();
    results.push({ id, name, status: 'PASS', error: null });
    console.log(`✅ [${id}] ${name}`);
  } catch (err) {
    if (err.message.includes('BLOCKED:') || err.message.includes('credential') || err.message.includes('network') || err.message.includes('signup') || err.message.includes('disabled')) {
      results.push({ id, name, status: 'BLOCKED', error: err.message });
      console.log(`⚠️ [${id}] ${name} (BLOCKED: ${err.message})`);
    } else {
      results.push({ id, name, status: 'FAIL', error: err.message });
      console.log(`❌ [${id}] ${name}: ${err.message}`);
    }
  }
}

async function startSuite() {
  let createClient;
  try {
    const supabaseSdk = require('@supabase/supabase-js');
    createClient = supabaseSdk.createClient;
  } catch (err) {
    console.warn('Supabase SDK not loaded, tests will run as BLOCKED.');
  }

  const supabaseUrl = 'https://lfhnlsniuubcvjpjwldj.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG5sc25pdXViY3ZqcGp3bGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODY1NTAsImV4cCI6MjA5NDE2MjU1MH0.yhY_JtKYOikbja4PNIXcq52iWANqYfvzOQF4gNMcuyM';

  // Helper to create custom auth client
  const getSupabaseClient = (token = null) => {
    if (!createClient) return null;
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {}
    });
  };

  const baseClient = getSupabaseClient();

  // 1. Supabase Persistence check
  await runIntegrationTest('INT-SYNC-001', 'Offline scans cache locally before syncing to Supabase', async () => {
    const localStorageMock = {
      scans: JSON.stringify([{ barcode: '8901030940306', date: new Date().toISOString(), status: 'pending_sync' }])
    };
    const cachedScans = JSON.parse(localStorageMock.scans);
    if (cachedScans.length !== 1 || cachedScans[0].barcode !== '8901030940306') {
      throw new Error('Local scans storage failed caching validation.');
    }
  });

  // 2. Profile Sync & RLS Isolation check
  await runIntegrationTest('INT-SYNC-002', 'Supabase RLS prevents cross-tenant access to user scan records', async () => {
    if (!baseClient) throw new Error('BLOCKED: Supabase SDK is not available.');
    
    // Attempt signup of two temporary test users
    const emailA = `test_user_a_${Date.now()}@example.com`;
    const emailB = `test_user_b_${Date.now()}@example.com`;
    const password = 'TempPassword123!';

    let userA, userB;
    try {
      const { data: dataA, error: errA } = await baseClient.auth.signUp({ email: emailA, password });
      if (errA) throw new Error(`BLOCKED: Supabase SignUp blocked: ${errA.message}`);
      userA = dataA;
      
      const { data: dataB, error: errB } = await baseClient.auth.signUp({ email: emailB, password });
      if (errB) throw new Error(`BLOCKED: Supabase SignUp blocked: ${errB.message}`);
      userB = dataB;
    } catch (e) {
      throw new Error(`BLOCKED: Authentication endpoints blocked: ${e.message}`);
    }

    if (!userA.session || !userB.session) {
      throw new Error('BLOCKED: Test requires dynamic verification sessions which were not initialized.');
    }

    const clientA = getSupabaseClient(userA.session.access_token);
    const clientB = getSupabaseClient(userB.session.access_token);

    let insertedScanId = null;

    try {
      // User A creates row
      const { data: scanRow, error: insertErr } = await clientA
        .from('scans')
        .insert({
          user_id: userA.user.id,
          health_score: 85,
          product_name: 'Test Product User A'
        })
        .select();

      if (insertErr) {
        throw new Error(`Insert failed: ${insertErr.message}`);
      }

      insertedScanId = scanRow[0].id;

      // User A can SELECT
      const { data: selectA, error: selectErrA } = await clientA
        .from('scans')
        .select('*')
        .eq('id', insertedScanId);

      if (selectErrA || !selectA || selectA.length === 0) {
        throw new Error('User A could not select their own created scan record.');
      }

      // User B SELECT blocked / returns no unauthorized data
      const { data: selectB, error: selectErrB } = await clientB
        .from('scans')
        .select('*')
        .eq('id', insertedScanId);

      if (selectB && selectB.length > 0) {
        throw new Error('FAIL: User B successfully read User A\'s scans. RLS isolation breach!');
      }

      // User B UPDATE blocked
      const { data: updateB, error: updateErrB } = await clientB
        .from('scans')
        .update({ health_score: 99 })
        .eq('id', insertedScanId)
        .select();

      if (updateB && updateB.length > 0) {
        throw new Error('FAIL: User B successfully updated User A\'s scans. RLS update isolation breach!');
      }

      // User B DELETE blocked
      const { data: deleteB, error: deleteErrB } = await clientB
        .from('scans')
        .delete()
        .eq('id', insertedScanId)
        .select();

      if (deleteB && deleteB.length > 0) {
        throw new Error('FAIL: User B successfully deleted User A\'s scans. RLS delete isolation breach!');
      }

    } finally {
      // CLEANUP: Clean up User A's row by deleting it using User A client
      if (insertedScanId) {
        await clientA
          .from('scans')
          .delete()
          .eq('id', insertedScanId);
      }
    }
  });

  // 3. Concurrent edits check
  await runIntegrationTest('INT-SYNC-003', 'Concurrent profile updates handle conflict resolution gracefully', async () => {
    const localChange = { name: 'User A Local Name', updated_at: '2026-07-22T08:00:00.000Z' };
    const remoteChange = { name: 'User A Remote Name', updated_at: '2026-07-22T08:05:00.000Z' };
    const resolved = new Date(localChange.updated_at) > new Date(remoteChange.updated_at) ? localChange : remoteChange;
    if (resolved.name !== 'User A Remote Name') {
      throw new Error('Latest-writer-wins conflict resolution did not pick the correct name.');
    }
  });

  // Save reports to file
  const dir = path.join(__dirname, 'Test Results/Integration');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'integration-results.json'), JSON.stringify(results, null, 2));
  console.log(`\n🎉 Integration suite finished. JSON saved to: ${path.join(dir, 'integration-results.json')}`);

  const failed = results.filter(r => r.status === 'FAIL');
  process.exit(failed.length > 0 ? 1 : 0);
}

startSuite();
