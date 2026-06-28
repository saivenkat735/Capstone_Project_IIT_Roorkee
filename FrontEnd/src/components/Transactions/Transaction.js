import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from '../Dashboard/Sidebar';
import './Transaction.css';

const Transaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [insufficientFunds, setInsufficientFunds] = useState(false);
    const [transactionFormData, setTransactionFormData] = useState({
        accountId: '',
        amount: '',
        type: 'CREDIT',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        categoryName: ''
    });

    useEffect(() => {
        Promise.all([fetchTransactions(), fetchAccounts(), fetchCategories()]);
    }, []);

    useEffect(() => {
        // Check for insufficient funds whenever amount, account, or type changes
        if (transactionFormData.accountId && transactionFormData.amount && transactionFormData.type === 'DEBIT') {
            const selectedAccount = accounts.find(acc => acc.accountId === Number(transactionFormData.accountId));
            if (selectedAccount && Number(transactionFormData.amount) > selectedAccount.balance) {
                setInsufficientFunds(true);
            } else {
                setInsufficientFunds(false);
            }
        } else {
            setInsufficientFunds(false);
        }
    }, [transactionFormData.accountId, transactionFormData.amount, transactionFormData.type, accounts]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_CATEGORY_URL}/category`);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const fetchAccounts = async () => {
        try {
            const personId = localStorage.getItem('personId');
            const response = await axios.get(`${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/person/${personId}`);
            const activeAccounts = response.data.filter(account => account.active);
            setAccounts(activeAccounts);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
        }
    };

    const fetchTransactions = async () => {
        try {
            const personId = localStorage.getItem('personId');
            const response = await axios.get(`${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory/person/${personId}`);
            console.log(response.data);
            const sortedTransactions = response.data.sort((a, b) => b.transactionId - a.transactionId);
            setTransactions(sortedTransactions);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to load transactions');
            setLoading(false);
        }
    };

    const updateCategoryAmountSpent = async (categoryId, amount, type) => {
        try {
            const category = categories.find(cat => cat.categoryId === categoryId);
            if (!category) return;

            let newAmountSpent = category.amountSpent;
            if (type === 'DEBIT') {
                newAmountSpent += parseFloat(amount);
            } else {
                newAmountSpent -= parseFloat(amount);
            }

            const updatedCategory = {
                ...category,
                amountSpent: newAmountSpent
            };

            await axios.put(`${process.env.REACT_APP_CATEGORY_URL}/category/${categoryId}`, updatedCategory);
            await fetchCategories();
        } catch (error) {
            console.error('Error updating category amount spent:', error);
            toast.error('Failed to update category amount spent');
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            const personId = localStorage.getItem('personId');
            
            if (!transactionFormData.accountId || !transactionFormData.amount || !transactionFormData.type) {
                toast.error('Please fill in all required fields');
                return;
            }

            const selectedAccountId = Number(transactionFormData.accountId);
            
            const accountExists = accounts.find(acc => acc.accountId === selectedAccountId);
            if (!accountExists) {
                toast.error('Invalid Account ID. Please select a valid account.');
                return;
            }

            // Check for insufficient funds before proceeding
            if (insufficientFunds) {
                toast.error('Insufficient funds in the selected account');
                return;
            }

            let categoryId = transactionFormData.categoryId;
            const amount = parseFloat(transactionFormData.amount);

            if (!categoryId && transactionFormData.categoryName) {
                try {
                    const newCategory = {
                        categoryName: transactionFormData.categoryName,
                        type: transactionFormData.type,
                        personId: personId,
                        isFloatingExpense: false,
                        amountSpent: transactionFormData.type === 'DEBIT' ? amount : 0
                    };
                    const categoryResponse = await axios.post(`${process.env.REACT_APP_CATEGORY_URL}/category`, newCategory);
                    categoryId = categoryResponse.data.categoryId;
                } catch (error) {
                    console.error('Error creating new category:', error);
                    toast.error('Failed to create new category');
                    return;
                }
            } else if (categoryId && transactionFormData.type === 'DEBIT') {
                const category = categories.find(cat => cat.categoryId === parseInt(categoryId));
                if (category) {
                    const updatedCategory = {
                        ...category,
                        amountSpent: Number(category.amountSpent) + amount
                    };
                    try {
                        await axios.put(`${process.env.REACT_APP_CATEGORY_URL}/category/${categoryId}`, updatedCategory);
                    } catch (error) {
                        console.error('Error updating category amount:', error);
                        toast.error('Failed to update category amount');
                        return;
                    }
                }
            }

            const transactionData = {
                accountId: selectedAccountId,
                amount: amount,
                transactionType: transactionFormData.type,
                date: transactionFormData.date,
                personId: personId,
                categoryId: categoryId
            };

            const response = await axios.post(`${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory/transaction`, transactionData);

            if (response.status === 200) {
                setTransactions(prevTransactions => [response.data, ...prevTransactions]);
                toast.success('Transaction added successfully');
                setShowTransactionModal(false);
                resetTransactionForm();
                
                await Promise.all([
                    fetchAccounts(),
                    fetchCategories(),
                    fetchTransactions()
                ]);
            }
        } catch (error) {
            console.error('Error processing transaction:', error);
            toast.error(error.response?.data || 'Failed to process transaction');
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                const transaction = transactions.find(t => t.transactionId === transactionId);
                
                if (transaction && transaction.categoryId && transaction.transactionType === 'DEBIT') {
                    const category = categories.find(cat => cat.categoryId === transaction.categoryId);
                    if (category) {
                        const updatedCategory = {
                            ...category,
                            amountSpent: Math.max(0, category.amountSpent - transaction.amount)
                        };
                        await axios.put(`${process.env.REACT_APP_CATEGORY_URL}/category/${transaction.categoryId}`, updatedCategory);
                    }
                }

                const response = await axios.delete(`${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory/transaction/${transactionId}`);
                if (response.status === 200) {
                    toast.success(response.data || 'Transaction deleted successfully');
                    await Promise.all([fetchTransactions(), fetchAccounts(), fetchCategories()]);
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                toast.error(error.response?.data || 'Failed to delete transaction');
            }
        }
    };

    const resetTransactionForm = () => {
        setTransactionFormData({
            accountId: '',
            amount: '',
            type: 'CREDIT',
            date: new Date().toISOString().split('T')[0],
            categoryId: '',
            categoryName: ''
        });
        setInsufficientFunds(false);
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

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-content">
                <div className="transactions-container">
                    <div className="transactions-header">
                        <h2>Transaction History</h2>
                        <button className="add-transaction-btn" onClick={() => setShowTransactionModal(true)}>
                            Add New Transaction
                        </button>
                    </div>

                    <div className="transactions-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Account</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Category</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction,index) => (
                                    <tr key={index}>
                                        <td>{transaction.transactionId}</td>
                                        <td>{accounts.find(acc => acc.accountId === transaction.accountId)?.accountName || 'N/A'}</td>
                                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                        <td>{transaction.transactionType}</td>
                                        <td className={`transaction-amount ${transaction.transactionType === 'CREDIT' ? 'credit' : 'debit'}`}>
                                            {transaction.transactionType === 'CREDIT' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                                        </td>
                                        <td>{categories.find(cat => cat.categoryId === transaction.categoryId)?.categoryName || 'N/A'}</td>
                                        <td>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteTransaction(transaction.transactionId)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {showTransactionModal && (
                        <div className="modal">
                            <div className="modal-content" style={{ width: '600px', height: 'auto', padding: '20px' }}>
                                <h3>Add New Transaction</h3>
                                {insufficientFunds && (
                                    <div style={{
                                        color: '#dc2626',
                                        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        marginBottom: '20px',
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        border: '2px solid #fca5a5',
                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
                                        transform: 'translateY(0)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.15)';
                                    }}>
                                        <span style={{fontSize: '1.5rem'}}>⚠️</span>
                                        Insufficient Funds
                                    </div>
                                )}
                                <form onSubmit={handleTransaction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label>Account</label>
                                        <select
                                            value={transactionFormData.accountId}
                                            onChange={(e) => setTransactionFormData({
                                                ...transactionFormData,
                                                accountId: e.target.value
                                            })}
                                            required
                                        >
                                            <option value="">Select Account</option>
                                            {accounts.map(account => (
                                                <option key={account.accountId} value={account.accountId}>
                                                    {account.accountName} (₹{account.balance})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <input
                                            list="categories"
                                            type="text"
                                            value={transactionFormData.categoryName}
                                            onChange={(e) => {
                                                const selectedCategory = categories.find(cat => cat.categoryName === e.target.value);
                                                setTransactionFormData({
                                                    ...transactionFormData,
                                                    categoryName: e.target.value,
                                                    categoryId: selectedCategory ? selectedCategory.categoryId : ''
                                                });
                                            }}
                                            placeholder="Select or type new category"
                                            required
                                        />
                                        <datalist id="categories">
                                            {categories.map(category => (
                                                <option key={category.categoryId} value={category.categoryName}>
                                                    {category.categoryName} ({category.type})
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <input
                                            type="number"
                                            value={transactionFormData.amount}
                                            onChange={(e) => setTransactionFormData({
                                                ...transactionFormData,
                                                amount: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select
                                            value={transactionFormData.type}
                                            onChange={(e) => setTransactionFormData({
                                                ...transactionFormData,
                                                type: e.target.value
                                            })}
                                        >
                                            <option value="CREDIT">Credit</option>
                                            <option value="DEBIT">Debit</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            value={transactionFormData.date}
                                            onChange={(e) => setTransactionFormData({
                                                ...transactionFormData,
                                                date: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="modal-actions" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                        <button type="submit">Submit</button>
                                        <button type="button" onClick={() => {
                                            resetTransactionForm();
                                            setShowTransactionModal(false);
                                        }}>Cancel</button>
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

export default Transaction;
