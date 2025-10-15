// Script to create first school and admin user
// Run with: node create-first-school.js

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = 'https://fljlcalacidwjeuosqlq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsamxjYWxhY2lkd2pldW9zcWxxIiwicm9sZSI6InNlcnZpY2Vfa2V5IiwiaWF0IjoxNzU4OTIxNDIwLCJleHAiOjIwNzQ0OTc0MjB9.8bgp7S-j9HtJQWuJRGW8H5YrlDu0Jz0PoUaOA2F6fiI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function createFirstSchool() {
  console.log('\n🏫 CREATE YOUR FIRST SCHOOL AND ADMIN USER\n');
  console.log('This will create:')
  console.log('1. A school account');
  console.log('2. An admin user who can create teachers/students/parents\n');

  try {
    // Get school details
    const schoolName = await question('School Name (e.g., "Al-Quran Academy"): ');
    const schoolEmail = await question('School Email: ');
    const schoolPhone = await question('School Phone (optional, press Enter to skip): ');
    const schoolAddress = await question('School Address (optional, press Enter to skip): ');

    console.log('\n👤 Admin User Details:');
    const adminEmail = await question('Admin Email (for login): ');
    const adminPassword = await question('Admin Password (min 6 characters): ');
    const adminName = await question('Admin Full Name: ');

    console.log('\n🔄 Creating school and admin user...');

    // Step 1: Create school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: schoolName,
        email: schoolEmail,
        phone: schoolPhone || null,
        address: schoolAddress || null,
        timezone: 'Africa/Casablanca',
        subscription_status: 'active'
      })
      .select()
      .single();

    if (schoolError) {
      console.error('❌ Error creating school:', schoolError.message);
      process.exit(1);
    }

    console.log('✅ School created successfully!');

    // Step 2: Create admin user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      // Clean up school
      await supabase.from('schools').delete().eq('id', school.id);
      process.exit(1);
    }

    console.log('✅ Admin user created!');

    // Step 3: Create profile for admin
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        school_id: school.id,
        role: 'school',
        display_name: adminName,
        email: adminEmail
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      // Clean up
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('schools').delete().eq('id', school.id);
      process.exit(1);
    }

    console.log('\n🎉 SUCCESS! Your school has been created!\n');
    console.log('📋 SCHOOL DETAILS:');
    console.log(`   Name: ${schoolName}`);
    console.log(`   ID: ${school.id}`);
    console.log(`   Email: ${schoolEmail}\n`);

    console.log('🔑 ADMIN LOGIN CREDENTIALS:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: School Admin (can create all users)\n`);

    console.log('🚀 NEXT STEPS:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Login with the admin credentials above');
    console.log('3. You\'ll be redirected to the School Dashboard');
    console.log('4. From there, you can create teachers, students, and parents!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
  }
}

createFirstSchool();