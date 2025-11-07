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
 * - Users can edit their own member record (if user.memberId matches memberId)
 * - Users can edit members they manage (managedBy field matches user._id)
 */
export const canEditMember = (user, memberId, memberData = null) => {
  console.log('=== CAN EDIT MEMBER CHECK ===');
  console.log('memberData parameter:', memberData);
  console.log('memberData type:', typeof memberData);
  console.log('memberData is null?', memberData === null);
  console.log('memberData is undefined?', memberData === undefined);
  
  if (!user) {
    console.log('Edit permission denied: No user provided');
    return false;
  }
  
  // Admins can edit all records
  if (isAdmin(user)) {
    console.log('Edit permission granted: User is admin');
    return true;
  }
  
  // Users can edit their own member record
  if (user.memberId && user.memberId === memberId) {
    console.log('Edit permission granted: User editing their own member record', {
      userId: user._id,
      userMemberId: user.memberId,
      targetMemberId: memberId
    });
    console.log('============================');
    return true;
  }
  
  // Users can edit members they manage
  if (memberData && memberData.managedBy) {
    const isManagedByUser = memberData.managedBy === user._id;
    console.log('Edit permission check (managed member):', {
      userId: user._id,
      targetMemberId: memberId,
      managedBy: memberData.managedBy,
      isManagedByUser,
      memberDataKeys: Object.keys(memberData)
    });
    console.log('============================');
    return isManagedByUser;
  }
  
  console.log('Edit permission denied: User is not admin, not own record, and member is not managed by user', {
    userId: user._id,
    userMemberId: user.memberId,
    targetMemberId: memberId,
    memberData: memberData ? 'provided' : 'null',
    hasManagedBy: memberData?.managedBy ? 'yes' : 'no',
    managedByValue: memberData?.managedBy
  });
  console.log('============================');
  return false;
};

/**
 * Check if user can delete a specific member record
 * - Admins can delete all records
 * - Users can delete members they manage (managedBy field matches user._id)
 * - Users CANNOT delete their own member record (for safety)
 */
export const canDeleteMember = (user, memberId, memberData = null) => {
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
  
  // Admins can delete all records
  if (adminStatus) {
    console.log('Delete permission granted: User is admin');
    return true;
  }

  // Users CANNOT delete their own member record
  if (user.memberId && user.memberId === memberId) {
    console.log('Delete permission denied: Users cannot delete their own member record', {
      userId: user._id,
      userMemberId: user.memberId,
      targetMemberId: memberId
    });
    return false;
  }

  // Users can delete members they manage
  if (memberData && memberData.managedBy) {
    const isManagedByUser = memberData.managedBy === user._id;
    console.log('Delete permission check (managed member):', {
      userId: user._id,
      targetMemberId: memberId,
      managedBy: memberData.managedBy,
      isManagedByUser
    });
    return isManagedByUser;
  }

  if (!memberId) {
    console.log('Delete permission warning: No target member ID provided');
  }

  console.log('Delete permission denied: User is not admin and member is not managed by user');
  return false;
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
