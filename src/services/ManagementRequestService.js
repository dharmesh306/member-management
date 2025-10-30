import DatabaseService from './DatabaseService';

class ManagementRequestService {
  // Create a new management request
  async createRequest(memberId, requestedManagerId, reason) {
    try {
      const member = await DatabaseService.getMember(memberId);
      const requestedManager = await DatabaseService.getMember(requestedManagerId);

      if (!member || !requestedManager) {
        throw new Error('Invalid member or manager ID');
      }

      // Check if there's already a pending request
      const existingRequest = member.managementRequests?.find(
        req => req.status === 'pending' && req.requestedManagerId === requestedManagerId
      );

      if (existingRequest) {
        throw new Error('A pending request already exists for this manager');
      }

      // Create the request object
      const request = {
        requestId: Math.random().toString(36).substring(2, 15),
        requestedManagerId,
        requestedManagerName: `${requestedManager.firstName} ${requestedManager.lastName}`,
        requestDate: new Date().toISOString(),
        status: 'pending',
        reason,
      };

      // Add request to member's record
      member.managementRequests = member.managementRequests || [];
      member.managementRequests.push(request);

      // Save the updated member record
      await DatabaseService.updateMember(member._id, member);

      console.log('\n=== MANAGEMENT REQUEST CREATED ===');
      console.log(`Member: ${member.firstName} ${member.lastName}`);
      console.log(`Requested Manager: ${requestedManager.firstName} ${requestedManager.lastName}`);
      console.log('Status: Pending Admin Approval');
      console.log('═════════════════════════════════\n');

      return {
        success: true,
        message: 'Management request created successfully',
        request
      };
    } catch (error) {
      console.error('Create management request error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Approve or deny a management request (admin only)
  async processRequest(memberId, requestId, approved, adminId, notes) {
    try {
      const member = await DatabaseService.getMember(memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      // Find the request
      const requestIndex = member.managementRequests?.findIndex(req => req.requestId === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Request not found');
      }

      const request = member.managementRequests[requestIndex];
      
      // Update request status
      request.status = approved ? 'approved' : 'denied';
      request.processedDate = new Date().toISOString();
      request.processedBy = adminId;
      request.adminNotes = notes;

      if (approved) {
        // Update member's management settings
        member.managedBy = request.requestedManagerId;
        member.managementApprovedDate = new Date().toISOString();
        member.managementApprovedBy = adminId;
      }

      // Save changes
      await DatabaseService.updateMember(member._id, member);

      console.log('\n=== MANAGEMENT REQUEST PROCESSED ===');
      console.log(`Member: ${member.firstName} ${member.lastName}`);
      console.log(`Status: ${approved ? 'Approved ✅' : 'Denied ❌'}`);
      console.log(`Processed by Admin ID: ${adminId}`);
      if (notes) console.log(`Notes: ${notes}`);
      console.log('═════════════════════════════════\n');

      return {
        success: true,
        message: `Management request ${approved ? 'approved' : 'denied'} successfully`
      };
    } catch (error) {
      console.error('Process management request error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel a pending management request
  async cancelRequest(memberId, requestId) {
    try {
      const member = await DatabaseService.getMember(memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      // Find and update the request
      const requestIndex = member.managementRequests?.findIndex(req => req.requestId === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Request not found');
      }

      if (member.managementRequests[requestIndex].status !== 'pending') {
        throw new Error('Only pending requests can be cancelled');
      }

      // Update request status
      member.managementRequests[requestIndex].status = 'cancelled';
      member.managementRequests[requestIndex].cancelledDate = new Date().toISOString();

      // Save changes
      await DatabaseService.updateMember(member._id, member);

      return {
        success: true,
        message: 'Management request cancelled successfully'
      };
    } catch (error) {
      console.error('Cancel management request error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all pending management requests (admin only)
  async getPendingRequests() {
    try {
      const members = await DatabaseService.getAllMembers();
      const pendingRequests = [];

      members.forEach(member => {
        if (member.managementRequests) {
          member.managementRequests
            .filter(req => req.status === 'pending')
            .forEach(req => {
              pendingRequests.push({
                memberId: member._id,
                memberName: `${member.firstName} ${member.lastName}`,
                memberEmail: member.email,
                memberMobile: member.mobile,
                ...req
              });
            });
        }
      });

      return {
        success: true,
        requests: pendingRequests
      };
    } catch (error) {
      console.error('Get pending requests error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get management requests for a specific member
  async getMemberRequests(memberId) {
    try {
      const member = await DatabaseService.getMember(memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      return {
        success: true,
        requests: member.managementRequests || []
      };
    } catch (error) {
      console.error('Get member requests error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ManagementRequestService();