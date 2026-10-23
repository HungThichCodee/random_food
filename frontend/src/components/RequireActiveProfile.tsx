import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';

export default function RequireActiveProfile({ children, privateRouteOnly = false }:
  { children: ReactNode; privateRouteOnly?: boolean }) {
  const location = useLocation();
  const profile = useUserStore((state) => state.profile);
  const needsProfile = !privateRouteOnly || Number.isInteger(location.state?.privateMatchId);
  if (!needsProfile) return children;

  const expiresAt = Date.parse(profile?.expiresAt ?? '');
  if (!profile || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return <Navigate to="/profile" replace />;
  }
  return children;
}
