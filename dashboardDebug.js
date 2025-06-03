/**
 * Dashboard Debug Script
 * 
 * This utility script helps diagnose and fix issues with the Marketing Insights Dashboard.
 * It can test connectivity, check API configurations, and validate credentials.
 * 
 * NOTE: This file has been moved to the consolidated test directory at:
 * /tests/dashboardDebug.js
 * 
 * Please use the new version instead:
 * npm run test:dashboard
 * 
 * Usage: node dashboardDebug.js [command]
 * Commands:
 *  - check-connectivity: Test if frontend can connect to API
 *  - test-api: Test API endpoints with sample requests
 *  - check-credentials: Verify API credentials
 *  - fix-urls: Update hardcoded localhost URLs to relative paths
 *  - all: Run all checks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import dotenv from 'dotenv';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to print colored text
const colorize = (text, color) => {
  return color ? `${colors[color]}${text}${colors.reset}` : text;
};

// Print a section header
const printHeader = (text) => {
  console.log('\n' + colorize('==== ' + text + ' ====', 'cyan'));
};

// Run a command and capture output
const runCommand = (command, args = []) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
      }
    });
  });
};

// Check if server is running
const checkServerStatus = async () => {
  printHeader('Checking API Server Status');
  
  try {
    // Check if server process is running
    const result = await runCommand('lsof', ['-i', ':3001']);
    
    if (result.includes('node')) {
      console.log(colorize('✅ API server is running on port 3001', 'green'));
      return true;
    } else {
      console.log(colorize('❌ API server is not running on port 3001', 'red'));
      return false;
    }
  } catch (error) {
    console.log(colorize('❌ API server is not running', 'red'));
    console.log('To start the server, run: npm run server');
    return false;
  }
};

// Check React frontend connections
const checkFrontendConnections = () => {
  printHeader('Checking Frontend API Connections');
  
  const files = ['Dashboard.jsx', 'FacebookDashboard.jsx'];
  let hardcodedUrls = [];
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for hardcoded localhost URLs
    const matches = content.match(/http:\/\/localhost:[0-9]{4}/g) || [];
    
    if (matches.length > 0) {
      console.log(colorize(`⚠️ Found ${matches.length} hardcoded localhost URLs in ${file}:`, 'yellow'));
      console.log(matches);
      hardcodedUrls.push({ file, urls: matches });
    } else {
      console.log(colorize(`✅ No hardcoded localhost URLs in ${file}`, 'green'));
    }
    
    // Check if getApiBaseUrl is implemented correctly
    if (content.includes('getApiBaseUrl()')) {
      console.log(colorize(`✅ ${file} uses the getApiBaseUrl function`, 'green'));
    } else {
      console.log(colorize(`❌ ${file} does not use the getApiBaseUrl function`, 'red'));
    }
  }
  
  return hardcodedUrls;
};

// Check environment variables
const checkEnvironment = () => {
  printHeader('Checking Environment Variables');
  
  const requiredVars = [
    // Google Ads
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID',
    
    // Facebook
    'FACEBOOK_ACCESS_TOKEN',
    'FACEBOOK_AD_ACCOUNT_ID',
    'FACEBOOK_PAGE_ID'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(colorize(`❌ ${varName} is missing`, 'red'));
      missingVars.push(varName);
    } else {
      const value = process.env[varName];
      const maskedValue = value.length > 8 ? 
        value.substring(0, 4) + '...' + value.substring(value.length - 4) : '****';
      console.log(colorize(`✅ ${varName} is set: ${maskedValue}`, 'green'));
    }
  }
  
  if (missingVars.length > 0) {
    console.log(colorize(`\n⚠️ Missing ${missingVars.length} environment variables`, 'yellow'));
    console.log('These should be set in your .env file or in your Vercel project configuration.');
  } else {
    console.log(colorize('\n✅ All required environment variables are set', 'green'));
  }
  
  return missingVars;
};

// Fix hardcoded URLs
const fixHardcodedUrls = async () => {
  printHeader('Fixing Hardcoded URLs');
  
  const files = ['Dashboard.jsx', 'FacebookDashboard.jsx'];
  let fixedFiles = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file already has the getApiBaseUrl function
    const hasGetApiBaseUrl = content.includes('getApiBaseUrl()');
    
    if (!hasGetApiBaseUrl) {
      console.log(colorize(`Adding getApiBaseUrl function to ${file}...`, 'yellow'));
      
      // Add the function to the top of the file after imports
      const importEndIndex = content.lastIndexOf('import');
      const importEndLine = content.indexOf('\n', importEndIndex);
      
      const functionCode = `\n\n// Helper function to determine the appropriate API base URL based on the environment
const getApiBaseUrl = () => {
  // Check if we're running on a deployed Vercel instance
  const isProduction = window.location.hostname !== 'localhost';
  
  if (isProduction) {
    // In production, use the Railway deployed backend
    return 'https://perfect-light-production.up.railway.app';
  } else {
    // In development, use the local server
    return 'http://localhost:3001';
  }
};\n`;
      
      content = content.substring(0, importEndLine + 1) + functionCode + content.substring(importEndLine + 1);
    }
    
    // Replace hardcoded localhost URLs with getApiBaseUrl()
    const originalContent = content;
    content = content.replace(
      /const apiUrl = `http:\/\/localhost:3001\//g, 
      'const apiUrl = `${getApiBaseUrl()}/'
    );
    
    // Check if anything was replaced
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(colorize(`✅ Updated API URLs in ${file}`, 'green'));
      fixedFiles++;
    } else if (hasGetApiBaseUrl) {
      console.log(colorize(`✅ ${file} already uses getApiBaseUrl correctly`, 'green'));
      fixedFiles++;
    } else {
      console.log(colorize(`⚠️ No changes needed for ${file}`, 'yellow'));
    }
  }
  
  if (fixedFiles === files.length) {
    console.log(colorize('\n✅ All files have been updated to use dynamic API base URLs', 'green'));
    return true;
  } else {
    console.log(colorize(`\n⚠️ Only ${fixedFiles}/${files.length} files were updated`, 'yellow'));
    return false;
  }
};

// Run all checks
const runAllChecks = async () => {
  console.log(colorize('Running complete dashboard diagnostic...', 'blue'));
  
  // 1. Check server status
  const serverRunning = await checkServerStatus();
  
  // 2. Check environment variables
  const missingVars = checkEnvironment();
  
  // 3. Check frontend connections
  const hardcodedUrls = checkFrontendConnections();
  
  // 4. Print summary and suggestions
  printHeader('Diagnostic Summary');
  
  const issues = [];
  
  if (!serverRunning) {
    issues.push('API server is not running');
  }
  
  if (missingVars.length > 0) {
    issues.push(`Missing ${missingVars.length} environment variables`);
  }
  
  if (hardcodedUrls.length > 0) {
    const totalUrls = hardcodedUrls.reduce((sum, item) => sum + item.urls.length, 0);
    issues.push(`Found ${totalUrls} hardcoded URLs in ${hardcodedUrls.length} files`);
  }
  
  if (issues.length === 0) {
    console.log(colorize('✅ No issues detected! The dashboard should be working correctly.', 'green'));
  } else {
    console.log(colorize(`⚠️ Found ${issues.length} issues:`, 'yellow'));
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\nRecommended actions:');
    
    if (!serverRunning) {
      console.log('• Start the API server: npm run server');
    }
    
    if (missingVars.length > 0) {
      console.log('• Add missing environment variables to your .env file');
    }
    
    if (hardcodedUrls.length > 0) {
      console.log('• Fix hardcoded URLs: node dashboardDebug.js fix-urls');
    }
  }
};

// Parse command line arguments
const command = process.argv[2] || 'all';

// Execute the appropriate function based on the command
(async () => {
  try {
    switch (command) {
      case 'check-connectivity':
        await checkServerStatus();
        break;
      
      case 'test-api':
        // Implement additional API tests here
        console.log(colorize('API tests not implemented yet', 'yellow'));
        break;
      
      case 'check-credentials':
        checkEnvironment();
        break;
      
      case 'fix-urls':
        await fixHardcodedUrls();
        break;
      
      case 'all':
        await runAllChecks();
        break;
      
      default:
        console.log(colorize(`Unknown command: ${command}`, 'red'));
        console.log('Available commands: check-connectivity, test-api, check-credentials, fix-urls, all');
    }
  } catch (error) {
    console.error(colorize(`Error: ${error.message}`, 'red'));
    process.exit(1);
  }
})();