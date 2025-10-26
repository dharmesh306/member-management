# Member Management System - Architecture & Flow

## 📐 Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     App.js (Root)                        │
│              Navigation Container                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ├── Check Authentication Status
                         │   (AsyncStorage)
                         │
                         ▼
          ┌──────────────┴──────────────┐
          │                              │
    Not Authenticated            Authenticated
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  LoginScreen     │          │  DashboardScreen │
│  • Username      │──Login──▶│  • Statistics    │
│  • Password      │          │  • Member List   │
│  • Demo Creds    │          │  • Add Button    │
└──────────────────┘          └──────────────────┘
                                       │
                         ┌─────────────┼─────────────┐
                         │                            │
                         ▼                            ▼
              ┌──────────────────┐        ┌──────────────────┐
              │ AddMemberScreen  │        │ EditMemberScreen │
              │ • New Entry      │        │ • Update Entry   │
              │ • All Forms      │        │ • All Forms      │
              │ • Validation     │        │ • Validation     │
              └──────────────────┘        └──────────────────┘
```

## 🔄 User Flow Diagram

### Admin User Flow
```
Login (admin/admin123)
    │
    ▼
Dashboard
    ├─→ View Statistics
    ├─→ View Member List
    │       ├─→ Tap Member Card
    │       │       ├─→ View Details
    │       │       ├─→ Edit Member ──┐
    │       │       └─→ Delete Member │
    │       │                         │
    ├─→ Add New Member ───────────────┤
    │                                 │
    └─→ Logout                        │
                                      │
                                      ▼
                          Form Sections:
                          1. Member Info
                          2. Spouse Info
                          3. Address
                          4. Membership
                          5. Kids (optional)
                                      │
                                      ▼
                              Save to AsyncStorage
                                      │
                                      ▼
                              Return to Dashboard
```

### Regular User Flow
```
Login (user/user123)
    │
    ▼
Dashboard
    ├─→ View Statistics
    ├─→ View Member List (Read-only)
    │       └─→ Tap Member Card
    │               └─→ View Details Only
    └─→ Logout
```

## 📦 Component Hierarchy

```
App.js
└── NavigationContainer
    └── Stack.Navigator
        ├── LoginScreen
        │
        ├── DashboardScreen
        │   ├── Header
        │   │   ├── Welcome Section
        │   │   ├── Stats Cards (4)
        │   │   └── Logout Button
        │   │
        │   └── MemberList Component
        │       ├── Member Cards (mapped)
        │       │   ├── Member Name & Spouse
        │       │   ├── Contact Info
        │       │   ├── Address
        │       │   ├── Badges (Lifetime/Kids)
        │       │   └── Tap to View Modal
        │       │
        │       └── Empty State (if no members)
        │
        ├── AddMemberScreen
        │   ├── Header (Back Button)
        │   ├── Scrollable Form
        │   │   ├── MemberForm (Member Info)
        │   │   ├── MemberForm (Spouse Info)
        │   │   ├── AddressForm
        │   │   ├── MembershipForm
        │   │   └── KidsForm (dynamic)
        │   │
        │   └── Action Buttons
        │       ├── Submit
        │       └── Cancel
        │
        └── EditMemberScreen
            ├── Header (Back Button)
            ├── Scrollable Form (Pre-filled)
            │   ├── MemberForm (Member Info)
            │   ├── MemberForm (Spouse Info)
            │   ├── AddressForm
            │   ├── MembershipForm
            │   └── KidsForm (dynamic)
            │
            └── Action Buttons
                ├── Update
                └── Cancel
```

## 🗂️ Data Flow

### Creating a New Member
```
User Input (Forms)
    │
    ▼
Form State (React Hooks)
    ├── memberData
    ├── spouseData
    ├── addressData
    ├── membershipData
    └── kidsData
    │
    ▼
Validation Layer
    ├── Check required fields
    ├── Validate formats
    └── Show errors if needed
    │
    ▼
Data Processing
    ├── Generate unique ID
    ├── Add timestamp
    └── Create member object
    │
    ▼
AsyncStorage
    ├── Load existing members
    ├── Append new member
    └── Save updated array
    │
    ▼
UI Update
    ├── Show success message
    └── Navigate to Dashboard
```

### Reading Members
```
Component Mount (Dashboard/List)
    │
    ▼
AsyncStorage.getItem('members')
    │
    ├── Found → Parse JSON
    │   │
    │   ▼
    │   Set State
    │   │
    │   ▼
    │   Render Member Cards
    │
    └── Not Found → Use Demo Data
        │
        ▼
        Save Demo Data
        │
        ▼
        Render Demo Members
```

### Authentication Flow
```
Login Form Submit
    │
    ▼
Credentials Check
    ├── admin/admin123 → Admin Role
    └── user/user123 → User Role
    │
    ▼
AsyncStorage.setItem()
    ├── userToken
    ├── userRole
    └── username
    │
    ▼
Navigation.replace('Dashboard')
    │
    ▼
Dashboard Loads
    │
    ▼
Check User Role
    │
    ├── Admin → Show all features
    └── User → Hide edit/delete buttons
```

## 🎨 UI Component Structure

### Reusable Components

**MemberForm.js**
- Used for both Member and Spouse
- Props: title, formData, setFormData
- Fields: firstName, lastName, fatherName, motherName, familyAtak, gaam, mobile, email

**AddressForm.js**
- Single purpose: Address collection
- Props: title, formData, setFormData
- Fields: street, city, state, zipCode, country

**MembershipForm.js**
- Toggle component for membership type
- Props: title, formData, setFormData
- Fields: lifetimeMembership (boolean)

**KidsForm.js**
- Dynamic form with add/remove
- Props: title, kidsData, setKidsData
- Fields per child: firstName, lastName, age, gender
- Features: Add/Remove buttons, multiple children

**MemberList.js**
- Display component with modal
- Props: members, onEdit, onDelete, onView, isAdmin, currentUserId
- Features: Card view, tap to expand, role-based actions

## 🔐 Security & Permissions

### Role-Based Access Control
```
┌─────────────────┬──────────────┬──────────────┐
│    Feature      │    Admin     │     User     │
├─────────────────┼──────────────┼──────────────┤
│ View Members    │      ✓       │      ✓       │
│ Add Members     │      ✓       │      ✗       │
│ Edit Members    │      ✓       │      ✗       │
│ Delete Members  │      ✓       │      ✗       │
│ View Statistics │      ✓       │      ✓       │
│ Logout          │      ✓       │      ✓       │
└─────────────────┴──────────────┴──────────────┘
```

## 💾 Data Storage

### AsyncStorage Keys
```
┌──────────────────┬─────────────────────────────────┐
│       Key        │           Value                 │
├──────────────────┼─────────────────────────────────┤
│ userToken        │ "demo-token-123"                │
│ userRole         │ "admin" or "user"               │
│ username         │ "admin" or "user"               │
│ members          │ JSON stringified array          │
│ currentUserId    │ ID of logged-in user's record   │
└──────────────────┴─────────────────────────────────┘
```

## 🎯 State Management

### Component States (Hooks)

**LoginScreen**
- username: string
- password: string
- isLoading: boolean

**DashboardScreen**
- members: array
- isAdmin: boolean
- username: string
- currentUserId: string
- refreshing: boolean
- stats: object (total, lifetime, regular, withKids)

**AddMemberScreen / EditMemberScreen**
- memberData: object
- spouseData: object
- addressData: object
- membershipData: object
- kidsData: array

**MemberList**
- selectedMember: object
- viewModalVisible: boolean

## 🚀 Future Architecture Considerations

### Backend Integration
```
Current: AsyncStorage (Local)
    │
    ▼
Future: REST API
    ├── Authentication: JWT tokens
    ├── Database: MongoDB/PostgreSQL
    ├── API Endpoints:
    │   ├── POST /auth/login
    │   ├── GET /members
    │   ├── POST /members
    │   ├── PUT /members/:id
    │   └── DELETE /members/:id
    └── State Management: Redux/Context API
```

### Scalability
- Add pagination for large datasets
- Implement search and filtering
- Add sorting options
- Optimize re-renders
- Add loading skeletons
- Implement infinite scroll

---

This architecture provides a solid foundation for a member management system with room for growth and enhancement.
