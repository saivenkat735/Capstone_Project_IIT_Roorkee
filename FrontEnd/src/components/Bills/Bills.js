import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from '../Dashboard/Sidebar';
import './Bills.css';

const Bills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [billFormData, setBillFormData] = useState({
        billName: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0]
    });
    const [editingBill, setEditingBill] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchBills();
        fetchCategories();
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const personId = localStorage.getItem('personId');
            const response = await axios.get(`${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/person/${personId}`);
            const activeAccounts = response.data.filter(acc => acc.active);
            setAccounts(activeAccounts);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_CATEGORY_URL}/category`);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const fetchBills = async () => {
        try {
            const personId = localStorage.getItem('personId');
            const response = await axios.get(`${process.env.REACT_APP_BILLS_URL}/bills/person/${personId}`);
            
            if (!response.data) {
                toast.error('No data received from server');
                setLoading(false);
                return;
            }

            const simplifiedBills = response.data.map(bill => ({
                billId: bill.billId,
                billName: bill.billName,
                amount: bill.amount,
                dueDate: bill.dueDate,
                isPaid: bill.paid || false
            }));

            setBills(simplifiedBills);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bills:', error);
            const errorMessage = error.response?.data || 'Failed to load bills';
            toast.error(errorMessage);
            setBills([]);
            setLoading(false);
        }
    };

    const handleAddBill = async (e) => {
        e.preventDefault();
        try {
            if (!billFormData.billName || !billFormData.amount || !billFormData.dueDate) {
                toast.error('Please fill in all required fields');
                return;
            }

            const formattedDate = new Date(billFormData.dueDate).toISOString();
            const personId = localStorage.getItem('personId');

            const billData = {
                billName: billFormData.billName,
                amount: parseFloat(billFormData.amount),
                dueDate: formattedDate,
                isPaid: false,
                accountId: personId
            };

            const response = await axios.post('${process.env.REACT_APP_BILLS_URL}/bills/addbills', billData);

            if (response.status === 200) {
                toast.success('Bill added successfully');
                setShowBillModal(false);
                resetBillForm();
                fetchBills();
            }
        } catch (error) {
            console.error('Error adding bill:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add bill';
            toast.error(errorMessage);
        }
    };

    const handleUpdateBill = async (billId) => {
        try {
            const formattedDate = new Date(editingBill.dueDate).toISOString();
            const personId = localStorage.getItem('personId');
            
            const updateData = {
                ...editingBill,
                dueDate: formattedDate,
                amount: parseFloat(editingBill.amount),
                accountId: personId
            };

            const response = await axios.put(`${process.env.REACT_APP_BILLS_URL}/bills/update/${billId}`, updateData);

            if (response.status === 200) {
                toast.success('Bill updated successfully');
                setEditingBill(null);
                fetchBills();
            }
        } catch (error) {
            console.error('Error updating bill:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update bill';
            toast.error(errorMessage);
        }
    };

    const handleDeleteBill = async (billId) => {
        if (window.confirm('Are you sure you want to delete this bill?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_BILLS_URL}/bills/delete/${billId}`);
                toast.success('Bill deleted successfully');
                fetchBills();
            } catch (error) {
                console.error('Error deleting bill:', error);
                toast.error('Failed to delete bill');
            }
        }
    };

    const initiatePayment = (bill) => {
        setSelectedBill(bill);
        setShowPaymentModal(true);
    };

    const handlePayBill = async () => {
        if (!selectedAccount) {
            toast.error('Please select an account for payment');
            return;
        }

        try {
            setProcessingPayment(true);
            const personId = localStorage.getItem('personId');
            
            // Find or create "Bill" category
            let billCategory = categories.find(cat => cat.categoryName === "Bill");
            if (!billCategory) {
                const newCategory = {
                    categoryName: "Fixed Expenses",
                    type: "DEBIT",
                    personId: personId,
                    isFloatingExpense: false
                };
                const categoryResponse = await axios.post(`${process.env.REACT_APP_CATEGORY_URL}/category`, newCategory);
                billCategory = categoryResponse.data;
                await fetchCategories();
            }

            const transactionData = {
                accountId: selectedAccount,
                amount: selectedBill.amount,
                description: `Bill Payment - ${selectedBill.billName}`,
                transactionType: 'DEBIT',
                date: new Date().toISOString(),
                personId: personId,
                categoryId: billCategory.categoryId
            };

            // Create the transaction
            const transactionResponse = await axios.post(`${process.env.REACT_APP_TRANSACTION_URL}/TransactionHistory/transaction`, transactionData);

            if (transactionResponse.status === 200) {
                // Calculate next month's due date
                const currentDueDate = new Date(selectedBill.dueDate);
                const nextMonthDueDate = new Date(currentDueDate.setMonth(currentDueDate.getMonth() + 1));
                
                const updatedBill = { 
                    ...selectedBill, 
                    isPaid: true,
                    dueDate: nextMonthDueDate.toISOString()
                };
                
                // Update bill with next month's due date
                const billUpdateResponse = await axios.put(`${process.env.REACT_APP_BILLS_URL}/bills/update/${selectedBill.billId}`, {
                    ...updatedBill,
                    accountId: personId
                });

                if (billUpdateResponse.status === 200) {
                    setBills(prevBills => 
                        prevBills.map(b => 
                            b.billId === selectedBill.billId ? {
                                ...b, 
                                isPaid: false,
                                dueDate: nextMonthDueDate.toISOString()
                            } : b
                        )
                    );
                    
                    toast.success(`Payment of ₹${selectedBill.amount} processed for ${selectedBill.billName}`);
                    setShowPaymentModal(false);
                    setSelectedBill(null);
                    setSelectedAccount('');
                }
            }
        } catch (error) {
            console.error('Error processing bill payment:', error);
            toast.error('Failed to process payment');
        } finally {
            setProcessingPayment(false);
        }
    };

    const resetBillForm = () => {
        setBillFormData({
            billName: '',
            amount: '',
            dueDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleCancel = () => {
        resetBillForm();
        setShowBillModal(false);
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
                <div className="bills-container">
                    <div className="bills-header">
                        <h2>Fixed Expenses</h2>
                        <button className="add-bill-btn" onClick={() => setShowBillModal(true)}>
                            Add New Bill
                        </button>
                    </div>

                    <div className="bills-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Expense Name</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => (
                                    <tr key={bill.billId}>
                                        <td>{bill.billName}</td>
                                        <td>₹{bill.amount.toLocaleString()}</td>
                                        <td>{new Date(bill.dueDate).toLocaleDateString()}</td>
                                        <td>{bill.isPaid ? 'Paid' : 'Unpaid'}</td>
                                        <td>
                                            <button 
                                                className="pay-btn"
                                                onClick={() => initiatePayment(bill)}
                                                disabled={bill.isPaid || processingPayment}
                                            >
                                                {bill.isPaid ? 'Paid' : processingPayment ? 'Processing...' : 'Pay'}
                                            </button>
                                            <button 
                                                className="edit-btn"
                                                onClick={() => setEditingBill(bill)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteBill(bill.billId)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Bill Modal */}
                {showBillModal && (
                    <div className="modal">
                        <div className="modal-content" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <h3>Add New Bill</h3>
                            <form onSubmit={handleAddBill} style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, justifyContent: 'center' }}>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Bill Name</label>
                                    <input
                                        type="text"
                                        placeholder="Bill Name"
                                        value={billFormData.billName}
                                        onChange={(e) => setBillFormData({...billFormData, billName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={billFormData.amount}
                                        onChange={(e) => setBillFormData({...billFormData, amount: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={billFormData.dueDate}
                                        onChange={(e) => setBillFormData({...billFormData, dueDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="modal-buttons" style={{ marginTop: 'auto' }}>
                                    <button type="submit">Add Bill</button>
                                    <button type="button" onClick={handleCancel}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="modal">
                        <div className="modal-content" style={{
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: 'white',
                            borderRadius: '20px',
                            padding: '32px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        }}>
                            <h3 style={{
                                fontSize: '24px',
                                background: 'linear-gradient(45deg, #4f46e5, #6366f1)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }}>Select Payment Account</h3>

                            <div style={{ 
                                flex: 1,
                                padding: '24px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                marginBottom: '24px'
                            }}>
                                <div style={{
                                    padding: '16px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}>
                                    <p style={{ 
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#1e293b',
                                        marginBottom: '8px'
                                    }}>Bill: {selectedBill.billName}</p>
                                    <p style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: '#4f46e5'
                                    }}>Amount: ₹{selectedBill.amount.toLocaleString()}</p>
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#475569',
                                        fontWeight: '500'
                                    }}>Select Account</label>
                                    <select
                                        value={selectedAccount}
                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #e2e8f0',
                                            fontSize: '16px',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Choose an account</option>
                                        {accounts.map(account => (
                                            <option key={account.accountId} value={account.accountId}>
                                                {account.accountName} (Balance: ₹{parseFloat(account.balance).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-buttons" style={{
                                display: 'flex',
                                gap: '16px',
                                justifyContent: 'center'
                            }}>
                                <button 
                                    onClick={handlePayBill}
                                    disabled={!selectedAccount || processingPayment}
                                    style={{
                                        padding: '12px 24px',
                                        background: !selectedAccount || processingPayment ? '#94a3b8' : '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: !selectedAccount || processingPayment ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        transform: 'scale(1)',
                                        ':hover': {
                                            transform: 'scale(1.05)'
                                        }
                                    }}
                                >
                                    {processingPayment ? 'Processing...' : 'Confirm Payment'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setSelectedBill(null);
                                        setSelectedAccount('');
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'white',
                                        color: '#4f46e5',
                                        border: '2px solid #4f46e5',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Bill Modal */}
                {editingBill && (
                    <div className="modal">
                        <div className="modal-content" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <h3>Edit Bill</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateBill(editingBill.billId);
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, justifyContent: 'center' }}>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Bill Name</label>
                                    <input
                                        type="text"
                                        placeholder="Bill Name"
                                        value={editingBill.billName}
                                        onChange={(e) => setEditingBill({...editingBill, billName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={editingBill.amount}
                                        onChange={(e) => setEditingBill({...editingBill, amount: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={editingBill.dueDate?.split('T')[0]}
                                        onChange={(e) => setEditingBill({...editingBill, dueDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="modal-buttons" style={{ marginTop: 'auto' }}>
                                    <button type="submit">Update Bill</button>
                                    <button type="button" onClick={() => setEditingBill(null)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bills;
