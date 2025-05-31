import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import FacebookDashboard from './FacebookDashboard';

const GoogleAdsDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Fetch data from the API
  useEffect(() => {
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
        
        // Fetch data from our API
        const apiUrl = `http://localhost:3001/api/google-ads-data?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
        
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
    
    fetchMarketingData();
  }, []);
  
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('google')}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'google'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Google Ads Analytics
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
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'google' ? <GoogleAdsDashboard /> : <FacebookDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;