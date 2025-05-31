import { GoogleAdsApi } from 'google-ads-api';

// Validate required Google Ads credentials
const validateGoogleAdsCredentials = () => {
  const requiredCredentials = [
    { key: 'GOOGLE_ADS_CLIENT_ID', value: process.env.GOOGLE_ADS_CLIENT_ID },
    { key: 'GOOGLE_ADS_CLIENT_SECRET', value: process.env.GOOGLE_ADS_CLIENT_SECRET },
    { key: 'GOOGLE_ADS_DEVELOPER_TOKEN', value: process.env.GOOGLE_ADS_DEVELOPER_TOKEN },
    { key: 'GOOGLE_ADS_REFRESH_TOKEN', value: process.env.GOOGLE_ADS_REFRESH_TOKEN },
    { key: 'GOOGLE_ADS_CUSTOMER_ID', value: process.env.GOOGLE_ADS_CUSTOMER_ID }
  ];
  
  const missingCredentials = requiredCredentials
    .filter(cred => !cred.value)
    .map(cred => cred.key);
    
  if (missingCredentials.length > 0) {
    throw new Error(`Missing required Google Ads credentials: ${missingCredentials.join(', ')}`);
  }
  
  // Validate refresh token format (basic validation)
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (refreshToken && (refreshToken.length < 20 || refreshToken.includes(' '))) {
    throw new Error('GOOGLE_ADS_REFRESH_TOKEN appears to be invalid. It should be a long string without spaces.');
  }
  
  return true;
};

// Initialize Google Ads client
const initGoogleAdsClient = () => {
  try {
    // First validate all required credentials are present
    validateGoogleAdsCredentials();
    
    console.log('Initializing Google Ads client with credentials:');
    console.log('- Client ID:', process.env.GOOGLE_ADS_CLIENT_ID.substring(0, 8) + '...');
    console.log('- Developer Token:', process.env.GOOGLE_ADS_DEVELOPER_TOKEN.substring(0, 4) + '...');
    console.log('- Refresh Token:', (process.env.GOOGLE_ADS_REFRESH_TOKEN || '').substring(0, 8) + '...');
    console.log('- Customer ID:', process.env.GOOGLE_ADS_CUSTOMER_ID);
    
    // Create the Google Ads client with credentials
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });
    
    // Test client creation response
    if (!client) {
      throw new Error('Google Ads client initialization returned null or undefined');
    }
    
    return client;
  } catch (error) {
    console.error('Google Ads Client Initialization Error:', error);
    
    // Enhance error message with specific guidance
    let enhancedError;
    if (error.message.includes('No access, refresh token, API key or refresh handler callback is set')) {
      enhancedError = new Error(
        'Google Ads authentication failed: Invalid or expired refresh token. ' +
        'Please ensure your GOOGLE_ADS_REFRESH_TOKEN is current and properly formatted. ' +
        'You may need to regenerate it in the Google Cloud Console.'
      );
    } else if (error.message.includes('invalid_client')) {
      enhancedError = new Error(
        'Google Ads authentication failed: Invalid client credentials. ' +
        'Please check your GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET values.'
      );
    } else if (error.message.includes('invalid_grant')) {
      enhancedError = new Error(
        'Google Ads authentication failed: Invalid grant. ' +
        'Your refresh token may be expired or revoked. ' +
        'Please generate a new refresh token in the Google Cloud Console.'
      );
    } else {
      enhancedError = new Error(`Failed to initialize Google Ads client: ${error.message}`);
    }
    
    // Add the original error for debugging
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

/**
 * Fetches Google Ads data for the specified date range
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of formatted Google Ads data
 */
export async function fetchGoogleAdsData(startDate, endDate) {
  try {
    // Check if we're explicitly told to use mock data
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('Using mock Google Ads data');
      return generateMockGoogleAdsData(startDate, endDate);
    }

    console.log('Fetching real Google Ads data for period:', startDate, 'to', endDate);
    
    // Initialize the Google Ads API client
    const client = initGoogleAdsClient();
    
    // Create customer instance
    try {
      const customer = client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID
      });
      
      // Create a query to fetch campaign metrics
      const query = `
        SELECT
          segments.date,
          metrics.clicks,
          metrics.impressions,
          metrics.average_cpc,
          metrics.cost_micros
        FROM campaign
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY segments.date ASC
      `;
      
      console.log('Google Ads API Query:', query);
      
      // Execute the query
      const results = await customer.query(query);
      
      console.log('Google Ads API Response length:', results?.length || 0);
      if (results && results.length > 0) {
        console.log('Google Ads Sample Response Item:', JSON.stringify(results[0], null, 2));
      } else {
        console.log('Google Ads API returned empty results');
      }
      
      // Format results to match the expected structure
      const formattedData = results.map(row => {
        const date = new Date(row.segments.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        // Format impressions with commas for thousands
        const impressions = row.metrics.impressions;
        const formattedImpressions = impressions > 999 
          ? Math.floor(impressions / 1000) + ',' + impressions.toString().slice(-3)
          : impressions.toString();
        
        // Convert cost from micros (millionths of the currency unit) to actual currency
        const cost = (row.metrics.cost_micros / 1000000).toFixed(2);
        
        return {
          Date: formattedDate,
          Clicks: row.metrics.clicks.toString(),
          Impressions: formattedImpressions,
          Avg_CPC: `$${(row.metrics.average_cpc / 1000000).toFixed(2)}`,
          Cost: `$${cost}`
        };
      });
      
      return formattedData;
    } catch (error) {
      console.error('Error in Google Ads query execution:', error);
      
      // Enhanced error handling for query execution issues
      let enhancedError;
      if (error.message.includes('NOT_FOUND') || error.message.includes('cannot find account')) {
        enhancedError = new Error(
          `Google Ads account not found or inaccessible: Customer ID ${process.env.GOOGLE_ADS_CUSTOMER_ID} might be invalid or ` +
          'your account does not have permission to access it.'
        );
      } else if (error.message.includes('PERMISSION_DENIED')) {
        enhancedError = new Error(
          'Google Ads API permission denied: Your credentials do not have sufficient permissions ' +
          'to access this Google Ads account.'
        );
      } else if (error.message.includes('LOGIN_REQUIRED')) {
        enhancedError = new Error(
          'Google Ads API login required: Your refresh token may be expired. Generate a new one.'
        );
      } else {
        enhancedError = new Error(`Google Ads query execution failed: ${error.message}`);
      }
      
      enhancedError.originalError = error;
      throw enhancedError;
    }
  } catch (error) {
    console.error('Error fetching Google Ads data:', error);
    
    // Only fallback to mock data if USE_MOCK_DATA_FALLBACK is enabled
    if (process.env.USE_MOCK_DATA_FALLBACK === 'true') {
      console.warn('Falling back to mock Google Ads data due to error');
      return generateMockGoogleAdsData(startDate, endDate);
    }
    
    // Otherwise, propagate the enhanced error
    throw new Error(`Failed to fetch Google Ads data: ${error.message}`);
  }
}

/**
 * Generates mock Google Ads data for development and testing
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} - Array of mock Google Ads data
 */
function generateMockGoogleAdsData(startDate, endDate) {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Generate different patterns for weekdays vs weekends
    const clicks = isWeekend 
      ? Math.floor(Math.random() * 20) + 15 
      : Math.floor(Math.random() * 50) + 30;
    
    const impressions = clicks * (Math.floor(Math.random() * 50) + 30);
    const cpc = (Math.random() * 0.5 + 0.8).toFixed(2);
    const cost = (clicks * parseFloat(cpc)).toFixed(2);
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Format impressions with commas for thousands
    const formattedImpressions = impressions > 999 
      ? Math.floor(impressions / 1000) + ',' + impressions.toString().slice(-3)
      : impressions.toString();
    
    data.push({
      Date: formattedDate,
      Clicks: clicks.toString(),
      Impressions: formattedImpressions,
      Avg_CPC: `$${cpc}`,
      Cost: `$${cost}`
    });
  }
  
  return data;
}