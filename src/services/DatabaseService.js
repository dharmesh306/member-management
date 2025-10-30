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
    this.initializationPromise = null;
    
    // Auto-initialize database
    this.initializationPromise = Promise.resolve().then(() => {
      return this.initDatabase();
    }).catch(error => {
      console.error('Failed to initialize database:', error);
      throw error;
    });
  }

  // Initialize local database
  async initDatabase() {
    try {
      // For web, IndexedDB is used automatically
      // For mobile, we'll configure AsyncStorage adapter
      this.db = new PouchDB('member_management', {
        auto_compaction: true,
      });

      // Create indexes for better query performance
      await this.createIndexes();
      
      // Auto-connect to remote CouchDB server if enabled
      if (config.app.enableAutoSync) {
        await this.connectToRemote(
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
  async connectToRemote(remoteUrl, username, password) {
    try {
      console.log('Connecting to remote CouchDB...');
      const auth = username && password 
        ? `${username}:${password}@` 
        : '';
      
      const dbUrl = remoteUrl.replace('://', `://${auth}`);
      this.remoteDB = new PouchDB(dbUrl);

      // Test the connection
      const info = await this.remoteDB.info();
      console.log('Remote database info:', info);

      // Set up continuous sync with config options
      const syncOptions = {
        ...(config.couchdb.syncOptions || {}),
        live: true,
        retry: true,
        batch_size: 50,
        timeout: 30000, // 30 seconds timeout
        heartbeat: 10000, // 10 seconds heartbeat
      };

      // Close existing sync if any
      if (this.syncHandler) {
        console.log('Closing existing sync handler...');
        this.syncHandler.cancel();
      }

      console.log('Setting up sync with options:', syncOptions);
      this.syncHandler = this.db.sync(this.remoteDB, syncOptions)
        .on('change', (info) => {
          console.log('Sync change:', {
            direction: info.direction,
            change: {
              docs_read: info.change.docs_read,
              docs_written: info.change.docs_written,
              doc_write_failures: info.change.doc_write_failures
            }
          });
        })
        .on('paused', (err) => {
          console.log('Sync paused:', err || 'No error');
        })
        .on('active', () => {
          console.log('Sync resumed - replicating changes...');
        })
        .on('denied', (err) => {
          console.error('Sync denied:', err);
        })
        .on('error', (err) => {
          console.error('Sync error:', {
            error: err,
            name: err.name,
            message: err.message,
            status: err.status
          });
        })
        .on('complete', (info) => {
          console.log('Sync complete:', info);
        });

      console.log('Successfully connected to remote CouchDB');
      return this.remoteDB;
    } catch (error) {
      console.error('Error connecting to remote database:', {
        error: error,
        name: error.name,
        message: error.message,
        status: error.status
      });
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

      // Index for managed members
      await this.db.createIndex({
        index: {
          fields: ['type', 'managedBy', 'createdAt']
        }
      });

      console.log('Indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  // Create a new member
  async createMember(memberData, parentMemberId = null) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        await this.initDatabase();
      }
      
      console.log('Creating new member with data:', {
        email: memberData.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        managedBy: parentMemberId
      });
      
      const doc = {
        ...memberData,
        _id: `member_${Date.now()}`,
        type: 'member',
        managedBy: parentMemberId,
        managedSince: parentMemberId ? new Date().toISOString() : null,
        hasOwnLogin: !parentMemberId, // If managed by parent, they don't have their own login
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: parentMemberId ? 'approved' : 'active' // Auto-approve managed members
      };

      console.log('Attempting to save new member document...');
      const response = await this.db.put(doc);
      console.log('Member created successfully:', response);
      
      return { ...doc, _rev: response.rev };
    } catch (error) {
      console.error('Error creating member:', error);
      
      // Add more detailed error information
      if (error.name === 'conflict') {
        throw new Error('A member with this ID already exists');
      } else if (error.name === 'not_found') {
        throw new Error('Database not found. Please ensure CouchDB is properly configured');
      } else {
        throw new Error(`Failed to create member: ${error.message}`);
      }
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
        const isAdmin = currentUser.isAdmin === true;
        const isOwner = currentUser._id === id;

        console.log('UpdateMember Permission Check:', {
          userId: currentUser._id,
          targetId: id,
          isAdmin,
          isOwner,
          canUpdate: isAdmin || isOwner
        });

        // Only admins or the member themselves can update
        if (!isAdmin && !isOwner) {
          throw new Error('You do not have permission to update this member');
        }
      }
      
      // Get the latest version of the document from the database
      const doc = await this.db.get(id);
      
      console.log('Current doc from DB:', {
        _id: doc._id,
        _rev: doc._rev,
        email: doc.email
      });
      
      // Create a copy of memberData without _id and _rev to avoid conflicts
      const { _id, _rev, ...cleanMemberData } = memberData;
      
      console.log('Clean member data keys:', Object.keys(cleanMemberData));
      
      // Merge the clean member data with the existing doc, preserving _id and _rev
      const updatedDoc = {
        ...doc,
        ...cleanMemberData,
        _id: doc._id,      // Preserve original _id
        _rev: doc._rev,    // Preserve latest _rev from database
        updatedAt: new Date().toISOString(),
      };

      console.log('Attempting to save updated doc:', {
        _id: updatedDoc._id,
        _rev: updatedDoc._rev,
        email: updatedDoc.email
      });

      const response = await this.db.put(updatedDoc);
      
      console.log('Update successful, new rev:', response.rev);
      
      return { ...updatedDoc, _rev: response.rev };
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  // Delete a member
  async deleteMember(id, currentUser = null) {
    try {
      console.log('Starting delete operation with:', {
        id,
        currentUser: currentUser ? {
          _id: currentUser._id,
          email: currentUser.email,
          isAdmin: currentUser.isAdmin,
          role: currentUser.role
        } : null
      });

      // Check database initialization
      if (!this.db) {
        console.log('Database not initialized, attempting to initialize...');
        try {
          await this.initDatabase();
          console.log('Database initialized successfully');
        } catch (initError) {
          console.error('Failed to initialize database:', initError);
          throw new Error('Database initialization failed. Please try again.');
        }
      }

      // Verify database connection
      try {
        const dbInfo = await this.db.info();
        console.log('Database connection verified:', {
          dbName: dbInfo.db_name,
          docCount: dbInfo.doc_count,
          updateSeq: dbInfo.update_seq
        });
      } catch (dbError) {
        console.error('Database connection check failed:', dbError);
        throw new Error('Unable to connect to database. Please check your connection.');
      }

      // Enhanced permission check for deletion
      if (!currentUser) {
        console.error('Delete operation failed: No user provided');
        throw new Error('Authentication required to delete members');
      }

      // Verify admin status
      const isAdmin = currentUser.isAdmin === true || currentUser.role === 'admin';
      console.log('Permission check for deletion:', {
        userId: currentUser._id,
        email: currentUser.email,
        isAdmin: currentUser.isAdmin,
        role: currentUser.role,
        hasPermission: isAdmin
      });

      if (!isAdmin) {
        console.error('Delete operation failed: User is not an admin');
        throw new Error('You do not have permission to delete members. Only admins can delete records.');
      }

      // Verify user session and database connection
      if (!this.db) {
        console.log('Database not initialized during delete operation');
        throw new Error('Database connection not available');
      }

      // First try to get the document
      console.log('Fetching document with ID:', id);
      let doc;
      try {
        doc = await this.db.get(id);
        console.log('Found document:', {
          docId: doc._id,
          docRev: doc._rev,
          docType: doc.type
        });
      } catch (getError) {
        console.error('Error fetching document:', getError);
        if (getError.name === 'not_found') {
          throw new Error(`Member record not found with ID: ${id}`);
        }
        throw getError;
      }

      // Verify document type
      if (!doc.type || doc.type !== 'member') {
        console.error('Invalid document type:', doc.type);
        throw new Error(`Invalid document type: ${doc.type}. Can only delete member records.`);
      }

      // Attempt to remove the document
      console.log('Attempting to remove document:', {
        id: doc._id,
        rev: doc._rev,
        dbInstance: !!this.db,
        useRemote: !!this.remoteDB
      });
      
      try {
        // Always delete from local DB first
        console.log('Starting deletion process...');
        
        const deleteDoc = {
          _id: doc._id,
          _rev: doc._rev,
          _deleted: true
        };

        console.log('Attempting local deletion:', {
          id: deleteDoc._id,
          rev: deleteDoc._rev
        });

        // Try local deletion
        const localResponse = await this.db.put(deleteDoc);
        console.log('Local deletion successful:', localResponse);

        // If we have a remote DB, sync the change
        if (this.remoteDB) {
          console.log('Remote DB exists, syncing deletion...');
          
          try {
            await this.db.sync(this.remoteDB, {
              live: false,
              retry: true,
              timeout: 10000,
              batch_size: 1
            });
            console.log('Remote sync completed successfully');
          } catch (syncError) {
            console.error('Sync error:', syncError);
            // Even if sync fails, local deletion succeeded
            console.log('Note: Local deletion successful but remote sync failed');
          }
        }

        // Verify the document is gone
        try {
          await this.db.get(doc._id);
          throw new Error('Document still exists after deletion');
        } catch (verifyError) {
          if (verifyError.name === 'not_found') {
            console.log('Deletion verified - document no longer exists');
          } else {
            throw verifyError;
          }
        }

        return localResponse;
      } catch (deleteError) {
        // Enhanced error handling for deletion
        console.error('Delete operation error:', deleteError);
        
        // Check specific error conditions
        if (deleteError.name === 'not_found') {
          throw new Error('Document not found. It may have been deleted already.');
        } else if (deleteError.name === 'conflict') {
          console.log('Conflict detected, attempting to get latest revision...');
          try {
            // Get latest revision and try again
            const latestDoc = await this.db.get(doc._id);
            const retryDoc = {
              _id: latestDoc._id,
              _rev: latestDoc._rev,
              _deleted: true
            };
            console.log('Retrying deletion with latest revision:', latestDoc._rev);
            return await this.db.put(retryDoc);
          } catch (retryError) {
            throw new Error('Conflict error: Document has been modified. Please refresh and try again.');
          }
        } else if (deleteError.status === 403) {
          throw new Error('Permission denied. You may not have the required access rights.');
        } else if (deleteError.message.includes('Failed to fetch')) {
          throw new Error('Network error while deleting. Please check your connection and try again.');
        }
        
        throw deleteError;
      }
    } catch (error) {
      console.error('Delete operation failed:', {
        error: error,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });

      // Enhanced error handling with specific messages
      if (error.name === 'not_found') {
        throw new Error(`Member record not found with ID: ${id}`);
      } else if (error.name === 'unauthorized') {
        throw new Error('Unauthorized to delete this member. Please check your permissions.');
      } else if (error.name === 'conflict') {
        throw new Error('Document conflict detected. Please refresh and try again.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Failed to delete member: ${error.message || 'Unknown error occurred'}`);
      }
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
      
      // Always query local DB for most up-to-date data
      const queryDB = this.db;
      console.log(`Getting all members from local database...`);
      
      const result = await queryDB.allDocs({
        include_docs: true,
        startkey: 'member_',
        endkey: 'member_\ufff0',
      });

      console.log(`Found ${result.rows.length} total members in local DB`);
      const members = result.rows.map(row => row.doc);
      
      // Log a sample member to verify data freshness
      if (members.length > 0) {
        console.log('Sample member data:', {
          _id: members[0]._id,
          _rev: members[0]._rev,
          email: members[0].email,
          firstName: members[0].firstName
        });
      }
      
      return members;
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

      // If no user, return empty array
      if (!currentUser) {
        console.log('No valid user - returning empty array');
        return [];
      }

      // For admins, return all members
      if (currentUser.isAdmin) {
        console.log('Admin user - returning all members');
        return await this.getAllMembers();
      }

      // For regular users, get:
      // 1. All members they manage
      // 2. Their own record
      const result = await this.db.find({
        selector: {
          type: 'member',
          $or: [
            { _id: currentUser._id },
            { managedBy: currentUser._id }
          ]
        }
      });

      console.log(`Regular user - returning ${result.docs.length} members (self + managed members)`);
      return result.docs;
    } catch (error) {
      console.error('Error getting members for user:', error);
      throw error;
    }
  }

  // Get managed members for a specific user
  async getManagedMembers(userId) {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      const result = await this.db.find({
        selector: {
          type: 'member',
          managedBy: userId
        },
        sort: [{ createdAt: 'desc' }]
      });

      console.log(`Found ${result.docs.length} managed members for user ${userId}`);
      return result.docs;
    } catch (error) {
      console.error('Error getting managed members:', error);
      throw error;
    }
  }

  // Check if user can manage a specific member
  async canManageMember(userId, memberId) {
    try {
      if (!this.db) {
        this.initDatabase();
      }

      const user = await this.db.get(userId);
      const member = await this.db.get(memberId);

      // Admins can manage anyone
      if (user.isAdmin) {
        return true;
      }

      // Users can manage their own profile
      if (userId === memberId) {
        return true;
      }

      // Users can manage members they created
      if (member.managedBy === userId) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking management permissions:', error);
      return false;
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
        await this.initDatabase();
      }

      // Use remote DB if available for consistency
      const updateDB = this.remoteDB || this.db;
      const dbType = this.remoteDB ? 'remote' : 'local';
      console.log(`Approving member in ${dbType} database...`);

      const member = await updateDB.get(memberId);
      
      if (member.type !== 'member') {
        throw new Error('Invalid member ID');
      }

      // Update member status and management details
      member.status = 'approved';
      member.approvedAt = new Date().toISOString();
      member.approvedBy = approvedBy;
      member.updatedAt = new Date().toISOString();
      member.managedBy = member.requestedBy || approvedBy; // Set managedBy to requestedBy if available, otherwise approver
      member.managementStatus = 'active';
      member.managementApprovedAt = new Date().toISOString();

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

      user.isAdmin = true; // Set admin flag
      user.role = 'admin'; // Also set role for compatibility
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
      if (user.isAdmin) {
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

  // Get managed members for a specific user
  async getManagedMembers(userId) {
    try {
      if (!this.db) {
        await this.initDatabase();
      }

      console.log('Fetching managed members for user:', userId);

      const result = await this.db.find({
        selector: {
          type: 'member',
          managedBy: userId
        },
        sort: [{ createdAt: 'desc' }]
      });

      console.log(`Found ${result.docs.length} managed members`);
      return result.docs;
    } catch (error) {
      console.error('Error getting managed members:', error);
      throw error;
    }
  }

  // Add a managed member
  async addManagedMember(memberData, parentMemberId) {
    try {
      if (!this.db) {
        await this.initDatabase();
      }

      console.log('Creating managed member under parent:', parentMemberId);

      // First verify the parent member exists
      const parentMember = await this.db.get(parentMemberId);
      if (!parentMember) {
        throw new Error('Parent member not found');
      }

      const doc = {
        ...memberData,
        _id: `member_${Date.now()}`,
        type: 'member',
        managedBy: parentMemberId,
        managedSince: new Date().toISOString(),
        hasOwnLogin: false,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await this.db.put(doc);
      console.log('Managed member created successfully:', response);

      return { ...doc, _rev: response.rev };
    } catch (error) {
      console.error('Error adding managed member:', error);
      throw error;
    }
  }

  // Check if user can manage a specific member
  async canManageMember(userId, memberId) {
    try {
      if (!this.db) {
        await this.initDatabase();
      }

      const user = await this.db.get(userId);
      const member = await this.db.get(memberId);

      // Admins can manage anyone
      if (user.isAdmin) {
        return true;
      }

      // Users can manage their own profile
      if (userId === memberId) {
        return true;
      }

      // Users can manage members they created/manage
      if (member.managedBy === userId) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking management permissions:', error);
      return false;
    }
  }

  // Update managed member details
  async updateManagedMember(memberId, memberData, managerId) {
    try {
      if (!this.db) {
        await this.initDatabase();
      }

      // Get the current member document
      const member = await this.db.get(memberId);

      // Verify this is a managed member and the manager has permission
      if (member.managedBy !== managerId) {
        throw new Error('You do not have permission to update this member');
      }

      // Update the member data
      const updatedDoc = {
        ...member,
        ...memberData,
        _id: member._id,
        _rev: member._rev,
        updatedAt: new Date().toISOString(),
        // Preserve management fields
        managedBy: member.managedBy,
        managedSince: member.managedSince,
        hasOwnLogin: false
      };

      const response = await this.db.put(updatedDoc);
      console.log('Managed member updated successfully:', response);

      return { ...updatedDoc, _rev: response.rev };
    } catch (error) {
      console.error('Error updating managed member:', error);
      throw error;
    }
  }

  // Get all members managed by a specific member
  async getAllManagedMembers(userId) {
    try {
      if (!this.db) {
        await this.initDatabase();
      }

      // Create an index for managed members if it doesn't exist
      await this.db.createIndex({
        index: {
          fields: ['managedBy', 'createdAt']
        }
      });

      const result = await this.db.find({
        selector: {
          type: 'member',
          managedBy: userId
        },
        sort: [{ createdAt: 'desc' }]
      });

      return result.docs;
    } catch (error) {
      console.error('Error getting all managed members:', error);
      throw error;
    }
  }

  // Remove management relationship
  async removeManagedMember(memberId, managerId) {
    try {
      if (!this.db) {
        await this.initDatabase();
      }

      // Get the current member document
      const member = await this.db.get(memberId);

      // Verify this is a managed member and the manager has permission
      if (member.managedBy !== managerId) {
        throw new Error('You do not have permission to remove this managed member');
      }

      // Update the member to remove management
      const updatedDoc = {
        ...member,
        _id: member._id,
        _rev: member._rev,
        managedBy: null,
        managedSince: null,
        hasOwnLogin: true, // They'll need their own login now
        status: 'pending', // They'll need to be approved as a regular member
        updatedAt: new Date().toISOString()
      };

      const response = await this.db.put(updatedDoc);
      console.log('Management relationship removed successfully:', response);

      return { ...updatedDoc, _rev: response.rev };
    } catch (error) {
      console.error('Error removing managed member:', error);
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
