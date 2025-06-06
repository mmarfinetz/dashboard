import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import FacebookDashboard from './FacebookDashboard';

// Helper function to determine the appropriate API base URL based on the environment
const getApiBaseUrl = () => {
  // For now, always use the local server since Railway is down
  return 'http://localhost:3001';
  
  // Once Railway is fixed, use this code:
  /*
  const isProduction = window.location.hostname !== 'localhost';
  if (isProduction) {
    return 'https://perfect-light-production.up.railway.app';
  } else {
    return 'http://localhost:3001';
  }
  */
};

const GoogleAdsDashboard = ({ preloadedData, isLoading: parentLoading, error: parentError }) => {
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(parentLoading !== undefined ? parentLoading : true);
  const [error, setError] = useState(parentError || null);
  const [timeframe, setTimeframe] = useState('all');
  const [dataStats, setDataStats] = useState({
    totalClicks: 0,
    totalImpressions: 0,
    totalCost: 0,
    overallAvgCPC: 0,
    overallAvgCTR: 0,
    overallAvgCPM: 0,
    weeklyDataArray: [],
    monthlyDataArray: []
  });
  
  // Parse string data into proper formats
  const parseData = (data) => {
    return data.map(item => ({
      date: item.Date,
      clicks: parseInt(item.Clicks),
      impressions: parseInt(item.Impressions.replace(/,/g, '')),
      avgCPC: parseFloat(item.Avg_CPC.replace('$', '')),
      cost: parseFloat(item.Cost.replace('$', '')),
      // Calculate CTR and CPM here as they were in the Python script
      ctr: parseInt(item.Impressions.replace(/,/g, '')) > 0 ? (parseInt(item.Clicks) / parseInt(item.Impressions.replace(/,/g, ''))) * 100 : 0,
      cpm: parseInt(item.Impressions.replace(/,/g, '')) > 0 ? (parseFloat(item.Cost.replace('$', '')) / parseInt(item.Impressions.replace(/,/g, ''))) * 1000 : 0,
      week: getWeekNumber(new Date(item.Date))
    }));
  };

  // Helper function to get week number from date
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Use preloaded data if available, otherwise fetch data
  useEffect(() => {
    if (preloadedData) {
      setRawData(preloadedData);
      const parsedData = parseData(preloadedData);
      setData(parsedData);
      calculateDataStats(parsedData);
      setIsLoading(false);
    } else {
      fetchMarketingData();
    }
  }, [preloadedData]);

  // Handle parent loading state changes
  useEffect(() => {
    if (parentLoading !== undefined) {
      setIsLoading(parentLoading);
    }
  }, [parentLoading]);

  // Handle parent error changes
  useEffect(() => {
    if (parentError !== undefined) {
      setError(parentError);
    }
  }, [parentError]);
  
  // Fetch data from the API (only if no preloaded data)
  const fetchMarketingData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate a reasonable date range based on current date
      const endDate = new Date();
      const startDate = new Date();
      // Go back 90 days for data
      startDate.setDate(endDate.getDate() - 90);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Get the appropriate base URL depending on the environment
      const apiBase = getApiBaseUrl();
      
      // Fetch data from our API
      const apiUrl = `${apiBase}/api/google-ads-data?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
      
      console.log(`Fetching Google Ads data from: ${apiUrl}`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch marketing data: ${response.statusText}`);
      }
      
      const fetchedRawData = await response.json();
      setRawData(fetchedRawData);
      
      // Parse the raw data
      const parsedData = parseData(fetchedRawData);
      setData(parsedData);
      
      // Calculate summary stats
      calculateDataStats(parsedData);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setIsLoading(false);
      
      // Fallback to sample data if API fails
      useSampleData();
    }
  };
  
  // Fallback to sample data if API call fails
  const useSampleData = () => {
    // A few rows of sample data for fallback
    const sampleRawData = [
      { Date: 'Mon, Apr 8, 2025', Clicks: '45', Impressions: '3,158', Avg_CPC: '$0.42', Cost: '$18.84' },
      { Date: 'Tue, Apr 9, 2025', Clicks: '51', Impressions: '4,358', Avg_CPC: '$0.32', Cost: '$16.37' },
      { Date: 'Wed, Apr 10, 2025', Clicks: '45', Impressions: '2,714', Avg_CPC: '$0.28', Cost: '$12.47' },
      { Date: 'Thu, Apr 11, 2025', Clicks: '39', Impressions: '3,205', Avg_CPC: '$0.42', Cost: '$16.49' },
      { Date: 'Fri, Apr 12, 2025', Clicks: '61', Impressions: '3,883', Avg_CPC: '$0.29', Cost: '$17.48' },
      { Date: 'Sat, Apr 13, 2025', Clicks: '30', Impressions: '4,310', Avg_CPC: '$0.32', Cost: '$9.63' },
      { Date: 'Sun, Apr 14, 2025', Clicks: '25', Impressions: '3,401', Avg_CPC: '$0.53', Cost: '$13.19' }
    ];
    
    setRawData(sampleRawData);
    const parsedData = parseData(sampleRawData);
    setData(parsedData);
    calculateDataStats(parsedData);
  };
  
  // Calculate all stats based on data
  const calculateDataStats = (parsedData) => {
    // KPI calculations
    const totalClicks = parsedData.reduce((sum, item) => sum + item.clicks, 0);
    const totalImpressions = parsedData.reduce((sum, item) => sum + item.impressions, 0);
    const totalCost = parsedData.reduce((sum, item) => sum + item.cost, 0);
    const overallAvgCPC = totalClicks > 0 ? (totalCost / totalClicks) : 0;
    const overallAvgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
    const overallAvgCPM = totalImpressions > 0 ? (totalCost / totalImpressions * 1000) : 0;
    
    // Weekly data aggregation
    const weeklyData = parsedData.reduce((acc, item) => {
      const weekKey = `Week ${item.week}`;
      if (!acc[weekKey]) {
        acc[weekKey] = { week: weekKey, clicks: 0, impressions: 0, cost: 0, date: item.date };
      }
      acc[weekKey].clicks += item.clicks;
      acc[weekKey].impressions += item.impressions;
      acc[weekKey].cost += item.cost;
      return acc;
    }, {});
    const weeklyDataArray = Object.values(weeklyData);
    
    // Monthly data aggregation
    const monthlyData = parsedData.reduce((acc, item) => {
      const date = new Date(item.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, clicks: 0, impressions: 0, cost: 0 };
      }
      acc[monthKey].clicks += item.clicks;
      acc[monthKey].impressions += item.impressions;
      acc[monthKey].cost += item.cost;
      return acc;
    }, {});
    const monthlyDataArray = Object.values(monthlyData);
    
    // Update state with all calculated stats
    setDataStats({
      totalClicks,
      totalImpressions,
      totalCost,
      overallAvgCPC,
      overallAvgCTR,
      overallAvgCPM,
      weeklyDataArray,
      monthlyDataArray
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    // Return date in "MMM D" format (e.g., "Apr 8")
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFilteredData = () => {
    // If no data yet, return empty array
    if (data.length === 0) return [];
    
    // If data exists, get the latest date from the data
    const now = new Date(rawData[rawData.length-1].Date);
    
    if (timeframe === 'last30') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return data.filter(item => new Date(item.date) >= thirtyDaysAgo);
    } else if (timeframe === 'last7') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return data.filter(item => new Date(item.date) >= sevenDaysAgo);
    }
    return data;
  };
  const filteredData = getFilteredData();

  // Define all 6 charts here
  const charts = [
    { title: 'Daily Clicks', dataKey: 'clicks', stroke: '#2563eb', yAxisLabel: 'Clicks' },
    { title: 'Daily Impressions', dataKey: 'impressions', stroke: '#10b981', yAxisLabel: 'Impressions' }, // Green
    { title: 'Daily Cost', dataKey: 'cost', stroke: '#ef4444', yAxisLabel: 'Cost ($)' }, // Red
    { title: 'Daily Avg. CPC', dataKey: 'avgCPC', stroke: '#8b5cf6', yAxisLabel: 'Avg. CPC ($)' }, // Purple
    { title: 'Daily CTR (%)', dataKey: 'ctr', stroke: '#f97316', yAxisLabel: 'CTR (%)' }, // Orange
    { title: 'Daily CPM ($)', dataKey: 'cpm', stroke: '#06b6d4', yAxisLabel: 'CPM ($)' } // Cyan
  ];

  return (
    <div className="bg-gray-100 p-6 rounded-lg min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">MMW Contracting - Google Ads Performance Dashboard</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Total Clicks</h3>
              <p className="text-2xl font-bold text-blue-600">{dataStats.totalClicks.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Total Impressions</h3>
              <p className="text-2xl font-bold text-green-600">{dataStats.totalImpressions.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Total Cost</h3>
              <p className="text-2xl font-bold text-purple-600">${dataStats.totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Avg. CPC</h3>
              <p className="text-2xl font-bold text-yellow-600">${dataStats.overallAvgCPC.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Avg. CTR</h3>
              <p className="text-2xl font-bold text-red-600">{dataStats.overallAvgCTR.toFixed(2)}%</p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg shadow"> {/* Added CPM KPI Card */}
              <h3 className="text-sm font-semibold text-gray-500">Avg. CPM</h3>
              <p className="text-2xl font-bold text-cyan-600">${dataStats.overallAvgCPM.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <button className={`px-4 py-2 mr-2 rounded-md font-medium ${timeframe === 'last7' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setTimeframe('last7')}>Last 7 Days</button>
        <button className={`px-4 py-2 mr-2 rounded-md font-medium ${timeframe === 'last30' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setTimeframe('last30')}>Last 30 Days</button>
        <button className={`px-4 py-2 rounded-md font-medium ${timeframe === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setTimeframe('all')}>All Time</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {charts.map((chart, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{chart.title}</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: chart.yAxisLabel, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={chart.dataKey}
                    stroke={chart.stroke}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Metric Definitions */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Metrics Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700">Cost Per Click (CPC)</h3>
            <p className="text-gray-600">The average amount paid for each click on your ad</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700">Click-Through Rate (CTR)</h3>
            <p className="text-gray-600">The percentage of impressions that resulted in a click</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700">Cost Per Mille (CPM)</h3>
            <p className="text-gray-600">The average cost per thousand impressions</p>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Clicks */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Performing Days (by Clicks)</h3>
            <ul className="space-y-3">
              <li className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">Tue, Apr 8, 2025</p>
                <p className="text-gray-600">70 clicks, CTR: 2.15%, Cost: $12.55</p>
              </li>
              <li className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">Sat, May 3, 2025</p>
                <p className="text-gray-600">69 clicks, CTR: 2.18%, Cost: $19.14</p>
              </li>
              <li className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">Fri, Apr 11, 2025</p>
                <p className="text-gray-600">68 clicks, CTR: 1.48%, Cost: $14.23</p>
              </li>
              <li className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">Tue, Apr 29, 2025</p>
                <p className="text-gray-600">62 clicks, CTR: 1.34%, Cost: $7.46</p>
              </li>
              <li className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">Sun, Mar 16, 2025</p>
                <p className="text-gray-600">61 clicks, CTR: 1.57%, Cost: $17.48</p>
              </li>
            </ul>
          </div>

          {/* Top CTR */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Performing Days (by CTR - min 10 impressions)</h3>
            <ul className="space-y-3">
              <li className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium">Sun, Apr 6, 2025</p>
                <p className="text-gray-600">6.52% CTR (3 clicks / 46 impr.)</p>
              </li>
              <li className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium">Tue, Feb 25, 2025</p>
                <p className="text-gray-600">5.56% CTR (1 clicks / 18 impr.)</p>
              </li>
              <li className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium">Mon, Apr 28, 2025</p>
                <p className="text-gray-600">5.25% CTR (31 clicks / 590 impr.)</p>
              </li>
              <li className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium">Mon, Apr 7, 2025</p>
                <p className="text-gray-600">3.08% CTR (4 clicks / 130 impr.)</p>
              </li>
              <li className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium">Wed, Apr 23, 2025</p>
                <p className="text-gray-600">2.58% CTR (40 clicks / 1,553 impr.)</p>
              </li>
            </ul>
          </div>

          {/* Cost Efficient */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Most Cost-Efficient Days (by Avg. CPC - min 1 click)</h3>
            <ul className="space-y-3">
              <li className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium">Tue, Apr 29, 2025</p>
                <p className="text-gray-600">$0.12 Avg. CPC (62 clicks for $7.46)</p>
              </li>
              <li className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium">Thu, May 1, 2025</p>
                <p className="text-gray-600">$0.15 Avg. CPC (37 clicks for $5.53)</p>
              </li>
              <li className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium">Fri, May 2, 2025</p>
                <p className="text-gray-600">$0.15 Avg. CPC (35 clicks for $5.42)</p>
              </li>
              <li className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium">Tue, Apr 8, 2025</p>
                <p className="text-gray-600">$0.18 Avg. CPC (70 clicks for $12.55)</p>
              </li>
              <li className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium">Sun, Apr 13, 2025</p>
                <p className="text-gray-600">$0.18 Avg. CPC (61 clicks for $10.95)</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('facebook');
  const [googleAdsData, setGoogleAdsData] = useState(null);
  const [facebookAdsData, setFacebookAdsData] = useState(null);
  const [loadingState, setLoadingState] = useState({
    google: true,
    facebook: true
  });
  const [dataError, setDataError] = useState({
    google: null,
    facebook: null
  });
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch all data in parallel
  const fetchAllPlatformData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoadingState({
        google: true,
        facebook: true
      });
    }
    
    // Reset errors on refresh
    setDataError({
      google: null,
      facebook: null
    });
    
    // Calculate date range (90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Fetch Google Ads and Facebook data in parallel
    const fetchGoogleData = async () => {
      try {
        // Get the appropriate base URL depending on the environment
        const apiBase = getApiBaseUrl();
        
        // Add forceRefresh parameter if requested
        const refreshParam = forceRefresh ? '&forceRefresh=true' : '';
        const apiUrl = `${apiBase}/api/google-ads-data?startDate=${formattedStartDate}&endDate=${formattedEndDate}${refreshParam}`;
        
        console.log(`Fetching Google Ads data from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Google Ads data: ${response.statusText}`);
        }
        
        const fetchedData = await response.json();
        
        // Check if data is mock data and set it
        const isMockData = fetchedData.mock === true;
        if (isMockData) {
          console.warn('Google Ads API is returning MOCK data instead of real data');
          setDataError(prev => ({...prev, google: 'Using mock data - real data unavailable'}));
        }
        
        setGoogleAdsData(fetchedData);
        setLoadingState(prev => ({...prev, google: false}));
      } catch (err) {
        console.error('Error fetching Google Ads data:', err);
        setDataError(prev => ({...prev, google: err.message}));
        setLoadingState(prev => ({...prev, google: false}));
        
        // Fallback to sample data if not just refreshing
        if (!forceRefresh) {
          useSampleGoogleData();
        }
      }
    };
    
    const fetchFacebookData = async () => {
      try {
        setLoadingState(prev => ({...prev, facebook: true}));
        setDataError(prev => ({...prev, facebook: null}));
        
        // Get the appropriate base URL depending on the environment
        const apiBase = getApiBaseUrl();
        
        const refreshParam = forceRefresh ? '&forceRefresh=true' : '';
        const apiUrl = `${apiBase}/api/facebook-page-data?startDate=${formattedStartDate}&endDate=${formattedEndDate}${refreshParam}`;
        
        console.log('Fetching Facebook page data from:', apiUrl);
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch Facebook page data');
        }
        
        console.log('Facebook page data received:', data);
        
        // Transform page data to match the expected format
        const transformedData = Array.isArray(data) ? data.map(item => ({
          Date: item.Date,
          Impressions: item.page_impressions?.toLocaleString() || '0',
          impressions: item.page_impressions || 0,
          Clicks: item.page_post_engagements?.toString() || '0',
          clicks: item.page_post_engagements || 0,
          engagement: item.page_engaged_users || 0,
          page_fans: item.page_fans || 0,
          page_views: item.page_views_total || 0,
          // Calculate a pseudo-CPC based on engagement
          Avg_CPC: '$0.00', // No cost for organic page data
          cpc: 0,
          Cost: '$0.00', // No cost for organic page data
          spend: 0
        })) : [];
        
        setFacebookAdsData(transformedData);
        
        // Update mock data flag
        if (data.mock) {
          setDataError(prev => ({...prev, facebook: 'Using mock data - real data unavailable'}));
        } else {
          setDataError(prev => ({...prev, facebook: null}));
        }
        
        setLoadingState(prev => ({...prev, facebook: false}));
      } catch (error) {
        console.error('Error fetching Facebook page data:', error);
        setDataError(prev => ({...prev, facebook: error.message}));
        setFacebookAdsData([]);
        setLoadingState(prev => ({...prev, facebook: false}));
        
        // Fallback to sample data if not just refreshing
        if (!forceRefresh) {
          useSampleFacebookData();
        }
      }
    };
    
    // Execute both fetch operations simultaneously
    await Promise.all([
      fetchGoogleData(),
      fetchFacebookData()
    ]);
    
    if (forceRefresh) {
      setRefreshing(false);
    }
  };
  
  // Function to manually refresh data
  const refreshData = () => {
    fetchAllPlatformData(true);
  };
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchAllPlatformData();
  }, []);
  
  // Sample data fallback functions
  const useSampleGoogleData = () => {
    // A few rows of sample data for fallback
    const sampleRawData = [
      { Date: 'Mon, Apr 8, 2025', Clicks: '45', Impressions: '3,158', Avg_CPC: '$0.42', Cost: '$18.84' },
      { Date: 'Tue, Apr 9, 2025', Clicks: '51', Impressions: '4,358', Avg_CPC: '$0.32', Cost: '$16.37' },
      { Date: 'Wed, Apr 10, 2025', Clicks: '45', Impressions: '2,714', Avg_CPC: '$0.28', Cost: '$12.47' },
      { Date: 'Thu, Apr 11, 2025', Clicks: '39', Impressions: '3,205', Avg_CPC: '$0.42', Cost: '$16.49' },
      { Date: 'Fri, Apr 12, 2025', Clicks: '61', Impressions: '3,883', Avg_CPC: '$0.29', Cost: '$17.48' },
      { Date: 'Sat, Apr 13, 2025', Clicks: '30', Impressions: '4,310', Avg_CPC: '$0.32', Cost: '$9.63' },
      { Date: 'Sun, Apr 14, 2025', Clicks: '25', Impressions: '3,401', Avg_CPC: '$0.53', Cost: '$13.19' }
    ];
    
    setGoogleAdsData(sampleRawData);
  };
  
  const useSampleFacebookData = () => {
    // Generate sample Facebook data
    const startDate = new Date(2025, 4, 24); // May 24, 2025 (recent data)
    const endDate = new Date(2025, 4, 31);   // May 31, 2025 (today)
    
    const sampleData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const formattedDate = d.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      const impressions = Math.floor(Math.random() * 5000) + 1000;
      const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
      const cpc = (Math.random() * 0.5 + 0.8).toFixed(2);
      const spend = (clicks * parseFloat(cpc)).toFixed(2);
      
      sampleData.push({
        Date: formattedDate,
        date_start: d.toISOString().split('T')[0],
        date_stop: d.toISOString().split('T')[0],
        campaign_name: "Marfinetz Plumbing Campaign",
        Clicks: clicks.toString(),
        clicks: clicks,
        Impressions: impressions.toLocaleString(),
        impressions: impressions,
        Avg_CPC: `$${cpc}`,
        cpc: parseFloat(cpc),
        Cost: `$${spend}`,
        spend: parseFloat(spend),
        engagement: Math.round(clicks * 1.8)
      });
    }
    
    setFacebookAdsData(sampleData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center">
              <nav className="-mb-px flex flex-1" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('google')}
                  className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'google'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Google Ads Analytics
                  {loadingState.google && <span className="ml-2 inline-block w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>}
                </button>
                <button
                  onClick={() => setActiveTab('facebook')}
                  className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'facebook'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Facebook Analytics
                  {loadingState.facebook && <span className="ml-2 inline-block w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>}
                </button>
              </nav>
              
              {/* Refresh button */}
              <button
                onClick={refreshData}
                disabled={refreshing}
                className={`px-3 py-1 rounded-full flex items-center mr-4 ${
                  refreshing 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title="Refresh data from APIs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'google' ? 
          <GoogleAdsDashboard 
            preloadedData={googleAdsData} 
            isLoading={loadingState.google} 
            error={dataError.google}
          /> : 
          <FacebookDashboard 
            preloadedData={facebookAdsData} 
            isLoading={loadingState.facebook} 
            error={dataError.facebook}
          />
        }
      </div>
    </div>
  );
};

export default Dashboard;