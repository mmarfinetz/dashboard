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
      return generateMockFacebookAdsData(startDate, endDate);
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
    
    // Create params for the insights request
    const params = {
      level: 'campaign',
      campaign_ids: ['23846212577230793'], // Target specific campaign ID
      fields: 'account_name,campaign_name,campaign_id,spend,impressions,clicks,cpc,ctr,reach,actions,date_start,date_stop',
      time_range: JSON.stringify({
        since: startDate,
        until: endDate
      }),
      time_increment: 1,
      access_token: accessToken
    };
    
    // Fetch insights from Facebook API with caching and retry logic
    const url = `https://graph.facebook.com/v19.0/act_${cleanAccountId}/insights`;
    
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
      console.warn('Facebook API returned empty dataset');
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
    
    // Do not use mock data fallback at all
    console.error('Facebook Ads data fetch failed and mock data is disabled');
    // Propagate the error to show real error messages
    
    // Otherwise, propagate the error
    throw new Error(`Failed to fetch Facebook Ads data: ${error.message}`);
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
      return generateMockFacebookPageData(startDate, endDate);
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
    
    // Define metrics to fetch
    const metrics = [
      'page_impressions',
      'page_engaged_users',
      'page_post_engagements',
      'page_fans',
      'page_fan_adds',
      'page_views_total',
      'page_negative_feedback'
    ].join(',');
    
    // Fetch page insights using cached request with retry logic
    const url = `https://graph.facebook.com/v19.0/${pageId}/insights`;
    const params = {
      metric: metrics,
      period: 'day',
      since: new Date(startDate).getTime() / 1000,
      until: new Date(endDate).getTime() / 1000,
      access_token: accessToken
    };
    
    console.log('Making request to:', url);
    console.log('With params:', JSON.stringify({...params, access_token: '[REDACTED]'}, null, 2));
    
    const responseData = await cachedRequest({
      url,
      params,
      cacheKey: `fb-page-${pageId}-${startDate}-${endDate}`,
      cacheTTL: 30 * 60 * 1000, // 30 minutes cache
      maxRetries: 3,
      forceRefresh
    });
    
    // Create a response-like structure to match the existing code
    const response = { data: responseData };
    
    if (!response.data) {
      console.error('No data in Facebook Page API response');
      throw new Error('No data returned from Facebook Page API');
    }
    
    console.log('Facebook Page API Response:', JSON.stringify(response.data, null, 2));
    
    const data = response.data.data || [];
    
    // Process and organize the data by date
    const dateMap = {};
    
    data.forEach(metric => {
      const metricName = metric.name;
      
      metric.values.forEach(value => {
        const date = new Date(value.end_time);
        const formattedDate = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        if (!dateMap[formattedDate]) {
          dateMap[formattedDate] = {
            Date: formattedDate,
            page_impressions: 0,
            page_engaged_users: 0,
            page_post_engagements: 0,
            page_fans: 0,
            page_views_total: 0
          };
        }
        
        dateMap[formattedDate][metricName] = value.value;
      });
    });
    
    return Object.values(dateMap);
  } catch (error) {
    console.error('Error fetching Facebook Page data:', error.response ? error.response.data : error.message);
    
    // Do not use mock data fallback at all
    console.error('Facebook Page data fetch failed and mock data is disabled');
    // Propagate the error to show real error messages
    
    // Otherwise, propagate the error
    throw new Error(`Failed to fetch Facebook Page data: ${error.message}`);
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