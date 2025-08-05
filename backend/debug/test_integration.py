#!/usr/bin/env python3
"""
測試整合後的主後端服務
"""
import requests
import json
import time

def test_main_service():
    """測試主服務是否正常運行"""
    base_url = "http://localhost:8000"
    
    print("=" * 60)
    print("測試整合後的 AI 學習平台後端服務")
    print("=" * 60)
    
    # 測試根端點
    print("1. 測試根端點...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            data = response.json()
            print("✓ 根端點正常")
            print(f"  服務狀態: {data.get('status')}")
            print(f"  可用模組: {', '.join(data.get('modules', {}).keys())}")
        else:
            print(f"✗ 根端點錯誤: {response.status_code}")
    except Exception as e:
        print(f"✗ 根端點連接失敗: {e}")
    
    print()
    
    # 測試 PU Learning 健康檢查
    print("2. 測試 PU Learning 模組...")
    try:
        response = requests.get(f"{base_url}/api/pu-learning/health")
        if response.status_code == 200:
            data = response.json()
            print("✓ PU Learning 模組正常")
            print(f"  模組狀態: {data.get('status')}")
        else:
            print(f"✗ PU Learning 模組錯誤: {response.status_code}")
    except Exception as e:
        print(f"✗ PU Learning 模組連接失敗: {e}")
    
    print()
    
    # 測試演算法列表
    print("3. 測試演算法列表...")
    try:
        response = requests.get(f"{base_url}/api/pu-learning/algorithms")
        if response.status_code == 200:
            data = response.json()
            print("✓ 演算法列表正常")
            algorithms = data.get('algorithms', [])
            for algo in algorithms:
                print(f"  - {algo.get('name')}: {algo.get('description')}")
        else:
            print(f"✗ 演算法列表錯誤: {response.status_code}")
    except Exception as e:
        print(f"✗ 演算法列表連接失敗: {e}")
    
    print()
    
    # 測試 PU Learning 模擬
    print("4. 測試 PU Learning 模擬...")
    try:
        simulation_request = {
            "algorithm": "nnPU",
            "data_params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 200,
                "prior": 0.3
            },
            "model_params": {
                "activation": "relu",
                "n_epochs": 10,  # 減少週期數以快速測試
                "learning_rate": 0.01,
                "hidden_dim": 50
            }
        }
        
        print("  發送模擬請求...")
        response = requests.post(
            f"{base_url}/api/pu-learning/run-simulation",
            json=simulation_request,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ PU Learning 模擬成功")
            print(f"  成功狀態: {data.get('success')}")
            print(f"  訊息: {data.get('message')}")
            
            # 檢查返回數據
            viz_data = data.get('visualization', {})
            metrics = data.get('metrics', {})
            
            print(f"  正樣本數量: {len(viz_data.get('p_samples', []))}")
            print(f"  未標記樣本數量: {len(viz_data.get('u_samples', []))}")
            print(f"  決策邊界點數: {len(viz_data.get('decision_boundary', []))}")
            print(f"  估計先驗: {metrics.get('estimated_prior', 'N/A'):.3f}")
            print(f"  錯誤率: {metrics.get('error_rate', 'N/A'):.3f}")
            print(f"  風險曲線點數: {len(metrics.get('risk_curve', []))}")
            
        else:
            print(f"✗ PU Learning 模擬錯誤: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  錯誤詳情: {error_data}")
            except:
                print(f"  響應內容: {response.text}")
    except Exception as e:
        print(f"✗ PU Learning 模擬連接失敗: {e}")
    
    print()
    print("=" * 60)
    print("測試完成！")
    print("=" * 60)

if __name__ == "__main__":
    test_main_service()
