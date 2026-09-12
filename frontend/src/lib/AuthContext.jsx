import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (token && storedUser) {
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${config.API_URL}/api/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            const userData = {
                _id: res.data._id,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email,
                role: res.data.role,
                isSuperAdmin: res.data.role === 'superadmin' || res.data.isSuperAdmin === true
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const superAdminLogin = async (email, password) => {
        try {
            const res = await axios.post(`${config.API_URL}/api/auth/super-admin-login`, { email, password });
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            const userData = {
                _id: res.data._id,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email,
                role: res.data.role,
                isSuperAdmin: true
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            console.error('Super Admin Dedicated Login Error:', error);
            // Fallback: try standard /api/auth/login if dedicated endpoint was not found or unreachable
            try {
                const fallbackRes = await axios.post(`${config.API_URL}/api/auth/login`, { email, password });
                if (fallbackRes.data.role === 'superadmin' || fallbackRes.data.isSuperAdmin) {
                    localStorage.setItem('token', fallbackRes.data.token);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${fallbackRes.data.token}`;
                    const userData = {
                        _id: fallbackRes.data._id,
                        firstName: fallbackRes.data.firstName,
                        lastName: fallbackRes.data.lastName,
                        email: fallbackRes.data.email,
                        role: fallbackRes.data.role,
                        isSuperAdmin: true
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                    return { success: true, user: userData };
                }
            } catch (fbErr) {
                console.error('Standard Login Fallback Error:', fbErr);
            }

            const errorMsg = error.response?.data?.message || 
                (error.message && error.message.toLowerCase().includes('network') 
                    ? `Cannot reach backend at ${config.API_URL}. Ensure backend server is active.` 
                    : error.message || 'Super Admin authentication failed');
            return { success: false, message: errorMsg };
        }
    };

    const googleLogin = async (googleToken) => {
        try {
            const res = await axios.post(`${config.API_URL}/api/auth/google`, { token: googleToken });
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            const userData = {
                _id: res.data._id,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email,
                role: res.data.role
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error('Google Login Error:', error);
            return { success: false, message: error.response?.data?.message || 'Google login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post(`${config.API_URL}/api/auth/register`, userData);
            localStorage.setItem('token', res.data.token);
            const newUserData = {
                _id: res.data._id,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email,
                role: res.data.role
            };
            localStorage.setItem('user', JSON.stringify(newUserData));
            setUser(newUserData);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const isSuperAdmin = user?.role === 'superadmin' || user?.isSuperAdmin === true;
    const isAdmin = user?.role === 'admin' || isSuperAdmin;

    return (
        <AuthContext.Provider value={{ user, login, superAdminLogin, googleLogin, register, logout, loading, isSuperAdmin, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};
