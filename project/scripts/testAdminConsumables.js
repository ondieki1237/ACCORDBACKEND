import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'bellarinseth@gmail.com';
const ADMIN_PASSWORD = 'seth123qP1';

async function run() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.data.tokens.accessToken;
        console.log('Login successful.');

        // 2. Get Admin Consumables
        console.log('Fetching admin consumables...');
        const res = await axios.get(`${API_URL}/admin/consumables?page=1&limit=5`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response status:', res.status);
        console.log('Data count:', res.data.count);
        console.log('Pagination:', res.data.pagination);

        if (res.status === 200 && res.data.success) {
            console.log('Verification PASSED.');
        } else {
            throw new Error('Invalid response');
        }

    } catch (error) {
        console.error('Verification FAILED:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

run();
