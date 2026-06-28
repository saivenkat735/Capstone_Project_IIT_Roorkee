import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCalendar, FaMoneyBill } from 'react-icons/fa';
import './BillsList.css';

const BillsList = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                '${process.env.REACT_APP_BILLS_URL}/bills/getbills',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // Sort bills by due date
            const sortedBills = response.data.sort((a, b) => 
                new Date(a.dueDate) - new Date(b.dueDate)
            );
            
            // Filter for upcoming bills (next 30 days)
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
            
            const upcomingBills = sortedBills.filter(bill => 
                new Date(bill.dueDate) <= thirtyDaysFromNow
            );

            setBills(upcomingBills);
        } catch (error) {
            console.error('Error fetching bills:', error);
            toast.error('Failed to load upcoming bills');
        } finally {
            setLoading(false);
        }
    };

    const getDaysUntilDue = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading bills...</p>
            </div>
        );
    }

    if (bills.length === 0) {
        return (
            <div className="no-bills">
                <FaMoneyBill className="no-bills-icon" />
                <p>No upcoming bills</p>
            </div>
        );
    }

    return (
        <div className="bills-list">
            {bills.map(bill => {
                const daysUntil = getDaysUntilDue(bill.dueDate);
                const isUrgent = daysUntil <= 3;

                return (
                    <div 
                        key={bill.billId} 
                        className={`bill-item ${isUrgent ? 'urgent' : ''}`}
                    >
                        <div className="bill-info">
                            <h3>{bill.billName}</h3>
                            <p className="bill-description">{bill.description}</p>
                        </div>
                        
                        <div className="bill-details">
                            <div className="bill-amount">
                                ₹{bill.amount.toLocaleString()}
                            </div>
                            <div className="bill-date">
                                <FaCalendar />
                                <span>{new Date(bill.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className={`days-until ${isUrgent ? 'urgent' : ''}`}>
                                {daysUntil} days until due
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BillsList;