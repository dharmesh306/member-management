// Authorization utility for role-based access control

/**
 * Check if user is an admin
 */
export const isAdmin = (user) => {
  if (!user) {
    console.log('isAdmin check failed: No user provided');
    return false;
  }
  
  const adminStatus = user.isAdmin === true || user.role === 'admin';
  console.log('Admin status check:', {
    userId: user._id,
    isAdmin: user.isAdmin,
    role: user.role,
    result: adminStatus
  });
  
  return adminStatus;
};

/**
 * Check if user can view a specific member record
 * - Admins can view all records
 * - Regular users can view all records (directory viewing)
 */
export const canViewMember = (user, memberId) => {
  if (!user) {
    console.log('View permission denied: No user provided');
    return false;
  }
  console.log('View permission granted for:', {
    userId: user._id,
    targetMemberId: memberId
  });
  // Everyone can view the member directory
  return true;
};

/**
 * Check if user can edit a specific member record
 * - Admins can edit all records
 * - Regular users cannot edit any records in the search/directory view
 * - Regular users can only edit their own profile through "Edit My Profile" menu
 */
export const canEditMember = (user, memberId) => {
  if (!user) {
    console.log('Edit permission denied: No user provided');
    return false;
  }
  
  const hasPermission = isAdmin(user);
  console.log('Edit permission check:', {
    userId: user._id,
    targetMemberId: memberId,
    isAdmin: user.isAdmin,
    role: user.role,
    hasPermission
  });
  
  return hasPermission;
};

/**
 * Check if user can delete a specific member record
 * - Only admins can delete records
 * - Regular users cannot delete any records (including their own)
 */
export const canDeleteMember = (user, memberId) => {
  if (!user) {
    console.log('Delete permission denied: No user provided');
    return false;
  }

  // Log detailed user info
  console.log('Delete permission check - User details:', {
    userId: user._id,
    email: user.email,
    isAdmin: user.isAdmin,
    role: user.role,
    loginType: user.loginType
  });

  // Check admin status
  const adminStatus = isAdmin(user);
  console.log('Delete permission check - Admin status:', {
    userId: user._id,
    isAdmin: adminStatus,
    targetMemberId: memberId
  });

  // Additional validation checks
  if (!adminStatus) {
    console.log('Delete permission denied: User is not an admin');
    return false;
  }

  if (!memberId) {
    console.log('Delete permission warning: No target member ID provided');
  }

  if (memberId === user._id) {
    console.log('Delete permission warning: User attempting to delete their own record');
  }

  console.log('Delete permission granted for admin user');
  return true;
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
 * - All users see all members (directory viewing)
 */
export const getFilteredMembers = (user, allMembers) => {
  if (!user || !allMembers) return [];
  
  // Everyone sees all members (member directory)
  return allMembers;
};

/**
 * Get user role display name
 */
export const getUserRoleDisplay = (user) => {
  if (!user) return 'Guest';
  
  if (user.isAdmin) return 'Admin';
  
  return 'Member';
};

/**
 * Check if user has any admin privileges
 */
export const hasAdminPrivileges = (user) => {
  return isAdmin(user);
};

/**
 * Check if user can manage other users (approve registrations, manage admins)
 */
export const canManageUsers = (user) => {
  if (!user) return false;
  return user.isAdmin === true || user.role === 'admin';
};

/**
 * Check if user can approve/deny new admin requests
 */
export const canApproveAdmins = (user) => {
  if (!user) return false;
  return user.isAdmin === true || user.role === 'admin';
};

/**
 * Check if user can approve/deny member registrations
 */
export const canApproveRegistrations = (user) => {
  if (!user) return false;
  return isAdmin(user);
};
