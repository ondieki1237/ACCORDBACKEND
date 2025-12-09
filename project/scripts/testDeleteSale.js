import axios from 'axios';

const API_URL = 'http://localhost:5002/api';
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
        console.log('Login response user:', loginRes.data.data.user);
        const userId = loginRes.data.data.user.id || loginRes.data.data.user._id;
        console.log('UserId:', userId);
        console.log('Login successful.');

        // 2. Create Sale
        console.log('Creating dummy sale...');
        const createRes = await axios.post(`${API_URL}/sales`, {
            userId: userId,
            equipment: 'Test Equipment',
            price: 500,
            target: 1000
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const saleId = createRes.data.data._id;
        console.log('Sale created:', saleId);

        // 3. Delete Sale
        console.log('Deleting sale...');
        await axios.delete(`${API_URL}/sales/${saleId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Sale deleted.');

        // 4. Verify Deletion (Try to delete again, should fail or return 404)
        console.log('Verifying deletion...');
        try {
            await axios.delete(`${API_URL}/sales/${saleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.error('Error: Sale should have been deleted already.');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Verification PASSED: Sale not found as expected.');
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('Verification FAILED:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

run();
