import axios from 'axios';

const BASE_URL = '${process.env.REACT_APP_SECURE_URL}'; // Replace with your actual backend URL

// Create axios instances for different endpoints
const createAxiosInstance = (baseURL) => {
    const instance = axios.create({
        baseURL: `${BASE_URL}`,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Add request interceptor to include auth token
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    return instance;
};

const api = {
    auth: createAxiosInstance('/'),
    accounts: createAxiosInstance('/accounts'),
    bills: createAxiosInstance('/bills'),
    transactions: createAxiosInstance('/TransactionHistory'),
};

export default api; 