#!/usr/bin/env python3
"""
簡單測試修正後的 PU Learning API
"""

import requests
import json

def simple_test():
    """簡單測試一個配置"""
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    payload = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": "two_moons",
            "dims": 2,
            "n_p": 100,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.01,
            "hidden_dim": 64,
            "weight_decay": 0.0001
        }
    }
    
    print("🚀 測試 nnPU API...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=120)
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 成功!")
            
            # 檢查結果結構
            if 'metrics' in result:
                metrics = result['metrics']
                print(f"估計先驗: {metrics.get('estimated_prior', 'N/A')}")
                print(f"錯誤率: {metrics.get('error_rate', 'N/A')}")
            else:
                print("結果:")
                print(json.dumps(result, indent=2))
        else:
            print(f"❌ 失敗: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ 異常: {e}")

if __name__ == "__main__":
    simple_test()
