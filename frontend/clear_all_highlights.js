/**
 * Script to clear ALL highlights from the database
 * Use this to remove old test/mock highlights before fresh testing
 *
 * Usage: node clear_all_highlights.js
 */

const BASE_URL = 'http://localhost:3025';

async function clearAllHighlights() {
  console.log('\n🧹 CLEARING ALL HIGHLIGHTS FROM DATABASE\n');

  try {
    // Step 1: Login as teacher to get authorization
    console.log('1️⃣  Logging in as teacher...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@quranakh.com',
        password: 'teacher123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Teacher login failed');
    }

    const loginData = await loginResponse.json();
    const teacherToken = loginData.session.access_token;
    console.log('✅ Teacher logged in');

    // Step 2: Get all highlights
    console.log('\n2️⃣  Fetching all highlights...');
    const getHighlightsResponse = await fetch(`${BASE_URL}/api/highlights`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    if (!getHighlightsResponse.ok) {
      throw new Error('Failed to fetch highlights');
    }

    const getHighlightsData = await getHighlightsResponse.json();
    const allHighlights = getHighlightsData.highlights || [];

    console.log(`✅ Found ${allHighlights.length} highlights to delete`);

    if (allHighlights.length === 0) {
      console.log('\n✅ DATABASE ALREADY CLEAN - No highlights to delete\n');
      return;
    }

    // Step 3: Delete each highlight
    console.log('\n3️⃣  Deleting highlights...');
    let deletedCount = 0;
    let failedCount = 0;

    for (const highlight of allHighlights) {
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/highlights/${highlight.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });

        if (deleteResponse.ok) {
          deletedCount++;
          console.log(`   ✓ Deleted highlight ${highlight.id} (${highlight.type || 'unknown'})`);
        } else {
          failedCount++;
          console.log(`   ✗ Failed to delete highlight ${highlight.id}`);
        }
      } catch (err) {
        failedCount++;
        console.log(`   ✗ Error deleting highlight ${highlight.id}: ${err.message}`);
      }
    }

    // Step 4: Summary
    console.log('\n📊 DELETION SUMMARY:');
    console.log(`   ✅ Successfully deleted: ${deletedCount}`);
    console.log(`   ❌ Failed to delete: ${failedCount}`);
    console.log(`   📈 Total processed: ${allHighlights.length}`);

    if (deletedCount === allHighlights.length) {
      console.log('\n✅ DATABASE CLEARED SUCCESSFULLY - All highlights removed!\n');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS - Some highlights could not be deleted\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

// Run the cleanup
clearAllHighlights();
