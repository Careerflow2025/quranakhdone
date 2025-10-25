// Test Script: Assignment-Highlight Integration Workflow
// Tests the complete flow: Create highlights → Link to assignment → Complete assignment → Verify gold highlights

const BASE_URL = 'http://localhost:3017';

// Test Configuration
const TEST_CONFIG = {
  // You'll need to replace these with actual IDs from your database
  TEACHER_EMAIL: 'teacher@test.com',
  TEACHER_PASSWORD: 'password123',
  STUDENT_ID: 'paste-student-uuid-here',
  SCHOOL_ID: 'paste-school-uuid-here'
};

let authToken = null;
let createdHighlights = [];
let createdAssignment = null;

// Helper: Login and get auth token
async function login() {
  console.log('\n📝 PHASE 1: Authentication');
  console.log('=' .repeat(60));

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_CONFIG.TEACHER_EMAIL,
      password: TEST_CONFIG.TEACHER_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  authToken = data.token || data.access_token;

  console.log('✅ Login successful');
  console.log(`   Token: ${authToken.substring(0, 20)}...`);

  return authToken;
}

// Helper: Create multiple highlights for testing
async function createHighlights() {
  console.log('\n📝 PHASE 2: Create Test Highlights');
  console.log('=' .repeat(60));

  const highlightsToCreate = [
    {
      surah: 1,
      ayah_start: 1,
      ayah_end: 1,
      color: 'purple',
      type: 'recap',
      page_number: 1,
      note: 'Al-Fatihah - Opening'
    },
    {
      surah: 1,
      ayah_start: 2,
      ayah_end: 2,
      color: 'orange',
      type: 'tajweed',
      page_number: 1,
      note: 'Tajweed mistake - Madd'
    },
    {
      surah: 1,
      ayah_start: 3,
      ayah_end: 3,
      color: 'red',
      type: 'haraka',
      page_number: 1,
      note: 'Haraka correction needed'
    }
  ];

  for (const highlightData of highlightsToCreate) {
    const response = await fetch(`${BASE_URL}/api/highlights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: TEST_CONFIG.STUDENT_ID,
        ...highlightData
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create highlight: ${error.error}`);
    }

    const data = await response.json();
    createdHighlights.push(data.highlight);

    console.log(`✅ Highlight ${createdHighlights.length} created:`);
    console.log(`   ID: ${data.highlight.id}`);
    console.log(`   Surah ${highlightData.surah}, Ayah ${highlightData.ayah_start}`);
    console.log(`   Color: ${highlightData.color} (${highlightData.type})`);
  }

  console.log(`\n📊 Total highlights created: ${createdHighlights.length}`);
  return createdHighlights;
}

// Helper: Create assignment
async function createAssignment() {
  console.log('\n📝 PHASE 3: Create Assignment');
  console.log('=' .repeat(60));

  const response = await fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      student_id: TEST_CONFIG.STUDENT_ID,
      title: 'Test Assignment - Surah Al-Fatihah Review',
      description: 'Review and correct mistakes in Surah Al-Fatihah',
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'assigned'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create assignment: ${error.error}`);
  }

  const data = await response.json();
  createdAssignment = data.assignment;

  console.log('✅ Assignment created:');
  console.log(`   ID: ${createdAssignment.id}`);
  console.log(`   Title: ${createdAssignment.title}`);
  console.log(`   Status: ${createdAssignment.status}`);
  console.log(`   Due: ${createdAssignment.due_at}`);

  return createdAssignment;
}

// Helper: Link highlights to assignment
async function linkHighlightsToAssignment() {
  console.log('\n📝 PHASE 4: Link Highlights to Assignment');
  console.log('=' .repeat(60));

  const highlightIds = createdHighlights.map(h => h.id);

  console.log(`📎 Linking ${highlightIds.length} highlights to assignment ${createdAssignment.id}`);

  const response = await fetch(`${BASE_URL}/api/assignments/${createdAssignment.id}/highlights`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      highlight_ids: highlightIds
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to link highlights: ${error.error}`);
  }

  const data = await response.json();

  console.log('✅ Highlights linked successfully:');
  console.log(`   Assignment ID: ${data.data.assignment_id}`);
  console.log(`   Linked Highlights: ${data.data.linked_highlights}`);
  console.log(`   Message: ${data.message}`);

  return data;
}

// Helper: Verify highlights are linked
async function verifyHighlightsLinked() {
  console.log('\n📝 PHASE 5: Verify Highlights Linked');
  console.log('=' .repeat(60));

  const response = await fetch(`${BASE_URL}/api/assignments/${createdAssignment.id}/highlights`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get assignment highlights: ${error.error}`);
  }

  const data = await response.json();

  console.log('✅ Retrieved assignment highlights:');
  console.log(`   Count: ${data.count}`);

  data.data.forEach((item, index) => {
    const highlight = item.highlights;
    console.log(`   ${index + 1}. Highlight ID: ${highlight.id}`);
    console.log(`      Surah ${highlight.surah}, Ayah ${highlight.ayah_start}`);
    console.log(`      Color: ${highlight.color} (${highlight.type})`);
    console.log(`      Completed: ${highlight.completed_at ? 'Yes' : 'No'}`);
  });

  return data;
}

// Helper: Complete assignment (turns highlights gold)
async function completeAssignment() {
  console.log('\n📝 PHASE 6: Complete Assignment (Turn Highlights Gold)');
  console.log('=' .repeat(60));

  console.log(`🎉 Completing assignment ${createdAssignment.id}...`);

  const response = await fetch(`${BASE_URL}/api/assignments/${createdAssignment.id}/complete`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to complete assignment: ${error.error}`);
  }

  const data = await response.json();

  console.log('✅ Assignment completed successfully:');
  console.log(`   Assignment Status: ${data.data.assignment.status}`);
  console.log(`   Highlights Turned Gold: ${data.data.highlights_completed}`);
  console.log(`   Message: ${data.message}`);

  return data;
}

// Helper: Verify highlights turned gold
async function verifyHighlightsGold() {
  console.log('\n📝 PHASE 7: Verify Highlights Turned Gold');
  console.log('=' .repeat(60));

  // Fetch highlights for the student
  const response = await fetch(`${BASE_URL}/api/highlights?student_id=${TEST_CONFIG.STUDENT_ID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch highlights: ${error.error}`);
  }

  const data = await response.json();
  const highlights = data.highlights || [];

  console.log(`📊 Checking ${highlights.length} total highlights for student...`);

  // Check each created highlight
  let goldCount = 0;
  createdHighlights.forEach((originalHighlight, index) => {
    const updatedHighlight = highlights.find(h => h.id === originalHighlight.id);

    if (!updatedHighlight) {
      console.log(`❌ Highlight ${index + 1} not found!`);
      return;
    }

    const isGold = updatedHighlight.color === 'gold';
    const icon = isGold ? '🟡' : '⚪';

    console.log(`${icon} Highlight ${index + 1}:`);
    console.log(`   ID: ${updatedHighlight.id}`);
    console.log(`   Original Color: ${originalHighlight.color}`);
    console.log(`   Current Color: ${updatedHighlight.color}`);
    console.log(`   Previous Color: ${updatedHighlight.previous_color || 'N/A'}`);
    console.log(`   Completed At: ${updatedHighlight.completed_at || 'N/A'}`);
    console.log(`   Completed By: ${updatedHighlight.completed_by || 'N/A'}`);

    if (isGold) goldCount++;
  });

  console.log(`\n📊 Final Results:`);
  console.log(`   Gold Highlights: ${goldCount} / ${createdHighlights.length}`);

  if (goldCount === createdHighlights.length) {
    console.log('   ✅ ALL HIGHLIGHTS SUCCESSFULLY TURNED GOLD!');
  } else {
    console.log('   ❌ Some highlights did not turn gold');
  }

  return { goldCount, total: createdHighlights.length };
}

// Helper: Cleanup test data
async function cleanup() {
  console.log('\n📝 PHASE 8: Cleanup Test Data');
  console.log('=' .repeat(60));

  console.log('🧹 Cleaning up test data...');

  // Delete assignment (will cascade delete assignment_highlights)
  if (createdAssignment) {
    try {
      const response = await fetch(`${BASE_URL}/api/assignments/${createdAssignment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Assignment deleted');
      }
    } catch (error) {
      console.log('⚠️  Could not delete assignment:', error.message);
    }
  }

  // Delete highlights
  for (const highlight of createdHighlights) {
    try {
      const response = await fetch(`${BASE_URL}/api/highlights/${highlight.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ Highlight ${highlight.id} deleted`);
      }
    } catch (error) {
      console.log(`⚠️  Could not delete highlight ${highlight.id}:`, error.message);
    }
  }

  console.log('🧹 Cleanup complete');
}

// Main test execution
async function runTest() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ASSIGNMENT-HIGHLIGHT WORKFLOW TEST                      ║');
  console.log('║   Complete End-to-End Integration Test                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try {
    // Phase 1: Login
    await login();

    // Phase 2: Create highlights
    await createHighlights();

    // Phase 3: Create assignment
    await createAssignment();

    // Phase 4: Link highlights to assignment
    await linkHighlightsToAssignment();

    // Phase 5: Verify highlights are linked
    await verifyHighlightsLinked();

    // Phase 6: Complete assignment (turn highlights gold)
    await completeAssignment();

    // Phase 7: Verify highlights turned gold
    const results = await verifyHighlightsGold();

    // Phase 8: Cleanup
    await cleanup();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   TEST SUMMARY                                            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Highlights Created: ${createdHighlights.length}`);
    console.log(`📊 Highlights Turned Gold: ${results.goldCount} / ${results.total}`);

    if (results.goldCount === results.total) {
      console.log('\n🎉 TEST PASSED: All highlights successfully turned gold!');
      console.log('✅ Assignment-Highlight Integration: WORKING PERFECTLY');
    } else {
      console.log('\n❌ TEST FAILED: Some highlights did not turn gold');
      console.log(`   Expected: ${results.total}, Got: ${results.goldCount}`);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);

    // Try to cleanup even on error
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error('⚠️  Cleanup also failed:', cleanupError);
    }

    process.exit(1);
  }
}

// Run the test
runTest();
