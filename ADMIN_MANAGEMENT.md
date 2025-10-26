# Admin Management & User Approval System

This document explains the admin management and user approval system implemented in the Member Management application.

## Overview

The system implements a hierarchical permission structure with approval workflows for new registrations and admin privilege requests.

## User Roles

### 1. Super Admin
- **Highest level of access**
- Can approve/deny new member registrations
- Can approve/deny admin privilege requests
- Can promote users to admin
- Can view and manage all member records
- Can create, edit, and delete any member record
- Cannot be deleted (protected account)

### 2. Admin
- **Mid-level access**
- Can approve/deny new member registrations
- Can view and manage all member records
- Can create, edit, and delete any member record
- **Cannot** approve admin requests (only Super Admin can)

### 3. Member/User
- **Basic access**
- Can only view and edit their own record
- **Cannot** create new member records
- **Cannot** delete any records (including their own)
- **Cannot** view other members' records
- Can request admin privileges (requires Super Admin approval)

## Registration & Approval Workflow

### New Member Registration

1. **User Registers**
   - User fills out registration form with their information
   - System creates member record with `status: 'pending'`
   - User receives message: "Registration successful! Your account is pending admin approval."

2. **Pending State**
   - User cannot log in while status is 'pending'
   - Login attempt shows: "Your account is pending admin approval. Please wait for approval before logging in."
   - Registration appears in Admin Management > Registrations tab

3. **Admin Reviews**
   - Admin or Super Admin sees pending registration in Admin Management
   - Can view all submitted information (name, email, mobile, address, etc.)
   - Two options:
     - **Approve**: Changes status to 'approved', user can now log in
     - **Deny**: Changes status to 'denied', requires reason

4. **After Approval**
   - User can log in with their credentials
   - User has standard member permissions (view/edit own record only)

5. **After Denial**
   - User cannot log in
   - Login attempt shows: "Your account registration was denied. Please contact support for more information."
   - Denial reason is stored in database for reference

## Admin Privilege Requests

### Requesting Admin Privileges

1. **Member Requests Admin Access**
   - Existing approved member can request admin privileges
   - System sets `adminRequested: true` flag
   - Request appears in Admin Management > Admin Requests tab

2. **Super Admin Reviews**
   - Only Super Admins can see and approve admin requests
   - Can view requester's information
   - Two options:
     - **Approve**: Promotes user to Admin role
     - **Deny**: Rejects request, requires reason

3. **After Approval**
   - User's `isAdmin` flag is set to `true`
   - User gains full admin permissions:
     - Can view all member records
     - Can create new members
     - Can edit any member record
     - Can delete any member record (except protected accounts)
     - Can approve new registrations

4. **After Denial**
   - User remains with standard member permissions
   - Denial reason stored for reference

## Admin Management Interface

### Accessing Admin Management

- Available only to Admins and Super Admins
- Purple "⚙ Admin Management" button on Dashboard
- Opens dedicated Admin Management screen

### Registrations Tab

**Features:**
- List of all pending registrations
- Shows member information:
  - Full name
  - Email
  - Mobile number
  - Address
  - Registration date
- Actions for each registration:
  - **✓ Approve**: Immediately approves the registration
  - **✗ Deny**: Opens modal to enter denial reason

**Permissions:**
- Available to Admins and Super Admins
- Shows count of pending registrations in tab: "Registrations (X)"

### Admin Requests Tab

**Features:**
- List of all pending admin privilege requests
- Shows requester information:
  - Name/Email
  - Mobile number
  - Current role (Member/User)
  - Request date
- Actions for each request:
  - **✓ Grant Admin**: Immediately promotes to Admin
  - **✗ Deny**: Opens modal to enter denial reason

**Permissions:**
- Available only to Super Admins
- Regular Admins cannot see this tab
- Shows count of pending requests in tab: "Admin Requests (X)"

## Permission System

### Authorization Functions

Located in `src/utils/authorization.js`:

```javascript
// Role Checks
isAdmin(user)                       // Check if user is admin or super admin
isSuperAdmin(user)                  // Check if user is super admin
hasAdminPrivileges(user)            // Check if user has any admin access

// Action Permissions
canViewMember(user, memberId)       // Can user view this member?
canEditMember(user, memberId)       // Can user edit this member?
canDeleteMember(user, memberId)     // Can user delete this member?
canCreateMember(user)               // Can user create new members?

// Management Permissions
canManageUsers(user)                // Can user manage user accounts? (Super Admin only)
canApproveRegistrations(user)       // Can user approve registrations? (Admin+)
canApproveAdmins(user)              // Can user approve admin requests? (Super Admin only)

// Helper Functions
getFilteredMembers(user, allMembers) // Get members visible to user
getUserRoleDisplay(user)             // Get user role as display string
```

### Database Permission Checks

Key database methods updated with permission checks:

```javascript
// Get members based on user permissions
DatabaseService.getMembersForUser(currentUser)

// Update member (checks if user can edit)
DatabaseService.updateMember(id, data, currentUser)

// Delete member (checks if user can delete)
DatabaseService.deleteMember(id, currentUser)
```

## Database Schema Updates

### Member/User Status Field

```javascript
{
  status: 'pending' | 'approved' | 'denied',
  approvedAt: ISO timestamp,
  approvedBy: user ID,
  deniedAt: ISO timestamp,
  deniedBy: user ID,
  denialReason: string
}
```

### Admin Request Fields

```javascript
{
  adminRequested: boolean,
  adminRequestedAt: ISO timestamp,
  promotedToAdminAt: ISO timestamp,
  promotedBy: user ID,
  adminRequestDeniedAt: ISO timestamp,
  adminRequestDeniedBy: user ID,
  adminDenialReason: string
}
```

## User Interface Changes

### Dashboard Updates

1. **Role Badge**
   - Shows user's role: Super Admin (red), Admin (red), Member (blue)
   - Displays in header section

2. **"Your Record" Badge**
   - Green badge on member's own record card
   - Only visible to non-admin users

3. **Conditional Buttons**
   - "Add New Member": Only visible to Admins
   - "Admin Management": Only visible to Admins (purple button)
   - "Edit" button: Only on records user can edit
   - "Delete" button: Only on records user can delete (Admins only)

4. **User Info Header**
   - Shows logged-in user's name
   - Displays role badge
   - Logout button

### Admin Management Screen

1. **Tab Navigation**
   - Registrations: Shows pending count
   - Admin Requests: Shows pending count (Super Admin only)

2. **Registration Cards**
   - Complete member information
   - Registration date
   - Approve/Deny actions

3. **Admin Request Cards**
   - Requester information
   - Current role badge
   - Request date
   - Grant Admin/Deny actions

4. **Denial Modal**
   - Required text input for denial reason
   - Validates that reason is provided
   - Cancel or Confirm actions

## Security Considerations

1. **Client-Side Validation**
   - All permission checks performed before showing UI elements
   - Buttons hidden if user lacks permissions

2. **Server-Side Validation**
   - Database methods check permissions before executing
   - Throws errors if unauthorized actions attempted

3. **Protected Accounts**
   - Super Admin accounts have `cannotBeDeleted: true` flag
   - Cannot be deleted through UI or database methods

4. **Status Checks on Login**
   - Pending accounts cannot log in
   - Denied accounts cannot log in
   - Only approved accounts gain access

## API Reference

### DatabaseService Methods

```javascript
// Registration Management
await DatabaseService.getPendingRegistrations()
await DatabaseService.approveMemberRegistration(memberId, approvedBy)
await DatabaseService.denyMemberRegistration(memberId, deniedBy, reason)

// Admin Privilege Management
await DatabaseService.getPendingAdminRequests()
await DatabaseService.promoteToAdmin(userId, promotedBy)
await DatabaseService.denyAdminRequest(userId, deniedBy, reason)
await DatabaseService.requestAdminPrivileges(userId)

// Permission-Aware Queries
await DatabaseService.getMembersForUser(currentUser)
await DatabaseService.updateMember(id, data, currentUser)
await DatabaseService.deleteMember(id, currentUser)
```

### AuthService Updates

```javascript
// Registration now returns pending status
const result = await AuthService.register(memberData, password)
// result.message: "Registration successful! Your account is pending admin approval."

// Login checks account status
const result = await AuthService.login(identifier, password)
// Throws error if status is 'pending' or 'denied'
```

## Testing the System

### Test Scenario 1: New Registration Approval

1. Register a new member
2. Attempt to log in (should be blocked)
3. Log in as Admin/Super Admin
4. Go to Admin Management > Registrations
5. Approve the registration
6. Log out and log in as the newly approved member

### Test Scenario 2: Registration Denial

1. Register a new member
2. Log in as Admin/Super Admin
3. Go to Admin Management > Registrations
4. Deny the registration with a reason
5. Attempt to log in as the denied member (should be blocked with reason)

### Test Scenario 3: Admin Privilege Request

1. Log in as regular member
2. Request admin privileges (via database method)
3. Log out and log in as Super Admin
4. Go to Admin Management > Admin Requests
5. Approve the request
6. Log out and log in as newly promoted admin
7. Verify admin capabilities (see all members, can delete, etc.)

## Troubleshooting

### Issue: Cannot see Admin Management button
**Solution:** Ensure user has `isAdmin: true` or `isSuperAdmin: true` flag

### Issue: Tabs not showing in Admin Management
**Solution:** 
- Registrations tab: Requires Admin or Super Admin
- Admin Requests tab: Requires Super Admin only

### Issue: Approved user still cannot log in
**Solution:** Verify `status: 'approved'` in database

### Issue: Regular admin cannot approve admin requests
**Solution:** This is by design - only Super Admins can approve admin requests

## Future Enhancements

1. **Email Notifications**
   - Send email when registration approved/denied
   - Send email when admin request approved/denied

2. **Audit Log**
   - Track all approval/denial actions
   - Show history of permission changes

3. **Bulk Actions**
   - Approve multiple registrations at once
   - Batch import with auto-approval option

4. **Admin Request UI**
   - Add button for members to request admin privileges
   - Show request status to member

5. **Role Management**
   - Add more granular role types
   - Custom permission sets
   - Role-based access control (RBAC)

## Support

For questions or issues with the admin management system, refer to:
- `src/utils/authorization.js` - Permission logic
- `src/services/DatabaseService.js` - Database operations
- `src/screens/AdminManagement.js` - Admin UI
- `src/services/AuthService.js` - Authentication logic
