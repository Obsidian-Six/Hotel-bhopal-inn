import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (token && storedUser) {
                setUser(JSON.parse(storedUser));
                // Optional: Validate token with backend if you have a /me route
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${config.API_URL}/api/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            const userData = {
                _id: res.data._id,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
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
                email: res.data.email
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
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
