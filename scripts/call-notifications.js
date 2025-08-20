#!/usr/bin/env node

/**
 * Call Notifications API Script
 * This script calls the notification endpoint to send unread message notifications
 * 
 * Usage:
 * - node scripts/call-notifications.js
 * - npm run notifications:call
 */

const https = require('https');
const http = require('http');

// Configuration - you can modify these values
const config = {
  apiUrl: process.env.NOTIFICATION_API_URL || 'http://localhost:3000',
  apiToken: process.env.CRON_SECRET || 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  endpoint: '/api/email/send-unread'
};

/**
 * Make HTTP request to the notification API
 */
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const isHttps = url.toString().startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000); // 30 second timeout
    req.end();
  });
}

/**
 * Call the notification API
 */
async function callNotificationAPI() {
  try {
    // Check if token is configured
    if (!config.apiToken || config.apiToken === 'your_token_here') {
      console.error('❌ Error: CRON_SECRET not configured');
      console.error('Please set the environment variable or update the script');
      console.error('');
      console.error('Set it in your .env.local file:');
      console.error('CRON_SECRET=your_actual_token_here');
      console.error('');
      console.error('Or run: export CRON_SECRET=your_token_here');
      process.exit(1);
    }

    const url = new URL(config.endpoint, config.apiUrl);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Feedbird-Notification-Caller/1.0'
      }
    };
    
    console.log('🚀 Calling notification API...');
    console.log(`📡 URL: ${url.toString()}`);
    console.log(`🔑 Token: ${config.apiToken.substring(0, 8)}...${config.apiToken.substring(config.apiToken.length - 8)}`);
    console.log('');
    
    const startTime = Date.now();
    const response = await makeRequest(url, options);
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Success! Notifications sent:');
      console.log(JSON.stringify(response.data, null, 2));
    } else if (response.statusCode === 401) {
      console.error('❌ Unauthorized: Check your CRON_SECRET');
      console.error('Response:', response.data);
    } else if (response.statusCode === 404) {
      console.error('❌ Not Found: Check if the API endpoint exists');
      console.error('Response:', response.data);
    } else {
      console.error(`❌ Error ${response.statusCode}:`);
      console.error('Response:', response.data);
    }
    
  } catch (error) {
    console.error('💥 Error calling notification API:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('💡 Make sure your development server is running:');
      console.error('   npm run dev');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('📧 Feedbird Notification API Caller');
  console.log('=====================================');
  console.log('');
  
  await callNotificationAPI();
  
  console.log('');
  console.log('🏁 Script completed.');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  callNotificationAPI,
  config
};
