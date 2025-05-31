# Marketing Insights Dashboard API Documentation

This document provides details on how to connect your frontend application to the Marketing Insights Dashboard API deployed on Railway.

## Base URL

```
https://your-railway-app-url.railway.app
```

Replace `your-railway-app-url.railway.app` with your actual Railway deployment URL.

## Authentication

The API currently does not require authentication tokens for requests. It relies on properly configured service credentials in environment variables on the server.

## Required Environment Variables

The following environment variables must be configured on your Railway deployment:

### Google Ads
- `GOOGLE_ADS_CLIENT_ID` - Google Cloud OAuth client ID
- `GOOGLE_ADS_CLIENT_SECRET` - Google Cloud OAuth client secret
- `GOOGLE_ADS_DEVELOPER_TOKEN` - Google Ads API developer token
- `GOOGLE_ADS_REFRESH_TOKEN` - OAuth refresh token for Google Ads API
- `GOOGLE_ADS_CUSTOMER_ID` - Google Ads customer ID

### Facebook
- `FACEBOOK_ACCESS_TOKEN` - Facebook API access token
- `FACEBOOK_AD_ACCOUNT_ID` - Facebook Ad account ID
- `FACEBOOK_PAGE_ID` - Facebook Page ID

### Optional Settings
- `USE_MOCK_DATA` - Set to 'true' to always use mock data (for development)
- `USE_MOCK_DATA_FALLBACK` - Set to 'true' to use mock data when API calls fail

## API Endpoints

### 1. Combined Marketing Data

Returns aggregated data from both Google Ads and Facebook platforms.

- **URL**: `/api/marketing-data`
- **Method**: `GET`
- **URL Parameters**:
  - `startDate` (required): Start date in 'YYYY-MM-DD' format
  - `endDate` (required): End date in 'YYYY-MM-DD' format

#### Success Response

- **Code**: 200
- **Content Example**:
```json
{
  "performance": [
    {
      "date": "2023-01-01",
      "impressions": 5000,
      "clicks": 120,
      "ctr": 0.024,
      "conversions": 5,
      "conversionRate": 0.0417,
      "spend": 50.25,
      "cpc": 0.4188,
      "source": "combined"
    },
    // Additional dates...
  ],
  "totals": {
    "impressions": 25000,
    "clicks": 600,
    "ctr": 0.024,
    "conversions": 25,
    "conversionRate": 0.0417,
    "spend": 251.25,
    "cpc": 0.4188
  },
  "platforms": {
    "google": {
      "impressions": 15000,
      "clicks": 400,
      "conversions": 15,
      "spend": 150.75
    },
    "facebook": {
      "impressions": 10000,
      "clicks": 200,
      "conversions": 10,
      "spend": 100.50
    }
  }
}
```

#### Error Response

- **Code**: 400 BAD REQUEST
  - **Content**: `{ "error": "Both startDate and endDate are required query parameters" }`

- **Code**: 500 INTERNAL SERVER ERROR
  - **Content**:
```json
{
  "error": "Failed to fetch marketing data from both services",
  "details": {
    "googleAds": {
      "message": "Error message details",
      "troubleshooting": "Troubleshooting steps"
    },
    "facebookAds": {
      "message": "Error message details",
      "troubleshooting": "Verify your Facebook access token and ad account ID"
    }
  }
}
```

#### Partial Service Failure

If one service fails but the other succeeds:

```json
{
  "data": [/* Combined data from the working service */],
  "warnings": {
    "googleAds": {
      "message": "Error message",
      "troubleshooting": "Troubleshooting steps"
    }
  }
}
```

### 2. Google Ads Data

Returns data from Google Ads campaigns only.

- **URL**: `/api/google-ads-data`
- **Method**: `GET`
- **URL Parameters**:
  - `startDate` (required): Start date in 'YYYY-MM-DD' format
  - `endDate` (required): End date in 'YYYY-MM-DD' format

#### Success Response

- **Code**: 200
- **Content Example**:
```json
[
  {
    "date": "2023-01-01",
    "impressions": 3000,
    "clicks": 80,
    "conversions": 3,
    "spend": 30.15,
    "ctr": 0.0267,
    "cpc": 0.3769,
    "conversionRate": 0.0375,
    "source": "google"
  },
  // Additional dates...
]
```

#### Error Response

- **Code**: 400 BAD REQUEST
  - **Content**: `{ "error": "Both startDate and endDate are required query parameters" }`

- **Code**: 500 INTERNAL SERVER ERROR
  - **Content**: Detailed error with troubleshooting steps

### 3. Facebook Ads Data

Returns data from Facebook ad campaigns only.

- **URL**: `/api/facebook-ads-data`
- **Method**: `GET`
- **URL Parameters**:
  - `startDate` (required): Start date in 'YYYY-MM-DD' format
  - `endDate` (required): End date in 'YYYY-MM-DD' format

#### Success Response

- **Code**: 200
- **Content Example**:
```json
[
  {
    "date": "2023-01-01",
    "impressions": 2000,
    "clicks": 40,
    "conversions": 2,
    "spend": 20.10,
    "ctr": 0.02,
    "cpc": 0.5025,
    "conversionRate": 0.05,
    "source": "facebook"
  },
  // Additional dates...
]
```

#### Error Response

- **Code**: 400 BAD REQUEST
  - **Content**: `{ "error": "Both startDate and endDate are required query parameters" }`

- **Code**: 500 INTERNAL SERVER ERROR
  - **Content**: `{ "error": "Failed to fetch Facebook Ads data", "details": "Error message" }`

### 4. Facebook Page Data

Returns engagement metrics from the connected Facebook page.

- **URL**: `/api/facebook-page-data`
- **Method**: `GET`
- **URL Parameters**:
  - `startDate` (required): Start date in 'YYYY-MM-DD' format
  - `endDate` (required): End date in 'YYYY-MM-DD' format

#### Success Response

- **Code**: 200
- **Content Example**:
```json
{
  "page_likes": 1250,
  "page_engagement": 320,
  "post_engagement": [
    {
      "date": "2023-01-01",
      "likes": 45,
      "comments": 12,
      "shares": 5
    },
    // Additional dates...
  ]
}
```

#### Error Response

- **Code**: 400 BAD REQUEST
  - **Content**: `{ "error": "Both startDate and endDate are required query parameters" }`

- **Code**: 500 INTERNAL SERVER ERROR
  - **Content**: `{ "error": "Failed to fetch Facebook Page data", "details": "Error message" }`

### 5. Health Check

Simple endpoint to verify the API is running.

- **URL**: `/health`
- **Method**: `GET`

#### Success Response

- **Code**: 200
- **Content**: `{ "status": "healthy", "timestamp": "2023-04-12T15:30:45.123Z" }`

## Frontend Integration Example

Here's how to connect your React frontend to the deployed API:

```javascript
import axios from 'axios';

// Set your API base URL
const API_BASE_URL = 'https://your-railway-app-url.railway.app';

// Function to fetch combined marketing data
async function fetchMarketingData(startDate, endDate) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/marketing-data`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    
    // Check for specific error messages
    if (error.response) {
      const errorMessage = error.response.data.error || 'Unknown error occurred';
      const errorDetails = error.response.data.details || {};
      
      // Handle specific error cases
      if (error.response.data.warnings) {
        // Partial data available with warnings
        return error.response.data;
      }
      
      throw new Error(`API Error: ${errorMessage}`);
    }
    
    throw new Error('Network error when connecting to API');
  }
}

// Example usage in a component:
/*
import { useState, useEffect } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    
    fetchMarketingData(startDate, endDate)
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  // Render dashboard using the data...
}
*/
```

## Troubleshooting

### Common Errors

1. **Missing Date Parameters**
   - Ensure both `startDate` and `endDate` are provided in the correct format (YYYY-MM-DD)

2. **Google Ads Authentication Issues**
   - Verify all Google Ads environment variables are correctly set
   - Check if your refresh token has expired (they typically last 6 months)
   - Make sure your Google Ads API access is properly configured

3. **Facebook API Issues**
   - Verify your Facebook access token is valid and has the necessary permissions
   - Check that the Ad Account ID is correct and you have access to it
   - Ensure your Facebook app has the necessary API permissions enabled

### Getting New Google Ads Refresh Token

If your Google Ads refresh token has expired, you can generate a new one by:

1. Visit the Google Cloud Console and ensure your OAuth consent screen is properly configured
2. Generate an authorization URL with the correct scopes
3. Use the OAuth callback endpoint `/auth/google/callback` to exchange the code for a refresh token
4. Update the `GOOGLE_ADS_REFRESH_TOKEN` environment variable with the new token

## Need Help?

For additional support with the API, please refer to:
- The server-side logs in your Railway dashboard
- The TROUBLESHOOTING.md file in the project repository 