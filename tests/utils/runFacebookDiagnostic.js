#!/usr/bin/env node

/**
 * Facebook API Credentials Diagnostic Runner
 * 
 * This script runs the Facebook credentials diagnostic utility
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Facebook credentials diagnostic file
const diagnosticScript = path.join(__dirname, 'facebookCredentialsDiagnostic.js');

// Run the script
console.log('Running Facebook API credentials diagnostic...\n');

// Spawn the process
const diagnosticProcess = spawn('node', [diagnosticScript], {
  stdio: 'inherit'
});

// Handle process completion
diagnosticProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Facebook API credentials diagnostic completed successfully.');
    console.log('\nIf you need to fix any issues:');
    console.log('1. Update your .env file with the correct values');
    console.log('2. Generate a new long-lived access token if needed');
    console.log('3. Verify your Facebook ad account ID and permissions');
  } else {
    console.log(`\n❌ Facebook API credentials diagnostic failed with code ${code}.`);
    console.log('Please fix the identified issues before proceeding.');
  }
});

// Handle any errors during execution
diagnosticProcess.on('error', (err) => {
  console.error('Error running diagnostic script:', err);
  process.exit(1);
});