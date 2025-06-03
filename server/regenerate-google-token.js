import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Google Ads Refresh Token Regeneration Helper\n');

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const redirectUri = 'http://localhost:3001/auth/google/callback';

if (!clientId) {
  console.error('❌ GOOGLE_ADS_CLIENT_ID not found in environment variables');
  process.exit(1);
}

console.log('Current refresh token issue detected:');
console.log('   Error: "No access, refresh token, API key or refresh handler callback is set"');
console.log('   This typically means the refresh token is invalid or missing required scopes.\n');

console.log('To fix this, visit the following URL in your browser:');
console.log('==========================================');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords')}&` +
  `access_type=offline&` +
  `prompt=consent&` +
  `response_type=code`;

console.log(authUrl);
console.log('==========================================\n');

console.log('Steps:');
console.log('1. Visit the URL above');
console.log('2. Sign in with your Google account that has access to Google Ads');
console.log('3. Grant all requested permissions');
console.log('4. You will be redirected to http://localhost:3001/auth/google/callback');
console.log('5. Copy the new refresh token from the response');
console.log('6. Update your .env file with GOOGLE_ADS_REFRESH_TOKEN=<new-token>');
console.log('7. Restart your server\n');

console.log('⚠️  Make sure your server is running locally first:');
console.log('   cd server && node server.js\n');

console.log('📝 Note: The server must be running to handle the OAuth callback'); 