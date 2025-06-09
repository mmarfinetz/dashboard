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

async function checkFacebookPageAccess() {
  const pageId = process.env.FACEBOOK_PAGE_ID || '476439392229934'; // Default to known working page ID
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  console.log('====== Facebook Page Access Check ======\n');
  console.log(`Page ID: ${pageId}`);
  console.log(`Access Token: ${accessToken ? accessToken.substring(0, 10) + '...' : 'Not set'}\n`);

  try {
    // First, try to get the list of pages the token has access to
    console.log('1. Checking pages accessible with this token:');
    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,category'
      }
    });

    const pages = pagesResponse.data.data || [];
    if (pages.length === 0) {
      console.log('❌ No pages found accessible with this token');
      console.log('\nThis token might be a user access token without page permissions.');
      console.log('You need a Page Access Token or a User Access Token with manage_pages permission.\n');
    } else {
      console.log(`✓ Found ${pages.length} accessible pages:`);
      pages.forEach(page => {
        console.log(`  - ${page.name} (ID: ${page.id}, Category: ${page.category})`);
        if (page.id === pageId) {
          console.log(`    ✓ This matches your configured Page ID!`);
        }
      });
    }

    // Check if the configured page ID is in the list
    const pageData = pages.find(p => p.id === pageId);
    if (pageData) {
      console.log(`\n✓ Page "${pageData.name}" is accessible with this token`);
      
      // Use the page-specific access token if available
      const pageAccessToken = pageData.access_token || accessToken;
      
      // Try to fetch page insights
      console.log('\n2. Testing Page Insights access:');
      try {
        const insightsResponse = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/insights`, {
          params: {
            metric: 'page_impressions',
            period: 'day',
            access_token: pageAccessToken
          }
        });
        
        console.log('✓ Page Insights API is accessible');
        console.log(`  Data points returned: ${insightsResponse.data.data?.length || 0}`);
      } catch (error) {
        console.log('❌ Page Insights API failed:', error.response?.data?.error?.message || error.message);
      }
    } else {
      console.log(`\n❌ Page ID ${pageId} is not in the list of accessible pages`);
      
      // Try direct access anyway
      console.log('\n2. Attempting direct page access:');
      try {
        const directResponse = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
          params: {
            fields: 'id,name,category,fan_count',
            access_token: accessToken
          }
        });
        
        console.log('✓ Direct page access successful (but might have limited permissions)');
        console.log(`  Page Name: ${directResponse.data.name}`);
        console.log(`  Category: ${directResponse.data.category}`);
        console.log(`  Fans: ${directResponse.data.fan_count || 'Not accessible'}`);
      } catch (error) {
        console.log('❌ Direct page access failed:', error.response?.data?.error?.message || error.message);
        
        if (error.response?.data?.error?.code === 100) {
          console.log('\nPossible reasons:');
          console.log('1. The page ID is incorrect');
          console.log('2. The token doesn\'t have permission to access this page');
          console.log('3. The page is unpublished or restricted');
        }
      }
    }

    // Check token permissions
    console.log('\n3. Checking token permissions:');
    try {
      const debugResponse = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: accessToken,
          access_token: accessToken
        }
      });
      
      const tokenData = debugResponse.data.data;
      const scopes = tokenData.scopes || [];
      
      const requiredScopes = ['pages_show_list', 'pages_read_engagement', 'pages_read_user_content'];
      requiredScopes.forEach(scope => {
        if (scopes.includes(scope)) {
          console.log(`✓ Has ${scope} permission`);
        } else {
          console.log(`❌ Missing ${scope} permission`);
        }
      });
      
      if (!scopes.includes('pages_read_engagement')) {
        console.log('\n⚠️ Missing pages_read_engagement permission!');
        console.log('This permission is required to read page insights data.');
      }
    } catch (error) {
      console.log('❌ Could not check token permissions:', error.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
  }

  console.log('\n====== Recommendations ======');
  console.log('1. Make sure you have the correct Page ID (476439392229934)');
  console.log('2. Ensure your access token has pages_read_engagement permission');
  console.log('3. If using a User Access Token, make sure you have admin access to the page');
  console.log('4. Consider using a Page Access Token instead of a User Access Token');
  console.log('5. You can get a Page Access Token from: https://developers.facebook.com/tools/explorer/');
}

checkFacebookPageAccess().catch(console.error); 