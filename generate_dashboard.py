import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os

# Define the directory for saving assets
assets_dir = "/home/ubuntu/dashboard_assets"
csv_file_path = "/home/ubuntu/upload/Time_series(2025.02.10-2025.05.06).csv"

# Create the assets directory if it doesn't exist
if not os.path.exists(assets_dir):
    os.makedirs(assets_dir)

# Load the data
df = pd.read_csv(csv_file_path)

# Preprocess data
# Convert 'Date' to datetime objects
# Corrected format string: The CSV parser handles the quotes, so the format string should match the content *inside* the quotes.
df['Date'] = pd.to_datetime(df['Date'], format='%a, %b %d, %Y')

# Clean numeric columns (remove '$', ',', and convert to float)
for col in ['Avg. CPC', 'Cost']:
    df[col] = df[col].astype(str).str.replace("\n", "", regex=False).str.replace("$", "", regex=False).str.replace(",", "", regex=False).astype(float)

df['Impressions'] = df['Impressions'].astype(str).str.replace(",", "", regex=False).astype(int)
df['Clicks'] = df['Clicks'].astype(int)

# Calculate derived metrics
# Added handling for division by zero resulting in inf/-inf
df['CTR'] = (df['Clicks'] / df['Impressions']).replace([float('inf'), -float('inf')], 0).fillna(0) * 100  # Click-Through Rate in %
df['CPM'] = (df['Cost'] / df['Impressions']).replace([float('inf'), -float('inf')], 0).fillna(0) * 1000  # Cost Per Mille (Thousand Impressions)

# --- Generate Visualizations ---
plt.style.use('seaborn-v0_8-whitegrid') # Using a seaborn style for better aesthetics

def save_plot(fig, filename):
    filepath = os.path.join(assets_dir, filename)
    fig.savefig(filepath, bbox_inches='tight')
    print(f"Saved plot: {filepath}")
    plt.close(fig) # Close the figure to free memory

# 1. Clicks Over Time
fig1, ax1 = plt.subplots(figsize=(12, 6))
ax1.plot(df['Date'], df['Clicks'], marker='o', linestyle='-', color='b')
ax1.set_title('Daily Clicks Over Time', fontsize=16)
ax1.set_xlabel('Date', fontsize=12)
ax1.set_ylabel('Clicks', fontsize=12)
ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax1.tick_params(axis='x', rotation=45)
plt.grid(True)
save_plot(fig1, 'clicks_over_time.png')

# 2. Impressions Over Time
fig2, ax2 = plt.subplots(figsize=(12, 6))
ax2.plot(df['Date'], df['Impressions'], marker='o', linestyle='-', color='g')
ax2.set_title('Daily Impressions Over Time', fontsize=16)
ax2.set_xlabel('Date', fontsize=12)
ax2.set_ylabel('Impressions', fontsize=12)
ax2.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax2.tick_params(axis='x', rotation=45)
plt.grid(True)
save_plot(fig2, 'impressions_over_time.png')

# 3. Cost Over Time
fig3, ax3 = plt.subplots(figsize=(12, 6))
ax3.plot(df['Date'], df['Cost'], marker='o', linestyle='-', color='r')
ax3.set_title('Daily Cost Over Time', fontsize=16)
ax3.set_xlabel('Date', fontsize=12)
ax3.set_ylabel('Cost ($)', fontsize=12)
ax3.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax3.tick_params(axis='x', rotation=45)
plt.grid(True)
save_plot(fig3, 'cost_over_time.png')

# 4. Avg. CPC Over Time
fig4, ax4 = plt.subplots(figsize=(12, 6))
ax4.plot(df['Date'], df['Avg. CPC'], marker='o', linestyle='-', color='purple')
ax4.set_title('Average CPC Over Time', fontsize=16)
ax4.set_xlabel('Date', fontsize=12)
ax4.set_ylabel('Avg. CPC ($)', fontsize=12)
ax4.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax4.tick_params(axis='x', rotation=45)
plt.grid(True)
save_plot(fig4, 'avg_cpc_over_time.png')

# 5. CTR Over Time
fig5, ax5 = plt.subplots(figsize=(12, 6))
ax5.plot(df['Date'], df['CTR'], marker='o', linestyle='-', color='orange')
ax5.set_title('Click-Through Rate (CTR) Over Time', fontsize=16)
ax5.set_xlabel('Date', fontsize=12)
ax5.set_ylabel('CTR (%)', fontsize=12)
ax5.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax5.tick_params(axis='x', rotation=45)
plt.grid(True)
save_plot(fig5, 'ctr_over_time.png')

# 6. CPM Over Time
fig6, ax6 = plt.subplots(figsize=(12, 6))
ax6.plot(df['Date'], df['CPM'], marker='o', linestyle='-', color='teal')
ax6.set_title('Cost Per Mille (CPM) Over Time', fontsize=16)
ax6.set_xlabel('Date', fontsize=12)
ax6.set_ylabel('CPM ($)', fontsize=12)
ax6.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax6.tick_params(axis='x', rotation=45)
plt.grid(True)
save_plot(fig6, 'cpm_over_time.png')

# --- Generate KPI Scorecards (as text for now, to be embedded in HTML) ---
total_clicks = df['Clicks'].sum()
total_impressions = df['Impressions'].sum()
total_cost = df['Cost'].sum()
average_cpc_overall = (total_cost / total_clicks) if total_clicks > 0 else 0
average_ctr_overall = (total_clicks / total_impressions) * 100 if total_impressions > 0 else 0
average_cpm_overall = (total_cost / total_impressions) * 1000 if total_impressions > 0 else 0

kpi_data = {
    "Total Clicks": f"{total_clicks:,}",
    "Total Impressions": f"{total_impressions:,}",
    "Total Cost": f"${total_cost:,.2f}",
    "Overall Avg. CPC": f"${average_cpc_overall:,.2f}",
    "Overall Avg. CTR": f"{average_ctr_overall:,.2f}%",
    "Overall Avg. CPM": f"${average_cpm_overall:,.2f}"
}

# --- Assemble into an HTML Dashboard --- 
html_content = """
<html>
<head>
    <title>Marketing Insights Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
        h1 { text-align: center; color: #2c3e50; }
        .dashboard-container { display: flex; flex-wrap: wrap; justify-content: space-around; }
        .kpi-container { display: flex; justify-content: space-around; flex-wrap: wrap; margin-bottom: 30px; width: 100%; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .kpi-card { background-color: #ecf0f1; border: 1px solid #bdc3c7; border-radius: 8px; padding: 20px; margin: 10px; text-align: center; width: 200px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .kpi-card h3 { margin-top: 0; color: #2980b9; font-size: 1.2em; }
        .kpi-card p { font-size: 1.8em; font-weight: bold; color: #34495e; margin-bottom: 0;}
        .chart-container { background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px; width: 45%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .chart-container img { max-width: 100%; height: auto; border-radius: 4px; }
        h2 { color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>Marketing Insights Dashboard - Marfinetz Plumbing Co.</h1>
    
    <h2>Key Performance Indicators (Overall)</h2>
    <div class="kpi-container">
"""
for k, v in kpi_data.items():
    html_content += f"""        <div class="kpi-card">
            <h3>{k}</h3>
            <p>{v}</p>
        </div>
"""
html_content += """    </div>

    <h2>Performance Trends</h2>
    <div class="dashboard-container">
        <div class="chart-container">
            <h3>Daily Clicks</h3>
            <img src="clicks_over_time.png" alt="Clicks Over Time">
        </div>
        <div class="chart-container">
            <h3>Daily Impressions</h3>
            <img src="impressions_over_time.png" alt="Impressions Over Time">
        </div>
        <div class="chart-container">
            <h3>Daily Cost</h3>
            <img src="cost_over_time.png" alt="Cost Over Time">
        </div>
        <div class="chart-container">
            <h3>Average CPC</h3>
            <img src="avg_cpc_over_time.png" alt="Average CPC Over Time">
        </div>
        <div class="chart-container">
            <h3>Click-Through Rate (CTR)</h3>
            <img src="ctr_over_time.png" alt="CTR Over Time">
        </div>
        <div class="chart-container">
            <h3>Cost Per Mille (CPM)</h3>
            <img src="cpm_over_time.png" alt="CPM Over Time">
        </div>
    </div>

</body>
</html>
"""

html_file_path = os.path.join(assets_dir, "marketing_dashboard.html")
with open(html_file_path, "w") as f:
    f.write(html_content)
print(f"HTML dashboard generated: {html_file_path}")

print("All visualizations and HTML dashboard generated successfully.")

