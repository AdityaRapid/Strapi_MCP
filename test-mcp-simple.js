#!/usr/bin/env node

// Simple MCP server test that can be used by deployment platforms
import { spawn } from 'child_process';

console.log('🧪 Simple MCP Server Test');
console.log('=========================');

// Check required environment variables
const requiredEnvVars = ['STRAPI_API_URL', 'STRAPI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:', missingVars.join(', '));
    console.log('\nRequired environment variables:');
    console.log('- STRAPI_API_URL: Your Strapi instance URL');
    console.log('- STRAPI_API_KEY: Your Strapi API token');
    console.log('\nOptional environment variables:');
    console.log('- STRAPI_SERVER_NAME: Server name (default: "default")');
    console.log('- STRAPI_API_PREFIX: API prefix (default: "/api")');
    console.log('- STRAPI_VERSION: Strapi version (e.g., "5.*")');
    process.exit(1);
}

console.log('✅ Required environment variables are set');
console.log('- STRAPI_API_URL:', process.env.STRAPI_API_URL);
console.log('- STRAPI_API_KEY: [REDACTED]');
console.log('- STRAPI_SERVER_NAME:', process.env.STRAPI_SERVER_NAME || 'default');
console.log('- STRAPI_API_PREFIX:', process.env.STRAPI_API_PREFIX || '/api');

try {
    console.log('\n🚀 Starting MCP server...');
    
    const serverProcess = spawn('node', ['build/index.js'], {
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let hasOutput = false;
    let hasError = false;
    
    serverProcess.stdout.on('data', (data) => {
        hasOutput = true;
        console.log('📤 Server output:', data.toString().trim());
    });
    
    serverProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output.includes('"level":"ERROR"')) {
            hasError = true;
            console.log('❌ Server error:', output);
        } else {
            console.log('📋 Server log:', output);
        }
    });
    
    serverProcess.on('close', (code) => {
        console.log(`\n🔚 Server process exited with code ${code}`);
        if (code === 0 && hasOutput && !hasError) {
            console.log('✅ MCP server test PASSED');
            process.exit(0);
        } else {
            console.log('❌ MCP server test FAILED');
            process.exit(1);
        }
    });
    
    // Wait for 5 seconds to see if server starts properly
    setTimeout(() => {
        console.log('\n⏰ Test timeout reached');
        serverProcess.kill();
        
        if (hasOutput && !hasError) {
            console.log('✅ MCP server appears to be working');
            process.exit(0);
        } else {
            console.log('❌ MCP server did not start properly');
            process.exit(1);
        }
    }, 5000);
    
} catch (error) {
    console.log('❌ Failed to start MCP server:', error.message);
    process.exit(1);
}
