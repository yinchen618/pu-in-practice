#!/usr/bin/env python3
"""
快速測試腳本：驗證 ammeter-history API 422 錯誤修復
"""

import requests
import json
from datetime import datetime

def test_fixed_api():
    """測試修復後的 API"""
    
    base_url = "http://localhost:8000"
    
    # 測試案例：原始會失敗的請求
    test_url = f"{base_url}/api/testbed/ammeter-history"
    params = {
        "building": "a",
        "meter_number": "102",
        "start_date": "2025-07-27",
        "end_date": "2025-08-03"
    }
    
    print("=" * 50)
    print("測試修復後的 ammeter-history API")
    print("=" * 50)
    print(f"測試時間: {datetime.now()}")
    print(f"請求 URL: {test_url}")
    print(f"請求參數: {params}")
    print()
    
    try:
        response = requests.get(test_url, params=params)
        
        print(f"狀態碼: {response.status_code}")
        print(f"完整 URL: {response.url}")
        
        if response.status_code == 200:
            print("✅ 修復成功！API 現在可以處理 building + meter_number 參數")
            data = response.json()
            print(f"回應: {json.dumps(data, indent=2, ensure_ascii=False)}")
        elif response.status_code == 422:
            print("❌ 仍然有 422 錯誤")
            try:
                error_data = response.json()
                print(f"錯誤詳情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"錯誤回應: {response.text}")
        else:
            print(f"❌ 其他錯誤: {response.status_code}")
            print(f"錯誤回應: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 請求失敗: {e}")
        print("請確保後端服務正在運行 (python main.py)")

def test_alternative_format():
    """測試替代格式"""
    
    base_url = "http://localhost:8000"
    
    # 測試案例：使用 electric_meter_number 格式
    test_url = f"{base_url}/api/testbed/ammeter-history"
    params = {
        "electric_meter_number": "15學舍102",
        "start_date": "2025-07-27",
        "end_date": "2025-08-03"
    }
    
    print("\n" + "=" * 50)
    print("測試 electric_meter_number 格式")
    print("=" * 50)
    print(f"請求參數: {params}")
    print()
    
    try:
        response = requests.get(test_url, params=params)
        
        print(f"狀態碼: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ electric_meter_number 格式正常工作")
        else:
            print(f"❌ electric_meter_number 格式失敗: {response.status_code}")
            print(f"錯誤回應: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 請求失敗: {e}")

if __name__ == "__main__":
    print("開始快速測試...")
    
    # 測試修復後的 API
    test_fixed_api()
    
    # 測試替代格式
    test_alternative_format()
    
    print("\n" + "=" * 50)
    print("測試完成")
    print("=" * 50)
