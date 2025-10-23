// Check if teacher account was created in database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nlwwptgtqrjgzkngzrmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sd3dwdGd0cXJqZ3prbmd6cm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNzM1MjUsImV4cCI6MjA0NDc0OTUyNX0.7WiKSJW0KvG2EsHuKp9IKziVhwPl_BhSdDQLxrZVGWU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTeacherAccount() {
  console.log('\n🔍 CHECKING TEACHER ACCOUNT IN DATABASE');
  console.log('='.repeat(70));
  
  const teacherEmail = 'quick.teacher@quranakh.test';
  console.log(`\nSearching for: ${teacherEmail}\n`);
  
  try {
    // Check auth.users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, email, display_name, role, school_id')
      .eq('email', teacherEmail);
    
    if (usersError) {
      console.log('❌ Error checking profiles:', usersError.message);
    } else if (users && users.length > 0) {
      console.log('✅ PROFILE FOUND:');
      console.log(JSON.stringify(users[0], null, 2));
      
      const userId = users[0].user_id;
      
      // Check teachers table
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userId);
      
      if (teacherError) {
        console.log('\n❌ Error checking teachers:', teacherError.message);
      } else if (teacher && teacher.length > 0) {
        console.log('\n✅ TEACHER RECORD FOUND:');
        console.log(JSON.stringify(teacher[0], null, 2));
      } else {
        console.log('\n⚠️ Profile exists but no teacher record found');
      }
    } else {
      console.log('❌ No profile found for this email');
      console.log('Account creation may have failed or used different email');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
  
  console.log('\n' + '='.repeat(70));
}

checkTeacherAccount();
