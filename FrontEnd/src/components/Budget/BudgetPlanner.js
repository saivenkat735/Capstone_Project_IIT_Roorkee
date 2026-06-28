import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { FaPlus, FaChartPie } from 'react-icons/fa';
import './BudgetPlanner.css';

const BudgetPlanner = () => {
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newBudget, setNewBudget] = useState({
        categoryId: '',
        amount: '',
        month: new Date().toISOString().split('T')[0].slice(0, 7)
    });

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decodedToken = jwtDecode(token);
            fetchInitialData(decodedToken.personId);
        }
    }, []);

    const fetchInitialData = async (personId) => {
        try {
            setLoading(true);
            await Promise.all([
                fetchCategories(personId),
                fetchBudgets()
            ]);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async (personId) => {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
            `${process.env.REACT_APP_CATEGORY_URL}/category/person/${personId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setCategories(response.data.filter(cat => cat.type === 'EXPENSE'));
    };

    const fetchBudgets = async () => {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
            `http://localhost:9008/budgets`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setBudgets(response.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(
                `http://localhost:9008/budgets`,
                newBudget,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success('Budget set successfully');
            setShowModal(false);
            fetchBudgets();
            resetForm();
        } catch (error) {
            console.error('Error setting budget:', error);
            toast.error('Failed to set budget');
        }
    };

    const handleDelete = async (budgetId) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(
                    `http://localhost:9008/budgets/${budgetId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                toast.success('Budget deleted successfully');
                fetchBudgets();
            } catch (error) {
                console.error('Error deleting budget:', error);
                toast.error('Failed to delete budget');
            }
        }
    };

    const resetForm = () => {
        setNewBudget({
            categoryId: '',
            amount: '',
            month: new Date().toISOString().split('T')[0].slice(0, 7)
        });
    };

    const calculateProgress = (budget) => {
        // Calculate spent amount and percentage
        const spent = budget.spent || 0;
        const percentage = (spent / budget.amount) * 100;
        return {
            spent,
            percentage: Math.min(percentage, 100),
            status: percentage > 100 ? 'exceeded' : 
                   percentage > 80 ? 'warning' : 'good'
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading budgets...</p>
            </div>
        );
    }

    return (
        <div className="budget-container">
            <div className="budget-header">
                <h2>Budget Planner</h2>
                <button 
                    className="add-budget-btn"
                    onClick={() => setShowModal(true)}
                >
                    <FaPlus /> Set New Budget
                </button>
            </div>

            <div className="budget-grid">
                {budgets.map(budget => {
                    const progress = calculateProgress(budget);
                    const category = categories.find(c => c.categoryId === budget.categoryId);
                    
                    return (
                        <div key={budget.budgetId} className="budget-card">
                            <div className="budget-header">
                                <div className="budget-icon">
                                    <FaChartPie />
                                </div>
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDelete(budget.budgetId)}
                                >
                                    Delete
                                </button>
                            </div>

                            <div className="budget-info">
                                <h3>{category?.categoryName}</h3>
                                <p className="budget-month">
                                    {new Date(budget.month).toLocaleString('default', { 
                                        month: 'long', 
                                        year: 'numeric' 
                                    })}
                                </p>
                            </div>

                            <div className="budget-progress">
                                <div className="progress-bar">
                                    <div 
                                        className={`progress-fill ${progress.status}`}
                                        style={{ width: `${progress.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="progress-stats">
                                    <span className="spent">
                                        ₹{progress.spent.toLocaleString()}
                                    </span>
                                    <span className="total">
                                        of ₹{budget.amount.toLocaleString()}
                                    </span>
                                </div>
                                <span className={`progress-percentage ${progress.status}`}>
                                    {progress.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Set New Budget</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={newBudget.categoryId}
                                    onChange={(e) => setNewBudget({
                                        ...newBudget,
                                        categoryId: e.target.value
                                    })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.categoryId} value={category.categoryId}>
                                            {category.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    value={newBudget.amount}
                                    onChange={(e) => setNewBudget({
                                        ...newBudget,
                                        amount: e.target.value
                                    })}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>Month</label>
                                <input
                                    type="month"
                                    value={newBudget.month}
                                    onChange={(e) => setNewBudget({
                                        ...newBudget,
                                        month: e.target.value
                                    })}
                                    required
                                    min={new Date().toISOString().split('T')[0].slice(0, 7)}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="submit-btn">
                                    Set Budget
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

export default BudgetPlanner; 