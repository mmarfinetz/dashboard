import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';

const Dashboard = () => {
  // Parse string data into proper formats
  const parseData = (data) => {
    return data.map(item => ({
      date: item.Date,
      clicks: parseInt(item.Clicks),
      impressions: parseInt(item.Impressions.replace(/,/g, '')) , // Added replace for commas in impressions
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

  // Raw data from the CSV - this should ideally be fetched or passed as a prop
  const rawData = [
    { Date: 'Mon, Feb 10, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Tue, Feb 11, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Wed, Feb 12, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Thu, Feb 13, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Fri, Feb 14, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sat, Feb 15, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sun, Feb 16, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Mon, Feb 17, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Tue, Feb 18, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Wed, Feb 19, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Thu, Feb 20, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Fri, Feb 21, 2025', Clicks: '0', Impressions: '2', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sat, Feb 22, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sun, Feb 23, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Mon, Feb 24, 2025', Clicks: '1', Impressions: '10', Avg_CPC: '$0.81', Cost: '$0.81' },
    { Date: 'Tue, Feb 25, 2025', Clicks: '1', Impressions: '18', Avg_CPC: '$3.26', Cost: '$3.26' },
    { Date: 'Wed, Feb 26, 2025', Clicks: '2', Impressions: '4', Avg_CPC: '$4.36', Cost: '$8.71' },
    { Date: 'Thu, Feb 27, 2025', Clicks: '0', Impressions: '10', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Fri, Feb 28, 2025', Clicks: '0', Impressions: '5', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sat, Mar 1, 2025', Clicks: '0', Impressions: '6', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sun, Mar 2, 2025', Clicks: '0', Impressions: '7', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Mon, Mar 3, 2025', Clicks: '0', Impressions: '2', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Tue, Mar 4, 2025', Clicks: '0', Impressions: '10', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Wed, Mar 5, 2025', Clicks: '0', Impressions: '10', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Thu, Mar 6, 2025', Clicks: '0', Impressions: '7', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Fri, Mar 7, 2025', Clicks: '1', Impressions: '6', Avg_CPC: '$9.85', Cost: '$9.85' },
    { Date: 'Sat, Mar 8, 2025', Clicks: '0', Impressions: '0', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sun, Mar 9, 2025', Clicks: '0', Impressions: '2', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Mon, Mar 10, 2025', Clicks: '0', Impressions: '2', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Tue, Mar 11, 2025', Clicks: '0', Impressions: '1', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Wed, Mar 12, 2025', Clicks: '45', Impressions: '4,158', Avg_CPC: '$0.42', Cost: '$18.84' },
    { Date: 'Thu, Mar 13, 2025', Clicks: '51', Impressions: '4,358', Avg_CPC: '$0.32', Cost: '$16.37' },
    { Date: 'Fri, Mar 14, 2025', Clicks: '45', Impressions: '2,714', Avg_CPC: '$0.28', Cost: '$12.47' },
    { Date: 'Sat, Mar 15, 2025', Clicks: '39', Impressions: '3,205', Avg_CPC: '$0.42', Cost: '$16.49' },
    { Date: 'Sun, Mar 16, 2025', Clicks: '61', Impressions: '3,883', Avg_CPC: '$0.29', Cost: '$17.48' },
    { Date: 'Mon, Mar 17, 2025', Clicks: '30', Impressions: '4,310', Avg_CPC: '$0.32', Cost: '$9.63' },
    { Date: 'Tue, Mar 18, 2025', Clicks: '25', Impressions: '3,401', Avg_CPC: '$0.53', Cost: '$13.19' },
    { Date: 'Wed, Mar 19, 2025', Clicks: '33', Impressions: '3,084', Avg_CPC: '$0.28', Cost: '$9.14' },
    { Date: 'Thu, Mar 20, 2025', Clicks: '41', Impressions: '4,147', Avg_CPC: '$0.35', Cost: '$14.49' },
    { Date: 'Fri, Mar 21, 2025', Clicks: '28', Impressions: '3,158', Avg_CPC: '$0.35', Cost: '$9.93' },
    { Date: 'Sat, Mar 22, 2025', Clicks: '34', Impressions: '3,348', Avg_CPC: '$0.47', Cost: '$15.86' },
    { Date: 'Sun, Mar 23, 2025', Clicks: '20', Impressions: '1,453', Avg_CPC: '$0.51', Cost: '$10.21' },
    { Date: 'Mon, Mar 24, 2025', Clicks: '22', Impressions: '1,090', Avg_CPC: '$0.56', Cost: '$12.39' },
    { Date: 'Tue, Mar 25, 2025', Clicks: '39', Impressions: '3,097', Avg_CPC: '$0.29', Cost: '$11.28' },
    { Date: 'Wed, Mar 26, 2025', Clicks: '26', Impressions: '3,093', Avg_CPC: '$0.43', Cost: '$11.10' },
    { Date: 'Thu, Mar 27, 2025', Clicks: '45', Impressions: '3,157', Avg_CPC: '$0.42', Cost: '$18.74' },
    { Date: 'Fri, Mar 28, 2025', Clicks: '55', Impressions: '5,425', Avg_CPC: '$0.31', Cost: '$17.25' },
    { Date: 'Sat, Mar 29, 2025', Clicks: '29', Impressions: '3,321', Avg_CPC: '$0.43', Cost: '$12.45' },
    { Date: 'Sun, Mar 30, 2025', Clicks: '36', Impressions: '3,831', Avg_CPC: '$0.36', Cost: '$12.99' },
    { Date: 'Mon, Mar 31, 2025', Clicks: '46', Impressions: '3,896', Avg_CPC: '$0.32', Cost: '$14.62' },
    { Date: 'Tue, Apr 1, 2025', Clicks: '17', Impressions: '830', Avg_CPC: '$0.47', Cost: '$7.93' },
    { Date: 'Wed, Apr 2, 2025', Clicks: '17', Impressions: '826', Avg_CPC: '$0.46', Cost: '$7.80' },
    { Date: 'Thu, Apr 3, 2025', Clicks: '1', Impressions: '3', Avg_CPC: '$0.96', Cost: '$0.96' },
    { Date: 'Fri, Apr 4, 2025', Clicks: '2', Impressions: '5', Avg_CPC: '$2.08', Cost: '$4.17' },
    { Date: 'Sat, Apr 5, 2025', Clicks: '0', Impressions: '42', Avg_CPC: '$0.00', Cost: '$0.00' },
    { Date: 'Sun, Apr 6, 2025', Clicks: '3', Impressions: '46', Avg_CPC: '$1.29', Cost: '$3.87' },
    { Date: 'Mon, Apr 7, 2025', Clicks: '4', Impressions: '130', Avg_CPC: '$0.55', Cost: '$2.21' },
    { Date: 'Tue, Apr 8, 2025', Clicks: '70', Impressions: '3,255', Avg_CPC: '$0.18', Cost: '$12.55' },
    { Date: 'Wed, Apr 9, 2025', Clicks: '48', Impressions: '4,917', Avg_CPC: '$0.36', Cost: '$17.26' },
    { Date: 'Thu, Apr 10, 2025', Clicks: '44', Impressions: '3,388', Avg_CPC: '$0.33', Cost: '$14.32' },
    { Date: 'Fri, Apr 11, 2025', Clicks: '68', Impressions: '4,605', Avg_CPC: '$0.21', Cost: '$14.23' },
    { Date: 'Sat, Apr 12, 2025', Clicks: '44', Impressions: '2,240', Avg_CPC: '$0.24', Cost: '$10.63' },
    { Date: 'Sun, Apr 13, 2025', Clicks: '61', Impressions: '4,513', Avg_CPC: '$0.18', Cost: '$10.95' },
    { Date: 'Mon, Apr 14, 2025', Clicks: '42', Impressions: '2,417', Avg_CPC: '$0.27', Cost: '$11.34' },
    { Date: 'Tue, Apr 15, 2025', Clicks: '55', Impressions: '3,917', Avg_CPC: '$0.23', Cost: '$12.72' },
    { Date: 'Wed, Apr 16, 2025', Clicks: '38', Impressions: '2,960', Avg_CPC: '$0.29', Cost: '$10.97' },
    { Date: 'Thu, Apr 17, 2025', Clicks: '46', Impressions: '3,088', Avg_CPC: '$0.25', Cost: '$11.50' },
    { Date: 'Fri, Apr 18, 2025', Clicks: '24', Impressions: '1,971', Avg_CPC: '$0.43', Cost: '$10.32' },
    { Date: 'Sat, Apr 19, 2025', Clicks: '43', Impressions: '2,877', Avg_CPC: '$0.26', Cost: '$11.08' },
    { Date: 'Sun, Apr 20, 2025', Clicks: '42', Impressions: '1,865', Avg_CPC: '$0.23', Cost: '$9.46' },
    { Date: 'Mon, Apr 21, 2025', Clicks: '36', Impressions: '2,359', Avg_CPC: '$0.29', Cost: '$10.28' },
    { Date: 'Tue, Apr 22, 2025', Clicks: '41', Impressions: '3,393', Avg_CPC: '$0.24', Cost: '$9.90' },
    { Date: 'Wed, Apr 23, 2025', Clicks: '40', Impressions: '1,553', Avg_CPC: '$0.24', Cost: '$9.80' },
    { Date: 'Thu, Apr 24, 2025', Clicks: '44', Impressions: '2,529', Avg_CPC: '$0.23', Cost: '$10.06' },
    { Date: 'Fri, Apr 25, 2025', Clicks: '36', Impressions: '2,408', Avg_CPC: '$0.29', Cost: '$10.51' },
    { Date: 'Sat, Apr 26, 2025', Clicks: '46', Impressions: '6,461', Avg_CPC: '$0.29', Cost: '$13.12' },
    { Date: 'Sun, Apr 27, 2025', Clicks: '43', Impressions: '3,260', Avg_CPC: '$0.25', Cost: '$10.58' },
    { Date: 'Mon, Apr 28, 2025', Clicks: '31', Impressions: '590', Avg_CPC: '$0.31', Cost: '$9.54' },
    { Date: 'Tue, Apr 29, 2025', Clicks: '62', Impressions: '4,623', Avg_CPC: '$0.12', Cost: '$7.46' },
    { Date: 'Wed, Apr 30, 2025', Clicks: '32', Impressions: '1,373', Avg_CPC: '$0.26', Cost: '$8.21' },
    { Date: 'Thu, May 1, 2025', Clicks: '37', Impressions: '1,463', Avg_CPC: '$0.15', Cost: '$5.53' },
    { Date: 'Fri, May 2, 2025', Clicks: '35', Impressions: '1,756', Avg_CPC: '$0.15', Cost: '$5.42' },
    { Date: 'Sat, May 3, 2025', Clicks: '69', Impressions: '3,172', Avg_CPC: '$0.28', Cost: '$19.14' },
    { Date: 'Sun, May 4, 2025', Clicks: '29', Impressions: '1,311', Avg_CPC: '$0.42', Cost: '$12.16' },
    { Date: 'Mon, May 5, 2025', Clicks: '36', Impressions: '3,071', Avg_CPC: '$0.37', Cost: '$13.21' },
    { Date: 'Tue, May 6, 2025', Clicks: '33', Impressions: '2,311', Avg_CPC: '$0.21', Cost: '$6.78' }
  ];

  const data = parseData(rawData);

  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
  const overallAvgCPC = totalClicks > 0 ? (totalCost / totalClicks) : 0;
  const overallAvgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
  const overallAvgCPM = totalImpressions > 0 ? (totalCost / totalImpressions * 1000) : 0; // Added CPM calculation

  const weeklyData = data.reduce((acc, item) => {
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

  const getMonthFromDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };
  const monthlyData = data.reduce((acc, item) => {
    const monthKey = getMonthFromDate(item.date);
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, clicks: 0, impressions: 0, cost: 0 };
    }
    acc[monthKey].clicks += item.clicks;
    acc[monthKey].impressions += item.impressions;
    acc[monthKey].cost += item.cost;
    return acc;
  }, {});
  const monthlyDataArray = Object.values(monthlyData);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    // Ensure date is formatted correctly for XAxis tick
    const originalDate = rawData.find(d => new Date(d.Date).getTime() === date.getTime());
    return originalDate ? originalDate.Date.substring(5,11) : `${month}/${day}`;
  };

  const [timeframe, setTimeframe] = useState('all');
  const getFilteredData = () => {
    const now = new Date(rawData[rawData.length-1].Date); // Use last date in data as 'now'
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
              <p className="text-2xl font-bold text-blue-600">{totalClicks.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Total Impressions</h3>
              <p className="text-2xl font-bold text-green-600">{totalImpressions.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Total Cost</h3>
              <p className="text-2xl font-bold text-purple-600">${totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Avg. CPC</h3>
              <p className="text-2xl font-bold text-yellow-600">${overallAvgCPC.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-500">Avg. CTR</h3>
              <p className="text-2xl font-bold text-red-600">{overallAvgCTR.toFixed(2)}%</p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg shadow"> {/* Added CPM KPI Card */}
              <h3 className="text-sm font-semibold text-gray-500">Avg. CPM</h3>
              <p className="text-2xl font-bold text-cyan-600">${overallAvgCPM.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <button className={`px-4 py-2 mr-2 rounded-md font-medium ${timeframe === 'last7' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setTimeframe('last7')}>Last 7 Days</button>
        <button className={`px-4 py-2 mr-2 rounded-md font-medium ${timeframe === 'last30' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setTimeframe('last30')}>Last 3
(Content truncated due to size limit. Use line ranges to read in chunks)