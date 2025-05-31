import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchGoogleAdsData } from './services/googleAdsService.js';
import { fetchFacebookAdsData, fetchFacebookPageData } from './services/facebookService.js';
import { mergeAndFormatData } from './utils/dataFormatter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://marketing-insights-dashboard-for-plumbing-company.vercel.app'
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Combined data endpoint
app.get('/api/marketing-data', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required query parameters' });
    }
    
    // Fetch data from both platforms
    let googleAdsData = [];
    let facebookAdsData = [];
    let errorDetails = {};
    
    // Try to fetch Google Ads data with error handling
    try {
      googleAdsData = await fetchGoogleAdsData(startDate, endDate);
    } catch (error) {
      console.error('Error fetching Google Ads data:', error);
      errorDetails.googleAds = {
        message: error.message,
        troubleshooting: error.message.includes('refresh token') 
          ? "Check your Google Ads refresh token validity and format"
          : "Verify all Google Ads credentials are correct"
      };
    }
    
    // Try to fetch Facebook data with error handling
    try {
      facebookAdsData = await fetchFacebookAdsData(startDate, endDate);
    } catch (error) {
      console.error('Error fetching Facebook Ads data:', error);
      errorDetails.facebookAds = {
        message: error.message,
        troubleshooting: "Verify your Facebook access token and ad account ID"
      };
    }
    
    // If both failed, return error with details for both services
    if (Object.keys(errorDetails).length === 2) {
      return res.status(500).json({
        error: 'Failed to fetch marketing data from both services',
        details: errorDetails
      });
    }
    
    // Merge and format available data
    const combinedData = mergeAndFormatData(googleAdsData, facebookAdsData);
    
    // Return data with warnings about any service that failed
    if (Object.keys(errorDetails).length > 0) {
      res.json({
        data: combinedData,
        warnings: errorDetails
      });
    } else {
      res.json(combinedData);
    }
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch marketing data', 
      details: error.message
    });
  }
});

// Google Ads specific endpoint
app.get('/api/google-ads-data', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required query parameters' });
    }
    
    const googleAdsData = await fetchGoogleAdsData(startDate, endDate);
    res.json(googleAdsData);
  } catch (error) {
    console.error('Error fetching Google Ads data:', error);
    
    // Enhanced error response with troubleshooting guidance
    const errorResponse = { 
      error: 'Failed to fetch Google Ads data', 
      details: error.message,
      mock: false
    };
    
    // Add troubleshooting steps based on error type
    if (error.message.includes('refresh token')) {
      errorResponse.troubleshooting = [
        "1. Verify your GOOGLE_ADS_REFRESH_TOKEN is correct and not expired",
        "2. Make sure the refresh token doesn't contain whitespace or special characters",
        "3. Regenerate a new refresh token in Google Cloud Console if needed",
        "4. Ensure the Google Ads API is enabled in your Google Cloud project"
      ];
    } else if (error.message.includes('Missing required Google Ads credentials')) {
      errorResponse.troubleshooting = [
        "1. Check that all required environment variables are set in your .env file",
        "2. Required credentials: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID",
        "3. Restart the server after updating environment variables"
      ];
    } else if (error.message.includes('invalid_client') || error.message.includes('client credentials')) {
      errorResponse.troubleshooting = [
        "1. Verify your GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET are correct",
        "2. Ensure the client ID and secret are from the same Google Cloud project",
        "3. Check that your OAuth consent screen is properly configured"
      ];
    } else if (error.message.includes('customer_id') || error.message.includes('account not found')) {
      errorResponse.troubleshooting = [
        "1. Verify your GOOGLE_ADS_CUSTOMER_ID is correct (should be in format: 1234567890)",
        "2. Confirm you have access to this Google Ads account",
        "3. Ensure the Google Ads account is linked to your Google Cloud project"
      ];
    }
    
    res.status(500).json(errorResponse);
  }
});

// Facebook Ads specific endpoint
app.get('/api/facebook-ads-data', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required query parameters' });
    }
    
    const facebookAdsData = await fetchFacebookAdsData(startDate, endDate);
    res.json(facebookAdsData);
  } catch (error) {
    console.error('Error fetching Facebook Ads data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Facebook Ads data', 
      details: error.message,
      mock: false
    });
  }
});

// Facebook Page specific endpoint
app.get('/api/facebook-page-data', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required query parameters' });
    }
    
    const pageId = process.env.FACEBOOK_PAGE_ID;
    
    if (!pageId) {
      return res.status(500).json({ 
        error: 'Missing Facebook Page ID',
        details: 'FACEBOOK_PAGE_ID environment variable is not set'
      });
    }
    
    const facebookPageData = await fetchFacebookPageData(pageId, startDate, endDate);
    res.json(facebookPageData);
  } catch (error) {
    console.error('Error fetching Facebook Page data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Facebook Page data', 
      details: error.message,
      mock: false
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Google OAuth callback endpoint
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code is missing');
    }
    
    console.log('Received authorization code:', code.substring(0, 10) + '...');
    
    // Exchange the authorization code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', 
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3001/auth/google/callback',
        grant_type: 'authorization_code'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Extract tokens from response
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Log tokens (the refresh token is what we need for the API)
    console.log('===== GOOGLE ADS API TOKENS =====');
    console.log('Access Token:', access_token ? access_token.substring(0, 10) + '...' : 'Not received');
    console.log('Refresh Token:', refresh_token ? refresh_token.substring(0, 10) + '...' : 'Not received');
    console.log('Expires In:', expires_in, 'seconds');
    console.log('');
    console.log('REFRESH TOKEN (COPY THIS TO YOUR .ENV FILE):');
    console.log(refresh_token || 'No refresh token received. Make sure to include access_type=offline and prompt=consent in your auth URL');
    console.log('=====================================');
    
    // Show success page
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #4CAF50; }
            .code { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-wrap: break-word; }
            .instructions { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Authentication Successful!</h1>
            <p>Your Google Ads refresh token has been generated.</p>
            
            ${refresh_token ? `
              <h2>Your Refresh Token:</h2>
              <div class="code">${refresh_token}</div>
              
              <div class="instructions">
                <h3>Next steps:</h3>
                <ol>
                  <li>Copy this refresh token</li>
                  <li>Add it to your <code>.env</code> file as <code>GOOGLE_ADS_REFRESH_TOKEN=your-token</code></li>
                  <li>Restart your server</li>
                </ol>
              </div>
            ` : `
              <h2>Error: No Refresh Token Received</h2>
              <p>Make sure your authorization URL includes <code>access_type=offline</code> and <code>prompt=consent</code>.</p>
            `}
            
            <p>You can close this window now.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    
    // Show error page with troubleshooting steps
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #f44336; }
            .error { background: #ffebee; padding: 15px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Authentication Failed</h1>
            <div class="error">
              <h3>Error Details:</h3>
              <p>${error.response?.data?.error_description || error.response?.data?.error || error.message}</p>
            </div>
            
            <h3>Troubleshooting Steps:</h3>
            <ol>
              <li>Ensure your Google Cloud project has the Google Ads API enabled</li>
              <li>Verify that your redirect URI matches exactly in both the auth URL and Google Cloud Console</li>
              <li>Check that your client ID and client secret are correct</li>
              <li>Try generating a new authorization URL</li>
            </ol>
          </div>
        </body>
      </html>
    `);
  }
});

// Log environment variables for debugging
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  USE_MOCK_DATA: process.env.USE_MOCK_DATA,
  USE_MOCK_DATA_FALLBACK: process.env.USE_MOCK_DATA_FALLBACK,
  FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN ? 'Set' : 'Not set',
  FACEBOOK_AD_ACCOUNT_ID: process.env.FACEBOOK_AD_ACCOUNT_ID ? 'Set' : 'Not set',
  FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID ? 'Set' : 'Not set',
  GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID ? 'Set' : 'Not set',
  GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET ? 'Set' : 'Not set',
  GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? 'Set' : 'Not set',
  GOOGLE_ADS_REFRESH_TOKEN: process.env.GOOGLE_ADS_REFRESH_TOKEN ? 'Set' : 'Not set',
  GOOGLE_ADS_CUSTOMER_ID: process.env.GOOGLE_ADS_CUSTOMER_ID ? 'Set' : 'Not set'
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Marketing API server running on port ${PORT}`);
});

export default app; // For testing purposes