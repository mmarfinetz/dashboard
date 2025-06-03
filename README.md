# Marketing Insights Dashboard for Plumbing Company

A React-based dashboard application that provides detailed analytics and insights for marketing campaigns across Google Ads and Facebook platforms.

## Features

- Parallel data loading from Google Ads and Facebook Marketing APIs
- Comprehensive metrics tracking including clicks, impressions, costs, CTR, CPC, and CPM
- Dynamic filtering by date ranges (7 days, 30 days, all-time)
- Responsive charts and visualizations using Recharts
- Performance insights with top-performing days and cost efficiency metrics
- Audience demographics analysis for Facebook campaigns
- Mobile-responsive design with Tailwind CSS
- API response caching with auto-expiry
- Automatic retry logic for API failures
- Campaign-specific data filtering

## Technical Architecture

The application consists of:

1. **Frontend**: React.js with Recharts for data visualization and Tailwind CSS for styling
2. **Backend**: Express.js server that interacts with marketing APIs
3. **API Integration**: Services for Google Ads and Facebook Marketing API data fetching
4. **Data Processing**: Utilities for merging, formatting, and calculating metrics

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Google Ads API credentials
- Facebook Marketing API credentials with `ads_read` permissions
- Campaign ID for Facebook Ads data access

### Live Data Configuration

For the dashboard to work with live data in production:

1. **Use the Railway-Deployed Backend API**
   - The backend API is already deployed at: https://perfect-light-production.up.railway.app
   - You can test the connection to this API by running:
   ```bash
   npm run test:railway
   ```

2. **Update API URLs to use Railway**
   - The dashboard has been updated to automatically use the Railway backend in production
   - To manually fix URLs if needed, run:
   ```bash
   npm run test:dashboard
   ```

3. **Run Diagnostics**
   - Test your API credentials and connections:
   ```bash
   npm run test:all
   ```

4. **Deploy the Frontend**
   - Deploy the updated frontend code to Vercel
   - The dashboard will automatically connect to the Railway API server
   - Visit: https://marketing-insights-dashboard-for-plumbing-company.vercel.app/

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd marketing-insights-dashboard
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file based on `.env.example` with your API credentials:
```
cp .env.example .env
```

4. Start the development server:
```
npm run dev:all
```

This will start both the React frontend and the Express backend concurrently.

## API Services

### Google Ads API

The application connects to the Google Ads API to fetch campaign performance data including:
- Clicks
- Impressions
- Cost
- CPC (Cost Per Click)

### Facebook Marketing API

The dashboard fetches Facebook marketing insights including:
- Page engagement metrics
- Ad performance data
- Audience demographics
- Content effectiveness

## Development Mode

During development, the application can use mock data to simulate API responses:

```
USE_MOCK_DATA=true npm run dev:all
```

## Deployment

For production deployment:

1. Build the frontend:
```
npm run build
```

2. Start the production server:
```
npm start
```

## Environment Configuration

Configure your environment variables in a `.env` file:

```
# Server configuration
PORT=3001
NODE_ENV=production
USE_MOCK_DATA=false
USE_MOCK_DATA_FALLBACK=true

# Google Ads API credentials
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id

# Facebook API credentials
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id
FACEBOOK_PAGE_ID=your_page_id
```

## Testing and Diagnostic Tools

The application includes testing and diagnostic utilities for API connection verification:

```bash
# Run interactive test menu
npm test

# Run all tests
npm run test:all

# Test specific components
npm run test:local       # Test local API connection
npm run test:railway     # Test Railway API connection
npm run test:facebook    # Test Facebook API credentials
npm run test:google      # Test Google Ads API credentials
npm run test:dashboard   # Run dashboard debug utilities

# Clear API cache
npm run clear-cache
```

See the [tests/README.md](tests/README.md) file for more information about the test suite.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.