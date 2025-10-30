const DatabaseService = require('../src/services/DatabaseService');

async function checkSyncStatus() {
    try {
        // Initialize database
        await DatabaseService.initDatabase();
        
        // Get local database info
        const localInfo = await DatabaseService.db.info();
        console.log('\nLocal Database Status:');
        console.log('----------------------');
        console.log(`Documents: ${localInfo.doc_count}`);
        console.log(`Update Sequence: ${localInfo.update_seq}`);
        
        // Get remote database info if connected
        if (DatabaseService.remoteDB) {
            const remoteInfo = await DatabaseService.remoteDB.info();
            console.log('\nRemote Database Status:');
            console.log('----------------------');
            console.log(`Documents: ${remoteInfo.doc_count}`);
            console.log(`Update Sequence: ${remoteInfo.update_seq}`);
            
            // Compare document counts
            if (localInfo.doc_count === remoteInfo.doc_count) {
                console.log('\n✅ Databases are in sync!');
            } else {
                console.log('\n⚠️ Databases have different document counts:');
                console.log(`Local: ${localInfo.doc_count}, Remote: ${remoteInfo.doc_count}`);
            }
        } else {
            console.log('\n⚠️ Not connected to remote database');
        }
        
        // Check sync handler status
        if (DatabaseService.syncHandler) {
            console.log('\nSync Status: Active');
            console.log('Auto-sync is enabled and running');
        } else {
            console.log('\nSync Status: Inactive');
            console.log('No active sync handler');
        }
        
    } catch (error) {
        console.error('Error checking sync status:', error);
    }
}

// Run the check
checkSyncStatus();