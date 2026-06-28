import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Category.css';
import Sidebar from '../Dashboard/Sidebar';

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ 
        categoryName: '',
        type: 'DEBIT',
        personId: localStorage.getItem('personId'),
        isFloatingExpense: false,
        amountSpent: 0
    });
    const [editingCategory, setEditingCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const fetchCategories = useCallback(async () => {
        try {
            const personId = localStorage.getItem('personId');
            if (!personId) {
                toast.error('Session expired. Please log in again.');
                return;
            }

            // Get all transactions and categories
            const [transactionsResponse, categoriesResponse] = await Promise.all([
                axios.get(`http://localhost:2002/TransactionHistory/person/${personId}`),
                axios.get('http://localhost:2004/category')
            ]);

            // Filter debit categories
            const debitCategories = categoriesResponse.data.filter(cat => cat.type === 'DEBIT');

            // Filter transactions for selected month
            const monthStart = new Date(selectedMonth + '-01');
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

            // Calculate amount spent for each category based on filtered transactions
            const updatedCategories = debitCategories.map(category => {
                const categoryTransactions = transactionsResponse.data.filter(
                    transaction => {
                        const transactionDate = new Date(transaction.date);
                        return transaction.categoryId === category.categoryId && 
                               transaction.transactionType === 'DEBIT' &&
                               transactionDate >= monthStart &&
                               transactionDate <= monthEnd;
                    }
                );
                
                const totalSpent = categoryTransactions.reduce((sum, transaction) => {
                    return sum + transaction.amount;
                }, 0);

                return {
                    ...category,
                    amountSpent: totalSpent
                };
            });

            setCategories(updatedCategories);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            setLoading(false);
        }
    }, [selectedMonth]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:2004/category', {
                ...newCategory,
                type: 'DEBIT',
                amountSpent: 0
            });
            setCategories([...categories, response.data]);
            setNewCategory({ 
                categoryName: '',
                type: 'DEBIT',
                personId: localStorage.getItem('personId'),
                isFloatingExpense: false,
                amountSpent: 0
            });
            toast.success('Category created successfully');
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Failed to create category');
        }
    };

    const handleUpdateCategory = async (id) => {
        try {
            const response = await axios.put(`http://localhost:2004/category/${id}`, {
                ...editingCategory,
                type: 'DEBIT'
            });
            setCategories(categories.map(cat => cat.categoryId === id ? response.data : cat));
            setEditingCategory(null);
            toast.success('Category updated successfully');
            await fetchCategories();
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category');
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await axios.delete(`http://localhost:2004/category/${id}`);
            setCategories(categories.filter(cat => cat.categoryId !== id));
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    // Generate last 12 months for dropdown
    const getLastTwelveMonths = () => {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStr = date.toISOString().slice(0, 7);
            months.push(monthStr);
        }
        return months;
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="loading">Loading categories...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-content">
                <div className="category-container">
                    <div className="category-header">
                        <h2>Categories</h2>
                        <p>Manage your expense categories</p>
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="month-selector"
                        >
                            {getLastTwelveMonths().map(month => (
                                <option key={month} value={month}>
                                    {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="category-form">
                        <h3>Add New Category</h3>
                        <form onSubmit={handleCreateCategory}>
                            <input
                                type="text"
                                placeholder="Category Name"
                                value={newCategory.categoryName}
                                onChange={(e) => setNewCategory({...newCategory, categoryName: e.target.value})}
                                required
                            />
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newCategory.isFloatingExpense}
                                    onChange={(e) => setNewCategory({...newCategory, isFloatingExpense: e.target.checked})}
                                />
                                Floating Expense
                            </label>
                            <button type="submit">Add Category</button>
                        </form>
                    </div>

                    <div className="categories-list">
                        {categories.map(category => (
                            <div key={category.categoryId} className="category-card">
                                {editingCategory && editingCategory.categoryId === category.categoryId ? (
                                    <div className="edit-form">
                                        <input
                                            type="text"
                                            value={editingCategory.categoryName}
                                            onChange={(e) => setEditingCategory({
                                                ...editingCategory,
                                                categoryName: e.target.value
                                            })}
                                        />
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={editingCategory.isFloatingExpense}
                                                onChange={(e) => setEditingCategory({
                                                    ...editingCategory,
                                                    isFloatingExpense: e.target.checked
                                                })}
                                            />
                                            Floating Expense
                                        </label>
                                        <button onClick={() => handleUpdateCategory(category.categoryId)}>Save</button>
                                        <button onClick={() => setEditingCategory(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="category-info">
                                            <h4>{category.categoryName}</h4>
                                            <p>Amount Spent: ₹{category.amountSpent.toLocaleString()}</p>
                                            <p>Floating Expense: {category.isFloatingExpense ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div className="category-actions">
                                            <button onClick={() => setEditingCategory(category)}>Edit</button>
                                            <button onClick={() => handleDeleteCategory(category.categoryId)}>Delete</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Category;