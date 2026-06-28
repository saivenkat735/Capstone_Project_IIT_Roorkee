import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './RecentTransaction.css';

const RecentTransaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // Sort transactions by date (most recent first)
            const sortedTransactions = response.data.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            // Get only the 5 most recent transactions
            const recentTransactions = sortedTransactions.slice(0, 5);
            
            setTransactions(recentTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to load recent transactions');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading transactions...</p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="no-transactions">
                <p>No recent transactions</p>
            </div>
        );
    }

    return (
        <div className="recent-transactions">
            {transactions.map(transaction => (
                <div 
                    key={transaction.transactionId} 
                    className="transaction-item"
                >
                    <div className="transaction-icon">
                        {transaction.transactionType === 'CREDIT' ? (
                            <FaArrowUp className="credit-icon" />
                        ) : (
                            <FaArrowDown className="debit-icon" />
                        )}
                    </div>
                    
                    <div className="transaction-info">
                        <div className="transaction-header">
                            <h3>{transaction.description}</h3>
                            <span className={`transaction-amount ${
                                transaction.transactionType === 'CREDIT' ? 'credit' : 'debit'
                            }`}>
                                {transaction.transactionType === 'CREDIT' ? '+' : '-'}
                                ₹{transaction.amount.toLocaleString()}
                            </span>
                        </div>
                        
                        <div className="transaction-details">
                            <span className="transaction-category">
                                {transaction.categoryName}
                            </span>
                            <span className="transaction-date">
                                {new Date(transaction.date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentTransaction;
