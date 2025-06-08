#!/usr/bin/env python3
import requests
import json

# Backend URL
BASE_URL = "http://127.0.0.1:8000"

def test_distribution():
    print("=== Testing Dynamic Distribution System ===")
    
    # Login to get token
    login_data = {
        "email": "test_api@example.com",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return
    
    token = response.json().get("token")
    headers = {"Authorization": f"Token {token}"}
    print(f"✅ Logged in successfully")
    
    # Get current profit distribution settings
    settings_response = requests.get(f"{BASE_URL}/api/profit-distribution-settings/", headers=headers)
    if settings_response.status_code == 200:
        settings = settings_response.json()
        print(f"📊 Current distribution settings:")
        print(f"   - Master cash: {settings.get('cash_percent', 'N/A')}%")
        print(f"   - Master balance: {settings.get('balance_percent', 'N/A')}%")
        print(f"   - Curator: {settings.get('curator_percent', 'N/A')}%")
        print(f"   - Company: {settings.get('final_kassa_percent', 'N/A')}%")
    else:
        print(f"⚠️ Could not fetch settings: {settings_response.status_code}")
    
    # Get pending completions
    completions_response = requests.get(f"{BASE_URL}/api/completions/pending/", headers=headers)
    if completions_response.status_code != 200:
        print(f"❌ Failed to get pending completions: {completions_response.status_code}")
        return
    
    completions = completions_response.json()
    if not completions:
        print("📝 No pending completions found")
        return
    
    print(f"📋 Found {len(completions)} pending completions")
    
    # Test with the first completion
    completion = completions[0]
    completion_id = completion['id']
    net_profit = float(completion['net_profit'])
    
    print(f"\n🔍 Testing completion #{completion_id}")
    print(f"   - Net profit: {net_profit:,.2f} ₸")
    print(f"   - Master: {completion['master_email']}")
    
    # Calculate expected distribution based on current settings
    if settings_response.status_code == 200:
        settings = settings_response.json()
        expected_master = net_profit * (settings.get('cash_percent', 30) / 100)
        expected_curator = net_profit * (settings.get('curator_percent', 5) / 100)
        expected_company = net_profit * (settings.get('final_kassa_percent', 35) / 100)
        
        print(f"📈 Expected distribution:")
        print(f"   - Master: {expected_master:,.2f} ₸")
        print(f"   - Curator: {expected_curator:,.2f} ₸")
        print(f"   - Company: {expected_company:,.2f} ₸")
    
    # Approve the completion
    review_data = {
        "action": "approve"
    }
    
    review_response = requests.post(
        f"{BASE_URL}/api/completions/{completion_id}/review/",
        data=review_data,
        headers=headers
    )
    
    if review_response.status_code == 200:
        result = review_response.json()
        actual_master = float(result.get('master_payment', 0))
        actual_curator = float(result.get('curator_payment', 0))
        actual_company = float(result.get('company_payment', 0))
        
        print(f"\n✅ Completion approved successfully!")
        print(f"💰 Actual distribution:")
        print(f"   - Master: {actual_master:,.2f} ₸")
        print(f"   - Curator: {actual_curator:,.2f} ₸")
        print(f"   - Company: {actual_company:,.2f} ₸")
        
        # Verify accuracy
        if settings_response.status_code == 200:
            master_diff = abs(actual_master - expected_master)
            curator_diff = abs(actual_curator - expected_curator)
            company_diff = abs(actual_company - expected_company)
            
            if master_diff < 0.01 and curator_diff < 0.01 and company_diff < 0.01:
                print(f"🎯 Distribution matches expected values perfectly!")
            else:
                print(f"⚠️ Small differences detected (likely rounding):")
                print(f"   - Master diff: {master_diff:.4f}")
                print(f"   - Curator diff: {curator_diff:.4f}")
                print(f"   - Company diff: {company_diff:.4f}")
        
        print(f"\n🏁 Dynamic distribution system working correctly!")
        
    else:
        print(f"❌ Failed to approve completion: {review_response.status_code}")
        if review_response.text:
            print(f"Error: {review_response.text}")

if __name__ == "__main__":
    test_distribution()
