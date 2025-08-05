#!/usr/bin/env python3
"""
詳細測試 nnPU 決策邊界百葉窗效果
系統性地測試各種參數組合，尋找會導致百葉窗效果的配置
"""

import requests
import json
import time
import numpy as np
from typing import List, Dict, Tuple

def test_parameter_combination(
    distribution: str,
    dims: int,
    n_p: int,
    n_u: int,
    prior: float,
    activation: str,
    n_epochs: int,
    learning_rate: float,
    hidden_dim: int,
    weight_decay: float
) -> Dict:
    """測試特定參數組合"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    payload = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": distribution,
            "dims": dims,
            "n_p": n_p,
            "n_u": n_u,
            "prior": prior
        },
        "model_params": {
            "activation": activation,
            "n_epochs": n_epochs,
            "learning_rate": learning_rate,
            "hidden_dim": hidden_dim,
            "weight_decay": weight_decay
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        return None

def analyze_decision_boundary(decision_boundary: List[List[float]]) -> Dict:
    """分析決策邊界的平滑度"""
    
    if len(decision_boundary) < 3:
        return {"smoothness": 0, "oscillations": 0, "blinds_effect": False}
    
    # 轉換為 numpy 陣列
    boundary = np.array(decision_boundary)
    x_coords = boundary[:, 0]
    y_coords = boundary[:, 1]
    
    # 計算相鄰點之間的變化
    y_diffs = np.diff(y_coords)
    x_diffs = np.diff(x_coords)
    
    # 計算平滑度指標
    y_variance = np.var(y_diffs)
    y_mean_diff = np.mean(np.abs(y_diffs))
    
    # 計算振盪次數（符號變化次數）
    sign_changes = np.sum(np.diff(np.sign(y_diffs)) != 0)
    
    # 計算百葉窗效果指標
    blinds_score = 0
    
    # 檢查振盪頻率
    if sign_changes > len(y_diffs) * 0.3:  # 超過30%的點有符號變化
        blinds_score += 1
    
    # 檢查大幅跳躍
    large_jumps = np.sum(np.abs(y_diffs) > np.std(y_coords) * 0.5)
    if large_jumps > len(y_diffs) * 0.2:  # 超過20%的點有大跳躍
        blinds_score += 1
    
    # 檢查 Y 座標變化範圍
    y_range = np.max(y_coords) - np.min(y_coords)
    if y_range > 2.0:  # Y 座標變化過大
        blinds_score += 1
    
    # 檢查相鄰點距離的一致性
    distances = np.sqrt(x_diffs**2 + y_diffs**2)
    distance_variance = np.var(distances)
    if distance_variance > np.mean(distances) * 0.5:  # 距離變化過大
        blinds_score += 1
    
    has_blinds_effect = blinds_score >= 2
    
    return {
        "smoothness": 1.0 / (1.0 + y_variance),  # 平滑度（0-1，越高越平滑）
        "oscillations": sign_changes,
        "y_variance": y_variance,
        "y_mean_diff": y_mean_diff,
        "y_range": y_range,
        "large_jumps": large_jumps,
        "distance_variance": distance_variance,
        "blinds_score": blinds_score,
        "blinds_effect": has_blinds_effect,
        "boundary_points": len(decision_boundary)
    }

def test_blinds_effect_systematic():
    """系統性地測試百葉窗效果"""
    
    print("🔍 系統性尋找 nnPU 百葉窗效果參數...")
    print("=" * 80)
    
    # 定義參數範圍
    test_configs = []
    
    # 1. 學習率測試
    learning_rates = [0.001, 0.01, 0.05, 0.1, 0.2, 0.5]
    for lr in learning_rates:
        test_configs.append({
            "name": f"學習率 {lr}",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": lr,
                "hidden_dim": 100,
                "weight_decay": 0.0
            }
        })
    
    # 2. 權重衰減測試
    weight_decays = [0.0, 0.01, 0.05, 0.1, 0.2]
    for wd in weight_decays:
        test_configs.append({
            "name": f"權重衰減 {wd}",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.05,
                "hidden_dim": 100,
                "weight_decay": wd
            }
        })
    
    # 3. 隱藏層維度測試
    hidden_dims = [5, 10, 20, 50, 100, 200]
    for hd in hidden_dims:
        test_configs.append({
            "name": f"隱藏層維度 {hd}",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.05,
                "hidden_dim": hd,
                "weight_decay": 0.1
            }
        })
    
    # 4. 激活函數測試
    activations = ["relu", "tanh", "softsign"]
    for act in activations:
        test_configs.append({
            "name": f"激活函數 {act}",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": act,
                "n_epochs": 100,
                "learning_rate": 0.1,
                "hidden_dim": 100,
                "weight_decay": 0.0
            }
        })
    
    # 5. 數據分布測試
    distributions = ["two_moons", "gaussian", "spiral", "complex"]
    for dist in distributions:
        test_configs.append({
            "name": f"數據分布 {dist}",
            "params": {
                "distribution": dist,
                "dims": 2 if dist != "complex" else 8,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.05,
                "hidden_dim": 100,
                "weight_decay": 0.1
            }
        })
    
    # 6. 樣本數量測試
    sample_configs = [
        {"n_p": 10, "n_u": 100, "name": "極少樣本"},
        {"n_p": 20, "n_u": 200, "name": "少樣本"},
        {"n_p": 50, "n_u": 300, "name": "標準樣本"},
        {"n_p": 100, "n_u": 500, "name": "多樣本"},
        {"n_p": 200, "n_u": 1000, "name": "極多樣本"}
    ]
    for config in sample_configs:
        test_configs.append({
            "name": f"樣本數量 {config['name']}",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": config["n_p"],
                "n_u": config["n_u"],
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.05,
                "hidden_dim": 100,
                "weight_decay": 0.1
            }
        })
    
    # 7. 先驗測試
    priors = [0.1, 0.2, 0.3, 0.4, 0.5]
    for prior in priors:
        test_configs.append({
            "name": f"先驗 {prior}",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": prior,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.05,
                "hidden_dim": 100,
                "weight_decay": 0.1
            }
        })
    
    # 8. 訓練週期測試
    epochs_list = [20, 50, 100, 200, 500]
    for epochs in epochs_list:
        test_configs.append({
            "name": f"訓練週期 {epochs}",
            "params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": epochs,
                "learning_rate": 0.05,
                "hidden_dim": 100,
                "weight_decay": 0.1
            }
        })
    
    results = []
    blinds_effects = []
    
    print(f"📋 總共測試 {len(test_configs)} 個參數組合")
    
    for i, config in enumerate(test_configs, 1):
        print(f"\n📋 測試 {i}/{len(test_configs)}: {config['name']}")
        
        # 執行測試
        result = test_parameter_combination(**config['params'])
        
        if result and result.get('success'):
            # 分析決策邊界
            boundary_analysis = analyze_decision_boundary(
                result['visualization']['decision_boundary']
            )
            
            # 獲取指標
            metrics = result['metrics']
            
            print(f"   ✅ 成功執行")
            print(f"   📊 百葉窗分數: {boundary_analysis['blinds_score']}")
            print(f"   📊 振盪次數: {boundary_analysis['oscillations']}")
            print(f"   📊 平滑度: {boundary_analysis['smoothness']:.3f}")
            print(f"   📊 百葉窗效果: {'✅ 是' if boundary_analysis['blinds_effect'] else '❌ 否'}")
            
            # 保存結果
            test_result = {
                "config_name": config['name'],
                "params": config['params'],
                "boundary_analysis": {
                    "smoothness": float(boundary_analysis['smoothness']),
                    "oscillations": int(boundary_analysis['oscillations']),
                    "y_variance": float(boundary_analysis['y_variance']),
                    "y_mean_diff": float(boundary_analysis['y_mean_diff']),
                    "y_range": float(boundary_analysis['y_range']),
                    "large_jumps": int(boundary_analysis['large_jumps']),
                    "distance_variance": float(boundary_analysis['distance_variance']),
                    "blinds_score": int(boundary_analysis['blinds_score']),
                    "blinds_effect": bool(boundary_analysis['blinds_effect']),
                    "boundary_points": int(boundary_analysis['boundary_points'])
                },
                "metrics": {
                    "estimated_prior": float(metrics['estimated_prior']),
                    "error_rate": float(metrics['error_rate'])
                },
                "has_blinds_effect": bool(boundary_analysis['blinds_effect'])
            }
            results.append(test_result)
            
            if boundary_analysis['blinds_effect']:
                blinds_effects.append(test_result)
                print(f"   🎯 發現百葉窗效果！")
            
        else:
            print(f"   ❌ 執行失敗")
        
        # 等待一下避免請求過於頻繁
        time.sleep(0.5)
    
    # 分析結果
    print("\n" + "=" * 80)
    print("📊 百葉窗效果系統性分析結果")
    print("=" * 80)
    
    print(f"🔍 發現百葉窗效果: {len(blinds_effects)}/{len(results)} 個配置")
    
    if blinds_effects:
        print(f"\n🎯 會產生百葉窗效果的參數組合:")
        for i, effect in enumerate(blinds_effects, 1):
            print(f"\n{i}. {effect['config_name']}")
            params = effect['params']
            analysis = effect['boundary_analysis']
            print(f"   參數: 學習率={params['learning_rate']}, "
                 f"權重衰減={params['weight_decay']}, "
                 f"隱藏層={params['hidden_dim']}, "
                 f"激活={params['activation']}, "
                 f"分布={params['distribution']}")
            print(f"   百葉窗指標: 分數={analysis['blinds_score']}, "
                 f"振盪={analysis['oscillations']}, "
                 f"平滑度={analysis['smoothness']:.3f}")
    
    # 按參數類型分組分析
    print(f"\n📈 按參數類型分析:")
    
    # 學習率分析
    lr_results = [r for r in results if "學習率" in r['config_name']]
    lr_blinds = [r for r in lr_results if r['has_blinds_effect']]
    print(f"   學習率測試: {len(lr_blinds)}/{len(lr_results)} 產生百葉窗效果")
    
    # 權重衰減分析
    wd_results = [r for r in results if "權重衰減" in r['config_name']]
    wd_blinds = [r for r in wd_results if r['has_blinds_effect']]
    print(f"   權重衰減測試: {len(wd_blinds)}/{len(wd_results)} 產生百葉窗效果")
    
    # 隱藏層維度分析
    hd_results = [r for r in results if "隱藏層維度" in r['config_name']]
    hd_blinds = [r for r in hd_results if r['has_blinds_effect']]
    print(f"   隱藏層維度測試: {len(hd_blinds)}/{len(hd_results)} 產生百葉窗效果")
    
    # 激活函數分析
    act_results = [r for r in results if "激活函數" in r['config_name']]
    act_blinds = [r for r in act_results if r['has_blinds_effect']]
    print(f"   激活函數測試: {len(act_blinds)}/{len(act_results)} 產生百葉窗效果")
    
    # 數據分布分析
    dist_results = [r for r in results if "數據分布" in r['config_name']]
    dist_blinds = [r for r in dist_results if r['has_blinds_effect']]
    print(f"   數據分布測試: {len(dist_blinds)}/{len(dist_results)} 產生百葉窗效果")
    
    # 保存詳細結果
    with open('nnpu_blinds_effect_detailed_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 詳細結果已保存到: nnpu_blinds_effect_detailed_results.json")
    
    return results, blinds_effects

if __name__ == "__main__":
    results, blinds_effects = test_blinds_effect_systematic()
    
    print(f"\n🎯 測試完成！發現 {len(blinds_effects)} 個百葉窗效果配置") 
