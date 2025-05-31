# Marketing Insights Dashboard API - Quickstart Guide

This is a simplified guide to help you quickly connect your frontend application to the Marketing Insights Dashboard API deployed on Railway.

## Connection Steps

1. Get your Railway deployment URL
2. Update your frontend code to use the Railway URL as the API base URL
3. Make API requests from your frontend code with proper date parameters

## Example Frontend Connection

```javascript
// In your frontend config or .env file
const API_URL = 'https://your-railway-app-url.railway.app';

// Example API call in your React component
import { useState, useEffect } from 'react';
import axios from 'axios';

function MarketingDashboard() {
  const [marketingData, setMarketingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Set your date range
  const startDate = '2023-03-01';
  const endDate = '2023-03-31';
  
  useEffect(() => {
    // Fetch the combined marketing data
    axios.get(`${API_URL}/api/marketing-data`, {
      params: { startDate, endDate }
    })
      .then(response => {
        setMarketingData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching marketing data:', err);
        setError(err.response?.data?.error || 'Failed to fetch data');
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading marketing data...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Render your dashboard with the data
  return (
    <div>
      {/* Your dashboard components using marketingData */}
    </div>
  );
}
```

## Available Endpoints

All endpoints require `startDate` and `endDate` query parameters in 'YYYY-MM-DD' format.

- **Combined Marketing Data**: `GET /api/marketing-data`
- **Google Ads Data**: `GET /api/google-ads-data`
- **Facebook Ads Data**: `GET /api/facebook-ads-data` 
- **Facebook Page Data**: `GET /api/facebook-page-data`
- **Health Check**: `GET /health`

## Handling Errors

The API provides detailed error messages and troubleshooting steps when things go wrong:

```javascript
axios.get(`${API_URL}/api/marketing-data`, {
  params: { startDate, endDate }
})
  .catch(error => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 400) {
        // Handle missing or invalid parameters
        console.error('Invalid request:', data.error);
      } else if (status === 500) {
        // Handle server errors with troubleshooting steps
        console.error('Server error:', data.error);
        console.log('Troubleshooting:', data.details);
        
        // Check if we have partial data with warnings
        if (data.data && data.warnings) {
          console.warn('Using partial data with warnings:', data.warnings);
          // Use the partial data
          return data.data;
        }
      }
    }
    // Re-throw or handle the error
    throw error;
  });
```

For more detailed information, refer to the full [API_DOCUMENTATION.md](./API_DOCUMENTATION.md). 