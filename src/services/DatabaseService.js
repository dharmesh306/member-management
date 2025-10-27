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

      // Index for type and status (for pending registrations)
      await this.db.createIndex({
        index: {
          fields: ['type', 'status']
        }
      });

      // Index for type and status with createdAt for sorting
      await this.db.createIndex({
        index: {
          fields: ['type', 'status', 'createdAt']
        }
      });

      // Index for admin requests
      await this.db.createIndex({
        index: {
          fields: ['type', 'adminRequested']
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
  async updateMember(id, memberData, currentUser = null) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }

      // Check permissions if currentUser is provided
      if (currentUser) {
        const isAdmin = currentUser.isAdmin || currentUser.isSuperAdmin;
        const isOwner = currentUser._id === id;

        // Only admins or the member themselves can update
        if (!isAdmin && !isOwner) {
          throw new Error('You do not have permission to update this member');
        }
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
  async deleteMember(id, currentUser = null) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }

      // Check permissions if currentUser is provided
      if (currentUser) {
        const isAdmin = currentUser.isAdmin || currentUser.isSuperAdmin;

        // Only admins can delete members
        if (!isAdmin) {
          throw new Error('You do not have permission to delete members. Only admins can delete records.');
        }
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
      
      // Use remote DB if available for consistency
      const queryDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Getting all members from ${dbType} database...`);
      
      const result = await queryDB.allDocs({
        include_docs: true,
        startkey: 'member_',
        endkey: 'member_\ufff0',
      });

      console.log(`Found ${result.rows.length} total members in ${dbType} DB`);
      return result.rows.map(row => row.doc);
    } catch (error) {
      console.error('Error getting all members:', error);
      throw error;
    }
  }

  // Get members based on user role and permissions
  async getMembersForUser(currentUser) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        this.initDatabase();
      }

      const allMembers = await this.getAllMembers();

      // If user is admin or super admin, return all members
      if (currentUser && (
        currentUser.role === 'admin' || 
        currentUser.role === 'superadmin' ||
        currentUser.isAdmin || 
        currentUser.isSuperAdmin
      )) {
        console.log('Admin user - returning all members:', allMembers.length);
        return allMembers;
      }

      // If user is a regular member/spouse, return only their record
      if (currentUser && (currentUser.loginType === 'member' || currentUser.loginType === 'spouse')) {
        console.log('Regular user - returning only their record');
        return allMembers.filter(member => member._id === currentUser._id);
      }

      // No user or invalid user, return empty array
      console.log('No valid user - returning empty array');
      return [];
    } catch (error) {
      console.error('Error getting members for user:', error);
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

  // Get pending registrations (members with status 'pending')
  async getPendingRegistrations() {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      console.log('Fetching pending registrations...');
      
      // Use remote DB if available, otherwise use local
      const queryDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Querying ${dbType} database...`);
      
      // Debug: Check total documents in DB
      const info = await queryDB.info();
      console.log(`${dbType} DB info:`, info);

      // First, try with index
      try {
        const result = await queryDB.find({
          selector: {
            type: 'member',
            status: 'pending'
          },
          sort: [{ createdAt: 'desc' }]
        });

        console.log(`Found ${result.docs.length} pending registrations from ${dbType} DB`);
        return result.docs;
      } catch (indexError) {
        console.log('Index query failed, trying without sort:', indexError.message);
        
        // Fallback: query without sort
        const result = await queryDB.find({
          selector: {
            type: 'member',
            status: 'pending'
          }
        });

        console.log(`Found ${result.docs.length} pending registrations (no sort) from ${dbType} DB`);
        
        // Sort manually
        return result.docs.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
    } catch (error) {
      console.error('Error getting pending registrations:', error);
      throw error;
    }
  }

  // Get pending admin requests (users with adminRequested flag)
  async getPendingAdminRequests() {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      // Use remote DB if available, otherwise use local
      const queryDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Querying ${dbType} database for admin requests...`);

      try {
        // Try with sort first
        const result = await queryDB.find({
          selector: {
            type: 'member',
            adminRequested: true
          },
          sort: [{ createdAt: 'desc' }]
        });

        console.log(`Found ${result.docs.length} pending admin requests from ${dbType} DB`);
        return result.docs;
      } catch (indexError) {
        console.log('Index query failed for admin requests, trying without sort:', indexError.message);
        
        // Fallback: query without sort
        const result = await queryDB.find({
          selector: {
            type: 'member',
            adminRequested: true
          }
        });

        console.log(`Found ${result.docs.length} pending admin requests (no sort) from ${dbType} DB`);
        
        // Sort manually
        return result.docs.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
    } catch (error) {
      console.error('Error getting pending admin requests:', error);
      throw error;
    }
  }

  // Get all admins (users and members with admin privileges)
  async getAllAdmins() {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      // Use remote DB if available, otherwise use local
      const queryDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Querying ${dbType} database for all admins...`);

      try {
        // Try with sort first
        const result = await queryDB.find({
          selector: {
            type: 'member',
            $or: [
              { role: 'admin' },
              { role: 'superadmin' }
            ]
          },
          sort: [{ createdAt: 'desc' }]
        });

        console.log(`Found ${result.docs.length} admins from ${dbType} DB`);
        return result.docs;
      } catch (indexError) {
        console.log('Index query failed for admins, trying without sort:', indexError.message);
        
        // Fallback: query without sort
        const result = await queryDB.find({
          selector: {
            type: 'member',
            $or: [
              { role: 'admin' },
              { role: 'superadmin' }
            ]
          }
        });

        console.log(`Found ${result.docs.length} admins (no sort) from ${dbType} DB`);
        
        // Sort manually
        return result.docs.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
    } catch (error) {
      console.error('Error getting all admins:', error);
      throw error;
    }
  }

  // Approve member registration
  async approveMemberRegistration(memberId, approvedBy) {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      // Use remote DB if available for consistency
      const updateDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Approving member in ${dbType} database...`);

      const member = await updateDB.get(memberId);
      
      if (member.type !== 'member') {
        throw new Error('Invalid member ID');
      }

      member.status = 'approved';
      member.approvedAt = new Date().toISOString();
      member.approvedBy = approvedBy;
      member.updatedAt = new Date().toISOString();

      const response = await updateDB.put(member);
      console.log(`Member ${memberId} approved successfully in ${dbType} DB`);
      return { ...member, _rev: response.rev };
    } catch (error) {
      console.error('Error approving registration:', error);
      throw error;
    }
  }

  // Deny member registration
  async denyMemberRegistration(memberId, deniedBy, reason = '') {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      // Use remote DB if available for consistency
      const updateDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Denying member in ${dbType} database...`);

      const member = await updateDB.get(memberId);
      
      if (member.type !== 'member') {
        throw new Error('Invalid member ID');
      }

      member.status = 'denied';
      member.deniedAt = new Date().toISOString();
      member.deniedBy = deniedBy;
      member.denialReason = reason;
      member.updatedAt = new Date().toISOString();

      const response = await updateDB.put(member);
      console.log(`Member ${memberId} denied successfully in ${dbType} DB`);
      return { ...member, _rev: response.rev };
    } catch (error) {
      console.error('Error denying registration:', error);
      throw error;
    }
  }

  // Promote user/member to admin
  async promoteToAdmin(userId, promotedBy) {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      // Use remote DB if available for consistency
      const updateDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Promoting user to admin in ${dbType} database...`);

      const user = await updateDB.get(userId);

      user.role = 'admin'; // Update to use 'role' field
      user.adminRequested = false;
      user.promotedToAdminAt = new Date().toISOString();
      user.promotedBy = promotedBy;
      user.updatedAt = new Date().toISOString();

      const response = await updateDB.put(user);
      console.log(`User ${userId} promoted to admin successfully in ${dbType} DB`);
      return { ...user, _rev: response.rev };
    } catch (error) {
      console.error('Error promoting to admin:', error);
      throw error;
    }
  }

  // Demote admin to regular member
  async demoteFromAdmin(userId, demotedBy) {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      // Use remote DB if available for consistency
      const updateDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Demoting admin to member in ${dbType} database...`);

      const user = await updateDB.get(userId);

      // Remove admin privileges (but not superadmin)
      if (user.isSuperAdmin || user.role === 'superadmin') {
        throw new Error('Cannot demote super admin');
      }

      // Clear admin-related fields
      delete user.role;
      delete user.isAdmin;
      user.adminRequested = false;
      user.demotedFromAdminAt = new Date().toISOString();
      user.demotedBy = demotedBy;
      user.updatedAt = new Date().toISOString();

      const response = await updateDB.put(user);
      console.log(`User ${userId} demoted from admin successfully in ${dbType} DB`);
      return { ...user, _rev: response.rev };
    } catch (error) {
      console.error('Error demoting from admin:', error);
      throw error;
    }
  }

  // Deny admin request
  async denyAdminRequest(userId, deniedBy, reason = '') {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      // Use remote DB if available for consistency
      const updateDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Denying admin request in ${dbType} database...`);

      const user = await updateDB.get(userId);

      user.adminRequested = false;
      user.adminRequestDeniedAt = new Date().toISOString();
      user.adminRequestDeniedBy = deniedBy;
      user.adminDenialReason = reason;
      user.updatedAt = new Date().toISOString();

      const response = await updateDB.put(user);
      console.log(`Admin request denied for ${userId} in ${dbType} DB`);
      return { ...user, _rev: response.rev };
    } catch (error) {
      console.error('Error denying admin request:', error);
      throw error;
    }
  }

  // Request admin privileges (for existing members/users)
  async requestAdminPrivileges(userId) {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      const user = await this.db.get(userId);

      // Check if already admin
      if (user.isAdmin || user.isSuperAdmin) {
        throw new Error('User already has admin privileges');
      }

      user.adminRequested = true;
      user.adminRequestedAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();

      const response = await this.db.put(user);
      return { ...user, _rev: response.rev };
    } catch (error) {
      console.error('Error requesting admin privileges:', error);
      throw error;
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
