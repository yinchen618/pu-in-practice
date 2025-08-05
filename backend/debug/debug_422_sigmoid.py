#!/usr/bin/env python3
"""
調試 422 錯誤的具體信息
"""

import requests
import json

def debug_422_error():
    """調試 422 錯誤"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 測試一個簡單的配置
    payload = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": "two_moons",
            "dims": 2,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "sigmoid",
            "n_epochs": 100,
            "learning_rate": 0.1,
            "hidden_dim": 200,
            "weight_decay": 0.0
        }
    }
    
    print("🔍 調試 422 錯誤...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 422:
            print("❌ 422 錯誤詳情:")
            try:
                error_detail = response.json()
                print(json.dumps(error_detail, indent=2, ensure_ascii=False))
            except:
                print(f"Response Text: {response.text}")
        elif response.status_code == 200:
            print("✅ 請求成功")
            result = response.json()
            print(f"Response keys: {list(result.keys())}")
        else:
            print(f"其他錯誤: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ 請求異常: {e}")

if __name__ == "__main__":
    debug_422_error() 
