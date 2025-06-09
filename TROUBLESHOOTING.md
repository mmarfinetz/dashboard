# Troubleshooting Guide for Marketing Insights Dashboard

## Testing and Debug Tools (Updated June 2025)

We've consolidated all testing and debugging tools into a centralized test suite:

### Running Tests

```bash
# Run the interactive test menu
npm test

# Run all tests
npm run test:all

# Run specific tests
npm run test:dashboard    # Run dashboard diagnostics
npm run test:railway      # Test Railway API connection
npm run test:local        # Test local API connection
npm run test:facebook     # Check Facebook credentials
npm run test:google       # Check Google Ads credentials
```

The test suite includes tools for:
- API server connectivity checks
- Credential validation
- Identifying and fixing hardcoded localhost URLs
- Verifying environment variables
- Testing all API endpoints

### Fixing Production Deployment Issues

If the dashboard is not displaying live data on Vercel:

1. **Run the dashboard test**:
   ```bash
   npm run test:dashboard
   ```
   This will identify and fix common issues like hardcoded URLs that don't work in production.

2. **Check server logs**: Review Vercel logs for any API connection errors

3. **Verify API deployment**: Ensure your backend API is properly deployed and accessible from your frontend

4. **CORS settings**: Check that your API server allows requests from your deployed frontend domain

## Quickstart

If you're experiencing issues with the dashboard, follow these steps first:

1. **Check API credentials**
   ```
   # Run all tests 
   npm run test:all
   
   # Or check specific services
   npm run test:facebook
   npm run test:google
   ```

2. **Clear the API cache**
   ```
   # Clear all cached API responses
   npm run clear-cache
   ```

3. **Check API status**
   ```
   # Check API server status and configuration (local)
   curl http://localhost:3001/api/status
   
   # Check API server status and configuration (production)
   curl https://perfect-light-production.up.railway.app/api/status
   ```
   
   ⚠️ **IMPORTANT**: The dashboard now uses the production backend URL (`https://perfect-light-production.up.railway.app`) when deployed and the local URL (`http://localhost:3001`) during local development.

4. **Use the dashboard refresh button**
   The dashboard includes a refresh button to fetch fresh data without clearing the entire cache.

## Google Ads API Authentication Issues

If you're seeing errors related to Google Ads authentication such as:
```
Failed to fetch Google Ads data: No access, refresh token, API key or refresh handler callback is set.
```

Follow these steps to troubleshoot and fix the issue:

### 1. Run the Diagnostic Tool

Use our diagnostic tool to verify your Google Ads credentials:

```bash
npm run test:google
```

This will test your credentials and provide specific guidance on what might be wrong.

### 2. Check Environment Variables

Ensure all required environment variables are set in your `.env` file:

```
GOOGLE_ADS_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

### 3. Common Google Ads API Issues

#### Refresh Token Issues
- **Invalid format**: Refresh tokens should be long strings without spaces
- **Expired token**: Google OAuth refresh tokens can expire if unused for an extended period
- **Missing scopes**: The token must be generated with the correct OAuth scopes for Google Ads

#### Client ID/Secret Issues
- **Mismatch**: Make sure the client ID and secret are from the same Google Cloud project
- **Inactive project**: The Google Cloud project must be active and have billing enabled
- **API not enabled**: Ensure the Google Ads API is enabled in your Google Cloud Console

#### Customer ID Issues
- **Wrong format**: Should be a numeric string without dashes or formatting
- **Incorrect ID**: Verify this is the correct Google Ads account ID
- **Permissions**: The account associated with your refresh token must have access to this customer ID

### 4. Regenerating a Refresh Token

If your refresh token is expired or invalid, you'll need to generate a new one:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID or create a new one
5. Add the necessary scopes (for Google Ads, include `https://www.googleapis.com/auth/adwords`)
6. Use the OAuth 2.0 Playground or a custom script to generate a new refresh token
7. Update your `.env` file with the new token

### 5. Test Each Endpoint Separately

Test the individual endpoints to isolate which service is causing problems:

```bash
# Test Google Ads endpoint (local)
curl "http://localhost:3001/api/google-ads-data?startDate=$(date -v-30d +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)"

# Test Google Ads endpoint (production)
curl "https://perfect-light-production.up.railway.app/api/google-ads-data?startDate=$(date -v-30d +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)"

# Test Facebook endpoint (local)
curl "http://localhost:3001/api/facebook-ads-data?startDate=$(date -v-30d +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)"

# Test Facebook endpoint (production)
curl "https://perfect-light-production.up.railway.app/api/facebook-ads-data?startDate=$(date -v-30d +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)"
```

### 6. Temporary Workarounds

If you need to continue development while resolving API issues:

1. **Use mock data**: Set `USE_MOCK_DATA=true` in your `.env` file
2. **Enable fallback to mock data**: Set `USE_MOCK_DATA_FALLBACK=true` to use mock data only when API calls fail

## Facebook API Authentication Issues

### Run the Facebook Diagnostic Tool

Our diagnostic tool can identify most Facebook API issues:

```bash
npm run test:facebook
```

This will test your credentials and help diagnose common issues.

### Production Backend URL

This application is now configured to use the deployed backend at:
```
https://perfect-light-production.up.railway.app
```

This change means:
- When running locally, the dashboard will use the local API server at `http://localhost:3001`
- When deployed, the dashboard will automatically connect to the production API server
- You need to ensure the Railway deployment is running for production use

### Common Facebook API Issues

If Facebook API calls are failing or returning only old data (e.g., data from March 31 and April 1):

1. **Access Token Expiration**:
   - Facebook tokens expire - you may need to generate a new one
   - The diagnostic tool will tell you if your token has expired

2. **Permission Scopes**:
   - Your token needs `ads_read` and possibly `pages_read_engagement` permissions
   - Insufficient permissions may result in limited/old data

3. **Campaign ID Filter**:
   - By default, we now filter for campaign ID: 23846212577230793
   - If this campaign doesn't exist or isn't accessible, you'll get limited data

4. **Ad Account Status**:
   - If your ad account is paused or restricted, you may see only historical data

5. **Important: Use the correct Facebook Page ID**:
   - The system now defaults to Page ID: 476439392229934
   - The previously used ID (61572431044574) is incorrect and will not work
   - The system will automatically correct this during startup

6. **Check your Facebook credentials**:
   ```
   FACEBOOK_ACCESS_TOKEN=your-access-token
   FACEBOOK_AD_ACCOUNT_ID=act_1234567890
   FACEBOOK_PAGE_ID=476439392229934  # Use this correct page ID!
   ```

6. **Generate a new Long-Lived Token**:
   - Facebook access tokens typically expire after 60 days
   - Generate a new long-lived token through the Facebook Developer Console

## Dashboard Loading Issues

If the dashboard isn't loading data properly or seems stuck:

1. **Check API Status**
   ```
   # Local API
   curl http://localhost:3001/api/status
   
   # Production API
   curl https://perfect-light-production.up.railway.app/api/status
   ```

2. **Review Server Logs**
   Look for errors in the server console, especially when data loading fails

3. **Verify Async Loading**
   - Both Google Ads and Facebook data should load in parallel
   - If one platform fails, the other should still be accessible

4. **Browser Console**
   - Check browser console for network requests and errors
   - Verify that both API endpoints are being called

5. **Try Refresh Button**
   - Use the refresh button in the dashboard to fetch fresh data
   - This bypasses the cache and makes new API requests

## API Caching Issues

If data seems stale or outdated:

1. **Clear the Cache**
   ```
   npm run clear-cache
   ```

2. **Force Refresh for Specific Request**
   Add the `forceRefresh=true` parameter to API requests:
   ```
   # Local API
   curl "http://localhost:3001/api/facebook-ads-data?startDate=2025-03-01&endDate=2025-05-31&forceRefresh=true"
   
   # Production API
   curl "https://perfect-light-production.up.railway.app/api/facebook-ads-data?startDate=2025-03-01&endDate=2025-05-31&forceRefresh=true"
   ```

3. **Check Cache Statistics**
   ```
   # Local API
   curl http://localhost:3001/api/status
   
   # Production API
   curl https://perfect-light-production.up.railway.app/api/status
   ```
   Look at the `cache` section to see how many entries are stored and their age

## Need Further Assistance?

If you continue to experience issues after following these steps, please:

1. Check the server logs for additional error details
2. Review the [Google Ads API documentation](https://developers.google.com/google-ads/api/docs/first-call/overview) or [Facebook Marketing API documentation](https://developers.facebook.com/docs/marketing-api/)
3. Run our diagnostic tools to verify your credentials
4. Ensure both API services have the appropriate access level and permissions