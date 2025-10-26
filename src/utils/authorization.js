// Authorization utility for role-based access control

/**
 * Check if user is an admin (super admin or regular admin)
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return user.isAdmin === true || user.isSuperAdmin === true;
};

/**
 * Check if user is a super admin
 */
export const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.isSuperAdmin === true;
};

/**
 * Check if user can view a specific member record
 * - Admins can view all records
 * - Regular users can only view their own record
 */
export const canViewMember = (user, memberId) => {
  if (!user) return false;
  
  // Admins can view all records
  if (isAdmin(user)) return true;
  
  // Regular users can only view their own record
  if (user.loginType === 'member' || user.loginType === 'spouse') {
    return user._id === memberId;
  }
  
  return false;
};

/**
 * Check if user can edit a specific member record
 * - Admins can edit all records
 * - Regular users can only edit their own record
 */
export const canEditMember = (user, memberId) => {
  if (!user) return false;
  
  // Admins can edit all records
  if (isAdmin(user)) return true;
  
  // Regular users can only edit their own record
  if (user.loginType === 'member' || user.loginType === 'spouse') {
    return user._id === memberId;
  }
  
  return false;
};

/**
 * Check if user can delete a specific member record
 * - Only admins can delete records
 * - Regular users cannot delete any records (including their own)
 */
export const canDeleteMember = (user, memberId) => {
  if (!user) return false;
  
  // Only admins can delete records
  return isAdmin(user);
};

/**
 * Check if user can create new members
 * - Only admins can create new member records
 * - Regular users cannot create members
 */
export const canCreateMember = (user) => {
  if (!user) return false;
  
  // Only admins can create new members
  return isAdmin(user);
};

/**
 * Get filtered members based on user role
 * - Admins see all members
 * - Regular users see only their own record
 */
export const getFilteredMembers = (user, allMembers) => {
  if (!user || !allMembers) return [];
  
  // Admins see all members
  if (isAdmin(user)) return allMembers;
  
  // Regular users see only their own record
  if (user.loginType === 'member' || user.loginType === 'spouse') {
    return allMembers.filter(member => member._id === user._id);
  }
  
  return [];
};

/**
 * Get user role display name
 */
export const getUserRoleDisplay = (user) => {
  if (!user) return 'Guest';
  
  if (user.isSuperAdmin) return 'Super Admin';
  if (user.isAdmin) return 'Admin';
  if (user.loginType === 'member') return 'Member';
  if (user.loginType === 'spouse') return 'Spouse';
  
  return 'User';
};

/**
 * Check if user has any admin privileges
 */
export const hasAdminPrivileges = (user) => {
  return isAdmin(user) || isSuperAdmin(user);
};
