// Apply all batch migrations sequentially
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyBatchMigrations() {
  try {
    console.log('🚀 Starting batch migration application...\n');
    console.log('📋 Supabase URL:', supabaseUrl);
    console.log('');

    // Check current ayah count
    const { count: existingCount, error: countError } = await supabase
      .from('quran_ayahs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error checking existing count:', countError);
      throw countError;
    }

    console.log(`📊 Current ayahs in database: ${existingCount || 0}`);

    if (existingCount && existingCount >= 6236) {
      console.log('✅ Database already fully seeded with', existingCount, 'ayahs');
      console.log('   Skipping migration to avoid duplicates');
      return;
    }

    // Get all batch files
    const batchDir = path.join(__dirname, '../supabase/migrations/quran_batches');
    const batchFiles = fs.readdirSync(batchDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📂 Found ${batchFiles.length} batch files`);
    console.log('⏱️  Estimated time: ~${Math.ceil(batchFiles.length * 2)}  seconds\n');

    let processedCount = 0;
    const startTime = Date.now();

    for (const batchFile of batchFiles) {
      const batchNum = parseInt(batchFile.match(/batch_(\d+)/)[1]);
      const filePath = path.join(batchDir, batchFile);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      process.stdout.write(`   Batch ${batchNum}/${batchFiles.length}... `);

      try {
        // Extract the INSERT statement (skip DO $$ wrapper for direct execution)
        const { error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

        if (error) {
          // Try alternative: parse and execute the INSERT directly
          const insertMatch = sqlContent.match(/INSERT INTO quran_ayahs[\s\S]+?;/);
          if (insertMatch) {
            // Get script_id first
            const { data: scriptData } = await supabase
              .from('quran_scripts')
              .select('id')
              .eq('code', 'uthmani-hafs')
              .single();

            if (!scriptData) {
              throw new Error('uthmani-hafs script not found');
            }

            const scriptId = scriptData.id;

            // Parse values from SQL
            const valuesMatch = sqlContent.match(/VALUES\s+([\s\S]+?);/);
            if (valuesMatch) {
              const valuesStr = valuesMatch[1];
              const rows = valuesStr.split(/\),\s*\(/);

              const records = rows.map(row => {
                // Clean up row
                row = row.replace(/^\(/, '').replace(/\)$/, '');

                // Match: v_script_id, surah, ayah, 'text', 'tokens'::jsonb
                const match = row.match(/v_script_id,\s*(\d+),\s*(\d+),\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'::jsonb/);

                if (!match) {
                  console.error('Failed to parse row:', row.substring(0, 100));
                  return null;
                }

                return {
                  script_id: scriptId,
                  surah: parseInt(match[1]),
                  ayah: parseInt(match[2]),
                  text: match[3].replace(/''/g, "'"),
                  token_positions: JSON.parse(match[4].replace(/''/g, "'")),
                };
              }).filter(r => r !== null);

              const { error: insertError } = await supabase
                .from('quran_ayahs')
                .insert(records);

              if (insertError) {
                throw insertError;
              }
            }
          } else {
            throw error;
          }
        }

        processedCount += 1;
        process.stdout.write('✅\n');

        // Progress update every 10 batches
        if (processedCount % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (processedCount / elapsed).toFixed(1);
          console.log(`   [${processedCount}/${batchFiles.length}] ${elapsed}s elapsed (${rate} batch/sec)`);
        }

      } catch (err) {
        process.stdout.write('❌\n');
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

    console.log(`\n✅ MIGRATION COMPLETE!`);
    console.log(`📊 Total ayahs in database: ${finalCount}`);
    console.log(`⏱️  Total time: ${elapsed} seconds`);
    console.log(`📖 Script: uthmani-hafs`);
    console.log(`\n✨ Mastery tracking system is now ready to use!`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyBatchMigrations()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
