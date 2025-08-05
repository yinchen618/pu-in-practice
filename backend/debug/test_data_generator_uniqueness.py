#!/usr/bin/env python3
"""
測試數據生成器的唯一性
"""

import sys
import os
import time
import hashlib
import json

# 添加 pu-learning 目錄到路徑
backend_dir = os.path.dirname(os.path.abspath(__file__))
pu_learning_dir = os.path.join(backend_dir, 'pu-learning')
if pu_learning_dir not in sys.path:
    sys.path.append(pu_learning_dir)

from data_generator import generate_synthetic_data

def test_data_generator_uniqueness():
    """測試數據生成器的唯一性"""
    
    print("🧪 測試數據生成器唯一性")
    print("="*60)
    
    # 測試配置
    test_configs = [
        {
            "name": "Two Moons 分布",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "n_test": 100
            }
        },
        {
            "name": "Gaussian 分布",
            "params": {
                "distribution": "gaussian",
                "dims": 8,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "n_test": 100
            }
        },
        {
            "name": "Spiral 分布",
            "params": {
                "distribution": "spiral",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "n_test": 100
            }
        }
    ]
    
    results = []
    
    for config in test_configs:
        print(f"\n📋 測試 {config['name']}")
        print("-" * 40)
        
        config_results = []
        
        for i in range(5):
            print(f"  生成第 {i+1} 次...")
            
            # 記錄生成時間
            start_time = time.time()
            
            try:
                # 生成數據
                xp, xu, xt_p, xt_n = generate_synthetic_data(**config['params'])
                
                end_time = time.time()
                generation_time = end_time - start_time
                
                # 計算數據哈希值
                data_str = json.dumps({
                    'xp': xp.tolist(),
                    'xu': xu.tolist(),
                    'xt_p': xt_p.tolist(),
                    'xt_n': xt_n.tolist()
                }, sort_keys=True)
                data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]
                
                print(f"    ⏱️  生成時間: {generation_time:.3f} 秒")
                print(f"    🔢 數據哈希: {data_hash}")
                print(f"    📊 正樣本: {len(xp)} 個")
                print(f"    📊 未標記樣本: {len(xu)} 個")
                print(f"    📊 測試正樣本: {len(xt_p)} 個")
                print(f"    📊 測試負樣本: {len(xt_n)} 個")
                
                config_results.append({
                    'iteration': i+1,
                    'generation_time': generation_time,
                    'data_hash': data_hash,
                    'xp_shape': xp.shape,
                    'xu_shape': xu.shape,
                    'xt_p_shape': xt_p.shape,
                    'xt_n_shape': xt_n.shape,
                    'success': True
                })
                
            except Exception as e:
                print(f"    ❌ 生成失敗: {e}")
                config_results.append({
                    'iteration': i+1,
                    'error': str(e),
                    'success': False
                })
            
            # 等待一下再生成下一次
            time.sleep(0.1)
        
        # 分析這個配置的結果
        successful_results = [r for r in config_results if r['success']]
        
        if len(successful_results) >= 2:
            hashes = [r['data_hash'] for r in successful_results]
            unique_hashes = set(hashes)
            
            print(f"\n   📊 {config['name']} 唯一性分析:")
            print(f"      • 成功生成: {len(successful_results)}/5")
            print(f"      • 唯一哈希值: {len(unique_hashes)}")
            print(f"      • 哈希值列表: {hashes}")
            
            if len(unique_hashes) == len(successful_results):
                print(f"      ✅ 每次生成都不同！")
            else:
                print(f"      ⚠️  發現重複數據！")
                for hash_val in hashes:
                    if hashes.count(hash_val) > 1:
                        print(f"         • {hash_val} 出現 {hashes.count(hash_val)} 次")
        
        results.append({
            'config_name': config['name'],
            'results': config_results
        })
    
    # 總結
    print(f"\n🎯 總結")
    print("="*60)
    
    for result in results:
        successful = [r for r in result['results'] if r['success']]
        if len(successful) >= 2:
            hashes = [r['data_hash'] for r in successful]
            unique_count = len(set(hashes))
            print(f"   {result['config_name']}: {unique_count}/{len(successful)} 唯一")
            
            if unique_count == len(successful):
                print(f"      ✅ 完全唯一")
            else:
                print(f"      ⚠️  有重複")
        else:
            print(f"   {result['config_name']}: 數據不足，無法判斷")

if __name__ == "__main__":
    test_data_generator_uniqueness() 
