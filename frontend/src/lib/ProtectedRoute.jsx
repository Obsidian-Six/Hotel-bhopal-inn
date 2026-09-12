import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
    const { user: authUser, loading, isSuperAdmin: authIsSuperAdmin } = useAuth();

    // Check localStorage as well to avoid asynchronous state lag on immediate route transitions
    let localUser = null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) localUser = JSON.parse(stored);
    } catch (e) {}

    const currentUser = authUser || localUser;
    const isSuper = (currentUser?.role === 'superadmin') || (currentUser?.isSuperAdmin === true) || authIsSuperAdmin;
    const isAdmin = (currentUser?.role === 'admin') || isSuper;

    if (loading && !currentUser) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-[500]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#8B735B]/20 border-t-[#8B735B] rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B735B]">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (superAdminOnly) {
        if (!currentUser || !isSuper) {
            return <Navigate to="/super-admin-login" replace />;
        }
        return children;
    }

    if (adminOnly) {
        if (!currentUser || !isAdmin) {
            return <Navigate to="/admin-login" replace />;
        }
        return children;
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
