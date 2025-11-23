import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:4500/api'; // Changed port to 4500 as per error log
const TEST_USER = {
    email: 'test@example.com',
    password: 'password123'
};

async function runTest() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, TEST_USER);
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Create Visit with new fields
        console.log('Creating visit...');
        const visitData = {
            date: new Date().toISOString(),
            startTime: new Date().toISOString(),
            client: {
                name: 'Test Hospital',
                type: 'hospital',
                level: '5',
                location: 'Nairobi'
            },
            visitPurpose: 'sales',
            visitOutcome: 'successful',
            contacts: [
                {
                    name: 'Dr. Test',
                    role: 'doctor',
                    phone: '+254700000000',
                    email: 'test@hospital.com'
                },
                {
                    name: 'Nurse Test',
                    role: 'nurse'
                }
            ],
            productsOfInterest: [
                {
                    name: 'Test Product 1',
                    notes: 'Urgent'
                },
                {
                    name: 'Test Product 2'
                }
            ],
            notes: 'Test visit'
        };

        const createRes = await axios.post(`${API_URL}/visits`, visitData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Verify Response
        console.log('Verifying response...');
        const visit = createRes.data.data;

        if (visit.contacts.length !== 2) throw new Error(`Contacts length mismatch: expected 2, got ${visit.contacts.length}`);
        if (visit.productsOfInterest.length !== 2) throw new Error(`Products length mismatch: expected 2, got ${visit.productsOfInterest.length}`);
        if (visit.productsOfInterest[0].name !== 'Test Product 1') throw new Error(`Product name mismatch: expected 'Test Product 1', got '${visit.productsOfInterest[0].name}'`);

        console.log('Test Passed!');

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

runTest();
