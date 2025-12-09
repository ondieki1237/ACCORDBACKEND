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

        // 2. Create Consumable
        console.log('Creating consumable...');
        const createRes = await axios.post(`${API_URL}/admin/consumables`, {
            category: 'Test Category',
            name: 'Test Consumable',
            price: 1000,
            unit: 'box',
            description: 'Test Description'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const consumableId = createRes.data.data._id;
        console.log('Consumable created:', consumableId);

        // 3. Get Consumables (Public)
        console.log('Fetching consumables...');
        const listRes = await axios.get(`${API_URL}/consumables`);
        const found = listRes.data.data.find(c => c._id === consumableId);
        if (!found) throw new Error('Consumable not found in list');
        console.log('Consumable found in list.');

        // 4. Update Consumable
        console.log('Updating consumable...');
        await axios.put(`${API_URL}/admin/consumables/${consumableId}`, {
            price: 1500
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Consumable updated.');

        // 5. Delete Consumable
        console.log('Deleting consumable...');
        await axios.delete(`${API_URL}/admin/consumables/${consumableId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Consumable deleted.');

        console.log('Verification PASSED.');
    } catch (error) {
        console.error('Verification FAILED:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

run();
