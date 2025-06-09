/**
 * Update Google Ads Credentials Helper
 * 
 * This script provides a simple way to update Google Ads credentials
 * in the .env files when tokens need to be refreshed.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main paths to check and update
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, 'server', '.env')
];

// Get user input with a prompt
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Update a specific credential in .env files
async function updateCredential(credentialName, credentialValue) {
  let updated = false;
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Checking ${envPath}...`);
      
      // Read the file
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if the credential exists in this file
      const regex = new RegExp(`${credentialName}=.*`, 'g');
      
      if (regex.test(envContent)) {
        // Replace the existing credential
        envContent = envContent.replace(regex, `${credentialName}=${credentialValue}`);
        
        // Write the updated content back to the file
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Updated ${credentialName} in ${envPath}`);
        updated = true;
      } else {
        // Add the credential to the end of the file
        envContent += `\n${credentialName}=${credentialValue}`;
        
        // Write the updated content back to the file
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Added ${credentialName} to ${envPath}`);
        updated = true;
      }
    }
  }
  
  return updated;
}

// Main function
async function main() {
  console.log('🔧 Google Ads Credentials Update Helper');
  console.log('=======================================');
  console.log('This tool helps update Google Ads credentials in your .env files.');
  console.log('You can update one or more credentials as needed.');
  console.log('');
  
  // Check if .env files exist
  const existingEnvPaths = envPaths.filter(p => fs.existsSync(p));
  
  if (existingEnvPaths.length === 0) {
    console.error('❌ No .env files found. Please create at least one .env file in:');
    console.error('   - ' + envPaths[0]);
    console.error('   - ' + envPaths[1]);
    rl.close();
    return;
  }
  
  console.log('Found .env files:');
  existingEnvPaths.forEach(p => console.log('- ' + p));
  console.log('');
  
  // Options menu
  console.log('Which Google Ads credential do you want to update?');
  console.log('1. GOOGLE_ADS_REFRESH_TOKEN (most common)');
  console.log('2. GOOGLE_ADS_CLIENT_ID');
  console.log('3. GOOGLE_ADS_CLIENT_SECRET');
  console.log('4. GOOGLE_ADS_DEVELOPER_TOKEN');
  console.log('5. GOOGLE_ADS_CUSTOMER_ID');
  console.log('6. Exit');
  
  const choice = await prompt('\nEnter your choice (1-6): ');
  
  let credentialName, credentialValue;
  
  switch (choice) {
    case '1':
      credentialName = 'GOOGLE_ADS_REFRESH_TOKEN';
      console.log('\nUpdating Google Ads Refresh Token');
      console.log('--------------------------------');
      console.log('This is the most common credential that needs updating.');
      console.log('You can get a new refresh token by running:');
      console.log('node server/regenerate-google-token.js');
      break;
    case '2':
      credentialName = 'GOOGLE_ADS_CLIENT_ID';
      console.log('\nUpdating Google Ads Client ID');
      console.log('---------------------------');
      console.log('You can find this in the Google Cloud Console > APIs & Services > Credentials');
      break;
    case '3':
      credentialName = 'GOOGLE_ADS_CLIENT_SECRET';
      console.log('\nUpdating Google Ads Client Secret');
      console.log('-------------------------------');
      console.log('You can find this in the Google Cloud Console > APIs & Services > Credentials');
      break;
    case '4':
      credentialName = 'GOOGLE_ADS_DEVELOPER_TOKEN';
      console.log('\nUpdating Google Ads Developer Token');
      console.log('---------------------------------');
      console.log('You can find this in the Google Ads API Center');
      break;
    case '5':
      credentialName = 'GOOGLE_ADS_CUSTOMER_ID';
      console.log('\nUpdating Google Ads Customer ID');
      console.log('-----------------------------');
      console.log('This is your Google Ads account ID (without dashes)');
      break;
    case '6':
      console.log('\nExiting without changes.');
      rl.close();
      return;
    default:
      console.log('\n❌ Invalid choice. Exiting.');
      rl.close();
      return;
  }
  
  // Get the new value for the selected credential
  credentialValue = await prompt(`\nEnter the new value for ${credentialName}: `);
  
  if (!credentialValue.trim()) {
    console.log('\n❌ No value provided. Exiting without changes.');
    rl.close();
    return;
  }
  
  // Confirm the update
  const confirm = await prompt(`\nUpdate ${credentialName} to "${credentialValue}"? (y/n): `);
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\nUpdate canceled. Exiting without changes.');
    rl.close();
    return;
  }
  
  // Update the credential
  const updated = await updateCredential(credentialName, credentialValue);
  
  if (updated) {
    console.log('\n✅ Credential updated successfully in all .env files.');
    console.log('Restart your server for the changes to take effect.');
  } else {
    console.log('\n❌ Failed to update credential. No .env files were modified.');
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
});