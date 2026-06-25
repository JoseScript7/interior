import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

interface RoleGateProps {
  allowedRoles: Array<'admin' | 'user'>;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
