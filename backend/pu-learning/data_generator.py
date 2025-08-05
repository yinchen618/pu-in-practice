"""
數據生成器模組
根據不同分布類型生成合成數據，對應 MATLAB demo.m 中的 generate_data 函數
"""
import numpy as np
import time
from sklearn.datasets import make_moons, make_circles, make_classification, make_blobs
from sklearn.decomposition import PCA
from typing import Tuple, Literal


def generate_synthetic_data(
    distribution: Literal['two_moons', 'gaussian', 'spiral', 'complex'],
    dims: int = 8,  # 默認使用8維，這是性能和複雜度的最佳平衡點
    n_p: int = 50,
    n_u: int = 300,
    prior: float = 0.3,
    n_test: int = 1000,
    noise_level: float = 0.8,  # 新增：控制噪音水平
    center_dist: float = 2.0,   # 新增：控制類別中心距離
    seed: int = None  # 新增：隨機種子參數
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    生成合成數據，優化後的版本支持更多參數控制
    
    Args:
        distribution: 數據分布類型
        dims: 數據維度，默認8維（性能最佳）
        n_p: 正樣本數量
        n_u: 未標記樣本數量
        prior: 類別先驗機率
        n_test: 測試樣本數量
        noise_level: 噪音水平，控制數據的分散程度
        center_dist: 類別中心距離，控制分類難度
    
    Returns:
        xp: 正樣本 (n_p, dims)
        xu: 未標記樣本 (n_u, dims)
        xt_p: 正測試樣本 (n_test, dims)
        xt_n: 負測試樣本 (n_test, dims)
    """
    # 設置隨機種子
    if seed is not None:
        np.random.seed(seed)
        print(f"🔧 [DEBUG] 數據生成器設置隨機種子: {seed}")
    
    # 根據分布類型生成數據
    if distribution == 'gaussian':
        return _generate_gaussian(dims, n_p, n_u, prior, n_test, seed)
    elif distribution == 'two_moons':
        return _generate_two_moons(dims, n_p, n_u, prior, n_test, seed, noise_level)
    elif distribution == 'spiral':
        return _generate_spiral(dims, n_p, n_u, prior, n_test, noise_level, seed)
    elif distribution == 'complex':
        return _generate_complex(dims, n_p, n_u, prior, n_test, noise_level, center_dist, seed)
    else:
        raise ValueError(f"Unsupported distribution: {distribution}")


def _generate_two_moons(dims: int, n_p: int, n_u: int, prior: float, n_test: int, seed: int = None, noise_level: float = 0.8):
    """生成兩個月牙形數據"""
    # 使用傳入的種子或當前時間作為隨機種子
    if seed is not None:
        current_seed = seed
    else:
        current_seed = int(time.time() * 1000) % (2**32)  # 確保種子在有效範圍內
    
    if dims == 2:
        # 直接生成 2D 月牙數據
        X, y = make_moons(n_samples=n_p + n_u + 2*n_test, noise=0.1, random_state=current_seed)
    else:
        # 先生成 2D 然後擴展到高維
        X_2d, y = make_moons(n_samples=n_p + n_u + 2*n_test, noise=0.1, random_state=current_seed)
        
        # 擴展到高維（添加隨機噪音維度）
        noise = np.random.randn(len(X_2d), dims - 2) * 0.1
        X = np.column_stack([X_2d, noise])
    
    # 分離正負樣本
    pos_indices = np.where(y == 1)[0]
    neg_indices = np.where(y == 0)[0]
    
    # 正樣本
    xp = X[pos_indices[:n_p]]
    
    # 未標記樣本（按先驗比例混合）
    n_u_pos = int(n_u * prior)
    n_u_neg = n_u - n_u_pos
    
    xu_pos = X[pos_indices[n_p:n_p + n_u_pos]]
    xu_neg = X[neg_indices[:n_u_neg]]
    xu = np.vstack([xu_pos, xu_neg])
    
    # 打亂未標記樣本順序
    shuffle_idx = np.random.permutation(len(xu))
    xu = xu[shuffle_idx]
    
    # **修正：測試樣本也應該按指定的 prior 比例生成**
    n_test_pos = int(n_test * prior)
    n_test_neg = n_test - n_test_pos
    
    # 確保有足夠的樣本
    remaining_pos = len(pos_indices) - n_p - n_u_pos
    remaining_neg = len(neg_indices) - n_u_neg
    
    if remaining_pos < n_test_pos:
        print(f"Warning: Not enough positive samples for test set. Need {n_test_pos}, have {remaining_pos}")
        n_test_pos = remaining_pos
        n_test_neg = n_test - n_test_pos
    
    if remaining_neg < n_test_neg:
        print(f"Warning: Not enough negative samples for test set. Need {n_test_neg}, have {remaining_neg}")
        n_test_neg = remaining_neg
        n_test_pos = n_test - n_test_neg
    
    xt_p = X[pos_indices[n_p + n_u_pos:n_p + n_u_pos + n_test_pos]]
    xt_n = X[neg_indices[n_u_neg:n_u_neg + n_test_neg]]
    
    print(f"[DEBUG] Two moons 測試集生成:")
    print(f"   • 要求 prior: {prior}")
    print(f"   • 測試正樣本: {len(xt_p)}")
    print(f"   • 測試負樣本: {len(xt_n)}")
    print(f"   • 實際 prior: {len(xt_p) / (len(xt_p) + len(xt_n)):.3f}")
    
    return xp, xu, xt_p, xt_n


def _generate_gaussian(dims: int, n_p: int, n_u: int, prior: float, n_test: int, seed: int = None):
	"""生成高斯分布數據 (類似 MATLAB demo.m 中的實現)"""
	# 設置隨機種子以確保可重現性
	if seed is not None:
		np.random.seed(seed)
	else:
		np.random.seed(42)
	
	# 生成正樣本 (從正類分布)
	mu_p = np.zeros(dims)
	sigma_p = np.eye(dims)
	xp = np.random.multivariate_normal(mu_p, sigma_p, n_p)
	
	# 生成未標記樣本
	n_u_pos = int(n_u * prior)  # 未標記樣本中的正樣本數量
	n_u_neg = n_u - n_u_pos     # 未標記樣本中的負樣本數量
	
	# 未標記樣本中的正樣本
	mu_u_pos = np.zeros(dims)
	sigma_u_pos = np.eye(dims)
	xu_pos = np.random.multivariate_normal(mu_u_pos, sigma_u_pos, n_u_pos)
	
	# 未標記樣本中的負樣本 (從負類分布)
	mu_u_neg = np.ones(dims) * 2  # 負類中心
	sigma_u_neg = np.eye(dims)
	xu_neg = np.random.multivariate_normal(mu_u_neg, sigma_u_neg, n_u_neg)
	
	# 合併未標記樣本
	xu = np.vstack([xu_pos, xu_neg])
	
	# 生成測試樣本
	n_test_pos = int(n_test * prior)  # 測試樣本中的正樣本數量
	n_test_neg = n_test - n_test_pos  # 測試樣本中的負樣本數量
	
	# 正測試樣本
	xt_p = np.random.multivariate_normal(mu_p, sigma_p, n_test_pos)
	
	# 負測試樣本
	xt_n = np.random.multivariate_normal(mu_u_neg, sigma_u_neg, n_test_neg)
	
	return xp, xu, xt_p, xt_n


def _generate_spiral(dims: int, n_p: int, n_u: int, prior: float, n_test: int, noise_level: float = 0.8, seed: int = None):
    """生成螺旋數據"""
    def make_spiral(n_samples, noise=0.5):
        n = n_samples // 2
        
        # 第一個螺旋
        theta1 = np.sqrt(np.random.rand(n)) * 2 * np.pi
        r1 = 2 * theta1 + np.pi
        x1 = r1 * np.cos(theta1) + np.random.randn(n) * noise
        y1 = r1 * np.sin(theta1) + np.random.randn(n) * noise
        
        # 第二個螺旋
        theta2 = np.sqrt(np.random.rand(n)) * 2 * np.pi
        r2 = -2 * theta2 - np.pi
        x2 = r2 * np.cos(theta2) + np.random.randn(n) * noise
        y2 = r2 * np.sin(theta2) + np.random.randn(n) * noise
        
        X = np.vstack([np.column_stack([x1, y1]), np.column_stack([x2, y2])])
        y = np.hstack([np.ones(n), np.zeros(n)])
        
        return X, y
    
    if dims == 2:
        X, y = make_spiral(n_p + n_u + 2*n_test)
    else:
        # 先生成 2D 然後擴展到高維
        X_2d, y = make_spiral(n_p + n_u + 2*n_test)
        noise = np.random.randn(len(X_2d), dims - 2) * 0.5
        X = np.column_stack([X_2d, noise])
    
    # 分離並構建數據集（類似 two_moons 的邏輯）
    pos_indices = np.where(y == 1)[0]
    neg_indices = np.where(y == 0)[0]
    
    xp = X[pos_indices[:n_p]]
    
    n_u_pos = int(n_u * prior)
    n_u_neg = n_u - n_u_pos
    
    xu_pos = X[pos_indices[n_p:n_p + n_u_pos]]
    xu_neg = X[neg_indices[:n_u_neg]]
    xu = np.vstack([xu_pos, xu_neg])
    
    shuffle_idx = np.random.permutation(len(xu))
    xu = xu[shuffle_idx]
    
    xt_p = X[pos_indices[n_p + n_u_pos:n_p + n_u_pos + n_test]]
    xt_n = X[neg_indices[n_u_neg:n_u_neg + n_test]]
    
    return xp, xu, xt_p, xt_n


def _generate_complex(dims: int, n_p: int, n_u: int, prior: float, n_test: int, noise_level: float = 0.8, center_dist: float = 2.0, seed: int = None):
    """生成複雜數據 (使用 sklearn 的 make_classification)"""
    total_samples = n_p + n_u + 2*n_test
    
    # 使用當前時間作為隨機種子
    current_seed = int(time.time() * 1000) % (2**32)  # 確保種子在有效範圍內
    
    X, y = make_classification(
        n_samples=total_samples,
        n_features=dims,
        n_informative=min(dims, 10),
        n_redundant=0,
        n_clusters_per_class=2,
        flip_y=0.01,
        class_sep=0.8,
        random_state=current_seed
    )
    
    # 分離並構建數據集
    pos_indices = np.where(y == 1)[0]
    neg_indices = np.where(y == 0)[0]
    
    xp = X[pos_indices[:n_p]]
    
    n_u_pos = int(n_u * prior)
    n_u_neg = n_u - n_u_pos
    
    xu_pos = X[pos_indices[n_p:n_p + n_u_pos]]
    xu_neg = X[neg_indices[:n_u_neg]]
    xu = np.vstack([xu_pos, xu_neg])
    
    shuffle_idx = np.random.permutation(len(xu))
    xu = xu[shuffle_idx]
    
    xt_p = X[pos_indices[n_p + n_u_pos:n_p + n_u_pos + n_test]]
    xt_n = X[neg_indices[n_u_neg:n_u_neg + n_test]]
    
    return xp, xu, xt_p, xt_n


def reduce_to_2d_for_visualization(X: np.ndarray) -> np.ndarray:
    """
    將高維數據降維到 2D 用於可視化
    
    Args:
        X: 輸入數據 (n_samples, n_features)
    
    Returns:
        降維後的 2D 數據 (n_samples, 2)
    """
    if X.shape[1] == 2:
        return X
    
    pca = PCA(n_components=2)
    return pca.fit_transform(X)
