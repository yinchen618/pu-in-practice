#!/usr/bin/env python3
"""
測試當前「最佳配置」的實際效果
檢驗前端設置的參數是否能達到期望的低錯誤率
"""

import requests
import json
import time

def test_optimal_configuration():
    """測試最佳配置的效果"""
    
    print("🧪 測試當前最佳配置效果")
    print("="*60)
    
    # 前端當前的「最佳配置」
    optimal_config = {
        "algorithm": "nnPU",
        "prior_estimation_method": "median",
        "data_params": {
            "distribution": "two_moons",
            "dims": 50,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.01,
            "hidden_dim": 64,
            "lambda_regularization": 0.0001
        }
    }
    
    print("📋 測試配置:")
    print(f"   • 演算法: {optimal_config['algorithm']}")
    print(f"   • 先驗估計: {optimal_config['prior_estimation_method']}")
    print(f"   • 隱藏層大小: {optimal_config['model_params']['hidden_dim']}")
    print(f"   • λ 正規化: {optimal_config['model_params']['lambda_regularization']}")
    print(f"   • 真實先驗: {optimal_config['data_params']['prior']}")
    
    try:
        # 發送請求到後端
        print(f"\n🚀 發送請求到後端...")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:8000/api/pu-learning/run-simulation",
            json=optimal_config,
            timeout=60
        )
        
        end_time = time.time()
        print(f"   • 請求耗時: {end_time - start_time:.2f} 秒")
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📊 模型表現結果:")
            print(f"   • 真實先驗 (π_p): {optimal_config['data_params']['prior']:.3f}")
            print(f"   • 估計先驗: {result['metrics']['estimated_prior']:.3f}")
            print(f"   • 先驗估計誤差: {abs(result['metrics']['estimated_prior'] - optimal_config['data_params']['prior']):.3f}")
            print(f"   • 分類錯誤率: {result['metrics']['error_rate']:.4f} ({result['metrics']['error_rate']*100:.2f}%)")
            
            # 評估結果
            prior_error = abs(result['metrics']['estimated_prior'] - optimal_config['data_params']['prior'])
            error_rate = result['metrics']['error_rate']
            
            print(f"\n🎯 結果評估:")
            
            # 先驗估計評估
            if prior_error < 0.02:
                print(f"   ✅ 先驗估計: 優秀 (誤差 < 0.02)")
            elif prior_error < 0.05:
                print(f"   🟡 先驗估計: 良好 (誤差 < 0.05)")
            else:
                print(f"   ❌ 先驗估計: 需改進 (誤差 >= 0.05)")
            
            # 錯誤率評估
            if error_rate < 0.02:
                print(f"   ✅ 錯誤率: 優秀 (< 2%)")
            elif error_rate < 0.05:
                print(f"   🟡 錯誤率: 良好 (< 5%)")
            elif error_rate < 0.10:
                print(f"   🟠 錯誤率: 尚可 (< 10%)")
            else:
                print(f"   ❌ 錯誤率: 需改進 (>= 10%)")
            
            # 總體評估
            if prior_error < 0.02 and error_rate < 0.02:
                print(f"\n🏆 總體評估: 黃金配置 - 達到最佳表現！")
                return "optimal"
            elif prior_error < 0.05 and error_rate < 0.05:
                print(f"\n✅ 總體評估: 良好配置 - 表現不錯")
                return "good"
            else:
                print(f"\n⚠️  總體評估: 需要調整配置")
                return "needs_adjustment"
                
        else:
            print(f"❌ 請求失敗: {response.status_code}")
            print(f"   錯誤詳情: {response.text}")
            return "error"
            
    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到後端服務 (端口 8000)")
        print("   請確認後端服務是否正在運行")
        return "connection_error"
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {str(e)}")
        return "error"

def test_blinds_effect_configuration():
    """測試百葉窗效應配置"""
    
    print("\n" + "="*60)
    print("🧪 測試百葉窗效應配置")
    print("="*60)
    
    # 前端的「百葉窗效應」配置
    blinds_config = {
        "algorithm": "nnPU",
        "prior_estimation_method": "median",
        "data_params": {
            "distribution": "two_moons",
            "dims": 50,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.01,
            "hidden_dim": 256,
            "lambda_regularization": 0
        }
    }
    
    print("📋 百葉窗配置:")
    print(f"   • 隱藏層大小: {blinds_config['model_params']['hidden_dim']} (大)")
    print(f"   • λ 正規化: {blinds_config['model_params']['lambda_regularization']} (無)")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/pu-learning/run-simulation",
            json=blinds_config,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📊 百葉窗效應結果:")
            print(f"   • 估計先驗: {result['metrics']['estimated_prior']:.3f}")
            print(f"   • 分類錯誤率: {result['metrics']['error_rate']:.4f} ({result['metrics']['error_rate']*100:.2f}%)")
            
            return result['metrics']['error_rate']
        else:
            print(f"❌ 百葉窗測試失敗: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ 百葉窗測試錯誤: {str(e)}")
        return None

def recommend_adjustments(optimal_result):
    """根據測試結果推薦調整"""
    
    print(f"\n" + "="*60)
    print("💡 配置建議")
    print("="*60)
    
    if optimal_result == "optimal":
        print("🎉 當前配置已經是最佳狀態，無需調整！")
        
    elif optimal_result == "good":
        print("👍 當前配置表現良好，可以考慮微調:")
        print("   • 可以嘗試稍微調整隱藏層大小 (32, 64, 96)")
        print("   • 可以嘗試不同的正規化強度 (0.00005, 0.0001, 0.0002)")
        
    elif optimal_result == "needs_adjustment":
        print("⚠️  當前配置需要調整，建議:")
        print("   • 如果錯誤率太高: 減少正規化強度或增加模型複雜度")
        print("   • 如果先驗估計不準: 檢查先驗估計方法設置")
        print("   • 如果出現過擬合: 增加正規化強度或減少模型複雜度")
        
        print(f"\n🔧 建議的新配置:")
        print(f"   • 隱藏層大小: 96 (介於當前64和256之間)")
        print(f"   • λ 正規化: 0.00005 (比當前0.0001更輕微)")
        
    print(f"\n📝 前端調整指引:")
    print(f"   • 如需修改預設值，編輯前端頁面的 useState 初始值")
    print(f"   • 如需修改選項，編輯下拉選單的 SelectItem 值")
    print(f"   • 如需修改快速設置，編輯 Quick Setup 按鈕的 onClick 函數")

if __name__ == "__main__":
    # 執行測試
    optimal_result = test_optimal_configuration()
    
    # 測試百葉窗效應作為對比
    blinds_error = test_blinds_effect_configuration()
    
    # 提供建議
    recommend_adjustments(optimal_result)
    
    print(f"\n" + "="*60)
    print("🏁 測試完成")
    print("="*60)
