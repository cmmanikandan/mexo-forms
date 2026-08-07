export interface MexoUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  recoveryEmail?: string;
  dob?: string;
  gender?: string;
  role: 'system_admin' | 'admin' | 'user';
  status: 'active' | 'suspended';
  storageUsedBytes?: number;
  storageLimitBytes?: number;
  createdAt?: string;
  lastActiveAt?: string;
  twoFactorEnabled?: boolean;
  requiresPasswordChange?: boolean;
  createdByAdmin?: boolean;
}
