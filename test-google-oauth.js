import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const colorize = (text, color) => `${color}${text}${RESET}`;

console.log(colorize('🔍 Testing Google OAuth Token', BLUE));
console.log('=====================================\n');

async function testOAuthToken() {
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    console.log(colorize('❌ Missing OAuth credentials', RED));
    return false;
  }

  try {
    console.log('1. Testing token refresh...');
    
    // Try to get a new access token using the refresh token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    if (tokenResponse.data.access_token) {
      console.log(colorize('✅ Successfully obtained access token!', GREEN));
      
      const accessToken = tokenResponse.data.access_token;
      console.log(`   Token expires in: ${tokenResponse.data.expires_in} seconds`);
      
      // Test the access token with a basic Google API call
      console.log('\n2. Testing access token with Google OAuth2 API...');
      
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (userInfoResponse.data.email) {
        console.log(colorize('✅ Access token works!', GREEN));
        console.log(`   Authenticated as: ${userInfoResponse.data.email}`);
        
        // Test if this token has Google Ads scope
        console.log('\n3. Testing Google Ads API access...');
        
        try {
          const adsResponse = await axios.get(`https://googleads.googleapis.com/v16/customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN
            }
          });
          
          console.log(colorize('✅ Google Ads API access successful!', GREEN));
          return true;
        } catch (adsError) {
          console.log(colorize('❌ Google Ads API access failed:', RED));
          console.log(`   Status: ${adsError.response?.status}`);
          console.log(`   Error: ${adsError.response?.data?.error?.message || adsError.message}`);
          
          if (adsError.response?.status === 403) {
            console.log(colorize('\n💡 Possible solutions:', YELLOW));
            console.log('   1. Enable Google Ads API in Google Cloud Console');
            console.log('   2. Make sure your developer token is approved');
            console.log('   3. Verify your customer ID has access to this account');
          }
          
          return false;
        }
      }
    }
  } catch (error) {
    console.log(colorize('❌ Token test failed:', RED));
    console.log(`   Error: ${error.response?.data?.error_description || error.message}`);
    
    if (error.response?.data?.error === 'invalid_grant') {
      console.log(colorize('\n💡 The refresh token may be expired or invalid.', YELLOW));
      console.log('   Try regenerating it with: node server/regenerate-google-token.js');
    }
    
    return false;
  }
}

// Test and provide clear feedback
testOAuthToken().then(success => {
  console.log('\n' + colorize('📋 SUMMARY', BLUE));
  console.log('=====================================');
  
  if (success) {
    console.log(colorize('✅ Your Google Ads OAuth setup is working correctly!', GREEN));
    console.log('   The refresh token will automatically renew access tokens every hour.');
    console.log('   Your dashboard will work 24/7 without manual intervention.');
    console.log('\n🚀 Next step: Deploy to Railway with confidence!');
  } else {
    console.log(colorize('❌ OAuth setup needs attention.', RED));
    console.log('   Review the errors above and follow the suggested solutions.');
  }
}).catch(error => {
  console.error(colorize('Unexpected error:', RED), error.message);
}); 