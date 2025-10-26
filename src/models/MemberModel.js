// Member model with validation helpers

export const createEmptyMember = () => ({
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  spouse: {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
  },
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  children: [],
});

export const createEmptyChild = () => ({
  id: Date.now().toString(),
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
});

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateMobile = (mobile) => {
  const mobileRegex = /^[\d\s\-\+\(\)]+$/;
  return mobile.length >= 10 && mobileRegex.test(mobile);
};

export const validateMember = (member) => {
  const errors = {};

  // Validate member
  if (!member.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  if (!member.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  if (!member.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(member.email)) {
    errors.email = 'Invalid email format';
  }
  if (!member.mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  } else if (!validateMobile(member.mobile)) {
    errors.mobile = 'Invalid mobile number';
  }

  // Validate spouse (if any field is filled)
  const spouseHasData = member.spouse && (
    member.spouse.firstName || 
    member.spouse.lastName || 
    member.spouse.email || 
    member.spouse.mobile
  );

  if (spouseHasData) {
    errors.spouse = {};
    if (!member.spouse.firstName?.trim()) {
      errors.spouse.firstName = 'Spouse first name is required';
    }
    if (!member.spouse.lastName?.trim()) {
      errors.spouse.lastName = 'Spouse last name is required';
    }
    if (member.spouse.email && !validateEmail(member.spouse.email)) {
      errors.spouse.email = 'Invalid email format';
    }
    if (member.spouse.mobile && !validateMobile(member.spouse.mobile)) {
      errors.spouse.mobile = 'Invalid mobile number';
    }
    
    if (Object.keys(errors.spouse).length === 0) {
      delete errors.spouse;
    }
  }

  // Validate address
  if (member.address) {
    errors.address = {};
    if (!member.address.street?.trim()) {
      errors.address.street = 'Street is required';
    }
    if (!member.address.city?.trim()) {
      errors.address.city = 'City is required';
    }
    if (!member.address.state?.trim()) {
      errors.address.state = 'State is required';
    }
    if (!member.address.zipCode?.trim()) {
      errors.address.zipCode = 'Zip code is required';
    }
    
    if (Object.keys(errors.address).length === 0) {
      delete errors.address;
    }
  }

  // Validate children
  if (member.children && member.children.length > 0) {
    errors.children = [];
    member.children.forEach((child, index) => {
      const childErrors = {};
      if (!child.firstName?.trim()) {
        childErrors.firstName = 'First name is required';
      }
      if (!child.lastName?.trim()) {
        childErrors.lastName = 'Last name is required';
      }
      if (Object.keys(childErrors).length > 0) {
        errors.children[index] = childErrors;
      }
    });
    
    if (errors.children.every(e => !e)) {
      delete errors.children;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
