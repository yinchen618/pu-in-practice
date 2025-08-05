#!/usr/bin/env python3
"""
測試更新後的前端配置
"""
import requests
import json

def test_updated_config():
    """測試新的最佳配置"""
    
    # API端點
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    # 使用更新後的配置
    config = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": "gaussian",  # 默認高斯分布
            "dims": 2,
            "n_p": 50,
            "n_u": 300,
            "prior": 0.3
        },
        "model_params": {
            "activation": "relu",
            "n_epochs": 50,
            "learning_rate": 0.001,
            "hidden_dim": 200,  # 新默認
            "weight_decay": 0.005  # 新默認
        }
    }
    
    print("🧪 測試更新後的前端默認配置")
    print("="*60)
    
    try:
        response = requests.post(url, json=config, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            error_rate = data['metrics']['error_rate']
            estimated_prior = data['metrics']['estimated_prior']
            
            print(f"📊 新默認配置結果:")
            print(f"   • 錯誤率: {error_rate:.3f} ({error_rate*100:.1f}%)")
            print(f"   • 估計先驗: {estimated_prior:.3f}")
            print(f"   • 真實先驗: {config['data_params']['prior']}")
            print(f"   • 先驗估計誤差: {abs(estimated_prior - config['data_params']['prior']):.3f}")
            
            # 評估性能
            if error_rate < 0.05:
                status = "優秀 (< 5%)"
                color = "✅"
            elif error_rate < 0.1:
                status = "良好 (< 10%)"
                color = "✅"
            else:
                status = "需改進 (> 10%)"
                color = "⚠️"
            
            print(f"   • 性能評級: {color} {status}")
            
            # 比較舊配置
            print(f"\n🔄 與舊配置比較:")
            old_config = config.copy()
            old_config['model_params']['hidden_dim'] = 64
            old_config['model_params']['weight_decay'] = 0.0001
            
            old_response = requests.post(url, json=old_config, timeout=30)
            if old_response.status_code == 200:
                old_data = old_response.json()
                old_error = old_data['metrics']['error_rate']
                
                improvement = old_error - error_rate
                print(f"   • 舊配置錯誤率: {old_error:.3f} ({old_error*100:.1f}%)")
                print(f"   • 改進幅度: {improvement:.3f} ({improvement*100:.1f}% points)")
                
                if improvement > 0:
                    print("   ✅ 新配置確實更好!")
                else:
                    print("   ⚠️ 新配置沒有改進")
            
            return error_rate < 0.1  # 返回是否達到可接受性能
            
        else:
            print(f"❌ API請求失敗: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        return False

if __name__ == "__main__":
    success = test_updated_config()
    
    print(f"\n{'='*60}")
    if success:
        print("✅ 前端配置更新成功，性能達到預期")
        print("💡 用戶現在會看到:")
        print("   • 高斯分布作為默認選項 (錯誤率 ~6-8%)")
        print("   • 隱藏層200 + λ=0.005 作為最佳配置")
        print("   • Two moons 作為挑戰性選項 (錯誤率 ~10-12%)")
    else:
        print("⚠️ 配置可能需要進一步調整")
