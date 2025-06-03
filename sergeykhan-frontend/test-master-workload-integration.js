#!/usr/bin/env node

/**
 * Master Workload Integration Test
 * Tests the integration between frontend and backend for master workload functionality
 */

const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
    backendUrl: 'http://127.0.0.1:8000',
    curatorUrl: 'http://localhost:3000',
    superAdminUrl: 'http://localhost:3001',
    authToken: '4c35eb0c8ec0131874753d318dfef1d187babe11'
};

// Helper function to make HTTP/HTTPS requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const httpModule = isHttps ? https : http;
        
        const requestOptions = {
            ...options,
            timeout: 5000
        };

        const req = httpModule.get(url, requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    headers: res.headers
                });
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.on('error', reject);
    });
}

// Helper function to make API requests with auth
function makeApiRequest(endpoint) {
    const url = `${CONFIG.backendUrl}${endpoint}`;
    return makeRequest(url, {
        headers: {
            'Authorization': `Token ${CONFIG.authToken}`,
            'Content-Type': 'application/json'
        }
    });
}

// Test functions
async function testBackendAPI() {
    console.log('🔍 Testing Backend API Endpoints...');
    
    try {
        // Test all masters workload endpoint
        const allMastersResponse = await makeApiRequest('/api/masters/workload/all/');
        const allMastersData = JSON.parse(allMastersResponse.data);
        
        console.log(`✅ GET /api/masters/workload/all/ - Status: ${allMastersResponse.statusCode}`);
        console.log(`   📊 Found ${allMastersData.length} masters`);
        
        if (allMastersData.length > 0) {
            // Test specific master workload endpoint
            const firstMaster = allMastersData[0];
            const specificResponse = await makeApiRequest(`/api/masters/${firstMaster.master_id}/workload/`);
            const specificData = JSON.parse(specificResponse.data);
            
            console.log(`✅ GET /api/masters/${firstMaster.master_id}/workload/ - Status: ${specificResponse.statusCode}`);
            console.log(`   📧 Master: ${specificData.master_email}`);
            console.log(`   📅 Orders today: ${specificData.total_orders_today}`);
            console.log(`   ⏰ Next slot: ${specificData.next_available_slot ? specificData.next_available_slot.date : 'None'}`);
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Backend API Error: ${error.message}`);
        return false;
    }
}

async function testFrontendUrls() {
    console.log('🌐 Testing Frontend URLs...');
    
    const urls = [
        { name: 'Curator Master Workload', url: `${CONFIG.curatorUrl}/master-workload` },
        { name: 'Super Admin Master Workload', url: `${CONFIG.superAdminUrl}/master-workload` }
    ];
    
    let successCount = 0;
    
    for (const urlConfig of urls) {
        try {
            const response = await makeRequest(urlConfig.url);
            if (response.statusCode === 200) {
                console.log(`✅ ${urlConfig.name} - Status: ${response.statusCode}`);
                successCount++;
                
                // Check if the response contains expected content
                if (response.data.includes('master-workload') || response.data.includes('Workload') || response.data.includes('Нагрузка')) {
                    console.log(`   📄 Page contains workload-related content`);
                }
            } else {
                console.log(`⚠️  ${urlConfig.name} - Status: ${response.statusCode}`);
            }
        } catch (error) {
            console.log(`❌ ${urlConfig.name} - Error: ${error.message}`);
        }
    }
    
    return successCount === urls.length;
}

async function testDataStructure() {
    console.log('📊 Testing Data Structure Compatibility...');
    
    try {
        const response = await makeApiRequest('/api/masters/workload/all/');
        const data = JSON.parse(response.data);
        
        if (data.length === 0) {
            console.log('⚠️  No master data available for structure test');
            return true;
        }
        
        const masterData = data[0];
        const expectedFields = ['master_id', 'master_email', 'next_available_slot', 'total_orders_today'];
        
        let structureValid = true;
        
        for (const field of expectedFields) {
            if (!(field in masterData)) {
                console.log(`❌ Missing field: ${field}`);
                structureValid = false;
            } else {
                console.log(`✅ Field present: ${field}`);
            }
        }
        
        // Check next_available_slot structure if present
        if (masterData.next_available_slot) {
            const slotFields = ['date', 'start_time', 'end_time'];
            for (const field of slotFields) {
                if (!(field in masterData.next_available_slot)) {
                    console.log(`❌ Missing slot field: ${field}`);
                    structureValid = false;
                } else {
                    console.log(`✅ Slot field present: ${field}`);
                }
            }
        }
        
        return structureValid;
    } catch (error) {
        console.log(`❌ Data Structure Test Error: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Master Workload Integration Test');
    console.log('=====================================\n');
    
    const results = {
        backend: false,
        frontend: false,
        dataStructure: false
    };
    
    // Test backend API
    results.backend = await testBackendAPI();
    console.log('');
    
    // Test data structure
    results.dataStructure = await testDataStructure();
    console.log('');
    
    // Test frontend URLs
    results.frontend = await testFrontendUrls();
    console.log('');
    
    // Summary
    console.log('📊 TEST SUMMARY');
    console.log('================');
    console.log(`Backend API:      ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Data Structure:   ${results.dataStructure ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Frontend URLs:    ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall Result:   ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 Master workload functionality is working correctly!');
        console.log('   - Backend API endpoints are responding properly');
        console.log('   - Data structure matches frontend expectations');
        console.log('   - Frontend applications are accessible');
    } else {
        console.log('\n⚠️  Some issues were found. Please check the details above.');
    }
    
    process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
