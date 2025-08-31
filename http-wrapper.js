#!/usr/bin/env node

// HTTP wrapper for MCP server to enable health checks and scanning
import http from 'http';
import { spawn } from 'child_process';

const PORT = process.env.PORT || 3000;

console.log('🌐 Starting HTTP wrapper for MCP server...');
console.log('Port:', PORT);

// Check if MCP server can start
function testMCPServer() {
    return new Promise((resolve, reject) => {
        console.log('🧪 Testing MCP server startup...');
        
        const serverProcess = spawn('node', ['build/index.js'], {
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let hasOutput = false;
        let hasError = false;
        let output = '';
        let errorOutput = '';
        
        serverProcess.stdout.on('data', (data) => {
            hasOutput = true;
            output += data.toString();
        });
        
        serverProcess.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            if (text.includes('"level":"ERROR"')) {
                hasError = true;
            }
        });
        
        // Test for 3 seconds
        setTimeout(() => {
            serverProcess.kill();
            
            if (hasOutput && !hasError) {
                console.log('✅ MCP server test passed');
                resolve({
                    success: true,
                    output: output.trim(),
                    error: errorOutput.trim()
                });
            } else {
                console.log('❌ MCP server test failed');
                reject(new Error('MCP server failed to start properly'));
            }
        }, 3000);
    });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    if (url.pathname === '/health' || url.pathname === '/') {
        try {
            const result = await testMCPServer();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                message: 'MCP server is working',
                mcp_server_test: result,
                environment: {
                    STRAPI_API_URL: process.env.STRAPI_API_URL || 'not set',
                    STRAPI_API_KEY: process.env.STRAPI_API_KEY ? 'set' : 'not set',
                    STRAPI_SERVER_NAME: process.env.STRAPI_SERVER_NAME || 'not set',
                    STRAPI_API_PREFIX: process.env.STRAPI_API_PREFIX || 'not set'
                },
                tools: [
                    'strapi_list_servers',
                    'strapi_get_content_types',
                    'strapi_get_components', 
                    'strapi_rest',
                    'strapi_upload_media'
                ]
            }, null, 2));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                message: 'MCP server failed to start',
                error: error.message,
                environment: {
                    STRAPI_API_URL: process.env.STRAPI_API_URL || 'not set',
                    STRAPI_API_KEY: process.env.STRAPI_API_KEY ? 'set' : 'not set',
                    STRAPI_SERVER_NAME: process.env.STRAPI_SERVER_NAME || 'not set',
                    STRAPI_API_PREFIX: process.env.STRAPI_API_PREFIX || 'not set'
                }
            }, null, 2));
        }
    } else if (url.pathname === '/mcp') {
        // Endpoint to actually run the MCP server
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write('Starting MCP server...\n');
        
        const serverProcess = spawn('node', ['build/index.js'], {
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        serverProcess.stdout.on('data', (data) => {
            res.write(`STDOUT: ${data}`);
        });
        
        serverProcess.stderr.on('data', (data) => {
            res.write(`STDERR: ${data}`);
        });
        
        serverProcess.on('close', (code) => {
            res.write(`\nProcess exited with code ${code}`);
            res.end();
        });
        
        // Kill after 10 seconds
        setTimeout(() => {
            serverProcess.kill();
        }, 10000);
        
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Not found',
            available_endpoints: ['/health', '/mcp']
        }));
    }
});

server.listen(PORT, () => {
    console.log(`✅ HTTP wrapper listening on port ${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 MCP test: http://localhost:${PORT}/mcp`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Shutting down HTTP wrapper...');
    server.close(() => {
        process.exit(0);
    });
});
