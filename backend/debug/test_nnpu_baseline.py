#!/usr/bin/env python3
"""
nnPU 基準模型測試
目標：建立一個穩定、不過擬合的 nnPU 基準，達成：
1. Estimated Prior 接近 0.30 的真實值
2. 決策邊界平滑且合理

測試策略：
- 簡化模型架構 (2→16→16→1)
- 降低學習率 (1e-4)
- 加入 weight_decay 正規化
- 使用 Two Moons 2D 數據
"""

import numpy as np
import sys
import os
import json
import requests
import time

# 添加後端路徑
backend_dir = os.path.dirname(os.path.abspath(__file__))
pu_learning_dir = os.path.join(backend_dir, 'pu-learning')
if pu_learning_dir not in sys.path:
    sys.path.append(pu_learning_dir)

from typing import Dict, List, Tuple, Any

# API 配置
API_BASE_URL = "http://localhost:8000"

def test_nnpu_baseline_config(
    learning_rate: float,
    hidden_dim: int,
    weight_decay: float = 0.0,
    n_epochs: int = 50,
    description: str = ""
) -> Dict[str, Any]:
    """
    測試一組 nnPU 配置
    
    Args:
        learning_rate: 學習率
        hidden_dim: 隱藏層神經元數量
        weight_decay: 權重衰減 (L2 正規化)
        n_epochs: 訓練週期數
        description: 配置描述
    
    Returns:
        包含測試結果的字典
    """
    print(f"\n{'='*80}")
    print(f"🧪 測試配置: {description}")
    print(f"{'='*80}")
    print(f"📋 參數設定:")
    print(f"   • 演算法: nnPU")
    print(f"   • 學習率: {learning_rate}")
    print(f"   • 隱藏層維度: {hidden_dim}")
    print(f"   • Weight Decay: {weight_decay}")
    print(f"   • 訓練週期: {n_epochs}")
    
    # 構建 API 請求
    request_data = {
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
            "n_epochs": n_epochs,
            "learning_rate": learning_rate,
            "hidden_dim": hidden_dim,
            "weight_decay": weight_decay  # 新增參數
        }
    }
    
    try:
        print(f"\n🚀 發送 API 請求...")
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE_URL}/api/pu-learning/run-simulation",
            json=request_data,
            timeout=60
        )
        
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API 請求成功 (耗時: {elapsed_time:.2f}s)")
            
            # 提取關鍵指標
            estimated_prior = result['metrics']['estimated_prior']
            error_rate = result['metrics']['error_rate']
            risk_curve = result['metrics']['risk_curve']
            
            # 計算先驗估計誤差
            prior_error = abs(estimated_prior - 0.3)
            
            # 分析風險曲線穩定性
            final_risks = [point['risk'] for point in risk_curve[-10:]]  # 最後10個點
            risk_stability = np.std(final_risks)
            
            print(f"\n📊 結果分析:")
            print(f"   • Estimated Prior: {estimated_prior:.4f} (目標: 0.3000)")
            print(f"   • Prior 誤差: {prior_error:.4f}")
            print(f"   • Classification Error: {error_rate:.4f} ({error_rate*100:.1f}%)")
            print(f"   • 風險曲線穩定性 (最後10點標準差): {risk_stability:.6f}")
            
            # 評分系統
            score = 0
            print(f"\n🎯 評分 (滿分100):")
            
            # 先驗準確性 (40分)
            if prior_error < 0.05:
                prior_score = 40
            elif prior_error < 0.1:
                prior_score = 30
            elif prior_error < 0.2:
                prior_score = 20
            else:
                prior_score = 0
            print(f"   • 先驗準確性: {prior_score}/40 (誤差: {prior_error:.4f})")
            score += prior_score
            
            # 錯誤率合理性 (30分)
            if 0.1 <= error_rate <= 0.35:
                error_score = 30
            elif 0.05 <= error_rate <= 0.4:
                error_score = 20
            else:
                error_score = 0
            print(f"   • 錯誤率合理性: {error_score}/30 (錯誤率: {error_rate:.3f})")
            score += error_score
            
            # 風險曲線穩定性 (30分)
            if risk_stability < 0.001:
                stability_score = 30
            elif risk_stability < 0.005:
                stability_score = 20
            elif risk_stability < 0.01:
                stability_score = 10
            else:
                stability_score = 0
            print(f"   • 風險曲線穩定性: {stability_score}/30 (穩定性: {risk_stability:.6f})")
            score += stability_score
            
            print(f"\n🏆 總分: {score}/100")
            
            # 成功標準
            is_success = score >= 70
            if is_success:
                print(f"✅ 配置成功！已達到基準標準")
            else:
                print(f"❌ 配置需要改進")
            
            return {
                'success': is_success,
                'score': score,
                'estimated_prior': estimated_prior,
                'prior_error': prior_error,
                'error_rate': error_rate,
                'risk_stability': risk_stability,
                'config': {
                    'learning_rate': learning_rate,
                    'hidden_dim': hidden_dim,
                    'weight_decay': weight_decay,
                    'n_epochs': n_epochs
                },
                'description': description,
                'elapsed_time': elapsed_time,
                'full_result': result
            }
            
        else:
            print(f"❌ API 請求失敗:")
            print(f"   狀態碼: {response.status_code}")
            print(f"   回應: {response.text}")
            
            return {
                'success': False,
                'error': f"API Error: {response.status_code}",
                'config': request_data,
                'description': description
            }
            
    except Exception as e:
        print(f"❌ 請求過程中發生錯誤:")
        print(f"   錯誤類型: {type(e).__name__}")
        print(f"   錯誤訊息: {str(e)}")
        
        return {
            'success': False,
            'error': str(e),
            'config': request_data,
            'description': description
        }

def run_nnpu_baseline_search():
    """運行 nnPU 基準配置搜索"""
    print("🚀 開始 nnPU 基準模型配置搜索")
    print("目標：找到穩定、不過擬合的 nnPU 設定")
    print("="*80)
    
    # 定義測試配置列表
    test_configs = [
        # 測試1：當前預設配置 (作為基準)
        {
            'learning_rate': 0.001,
            'hidden_dim': 100,
            'weight_decay': 0.0,
            'description': '當前預設配置 (基準)'
        },
        
        # 測試2：簡化模型 + 降低學習率
        {
            'learning_rate': 0.0001,
            'hidden_dim': 16,
            'weight_decay': 0.0,
            'description': '簡化模型 + 低學習率'
        },
        
        # 測試3：簡化模型 + 低學習率 + 輕度正規化
        {
            'learning_rate': 0.0001,
            'hidden_dim': 16,
            'weight_decay': 0.0001,
            'description': '簡化模型 + 低學習率 + 輕度正規化'
        },
        
        # 測試4：簡化模型 + 低學習率 + 中度正規化
        {
            'learning_rate': 0.0001,
            'hidden_dim': 16,
            'weight_decay': 0.001,
            'description': '簡化模型 + 低學習率 + 中度正規化'
        },
        
        # 測試5：更小的模型 + 極低學習率 + 強正規化
        {
            'learning_rate': 0.00005,
            'hidden_dim': 8,
            'weight_decay': 0.001,
            'description': '極簡模型 + 極低學習率 + 強正規化'
        },
        
        # 測試6：中等模型 + 適中學習率 + 適中正規化
        {
            'learning_rate': 0.0005,
            'hidden_dim': 32,
            'weight_decay': 0.0005,
            'description': '中等模型 + 適中學習率 + 適中正規化'
        }
    ]
    
    results = []
    best_config = None
    best_score = 0
    
    for i, config in enumerate(test_configs, 1):
        print(f"\n📋 執行測試 {i}/{len(test_configs)}")
        
        result = test_nnpu_baseline_config(
            learning_rate=config['learning_rate'],
            hidden_dim=config['hidden_dim'],
            weight_decay=config['weight_decay'],
            description=config['description']
        )
        
        results.append(result)
        
        # 更新最佳配置
        if result.get('success', False) and result.get('score', 0) > best_score:
            best_score = result['score']
            best_config = result
        
        # 短暫休息，避免過載後端
        if i < len(test_configs):
            print(f"\n⏱️  等待 2 秒後進行下一個測試...")
            time.sleep(2)
    
    # 總結報告
    print("\n" + "="*80)
    print("📋 nnPU 基準配置搜索總結報告")
    print("="*80)
    
    print(f"\n🧪 測試配置總數: {len(test_configs)}")
    successful_configs = [r for r in results if r.get('success', False)]
    print(f"✅ 成功配置數量: {len(successful_configs)}")
    
    if successful_configs:
        print(f"\n🏆 所有成功配置:")
        for i, result in enumerate(successful_configs, 1):
            config = result['config']
            print(f"   {i}. {result['description']}")
            print(f"      • 分數: {result['score']}/100")
            print(f"      • Prior 誤差: {result['prior_error']:.4f}")
            print(f"      • 錯誤率: {result['error_rate']:.3f}")
            print(f"      • 配置: lr={config['learning_rate']}, dim={config['hidden_dim']}, wd={config['weight_decay']}")
    
    if best_config:
        print(f"\n🥇 最佳配置:")
        print(f"   • 描述: {best_config['description']}")
        print(f"   • 總分: {best_config['score']}/100")
        print(f"   • Estimated Prior: {best_config['estimated_prior']:.4f} (目標: 0.3000)")
        print(f"   • Prior 誤差: {best_config['prior_error']:.4f}")
        print(f"   • Classification Error: {best_config['error_rate']:.3f}")
        print(f"   • 風險穩定性: {best_config['risk_stability']:.6f}")
        
        config = best_config['config']
        print(f"\n🔧 推薦配置參數:")
        print(f"   • learning_rate: {config['learning_rate']}")
        print(f"   • hidden_dim: {config['hidden_dim']}")
        print(f"   • weight_decay: {config['weight_decay']}")
        print(f"   • n_epochs: {config['n_epochs']}")
        
        print(f"\n✨ 這個配置可以作為 nnPU 的黃金基準！")
        print(f"   下一步：將此配置套用到 uPU 進行對比測試")
        
        return best_config
    else:
        print(f"\n❌ 沒有找到滿足標準的配置")
        print(f"建議：")
        print(f"   • 進一步降低學習率")
        print(f"   • 增加正規化強度")
        print(f"   • 簡化模型架構")
        print(f"   • 檢查數據生成是否有問題")
        
        return None

if __name__ == "__main__":
    # 檢查後端是否運行
    try:
        response = requests.get(f"{API_BASE_URL}/api/pu-learning/health")
        if response.status_code == 200:
            print("✅ 後端服務正常運行")
            best_config = run_nnpu_baseline_search()
        else:
            print("❌ 後端服務無法訪問")
            print("請確保 FastAPI 服務正在運行在 http://localhost:8000")
    except Exception as e:
        print("❌ 無法連接到後端服務")
        print(f"錯誤: {e}")
        print("請確保 FastAPI 服務正在運行在 http://localhost:8000")
