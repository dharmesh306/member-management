// Authorization utility for role-based access control

/**
 * Check if user is an admin (super admin or regular admin)
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return (
    user.isAdmin === true || 
    user.isSuperAdmin === true ||
    user.role === 'admin' ||
    user.role === 'superadmin'
  );
};

/**
 * Check if user is a super admin
 */
export const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.isSuperAdmin === true || user.role === 'superadmin';
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
 * - Admins can edit all records (but not when logged in as member/spouse)
 * - Regular users can only edit their own record
 */
export const canEditMember = (user, memberId) => {
  if (!user) return false;
  
  // If logged in as member or spouse, can only edit own record
  if (user.loginType === 'member' || user.loginType === 'spouse') {
    return user._id === memberId;
  }
  
  // Admins (when logged in as admin/user) can edit all records
  if (isAdmin(user)) return true;
  
  return false;
};

/**
 * Check if user can delete a specific member record
 * - Only admins can delete records (and not when logged in as member/spouse)
 * - Regular users cannot delete any records (including their own)
 */
export const canDeleteMember = (user, memberId) => {
  if (!user) return false;
  
  // If logged in as member or spouse, cannot delete anything
  if (user.loginType === 'member' || user.loginType === 'spouse') {
    return false;
  }
  
  // Only admins (when logged in as admin/user) can delete records
  return isAdmin(user);
};

/**
 * Check if user can create new members
 * - Only admins can create new member records (and not when logged in as member/spouse)
 * - Regular users cannot create members
 */
export const canCreateMember = (user) => {
  if (!user) return false;
  
  // If logged in as member or spouse, cannot create members
  if (user.loginType === 'member' || user.loginType === 'spouse') {
    return false;
  }
  
  // Only admins (when logged in as admin/user) can create new members
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

/**
 * Check if user can manage other users (approve registrations, manage admins)
 * Admins and super admins can manage users
 */
export const canManageUsers = (user) => {
  if (!user) return false;
  return (
    user.isSuperAdmin === true ||
    user.isAdmin === true ||
    user.role === 'admin' ||
    user.role === 'superadmin'
  );
};

/**
 * Check if user can approve/deny new admin requests
 * Admins and super admins can approve admins
 */
export const canApproveAdmins = (user) => {
  if (!user) return false;
  return (
    user.isSuperAdmin === true ||
    user.isAdmin === true ||
    user.role === 'admin' ||
    user.role === 'superadmin'
  );
};

/**
 * Check if user can approve/deny member registrations
 * Admins and super admins can approve registrations
 */
export const canApproveRegistrations = (user) => {
  if (!user) return false;
  return isAdmin(user) || isSuperAdmin(user);
};
