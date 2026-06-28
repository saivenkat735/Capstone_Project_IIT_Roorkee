import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { FaWallet, FaPlus } from 'react-icons/fa';
import './BalanceCard.css';

const BalanceCards = () => {
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newAccount, setNewAccount] = useState({
        accountName: '',
        cardType: 'SAVINGS',
        balance: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);
            const response = await axios.get(
                `${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/person/${decodedToken.personId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const decodedToken = jwtDecode(token);
            
            await axios.post(
                '${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts',
                {
                    ...newAccount,
                    id: decodedToken.personId,
                    userName: decodedToken.username,
                    balance: parseFloat(newAccount.balance)
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            toast.success('Account added successfully');
            setShowModal(false);
            fetchAccounts();
            resetForm();
        } catch (error) {
            console.error('Error adding account:', error);
            toast.error('Failed to add account');
        }
    };

    const resetForm = () => {
        setNewAccount({
            accountName: '',
            cardType: 'SAVINGS',
            balance: ''
        });
    };

    const getTotalBalance = () => {
        return accounts.reduce((sum, account) => sum + account.balance, 0);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading accounts...</p>
            </div>
        );
    }

    return (
        <div className="balance-cards-container">
            <div className="balance-header">
                <div className="total-balance">
                    <h3>Total Balance</h3>
                    <p>₹{getTotalBalance().toLocaleString()}</p>
                </div>
                <button 
                    className="add-account-btn"
                    onClick={() => setShowModal(true)}
                >
                    <FaPlus /> Add Account
                </button>
            </div>

            <div className="accounts-grid">
                {accounts.map(account => (
                    <div key={account.accountId} className="account-card">
                        <div className="account-icon">
                            <FaWallet />
                        </div>
                        <div className="account-info">
                            <h3>{account.accountName}</h3>
                            <span className="account-type">{account.cardType}</span>
                            <p className="account-balance">
                                ₹{account.balance.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Add New Account</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Account Name</label>
                                <input
                                    type="text"
                                    value={newAccount.accountName}
                                    onChange={(e) => setNewAccount({
                                        ...newAccount,
                                        accountName: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Account Type</label>
                                <select
                                    value={newAccount.cardType}
                                    onChange={(e) => setNewAccount({
                                        ...newAccount,
                                        cardType: e.target.value
                                    })}
                                    required
                                >
                                    <option value="SAVINGS">Savings</option>
                                    <option value="CHECKING">Checking</option>
                                    <option value="CREDIT">Credit Card</option>
                                    <option value="INVESTMENT">Investment</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Initial Balance</label>
                                <input
                                    type="number"
                                    value={newAccount.balance}
                                    onChange={(e) => setNewAccount({
                                        ...newAccount,
                                        balance: e.target.value
                                    })}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="submit-btn">
                                    Add Account
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceCards;