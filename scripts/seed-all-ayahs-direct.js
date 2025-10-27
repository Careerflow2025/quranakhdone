// Direct seeding via Supabase Client with proper error handling
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      envVars[key] = value;
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

// Now load Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAllAyahs() {
  try {
    console.log('🚀 Starting Quran ayahs seeding...\n');

    // Check current count
    const { count: existingCount, error: countError } = await supabase
      .from('quran_ayahs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error checking existing count:', countError);
      throw countError;
    }

    console.log(`📊 Current ayahs in database: ${existingCount || 0}`);

    // Get script_id for uthmani-hafs
    const { data: scriptData, error: scriptError } = await supabase
      .from('quran_scripts')
      .select('id')
      .eq('code', 'uthmani-hafs')
      .single();

    if (scriptError || !scriptData) {
      console.error('❌ Script uthmani-hafs not found:', scriptError);
      throw new Error('uthmani-hafs script not found');
    }

    const scriptId = scriptData.id;
    console.log(`📖 Using script ID: ${scriptId}\n`);

    // Load all ayahs data
    const allAyahs = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'ayahs-data.json'), 'utf-8')
    );

    console.log(`📚 Total ayahs to process: ${allAyahs.length}`);
    console.log(`   Starting from index: ${existingCount || 0}\n`);

    // Process in batches
    const BATCH_SIZE = 100;
    const startIndex = existingCount || 0;
    let processedCount = startIndex;
    const startTime = Date.now();

    for (let i = startIndex; i < allAyahs.length; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, allAyahs.length);
      const batch = allAyahs.slice(i, batchEnd);

      // Transform data for insertion
      const records = batch.map(ayah => ({
        script_id: scriptId,
        surah: ayah.surah,
        ayah: ayah.ayah,
        text: ayah.text,
        token_positions: JSON.parse(ayah.tokens)
      }));

      process.stdout.write(`   Batch ${Math.floor(i / BATCH_SIZE) + 1} (Ayahs ${i + 1}-${batchEnd})... `);

      try {
        const { error: insertError } = await supabase
          .from('quran_ayahs')
          .insert(records);

        if (insertError) {
          // Check if it's a duplicate key error
          if (insertError.code === '23505') {
            console.log('⚠️  (duplicates skipped)');
          } else {
            throw insertError;
          }
        } else {
          console.log('✅');
        }

        processedCount = batchEnd;

        // Progress update every 10 batches
        if ((Math.floor(i / BATCH_SIZE) + 1) % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = ((processedCount - startIndex) / elapsed).toFixed(0);
          const remaining = allAyahs.length - processedCount;
          const estimatedTime = (remaining / rate).toFixed(0);
          console.log(`   Progress: ${processedCount}/${allAyahs.length} (${rate} ayahs/sec, ~${estimatedTime}s remaining)`);
        }

      } catch (err) {
        console.log('❌');
        console.error('   Error:', err.message);
        throw err;
      }
    }

    // Verify final count
    const { count: finalCount, error: finalCountError } = await supabase
      .from('quran_ayahs')
      .select('*', { count: 'exact', head: true });

    if (finalCountError) {
      console.error('❌ Error checking final count:', finalCountError);
      throw finalCountError;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ SEEDING COMPLETE!`);
    console.log(`📊 Total ayahs in database: ${finalCount}`);
    console.log(`⏱️  Total time: ${elapsed} seconds`);
    console.log(`📖 Script: uthmani-hafs`);
    console.log(`\n✨ Mastery tracking system is now ready to use!`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAllAyahs()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
