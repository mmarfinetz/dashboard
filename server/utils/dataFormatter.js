/**
 * Merges and formats data from Google Ads and Facebook Ads
 * 
 * @param {Array} googleData - Data from Google Ads API
 * @param {Array} facebookData - Data from Facebook Ads API
 * @returns {Object} - Combined and formatted data for the dashboard
 */
export function mergeAndFormatData(googleData, facebookData) {
  // Create a map to store data by date
  const dataByDate = new Map();
  
  // Process Google Ads data
  googleData.forEach(row => {
    dataByDate.set(row.Date, {
      Date: row.Date,
      Google_Clicks: row.Clicks,
      Google_Impressions: row.Impressions,
      Google_CPC: row.Avg_CPC,
      Google_Cost: row.Cost,
      Facebook_Clicks: '0',
      Facebook_Impressions: '0',
      Facebook_CPC: '$0.00',
      Facebook_Cost: '$0.00'
    });
  });
  
  // Process Facebook Ads data
  facebookData.forEach(row => {
    if (dataByDate.has(row.Date)) {
      // Update existing entry
      const existingData = dataByDate.get(row.Date);
      existingData.Facebook_Clicks = row.Clicks;
      existingData.Facebook_Impressions = row.Impressions;
      existingData.Facebook_CPC = row.Avg_CPC;
      existingData.Facebook_Cost = row.Cost;
    } else {
      // Create new entry
      dataByDate.set(row.Date, {
        Date: row.Date,
        Google_Clicks: '0',
        Google_Impressions: '0',
        Google_CPC: '$0.00',
        Google_Cost: '$0.00',
        Facebook_Clicks: row.Clicks,
        Facebook_Impressions: row.Impressions,
        Facebook_CPC: row.Avg_CPC,
        Facebook_Cost: row.Cost
      });
    }
  });
  
  // Convert map to array and sort by date
  const combinedData = Array.from(dataByDate.values())
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));
  
  // Calculate totals and metrics
  const totals = calculateTotals(combinedData);
  const metrics = calculateMetrics(totals);
  
  return {
    dailyData: combinedData,
    totals,
    metrics
  };
}

/**
 * Calculates total values from the combined data
 * 
 * @param {Array} data - Combined daily data
 * @returns {Object} - Total values for all metrics
 */
function calculateTotals(data) {
  const totals = {
    Google_Clicks: 0,
    Google_Impressions: 0,
    Google_Cost: 0,
    Facebook_Clicks: 0,
    Facebook_Impressions: 0,
    Facebook_Cost: 0
  };
  
  data.forEach(day => {
    totals.Google_Clicks += parseInt(day.Google_Clicks) || 0;
    totals.Google_Impressions += parseInt(day.Google_Impressions.replace(',', '')) || 0;
    totals.Google_Cost += parseFloat(day.Google_Cost.replace('$', '')) || 0;
    totals.Facebook_Clicks += parseInt(day.Facebook_Clicks) || 0;
    totals.Facebook_Impressions += parseInt(day.Facebook_Impressions.replace(',', '')) || 0;
    totals.Facebook_Cost += parseFloat(day.Facebook_Cost.replace('$', '')) || 0;
  });
  
  return {
    ...totals,
    Total_Clicks: totals.Google_Clicks + totals.Facebook_Clicks,
    Total_Impressions: totals.Google_Impressions + totals.Facebook_Impressions,
    Total_Cost: totals.Google_Cost + totals.Facebook_Cost
  };
}

/**
 * Calculates derived metrics from the totals
 * 
 * @param {Object} totals - Total values for all metrics
 * @returns {Object} - Calculated metrics (CTR, CPC, etc.)
 */
function calculateMetrics(totals) {
  const metrics = {
    Google_CTR: ((totals.Google_Clicks / totals.Google_Impressions) * 100).toFixed(2) + '%',
    Google_Avg_CPC: '$' + (totals.Google_Cost / totals.Google_Clicks).toFixed(2),
    Facebook_CTR: ((totals.Facebook_Clicks / totals.Facebook_Impressions) * 100).toFixed(2) + '%',
    Facebook_Avg_CPC: '$' + (totals.Facebook_Cost / totals.Facebook_Clicks).toFixed(2),
    Overall_CTR: ((totals.Total_Clicks / totals.Total_Impressions) * 100).toFixed(2) + '%',
    Overall_Avg_CPC: '$' + (totals.Total_Cost / totals.Total_Clicks).toFixed(2)
  };
  
  return metrics;
}