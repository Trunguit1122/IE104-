// Test script to check average band API
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

async function testAverageBand() {
  try {
    console.log('🔍 Testing /api/scores/stats/average-band...\n');
    
    const response = await axios.get(`${API_URL}/scores/stats/average-band`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAverageBand();
