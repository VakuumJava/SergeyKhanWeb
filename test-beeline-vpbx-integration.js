#!/usr/bin/env node

/**
 * Test script for Beeline Cloud PBX Integration
 * Tests the complete flow: authentication -> token refresh -> make call
 */

const BASE_URL = 'http://localhost:3000';

async function testVPBXAuthentication() {
    console.log('🔐 Testing VPBX Authentication...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/vpbx/get-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: 'slavakhan100',
                password: 'i4yc448p'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ VPBX Authentication successful');
            console.log(`   Access Token: ${data.accessToken?.substring(0, 20)}...`);
            console.log(`   Refresh Token: ${data.refreshToken?.substring(0, 20)}...`);
            console.log(`   Expires In: ${data.expiresIn} seconds`);
            return data;
        } else {
            console.log('❌ VPBX Authentication failed');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.message || data.error}`);
            return null;
        }
    } catch (error) {
        console.log('❌ VPBX Authentication error:', error.message);
        return null;
    }
}

async function testTokenRefresh(refreshToken) {
    console.log('\n🔄 Testing Token Refresh...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/vpbx/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Token refresh successful');
            console.log(`   New Access Token: ${data.accessToken?.substring(0, 20)}...`);
            return data;
        } else {
            console.log('❌ Token refresh failed');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.message || data.error}`);
            return null;
        }
    } catch (error) {
        console.log('❌ Token refresh error:', error.message);
        return null;
    }
}

async function testMakeCall(accessToken, abonentNumber = '+996555123456', number = '+996777987654') {
    console.log('\n📞 Testing Make Call...');
    
    try {
        const params = new URLSearchParams({
            abonentNumber,
            number
        });
        
        const response = await fetch(`${BASE_URL}/api/vpbx/MakeCall2?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.text();
        
        if (response.ok) {
            console.log('✅ Make call request successful');
            console.log(`   Response: ${data}`);
            return true;
        } else {
            console.log('❌ Make call failed');
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${data}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Make call error:', error.message);
        return false;
    }
}

async function runCompleteTest() {
    console.log('🧪 Starting Beeline Cloud PBX Integration Test');
    console.log('=' .repeat(50));
    
    // Step 1: Test authentication
    const authData = await testVPBXAuthentication();
    if (!authData) {
        console.log('\n❌ Test failed at authentication step');
        return;
    }
    
    // Step 2: Test token refresh
    const refreshData = await testTokenRefresh(authData.refreshToken);
    if (!refreshData) {
        console.log('\n❌ Test failed at token refresh step');
        return;
    }
    
    // Step 3: Test make call (using refreshed token)
    const callSuccess = await testMakeCall(refreshData.accessToken);
    
    console.log('\n' + '=' .repeat(50));
    
    if (callSuccess) {
        console.log('🎉 ALL TESTS PASSED! Beeline Cloud PBX integration is working correctly.');
        console.log('📋 Summary:');
        console.log('   ✅ Authentication with Beeline credentials');
        console.log('   ✅ Token refresh mechanism');
        console.log('   ✅ Call initiation through MakeCall2 API');
        console.log('\n🔗 You can now use the call interface at: http://localhost:3000/call');
    } else {
        console.log('⚠️  Some tests failed. Please check the configuration.');
    }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runCompleteTest().catch(console.error);
}

export { testVPBXAuthentication, testTokenRefresh, testMakeCall, runCompleteTest };
