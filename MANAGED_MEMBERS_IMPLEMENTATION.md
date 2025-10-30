# Managed Members Implementation Guide

## Overview
This guide explains how to implement the managed members functionality, which allows members to manage other members' profiles without requiring separate login credentials for each managed member.

## Database Schema Changes
Add these fields to member documents:

```javascript
{
  managedBy: string | null,      // ID of the parent member managing this account
  managedSince: string | null,   // ISO timestamp when management started
  hasOwnLogin: boolean,          // false for managed members
}
```

## Required Changes to DatabaseService.js

### 1. Add Index for Managed Members
In the `createIndexes()` method, add:

```javascript
await this.db.createIndex({
  index: {
    fields: ['type', 'managedBy', 'createdAt']
  }
});
```

### 2. Update createMember Method
```javascript
async createMember(memberData, parentMemberId = null) {
  try {
    if (!this.db) {
      await this.initDatabase();
    }
    
    // If this is a managed member, verify parent exists
    if (parentMemberId) {
      const parent = await this.db.get(parentMemberId);
      if (!parent) {
        throw new Error('Parent member not found');
      }
    }
    
    const doc = {
      ...memberData,
      _id: `member_${Date.now()}`,
      type: 'member',
      managedBy: parentMemberId,
      managedSince: parentMemberId ? new Date().toISOString() : null,
      hasOwnLogin: !parentMemberId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: parentMemberId ? 'approved' : 'active'
    };

    const response = await this.db.put(doc);
    return { ...doc, _rev: response.rev };
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
}
```

### 3. Update getMembersForUser Method
```javascript
async getMembersForUser(currentUser) {
  try {
    if (!this.db) {
      await this.initDatabase();
    }

    if (!currentUser) {
      return [];
    }

    // Admins see all members
    if (currentUser.isAdmin) {
      return await this.getAllMembers();
    }

    // Regular users see their profile and managed members
    const result = await this.db.find({
      selector: {
        type: 'member',
        $or: [
          { _id: currentUser._id },
          { managedBy: currentUser._id }
        ]
      },
      sort: [{ createdAt: 'desc' }]
    });

    return result.docs;
  } catch (error) {
    console.error('Error getting members for user:', error);
    throw error;
  }
}
```

### 4. Add Permission Check to updateMember Method
Update the permission check in updateMember:

```javascript
// In updateMember method
if (currentUser) {
  const isAdmin = currentUser.isAdmin === true;
  const isOwner = currentUser._id === id;
  const isManager = doc.managedBy === currentUser._id;

  if (!isAdmin && !isOwner && !isManager) {
    throw new Error('You do not have permission to update this member');
  }
}
```

## New Methods to Add

### 1. Get Managed Members
```javascript
async getManagedMembers(userId) {
  try {
    if (!this.db) {
      await this.initDatabase();
    }

    const result = await this.db.find({
      selector: {
        type: 'member',
        managedBy: userId
      },
      sort: [{ createdAt: 'desc' }]
    });

    return result.docs;
  } catch (error) {
    console.error('Error getting managed members:', error);
    throw error;
  }
}
```

### 2. Can Manage Member Check
```javascript
async canManageMember(userId, memberId) {
  try {
    if (!this.db) {
      await this.initDatabase();
    }

    const member = await this.db.get(memberId);
    const user = await this.db.get(userId);

    return user.isAdmin || userId === memberId || member.managedBy === userId;
  } catch (error) {
    console.error('Error checking management permissions:', error);
    return false;
  }
}
```

### 3. Remove Management Relationship
```javascript
async removeManagedMember(memberId, managerId) {
  try {
    if (!this.db) {
      await this.initDatabase();
    }

    const member = await this.db.get(memberId);

    if (member.managedBy !== managerId) {
      throw new Error('You do not have permission to remove this managed member');
    }

    const updatedDoc = {
      ...member,
      managedBy: null,
      managedSince: null,
      hasOwnLogin: true,
      status: 'pending',
      updatedAt: new Date().toISOString()
    };

    const response = await this.db.put(updatedDoc);
    return { ...updatedDoc, _rev: response.rev };
  } catch (error) {
    console.error('Error removing managed member:', error);
    throw error;
  }
}
```

## Usage Example

```javascript
// Create a managed member
const memberData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
};

// parentMemberId is the ID of the member who will manage this account
const managedMember = await DatabaseService.createMember(memberData, parentMemberId);

// Get all members managed by a user
const managedMembers = await DatabaseService.getManagedMembers(userId);

// Check if a user can manage a specific member
const canManage = await DatabaseService.canManageMember(userId, memberId);

// Remove management relationship
await DatabaseService.removeManagedMember(memberId, managerId);
```

## Implementation Steps

1. Update the database schema by adding the new indexes
2. Modify the existing methods in DatabaseService.js
3. Add the new methods for managed member functionality
4. Update the UI to support:
   - Creating managed members
   - Viewing managed members in dashboard
   - Managing member profiles
   - Removing management relationships

## Security Considerations

1. Always verify management permissions before allowing updates
2. Auto-approve managed members since they're under a parent's control
3. Don't allow managed members to have their own login credentials
4. When removing management, set status to 'pending' for admin review

## UI Integration

Add these options to your member creation form:

```jsx
const [isManagedMember, setIsManagedMember] = useState(false);

// In your form JSX
{currentUser && (
  <View style={styles.section}>
    <Text style={styles.label}>Registration Type</Text>
    
    <TouchableOpacity
      style={[styles.option, isManagedMember && styles.selectedOption]}
      onPress={() => setIsManagedMember(true)}>
      <Text>Add to My Account</Text>
      <Text style={styles.description}>
        This member will be added to your account. They will not have 
        separate login credentials. You will be able to manage their 
        profile from your dashboard.
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.option, !isManagedMember && styles.selectedOption]}
      onPress={() => setIsManagedMember(false)}>
      <Text>Create Separate Account</Text>
      <Text style={styles.description}>
        Create a separate account with login credentials for this member.
      </Text>
    </TouchableOpacity>
  </View>
)}

// In your form submission
const handleSubmit = async () => {
  const memberData = {
    firstName,
    lastName,
    email,
    // ... other fields
  };

  if (isManagedMember) {
    // Create as managed member
    await DatabaseService.createMember(memberData, currentUser._id);
  } else {
    // Create as independent member
    await DatabaseService.createMember(memberData);
  }
};
```

## Testing Steps

1. Create a regular member
2. Create a managed member under that member
3. Verify the parent member can:
   - View managed member's profile
   - Update managed member's information
   - Remove management relationship
4. Verify managed members:
   - Are auto-approved
   - Don't have login credentials
   - Are visible in parent's dashboard