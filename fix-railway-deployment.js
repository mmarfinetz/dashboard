#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import readline from 'readline';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const colorize = (text, color) => `${color}${text}${RESET}`;

console.log(colorize('🚀 Railway Deployment Fix Script', BLUE));
console.log('=====================================\n');

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
  FACEBOOK_PAGE_ID: 'Your Facebook Page ID',
  
  // Environment
  NODE_ENV: 'production'
};

console.log('Required environment variables:\n');
Object.entries(requiredVars).forEach(([key, desc]) => {
  console.log(`- ${key}: ${desc}`);
});

console.log('\n📋 Instructions:');
console.log('1. Go to your Railway project dashboard');
console.log('2. Click on your service (perfect-light)');
console.log('3. Go to the "Variables" tab');
console.log('4. Add each of the following environment variables:\n');

console.log('Copy and paste these commands in your terminal (after filling in the values):\n');

Object.entries(requiredVars).forEach(([key, desc]) => {
  if (key === 'NODE_ENV') {
    console.log(`railway variables set ${key}=production`);
  } else {
    console.log(`railway variables set ${key}="YOUR_VALUE_HERE"`);
  }
});

console.log('\n🔧 Alternative: Set all variables at once');
console.log('You can also set all variables in the Railway dashboard UI:');
console.log('1. Go to Variables tab in your Railway service');
console.log('2. Click "Raw Editor"');
console.log('3. Paste the following (after filling in your values):\n');

const envTemplate = Object.keys(requiredVars).map(key => {
  if (key === 'NODE_ENV') return `${key}=production`;
  return `${key}=YOUR_VALUE_HERE`;
}).join('\n');

console.log(envTemplate);

console.log('\n⚠️  Important Notes:');
console.log('- Make sure to use your newly generated Google Ads refresh token');
console.log('- Remove any quotes or extra spaces from the values');
console.log('- The Facebook Page ID should be: 476439392229934 (based on your previous setup)');
console.log('- After setting variables, Railway will automatically redeploy');

console.log('\n🚀 After setting the variables:');
console.log('1. Wait for Railway to redeploy (usually takes 1-2 minutes)');
console.log('2. Check the deployment logs in Railway dashboard');
console.log('3. Run: npm run test:railway to verify the deployment');

rl.question('\nWould you like to see example values? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\n📝 Example values (DO NOT use these actual values):');
    console.log('GOOGLE_ADS_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com');
    console.log('GOOGLE_ADS_CLIENT_SECRET=GOCSPX-1234567890abcdefghijk');
    console.log('GOOGLE_ADS_DEVELOPER_TOKEN=abcDEF123GHI456jkl');
    console.log('GOOGLE_ADS_REFRESH_TOKEN=1//0abcdefghijklmnopqrstuvwxyz123456789');
    console.log('GOOGLE_ADS_CUSTOMER_ID=1234567890');
    console.log('FACEBOOK_ACCESS_TOKEN=EAABsbCS...long_token_here');
    console.log('FACEBOOK_AD_ACCOUNT_ID=act_123456789012345');
    console.log('FACEBOOK_PAGE_ID=476439392229934');
    console.log('NODE_ENV=production');
  }
  
  console.log('\n✅ Setup guide complete! Now go to Railway and add your environment variables.');
  rl.close();
});

async function checkAndFixDeploymentIssues() {
  let issues = [];
  let fixes = [];

  // 1. Check if .env exists in server directory
  console.log('1. Checking server/.env file...');
  try {
    await fs.access(path.join(__dirname, 'server', '.env'));
    console.log(colorize('   ✓ server/.env file exists', GREEN));
  } catch (error) {
    console.log(colorize('   ❌ server/.env file missing', RED));
    issues.push('server/.env file missing');
    
    try {
      await fs.copyFile(
        path.join(__dirname, '.env'),
        path.join(__dirname, 'server', '.env')
      );
      console.log(colorize('   ✓ Copied .env to server directory', GREEN));
      fixes.push('Created server/.env file');
    } catch (copyError) {
      console.log(colorize('   ❌ Failed to copy .env file', RED));
      issues.push('Could not create server/.env file');
    }
  }

  // 2. Check server.js for robust error handling
  console.log('\n2. Checking server.js error handling...');
  try {
    const serverContent = await fs.readFile(path.join(__dirname, 'server', 'server.js'), 'utf8');
    
    if (serverContent.includes('try {') && serverContent.includes('import(')) {
      console.log(colorize('   ✓ Server has error handling for service imports', GREEN));
    } else {
      console.log(colorize('   ⚠️ Server may crash on service import failures', YELLOW));
      issues.push('Server lacks robust error handling');
    }
  } catch (error) {
    console.log(colorize('   ❌ Cannot read server.js', RED));
    issues.push('Cannot analyze server.js');
  }

  // 3. Check Railway configuration
  console.log('\n3. Checking railway.json configuration...');
  try {
    const railwayConfig = JSON.parse(
      await fs.readFile(path.join(__dirname, 'railway.json'), 'utf8')
    );
    
    if (railwayConfig.deploy?.healthcheckPath === '/health') {
      console.log(colorize('   ✓ Health check configured', GREEN));
    } else {
      console.log(colorize('   ⚠️ No health check configured', YELLOW));
      issues.push('Missing health check configuration');
    }
    
    if (railwayConfig.deploy?.startCommand?.includes('node server.js')) {
      console.log(colorize('   ✓ Start command configured correctly', GREEN));
    } else {
      console.log(colorize('   ⚠️ Start command may be incorrect', YELLOW));
      issues.push('Start command needs verification');
    }
  } catch (error) {
    console.log(colorize('   ❌ Cannot read railway.json', RED));
    issues.push('Railway configuration invalid');
  }

  // 4. Test Google Ads credentials
  console.log('\n4. Testing Google Ads credentials...');
  try {
    const { stdout, stderr } = await execAsync('node server/utils/credentialsDiagnostic.js');
    
    if (stdout.includes('API query failed')) {
      console.log(colorize('   ❌ Google Ads API credentials invalid', RED));
      issues.push('Google Ads refresh token invalid');
      console.log(colorize('   💡 Run: node server/regenerate-google-token.js', BLUE));
    } else if (stdout.includes('✓ API query successful')) {
      console.log(colorize('   ✓ Google Ads credentials working', GREEN));
    } else {
      console.log(colorize('   ⚠️ Google Ads credentials need verification', YELLOW));
      issues.push('Google Ads credentials unclear');
    }
  } catch (error) {
    console.log(colorize('   ⚠️ Could not test Google Ads credentials', YELLOW));
    issues.push('Cannot verify Google Ads credentials');
  }

  // 5. Test local server startup
  console.log('\n5. Testing local server startup...');
  try {
    const response = await fetch('http://localhost:3001/health', { timeout: 5000 });
    if (response.ok) {
      console.log(colorize('   ✓ Local server is running', GREEN));
    } else {
      console.log(colorize('   ❌ Local server returned error', RED));
      issues.push('Local server not healthy');
    }
  } catch (error) {
    console.log(colorize('   ⚠️ Local server not running (this is normal)', YELLOW));
    console.log(colorize('   💡 Start with: cd server && node server.js', BLUE));
  }

  // Summary
  console.log('\n' + colorize('📋 DEPLOYMENT ISSUE SUMMARY', BLUE));
  console.log('=====================================');
  
  if (issues.length === 0) {
    console.log(colorize('✅ No deployment issues detected!', GREEN));
    console.log('\nYour Railway deployment should work. If still getting 502 errors:');
    console.log('1. Check Railway logs for specific error messages');
    console.log('2. Verify environment variables are set in Railway dashboard');
    console.log('3. Try redeploying the application');
  } else {
    console.log(colorize(`❌ Found ${issues.length} issue(s):`, RED));
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    if (fixes.length > 0) {
      console.log(colorize(`\n✅ Applied ${fixes.length} fix(es):`, GREEN));
      fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
  }

  console.log('\n' + colorize('🔧 NEXT STEPS FOR RAILWAY DEPLOYMENT:', BLUE));
  console.log('=====================================');
  console.log('1. Fix Google Ads refresh token:');
  console.log('   node server/regenerate-google-token.js');
  console.log('');
  console.log('2. Update environment variables in Railway dashboard:');
  console.log('   - Copy all values from your .env file');
  console.log('   - Paste them in Railway project settings > Variables');
  console.log('');
  console.log('3. Redeploy the application:');
  console.log('   - Push changes to git');
  console.log('   - Railway will automatically redeploy');
  console.log('');
  console.log('4. Monitor the deployment:');
  console.log('   - Check Railway logs during deployment');
  console.log('   - Test endpoints once deployment completes');

  return { issues, fixes };
}

// Run the fix script
checkAndFixDeploymentIssues().catch(error => {
  console.error(colorize(`Error running deployment fix: ${error.message}`, RED));
}); 