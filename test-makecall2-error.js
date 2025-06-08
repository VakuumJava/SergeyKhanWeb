#!/usr/bin/env node

/**
 * Test script to reproduce the MakeCall2 500 error
 */

async function testMakeCall2() {
  console.log("🧪 Testing MakeCall2 endpoint to reproduce 500 error...");
  
  try {
    // First, let's try to get a token
    console.log("Step 1: Getting VPBX token...");
    const tokenResponse = await fetch("http://localhost:3003/api/vpbx/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "slavakhan100",
        password: "i4yc448p"
      })
    });
    
    if (!tokenResponse.ok) {
      console.error("❌ Failed to get token:", await tokenResponse.text());
      return;
    }
    
    const tokenData = await tokenResponse.json();
    console.log("✅ Token obtained successfully");
    
    // Now test MakeCall2 with the same parameters that caused the 500 error
    console.log("Step 2: Testing MakeCall2 with problematic parameters...");
    const makeCallResponse = await fetch(
      "http://localhost:3003/api/vpbx/MakeCall2?abonentNumber=6770&number=%2B996557819199",
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenData.accessToken}`
        }
      }
    );
    
    console.log("MakeCall2 Response Status:", makeCallResponse.status);
    console.log("MakeCall2 Response Headers:", Object.fromEntries(makeCallResponse.headers));
    
    const responseText = await makeCallResponse.text();
    console.log("MakeCall2 Response Body:", responseText);
    
    if (!makeCallResponse.ok) {
      console.error("❌ MakeCall2 failed with status:", makeCallResponse.status);
    } else {
      console.log("✅ MakeCall2 succeeded!");
    }
    
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testMakeCall2();
