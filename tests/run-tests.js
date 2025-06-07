#!/usr/bin/env node

/**
 * Marketing Dashboard Test Runner
 * 
 * This script provides a centralized way to run all the testing and diagnostic
 * tools for the Marketing Dashboard application.
 * 
 * Usage: node tests/run-tests.js [test-name]
 * 
 * Available tests:
 * - local: Test local API connection
 * - railway: Test railway API connection
 * - facebook: Run Facebook API credentials diagnostic
 * - google: Run Google Ads API credentials diagnostic
 * - dashboard: Run dashboard debug tool
 * - all: Run all tests
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Text formatting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Helper function to print colored text
const colorize = (text, color) => `${color}${text}${RESET}`;

// Create readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define available tests
const availableTests = {
  'local': {
    description: 'Test local API connection',
    script: path.join(__dirname, 'testLocalConnection.js')
  },
  'railway': {
    description: 'Test Railway API connection',
    script: path.join(__dirname, 'testRailwayConnection.js')
  },
  'facebook': {
    description: 'Run Facebook API credentials diagnostic',
    script: path.join(__dirname, 'utils/facebookCredentialsDiagnostic.js')
  },
  'google': {
    description: 'Run Google Ads API credentials diagnostic',
    script: path.join(__dirname, 'utils/credentialsDiagnostic.js')
  },
  'dashboard': {
    description: 'Run dashboard debug tool',
    script: path.join(__dirname, 'dashboardDebug.js')
  }
};

// Run the specified test
function runTest(testName) {
  return new Promise((resolve, reject) => {
    if (!availableTests[testName]) {
      console.log(colorize(`Unknown test: ${testName}`, RED));
      resolve(false);
      return;
    }

    const test = availableTests[testName];
    console.log(colorize(`\n==== Running ${test.description} ====\n`, CYAN));

    const testProcess = spawn('node', [test.script], {
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(colorize(`\n✅ ${test.description} completed successfully.`, GREEN));
        resolve(true);
      } else {
        console.log(colorize(`\n❌ ${test.description} failed with code ${code}.`, RED));
        resolve(false);
      }
    });

    testProcess.on('error', (err) => {
      console.error(colorize(`Error running test: ${err}`, RED));
      resolve(false);
    });
  });
}

// Run all available tests sequentially
async function runAllTests() {
  console.log(colorize('\n==== RUNNING ALL TESTS ====\n', MAGENTA));
  
  let results = [];
  
  for (const [testName, test] of Object.entries(availableTests)) {
    const success = await runTest(testName);
    results.push({ name: test.description, success });
    
    // Add a separator
    console.log('\n' + '='.repeat(50) + '\n');
  }
  
  // Print summary
  console.log(colorize('\n==== TEST SUMMARY ====\n', MAGENTA));
  
  const passingTests = results.filter(r => r.success).length;
  console.log(`${passingTests}/${results.length} tests passed\n`);
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? GREEN : RED;
    console.log(colorize(`${icon} ${result.name}`, color));
  });
  
  return passingTests === results.length;
}

// Display interactive menu
function showInteractiveMenu() {
  console.log(colorize('\n===== Marketing Dashboard Test Suite =====\n', CYAN));
  console.log('Choose a test to run:\n');
  
  Object.entries(availableTests).forEach(([key, test], index) => {
    console.log(`${index + 1}. ${test.description}`);
  });
  
  console.log(`${Object.keys(availableTests).length + 1}. Run all tests`);
  console.log(`0. Exit\n`);
  
  rl.question('Enter your choice: ', async (choice) => {
    const numericChoice = parseInt(choice);
    
    if (numericChoice === 0) {
      rl.close();
      return;
    }
    
    if (numericChoice === Object.keys(availableTests).length + 1) {
      await runAllTests();
      rl.close();
      return;
    }
    
    const testKey = Object.keys(availableTests)[numericChoice - 1];
    
    if (testKey) {
      await runTest(testKey);
    } else {
      console.log(colorize('Invalid choice. Please try again.', RED));
    }
    
    rl.close();
  });
}

// Main function
async function main() {
  const testName = process.argv[2]?.toLowerCase();
  
  if (!testName || testName === 'help' || testName === '-h' || testName === '--help') {
    // Show usage instructions
    console.log(colorize('\nMarketing Dashboard Test Runner', CYAN));
    console.log('\nUsage: node tests/run-tests.js [test-name]');
    console.log('\nAvailable tests:');
    
    Object.entries(availableTests).forEach(([name, test]) => {
      console.log(`  - ${name}: ${test.description}`);
    });
    
    console.log('  - all: Run all tests');
    console.log('  - interactive: Show interactive menu\n');
    
    // If no argument was provided, default to interactive mode
    if (!testName) {
      showInteractiveMenu();
    }
    
    return;
  }
  
  let success;

  if (testName === 'all') {
    success = await runAllTests();
  } else if (testName === 'interactive') {
    showInteractiveMenu();
    return;
  } else {
    success = await runTest(testName);
  }

  process.exit(success ? 0 : 1);
}

// Run the main function
main().catch(error => {
  console.error(colorize(`Error: ${error}`, RED));
  process.exit(1);
});