import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import BarGraph from '../BarGraph/barGraph';
import ExpenseBreakdown from './ExpenseBreakdown';
import RecentTransaction from './RecentTransaction';
import BillsList from './BillsList';
import './overview.css';

const Overview = () => {
    const [transactions, setTransactions] = useState([]);
    const [monthlyData, setMonthlyData] = useState({
        labels: [],
        income: [],
        expenses: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                '${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setTransactions(response.data);
            processMonthlyData(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const processMonthlyData = (transactions) => {
        const monthlyStats = {};
        const months = [];
        const incomeData = [];
        const expenseData = [];

        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            
            monthlyStats[monthKey] = {
                income: 0,
                expenses: 0,
                label: monthLabel
            };
            months.push(monthLabel);
        }

        // Process transactions
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            
            if (monthlyStats[monthKey]) {
                if (transaction.transactionType === 'CREDIT') {
                    monthlyStats[monthKey].income += transaction.amount;
                } else {
                    monthlyStats[monthKey].expenses += transaction.amount;
                }
            }
        });

        // Convert to arrays for chart
        Object.values(monthlyStats).forEach(stats => {
            incomeData.push(stats.income);
            expenseData.push(stats.expenses);
        });

        setMonthlyData({
            labels: months,
            income: incomeData,
            expenses: expenseData
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading overview...</p>
            </div>
        );
    }

    return (
        <div className="overview-container">
            <div className="overview-grid">
                <div className="overview-section">
                    <h2>Income vs Expenses</h2>
                    <div className="chart-container">
                        <BarGraph 
                            data={monthlyData}
                            title="Monthly Overview"
                        />
                    </div>
                </div>

                <div className="overview-section">
                    <h2>Expense Breakdown</h2>
                    <ExpenseBreakdown transactions={transactions} />
                </div>

                <div className="overview-section">
                    <h2>Recent Transactions</h2>
                    <RecentTransaction transactions={transactions} />
                </div>

                <div className="overview-section">
                    <h2>Upcoming Bills</h2>
                    <BillsList />
                </div>
            </div>
        </div>
    );
};

export default Overview;