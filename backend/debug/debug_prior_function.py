#!/usr/bin/env python3
"""
先驗估計函數調試與修正
驗證 estimate_prior_penL1CP 函數是否存在問題
"""

import numpy as np
import sys
import os

# 添加後端路徑
backend_dir = os.path.dirname(os.path.abspath(__file__))
pu_learning_dir = os.path.join(backend_dir, 'pu-learning')
if pu_learning_dir not in sys.path:
    sys.path.append(pu_learning_dir)

from data_generator import generate_synthetic_data

def debug_prior_estimation():
    """調試現有的先驗估計函數"""
    print("🔍 調試先驗估計函數")
    print("="*60)
    
    # 生成測試數據
    xp, xu, xt_p, xt_n = generate_synthetic_data(
        distribution='two_moons',
        dims=2,
        n_p=50,
        n_u=300,
        prior=0.3,
        n_test=1000
    )
    
    print(f"📊 測試數據:")
    print(f"   • 正樣本: {len(xp)}")
    print(f"   • 未標記樣本: {len(xu)}")
    print(f"   • 真實先驗: 0.3")
    
    # 手動實現現有邏輯
    from sklearn.neighbors import KernelDensity
    
    print(f"\n🔍 分析現有先驗估計邏輯:")
    
    try:
        # 核密度估計
        kde_p = KernelDensity(bandwidth=0.5, kernel='gaussian')
        kde_u = KernelDensity(bandwidth=0.5, kernel='gaussian')
        
        kde_p.fit(xp)
        kde_u.fit(xu)
        
        # 在未標記樣本上評估密度
        log_dens_p = kde_p.score_samples(xu)
        log_dens_u = kde_u.score_samples(xu)
        
        # 計算密度比
        density_ratio = np.exp(log_dens_p - log_dens_u)
        
        print(f"   • 密度比統計:")
        print(f"      - 最小值: {np.min(density_ratio):.4f}")
        print(f"      - 最大值: {np.max(density_ratio):.4f}")
        print(f"      - 均值: {np.mean(density_ratio):.4f}")
        print(f"      - 中位數: {np.median(density_ratio):.4f}")
        print(f"      - 標準差: {np.std(density_ratio):.4f}")
        
        # 現有估計方法
        estimated_prior_old = np.clip(np.mean(density_ratio), 0.1, 0.9)
        print(f"   • 現有方法結果: {estimated_prior_old:.4f}")
        
        # 問題分析
        if np.mean(density_ratio) > 0.9:
            print(f"   ❌ 問題：密度比均值 ({np.mean(density_ratio):.4f}) 超過 0.9，被裁剪！")
        
        # 嘗試改進方法
        print(f"\n💡 嘗試改進的先驗估計方法:")
        
        # 方法1：使用中位數而不是均值
        estimated_prior_v1 = np.clip(np.median(density_ratio), 0.1, 0.9)
        print(f"   • 方法1 (中位數): {estimated_prior_v1:.4f}")
        
        # 方法2：使用對數空間平均
        log_ratio = log_dens_p - log_dens_u
        estimated_prior_v2 = np.clip(np.exp(np.mean(log_ratio)), 0.1, 0.9)
        print(f"   • 方法2 (對數平均): {estimated_prior_v2:.4f}")
        
        # 方法3：基於分位數的估計
        percentile_75 = np.percentile(density_ratio, 75)
        estimated_prior_v3 = np.clip(percentile_75, 0.1, 0.9)
        print(f"   • 方法3 (75%分位數): {estimated_prior_v3:.4f}")
        
        # 方法4：基於實際密度估計的改進方法
        # 使用貝葉斯定理：P(y=1|x) = P(x|y=1) * P(y=1) / P(x)
        # 其中 P(x) = P(x|y=1) * P(y=1) + P(x|y=0) * P(y=0)
        
        # 計算在所有未標記樣本上的密度
        p_density = np.exp(log_dens_p)  # P(x|y=1)
        u_density = np.exp(log_dens_u)  # 近似 P(x)
        
        # 假設先驗，然後迭代估計
        prior_guess = 0.3
        for iteration in range(10):
            # 計算後驗概率
            posterior = (p_density * prior_guess) / u_density
            posterior = np.clip(posterior, 0.01, 0.99)
            
            # 更新先驗估計
            new_prior = np.mean(posterior)
            
            if abs(new_prior - prior_guess) < 0.001:
                break
            prior_guess = new_prior
        
        estimated_prior_v4 = np.clip(prior_guess, 0.1, 0.9)
        print(f"   • 方法4 (迭代貝葉斯): {estimated_prior_v4:.4f} (收斂於 {iteration+1} 次迭代)")
        
        # 方法5：簡單的基於樣本比例的估計
        # 假設正樣本在未標記樣本中的比例
        # 通過比較正樣本與未標記樣本的密度來估計
        
        # 計算正樣本在其自身分布下的平均密度
        p_self_density = np.mean(np.exp(kde_p.score_samples(xp)))
        # 計算正樣本在未標記分布下的平均密度
        p_in_u_density = np.mean(np.exp(kde_u.score_samples(xp)))
        
        # 簡單比例估計
        if p_in_u_density > 0:
            ratio_estimate = p_in_u_density / p_self_density
            estimated_prior_v5 = np.clip(ratio_estimate, 0.1, 0.9)
            print(f"   • 方法5 (密度比例): {estimated_prior_v5:.4f}")
        else:
            estimated_prior_v5 = 0.3
            print(f"   • 方法5 (密度比例): {estimated_prior_v5:.4f} (默認值)")
        
        # 比較結果
        true_prior = 0.3
        methods = [
            ('現有方法', estimated_prior_old),
            ('中位數法', estimated_prior_v1),
            ('對數平均', estimated_prior_v2),
            ('75%分位數', estimated_prior_v3),
            ('迭代貝葉斯', estimated_prior_v4),
            ('密度比例', estimated_prior_v5)
        ]
        
        print(f"\n📊 方法比較 (真實先驗: {true_prior}):")
        print(f"{'方法':>12} {'估計值':>8} {'誤差':>8}")
        print(f"{'-'*30}")
        
        best_method = None
        best_error = float('inf')
        
        for method_name, estimate in methods:
            error = abs(estimate - true_prior)
            print(f"{method_name:>12} {estimate:>8.4f} {error:>8.4f}")
            
            if error < best_error:
                best_error = error
                best_method = (method_name, estimate)
        
        if best_method:
            print(f"\n🏆 最佳方法: {best_method[0]} (誤差: {best_error:.4f})")
            
            if best_error < 0.1:
                print(f"✅ 找到了有效的先驗估計方法！")
                return best_method
            else:
                print(f"⚠️  改善有限，但比現有方法更好")
                return best_method
        
    except Exception as e:
        print(f"❌ 調試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_different_priors_with_debug():
    """使用調試信息測試不同先驗"""
    print(f"\n🧪 測試不同先驗下的密度比行為")
    print("="*60)
    
    from sklearn.neighbors import KernelDensity
    
    priors_to_test = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
    
    for prior in priors_to_test:
        xp, xu, xt_p, xt_n = generate_synthetic_data(
            distribution='two_moons',
            dims=2,
            n_p=50,
            n_u=300,
            prior=prior,
            n_test=1000
        )
        
        kde_p = KernelDensity(bandwidth=0.5, kernel='gaussian')
        kde_u = KernelDensity(bandwidth=0.5, kernel='gaussian')
        
        kde_p.fit(xp)
        kde_u.fit(xu)
        
        log_dens_p = kde_p.score_samples(xu)
        log_dens_u = kde_u.score_samples(xu)
        density_ratio = np.exp(log_dens_p - log_dens_u)
        
        mean_ratio = np.mean(density_ratio)
        clipped_ratio = np.clip(mean_ratio, 0.1, 0.9)
        
        print(f"先驗 {prior:.1f}: 密度比均值 {mean_ratio:.4f} → 裁剪後 {clipped_ratio:.4f}")

if __name__ == "__main__":
    # 運行調試
    best_method = debug_prior_estimation()
    
    # 測試不同先驗
    test_different_priors_with_debug()
    
    if best_method:
        print(f"\n💡 建議:")
        print(f"   • 將現有的先驗估計方法替換為: {best_method[0]}")
        print(f"   • 這將大幅改善先驗估計的準確性")
        print(f"   • 修正後可能解決 nnPU 的過擬合問題")
