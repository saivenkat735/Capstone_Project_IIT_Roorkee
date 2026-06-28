import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FaHome, 
    FaWallet, 
    FaExchangeAlt, 
    FaFileInvoice, 
    FaChartPie, 
    FaTags,
    FaSignOutAlt,
    FaBookOpen
} from 'react-icons/fa';
import './Sidebar.css';
import { useAuth } from '../../context/AuthContext';
import icon from '../../pic.png';


const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const { logout } = useAuth();
    
    // const handleLogout = () => {
    //     if (window.confirm('Are you sure you want to logout?')) {
    //         localStorage.removeItem('authToken');
    //         localStorage.removeItem('personId');
    //         localStorage.removeItem('userName');
    //         localStorage.clear();
    //         navigate('/', { replace: true });
    //     }
    // };

    return (
        <div className="sidebar">
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center' }}>
                <img 
                    src={icon} 
                    alt="BudgetWise Logo"
                    className="logo-img"
                    style={{
                        width: '50px',
                        height: '50px',
                        marginRight: '6px',
                        transition: 'transform 0.3s ease',
                        cursor: 'pointer',
                        display: 'block'
                    }}
                    onClick={() => navigate('/')}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.1) rotate(10deg)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                />
                <h2 
                    style={{ marginLeft: '4px', cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    BudgetWise
                </h2>
            </div>
            <nav className="sidebar-nav">
                {/* Back button for Accounts page */}
                

                <Link to="/dashboard" className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}>
                    <FaHome /> <span>Dashboard</span>
                </Link>
                <Link to="/accounts" className={`nav-item ${currentPath === '/accounts' ? 'active' : ''}`}>
                    <FaWallet /> <span>Accounts</span>
                </Link>
                <Link to="/transactions" className={`nav-item ${currentPath === '/transactions' ? 'active' : ''}`}>
                    <FaExchangeAlt /> <span>Transactions</span>
                </Link>
                <Link to="/bills" className={`nav-item ${currentPath === '/bills' ? 'active' : ''}`}>
                    <FaFileInvoice /> <span>Fixed Expenses</span>
                </Link>

                {/* Categories Section */}
                <div className="nav-section">
                    <h3 className="nav-section-title">Categories</h3>
                    <Link to="/categories" className={`nav-item ${currentPath === '/categories' ? 'active' : ''}`}>
                        <FaTags /> <span>Manage Categories</span>
                    </Link>
                    {/* <Link to="/category-overview" className={`nav-item ${currentPath === '/category-overview' ? 'active' : ''}`}>
                        <FaList /> <span>Category Overview</span>
                    </Link> */}
                </div>

                <Link to="/reports" className={`nav-item ${currentPath === '/reports' ? 'active' : ''}`}>
                    <FaChartPie /> <span>Analytics</span>
                </Link>
                <Link to="/knowledge" className={`nav-item ${currentPath === '/knowledge' ? 'active' : ''}`}>
                    <FaBookOpen /> <span>Knowledge Base</span>
                </Link>
                {/* <Link to="/settings" className={`nav-item ${currentPath === '/settings' ? 'active' : ''}`}>
                    <FaCog /> <span>Settings</span>
                </Link> */}
                {/* <Link to="/login" className={`nav-item ${currentPath === '/login' ? 'active' : ''}`}>
                    <FaSignOutAlt /> <span>Login</span>
                </Link> */}
            </nav>

            {/* User Profile Section */}
            <div className="sidebar-footer">
                {/* <div className="user-profile">
                    <div className="user-avatar">
                       
                    </div>
                    <div className="user-info">
                        <span className="user-name">User Name</span>
                        <span className="user-email">user@example.com</span>
                    </div>
                </div> */}
                <button className="logout-btn" onClick={()=>{logout()}}>
                    <FaSignOutAlt /> <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;