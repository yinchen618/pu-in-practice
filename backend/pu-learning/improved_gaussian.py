#!/usr/bin/env python3
"""
改進高斯分布的生成
1. 增加維度至4-16D
2. 調整中心點距離和噪音水平
"""
import numpy as np
from typing import Tuple
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

def generate_improved_gaussian(
    n_p: int = 50,
    n_u: int = 300,
    prior: float = 0.3,
    dims: int = 8,  # 更高維度
    n_test: int = 1000,
    noise_level: float = 0.8,  # 可調噪音水平
    center_dist: float = 2.0,  # 可調中心點距離
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    生成改進的高斯分布數據
    
    Args:
        n_p: 正樣本數量
        n_u: 未標記樣本數量
        prior: 類別先驗
        dims: 數據維度
        n_test: 測試樣本數量
        noise_level: 噪音水平
        center_dist: 類別中心點距離
    """
    # 設定隨機種子
    np.random.seed(42)
    
    # 正類中心：(d, d, ..., d)，其中d = center_dist/sqrt(dims)
    # 這確保了在高維空間中正負類中心的歐氏距離保持為center_dist
    d = center_dist / np.sqrt(dims)
    mu_p = np.ones(dims) * d
    mu_n = -np.ones(dims) * d
    
    # 生成樣本
    xp = np.random.randn(n_p, dims) * noise_level + mu_p
    
    # 未標記樣本
    n_u_pos = int(n_u * prior)
    n_u_neg = n_u - n_u_pos
    
    xu_pos = np.random.randn(n_u_pos, dims) * noise_level + mu_p
    xu_neg = np.random.randn(n_u_neg, dims) * noise_level + mu_n
    xu = np.vstack([xu_pos, xu_neg])
    np.random.shuffle(xu)
    
    # 測試樣本
    n_test_pos = int(n_test * prior)
    n_test_neg = n_test - n_test_pos
    
    xt_p = np.random.randn(n_test_pos, dims) * noise_level + mu_p
    xt_n = np.random.randn(n_test_neg, dims) * noise_level + mu_n
    
    # 計算樣本統計
    def calc_stats(x: np.ndarray, name: str):
        mean = np.mean(x, axis=0)
        std = np.std(x, axis=0)
        dist_to_center = np.linalg.norm(mean - mu_p if name != "負樣本" else mean - mu_n)
        return {
            "均值": mean,
            "標準差": std,
            "到中心距離": dist_to_center
        }
    
    stats = {
        "正樣本": calc_stats(xp, "正樣本"),
        "未標記正樣本": calc_stats(xu_pos, "未標記正樣本"),
        "未標記負樣本": calc_stats(xu_neg, "負樣本")
    }
    
    print(f"\n📊 數據統計:")
    print(f"數據維度: {dims}D")
    print(f"中心點距離: {center_dist}")
    print(f"噪音水平: {noise_level}")
    
    for name, stat in stats.items():
        print(f"\n{name}:")
        print(f"   • 到中心距離: {stat['到中心距離']:.3f}")
        print(f"   • 平均標準差: {np.mean(stat['標準差']):.3f}")
    
    if dims == 2:
        # 繪製2D可視化
        plt.figure(figsize=(10, 6))
        plt.scatter(xp[:, 0], xp[:, 1], c='b', label='正樣本', alpha=0.6)
        plt.scatter(xu_pos[:, 0], xu_pos[:, 1], c='g', label='未標記正樣本', alpha=0.3)
        plt.scatter(xu_neg[:, 0], xu_neg[:, 1], c='r', label='未標記負樣本', alpha=0.3)
        
        plt.scatter(mu_p[0], mu_p[1], c='k', marker='*', s=200, label='正類中心')
        plt.scatter(mu_n[0], mu_n[1], c='k', marker='x', s=200, label='負類中心')
        
        plt.legend()
        plt.title(f'2D高斯分布 (噪音={noise_level}, 中心距={center_dist})')
        plt.grid(True)
        plt.savefig('gaussian_visualization.png')
        plt.close()
    else:
        # 使用PCA降至2D以便可視化
        pca = PCA(n_components=2)
        all_data = np.vstack([xp, xu])
        pca_data = pca.fit_transform(all_data)
        
        xp_2d = pca_data[:len(xp)]
        xu_2d = pca_data[len(xp):]
        xu_pos_2d = xu_2d[:n_u_pos]
        xu_neg_2d = xu_2d[n_u_pos:]
        
        plt.figure(figsize=(10, 6))
        plt.scatter(xp_2d[:, 0], xp_2d[:, 1], c='b', label='正樣本', alpha=0.6)
        plt.scatter(xu_pos_2d[:, 0], xu_pos_2d[:, 1], c='g', label='未標記正樣本', alpha=0.3)
        plt.scatter(xu_neg_2d[:, 0], xu_neg_2d[:, 1], c='r', label='未標記負樣本', alpha=0.3)
        
        plt.legend()
        plt.title(f'{dims}D高斯分布PCA降維視圖')
        plt.grid(True)
        plt.savefig('gaussian_visualization_pca.png')
        plt.close()
    
    return xp, xu, xt_p, xt_n

if __name__ == "__main__":
    # 測試不同維度
    for dims in [2, 4, 8, 16]:
        print(f"\n🔍 測試 {dims}D:")
        print("="*60)
        xp, xu, xt_p, xt_n = generate_improved_gaussian(dims=dims)
