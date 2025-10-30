const DatabaseService = require('../src/services/DatabaseService');

async function findManagers(searchTerm) {
    try {
        // Initialize database
        await DatabaseService.initDatabase();

        // Search for members
        const results = await DatabaseService.searchMembers(searchTerm);
        
        if (results.length === 0) {
            console.log('No members found matching your search.');
            return;
        }

        console.log('\nFound Members:');
        console.log('-------------');
        
        // Display each member's information
        for (const member of results) {
            console.log(`\nID: ${member._id}`);
            console.log(`Name: ${member.firstName} ${member.lastName}`);
            console.log(`Email: ${member.email}`);
            
            // Show if they are an admin or already manage others
            const managedMembers = await DatabaseService.getManagedMembers(member._id);
            if (member.isAdmin) {
                console.log('Role: Admin');
            }
            if (managedMembers.length > 0) {
                console.log(`Currently manages: ${managedMembers.length} members`);
            }
            console.log('---');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Check if search term is provided as command line argument
const searchTerm = process.argv[2];
if (!searchTerm) {
    console.log('Please provide a search term (name or email):');
    console.log('Usage: node findManagers.js <search term>');
} else {
    findManagers(searchTerm);
}