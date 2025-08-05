#!/usr/bin/env python3
"""
修復 matplotlib 中文字體問題並重新生成百葉窗效果圖片
使用 ReLU 激活函數、高斯分布、更多神經元、無正規化的組合
重點測試可能產生過擬合的參數
"""

import requests
import json
import time
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from typing import List, Dict
import os

def setup_chinese_font():
    """設置中文字體支持"""
    print("🔧 設置中文字體支持...")
    
    # 嘗試設置中文字體
    chinese_fonts = [
        'SimHei', 'Microsoft YaHei', 'WenQuanYi Micro Hei', 
        'DejaVu Sans', 'Arial Unicode MS', 'Noto Sans CJK SC'
    ]
    
    font_found = False
    for font_name in chinese_fonts:
        try:
            # 檢查字體是否存在
            font_path = fm.findfont(fm.FontProperties(family=font_name))
            if font_path != fm.rcParams['font.sans-serif'][0]:
                plt.rcParams['font.sans-serif'] = [font_name] + plt.rcParams['font.sans-serif']
                font_found = True
                print(f"✅ 成功設置中文字體: {font_name}")
                break
        except:
            continue
    
    if not font_found:
        # 如果找不到中文字體，使用系統默認字體並設置 Unicode 支持
        plt.rcParams['font.sans-serif'] = ['DejaVu Sans'] + plt.rcParams['font.sans-serif']
        print("⚠️  未找到中文字體，使用 Unicode 支持")
    
    # 設置 Unicode 支持
    plt.rcParams['axes.unicode_minus'] = False
    
    # 測試中文字體
    try:
        fig, ax = plt.subplots(figsize=(1, 1))
        ax.text(0.5, 0.5, '測試中文', fontsize=12)
        plt.close(fig)
        print("✅ 中文字體測試成功")
    except Exception as e:
        print(f"⚠️  中文字體測試失敗: {e}")

def test_parameter_combination(params: Dict) -> Dict:
    """測試特定參數組合"""
    
    url = "http://localhost:8000/api/pu-learning/run-simulation"
    
    payload = {
        "algorithm": "nnPU",
        "data_params": {
            "distribution": params["distribution"],
            "dims": params["dims"],
            "n_p": params["n_p"],
            "n_u": params["n_u"],
            "prior": params["prior"]
        },
        "model_params": {
            "activation": params["activation"],
            "n_epochs": params["n_epochs"],
            "learning_rate": params["learning_rate"],
            "hidden_dim": params["hidden_dim"],
            "weight_decay": params["weight_decay"]
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ API 請求失敗: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 請求異常: {e}")
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

def visualize_blinds_effect(result: Dict, config_name: str, analysis: Dict):
    """可視化百葉窗效果"""
    
    # 提取數據
    p_samples = result['visualization']['p_samples']
    u_samples = result['visualization']['u_samples']
    decision_boundary = result['visualization']['decision_boundary']
    
    # 創建圖表
    plt.figure(figsize=(15, 10))
    
    # 繪製樣本點
    p_x, p_y = zip(*p_samples)
    u_x, u_y = zip(*u_samples)
    
    plt.scatter(p_x, p_y, c='red', s=50, alpha=0.7, label='正樣本 (P) / Positive Samples')
    plt.scatter(u_x, u_y, c='gray', s=30, alpha=0.5, label='未標記樣本 (U) / Unlabeled Samples')
    
    # 繪製決策邊界
    boundary_x, boundary_y = zip(*decision_boundary)
    plt.plot(boundary_x, boundary_y, 'b-', linewidth=2, label='決策邊界 / Decision Boundary')
    
    # 添加標題和指標（中英文並列）
    title = f'nnPU 百葉窗效果 / Blinds Effect: {config_name}\n'
    title += f'平滑度 / Smoothness: {analysis["smoothness"]:.3f}, '
    title += f'振盪次數 / Oscillations: {analysis["oscillations"]}, '
    title += f'百葉窗分數 / Blinds Score: {analysis["blinds_score"]}, '
    title += f'Y變化範圍 / Y Range: {analysis["y_range"]:.3f}'
    
    plt.title(title, fontsize=14, fontweight='bold')
    plt.xlabel('X 座標 / X Coordinate', fontsize=12)
    plt.ylabel('Y 座標 / Y Coordinate', fontsize=12)
    plt.legend(fontsize=11)
    plt.grid(True, alpha=0.3)
    
    # 保存圖片
    filename = f'nnpu_gaussian_overfitting_{config_name.replace(" ", "_").replace("=", "_")}.png'
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    
    print(f"✅ 可視化圖片已保存: {filename}")

def test_gaussian_overfitting_configurations():
    """測試使用高斯分布的過擬合參數配置"""
    
    print("🔍 測試 nnPU 高斯分布過擬合參數組合...")
    print("=" * 80)
    
    # 定義使用高斯分布的過擬合參數組合
    # 重點：高斯分布 + 可能導致過擬合的參數
    gaussian_configs = [
        {
            "name": "Gaussian_極高學習率_多神經元_無正規化",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.5,
                "hidden_dim": 200,
                "weight_decay": 0.0
            }
        },
        {
            "name": "Gaussian_極高學習率_更多神經元_無正規化",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.8,
                "hidden_dim": 300,
                "weight_decay": 0.0
            }
        },
        {
            "name": "Gaussian_高學習率_極多神經元_無正規化",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.3,
                "hidden_dim": 500,
                "weight_decay": 0.0
            }
        },
        {
            "name": "Gaussian_極高學習率_多神經元_低先驗",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.2,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.6,
                "hidden_dim": 200,
                "weight_decay": 0.0
            }
        },
        {
            "name": "Gaussian_高學習率_多神經元_高先驗",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.4,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.4,
                "hidden_dim": 200,
                "weight_decay": 0.0
            }
        },
        {
            "name": "Gaussian_極高學習率_更多神經元_不平衡數據",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 30,
                "n_u": 400,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.7,
                "hidden_dim": 300,
                "weight_decay": 0.0
            }
        },
        {
            "name": "Gaussian_高學習率_極多神經元_極不平衡數據",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 20,
                "n_u": 500,
                "prior": 0.3,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.3,
                "hidden_dim": 500,
                "weight_decay": 0.0
            }
        },
        {
            "name": "Gaussian_極高學習率_多神經元_極低先驗",
            "params": {
                "distribution": "gaussian",
                "dims": 2,
                "n_p": 50,
                "n_u": 300,
                "prior": 0.1,
                "activation": "relu",
                "n_epochs": 100,
                "learning_rate": 0.9,
                "hidden_dim": 200,
                "weight_decay": 0.0
            }
        }
    ]
    
    results = []
    
    for i, config in enumerate(gaussian_configs):
        print(f"\n🔧 測試配置 {i+1}/{len(gaussian_configs)}: {config['name']}")
        print(f"   參數: {config['params']}")
        
        # 測試參數組合
        result = test_parameter_combination(config['params'])
        
        if result and result.get('success'):
            print("✅ 模擬成功")
            
            # 分析決策邊界
            decision_boundary = result['visualization']['decision_boundary']
            analysis = analyze_decision_boundary(decision_boundary)
            
            print(f"   分析結果:")
            print(f"   - 平滑度: {analysis['smoothness']:.3f}")
            print(f"   - 振盪次數: {analysis['oscillations']}")
            print(f"   - 百葉窗分數: {analysis['blinds_score']}")
            print(f"   - 有百葉窗效果: {analysis['blinds_effect']}")
            
            # 生成可視化
            visualize_blinds_effect(result, config['name'], analysis)
            
            # 保存結果
            results.append({
                "config": config,
                "analysis": analysis,
                "metrics": result['metrics']
            })
            
            # 轉換 numpy 類型為 Python 原生類型
            for key in analysis:
                if isinstance(analysis[key], np.integer):
                    analysis[key] = int(analysis[key])
                elif isinstance(analysis[key], np.floating):
                    analysis[key] = float(analysis[key])
                elif isinstance(analysis[key], np.bool_):
                    analysis[key] = bool(analysis[key])
            
        else:
            print("❌ 模擬失敗")
        
        # 等待一下避免請求過於頻繁
        time.sleep(1)
    
    # 保存結果到 JSON 文件
    results_data = []
    for result in results:
        result_data = {
            "config_name": result["config"]["name"],
            "params": result["config"]["params"],
            "analysis": result["analysis"],
            "metrics": result["metrics"]
        }
        results_data.append(result_data)
    
    with open('gaussian_overfitting_results.json', 'w', encoding='utf-8') as f:
        json.dump(results_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 測試完成！共測試 {len(gaussian_configs)} 個配置")
    print(f"✅ 成功: {len(results)} 個")
    print(f"❌ 失敗: {len(gaussian_configs) - len(results)} 個")
    
    # 顯示有百葉窗效果的配置
    blinds_effects = [r for r in results if r['analysis']['blinds_effect']]
    if blinds_effects:
        print(f"\n🎯 發現 {len(blinds_effects)} 個有百葉窗效果的配置:")
        for effect in blinds_effects:
            print(f"   - {effect['config']['name']}")
            print(f"     百葉窗分數: {effect['analysis']['blinds_score']}")
            print(f"     振盪次數: {effect['analysis']['oscillations']}")
    else:
        print("\n⚠️  未發現明顯的百葉窗效果")
    
    return results

if __name__ == "__main__":
    # 設置中文字體
    setup_chinese_font()
    
    # 測試高斯分布的過擬合參數
    test_gaussian_overfitting_configurations() 
