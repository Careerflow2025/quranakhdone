/**
 * Emergency script to sync teacher password between Auth and credentials table
 * This fixes passwords that were reset with the OLD broken code
 */

async function fixTeacherPassword() {
  console.log('🔧 Fixing teacher password sync issue...\n');

  const teacherData = {
    credentialId: '033dd1f4-d639-4707-8e97-ec2821eceaef',
    userId: '73ca2dfe-8531-4a45-b01f-b802776b5f2d',
    email: 'ridaap44m@gmail.com',
    currentPassword: 'oqe5jnzfqs6h6go' // From credentials table
  };

  console.log('📝 Teacher Info:');
  console.log('Email:', teacherData.email);
  console.log('Current Password in UI:', teacherData.currentPassword);
  console.log('');

  console.log('🔄 Calling password reset API to sync Auth with credentials table...');

  try {
    const response = await fetch('http://localhost:3022/api/school/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: teacherData.userId,
        newPassword: teacherData.currentPassword, // Use SAME password to sync
        credentialId: teacherData.credentialId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ SUCCESS!', data.message);
    console.log('');
    console.log('🎉 Password is now synced!');
    console.log('');
    console.log('📋 Now you can login with:');
    console.log('Email:', teacherData.email);
    console.log('Password:', teacherData.currentPassword);
    console.log('');
    console.log('💡 Try logging in again - it should work now!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('1. Make sure dev server is running on port 3022');
    console.log('2. Check server logs for error messages');
    console.log('3. Verify SUPABASE_SERVICE_ROLE_KEY is in .env.local');
  }
}

// Run the fix
fixTeacherPassword();
