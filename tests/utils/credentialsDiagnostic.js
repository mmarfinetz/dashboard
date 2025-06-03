/**
 * Diagnostic utility for Google Ads credentials
 * 
 * This script tests the validity of Google Ads API credentials
 * without making actual API calls to ad data.
 */

import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Validate Google Ads Credentials
 * 
 * This function tests each credential individually and then 
 * attempts to initialize the Google Ads API client.
 */
async function validateGoogleAdsCredentials() {
  console.log('====== Google Ads Credentials Diagnostic ======\n');

  // Check for presence of each required environment variable
  const requiredVars = [
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID'
  ];

  console.log('1. Checking environment variables:');
  
  let missingVars = [];
  for (const varName of requiredVars) {
    const varValue = process.env[varName];
    
    if (!varValue) {
      console.log(`❌ ${varName}: Missing`);
      missingVars.push(varName);
    } else {
      // Show a truncated version of the value for security
      const displayValue = varValue.length > 10 
        ? `${varValue.substring(0, 8)}...${varValue.substring(varValue.length - 4)}`
        : varValue;
      
      console.log(`✓ ${varName}: ${displayValue}`);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`\n⚠️ Missing ${missingVars.length} required environment variables: ${missingVars.join(', ')}`);
    console.log('Please add these to your .env file and restart the server.');
    return false;
  }
  
  console.log('\n2. Format validation:');
  
  // Basic format validation for each credential
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId.includes('.apps.googleusercontent.com')) {
    console.log('❌ GOOGLE_ADS_CLIENT_ID: Invalid format. Should end with .apps.googleusercontent.com');
  } else {
    console.log('✓ GOOGLE_ADS_CLIENT_ID: Format appears valid');
  }
  
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (refreshToken.length < 30 || refreshToken.includes(' ')) {
    console.log('❌ GOOGLE_ADS_REFRESH_TOKEN: Appears invalid. Should be a long string without spaces');
  } else {
    console.log('✓ GOOGLE_ADS_REFRESH_TOKEN: Format appears valid');
  }
  
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!/^\d+$/.test(customerId)) {
    console.log('❌ GOOGLE_ADS_CUSTOMER_ID: Invalid format. Should contain only digits');
  } else {
    console.log('✓ GOOGLE_ADS_CUSTOMER_ID: Format appears valid');
  }
  
  console.log('\n3. Attempting to initialize Google Ads client:');
  
  try {
    // Attempt to create the client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });
    
    console.log('✓ Client initialization successful');
    
    // Attempt to create a customer instance
    console.log('\n4. Attempting to access customer account:');
    
    try {
      const customer = client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID
      });
      
      console.log('✓ Customer account initialization successful');
      
      // Try a simple API call that doesn't fetch ad data
      // Just check if the account is accessible
      console.log('\n5. Attempting to verify API access with a simple query:');
      
      try {
        // Simple query to check accessible campaigns count
        const query = `
          SELECT campaign.id
          FROM campaign
          LIMIT 1
        `;
        
        console.log('Query:', query);
        const results = await customer.query(query);
        
        console.log(`✓ API query successful! Found ${results.length} results.`);
        console.log('✓ Your Google Ads credentials are working correctly!\n');
        
        return true;
      } catch (error) {
        console.log(`❌ API query failed: ${error.message}`);
        
        if (error.message.includes('NOT_FOUND')) {
          console.log('⚠️ The customer ID may be incorrect or you may not have access to this account.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          console.log('⚠️ Your developer token may not have sufficient permissions.');
        } else {
          console.log('⚠️ There may be an issue with your refresh token or access scope.');
        }
        
        return false;
      }
    } catch (error) {
      console.log(`❌ Customer initialization failed: ${error.message}`);
      console.log('⚠️ Check your GOOGLE_ADS_CUSTOMER_ID value.');
      return false;
    }
  } catch (error) {
    console.log(`❌ Client initialization failed: ${error.message}`);
    
    if (error.message.includes('No access, refresh token')) {
      console.log('⚠️ Your refresh token appears to be invalid or expired.');
      console.log('⚠️ Please generate a new refresh token in the Google Cloud Console.');
    } else if (error.message.includes('invalid_client')) {
      console.log('⚠️ Your client ID or client secret appears to be incorrect.');
    } else {
      console.log('⚠️ Check all your Google Ads credentials for accuracy.');
    }
    
    return false;
  }
}

// Run the validation
validateGoogleAdsCredentials()
  .then(isValid => {
    if (isValid) {
      console.log('All checks passed. Your Google Ads API credentials are valid and working!');
    } else {
      console.log('\n✍️ Next steps:');
      console.log('1. Fix any issues identified above');
      console.log('2. Make sure your Google Cloud project has the Google Ads API enabled');
      console.log('3. Verify your OAuth consent screen is properly configured');
      console.log('4. Regenerate your refresh token if it appears to be expired');
      console.log('5. Double-check your customer ID in the Google Ads UI');
    }
    process.exit(isValid ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation script encountered an error:', error);
    process.exit(1);
  }); 