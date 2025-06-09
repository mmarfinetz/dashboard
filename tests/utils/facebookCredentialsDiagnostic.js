/**
 * Diagnostic utility for Facebook API credentials
 * 
 * This script tests the validity of Facebook API credentials
 * without making actual API calls to ad data.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback to server/.env if main .env doesn't have the required vars
if (!process.env.FACEBOOK_ACCESS_TOKEN) {
  dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });
}

/**
 * Validate Facebook API Credentials
 * 
 * This function tests each credential individually and attempts
 * to make a basic API call to verify permissions.
 */
async function validateFacebookCredentials() {
  console.log('====== Facebook API Credentials Diagnostic ======\n');

  // Check for presence of each required environment variable
  const requiredVars = [
    'FACEBOOK_ACCESS_TOKEN',
    'FACEBOOK_AD_ACCOUNT_ID',
    'FACEBOOK_PAGE_ID'
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
      const displayValue = varName === 'FACEBOOK_ACCESS_TOKEN' && varValue.length > 10 
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
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  if (accessToken.length < 30) {
    console.log('❌ FACEBOOK_ACCESS_TOKEN: Token appears too short. Facebook access tokens are typically long strings.');
  } else {
    console.log('✓ FACEBOOK_ACCESS_TOKEN: Length appears valid');
  }
  
  // Check ad account ID format (should start with 'act_' or be numeric)
  const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;
  const cleanAdAccountId = adAccountId.replace(/^act_/, '');
  if (!/^\d+$/.test(cleanAdAccountId)) {
    console.log('❌ FACEBOOK_AD_ACCOUNT_ID: Invalid format. Should be numeric or start with "act_" followed by numbers');
  } else {
    console.log('✓ FACEBOOK_AD_ACCOUNT_ID: Format appears valid');
  }
  
  // Check page ID format (should be numeric)
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!/^\d+$/.test(pageId)) {
    console.log('❌ FACEBOOK_PAGE_ID: Invalid format. Should contain only digits');
  } else {
    console.log('✓ FACEBOOK_PAGE_ID: Format appears valid');
  }
  
  console.log('\n3. Testing API connectivity:');

  // Test basic API connectivity with the token
  try {
    // Try a simple call to get the token debug info
    const response = await axios.get(`https://graph.facebook.com/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: accessToken
      }
    });
    
    const tokenData = response.data.data;
    
    console.log('✓ API connection successful');
    
    // Check token expiration
    if (tokenData.expires_at) {
      const expiryDate = new Date(tokenData.expires_at * 1000);
      const now = new Date();
      
      if (expiryDate < now) {
        console.log(`❌ Token EXPIRED on ${expiryDate.toLocaleString()}`);
      } else {
        console.log(`✓ Token valid until: ${expiryDate.toLocaleString()}`);
      }
    } else {
      console.log('✓ Token does not have an expiration date (long-lived token)');
    }
    
    // Check token scopes
    if (tokenData.scopes) {
      const hasAdsRead = tokenData.scopes.includes('ads_read');
      const hasAdsManagement = tokenData.scopes.includes('ads_management');
      const hasPagesRead = tokenData.scopes.includes('pages_read_engagement');
      
      console.log(`${hasAdsRead ? '✓' : '❌'} Token has ads_read permission`);
      console.log(`${hasAdsManagement ? '✓' : '❌'} Token has ads_management permission`);
      console.log(`${hasPagesRead ? '✓' : '❌'} Token has pages_read_engagement permission`);
      
      if (!hasAdsRead && !hasAdsManagement) {
        console.log('⚠️ This token does not have any ads permissions. It will not be able to access ads data.');
      }
    } else {
      console.log('⚠️ Unable to determine token permissions');
    }
  } catch (error) {
    console.log(`❌ API connection failed: ${error.message}`);
    console.log('Response data:', error.response?.data || 'No response data available');
    return false;
  }
  
  // Test Ad Account access
  console.log('\n4. Testing Ad Account access:');
  try {
    const cleanAccountId = adAccountId.replace(/^act_/, '');
    const response = await axios.get(`https://graph.facebook.com/v19.0/act_${cleanAccountId}`, {
      params: {
        fields: 'name,account_status',
        access_token: accessToken
      }
    });
    
    console.log(`✓ Successfully accessed Ad Account: ${response.data.name}`);
    
    // Check account status
    const statusMap = {
      1: 'Active',
      2: 'Disabled',
      3: 'Unsettled',
      7: 'Pending_risk_review',
      8: 'Pending_settlement',
      9: 'In_grace_period',
      100: 'Pending_closure',
      101: 'Closed',
      201: 'Any_active',
      202: 'Any_closed'
    };
    
    const accountStatus = statusMap[response.data.account_status] || `Unknown (${response.data.account_status})`;
    console.log(`Account status: ${accountStatus}`);
    
    if (response.data.account_status !== 1 && response.data.account_status !== 201) {
      console.log('⚠️ Ad account is not in "Active" status. This may affect data availability.');
    }
  } catch (error) {
    console.log(`❌ Ad account access failed: ${error.message}`);
    console.log('Response data:', error.response?.data?.error || 'No error data available');
    return false;
  }
  
  // Test campaign access
  console.log('\n5. Testing campaign access:');
  try {
    const cleanAccountId = adAccountId.replace(/^act_/, '');
    const campaignId = '23846212577230793'; // The specific campaign ID mentioned
    const response = await axios.get(`https://graph.facebook.com/v19.0/${campaignId}`, {
      params: {
        fields: 'name,status',
        access_token: accessToken
      }
    });
    
    console.log(`✓ Successfully accessed campaign: ${response.data.name}`);
    console.log(`Campaign status: ${response.data.status}`);
    
    if (response.data.status !== 'ACTIVE') {
      console.log('⚠️ Campaign is not in "ACTIVE" status. This may affect recent data availability.');
    }
  } catch (error) {
    console.log(`❌ Campaign access failed: ${error.message}`);
    console.log('Response data:', error.response?.data?.error || 'No error data available');
    
    // Try listing all campaigns instead
    try {
      console.log('\nAttempting to list all accessible campaigns:');
      const cleanAccountId = adAccountId.replace(/^act_/, '');
      const campaignsResponse = await axios.get(`https://graph.facebook.com/v19.0/act_${cleanAccountId}/campaigns`, {
        params: {
          fields: 'name,id,status',
          limit: 5,
          access_token: accessToken
        }
      });
      
      const campaigns = campaignsResponse.data.data || [];
      if (campaigns.length === 0) {
        console.log('No campaigns found for this ad account.');
      } else {
        console.log(`Found ${campaigns.length} campaigns:`);
        campaigns.forEach(campaign => {
          console.log(`- ${campaign.name} (ID: ${campaign.id}, Status: ${campaign.status})`);
        });
      }
    } catch (error) {
      console.log(`❌ Unable to list campaigns: ${error.message}`);
    }
  }
  
  // Test Page access
  console.log('\n6. Testing Page access:');
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const response = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
      params: {
        fields: 'name,username,verification_status,fan_count',
        access_token: accessToken
      }
    });
    
    console.log(`✓ Successfully accessed Page: ${response.data.name}`);
    console.log(`Page username: ${response.data.username || 'N/A'}`);
    console.log(`Page followers: ${response.data.fan_count || 0}`);
    
    // Now try to get a single day of insights to verify permissions
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const startStr = yesterday.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];
      
      const insightsResponse = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/insights`, {
        params: {
          metric: 'page_impressions',
          period: 'day',
          since: Math.floor(yesterday.getTime() / 1000),
          until: Math.floor(today.getTime() / 1000),
          access_token: accessToken
        }
      });
      
      console.log('✓ Successfully accessed Page Insights');
    } catch (error) {
      console.log(`❌ Page insights access failed: ${error.message}`);
      console.log('Response data:', error.response?.data?.error || 'No error data available');
    }
  } catch (error) {
    console.log(`❌ Page access failed: ${error.message}`);
    console.log('Response data:', error.response?.data?.error || 'No error data available');
  }
  
  return true;
}

// Run the validation
validateFacebookCredentials()
  .then(isValid => {
    if (isValid) {
      console.log('\nBasic Facebook API connectivity checks passed.');
      console.log('Note: Some permissions may still be limited. Check warnings above.');
    } else {
      console.log('\n✍️ Next steps:');
      console.log('1. Fix any issues identified above');
      console.log('2. Ensure your Facebook access token has the necessary permissions');
      console.log('3. Verify your ad account and page IDs are correct');
      console.log('4. Generate a new long-lived token if your current token is expired');
      console.log('5. Check that campaign ID 23846212577230793 is accessible with your token');
    }
    process.exit(isValid ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation script encountered an error:', error);
    process.exit(1);
  });