#!/usr/bin/env python3
"""
測試每次請求是否產生不同的數據
"""

import requests
import json
import time
import hashlib

def test_data_uniqueness():
    """測試數據的唯一性"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 使用相同的配置，但多次請求
    test_config = {
        "algorithm": "nnPU",
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
    
    print("🧪 測試數據唯一性 - 相同配置多次請求")
    print("="*60)
    
    results = []
    
    for i in range(5):
        print(f"\n📋 請求 {i+1}/5")
        print("-" * 30)
        
        start_time = time.time()
        
        try:
            response = requests.post(url, json=test_config, timeout=60)
            
            end_time = time.time()
            duration = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                # 計算數據的哈希值
                viz_data = result['visualization']
                p_samples = viz_data['p_samples']
                u_samples = viz_data['u_samples']
                
                # 創建數據的哈希值
                data_str = json.dumps(p_samples + u_samples, sort_keys=True)
                data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]
                
                print(f"⏱️  響應時間: {duration:.2f} 秒")
                print(f"🔢 數據哈希: {data_hash}")
                print(f"📊 第一個正樣本: {p_samples[0]}")
                print(f"📊 第一個未標記樣本: {u_samples[0]}")
                print(f"📈 估計先驗: {result['metrics']['estimated_prior']:.4f}")
                print(f"📈 錯誤率: {result['metrics']['error_rate']:.4f}")
                
                results.append({
                    'request_num': i+1,
                    'duration': duration,
                    'data_hash': data_hash,
                    'first_p': p_samples[0],
                    'first_u': u_samples[0],
                    'prior': result['metrics']['estimated_prior'],
                    'error_rate': result['metrics']['error_rate'],
                    'success': True
                })
                
            else:
                print(f"❌ 請求失敗: {response.status_code}")
                results.append({
                    'request_num': i+1,
                    'error': response.text,
                    'success': False
                })
                
        except Exception as e:
            print(f"❌ 請求異常: {e}")
            results.append({
                'request_num': i+1,
                'error': str(e),
                'success': False
            })
        
        # 等待一下再發送下一個請求
        time.sleep(1)
    
    # 分析結果
    print(f"\n📊 唯一性分析")
    print("="*60)
    
    successful_results = [r for r in results if r['success']]
    
    if len(successful_results) >= 2:
        print("🔍 檢查數據哈希值:")
        hashes = [r['data_hash'] for r in successful_results]
        unique_hashes = set(hashes)
        
        print(f"   • 總請求數: {len(successful_results)}")
        print(f"   • 唯一哈希值: {len(unique_hashes)}")
        print(f"   • 哈希值列表: {hashes}")
        
        if len(unique_hashes) == len(successful_results):
            print("   ✅ 每次請求都產生不同的數據！")
        else:
            print("   ⚠️  發現重複的數據！")
            print("   📋 重複的哈希值:")
            for hash_val in hashes:
                if hashes.count(hash_val) > 1:
                    print(f"      • {hash_val} 出現 {hashes.count(hash_val)} 次")
        
        print(f"\n🔍 檢查第一個數據點:")
        for i, result in enumerate(successful_results):
            print(f"   請求 {result['request_num']}: P={result['first_p']}, U={result['first_u']}")
        
        print(f"\n🔍 檢查指標變化:")
        priors = [r['prior'] for r in successful_results]
        error_rates = [r['error_rate'] for r in successful_results]
        
        print(f"   估計先驗範圍: {min(priors):.4f} - {max(priors):.4f}")
        print(f"   錯誤率範圍: {min(error_rates):.4f} - {max(error_rates):.4f}")
        
        # 檢查是否有顯著變化
        prior_variance = max(priors) - min(priors)
        error_variance = max(error_rates) - min(error_rates)
        
        if prior_variance > 0.01 or error_variance > 0.01:
            print("   ✅ 指標有顯著變化 - 確認真實訓練")
        else:
            print("   ⚠️  指標變化很小 - 可能使用固定數據")
    
    # 總結
    print(f"\n🎯 總結:")
    print(f"   • 成功請求: {len(successful_results)}/5")
    if len(successful_results) >= 2:
        unique_count = len(set(r['data_hash'] for r in successful_results))
        print(f"   • 唯一數據集: {unique_count}/{len(successful_results)}")
        if unique_count == len(successful_results):
            print("   ✅ 確認：每次請求都產生不同的數據")
        else:
            print("   ⚠️  警告：發現重複數據")

if __name__ == "__main__":
    test_data_uniqueness() 
