import React from 'react';
import { useAuth } from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Route dynamically based on database-driven role
  if (user?.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Fallback to client dashboard for standard users
  return <UserDashboard />;
};

export default Dashboard;
