import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './RecurringPayments.css';

const localizer = momentLocalizer(moment);

const RecurringPayments = () => {
    const [payments, setPayments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newPayment, setNewPayment] = useState({
        name: '',
        amount: '',
        accountId: '',
        frequency: 'monthly',
        startDate: '',
        description: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decodedToken = jwtDecode(token);
            fetchAccounts(decodedToken.personId);
            fetchPayments();
        }
    }, []);

    const fetchAccounts = async (personId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${process.env.REACT_APP_ACCOUNTS_URL}/api/accounts/person/${personId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
        }
    };

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${process.env.REACT_APP_BILLS_URL}/recurring-payments`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // Transform payments for calendar view
            const calendarEvents = response.data.map(payment => ({
                ...payment,
                start: new Date(payment.startDate),
                end: new Date(payment.startDate),
                title: `${payment.name} - ₹${payment.amount}`
            }));
            
            setPayments(calendarEvents);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load recurring payments');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(
                `${process.env.REACT_APP_BILLS_URL}/recurring-payments`,
                newPayment,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            toast.success('Recurring payment created successfully');
            setShowModal(false);
            fetchPayments();
            resetForm();
        } catch (error) {
            console.error('Error creating payment:', error);
            toast.error('Failed to create recurring payment');
        }
    };

    const handleDelete = async (paymentId) => {
        if (window.confirm('Are you sure you want to delete this recurring payment?')) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(
                    `${process.env.REACT_APP_BILLS_URL}/recurring-payments/${paymentId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                toast.success('Recurring payment deleted successfully');
                fetchPayments();
            } catch (error) {
                console.error('Error deleting payment:', error);
                toast.error('Failed to delete recurring payment');
            }
        }
    };

    const resetForm = () => {
        setNewPayment({
            name: '',
            amount: '',
            accountId: '',
            frequency: 'monthly',
            startDate: '',
            description: ''
        });
    };

    return (
        <div className="recurring-payments-container">
            <div className="payments-header">
                <h2>Recurring Payments</h2>
                <button 
                    className="add-payment-btn"
                    onClick={() => setShowModal(true)}
                >
                    Add New Payment
                </button>
            </div>

            <div className="calendar-container">
                <Calendar
                    localizer={localizer}
                    events={payments}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                    views={['month', 'week']}
                    defaultView="month"
                    onSelectEvent={(event) => {
                        const payment = payments.find(p => p.id === event.id);
                        if (payment) {
                            const accountName = accounts.find(a => a.accountId === payment.accountId)?.accountName;
                            toast.info(
                                `${payment.name}\nAmount: ₹${payment.amount}\nAccount: ${accountName}\nFrequency: ${payment.frequency}`,
                                { autoClose: false }
                            );
                        }
                    }}
                />
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Create Recurring Payment</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Payment Name</label>
                                <input
                                    type="text"
                                    value={newPayment.name}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        name: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    value={newPayment.amount}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        amount: e.target.value
                                    })}
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Account</label>
                                <select
                                    value={newPayment.accountId}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        accountId: e.target.value
                                    })}
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(account => (
                                        <option key={account.accountId} value={account.accountId}>
                                            {account.accountName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Frequency</label>
                                <select
                                    value={newPayment.frequency}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        frequency: e.target.value
                                    })}
                                    required
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={newPayment.startDate}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        startDate: e.target.value
                                    })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newPayment.description}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        description: e.target.value
                                    })}
                                    rows="3"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="submit-btn">
                                    Create Payment
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

export default RecurringPayments; 