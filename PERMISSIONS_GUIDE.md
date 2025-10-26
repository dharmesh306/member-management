# User Role and Permission System

## Overview

The Member Management application now includes a comprehensive role-based access control (RBAC) system that allows administrators to manage all records while regular users can only view and edit their own records.

## User Roles

### 1. Super Admin
- **Full Access**: Can view, create, edit, and delete all member records
- **Protected Account**: Cannot be deleted
- **Badge Color**: Red
- **Identifier**: `isSuperAdmin: true`

### 2. Admin
- **Full Access**: Can view, create, edit, and delete all member records
- **Badge Color**: Red
- **Identifier**: `isAdmin: true`

### 3. Regular User/Member
- **Limited Access**: Can only view and edit their own record
- **Cannot Create**: Cannot add new member records
- **Cannot Delete**: Cannot delete any records (including their own)
- **Badge Color**: Blue (shows "Your Record" badge on their own record)
- **Identifier**: `loginType: 'member'` or `'spouse'`

## Permissions Matrix

| Action | Super Admin | Admin | Regular User |
|--------|------------|-------|--------------|
| View all members | ✅ | ✅ | ❌ |
| View own record | ✅ | ✅ | ✅ |
| Create new members | ✅ | ✅ | ❌ |
| Edit all members | ✅ | ✅ | ❌ |
| Edit own record | ✅ | ✅ | ✅ |
| Delete any member | ✅ | ✅ | ❌ |
| Delete own record | ✅ | ✅ | ❌ |

## Features Implemented

### 1. Authorization Utility (`src/utils/authorization.js`)
A comprehensive set of helper functions to check permissions:
- `isAdmin(user)` - Check if user is admin or super admin
- `isSuperAdmin(user)` - Check if user is super admin
- `canViewMember(user, memberId)` - Check view permissions
- `canEditMember(user, memberId)` - Check edit permissions
- `canDeleteMember(user, memberId)` - Check delete permissions
- `canCreateMember(user)` - Check create permissions
- `getUserRoleDisplay(user)` - Get user-friendly role name
- `hasAdminPrivileges(user)` - Check if user has any admin privileges

### 2. Database Service Updates (`src/services/DatabaseService.js`)
- `getMembersForUser(currentUser)` - Returns filtered members based on role
  - Admins see all members
  - Regular users see only their own record
- `updateMember(id, memberData, currentUser)` - Permission check before updating
- `deleteMember(id, currentUser)` - Permission check before deleting

### 3. Dashboard Updates (`src/screens/Dashboard.js`)
- **User Role Header**: Shows current user's name and role badge
- **Conditional Buttons**: 
  - "Add New Member" button only visible to admins
  - "Edit" button only visible if user has edit permission
  - "Delete" button only visible if user has delete permission
- **Record Badges**: "Your Record" badge shown on user's own record
- **Filtered View**: Regular users only see their own record
- **Permission Alerts**: Clear error messages when users try unauthorized actions

### 4. Add/Edit Member Screen Updates (`src/screens/AddEditMember.js`)
- **Permission Verification**: Checks permissions on screen load
- **Auto-redirect**: Redirects users without permission
- **Double-check**: Verifies permissions before saving changes
- **Clear Error Messages**: Explains why user cannot perform action

## UI Indicators

### Role Badges
- **Super Admin / Admin**: Red badge with white text
- **Member / Spouse**: Blue badge with white text
- **Your Record**: Green badge shown on user's own record (non-admin only)

### Button Visibility
- Edit button: Shows only if user can edit that specific record
- Delete button: Shows only if user can delete (admins only)
- Add Member button: Shows only for admins

### User Header
Located at the top of the Dashboard:
- User's full name
- Role badge (color-coded)
- Logout button

## How to Use

### As an Admin:
1. Login with admin credentials
2. You'll see ALL member records in the dashboard
3. You can:
   - Add new members using the "Add New Member" button
   - Edit any member record by clicking "Edit"
   - Delete any member record by clicking "Delete"
   - View all statistics

### As a Regular User:
1. Login with your member credentials
2. You'll see ONLY your own record in the dashboard
3. You can:
   - View your own information
   - Edit your own record by clicking "Edit"
   - Update your personal information
4. You cannot:
   - See other members
   - Add new members
   - Delete any records

## Security Features

1. **Client-side validation**: Permissions checked in the UI before showing options
2. **Server-side validation**: Permissions checked again in DatabaseService before executing operations
3. **Double verification**: AddEditMember screen checks permissions on load and before save
4. **Clear error messages**: Users are informed why they cannot perform certain actions
5. **Protected accounts**: Super admin accounts cannot be deleted

## Testing the System

### Test as Admin:
```javascript
// Use the existing super admin or create one
// Login: admin@example.com / admin123
```

### Test as Regular User:
```javascript
// Create a regular member account
// Login with member credentials
// Verify limited access
```

## API Usage Examples

### Check if user can edit a member:
```javascript
import { canEditMember } from '../utils/authorization';

const canEdit = canEditMember(currentUser, memberId);
if (canEdit) {
  // Show edit button or allow editing
}
```

### Get filtered members for current user:
```javascript
import DatabaseService from '../services/DatabaseService';

const members = await DatabaseService.getMembersForUser(currentUser);
// Returns all members for admins, only own record for regular users
```

### Update member with permission check:
```javascript
await DatabaseService.updateMember(memberId, memberData, currentUser);
// Throws error if user doesn't have permission
```

## Future Enhancements

Possible additions to the permission system:
1. **Custom roles**: Define custom roles with specific permissions
2. **Group permissions**: Assign users to groups with shared permissions
3. **Audit logs**: Track who made what changes and when
4. **Field-level permissions**: Control which fields users can edit
5. **Time-based permissions**: Temporary access grants
6. **API-level security**: Add authentication tokens for API calls

## Troubleshooting

### User sees no members:
- Verify user is logged in
- Check if user has correct role assigned
- Ensure database initialization completed

### Permission denied errors:
- Confirm user role in database
- Check `isAdmin` or `isSuperAdmin` flags
- Verify session is valid

### Buttons not showing:
- Check if currentUser is passed to Dashboard component
- Verify authorization utility is imported
- Check browser console for errors

## Related Files

- `src/utils/authorization.js` - Permission checking functions
- `src/services/DatabaseService.js` - Database operations with permission checks
- `src/services/AuthService.js` - Authentication and session management
- `src/screens/Dashboard.js` - Main dashboard with role-based UI
- `src/screens/AddEditMember.js` - Member editing with permission validation
