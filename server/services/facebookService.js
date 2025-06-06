import axios from 'axios';
import { cachedRequest } from '../utils/apiMiddleware.js';

/**
 * Fetches Facebook Ads data for the specified date range
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {boolean} forceRefresh - Whether to bypass cache and force a fresh API request
 * @returns {Promise<Array>} - Array of formatted Facebook Ads data
 */
export async function fetchFacebookAdsData(startDate, endDate, forceRefresh = false) {
  try {
    // Check if we should use mock data
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('Using mock Facebook Ads data');
      const mockData = generateMockFacebookAdsData(startDate, endDate);
      return { ...mockData, mock: true }; // Add a flag to indicate this is mock data
    }
    
    const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (!adAccountId || !accessToken) {
      throw new Error('Missing Facebook credentials in environment variables');
    }

    // Remove any 'act_' prefix if it exists in the environment variable
    const cleanAccountId = adAccountId.replace(/^act_/, '');
    
    console.log('Fetching Facebook Ads data with:', {
      adAccountId: cleanAccountId,
      startDate,
      endDate,
      accessTokenLength: accessToken.length,
      hasToken: !!accessToken,
      hasAccountId: !!adAccountId
    });
    
    // First, check if the ad account is active
    try {
      const accountUrl = `https://graph.facebook.com/v22.0/act_${cleanAccountId}`;
      const accountParams = {
        fields: 'account_status,name',
        access_token: accessToken
      };
      
      const accountResponse = await cachedRequest({
        url: accountUrl,
        params: accountParams,
        cacheKey: `fb-account-status-${cleanAccountId}`,
        cacheTTL: 5 * 60 * 1000, // 5 minutes cache
        maxRetries: 1,
        forceRefresh
      });
      
      console.log('Ad Account Status:', accountResponse);
      
      // Check if account is not active (status 1 is active)
      if (accountResponse.account_status !== 1) {
        console.warn(`Ad account is not active (status: ${accountResponse.account_status}). Returning empty data.`);
        return [];
      }
    } catch (error) {
      console.error('Error checking ad account status:', error.message);
      // Continue anyway, as the account might still have historical data
    }
    
    // Create params for the insights request
    const params = {
      level: 'account',
      fields: 'account_name,spend,impressions,clicks,cpc,ctr,reach,actions,date_start,date_stop',
      time_range: JSON.stringify({
        since: startDate,
        until: endDate
      }),
      time_increment: 1,
      access_token: accessToken
    };
    
    // Fetch insights from Facebook API with caching and retry logic
    const url = `https://graph.facebook.com/v22.0/act_${cleanAccountId}/insights`;
    
    console.log('Making request to:', url);
    console.log('With params:', JSON.stringify({...params, access_token: '[REDACTED]'}, null, 2));
    
    // Use cached request with retry logic
    const responseData = await cachedRequest({
      url,
      params,
      cacheKey: `fb-ads-${cleanAccountId}-${startDate}-${endDate}`,
      cacheTTL: 15 * 60 * 1000, // 15 minutes cache
      maxRetries: 3,
      forceRefresh
    });
    
    // Create a response-like structure to match the existing code
    const response = { data: responseData };
    
    if (!response.data) {
      console.error('No data in Facebook API response');
      throw new Error('No data returned from Facebook API');
    }
    
    console.log('Facebook API Response:', JSON.stringify(response.data, null, 2));
    
    const data = response.data.data || [];
    
    // Debug log for date range
    if (data.length > 0) {
      console.log('Facebook data date range:', 
        `${data[0].date_start} to ${data[data.length-1].date_stop} (${data.length} days)`);
    } else {
      console.warn('Facebook API returned empty dataset - this is normal if the ad account has no active campaigns or recent data');
      return [];
    }
    
    // Check if data is limited (possible token issue)
    if (data.length > 0 && data.length < 10) {
      console.warn(`Facebook API returned limited data (${data.length} days). Possible token permission issue.`);
    }
    
    // Format response to match Dashboard.jsx expected format
    return data.map(row => {
      const date = new Date(row.date_start);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Format impressions with commas for thousands
      const impressions = parseInt(row.impressions);
      const formattedImpressions = impressions > 999 
        ? Math.floor(impressions / 1000) + ',' + impressions.toString().slice(-3)
        : impressions.toString();
      
      // Add campaign_name field if present
      const campaignName = row.campaign_name || "Marfinetz Plumbing Campaign";
      
      return {
        Date: formattedDate,
        date_start: row.date_start,
        date_stop: row.date_stop,
        campaign_name: campaignName,
        Clicks: row.clicks.toString(),
        clicks: parseInt(row.clicks),
        Impressions: formattedImpressions,
        impressions: impressions,
        Avg_CPC: `$${parseFloat(row.cpc || 0).toFixed(2)}`,
        cpc: parseFloat(row.cpc || 0),
        Cost: `$${parseFloat(row.spend || 0).toFixed(2)}`,
        spend: parseFloat(row.spend || 0),
        engagement: Math.round(parseInt(row.clicks) * 1.8) // Estimate engagement from clicks
      };
    });
  } catch (error) {
    console.error('Error fetching Facebook Ads data:', error.response ? error.response.data : error.message);
    
    // Check if mock data fallback is enabled
    if (process.env.USE_MOCK_DATA_FALLBACK === 'true') {
      console.warn('Falling back to mock Facebook Ads data due to error');
      const mockData = generateMockFacebookAdsData(startDate, endDate);
      return { ...mockData, mock: true }; // Add a flag to indicate this is mock data
    } else {
      // Otherwise, do not use mock data fallback at all
      console.error('Facebook Ads data fetch failed and mock data is disabled');
      // Propagate the error to show real error messages
      throw new Error(`Failed to fetch Facebook Ads data: ${error.message}`);
    }
  }
}

/**
 * Fetches Facebook Page insights for the specified page and date range
 * 
 * @param {string} pageId - Facebook Page ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {boolean} forceRefresh - Whether to bypass cache and force a fresh API request
 * @returns {Promise<Array>} - Array of Facebook Page insights data
 */
export async function fetchFacebookPageData(pageId, startDate, endDate, forceRefresh = false) {
  try {
    // Check if we should use mock data
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('Using mock Facebook Page data');
      const mockData = generateMockFacebookPageData(startDate, endDate);
      return { ...mockData, mock: true }; // Add a flag to indicate this is mock data
    }
    
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Missing Facebook access token in environment variables');
    }
    
    if (!pageId) {
      throw new Error('Missing Facebook page ID');
    }
    
    console.log('Fetching Facebook Page data for:', {
      pageId,
      startDate,
      endDate,
      accessTokenLength: accessToken.length
    });
    
    // First, check if we have access to the requested page
    // If not, try to find the correct page ID from accessible pages
    let actualPageId = pageId;
    let pageAccessToken = accessToken;
    
    try {
      const pagesResponse = await cachedRequest({
        url: 'https://graph.facebook.com/v22.0/me/accounts',
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,category'
        },
        cacheKey: 'fb-accessible-pages',
        cacheTTL: 60 * 60 * 1000, // 1 hour cache
        maxRetries: 1,
        forceRefresh: false
      });
      
      const pages = pagesResponse.data || [];
      console.log(`Found ${pages.length} accessible pages`);
      
      // Check if the requested page is in the list
      const requestedPage = pages.find(p => p.id === pageId);
      
      if (!requestedPage && pages.length > 0) {
        // If the requested page is not found but we have access to other pages,
        // use the first available page (likely "Marfinetz Plumbing Co.")
        actualPageId = pages[0].id;
        pageAccessToken = pages[0].access_token || accessToken;
        console.warn(`Page ID ${pageId} not accessible. Using ${pages[0].name} (ID: ${actualPageId}) instead.`);
      } else if (requestedPage) {
        // Use the page-specific access token if available
        pageAccessToken = requestedPage.access_token || accessToken;
      }
    } catch (error) {
      console.error('Error checking accessible pages:', error.message);
      // Continue with the original page ID
    }
    
    // For now, let's just get basic page information and return simplified data
    // Facebook's Page Insights API has become more restrictive
    try {
      // Get basic page info
      const pageInfoUrl = `https://graph.facebook.com/v22.0/${actualPageId}`;
      const pageInfoParams = {
        fields: 'name,fan_count,followers_count,talking_about_count',
        access_token: pageAccessToken
      };
      
      console.log('Getting page info from:', pageInfoUrl);
      
      const pageInfo = await cachedRequest({
        url: pageInfoUrl,
        params: pageInfoParams,
        cacheKey: `fb-page-info-${actualPageId}`,
        cacheTTL: 30 * 60 * 1000, // 30 minutes cache
        maxRetries: 2,
        forceRefresh
      });
      
      console.log('Page info received:', pageInfo);
      
      // Since we can't get daily insights easily, let's return a simplified response
      // with the current page stats
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      return [{
        Date: formattedDate,
        page_name: pageInfo.name || 'Unknown Page',
        page_fans: pageInfo.fan_count || pageInfo.followers_count || 0,
        page_engaged_users: pageInfo.talking_about_count || 0,
        page_impressions: 0, // Not available without insights
        message: 'Note: Detailed daily insights require additional Facebook permissions. Showing current page statistics instead.'
      }];
      
    } catch (error) {
      console.error('Error fetching page info:', error.message);
      
      // If even basic page info fails, return minimal data
      return [{
        Date: new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        page_fans: 0,
        page_engaged_users: 0,
        page_impressions: 0,
        error: 'Unable to fetch Facebook Page data. Please check permissions.'
      }];
    }
    
  } catch (error) {
    console.error('Error fetching Facebook Page data:', error.response ? error.response.data : error.message);
    
    // Check if mock data fallback is enabled
    if (process.env.USE_MOCK_DATA_FALLBACK === 'true') {
      console.warn('Falling back to mock Facebook Page data due to error');
      const mockData = generateMockFacebookPageData(startDate, endDate);
      return { ...mockData, mock: true }; // Add a flag to indicate this is mock data
    } else {
      // Otherwise, do not use mock data fallback at all
      console.error('Facebook Page data fetch failed and mock data is disabled');
      // Propagate the error to show real error messages
      throw new Error(`Failed to fetch Facebook Page data: ${error.message}`);
    }
  }
}

/**
 * Generates mock Facebook Ads data for development and testing
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} - Array of mock Facebook Ads data
 */
function generateMockFacebookAdsData(startDate, endDate) {
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

/**
 * Generates mock Facebook Page data for development and testing
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} - Array of mock Facebook Page data
 */
function generateMockFacebookPageData(startDate, endDate) {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let fanCount = Math.floor(Math.random() * 1000) + 500; // Base fan count
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Generate metrics with weekend variance
    const impressions = isWeekend 
      ? Math.floor(Math.random() * 200) + 100 
      : Math.floor(Math.random() * 150) + 50;
    
    const engagedUsers = Math.floor(impressions * (Math.random() * 0.3 + 0.1));
    const postEngagements = Math.floor(engagedUsers * (Math.random() * 2 + 1));
    
    // Simulate gradual fan growth
    fanCount += Math.floor(Math.random() * 5);
    
    const pageViews = Math.floor(Math.random() * 50) + 20;
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    data.push({
      Date: formattedDate,
      page_impressions: impressions,
      page_engaged_users: engagedUsers,
      page_post_engagements: postEngagements,
      page_fans: fanCount,
      page_views_total: pageViews
    });
  }
  
  return data;
}