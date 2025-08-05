#!/usr/bin/env python3
"""
測試高斯分布數據的錯誤率 - 對應MATLAB原始demo.m
"""
import requests
import json

def test_gaussian_distribution():
    """測試高斯分布數據"""
    
    # API端點
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 使用高斯分布配置（對應MATLAB demo.m）
    config = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": "gaussian",  # 改為高斯分布
            "dims": 2,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.001,
            "hidden_dim": 200,  # 使用之前搜索的最佳配置
            "weight_decay": 0.005
        }
    }
    
    print("🧪 測試高斯分布數據 (對應MATLAB demo.m)")
    print("="*60)
    
    try:
        # 發送請求
        response = requests.post(url, json=config, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            error_rate = data['metrics']['error_rate']
            estimated_prior = data['metrics']['estimated_prior']
            
            print(f"📊 高斯分布結果:")
            print(f"   • 錯誤率: {error_rate:.3f} ({error_rate*100:.1f}%)")
            print(f"   • 估計先驗: {estimated_prior:.3f}")
            print(f"   • 真實先驗: {config['data_params']['prior']}")
            print(f"   • 先驗估計誤差: {abs(estimated_prior - config['data_params']['prior']):.3f}")
            
            # 多次測試確認穩定性
            print(f"\n🔍 多次測試確認穩定性:")
            error_rates = [error_rate]
            prior_estimates = [estimated_prior]
            
            for i in range(4):
                test_response = requests.post(url, json=config, timeout=30)
                if test_response.status_code == 200:
                    test_data = test_response.json()
                    error_rates.append(test_data['metrics']['error_rate'])
                    prior_estimates.append(test_data['metrics']['estimated_prior'])
                    print(f"   測試{i+2}: 錯誤率={test_data['metrics']['error_rate']:.3f}, 先驗={test_data['metrics']['estimated_prior']:.3f}")
            
            avg_error = sum(error_rates) / len(error_rates)
            avg_prior = sum(prior_estimates) / len(prior_estimates)
            
            print(f"\n📈 統計結果:")
            print(f"   • 平均錯誤率: {avg_error:.3f} ({avg_error*100:.1f}%)")
            print(f"   • 平均先驗估計: {avg_prior:.3f}")
            print(f"   • 錯誤率標準差: {(sum([(er - avg_error)**2 for er in error_rates]) / len(error_rates))**0.5:.4f}")
            
            if avg_error < 0.05:
                print("✅ 高斯分布錯誤率優秀 (<5%)")
                return "EXCELLENT"
            elif avg_error < 0.1:
                print("✅ 高斯分布錯誤率良好 (<10%)")
                return "GOOD"
            else:
                print("⚠️  高斯分布錯誤率仍然偏高 (>10%)")
                return "HIGH"
                
        else:
            print(f"❌ API請求失敗: {response.status_code}")
            return "ERROR"
            
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        return "ERROR"

def compare_distributions():
    """比較不同分布的性能"""
    print("\n" + "="*60)
    print("🆚 分布性能比較")
    print("="*60)
    
    distributions = ['gaussian', 'two_moons']
    base_config = {
        "algorithm": "nnPU",
        "data_params": {
            "dims": 2,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.001,
            "hidden_dim": 200,
            "weight_decay": 0.005
        }
    }
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    for dist in distributions:
        config = base_config.copy()
        config['data_params']['distribution'] = dist
        
        try:
            response = requests.post(url, json=config, timeout=30)
            if response.status_code == 200:
                data = response.json()
                error_rate = data['metrics']['error_rate']
                estimated_prior = data['metrics']['estimated_prior']
                
                print(f"\n📊 {dist.title()} 分布:")
                print(f"   • 錯誤率: {error_rate:.3f} ({error_rate*100:.1f}%)")
                print(f"   • 先驗估計: {estimated_prior:.3f}")
                print(f"   • 先驗誤差: {abs(estimated_prior - 0.3):.3f}")
            else:
                print(f"❌ {dist} 測試失敗")
        except Exception as e:
            print(f"❌ {dist} 測試錯誤: {e}")

if __name__ == "__main__":
    # 測試高斯分布
    result = test_gaussian_distribution()
    
    # 比較不同分布
    compare_distributions()
    
    print("\n" + "="*60)
    print("📋 結論:")
    if result == "EXCELLENT":
        print("✅ 高斯分布達到優秀性能，符合MATLAB原始demo預期")
        print("💡 建議：")
        print("   1. 前端默認使用高斯分布進行演示")
        print("   2. two_moons作為高級選項，說明更具挑戰性")
    elif result == "GOOD":
        print("✅ 高斯分布性能良好，可接受的範圍")
        print("💡 建議調整參數或增加訓練epoch數")
    else:
        print("⚠️  需要進一步調試配置")
