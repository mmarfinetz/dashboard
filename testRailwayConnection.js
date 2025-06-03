/**
 * Railway API Connection Test and Fix
 * 
 * This script tests connectivity with the Railway-deployed API backend
 * and attempts to fix issues with connecting to live data sources.
 * 
 * NOTE: This file has been moved to the consolidated test directory at:
 * /tests/testRailwayConnection.js
 * 
 * Please use the new version instead:
 * npm run test:railway
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Railway backend URL
const RAILWAY_API_URL = 'https://perfect-light-production.up.railway.app';

// Text formatting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
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
  
  const url = `${RAILWAY_API_URL}${endpoint}${params ? '?' + queryParams : ''}`;
  console.log(`Testing: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    const data = await response.json().catch(() => ({}));
    
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
      
      return { success: true, data, status: response.status };
    } else {
      console.log(colorize(`❌ Failed with status ${response.status}`, RED));
      if (Object.keys(data).length > 0) {
        console.log('Error details:', data);
      } else {
        console.log('No error details available in response body');
      }
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, RED));
    return { success: false, error: error.message, status: 0 };
  }
}

// Verify local server connection
async function checkLocalServer() {
  console.log('\n-- Checking local API server --');
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log(colorize('✅ Local server is running at http://localhost:3001', GREEN));
      return true;
    } else {
      console.log(colorize('❌ Local server returned non-200 status', RED));
      return false;
    }
  } catch (error) {
    console.log(colorize('❌ Local server is not running. Start it with npm run server', RED));
    return false;
  }
}

// Run deployment checks and fixes
async function runDeploymentChecks() {
  console.log('\n-- Checking deployment configuration --');
  
  // Check if env file exists in server folder
  try {
    await fs.access(path.join(__dirname, 'server', '.env'));
    console.log(colorize('✅ Found .env file in server folder', GREEN));
  } catch (error) {
    console.log(colorize('⚠️ No .env file found in server folder', YELLOW));
    console.log('Railway may not have the required environment variables.');
    
    // Check if we should create one
    console.log(colorize('Creating server/.env file with correct environment values...', BLUE));
    try {
      // Read main .env file
      const envContent = await fs.readFile(path.join(__dirname, '.env'), 'utf8');
      
      // Create server/.env directory if it doesn't exist
      await fs.mkdir(path.join(__dirname, 'server'), { recursive: true });
      
      // Write to server/.env
      await fs.writeFile(path.join(__dirname, 'server', '.env'), envContent);
      console.log(colorize('✅ Created server/.env file successfully', GREEN));
      console.log('You need to redeploy to Railway to apply these changes.');
    } catch (writeError) {
      console.log(colorize(`❌ Failed to create server/.env: ${writeError.message}`, RED));
    }
  }
  
  // Check if Google credentials file exists
  try {
    await fs.access(path.join(__dirname, 'server', 'client_secret.json'));
    console.log(colorize('✅ Found Google API credentials file in server folder', GREEN));
  } catch (error) {
    console.log(colorize('⚠️ No Google API credentials file found in server folder', YELLOW));
  }
  
  // Check if debug-config.json has correct settings
  try {
    const configContent = await fs.readFile(path.join(__dirname, 'debug-config.json'), 'utf8');
    const config = JSON.parse(configContent);
    
    if (config.apis?.mockDataEnabled === true) {
      console.log(colorize('⚠️ Mock data is enabled in debug-config.json', YELLOW));
      
      // Update the configuration
      config.apis.mockDataEnabled = false;
      await fs.writeFile(
        path.join(__dirname, 'debug-config.json'),
        JSON.stringify(config, null, 2)
      );
      console.log(colorize('✅ Updated debug-config.json to disable mock data', GREEN));
    } else {
      console.log(colorize('✅ debug-config.json already has mock data disabled', GREEN));
    }
  } catch (error) {
    console.log(colorize(`❌ Failed to check debug-config.json: ${error.message}`, RED));
  }
}

// Main test function
async function testRailwayConnection() {
  console.log('\n==== TESTING RAILWAY API CONNECTION ====\n');
  
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
    { name: 'Health check', result: healthResult.success, status: healthResult.status },
    { name: 'API status', result: statusResult.success, status: statusResult.status },
    { name: 'Google Ads data', result: googleResult.success, status: googleResult.status },
    { name: 'Facebook Ads data', result: facebookResult.success, status: facebookResult.status },
    { name: 'Combined marketing data', result: combinedResult.success, status: combinedResult.status }
  ];
  
  const passingTests = results.filter(r => r.result).length;
  console.log(`${passingTests}/${results.length} endpoints working correctly`);
  
  results.forEach(result => {
    const icon = result.result ? '✅' : '❌';
    const color = result.result ? GREEN : RED;
    console.log(colorize(`${icon} ${result.name} [Status: ${result.status}]`, color));
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
  
  // Final assessment and next steps
  if (passingTests === results.length) {
    console.log(colorize('\n✅ Railway API is fully operational!', GREEN));
    console.log('The dashboard should be able to connect and display data.');
    return { success: true };
  } else {
    console.log(colorize(`\n⚠️ Some API tests failed (${results.length - passingTests}/${results.length})`, YELLOW));
    
    // Check if all endpoints are returning 502
    const all502 = results.every(r => !r.result && r.status === 502);
    
    if (all502) {
      console.log(colorize('\n🔍 All endpoints returned 502 errors, which typically means:', BLUE));
      console.log('1. The Railway service might be down or restarting');
      console.log('2. The deployment might have failed or crashed');
      console.log('3. There might be environment variable issues on Railway');
      
      console.log('\nTrying to identify the issue...');
      
      // Check local server status
      const localServerRunning = await checkLocalServer();
      
      // Check deployment configuration
      await runDeploymentChecks();
      
      console.log(colorize('\n📋 Action Plan for 502 Errors:', BLUE));
      console.log('1. Verify the deployment in the Railway dashboard');
      console.log('2. Check the Railway logs for error messages');
      console.log('3. Redeploy the application with proper environment variables');
      console.log('4. Ensure the server code is properly handling startup errors');
    } else {
      console.log('Check the API logs on Railway for more details.');
    }
    
    return { success: false, passingTests, totalTests: results.length };
  }
}

// Run tests
testRailwayConnection().catch(error => {
  console.error(colorize(`Error running tests: ${error}`, RED));
});