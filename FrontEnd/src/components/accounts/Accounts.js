import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from '../Dashboard/Sidebar';
import './Accounts.css';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); 
    const [formData, setFormData] = useState({
        accountName: '',
        cardType: '',
        balance: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const personId = localStorage.getItem('personId');
            const response = await axios.get(`${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/person/${personId}`);
            setAccounts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
            setLoading(false);
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        try {
            const personId = localStorage.getItem('personId');
            await axios.post(`${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts`, {
                ...formData,
                id: personId,
                userName: personId,
                balance: parseFloat(formData.balance)
            });
            
            toast.success('Account created successfully');
            setShowModal(false);
            resetForm();
            fetchAccounts();
        } catch (error) {
            console.error('Error creating account:', error);
            toast.error('Failed to create account');
        }
    };

    const handleEditAccount = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/${selectedAccount.accountId}/balance?amount=${parseFloat(formData.balance)}&operation=EDIT`, {
                amount: parseFloat(formData.balance)
            });
            
            if (response.status === 200) {
                toast.success('Account updated successfully');
                setShowModal(false);
                resetForm();
                fetchAccounts();
            }
        } catch (error) {
            console.error('Error updating account:', error);
            toast.error('Failed to update account');
        }
    };

    const handleReactivate = async (accountId) => {
        try {
            const response = await axios.put(`${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/${accountId}/reactivate`);
            if (response.status === 200) {
                toast.success('Account reactivated successfully');
                fetchAccounts();
            }
        } catch (error) {
            console.error('Error reactivating account:', error);
            toast.error('Failed to reactivate account');
        }
    };

    const handleDelete = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            try {
                const response = await axios.delete(`${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/${accountId}`);
                if (response.status === 200) {
                    toast.success('Account deactivated successfully');
                    fetchAccounts();
                }
            } catch (error) {
                console.error('Error deactivating account:', error);
                toast.error('Failed to deactivate account');
            }
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (account) => {
        console.log(account)
        setModalMode('edit');
        setSelectedAccount(account);
        setFormData({
            accountName: account.accountName,
            cardType: account.cardType,
            balance: account.balance.toString()
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            accountName: '',
            cardType: '',
            balance: ''
        });
        setSelectedAccount(null);
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    const filteredAccounts = accounts.filter(account => 
        activeTab === 'active' ? account.active : !account.active
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-content">
                <div className="accounts-container">
                    <div className="accounts-header">
                        <h2>My Accounts</h2>
                        <button className="add-account-btn" onClick={openCreateModal}>
                            Add New Account
                        </button>
                    </div>

                    <div className="accounts-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Active Accounts
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'inactive' ? 'active' : ''}`}
                            onClick={() => setActiveTab('inactive')}
                        >
                            Deactivated Accounts
                        </button>
                    </div>

                    <div className="accounts-grid">
                        {filteredAccounts.map(account => (
                            <div key={account.accountId} className={`account-card ${!account.active ? 'inactive' : ''}`}>
                                <div className="account-header">
                                    <span className="account-name">{account.accountName}</span>
                                    <span className="account-type">{account.cardType}</span>
                                </div>
                                <div className="account-balance">
                                    ₹{parseFloat(account.balance).toLocaleString()}
                                </div>
                                <div className="account-actions">
                                    {account.active ? (
                                        <>
                                            <button onClick={() => openEditModal(account)}>Edit</button>
                                            <button onClick={() => handleDelete(account.accountId)}>Delete</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleReactivate(account.accountId)}>Reactivate</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {showModal && (
                        <div className="modal">
                            <div className="modal-content" style={{ height: 'auto', maxHeight: '90vh', padding: '20px' }}>
                                <h3>{modalMode === 'create' ? 'Create New Account' : 'Edit Account'}</h3>
                                <form onSubmit={modalMode === 'create' ? handleCreateAccount : handleEditAccount} style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                                    <div className="form-group">
                                        <label>Account Name</label>
                                        <input
                                            type="text"
                                            value={formData.accountName}
                                            onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                                            required
                                            disabled={modalMode === 'edit'}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Account Type</label>
                                        <select
                                            value={formData.cardType.toUpperCase()}
                                            onChange={(e) => setFormData({...formData, cardType: e.target.value})}
                                            required
                                            disabled={modalMode === 'edit'}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="SAVINGS">Savings</option>
                                            <option value="SALARY">Salary</option>
                                            <option value="CURRENT">Current</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Balance</label>
                                        <input
                                            type="number"
                                            value={formData.balance}
                                            onChange={(e) => setFormData({...formData, balance: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                        <button type="submit" className="confirm-btn">
                                            {modalMode === 'create' ? 'Create Account' : 'Update Account'}
                                        </button>
                                        <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Accounts;
