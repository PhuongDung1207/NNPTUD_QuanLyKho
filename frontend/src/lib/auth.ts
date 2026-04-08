import { User } from '@/types/auth';

type UserReference = string | { _id?: string; id?: string } | null | undefined;

export function getUserRoleName(user?: User | null) {
  if (!user?.role) {
    return '';
  }

  if (typeof user.role === 'object' && user.role !== null) {
    return String(user.role.code || user.role.name || '').toLowerCase();
  }

  return String(user.role || '').toLowerCase();
}

export function isAdminUser(user?: User | null) {
  return getUserRoleName(user) === 'admin';
}

export function canCreateOrderDocuments(user?: User | null) {
  const roleName = getUserRoleName(user);
  return roleName === 'admin' || roleName === 'user';
}

export function getUserId(user?: User | null) {
  return String(user?._id || user?.id || '');
}

export function isCurrentUser(user?: User | null, target?: UserReference) {
  const currentUserId = getUserId(user);

  if (!currentUserId || !target) {
    return false;
  }

  if (typeof target === 'object') {
    return String(target._id || target.id || '') === currentUserId;
  }

  return String(target) === currentUserId;
}
