/**
 * Local API Connection Test
 * 
 * This script tests connectivity with the local API server
 * and verifies that all required endpoints are functioning correctly.
 */

import fetch from 'node-fetch';

// Local backend URL
const LOCAL_API_URL = 'http://localhost:3001';

// Text formatting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Helper function to print colored text
const colorize = (text, color) => `${color}${text}${RESET}`;

// Test the specified endpoint with parameters
async function testEndpoint(endpoint, params = {}) {
  // Build query string
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value);
  });
  
  const url = `${LOCAL_API_URL}${endpoint}${params ? '?' + queryParams : ''}`;
  console.log(`Testing: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(colorize(`✅ Success (${responseTime}ms)`, GREEN));
      
      // Check if returning mock data
      if (data.mock === true) {
        console.log(colorize('⚠️ Endpoint is returning MOCK data', YELLOW));
      } else {
        console.log(colorize('✅ Endpoint is returning REAL data', GREEN));
      }
      
      // Basic data validation
      if (Array.isArray(data)) {
        console.log(`Found ${data.length} records`);
        if (data.length > 0) {
          console.log('Sample fields:', Object.keys(data[0]).slice(0, 5).join(', ') + '...');
        }
      } else if (data.data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} records`);
        if (data.data.length > 0) {
          console.log('Sample fields:', Object.keys(data.data[0]).slice(0, 5).join(', ') + '...');
        }
      } else {
        console.log('Response structure:', Object.keys(data).join(', '));
      }
      
      return { success: true, data };
    } else {
      console.log(colorize(`❌ Failed with status ${response.status}`, RED));
      console.log('Error details:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, RED));
    return { success: false, error: error.message };
  }
}

// Main test function
async function testLocalConnection() {
  console.log('\n==== TESTING LOCAL API CONNECTION ====\n');
  
  // 1. Test health endpoint
  console.log('\n-- Testing health endpoint --');
  const healthResult = await testEndpoint('/health');
  
  // 2. Test API status endpoint
  console.log('\n-- Testing API status endpoint --');
  const statusResult = await testEndpoint('/api/status');
  
  // Get date range for data endpoints
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 30); // 30 days ago
  
  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = today.toISOString().split('T')[0];
  
  const dateParams = {
    startDate: formattedStartDate, 
    endDate: formattedEndDate
  };
  
  // 3. Test data endpoints
  console.log('\n-- Testing Google Ads data endpoint --');
  const googleResult = await testEndpoint('/api/google-ads-data', dateParams);
  
  console.log('\n-- Testing Facebook Ads data endpoint --');
  const facebookResult = await testEndpoint('/api/facebook-ads-data', dateParams);
  
  console.log('\n-- Testing combined marketing data endpoint --');
  const combinedResult = await testEndpoint('/api/marketing-data', dateParams);
  
  // Print summary
  console.log('\n==== TEST SUMMARY ====');
  
  const results = [
    { name: 'Health check', result: healthResult.success },
    { name: 'API status', result: statusResult.success },
    { name: 'Google Ads data', result: googleResult.success },
    { name: 'Facebook Ads data', result: facebookResult.success },
    { name: 'Combined marketing data', result: combinedResult.success }
  ];
  
  const passingTests = results.filter(r => r.result).length;
  console.log(`${passingTests}/${results.length} endpoints working correctly`);
  
  results.forEach(result => {
    const icon = result.result ? '✅' : '❌';
    const color = result.result ? GREEN : RED;
    console.log(colorize(`${icon} ${result.name}`, color));
  });
  
  // Check if API is using mock data
  if (googleResult.success && googleResult.data.mock) {
    console.log(colorize('\n⚠️ API is returning MOCK Google Ads data', YELLOW));
    console.log('This may be intentional or due to missing/invalid Google Ads credentials');
  }
  
  if (facebookResult.success && facebookResult.data.mock) {
    console.log(colorize('\n⚠️ API is returning MOCK Facebook Ads data', YELLOW));
    console.log('This may be intentional or due to missing/invalid Facebook credentials');
  }
  
  // Final assessment
  if (passingTests === results.length) {
    console.log(colorize('\n✅ Local API is fully operational!', GREEN));
    console.log('The dashboard should be able to connect and display data.');
  } else {
    console.log(colorize(`\n⚠️ Some API tests failed (${results.length - passingTests}/${results.length})`, YELLOW));
    console.log('Check the server logs for more details.');
  }
}

// Run tests
testLocalConnection().catch(error => {
  console.error(colorize(`Error running tests: ${error}`, RED));
});