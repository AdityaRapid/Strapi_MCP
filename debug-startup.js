#!/usr/bin/env node

// Debug script to help diagnose MCP server startup issues
console.log('🔍 MCP Server Startup Diagnostics');
console.log('==================================');

console.log('\n📋 Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- STRAPI_API_URL:', process.env.STRAPI_API_URL || 'not set');
console.log('- STRAPI_API_KEY:', process.env.STRAPI_API_KEY ? 'set (length: ' + process.env.STRAPI_API_KEY.length + ')' : 'not set');
console.log('- STRAPI_SERVER_NAME:', process.env.STRAPI_SERVER_NAME || 'not set');
console.log('- STRAPI_API_PREFIX:', process.env.STRAPI_API_PREFIX || 'not set');
console.log('- STRAPI_VERSION:', process.env.STRAPI_VERSION || 'not set');

console.log('\n📁 File System Check:');
try {
    const fs = await import('fs');
    const path = await import('path');
    
    console.log('- Current directory:', process.cwd());
    console.log('- build/index.js exists:', fs.existsSync('build/index.js'));
    console.log('- package.json exists:', fs.existsSync('package.json'));
    
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log('- Package name:', pkg.name);
        console.log('- Package version:', pkg.version);
    }
} catch (error) {
    console.log('- File system check failed:', error.message);
}

console.log('\n🔌 Testing MCP Server Import:');
try {
    // Try to import the MCP server
    console.log('- Attempting to import build/index.js...');
    
    // Set required environment variables if not set
    if (!process.env.STRAPI_API_URL) {
        process.env.STRAPI_API_URL = 'http://localhost:1337';
        console.log('- Set default STRAPI_API_URL');
    }
    if (!process.env.STRAPI_API_KEY) {
        process.env.STRAPI_API_KEY = 'dummy-key-for-testing';
        console.log('- Set dummy STRAPI_API_KEY');
    }
    
    const { spawn } = await import('child_process');
    
    console.log('- Starting MCP server process...');
    const serverProcess = spawn('node', ['build/index.js'], {
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    serverProcess.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });
    
    // Wait for 3 seconds to see if server starts
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    serverProcess.kill();
    
    console.log('\n📤 Server Output:');
    if (output) {
        console.log(output);
    } else {
        console.log('- No stdout output');
    }
    
    console.log('\n❌ Server Errors:');
    if (errorOutput) {
        console.log(errorOutput);
    } else {
        console.log('- No stderr output');
    }
    
} catch (error) {
    console.log('❌ MCP Server test failed:', error.message);
    console.log('Stack:', error.stack);
}

console.log('\n✅ Diagnostics complete!');
console.log('\n💡 Next steps:');
console.log('1. Check that all required environment variables are set in Smithery');
console.log('2. Ensure the build process completed successfully');
console.log('3. Verify that the MCP server can start with the provided configuration');
