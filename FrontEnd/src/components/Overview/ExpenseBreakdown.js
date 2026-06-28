import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './ExpenseBreakdown.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpenseBreakdown = () => {
    const [expenseData, setExpenseData] = useState({
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
        }]
    });
    const [loading, setLoading] = useState(true);

    const colors = [
        { bg: 'rgba(79, 70, 229, 0.6)', border: '#4f46e5' },
        { bg: 'rgba(16, 185, 129, 0.6)', border: '#10b981' },
        { bg: 'rgba(245, 158, 11, 0.6)', border: '#f59e0b' },
        { bg: 'rgba(239, 68, 68, 0.6)', border: '#ef4444' },
        { bg: 'rgba(139, 92, 246, 0.6)', border: '#8b5cf6' },
        { bg: 'rgba(236, 72, 153, 0.6)', border: '#ec4899' }
    ];

    useEffect(() => {
        fetchExpenseData();
    }, []);

    const fetchExpenseData = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                '${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // Process transactions to get category-wise expenses
            const expenses = response.data
                .filter(t => t.transactionType === 'DEBIT')
                .reduce((acc, curr) => {
                    const category = curr.categoryName;
                    acc[category] = (acc[category] || 0) + curr.amount;
                    return acc;
                }, {});

            // Sort categories by expense amount
            const sortedCategories = Object.entries(expenses)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6); // Show top 6 categories

            setExpenseData({
                labels: sortedCategories.map(([category]) => category),
                datasets: [{
                    data: sortedCategories.map(([,amount]) => amount),
                    backgroundColor: colors.map(c => c.bg),
                    borderColor: colors.map(c => c.border),
                    borderWidth: 1
                }]
            });
        } catch (error) {
            console.error('Error fetching expense data:', error);
            toast.error('Failed to load expense breakdown');
        } finally {
            setLoading(false);
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    boxWidth: 15,
                    padding: 20,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#111827',
                bodyColor: '#4b5563',
                titleFont: {
                    size: 14,
                    family: "'Inter', sans-serif",
                    weight: '600'
                },
                bodyFont: {
                    size: 12,
                    family: "'Inter', sans-serif"
                },
                padding: 12,
                boxPadding: 6,
                borderColor: '#e5e7eb',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
        animation: {
            animateRotate: true,
            animateScale: true
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading expense breakdown...</p>
            </div>
        );
    }

    if (expenseData.labels.length === 0) {
        return (
            <div className="no-data">
                <p>No expense data available</p>
            </div>
        );
    }

    return (
        <div className="expense-breakdown">
            <div className="chart-container">
                <Doughnut data={expenseData} options={options} />
            </div>
        </div>
    );
};

export default ExpenseBreakdown;