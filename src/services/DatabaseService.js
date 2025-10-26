import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import config from '../config/config';

// Initialize PouchDB with find plugin
PouchDB.plugin(PouchDBFind);

class DatabaseService {
  constructor() {
    this.db = null;
    this.remoteDB = null;
    this.syncHandler = null;
  }

  // Initialize local database
  initDatabase() {
    try {
      // For web, IndexedDB is used automatically
      // For mobile, we'll configure AsyncStorage adapter
      this.db = new PouchDB('member_management', {
        auto_compaction: true,
      });

      // Create indexes for better query performance
      this.createIndexes();
      
      // Auto-connect to remote CouchDB server if enabled
      if (config.app.enableAutoSync) {
        this.connectToRemote(
          config.couchdb.url,
          config.couchdb.username,
          config.couchdb.password
        );
      }
      
      console.log('Database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Connect to remote CouchDB server
  connectToRemote(remoteUrl, username, password) {
    try {
      const auth = username && password 
        ? `${username}:${password}@` 
        : '';
      
      const dbUrl = remoteUrl.replace('://', `://${auth}`);
      this.remoteDB = new PouchDB(dbUrl);

      // Set up continuous sync with config options
      const syncOptions = config.couchdb.syncOptions || {
        live: true,
        retry: true,
      };

      this.syncHandler = this.db.sync(this.remoteDB, syncOptions).on('change', (info) => {
        console.log('Sync change:', info);
      }).on('paused', (err) => {
        console.log('Sync paused:', err);
      }).on('active', () => {
        console.log('Sync resumed');
      }).on('denied', (err) => {
        console.error('Sync denied:', err);
      }).on('error', (err) => {
        console.error('Sync error:', err);
      });

      console.log('Connected to remote CouchDB');
      return this.remoteDB;
    } catch (error) {
      console.error('Error connecting to remote database:', error);
      throw error;
    }
  }

  // Create indexes for optimized queries
  async createIndexes() {
    try {
      // Index for searching by name
      await this.db.createIndex({
        index: {
          fields: ['firstName', 'lastName', 'email']
        }
      });

      // Index for sorting by creation date
      await this.db.createIndex({
        index: {
          fields: ['createdAt']
        }
      });

      console.log('Indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  // Create a new member
  async createMember(memberData) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }
      
      const doc = {
        ...memberData,
        _id: `member_${Date.now()}`,
        type: 'member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await this.db.put(doc);
      return { ...doc, _rev: response.rev };
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  // Get a member by ID
  async getMember(id) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }
      
      const doc = await this.db.get(id);
      return doc;
    } catch (error) {
      console.error('Error getting member:', error);
      throw error;
    }
  }

  // Update a member
  async updateMember(id, memberData) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }
      
      const doc = await this.db.get(id);
      const updatedDoc = {
        ...doc,
        ...memberData,
        updatedAt: new Date().toISOString(),
      };

      const response = await this.db.put(updatedDoc);
      return { ...updatedDoc, _rev: response.rev };
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  // Delete a member
  async deleteMember(id) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }
      
      const doc = await this.db.get(id);
      
      // Check if this is a protected account (super admin)
      if (doc.cannotBeDeleted || doc.isSuperAdmin) {
        throw new Error('This account is protected and cannot be deleted');
      }
      
      const response = await this.db.remove(doc);
      return response;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  // Search members with filters
  async searchMembers(searchTerm = '', limit = 50, skip = 0) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }
      
      if (!searchTerm) {
        // Return all members if no search term
        const result = await this.db.find({
          selector: {
            type: 'member',
          },
          limit,
          skip,
          sort: [{ createdAt: 'desc' }],
        });
        return result.docs;
      }

      // Search by name or email
      const result = await this.db.find({
        selector: {
          type: 'member',
          $or: [
            { firstName: { $regex: new RegExp(searchTerm, 'i') } },
            { lastName: { $regex: new RegExp(searchTerm, 'i') } },
            { email: { $regex: new RegExp(searchTerm, 'i') } },
          ],
        },
        limit,
        skip,
      });

      return result.docs;
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  }

  // Get all members
  async getAllMembers() {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }
      
      const result = await this.db.allDocs({
        include_docs: true,
        startkey: 'member_',
        endkey: 'member_\ufff0',
      });

      return result.rows.map(row => row.doc);
    } catch (error) {
      console.error('Error getting all members:', error);
      throw error;
    }
  }

  // Get member count
  async getMemberCount() {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }
      
      const result = await this.db.find({
        selector: {
          type: 'member',
        },
        fields: ['_id'],
      });

      return result.docs.length;
    } catch (error) {
      console.error('Error getting member count:', error);
      return 0;
    }
  }

  // Check if member with email or mobile already exists
  async checkDuplicateMember(email, mobile, excludeId = null) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }

      const selector = {
        type: 'member',
        $or: []
      };

      if (email) {
        selector.$or.push({ email: email });
      }

      if (mobile) {
        selector.$or.push({ mobile: mobile });
      }

      // If no email or mobile provided, return null
      if (selector.$or.length === 0) {
        return null;
      }

      const result = await this.db.find({
        selector,
        limit: 10 // Get up to 10 to check all matches
      });

      // Filter out the current member being edited
      const duplicates = result.docs.filter(doc => doc._id !== excludeId);

      if (duplicates.length > 0) {
        // Find which field is duplicate
        const emailMatch = email ? duplicates.find(d => d.email === email) : null;
        const mobileMatch = mobile ? duplicates.find(d => d.mobile === mobile) : null;

        return {
          exists: true,
          emailExists: !!emailMatch,
          mobileExists: !!mobileMatch,
          duplicate: duplicates[0]
        };
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking duplicate member:', error);
      return { exists: false };
    }
  }

  // Disconnect sync
  disconnectSync() {
    if (this.syncHandler) {
      this.syncHandler.cancel();
      this.syncHandler = null;
      console.log('Sync disconnected');
    }
  }

  // Destroy database (for testing)
  async destroyDatabase() {
    try {
      // Ensure database is initialized before destroying
      if (!this.db) {
        console.log('Database not initialized, nothing to destroy');
        return;
      }
      
      await this.db.destroy();
      this.db = null;
      console.log('Database destroyed');
    } catch (error) {
      console.error('Error destroying database:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
