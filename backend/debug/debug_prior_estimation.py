#!/usr/bin/env python3
"""
先驗估計調試測試
專門檢查為什麼 Estimated Prior 始終停在 0.9000

重點調查：
1. 數據生成是否正確
2. 先驗估計計算邏輯是否有誤
3. 模型是否真的在學習
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

from data_generator import generate_synthetic_data

def test_data_generation():
    """測試數據生成是否正確"""
    print("="*80)
    print("🔍 測試一：數據生成驗證")
    print("="*80)
    
    # 生成數據
    xp, xu, xt_p, xt_n = generate_synthetic_data(
        distribution='two_moons',
        dims=2,
        n_p=50,
        n_u=300,
        prior=0.3,
        n_test=1000
    )
    
    print(f"📊 數據生成結果:")
    print(f"   • 訓練正樣本 (P): {len(xp)} 個")
    print(f"   • 訓練未標記樣本 (U): {len(xu)} 個")
    print(f"   • 測試正樣本: {len(xt_p)} 個")
    print(f"   • 測試負樣本: {len(xt_n)} 個")
    
    # 檢查先驗
    total_test = len(xt_p) + len(xt_n)
    actual_test_prior = len(xt_p) / total_test
    print(f"   • 設定的先驗: 0.3000")
    print(f"   • 測試集實際先驗: {actual_test_prior:.4f}")
    
    # 理論上，在 prior=0.3 的設定下：
    # - 正樣本應該佔 30%
    # - 負樣本應該佔 70%
    
    if abs(actual_test_prior - 0.3) < 0.05:
        print(f"   ✅ 數據生成正確，測試集先驗接近設定值")
    else:
        print(f"   ❌ 數據生成異常，測試集先驗偏離設定值")
        print(f"   ⚠️  這可能是 Estimated Prior 錯誤的根源！")
    
    return {
        'train_p_count': len(xp),
        'train_u_count': len(xu),
        'test_p_count': len(xt_p),
        'test_n_count': len(xt_n),
        'actual_test_prior': actual_test_prior
    }

def test_minimal_nnpu():
    """測試最簡單的 nnPU 配置"""
    print("\n" + "="*80)
    print("🔍 測試二：最簡 nnPU 配置")
    print("="*80)
    
    # 極其保守的配置
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
            "n_epochs": 20,  # 減少訓練週期
            "learning_rate": 0.0005,  # 適中學習率
            "hidden_dim": 8,  # 極簡模型
            "weight_decay": 0.01  # 強正規化
        }
    }
    
    print(f"📋 使用配置:")
    print(f"   • 隱藏層維度: {request_data['model_params']['hidden_dim']}")
    print(f"   • 學習率: {request_data['model_params']['learning_rate']}")
    print(f"   • Weight Decay: {request_data['model_params']['weight_decay']}")
    print(f"   • 訓練週期: {request_data['model_params']['n_epochs']}")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/pu-learning/run-simulation",
            json=request_data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            
            estimated_prior = result['metrics']['estimated_prior']
            error_rate = result['metrics']['error_rate']
            risk_curve = result['metrics']['risk_curve']
            
            print(f"\n📊 結果分析:")
            print(f"   • Estimated Prior: {estimated_prior:.4f}")
            print(f"   • Classification Error: {error_rate:.4f}")
            print(f"   • 風險曲線點數: {len(risk_curve)}")
            
            # 分析風險曲線趨勢
            if len(risk_curve) >= 10:
                initial_risk = np.mean([p['risk'] for p in risk_curve[:5]])
                final_risk = np.mean([p['risk'] for p in risk_curve[-5:]])
                risk_change = final_risk - initial_risk
                
                print(f"   • 初始風險 (前5點): {initial_risk:.6f}")
                print(f"   • 最終風險 (後5點): {final_risk:.6f}")
                print(f"   • 風險變化: {risk_change:.6f}")
                
                if risk_change < -0.001:
                    print(f"   ✅ 模型正在學習 (風險下降)")
                else:
                    print(f"   ❌ 模型沒有明顯學習 (風險無明顯下降)")
            
            # 檢查先驗估計
            prior_error = abs(estimated_prior - 0.3)
            print(f"\n🎯 先驗估計分析:")
            print(f"   • 目標先驗: 0.3000")
            print(f"   • 估計先驗: {estimated_prior:.4f}")
            print(f"   • 絕對誤差: {prior_error:.4f}")
            
            if estimated_prior == 0.9:
                print(f"   ❌ 先驗估計異常！始終為 0.9000")
                print(f"   ⚠️  這表明先驗估計邏輯可能有根本性問題")
            elif prior_error < 0.1:
                print(f"   ✅ 先驗估計合理")
            else:
                print(f"   ⚠️  先驗估計偏差較大")
            
            return {
                'success': True,
                'estimated_prior': estimated_prior,
                'error_rate': error_rate,
                'prior_error': prior_error,
                'risk_change': risk_change if 'risk_change' in locals() else None
            }
            
        else:
            print(f"❌ API 請求失敗: {response.status_code}")
            print(f"回應: {response.text}")
            return {'success': False, 'error': response.text}
            
    except Exception as e:
        print(f"❌ 請求失敗: {e}")
        return {'success': False, 'error': str(e)}

def test_different_priors():
    """測試不同先驗設定下的表現"""
    print("\n" + "="*80)
    print("🔍 測試三：不同先驗設定測試")
    print("="*80)
    
    prior_values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
    results = []
    
    for prior in prior_values:
        print(f"\n📋 測試先驗: {prior}")
        
        request_data = {
            "algorithm": "nnPU",
            "data_params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": prior
            },
            "model_params": {
                "activation": "relu",
                "n_epochs": 20,
                "learning_rate": 0.0005,
                "hidden_dim": 16,
                "weight_decay": 0.005
            }
        }
        
        try:
            response = requests.post(
                "http://localhost:8000/api/pu-learning/run-simulation",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                estimated_prior = result['metrics']['estimated_prior']
                error_rate = result['metrics']['error_rate']
                
                results.append({
                    'true_prior': prior,
                    'estimated_prior': estimated_prior,
                    'error_rate': error_rate,
                    'prior_error': abs(estimated_prior - prior)
                })
                
                print(f"   • 真實先驗: {prior:.1f}")
                print(f"   • 估計先驗: {estimated_prior:.4f}")
                print(f"   • 誤差: {abs(estimated_prior - prior):.4f}")
            else:
                print(f"   ❌ 失敗: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ 錯誤: {e}")
        
        # 短暫休息
        if prior != prior_values[-1]:
            time.sleep(1)
    
    # 分析結果
    if results:
        print(f"\n📊 先驗估計總結:")
        print(f"{'真實先驗':>8} {'估計先驗':>8} {'誤差':>8} {'錯誤率':>8}")
        print(f"{'-'*36}")
        
        for r in results:
            print(f"{r['true_prior']:>8.1f} {r['estimated_prior']:>8.4f} {r['prior_error']:>8.4f} {r['error_rate']:>8.4f}")
        
        # 檢查模式
        estimated_values = [r['estimated_prior'] for r in results]
        if len(set(estimated_values)) == 1:
            print(f"\n❌ 所有先驗估計都相同 ({estimated_values[0]:.4f})")
            print(f"⚠️  這表明先驗估計邏輯完全沒有工作！")
        else:
            print(f"\n✅ 先驗估計有變化，邏輯可能正常")
    
    return results

def run_prior_debugging():
    """運行完整的先驗估計調試"""
    print("🚀 開始先驗估計調試測試")
    print("="*80)
    
    # 測試一：數據生成
    data_result = test_data_generation()
    
    # 測試二：最簡 nnPU
    nnpu_result = test_minimal_nnpu()
    
    # 測試三：不同先驗測試
    prior_results = test_different_priors()
    
    # 總結
    print("\n" + "="*80)
    print("📋 調試總結報告")
    print("="*80)
    
    print(f"\n🔍 問題診斷:")
    
    # 檢查數據生成
    if data_result and abs(data_result['actual_test_prior'] - 0.3) < 0.05:
        print(f"   ✅ 數據生成正常")
    else:
        print(f"   ❌ 數據生成異常")
    
    # 檢查模型學習
    if nnpu_result and nnpu_result.get('success'):
        if nnpu_result.get('risk_change', 0) < -0.001:
            print(f"   ✅ 模型正在學習 (風險下降 {nnpu_result.get('risk_change', 0):.6f})")
        else:
            print(f"   ❌ 模型沒有明顯學習")
            
        # 檢查先驗估計
        if nnpu_result.get('estimated_prior') == 0.9:
            print(f"   ❌ 先驗估計邏輯異常 (固定在 0.9)")
        else:
            print(f"   ✅ 先驗估計有變化")
    
    # 檢查不同先驗的結果
    if prior_results:
        estimated_values = [r['estimated_prior'] for r in prior_results]
        if len(set(estimated_values)) == 1:
            print(f"   ❌ 先驗估計邏輯完全失效 (所有結果都是 {estimated_values[0]:.4f})")
        else:
            print(f"   ✅ 先驗估計有響應真實先驗的變化")
    
    print(f"\n💡 建議:")
    if nnpu_result and nnpu_result.get('estimated_prior') == 0.9:
        print(f"   • 檢查後端先驗估計的計算邏輯")
        print(f"   • 可能是模型預測輸出的解釋有誤")
        print(f"   • 檢查測試集的標籤生成是否正確")
    else:
        print(f"   • 繼續調整模型超參數")
        print(f"   • 嘗試更強的正規化")

if __name__ == "__main__":
    try:
        # 檢查後端連接
        response = requests.get("http://localhost:8000/api/pu-learning/health")
        if response.status_code == 200:
            print("✅ 後端服務正常")
            run_prior_debugging()
        else:
            print("❌ 後端服務異常")
    except Exception as e:
        print(f"❌ 無法連接後端: {e}")
