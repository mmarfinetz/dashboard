import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚂 Railway Deployment Environment Variables Setup\n');
console.log('This script will help you set up the required environment variables for your Railway deployment.\n');

const requiredVars = {
  // Google Ads
  GOOGLE_ADS_CLIENT_ID: 'Your Google Ads OAuth Client ID',
  GOOGLE_ADS_CLIENT_SECRET: 'Your Google Ads OAuth Client Secret',
  GOOGLE_ADS_DEVELOPER_TOKEN: 'Your Google Ads Developer Token',
  GOOGLE_ADS_REFRESH_TOKEN: 'Your newly generated Google Ads Refresh Token',
  GOOGLE_ADS_CUSTOMER_ID: 'Your Google Ads Customer ID (without hyphens)',
  
  // Facebook
  FACEBOOK_ACCESS_TOKEN: 'Your Facebook Access Token',
  FACEBOOK_AD_ACCOUNT_ID: 'Your Facebook Ad Account ID (format: act_123456789)',
  FACEBOOK_PAGE_ID: 'Your Facebook Page ID (use: 476439392229934)',
  
  // Environment
  NODE_ENV: 'production'
};

console.log('Required environment variables:\n');
Object.entries(requiredVars).forEach(([key, desc]) => {
  console.log(`- ${key}: ${desc}`);
});

console.log('\n📋 Instructions:');
console.log('1. Go to your Railway project dashboard: https://railway.app/dashboard');
console.log('2. Click on your service (perfect-light)');
console.log('3. Go to the "Variables" tab');
console.log('4. Add each of the following environment variables:\n');

console.log('🔧 Option 1: Use Railway CLI');
console.log('Copy and paste these commands in your terminal (after filling in the values):\n');

Object.entries(requiredVars).forEach(([key, desc]) => {
  if (key === 'NODE_ENV') {
    console.log(`railway variables set ${key}=production`);
  } else if (key === 'FACEBOOK_PAGE_ID') {
    console.log(`railway variables set ${key}=476439392229934`);
  } else {
    console.log(`railway variables set ${key}="YOUR_VALUE_HERE"`);
  }
});

console.log('\n🔧 Option 2: Use Railway Dashboard (Recommended)');
console.log('1. Go to Variables tab in your Railway service');
console.log('2. Click "Raw Editor"');
console.log('3. Paste the following (after filling in your values):\n');

const envTemplate = Object.keys(requiredVars).map(key => {
  if (key === 'NODE_ENV') return `${key}=production`;
  if (key === 'FACEBOOK_PAGE_ID') return `${key}=476439392229934`;
  return `${key}=YOUR_VALUE_HERE`;
}).join('\n');

console.log('```');
console.log(envTemplate);
console.log('```');

console.log('\n⚠️  Important Notes:');
console.log('- Make sure to use your newly generated Google Ads refresh token');
console.log('- Remove any quotes or extra spaces from the values');
console.log('- Do NOT include quotes around the values in Railway dashboard');
console.log('- After setting variables, Railway will automatically redeploy');

console.log('\n🚀 After setting the variables:');
console.log('1. Wait for Railway to redeploy (usually takes 1-2 minutes)');
console.log('2. Check the deployment logs in Railway dashboard');
console.log('3. Run: npm run test:railway to verify the deployment');

console.log('\n📝 Example values format (DO NOT use these actual values):');
console.log('GOOGLE_ADS_CLIENT_ID: 123456789012-abcdefghijklmnop.apps.googleusercontent.com');
console.log('GOOGLE_ADS_CLIENT_SECRET: GOCSPX-1234567890abcdefghijk');
console.log('GOOGLE_ADS_DEVELOPER_TOKEN: abcDEF123GHI456jkl');
console.log('GOOGLE_ADS_REFRESH_TOKEN: 1//0abcdefghijklmnopqrstuvwxyz123456789');
console.log('GOOGLE_ADS_CUSTOMER_ID: 1234567890');
console.log('FACEBOOK_ACCESS_TOKEN: EAABsbCS...long_token_here');
console.log('FACEBOOK_AD_ACCOUNT_ID: act_123456789012345');

console.log('\n✅ Setup guide complete! Now go to Railway and add your environment variables.');
console.log('\nPress Enter to exit...');

rl.question('', () => {
  rl.close();
  process.exit(0);
}); 