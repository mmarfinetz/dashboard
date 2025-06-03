import fetch from 'node-fetch';

const RAILWAY_URL = 'https://perfect-light-production.up.railway.app';

async function testRailwayDeployment() {
  console.log('Testing Railway deployment...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing /health endpoint...');
    const healthResponse = await fetch(`${RAILWAY_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthData);
    
    // Test API status endpoint
    console.log('\n2. Testing /api/status endpoint...');
    const statusResponse = await fetch(`${RAILWAY_URL}/api/status`);
    const statusData = await statusResponse.json();
    console.log(`   Status: ${statusResponse.status}`);
    console.log(`   Response:`, statusData);
    
    if (healthResponse.ok && statusResponse.ok) {
      console.log('\n✅ Railway deployment is working!');
    } else {
      console.log('\n❌ Railway deployment is returning errors');
    }
  } catch (error) {
    console.error('\n❌ Failed to connect to Railway:', error.message);
    console.log('\nThis might mean:');
    console.log('1. The deployment is still in progress');
    console.log('2. The server failed to start');
    console.log('3. There are configuration issues');
  }
}

testRailwayDeployment(); 