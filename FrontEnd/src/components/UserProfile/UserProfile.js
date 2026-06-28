import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { FaUser, FaWallet, FaExchangeAlt, FaClock } from 'react-icons/fa';
import './UserProfile.css';

const UserProfile = () => {
    const [userInfo, setUserInfo] = useState({
        username: '',
        email: '',
        personId: '',
        joinDate: ''
    });
    const [accountStats, setAccountStats] = useState({
        totalAccounts: 0,
        totalTransactions: 0,
        lastLogin: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editForm, setEditForm] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                const decodedToken = jwtDecode(token);
                
                // Fetch user details
                const userResponse = await axios.get(
                    `${process.env.REACT_APP_SECURE_URL}/person/${decodedToken.personId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                // Fetch account statistics
                const accountsResponse = await axios.get(
                    `${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/person/${decodedToken.personId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                // Fetch transaction statistics
                const transactionsResponse = await axios.get(
                    '${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory',
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                setUserInfo({
                    username: decodedToken.username,
                    email: userResponse.data.email || '',
                    personId: decodedToken.personId,
                    joinDate: userResponse.data.createdAt
                });

                setAccountStats({
                    totalAccounts: accountsResponse.data.length,
                    totalTransactions: transactionsResponse.data.length,
                    lastLogin: userResponse.data.lastLogin
                });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditForm({
            ...editForm,
            email: userInfo.email
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.put(
                `${process.env.REACT_APP_SECURE_URL}/person/update/${userInfo.personId}`,
                {
                    email: editForm.email,
                    currentPassword: editForm.currentPassword,
                    newPassword: editForm.newPassword || undefined
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.status === 200) {
                setUserInfo({
                    ...userInfo,
                    email: editForm.email
                });
                setIsEditing(false);
                resetForm();
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating profile');
        }
    };

    const resetForm = () => {
        setEditForm({
            email: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="user-profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    <FaUser />
                </div>
                <div className="profile-title">
                    <h2>{userInfo.username}</h2>
                    <p>Member since {new Date(userInfo.joinDate).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaWallet />
                    </div>
                    <div className="stat-info">
                        <h3>Total Accounts</h3>
                        <p>{accountStats.totalAccounts}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaExchangeAlt />
                    </div>
                    <div className="stat-info">
                        <h3>Total Transactions</h3>
                        <p>{accountStats.totalTransactions}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaClock />
                    </div>
                    <div className="stat-info">
                        <h3>Last Login</h3>
                        <p>{new Date(accountStats.lastLogin).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="profile-info">
                <div className="info-card">
                    <h3>Profile Information</h3>
                    {!isEditing ? (
                        <>
                            <div className="info-row">
                                <label>Username</label>
                                <span>{userInfo.username}</span>
                            </div>
                            <div className="info-row">
                                <label>Email</label>
                                <span>{userInfo.email}</span>
                            </div>
                            <button 
                                className="edit-button"
                                onClick={handleEdit}
                            >
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <form className="edit-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({
                                        ...editForm,
                                        email: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={editForm.currentPassword}
                                    onChange={(e) => setEditForm({
                                        ...editForm,
                                        currentPassword: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>New Password (optional)</label>
                                <input
                                    type="password"
                                    value={editForm.newPassword}
                                    onChange={(e) => setEditForm({
                                        ...editForm,
                                        newPassword: e.target.value
                                    })}
                                />
                            </div>

                            {editForm.newPassword && (
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={editForm.confirmPassword}
                                        onChange={(e) => setEditForm({
                                            ...editForm,
                                            confirmPassword: e.target.value
                                        })}
                                        required={!!editForm.newPassword}
                                    />
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="save-button">
                                    Save Changes
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
