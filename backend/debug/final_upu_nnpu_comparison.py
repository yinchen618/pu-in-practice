#!/usr/bin/env python3
"""
uPU vs nnPU 對比實驗
使用 nnPU 最佳配置來測試 uPU 算法性能

目標：回答關鍵問題
1. uPU 的 Estimated Prior 能否修正到接近 0.3？
2. uPU 的錯誤率能否媲美 nnPU 的 0.6%？
3. Negative Risk 問題是否得到緩解？
"""

import requests
import json
import time

def test_upu_with_best_config():
    """使用 nnPU 最佳配置測試 uPU 算法"""
    print("🔬 uPU vs nnPU 對比實驗")
    print("=" * 80)
    print("📋 實驗設計:")
    print("   • 使用 nnPU 找到的最佳配置")
    print("   • 唯一變化：algorithm = 'uPU'")
    print("   • 數據集：Two Moons (2D)")
    print("   • Prior: 0.3")
    print()
    
    # nnPU 最佳配置
    best_config = {
        "learning_rate": 0.005,
        "weight_decay": 0.0001,
        "epochs": 200,
        "hidden_size": 64
    }
    
    print("🏆 使用的最佳配置:")
    for key, value in best_config.items():
        print(f"   • {key}: {value}")
    print()
    
    # 準備測試兩個算法
    algorithms = ["nnPU", "uPU"]
    results = {}
    
    for algorithm in algorithms:
        print(f"🧪 測試 {algorithm} 算法...")
        print("-" * 40)
        
        url = "http://localhost:8000/api/pu-learning/run-simulation"
        
        payload = {
            "algorithm": algorithm,
            "data_params": {
                "distribution": "two_moons",
                "dims": 2,
                "n_p": 100,
                "n_u": 300,
                "prior": 0.3
            },
            "model_params": {
                "activation": "relu",
                "n_epochs": best_config["epochs"],
                "learning_rate": best_config["learning_rate"],
                "hidden_dim": best_config["hidden_size"],
                "weight_decay": best_config["weight_decay"]
            }
        }
        
        try:
            print(f"⏱️  開始 {algorithm} 訓練 (200 epochs)...")
            start_time = time.time()
            
            response = requests.post(url, json=payload, timeout=300)  # 增加超時時間
            
            end_time = time.time()
            duration = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                metrics = result["metrics"]
                
                # 保存結果
                results[algorithm] = {
                    "error_rate": metrics["error_rate"],
                    "estimated_prior": metrics["estimated_prior"],
                    "risk_curve": metrics["risk_curve"],
                    "duration": duration,
                    "success": True
                }
                
                print(f"✅ {algorithm} 訓練完成 ({duration:.1f}秒)")
                print(f"   • 錯誤率: {metrics['error_rate']:.4f} ({metrics['error_rate']*100:.2f}%)")
                print(f"   • 估計先驗: {metrics['estimated_prior']:.4f}")
                print(f"   • 先驗誤差: {abs(metrics['estimated_prior'] - 0.3):.4f}")
                print()
                
            else:
                print(f"❌ {algorithm} 訓練失敗: HTTP {response.status_code}")
                print(f"   錯誤: {response.text}")
                results[algorithm] = {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            print(f"❌ {algorithm} 訓練異常: {e}")
            results[algorithm] = {"success": False, "error": str(e)}
        
        # 算法間間隔
        if algorithm != algorithms[-1]:
            print("⏳ 等待 5 秒後開始下一個算法...")
            time.sleep(5)
    
    return results

def analyze_comparison_results(results):
    """分析對比實驗結果"""
    print("=" * 80)
    print("📊 uPU vs nnPU 對比分析報告")
    print("=" * 80)
    
    if not results["nnPU"]["success"] or not results["uPU"]["success"]:
        print("❌ 實驗失敗，無法進行對比分析")
        for alg, result in results.items():
            if not result["success"]:
                print(f"   • {alg}: {result.get('error', 'Unknown error')}")
        return
    
    nnpu = results["nnPU"]
    upu = results["uPU"]
    
    print("📈 核心性能指標對比:")
    print("-" * 40)
    
    # 錯誤率對比
    print(f"🎯 錯誤率 (Error Rate):")
    print(f"   • nnPU: {nnpu['error_rate']:.4f} ({nnpu['error_rate']*100:.2f}%)")
    print(f"   • uPU:  {upu['error_rate']:.4f} ({upu['error_rate']*100:.2f}%)")
    
    error_diff = upu['error_rate'] - nnpu['error_rate']
    if error_diff > 0:
        print(f"   📊 uPU 錯誤率較高 +{error_diff:.4f} (+{error_diff*100:.2f}%)")
    elif error_diff < 0:
        print(f"   📊 uPU 錯誤率較低 {error_diff:.4f} ({error_diff*100:.2f}%)")
    else:
        print(f"   📊 兩算法錯誤率相同")
    
    print()
    
    # 先驗估計對比
    print(f"🔍 先驗估計 (Estimated Prior):")
    print(f"   • 真實先驗: 0.3000")
    print(f"   • nnPU 估計: {nnpu['estimated_prior']:.4f} (誤差: {abs(nnpu['estimated_prior'] - 0.3):.4f})")
    print(f"   • uPU 估計:  {upu['estimated_prior']:.4f} (誤差: {abs(upu['estimated_prior'] - 0.3):.4f})")
    
    prior_diff = abs(upu['estimated_prior'] - 0.3) - abs(nnpu['estimated_prior'] - 0.3)
    if prior_diff > 0:
        print(f"   📊 uPU 先驗估計誤差較大 +{prior_diff:.4f}")
    elif prior_diff < 0:
        print(f"   📊 uPU 先驗估計誤差較小 {prior_diff:.4f}")
    else:
        print(f"   📊 兩算法先驗估計精度相同")
    
    print()
    
    # 訓練時間對比
    print(f"⏱️  訓練時間:")
    print(f"   • nnPU: {nnpu['duration']:.1f} 秒")
    print(f"   • uPU:  {upu['duration']:.1f} 秒")
    
    time_diff = upu['duration'] - nnpu['duration']
    if time_diff > 0:
        print(f"   📊 uPU 訓練較慢 +{time_diff:.1f} 秒")
    elif time_diff < 0:
        print(f"   📊 uPU 訓練較快 {time_diff:.1f} 秒")
    else:
        print(f"   📊 兩算法訓練時間相同")
    
    print()
    
    # 風險曲線分析
    print("📈 風險曲線分析:")
    print("-" * 40)
    
    nnpu_risks = [point['risk'] for point in nnpu['risk_curve']]
    upu_risks = [point['risk'] for point in upu['risk_curve']]
    
    print(f"📊 最終風險值:")
    print(f"   • nnPU 最終風險: {nnpu_risks[-1]:.6f}")
    print(f"   • uPU 最終風險:  {upu_risks[-1]:.6f}")
    
    # 檢查負風險
    nnpu_negative_risks = [r for r in nnpu_risks if r < 0]
    upu_negative_risks = [r for r in upu_risks if r < 0]
    
    print(f"🔍 負風險檢測:")
    print(f"   • nnPU 負風險出現次數: {len(nnpu_negative_risks)}")
    print(f"   • uPU 負風險出現次數:  {len(upu_negative_risks)}")
    
    if len(upu_negative_risks) == 0 and len(nnpu_negative_risks) == 0:
        print(f"   ✅ 兩算法都沒有負風險問題")
    elif len(upu_negative_risks) < len(nnpu_negative_risks):
        print(f"   📊 uPU 負風險問題較少")
    elif len(upu_negative_risks) > len(nnpu_negative_risks):
        print(f"   📊 uPU 負風險問題較多")
    else:
        print(f"   📊 兩算法負風險情況相同")
    
    print()
    
    # 回答關鍵問題
    print("=" * 80)
    print("🎯 關鍵問題回答")
    print("=" * 80)
    
    print("❓ 問題1: uPU 的 Estimated Prior 能否修正到接近 0.3？")
    upu_prior_error = abs(upu['estimated_prior'] - 0.3)
    if upu_prior_error < 0.05:
        print(f"   ✅ 是的！uPU 先驗估計 {upu['estimated_prior']:.4f}，誤差僅 {upu_prior_error:.4f}")
    elif upu_prior_error < 0.1:
        print(f"   ⚠️  部分成功。uPU 先驗估計 {upu['estimated_prior']:.4f}，誤差 {upu_prior_error:.4f}")
    else:
        print(f"   ❌ 沒有。uPU 先驗估計 {upu['estimated_prior']:.4f}，誤差 {upu_prior_error:.4f}")
    
    print()
    print("❓ 問題2: uPU 錯誤率能否媲美 nnPU？")
    if upu['error_rate'] <= nnpu['error_rate'] * 1.1:  # 10% 容差
        print(f"   ✅ 是的！uPU 錯誤率 {upu['error_rate']*100:.2f}% vs nnPU {nnpu['error_rate']*100:.2f}%")
    elif upu['error_rate'] <= nnpu['error_rate'] * 2:  # 2倍容差
        print(f"   ⚠️  接近。uPU 錯誤率 {upu['error_rate']*100:.2f}% vs nnPU {nnpu['error_rate']*100:.2f}%")
    else:
        print(f"   ❌ 沒有。uPU 錯誤率 {upu['error_rate']*100:.2f}% 明顯高於 nnPU {nnpu['error_rate']*100:.2f}%")
    
    print()
    print("❓ 問題3: Negative Risk 問題是否得到緩解？")
    if len(upu_negative_risks) == 0:
        print(f"   ✅ 完全解決！uPU 沒有出現負風險")
    elif len(upu_negative_risks) < len(upu_risks) * 0.1:  # 少於10%
        print(f"   ⚠️  顯著緩解。負風險僅出現 {len(upu_negative_risks)} 次")
    else:
        print(f"   ❌ 問題依然存在。負風險出現 {len(upu_negative_risks)} 次")
    
    print()
    
    # 最終結論
    print("=" * 80)
    print("🏆 實驗結論")
    print("=" * 80)
    
    if (upu_prior_error < 0.05 and 
        upu['error_rate'] <= nnpu['error_rate'] * 1.2 and 
        len(upu_negative_risks) <= len(upu_risks) * 0.1):
        print("🎉 uPU 在最佳配置下表現優秀！")
        print("   • 先驗估計準確")
        print("   • 錯誤率競爭力強")
        print("   • 負風險問題得到控制")
    elif (upu_prior_error < 0.1 and 
          upu['error_rate'] <= nnpu['error_rate'] * 2):
        print("👍 uPU 表現良好，但略遜於 nnPU")
        print("   • 整體性能可接受")
        print("   • 仍有改進空間")
    else:
        print("📊 uPU 性能明顯落後於 nnPU")
        print("   • 需要進一步調優或考慮其他方法")
    
    return results

def save_comparison_results(results):
    """保存對比實驗結果"""
    try:
        with open("upu_vs_nnpu_comparison.json", "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n💾 實驗結果已保存到 upu_vs_nnpu_comparison.json")
    except Exception as e:
        print(f"\n⚠️  保存結果失敗: {e}")

def main():
    """主函數"""
    print("🚀 開始 uPU vs nnPU 最終對比實驗")
    print("🎯 目標：驗證 uPU 在最佳配置下的性能表現")
    print()
    
    # 執行對比實驗
    results = test_upu_with_best_config()
    
    # 分析結果
    analyze_comparison_results(results)
    
    # 保存結果
    save_comparison_results(results)
    
    print()
    print("🎊 實驗完成！感謝您完成這個完整的 PU Learning 研究項目！")

if __name__ == "__main__":
    main()
