#!/usr/bin/env python3
"""
測試後端是否真的在進行訓練
"""

import requests
import json
import time

def test_real_training():
    """測試後端是否真的在進行訓練"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 測試配置 - 使用不同的參數來觀察變化
    test_configs = [
        {
            "name": "配置1 - nnPU 高斯分布",
            "data": {
                "algorithm": "nnPU",
                "data_params": {
                    "distribution": "gaussian",
                    "dims": 8,
                    "n_p": 50,
                    "n_u": 300,
                    "prior": 0.3
                },
                "model_params": {
                    "activation": "relu",
                    "n_epochs": 50,
                    "learning_rate": 0.01,
                    "hidden_dim": 200,
                    "weight_decay": 0.005
                }
            }
        },
        {
            "name": "配置2 - uPU 雙月分布",
            "data": {
                "algorithm": "uPU",
                "data_params": {
                    "distribution": "two_moons",
                    "dims": 2,
                    "n_p": 50,
                    "n_u": 300,
                    "prior": 0.3
                },
                "model_params": {
                    "activation": "relu",
                    "n_epochs": 50,
                    "learning_rate": 0.01,
                    "hidden_dim": 100,
                    "weight_decay": 0.0
                }
            }
        },
        {
            "name": "配置3 - nnPU 螺旋分布",
            "data": {
                "algorithm": "nnPU",
                "data_params": {
                    "distribution": "spiral",
                    "dims": 2,
                    "n_p": 50,
                    "n_u": 300,
                    "prior": 0.3
                },
                "model_params": {
                    "activation": "tanh",
                    "n_epochs": 100,
                    "learning_rate": 0.005,
                    "hidden_dim": 150,
                    "weight_decay": 0.001
                }
            }
        }
    ]
    
    print("🧪 測試後端是否真的在進行訓練")
    print("="*60)
    
    results = []
    
    for i, config in enumerate(test_configs, 1):
        print(f"\n📋 測試 {i}: {config['name']}")
        print("-" * 40)
        
        start_time = time.time()
        
        try:
            response = requests.post(url, json=config['data'], timeout=60)
            
            end_time = time.time()
            duration = end_time - start_time
            
            print(f"⏱️  響應時間: {duration:.2f} 秒")
            print(f"📊 狀態碼: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # 檢查數據是否每次都不同
                viz = result['visualization']
                metrics = result['metrics']
                
                print(f"✅ 成功獲取結果")
                print(f"   • 正樣本數量: {len(viz['p_samples'])}")
                print(f"   • 未標記樣本數量: {len(viz['u_samples'])}")
                print(f"   • 決策邊界點數: {len(viz['decision_boundary'])}")
                print(f"   • 估計先驗: {metrics['estimated_prior']:.4f}")
                print(f"   • 錯誤率: {metrics['error_rate']:.4f}")
                print(f"   • 訓練錯誤率: {metrics['training_error_rate']:.4f}")
                print(f"   • 風險曲線長度: {len(metrics['risk_curve'])}")
                
                # 檢查前幾個數據點
                if len(viz['p_samples']) > 0:
                    print(f"   • 第一個正樣本: {viz['p_samples'][0]}")
                if len(viz['u_samples']) > 0:
                    print(f"   • 第一個未標記樣本: {viz['u_samples'][0]}")
                
                # 檢查風險曲線
                if len(metrics['risk_curve']) > 0:
                    first_risk = metrics['risk_curve'][0]
                    last_risk = metrics['risk_curve'][-1]
                    print(f"   • 風險曲線: {first_risk} -> {last_risk}")
                
                results.append({
                    'config': config['name'],
                    'duration': duration,
                    'data': result,
                    'success': True
                })
                
            else:
                print(f"❌ 請求失敗: {response.status_code}")
                print(f"錯誤信息: {response.text}")
                results.append({
                    'config': config['name'],
                    'duration': duration,
                    'error': response.text,
                    'success': False
                })
                
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            print(f"❌ 請求異常: {e}")
            results.append({
                'config': config['name'],
                'duration': duration,
                'error': str(e),
                'success': False
            })
    
    # 分析結果
    print(f"\n📊 測試結果分析")
    print("="*60)
    
    successful_results = [r for r in results if r['success']]
    
    if len(successful_results) >= 2:
        print("🔍 檢查數據多樣性:")
        
        # 比較不同配置的結果
        for i in range(len(successful_results)):
            for j in range(i + 1, len(successful_results)):
                result1 = successful_results[i]
                result2 = successful_results[j]
                
                print(f"\n比較 {result1['config']} vs {result2['config']}:")
                
                # 比較正樣本
                p1 = result1['data']['visualization']['p_samples'][0]
                p2 = result2['data']['visualization']['p_samples'][0]
                print(f"   • 第一個正樣本: {p1} vs {p2}")
                
                # 比較未標記樣本
                u1 = result1['data']['visualization']['u_samples'][0]
                u2 = result2['data']['visualization']['u_samples'][0]
                print(f"   • 第一個未標記樣本: {u1} vs {u2}")
                
                # 比較指標
                prior1 = result1['data']['metrics']['estimated_prior']
                prior2 = result2['data']['metrics']['estimated_prior']
                error1 = result1['data']['metrics']['error_rate']
                error2 = result2['data']['metrics']['error_rate']
                
                print(f"   • 估計先驗: {prior1:.4f} vs {prior2:.4f}")
                print(f"   • 錯誤率: {error1:.4f} vs {error2:.4f}")
                
                # 檢查是否有顯著差異
                if abs(prior1 - prior2) > 0.01 or abs(error1 - error2) > 0.01:
                    print(f"   ✅ 數據有顯著差異 - 說明真的在訓練")
                else:
                    print(f"   ⚠️  數據差異很小 - 可能使用固定數據")
    
    # 檢查響應時間
    avg_duration = sum(r['duration'] for r in successful_results) / len(successful_results)
    print(f"\n⏱️  平均響應時間: {avg_duration:.2f} 秒")
    
    if avg_duration > 1.0:
        print("✅ 響應時間較長，說明可能在進行真實訓練")
    else:
        print("⚠️  響應時間很短，可能使用預計算數據")
    
    # 總結
    print(f"\n🎯 總結:")
    print(f"   • 成功測試: {len(successful_results)}/{len(test_configs)}")
    print(f"   • 平均響應時間: {avg_duration:.2f} 秒")
    
    if len(successful_results) >= 2:
        print("   • 數據多樣性: 需要進一步檢查")
    else:
        print("   • 數據多樣性: 無法確定")

if __name__ == "__main__":
    test_real_training() 
