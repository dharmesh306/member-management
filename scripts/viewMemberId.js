const DatabaseService = require('../src/services/DatabaseService');

async function viewMemberId(email) {
    try {
        // Initialize database
        await DatabaseService.initDatabase();

        // Search for member by email
        const result = await DatabaseService.searchMembers(email);
        
        if (result.length === 0) {
            console.log('No member found with that email.');
            return;
        }

        // Display member information
        const member = result[0];
        console.log('\nMember Information:');
        console.log('------------------');
        console.log(`ID: ${member._id}`);
        console.log(`Name: ${member.firstName} ${member.lastName}`);
        console.log(`Email: ${member.email}`);
        console.log(`Role: ${member.role || 'regular member'}`);
        
        if (member.isAdmin) {
            console.log('This member is an admin');
        }

        // If this member manages others, show count
        const managedMembers = await DatabaseService.getManagedMembers(member._id);
        if (managedMembers.length > 0) {
            console.log(`\nThis member manages ${managedMembers.length} other members`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Check if email is provided as command line argument
const email = process.argv[2];
if (!email) {
    console.log('Please provide an email address:');
    console.log('Usage: node viewMemberId.js <email>');
} else {
    viewMemberId(email);
}