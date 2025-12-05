/**
 * Test script to verify connection requests endpoint
 * Run with: node test-connection-requests.js
 */

const API_BASE_URL = process.env.API_URL || 'https://rfp-response-generator-h3w2.onrender.com/api';

async function testConnectionRequests() {
  console.log('Testing Connection Requests Endpoint...\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Endpoint: GET /network/connection-requests\n');

  try {
    // Note: This requires authentication, so it will fail without a valid token
    // But it will show us if the endpoint exists and what error we get
    const response = await fetch(`${API_BASE_URL}/network/connection-requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n✅ Endpoint exists! (Authentication required as expected)');
    } else if (response.status === 200) {
      console.log('\n✅ Endpoint working!');
      console.log('Received Requests:', data.receivedRequests?.length || 0);
      console.log('Sent Requests:', data.sentRequests?.length || 0);
    } else {
      console.log('\n⚠️  Unexpected status code');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('This might mean the backend is not running or the endpoint does not exist.');
  }
}

testConnectionRequests();

