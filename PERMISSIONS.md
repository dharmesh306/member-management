# Member Management Permissions

## Edit Permissions

Users can edit member records under these conditions:

### 1. Admin Users
- ✅ **Admins can edit ALL member records**
- No restrictions

### 2. Regular Users - Own Record
- ✅ **Users can edit their own member record**
- Condition: `user.memberId === memberId`
- Example: test1@test.com can edit their own member profile

### 3. Regular Users - Managed Members
- ✅ **Users can edit members they manage (family members)**
- Condition: `memberData.managedBy === user._id`
- Works for both:
  - **User accounts** (separate login): e.g., test1@test.com can edit test1-family if `managedBy: "user_test1@test.com"`
  - **Direct member accounts**: e.g., member John Smith can edit family members if `managedBy: "member_1234567890"`

## Delete Permissions

Users can delete member records under these conditions:

### 1. Admin Users
- ✅ **Admins can delete ALL member records**
- No restrictions

### 2. Regular Users - Own Record
- ❌ **Users CANNOT delete their own member record**
- Security measure to prevent accidental self-deletion

### 3. Regular Users - Managed Members
- ✅ **Users can delete members they manage (family members)**
- Condition: `memberData.managedBy === user._id`
- Works for both:
  - **User accounts** (separate login): e.g., test1@test.com can delete test1-family if `managedBy: "user_test1@test.com"`
  - **Direct member accounts**: e.g., member John Smith can delete family members if `managedBy: "member_1234567890"`

## View Permissions

- ✅ **All logged-in users can view the member directory**
- No restrictions on viewing member cards

## Create Permissions

- ✅ **Only admins can create new member records**
- Regular users cannot create new members through the admin interface
- Regular users can register themselves through the registration form

## Implementation

All permission checks are implemented in:
- **File**: `src/utils/authorization.js`
- **Functions**:
  - `canEditMember(user, memberId, memberData)`
  - `canDeleteMember(user, memberId, memberData)`
  - `canViewMember(user, memberId)`
  - `canCreateMember(user)`

## Testing

### Test Scenarios

1. **Admin (debra_brown@yahoo.com)**
   - Can edit/delete all members ✅

2. **Regular User with Own Record (test1@test.com)**
   - Can edit own member record ✅
   - Cannot delete own member record ❌
   - Can edit family members they manage ✅
   - Can delete family members they manage ✅

3. **Regular User without Managed Members**
   - Can only edit own member record ✅
   - Cannot edit other members ❌
   - Cannot delete any members ❌

## Database Fields Required

For managed members to work correctly:

```javascript
{
  "_id": "member_1762205358784",
  "type": "member",
  "firstName": "test1-family",
  "lastName": "patel",
  "email": "test1-family@hotmail.com",
  "managedBy": "user_test1@test.com",  // ← REQUIRED for permission check
  "status": "approved"
  // ... other fields
}
```

For users with member records:

```javascript
{
  "_id": "user_test1@test.com",
  "type": "user",
  "email": "test1@test.com",
  "memberId": "member_1762205358784",  // ← REQUIRED to edit own record
  "isAdmin": false
  // ... other fields
}
```
