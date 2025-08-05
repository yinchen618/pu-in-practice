#!/usr/bin/env python3
"""
測試 PU Learning 前端參數傳遞到後端
模擬 apps/cycu/src/app/pu-learning/page.tsx 的 API 請求
"""

import requests
import json
import time
import hashlib

def test_pu_learning_frontend():
    """測試 PU Learning 前端參數傳遞"""
    
    # API 端點
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 模擬前端 page.tsx 中的不同配置
    test_configs = [
        {
            "name": "默認配置 (nnPU)",
            "config": {
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
            "name": "uPU 算法",
            "config": {
                "algorithm": "uPU",
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
                    "hidden_dim": 128,
                    "weight_decay": 0.001
                }
            }
        },
        {
            "name": "最佳配置 (Optimal Setup)",
            "config": {
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
                    "hidden_dim": 256,
                    "weight_decay": 0.001
                }
            }
        },
        {
            "name": "Blinds Effect 配置",
            "config": {
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
                    "hidden_dim": 500,
                    "weight_decay": 0.01
                }
            }
        }
    ]
    
    print("🧪 測試 PU Learning 前端參數傳遞")
    print("="*80)
    
    results = {}
    
    for i, test_case in enumerate(test_configs, 1):
        print(f"\n📊 測試 {i}/{len(test_configs)}: {test_case['name']}")
        print("-" * 60)
        
        config = test_case['config']
        
        # 打印請求配置
        print(f"🔧 請求配置:")
        print(f"   • 算法: {config['algorithm']}")
        print(f"   • 數據分布: {config['data_params']['distribution']}")
        print(f"   • 維度: {config['data_params']['dims']}")
        print(f"   • 正樣本: {config['data_params']['n_p']}")
        print(f"   • 未標記樣本: {config['data_params']['n_u']}")
        print(f"   • 先驗: {config['data_params']['prior']}")
        print(f"   • 隱藏層維度: {config['model_params']['hidden_dim']}")
        print(f"   • 權重衰減: {config['model_params']['weight_decay']}")
        
        try:
            # 發送請求
            start_time = time.time()
            response = requests.post(url, json=config, timeout=60)
            elapsed_time = time.time() - start_time
            
            print(f"⏱️  響應時間: {elapsed_time:.2f} 秒")
            print(f"📊 狀態碼: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # 檢查返回的數據結構
                print(f"✅ 成功!")
                
                # 檢查 visualization 數據
                if 'visualization' in result:
                    viz = result['visualization']
                    print(f"📈 可視化數據:")
                    print(f"   • 正樣本數量: {len(viz.get('p_samples', []))}")
                    print(f"   • 未標記樣本數量: {len(viz.get('u_samples', []))}")
                    print(f"   • 決策邊界點數: {len(viz.get('decision_boundary', []))}")
                else:
                    print(f"⚠️  缺少可視化數據")
                
                # 檢查 metrics 數據
                if 'metrics' in result:
                    metrics = result['metrics']
                    print(f"📊 評估指標:")
                    print(f"   • 估計先驗: {metrics.get('estimated_prior', 'N/A')}")
                    print(f"   • 錯誤率: {metrics.get('error_rate', 'N/A')}")
                    print(f"   • 風險曲線長度: {len(metrics.get('risk_curve', []))}")
                else:
                    print(f"⚠️  缺少評估指標")
                
                # 檢查 success 狀態
                success = result.get('success', False)
                print(f"🎯 成功狀態: {success}")
                
                # 檢查 message
                message = result.get('message', '')
                print(f"💬 消息: {message}")
                
                # 計算結果的哈希值（用於比較不同配置的結果）
                result_hash = hashlib.md5(json.dumps(result, sort_keys=True).encode()).hexdigest()
                print(f"🔐 結果哈希值: {result_hash}")
                
                # 儲存結果
                results[test_case['name']] = {
                    'config': config,
                    'result': result,
                    'hash': result_hash,
                    'elapsed_time': elapsed_time,
                    'success': success
                }
                
            else:
                print(f"❌ 失敗: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"錯誤詳情: {error_data}")
                except:
                    print(f"錯誤信息: {response.text}")
                
        except Exception as e:
            print(f"❌ 異常: {e}")
    
    # 分析結果
    print("\n" + "="*80)
    print("📊 分析結果")
    print("="*80)
    
    if not results:
        print("❌ 沒有成功的測試結果")
        return
    
    # 檢查結果的多樣性
    hash_values = [results[name]['hash'] for name in results]
    unique_hashes = set(hash_values)
    
    print(f"🎯 總共測試了 {len(test_configs)} 種配置")
    print(f"✅ 成功處理了 {len(results)} 種配置")
    print(f"🔐 發現 {len(unique_hashes)} 個不同的結果哈希值")
    print(f"📈 結果多樣性: {len(unique_hashes)}/{len(results)} = {len(unique_hashes)/len(results)*100:.1f}%")
    
    if len(unique_hashes) == len(results):
        print("✅ 每種配置都返回了不同的結果！")
    else:
        print("⚠️  發現重複的結果")
        
        # 找出重複的結果
        hash_count = {}
        for hash_val in hash_values:
            hash_count[hash_val] = hash_count.get(hash_val, 0) + 1
        
        duplicates = {h: c for h, c in hash_count.items() if c > 1}
        if duplicates:
            print("🔄 重複的結果哈希值:")
            for hash_val, count in duplicates.items():
                configs_with_hash = [name for name in results.keys() if results[name]['hash'] == hash_val]
                print(f"   {hash_val}: {configs_with_hash}")
    
    # 顯示每種配置的詳細信息
    print(f"\n📋 詳細結果:")
    for name in results:
        result_data = results[name]
        print(f"   {name}:")
        print(f"     - 哈希值: {result_data['hash']}")
        print(f"     - 響應時間: {result_data['elapsed_time']:.2f}s")
        print(f"     - 成功狀態: {result_data['success']}")
        
        # 顯示關鍵指標
        if 'metrics' in result_data['result']:
            metrics = result_data['result']['metrics']
            print(f"     - 估計先驗: {metrics.get('estimated_prior', 'N/A')}")
            print(f"     - 錯誤率: {metrics.get('error_rate', 'N/A')}")
    
    # 檢查響應時間的變化
    response_times = [results[name]['elapsed_time'] for name in results]
    if len(set(response_times)) > 1:
        print(f"\n⏱️  響應時間變化: {min(response_times):.2f}s - {max(response_times):.2f}s")
    else:
        print(f"\n⏱️  所有配置響應時間相同: {response_times[0]:.2f}s")

def test_parameter_validation():
    """測試參數驗證"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    print("\n🔍 測試參數驗證")
    print("="*80)
    
    # 測試無效參數
    invalid_configs = [
        {
            "name": "無效隱藏層維度 (>500)",
            "config": {
                "algorithm": "nnPU",
                "data_params": {"distribution": "gaussian", "dims": 2, "n_p": 50, "n_u": 300, "prior": 0.3},
                "model_params": {"activation": "relu", "n_epochs": 50, "learning_rate": 0.01, "hidden_dim": 600, "weight_decay": 0.001}
            }
        },
        {
            "name": "無效權重衰減 (>0.1)",
            "config": {
                "algorithm": "nnPU",
                "data_params": {"distribution": "gaussian", "dims": 2, "n_p": 50, "n_u": 300, "prior": 0.3},
                "model_params": {"activation": "relu", "n_epochs": 50, "learning_rate": 0.01, "hidden_dim": 100, "weight_decay": 0.2}
            }
        },
        {
            "name": "無效維度 (>100)",
            "config": {
                "algorithm": "nnPU",
                "data_params": {"distribution": "gaussian", "dims": 150, "n_p": 50, "n_u": 300, "prior": 0.3},
                "model_params": {"activation": "relu", "n_epochs": 50, "learning_rate": 0.01, "hidden_dim": 100, "weight_decay": 0.001}
            }
        },
        {
            "name": "無效先驗 (<0.05)",
            "config": {
                "algorithm": "nnPU",
                "data_params": {"distribution": "gaussian", "dims": 2, "n_p": 50, "n_u": 300, "prior": 0.01},
                "model_params": {"activation": "relu", "n_epochs": 50, "learning_rate": 0.01, "hidden_dim": 100, "weight_decay": 0.001}
            }
        }
    ]
    
    for test_case in invalid_configs:
        print(f"\n❌ 測試: {test_case['name']}")
        
        try:
            response = requests.post(url, json=test_case['config'], timeout=30)
            
            if response.status_code == 422:
                print(f"✅ 正確返回驗證錯誤 (422)")
                try:
                    error_data = response.json()
                    print(f"   錯誤詳情: {error_data.get('detail', 'N/A')}")
                except:
                    print(f"   錯誤信息: {response.text}")
            else:
                print(f"⚠️  意外狀態碼: {response.status_code}")
                
        except Exception as e:
            print(f"❌ 異常: {e}")

if __name__ == "__main__":
    test_pu_learning_frontend()
    test_parameter_validation() 
