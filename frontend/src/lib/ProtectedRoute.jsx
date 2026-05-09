import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-[500]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#8B735B]/20 border-t-[#8B735B] rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B735B]">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={adminOnly ? "/admin-login" : "/"} replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/admin-login" replace />;
    }

    return children;
};

export default ProtectedRoute;
