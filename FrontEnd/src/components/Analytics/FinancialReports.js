import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { toast } from 'react-toastify';
import './FinancialReports.css';
import Sidebar from '../Dashboard/Sidebar';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const FinancialReports = () => {
    const [reportData, setReportData] = useState({
        incomeVsExpense: {
            labels: [],
            datasets: [{
                label: 'Income',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Expenses',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        categoryWiseSpending: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1
            }]
        },
        savingsRate: {
            labels: [],
            datasets: [{
                label: 'Savings Rate %',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        monthlyTrends: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                fill: false,
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1
            }]
        }
    });
    const [selectedTimeframe, setSelectedTimeframe] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, [selectedTimeframe]);

    const fetchReportData = async () => {
        try {
            const personId = localStorage.getItem('personId');
            if (!personId) {
                toast.error('Session expired. Please log in again.');
                return;
            }

            const [transactionsResponse, categoriesResponse] = await Promise.all([
                axios.get(`${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory/person/${personId}`),
                axios.get('${process.env.REACT_APP_CATEGORY_URL}/category')
            ]);

            const debitCategories = categoriesResponse.data.filter(cat => cat.type === 'DEBIT');
            processReportData(transactionsResponse.data, debitCategories);
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Failed to load financial reports');
        } finally {
            setLoading(false);
        }
    };

    const getTimeframeData = (transactions) => {
        const timeframeLabels = [];
        const incomeData = [];
        const expenseData = [];

        // Group transactions by month/quarter/year
        const groupedTransactions = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            let key;
            
            if (selectedTimeframe === 'month') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else if (selectedTimeframe === 'quarter') {
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                key = `${date.getFullYear()}-Q${quarter}`;
            } else {
                key = date.getFullYear().toString();
            }

            if (!acc[key]) {
                acc[key] = { income: 0, expenses: 0 };
            }

            if (transaction.transactionType === 'CREDIT') {
                acc[key].income += parseFloat(transaction.amount);
            } else {
                acc[key].expenses += parseFloat(transaction.amount);
            }

            return acc;
        }, {});

        // Sort keys chronologically
        const sortedKeys = Object.keys(groupedTransactions).sort();

        // Convert grouped data to arrays maintaining chronological order
        sortedKeys.forEach(key => {
            timeframeLabels.push(key);
            incomeData.push(groupedTransactions[key].income);
            expenseData.push(groupedTransactions[key].expenses);
        });

        return {
            labels: timeframeLabels,
            income: incomeData,
            expenses: expenseData
        };
    };

    const getCategoryData = (transactions, categories) => {
        const categorySpending = categories.reduce((acc, category) => {
            acc[category.categoryId] = {
                name: category.categoryName,
                amount: 0
            };
            return acc;
        }, {});

        // Sum up spending by category
        let totalSpending = 0;
        transactions.forEach(transaction => {
            if (transaction.transactionType === 'DEBIT' && transaction.categoryId) {
                if (categorySpending[transaction.categoryId]) {
                    categorySpending[transaction.categoryId].amount += transaction.amount;
                    totalSpending += transaction.amount;
                }
            }
        });

        const labels = [];
        const data = [];

        Object.values(categorySpending).forEach(category => {
            if (category.amount > 0) {
                const percentage = ((category.amount / totalSpending) * 100).toFixed(1);
                labels.push(`${category.name} (${percentage}%)`);
                data.push(category.amount);
            }
        });

        return { labels, data };
    };

    const calculateSavingsRate = (transactions) => {
        const monthlyData = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expenses: 0 };
            }

            if (transaction.transactionType === 'CREDIT') {
                monthlyData[monthKey].income += parseFloat(transaction.amount);
            } else {
                monthlyData[monthKey].expenses += parseFloat(transaction.amount);
            }
        });

        const labels = [];
        const savingsRates = [];

        // Sort keys chronologically
        const sortedKeys = Object.keys(monthlyData).sort();

        sortedKeys.forEach(month => {
            const data = monthlyData[month];
            if (data.income > 0) {
                const savingsRate = ((data.income - data.expenses) / data.income) * 100;
                labels.push(month);
                savingsRates.push(Math.max(0, savingsRate.toFixed(2)));
            }
        });

        return { labels, data: savingsRates };
    };

    const calculateTrends = (transactions) => {
        const monthlySpending = {};

        transactions.forEach(transaction => {
            if (transaction.transactionType === 'DEBIT') {
                const date = new Date(transaction.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlySpending[monthKey]) {
                    monthlySpending[monthKey] = 0;
                }

                monthlySpending[monthKey] += parseFloat(transaction.amount);
            }
        });

        // Sort keys chronologically
        const sortedKeys = Object.keys(monthlySpending).sort();
        const labels = sortedKeys;
        const data = sortedKeys.map(key => monthlySpending[key]);

        return { labels, data };
    };

    const processReportData = (transactions, categories) => {
        const timeframeData = getTimeframeData(transactions);
        const categoryData = getCategoryData(transactions, categories);
        const savingsData = calculateSavingsRate(transactions);
        const trendData = calculateTrends(transactions);

        setReportData(prev => ({
            ...prev,
            incomeVsExpense: {
                labels: timeframeData.labels,
                datasets: [
                    {
                        ...prev.incomeVsExpense.datasets[0],
                        data: timeframeData.income
                    },
                    {
                        ...prev.incomeVsExpense.datasets[1],
                        data: timeframeData.expenses
                    }
                ]
            },
            categoryWiseSpending: {
                labels: categoryData.labels,
                datasets: [{
                    ...prev.categoryWiseSpending.datasets[0],
                    data: categoryData.data
                }]
            },
            savingsRate: {
                labels: savingsData.labels,
                datasets: [{
                    ...prev.savingsRate.datasets[0],
                    data: savingsData.data
                }]
            },
            monthlyTrends: {
                labels: trendData.labels,
                datasets: [{
                    ...prev.monthlyTrends.datasets[0],
                    data: trendData.data
                }]
            }
        }));
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
                <div className="reports-container">
                    <div className="reports-header">
                        <h2>Financial Reports & Analytics</h2>
                        <div className="timeframe-selector">
                            <button 
                                className={`timeframe-btn ${selectedTimeframe === 'month' ? 'active' : ''}`}
                                onClick={() => setSelectedTimeframe('month')}
                            >
                                Monthly
                            </button>
                            <button 
                                className={`timeframe-btn ${selectedTimeframe === 'quarter' ? 'active' : ''}`}
                                onClick={() => setSelectedTimeframe('quarter')}
                            >
                                Quarterly
                            </button>
                            <button 
                                className={`timeframe-btn ${selectedTimeframe === 'year' ? 'active' : ''}`}
                                onClick={() => setSelectedTimeframe('year')}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>

                    <div className="reports-grid">
                        <div className="report-card">
                            <h3>Income vs Expenses</h3>
                            <div className="chart-container">
                                <Bar 
                                    data={{
                                        ...reportData.incomeVsExpense,
                                        datasets: [
                                            {
                                                ...reportData.incomeVsExpense.datasets[0],
                                                backgroundColor: 'rgba(52, 211, 153, 0.4)',
                                                borderColor: 'rgb(52, 211, 153)',
                                                borderWidth: 2,
                                                hoverBackgroundColor: 'rgba(52, 211, 153, 0.6)'
                                            },
                                            {
                                                ...reportData.incomeVsExpense.datasets[1],
                                                backgroundColor: 'rgba(239, 68, 68, 0.4)',
                                                borderColor: 'rgb(239, 68, 68)',
                                                borderWidth: 2,
                                                hoverBackgroundColor: 'rgba(239, 68, 68, 0.6)'
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        animation: {
                                            duration: 1000,
                                            easing: 'easeInOutQuart'
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    color: 'rgba(156, 163, 175, 0.1)'
                                                },
                                                ticks: {
                                                    callback: function(value) {
                                                        return '₹' + value.toLocaleString();
                                                    },
                                                    font: {
                                                        weight: '500'
                                                    }
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false
                                                }
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    font: {
                                                        weight: '600'
                                                    }
                                                }
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                                padding: 12,
                                                titleFont: {
                                                    size: 14,
                                                    weight: '600'
                                                },
                                                callbacks: {
                                                    label: function(context) {
                                                        return context.dataset.label + ': ₹' + context.raw.toLocaleString();
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="report-card">
                            <h3>Category-wise Spending</h3>
                            <div className="chart-container">
                                <Doughnut 
                                    data={{
                                        ...reportData.categoryWiseSpending,
                                        datasets: [{
                                            ...reportData.categoryWiseSpending.datasets[0],
                                            backgroundColor: [
                                                'rgba(99, 102, 241, 0.8)',
                                                'rgba(244, 63, 94, 0.8)', 
                                                'rgba(34, 197, 94, 0.8)',
                                                'rgba(234, 179, 8, 0.8)',
                                                'rgba(168, 85, 247, 0.8)',
                                                'rgba(14, 165, 233, 0.8)'
                                            ],
                                            borderColor: 'white',
                                            borderWidth: 2,
                                            hoverOffset: 4
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        animation: {
                                            animateRotate: true,
                                            animateScale: true
                                        },
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: {
                                                    font: {
                                                        size: 12,
                                                        weight: '500'
                                                    },
                                                    padding: 15
                                                }
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                                padding: 12,
                                                titleFont: {
                                                    size: 14,
                                                    weight: '600'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="report-card">
                            <h3>Savings Rate</h3>
                            <div className="chart-container">
                                <Line 
                                    data={{
                                        ...reportData.savingsRate,
                                        datasets: [{
                                            ...reportData.savingsRate.datasets[0],
                                            borderColor: 'rgb(99, 102, 241)',
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.4
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        animation: {
                                            duration: 1000,
                                            easing: 'easeInOutQuart'
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                max: 100,
                                                grid: {
                                                    color: 'rgba(156, 163, 175, 0.1)'
                                                },
                                                ticks: {
                                                    callback: function(value) {
                                                        return value + '%';
                                                    },
                                                    font: {
                                                        weight: '500'
                                                    }
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false
                                                }
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                display: false
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                                padding: 12,
                                                titleFont: {
                                                    size: 14,
                                                    weight: '600'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="report-card">
                            <h3>Monthly Trends</h3>
                            <div className="chart-container">
                                <Line 
                                    data={{
                                        ...reportData.monthlyTrends,
                                        datasets: [{
                                            ...reportData.monthlyTrends.datasets[0],
                                            borderColor: 'rgb(234, 179, 8)',
                                            backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.4
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        animation: {
                                            duration: 1000,
                                            easing: 'easeInOutQuart'
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    color: 'rgba(156, 163, 175, 0.1)'
                                                },
                                                ticks: {
                                                    callback: function(value) {
                                                        return '₹' + value.toLocaleString();
                                                    },
                                                    font: {
                                                        weight: '500'
                                                    }
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false
                                                }
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                display: false
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                                padding: 12,
                                                titleFont: {
                                                    size: 14,
                                                    weight: '600'
                                                },
                                                callbacks: {
                                                    label: function(context) {
                                                        return 'Spending: ₹' + context.raw.toLocaleString();
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialReports;