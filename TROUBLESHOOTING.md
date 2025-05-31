# Troubleshooting Guide

## Google Ads API Authentication Issues

If you're seeing errors related to Google Ads authentication such as:
```
Failed to fetch Google Ads data: No access, refresh token, API key or refresh handler callback is set.
```

Follow these steps to troubleshoot and fix the issue:

### 1. Run the Diagnostic Tool

Use our diagnostic tool to verify your Google Ads credentials:

```bash
node server/utils/credentialsDiagnostic.js
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
# Test Google Ads endpoint
curl "http://localhost:3001/api/google-ads-data?startDate=$(date -v-30d +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)"

# Test Facebook endpoint
curl "http://localhost:3001/api/facebook-ads-data?startDate=$(date -v-30d +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)"
```

### 6. Temporary Workarounds

If you need to continue development while resolving API issues:

1. **Use mock data**: Set `USE_MOCK_DATA=true` in your `.env` file
2. **Enable fallback to mock data**: Set `USE_MOCK_DATA_FALLBACK=true` to use mock data only when API calls fail

## Facebook API Authentication Issues

If Facebook API calls are failing but returning empty arrays, this typically indicates:

1. **Valid credentials**: Your access token is valid, but:
   - There may be no data for the requested date range
   - The account may not have active ads
   - The token may not have sufficient permissions

2. **Check your Facebook credentials**:
   ```
   FACEBOOK_ACCESS_TOKEN=your-access-token
   FACEBOOK_AD_ACCOUNT_ID=act_1234567890
   FACEBOOK_PAGE_ID=your-page-id
   ```

3. **Verify token permissions**:
   - Your access token should have `ads_read` permissions
   - For longer-term usage, consider using a long-lived token

## Need Further Assistance?

If you continue to experience issues after following these steps, please:

1. Check the server logs for additional error details
2. Review the [Google Ads API documentation](https://developers.google.com/google-ads/api/docs/first-call/overview)
3. Ensure your Google Ads developer token has the appropriate access level 