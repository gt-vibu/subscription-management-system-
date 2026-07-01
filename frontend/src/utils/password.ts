export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
}

export const getPasswordChecks = (password: string): PasswordChecks => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  digit: /\d/.test(password),
  special: /[@$!%*?&]/.test(password),
});

export const isPasswordStrong = (password: string): boolean => {
  const checks = getPasswordChecks(password);
  return Object.values(checks).every(Boolean);
};

export const generateStrongPassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specials = '@$!%*?&';
  const all = uppercase + lowercase + digits + specials;

  let pass = '';
  pass += uppercase[Math.floor(Math.random() * uppercase.length)];
  pass += lowercase[Math.floor(Math.random() * lowercase.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += specials[Math.floor(Math.random() * specials.length)];

  for (let i = 4; i < length; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass.split('').sort(() => 0.5 - Math.random()).join('');
};
