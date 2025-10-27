// Test Password Reset Flow
// This script demonstrates how the password reset with verification code works

const PouchDB = require('pouchdb');

const DB_NAME = 'member_management';
const REMOTE_DB_URL = 'http://admin:password@astworkbench03:5984/member_management';

async function testPasswordReset() {
  console.log('\n=== PASSWORD RESET FLOW TEST ===\n');

  try {
    const remoteDB = new PouchDB(REMOTE_DB_URL);

    // Step 1: Find a test member
    console.log('Step 1: Finding test member...');
    const result = await remoteDB.allDocs({
      include_docs: true,
      startkey: 'member_',
      endkey: 'member_\ufff0',
      limit: 1
    });

    if (result.rows.length === 0) {
      console.log('❌ No members found in database');
      return;
    }

    const member = result.rows[0].doc;
    console.log(`✅ Found member: ${member.firstName} ${member.lastName}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Mobile: ${member.mobile || 'N/A'}`);

    // Step 2: Simulate password reset request
    console.log('\n Step 2: Simulating password reset request...');
    const resetToken = generateToken();
    const verificationCode = resetToken.substring(0, 6);
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    console.log(`✅ Generated verification code: ${verificationCode}`);
    console.log(`   Full token: ${resetToken}`);
    console.log(`   Expires: ${new Date(resetTokenExpiry).toLocaleString()}`);

    // Step 3: Update member with reset token
    console.log('\nStep 3: Saving reset token to database...');
    member.auth = member.auth || {};
    member.auth.resetToken = resetToken;
    member.auth.resetTokenExpiry = resetTokenExpiry;
    const updateResult1 = await remoteDB.put(member);
    member._rev = updateResult1.rev; // Update revision
    console.log('✅ Reset token saved');

    // Step 4: Simulate email/SMS
    console.log('\nStep 4: Simulating email/SMS notification...');
    if (member.email) {
      console.log('\n📧 EMAIL SIMULATION:');
      console.log('─'.repeat(50));
      console.log(`To: ${member.email}`);
      console.log(`Subject: Password Reset Verification Code`);
      console.log(`\nHello ${member.firstName},\n`);
      console.log(`Your password reset verification code is:\n`);
      console.log(`   ${verificationCode}\n`);
      console.log(`This code will expire in 1 hour.\n`);
      console.log(`If you didn't request this, please ignore this email.`);
      console.log('─'.repeat(50));
    }

    if (member.mobile) {
      console.log('\n📱 SMS SIMULATION:');
      console.log('─'.repeat(50));
      console.log(`To: ${member.mobile}`);
      console.log(`\nYour password reset code is: ${verificationCode}`);
      console.log(`Expires in 1 hour.`);
      console.log('─'.repeat(50));
    }

    // Step 5: Verify code
    console.log('\nStep 5: Simulating code verification...');
    const userEnteredCode = verificationCode; // In real app, user types this
    if (userEnteredCode === verificationCode) {
      console.log('✅ Code verified successfully!');
    } else {
      console.log('❌ Invalid code');
      return;
    }

    // Step 6: Reset password
    console.log('\nStep 6: Simulating password reset...');
    const newPassword = 'NewPassword123!';
    const hashedPassword = hashPassword(newPassword);
    
    member.auth.password = hashedPassword;
    delete member.auth.resetToken;
    delete member.auth.resetTokenExpiry;
    member.updatedAt = new Date().toISOString();
    
    const updateResult2 = await remoteDB.put(member);
    console.log('✅ Password updated successfully!');

    console.log('\n=== TEST COMPLETE ===');
    console.log('\nSummary:');
    console.log(`• Member: ${member.firstName} ${member.lastName}`);
    console.log(`• Email: ${member.email}`);
    console.log(`• Verification Code: ${verificationCode}`);
    console.log(`• New Password: ${newPassword}`);
    console.log(`• Status: ✅ Password reset successful`);

    console.log('\n📝 How to test in the app:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Click "Forgot Password?"');
    console.log(`3. Enter: ${member.email}`);
    console.log('4. Check console for verification code');
    console.log('5. Enter the 6-digit code');
    console.log('6. Create a new password');
    console.log('7. Login with new password\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Helper function to generate token
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Simple password hashing (matches the one in AuthService)
function hashPassword(password) {
  // This is a simple hash for demo - in production use bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Run the test
testPasswordReset();
