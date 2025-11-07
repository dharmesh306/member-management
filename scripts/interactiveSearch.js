const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const readline = require('readline');

PouchDB.plugin(PouchDBFind);

// Try localhost first, can be changed if needed
const db = new PouchDB('http://admin:password@localhost:5984/member_management');

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

function displayMember(member, index) {
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${index}. ${member.firstName} ${member.lastName}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}📧 Email:${colors.reset}        ${member.email || 'N/A'}`);
  console.log(`${colors.green}📱 Mobile:${colors.reset}       ${member.mobile || 'N/A'}`);
  console.log(`${colors.green}🆔 Member ID:${colors.reset}    ${member._id}`);
  
  if (member.status) {
    const statusColor = member.status === 'active' ? colors.green : 
                       member.status === 'pending' ? colors.yellow : colors.red;
    console.log(`${colors.green}📊 Status:${colors.reset}       ${statusColor}${member.status}${colors.reset}`);
  }
  
  if (member.role) {
    console.log(`${colors.green}👤 Role:${colors.reset}         ${member.role}`);
  }
  
  if (member.managedBy) {
    console.log(`${colors.green}👨‍💼 Managed By:${colors.reset}   ${member.managedBy}`);
  }
  
  if (member.dateOfBirth) {
    console.log(`${colors.green}🎂 DOB:${colors.reset}          ${member.dateOfBirth}`);
  }
  
  if (member.address) {
    console.log(`${colors.green}🏠 Address:${colors.reset}      ${member.address}`);
  }
  
  if (member.city) {
    console.log(`${colors.green}🌆 City:${colors.reset}         ${member.city}, ${member.state || ''} ${member.zipCode || ''}`);
  }
  
  if (member.createdAt) {
    const date = new Date(member.createdAt);
    console.log(`${colors.green}📅 Created:${colors.reset}      ${date.toLocaleString()}`);
  }
  
  if (member.updatedAt) {
    const date = new Date(member.updatedAt);
    console.log(`${colors.green}🔄 Updated:${colors.reset}      ${date.toLocaleString()}`);
  }
}

function displaySummary(members) {
  console.log(`\n${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}📊 SEARCH SUMMARY${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}Total Results: ${colors.bright}${members.length}${colors.reset}`);
  
  if (members.length > 0) {
    // Count by status
    const statusCounts = {};
    members.forEach(m => {
      const status = m.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log(`\n${colors.yellow}By Status:${colors.reset}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      const statusColor = status === 'active' ? colors.green : 
                         status === 'pending' ? colors.yellow : colors.red;
      console.log(`  ${statusColor}● ${status}:${colors.reset} ${count}`);
    });
    
    // Count by role
    const roleCounts = {};
    members.forEach(m => {
      const role = m.role || 'member';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    if (Object.keys(roleCounts).length > 1 || Object.keys(roleCounts)[0] !== 'member') {
      console.log(`\n${colors.yellow}By Role:${colors.reset}`);
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`  ${colors.magenta}● ${role}:${colors.reset} ${count}`);
      });
    }
  }
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function searchMembers(searchTerm, searchType = 'all', limit = 50) {
  try {
    let selector = { type: 'member' };
    
    // Require search term for broad searches
    if (!searchTerm || searchTerm.trim().length < 2) {
      console.log(`${colors.red}❌ Please provide a search term with at least 2 characters${colors.reset}`);
      return [];
    }
    
    switch (searchType) {
      case 'name':
        selector.$or = [
          { firstName: { $regex: `(?i)${searchTerm}` } },
          { lastName: { $regex: `(?i)${searchTerm}` } }
        ];
        break;
        
      case 'email':
        selector.email = { $regex: `(?i)${searchTerm}` };
        break;
        
      case 'mobile':
        selector.mobile = { $regex: `(?i)${searchTerm}` };
        break;
        
      case 'city':
        selector.city = { $regex: `(?i)${searchTerm}` };
        break;
        
      case 'status':
        selector.status = searchTerm.toLowerCase();
        break;
        
      case 'role':
        selector.role = searchTerm.toLowerCase();
        break;
        
      default:
        console.log(`${colors.red}❌ Invalid search type${colors.reset}`);
        return [];
    }
    
    console.log(`\n${colors.cyan}🔍 Searching for: "${searchTerm}" (${searchType})...${colors.reset}`);
    
    const result = await db.find({
      selector: selector,
      limit: limit
    });
    
    if (result.docs.length === limit) {
      console.log(`${colors.yellow}⚠️  Results limited to ${limit}. Use a more specific search term to narrow results.${colors.reset}`);
    }
    
    return result.docs;
  } catch (error) {
    console.error(`${colors.red}❌ Error searching:${colors.reset}`, error.message);
    return [];
  }
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function interactiveSearch() {
  console.log(`${colors.bright}${colors.green}`);
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     🔍 INTERACTIVE MEMBER SEARCH TOOL 🔍          ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  console.log(`${colors.yellow}Search Types:${colors.reset}`);
  console.log(`  ${colors.cyan}1.${colors.reset} name    - Search by first or last name`);
  console.log(`  ${colors.cyan}2.${colors.reset} email   - Search by email address`);
  console.log(`  ${colors.cyan}3.${colors.reset} mobile  - Search by mobile number`);
  console.log(`  ${colors.cyan}4.${colors.reset} city    - Search by city`);
  console.log(`  ${colors.cyan}5.${colors.reset} status  - Search by status (active, pending, inactive)`);
  console.log(`  ${colors.cyan}6.${colors.reset} role    - Search by role (member, admin, super_admin)`);
  console.log(`  ${colors.cyan}7.${colors.reset} quit    - Exit the program\n`);
  console.log(`${colors.yellow}💡 Tip: Provide specific search terms (min 2 characters) to get targeted results${colors.reset}\n`);
  
  while (true) {
    const searchType = await question(`${colors.bright}${colors.green}Search type (or 'quit' to exit): ${colors.reset}`);
    
    if (searchType.toLowerCase() === 'quit' || searchType.toLowerCase() === 'exit' || searchType.toLowerCase() === 'q') {
      console.log(`\n${colors.yellow}👋 Goodbye!${colors.reset}\n`);
      rl.close();
      process.exit(0);
    }
    
    const validTypes = ['name', 'email', 'mobile', 'city', 'status', 'role'];
    if (!validTypes.includes(searchType.toLowerCase())) {
      console.log(`${colors.red}❌ Invalid search type. Please choose from: ${validTypes.join(', ')}${colors.reset}\n`);
      continue;
    }
    
    const searchTerm = await question(`${colors.bright}${colors.green}Search term: ${colors.reset}`);
    
    if (!searchTerm.trim()) {
      console.log(`${colors.red}❌ Search term cannot be empty${colors.reset}\n`);
      continue;
    }
    
    const members = await searchMembers(searchTerm.trim(), searchType.toLowerCase(), 50);
    
    if (members.length === 0) {
      console.log(`${colors.yellow}⚠️  No members found matching "${searchTerm}"${colors.reset}\n`);
    } else {
      displaySummary(members);
      
      // Show quick list first (limited to 20)
      const displayLimit = Math.min(members.length, 20);
      console.log(`\n${colors.cyan}Quick List (showing ${displayLimit} of ${members.length}):${colors.reset}`);
      members.slice(0, displayLimit).forEach((member, index) => {
        const statusIcon = member.status === 'active' ? '✓' : 
                          member.status === 'pending' ? '⏳' : '✗';
        console.log(`  ${colors.bright}${index + 1}.${colors.reset} ${statusIcon} ${member.firstName} ${member.lastName} - ${member.email}`);
      });
      
      if (members.length > displayLimit) {
        console.log(`${colors.yellow}  ... and ${members.length - displayLimit} more${colors.reset}`);
      }
      
      const showDetails = await question(`\n${colors.bright}${colors.green}Show detailed info for a specific member? (Enter number or 'n' to skip): ${colors.reset}`);
      
      if (showDetails && showDetails.toLowerCase() !== 'n' && showDetails.toLowerCase() !== 'no') {
        const memberIndex = parseInt(showDetails) - 1;
        if (memberIndex >= 0 && memberIndex < members.length) {
          displayMember(members[memberIndex], memberIndex + 1);
        } else {
          console.log(`${colors.red}❌ Invalid member number${colors.reset}`);
        }
      }
    }
    
    console.log('\n');
    const continueSearch = await question(`${colors.bright}${colors.green}Search again? (y/n): ${colors.reset}`);
    
    if (continueSearch.toLowerCase() !== 'y' && continueSearch.toLowerCase() !== 'yes') {
      console.log(`\n${colors.yellow}👋 Goodbye!${colors.reset}\n`);
      rl.close();
      process.exit(0);
    }
    
    console.log('\n');
  }
}

// Start the interactive search
interactiveSearch().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  rl.close();
  process.exit(1);
});
