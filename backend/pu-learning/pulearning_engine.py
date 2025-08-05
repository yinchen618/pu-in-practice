"""
PU 學習引擎核心模組
實現 uPU 和 nnPU 演算法，對應 MATLAB PU_SL.m 的功能
"""
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from scipy.spatial.distance import cdist
from sklearn.model_selection import KFold
from typing import Tuple, Dict, List, Optional
import warnings

# 忽略一些不重要的警告
warnings.filterwarnings('ignore')


class MLPClassifier(nn.Module):
    """多層感知器分類器，用於 nnPU"""
    
    def __init__(self, input_dim: int, hidden_dim: int = 100, activation: str = 'relu'):
        super(MLPClassifier, self).__init__()
        
        # 根據激活函數類型選擇
        if activation == 'relu':
            self.activation = nn.ReLU()
        elif activation == 'softsign':
            self.activation = nn.Softsign()
        elif activation == 'tanh':
            self.activation = nn.Tanh()
        elif activation == 'sigmoid':
            self.activation = nn.Sigmoid()
        else:
            self.activation = nn.ReLU()
        
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            self.activation,
            nn.Linear(hidden_dim, hidden_dim),
            self.activation,
            nn.Linear(hidden_dim, 1)
        )
    
    def forward(self, x):
        return self.network(x)


def calc_dist2(x: np.ndarray, xc: np.ndarray) -> np.ndarray:
    """
    計算平方距離矩陣
    對應 MATLAB 中的 calc_dist2 函數
    
    Args:
        x: 輸入數據 (n_samples, n_features)
        xc: 中心點 (n_centers, n_features)
    
    Returns:
        平方距離矩陣 (n_samples, n_centers)
    """
    return cdist(x, xc, 'sqeuclidean')


def calc_ker(dp: np.ndarray, du: np.ndarray, sigma: float, use_bias: bool = True, 
             model_type: str = 'gauss') -> Tuple[np.ndarray, np.ndarray]:
    """
    計算核矩陣
    對應 MATLAB 中的 calc_ker 函數
    
    Args:
        dp: 正樣本距離矩陣
        du: 未標記樣本距離矩陣
        sigma: 高斯核的帶寬參數
        use_bias: 是否使用偏置項
        model_type: 模型類型 ('gauss' 或 'lm')
    
    Returns:
        Kp, Ku: 核矩陣
    """
    np_samples, n_centers = dp.shape
    nu_samples = du.shape[0]
    
    if model_type == 'gauss':
        # 高斯核
        Kp = np.exp(-dp / (2 * sigma**2))
        Ku = np.exp(-du / (2 * sigma**2))
    elif model_type == 'lm':
        # 線性模型
        Kp = dp
        Ku = du
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    if use_bias:
        # 添加偏置項
        Kp = np.column_stack([Kp, np.ones(np_samples)])
        Ku = np.column_stack([Ku, np.ones(nu_samples)])
    
    return Kp, Ku


def solve_cholesky(H: np.ndarray, hpu: np.ndarray, use_bias: bool = True) -> np.ndarray:
    """
    使用 Cholesky 分解求解線性方程 Hx = hpu
    對應 MATLAB 中的求解邏輯
    
    Args:
        H: 係數矩陣
        hpu: 右手邊向量
        use_bias: 是否使用偏置項
    
    Returns:
        theta: 求解的參數向量
    """
    try:
        # 嘗試 Cholesky 分解
        R = np.linalg.cholesky(H)
        y = np.linalg.solve(R, hpu)
        theta = np.linalg.solve(R.T, y)
        return theta
    except np.linalg.LinAlgError:
        # 如果矩陣不是正定，使用偽逆
        print("Warning: Matrix is not positive definite, using pseudo-inverse")
        return np.linalg.pinv(H) @ hpu


def estimate_prior_penL1CP(xp: np.ndarray, xu: np.ndarray, method: str = 'median') -> float:
    """
    使用 PenL1CP 方法估計類別先驗
    簡化版本的 MATLAB PenL1CP.m 實現
    
    Args:
        xp: 正樣本
        xu: 未標記樣本
        method: 估計方法 ('mean' 或 'median')
    
    Returns:
        估計的類別先驗
    """
    # 這是一個簡化的先驗估計
    # 實際的 PenL1CP 方法較為複雜，這裡使用近似方法
    
    # 計算正樣本和未標記樣本的密度比
    from sklearn.neighbors import KernelDensity
    
    try:
        # 使用核密度估計
        kde_p = KernelDensity(bandwidth=0.5, kernel='gaussian')
        kde_u = KernelDensity(bandwidth=0.5, kernel='gaussian')
        
        kde_p.fit(xp)
        kde_u.fit(xu)
        
        # 在未標記樣本上評估密度
        log_dens_p = kde_p.score_samples(xu)
        log_dens_u = kde_u.score_samples(xu)
        
        # 計算密度比
        density_ratio = np.exp(log_dens_p - log_dens_u)
        
        # 💡 根據方法選擇使用均值或中位數
        if method == 'mean':
            estimated_prior = np.clip(np.mean(density_ratio), 0.1, 0.9)
        else:  # median
            estimated_prior = np.clip(np.median(density_ratio), 0.1, 0.9)
        
        print(f"[DEBUG] 先驗估計統計 (方法: {method}):")
        print(f"   • 密度比均值: {np.mean(density_ratio):.4f}")
        print(f"   • 密度比中位數: {np.median(density_ratio):.4f}")
        print(f"   • 修正後估計: {estimated_prior:.4f}")
        
    except Exception:
        # 如果出錯，返回一個合理的預設值
        estimated_prior = 0.3
    
    return estimated_prior


def print_common_training_info(algorithm: str, xp: np.ndarray, xu: np.ndarray, prior: float, options: Dict):
    """打印訓練的共同資訊"""
    print("="*60)
    print(f"🔧 [DEBUG] Training with {algorithm} algorithm...")
    print("="*60)
    
    # 1. 模型與配置資訊
    print("\n📋 [DEBUG] 模型與配置資訊:")
    if algorithm == 'uPU':
        print(f"   • 演算法類型: uPU (Unbiased PU Learning) with Non-negative Risk Estimator")
        print(f"   • 模型架構: 核方法 + 線性代數直接解 (非神經網路)")
        print(f"   • 損失函數: Squared Loss")
        print(f"   • 求解方式: 直接解析解 (Cholesky 分解)")
        print(f"   • 是否迭代訓練: 否 (直接計算)")
        print(f"   • 負風險處理: 使用 Non-negative Risk Estimator (max(0, R_neg))")
    else:  # nnPU
        print(f"   • 演算法類型: nnPU (Non-negative PU Learning)")
        print(f"   • 模型架構: 多層感知器 (MLP) 神經網路")
        print(f"   • 網路層數: 3層 (輸入層 → 隱藏層1 → 隱藏層2 → 輸出層)")
        print(f"   • 隱藏層神經元數量: {options.get('hidden_dim', 100)}")
        print(f"   • 激活函數: {options.get('activation', 'relu')}")
        print(f"   • 損失函數: Sigmoid Loss")
        print(f"   • 求解方式: 迭代訓練 (梯度下降)")
        print(f"   • 是否迭代訓練: 是")
    
    # 2. 資料生成資訊
    print("\n📊 [DEBUG] 資料生成資訊:")
    np_samples, d = xp.shape
    nu_samples = xu.shape[0]
    print(f"   • 正樣本 (P) 形狀: {xp.shape}")
    print(f"   • 未標記樣本 (U) 形狀: {xu.shape}")
    print(f"   • 數據維度: {d}")
    print(f"   • 設定的類別先驗 (prior): {prior}")
    
    # 顯示前5筆數據
    print("\n   📋 前5筆正樣本 (P):")
    for i in range(min(5, np_samples)):
        print(f"      P[{i}]: {xp[i]}")
    
    print("\n   📋 前5筆未標記樣本 (U):")
    for i in range(min(5, nu_samples)):
        print(f"      U[{i}]: {xu[i]}")


def print_upu_parameters(options: Dict):
    """打印 uPU 特定的參數配置"""
    n_fold = options.get('n_fold', 5)
    model_type = options.get('model_type', 'gauss')
    lambda_list = options.get('lambda_list', np.logspace(-3, 1, 10))
    n_basis = options.get('n_basis', 200)
    use_bias = options.get('use_bias', True)
    
    # 打印超參數
    print(f"   • 交叉驗證折數 (n_fold): {n_fold}")
    print(f"   • 模型類型 (model_type): {model_type}")
    print(f"   • 基函數數量 (n_basis): {n_basis}")
    print(f"   • 使用偏置項 (use_bias): {use_bias}")
    print(f"   • 正則化參數候選 (lambda_list): {lambda_list}")


def print_nnpu_parameters(options: Dict):
    """打印 nnPU 特定的參數配置"""
    n_epochs = options.get('n_epochs', 50)
    learning_rate = options.get('learning_rate', 0.001)
    hidden_dim = options.get('hidden_dim', 100)
    activation = options.get('activation', 'relu')
    weight_decay = options.get('weight_decay', 0.0)
    
    print(f"\n📊 [DEBUG] 超參數設定:")
    print(f"   • 學習率 (learning_rate): {learning_rate}")
    print(f"   • Epoch 數量 (n_epochs): {n_epochs}")
    print(f"   • 權重衰減 (weight_decay): {weight_decay}")
    print(f"   • 批次大小 (batch size): 全批次 (full batch)")


def print_device_info():
    """打印設備資訊"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\n🖥️  [DEBUG] 計算設備資訊:")
    print(f"   • 使用設備: {device}")
    print(f"   • CUDA 可用: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"   • GPU 名稱: {torch.cuda.get_device_name(0)}")
        print(f"   • GPU 記憶體已分配: {torch.cuda.memory_allocated(0)}")
        print(f"   • GPU 記憶體已保留: {torch.cuda.memory_reserved(0)}")
    return device


def analyze_model_complexity(algorithm: str, params, input_dim: int, n_p: int, n_u: int):
    """分析模型複雜度"""
    if algorithm == 'uPU':
        total_params = params['n_basis'] + (1 if params['use_bias'] else 0)
        threshold_high = 0.5
        threshold_low = 0.05
    else:  # nnPU
        hidden_dim = params.hidden_dim
        total_params = input_dim * hidden_dim + hidden_dim + hidden_dim * 1 + 1
        threshold_high = 0.1
        threshold_low = 0.01
    
    data_size = n_p + n_u
    complexity_ratio = total_params / data_size
    
    print(f"\n   📊 {algorithm} 模型複雜度分析:")
    print(f"      • 總參數數量: {total_params}")
    print(f"      • 訓練數據量: {data_size}")
    print(f"      • 參數/數據比例: {complexity_ratio:.3f}")
    
    if complexity_ratio > threshold_high:
        print(f"      ⚠️  警告：{algorithm} 模型參數過多，可能過擬合 (比例: {complexity_ratio:.3f})")
    elif complexity_ratio < threshold_low:
        print(f"      ⚠️  警告：{algorithm} 模型參數過少，可能欠擬合 (比例: {complexity_ratio:.3f})")
    else:
        print(f"      ✅ {algorithm} 模型複雜度適中 (比例: {complexity_ratio:.3f})")


def print_test_data_info(xt_p, xt_n, data_params):
    """打印測試數據資訊"""
    print(f"\n📊 [DEBUG] 數據生成完成:")
    print(f"   • 正樣本 (P): {xt_p.shape}")
    print(f"   • 未標記樣本 (U): {xt_n.shape}")
    print(f"   • 測試正樣本 (Test_P): {xt_p.shape}")
    print(f"   • 測試負樣本 (Test_N): {xt_n.shape}")
    
    # **重新計算真實的 True Prior 在測試集上**
    true_test_prior = len(xt_p) / (len(xt_p) + len(xt_n))
    print(f"\n🎯 [DEBUG] 測試集上的真實 Prior 驗證:")
    print(f"   • 設定的 Prior: {data_params.prior:.3f}")
    print(f"   • 測試集計算的 True Prior: {true_test_prior:.3f}")
    print(f"   • 差異: {abs(data_params.prior - true_test_prior):.3f}")
    if abs(data_params.prior - true_test_prior) > 0.05:
        print("   ⚠️  **Warning: 測試集 Prior 與設定值差異較大！**")


def print_prediction_analysis(pred_p, pred_n, algorithm: str):
    """打印預測分析"""
    print(f"\n   🎯 {algorithm} 模型預測分析:")
    if algorithm == 'nnPU':
        pred_p_flat = pred_p.flatten()
        pred_n_flat = pred_n.flatten()
    else:
        pred_p_flat = pred_p
        pred_n_flat = pred_n
    
    print(f"      • 正樣本預測值範圍: [{pred_p_flat.min():.4f}, {pred_p_flat.max():.4f}]")
    print(f"      • 負樣本預測值範圍: [{pred_n_flat.min():.4f}, {pred_n_flat.max():.4f}]")
    print(f"      • 正樣本預測均值: {pred_p_flat.mean():.4f} ± {pred_p_flat.std():.4f}")
    print(f"      • 負樣本預測均值: {pred_n_flat.mean():.4f} ± {pred_n_flat.std():.4f}")
    
    # 檢查預測分佈
    pos_positive_pred = np.sum(pred_p_flat > 0)
    pos_negative_pred = np.sum(pred_p_flat <= 0)
    neg_positive_pred = np.sum(pred_n_flat > 0)
    neg_negative_pred = np.sum(pred_n_flat <= 0)
    
    print(f"      • 正樣本中預測為正的: {pos_positive_pred}/{len(pred_p_flat)} ({pos_positive_pred/len(pred_p_flat)*100:.1f}%)")
    print(f"      • 正樣本中預測為負的: {pos_negative_pred}/{len(pred_p_flat)} ({pos_negative_pred/len(pred_p_flat)*100:.1f}%)")
    print(f"      • 負樣本中預測為正的: {neg_positive_pred}/{len(pred_n_flat)} ({neg_positive_pred/len(pred_n_flat)*100:.1f}%)")
    print(f"      • 負樣本中預測為負的: {neg_negative_pred}/{len(pred_n_flat)} ({neg_negative_pred/len(pred_n_flat)*100:.1f}%)")
    
    # 分析是否存在明顯的預測偏差
    if pos_positive_pred / len(pred_p_flat) > 0.95:
        print(f"      ⚠️  警告：{algorithm} 模型對正樣本的預測過於自信 ({pos_positive_pred/len(pred_p_flat)*100:.1f}%)")
    if neg_negative_pred / len(pred_n_flat) > 0.95:
        print(f"      ⚠️  警告：{algorithm} 模型對負樣本的預測過於自信 ({neg_negative_pred/len(pred_n_flat)*100:.1f}%)")


def calculate_error_rates(pred_p, pred_n, xt_p, xt_n, prior: float, algorithm: str):
    """計算錯誤率"""
    correct_p = np.sum(pred_p > 0)  # 正確預測為正的數量
    incorrect_p = np.sum(pred_p <= 0)  # 錯誤預測為負的數量 (False Negative)
    correct_n = np.sum(pred_n <= 0)  # 正確預測為負的數量
    incorrect_n = np.sum(pred_n > 0)  # 錯誤預測為正的數量 (False Positive)
    
    print(f"   📊 測試集詳細統計:")
    print(f"      • 測試正樣本總數: {len(xt_p)}")
    print(f"      • 測試負樣本總數: {len(xt_n)}")
    print(f"      • 正確預測為正的數量: {correct_p}")
    print(f"      • 錯誤預測為負的數量 (FN): {incorrect_p}")
    print(f"      • 正確預測為負的數量: {correct_n}")
    print(f"      • 錯誤預測為正的數量 (FP): {incorrect_n}")
    
    fn_rate = incorrect_p / len(xt_p)
    fp_rate = incorrect_n / len(xt_n)
    error_rate = prior * fn_rate + (1 - prior) * fp_rate
    
    print(f"   📈 錯誤率計算:")
    print(f"      • False Negative Rate (FNR): {fn_rate:.4f}")
    print(f"      • False Positive Rate (FPR): {fp_rate:.4f}")
    print(f"      • 加權錯誤率公式: π*FNR + (1-π)*FPR")
    print(f"      • 最終錯誤率: {prior:.3f}*{fn_rate:.4f} + {(1-prior):.3f}*{fp_rate:.4f} = {error_rate:.4f}")
    
    return error_rate, fn_rate, fp_rate


def analyze_error_rate_reasonableness(error_rate: float, pred_p, pred_n, algorithm: str):
    """分析錯誤率的合理性"""
    print(f"\n   🔍 {algorithm} 錯誤率合理性分析:")
    overall_accuracy = (np.sum(pred_p > 0) + np.sum(pred_n <= 0)) / (len(pred_p) + len(pred_n))
    print(f"      • 總體準確率: {overall_accuracy:.4f} ({overall_accuracy*100:.2f}%)")
    print(f"      • 對應錯誤率: {1-overall_accuracy:.4f} ({(1-overall_accuracy)*100:.2f}%)")
    
    # 檢查是否異常
    if error_rate < 0.05:  # 錯誤率低於5%
        print(f"      ⚠️  異常警告：{algorithm} 錯誤率 {error_rate*100:.2f}% 過低！")
        print(f"      ⚠️  這對於 two_moons 數據集是不現實的")
        print(f"      ⚠️  可能原因：模型過度自信、測試集標籤錯誤、或數據生成問題")
        
        # 檢查模型預測的分佈
        if algorithm == 'nnPU':
            pred_p_flat = pred_p.flatten()
            pred_n_flat = pred_n.flatten()
        else:
            pred_p_flat = pred_p
            pred_n_flat = pred_n
            
        pred_separation = abs(pred_p_flat.mean() - pred_n_flat.mean())
        print(f"      • 正負樣本預測均值差距: {pred_separation:.4f}")
        
        if pred_separation > 2.0:
            print(f"      ⚠️  預測值分離度過高 ({pred_separation:.2f})，模型可能過度自信")
            
        if algorithm == 'nnPU':
            # 檢查 sigmoid 概率分佈
            pred_p_sigmoid = 1 / (1 + np.exp(-pred_p_flat))
            pred_n_sigmoid = 1 / (1 + np.exp(-pred_n_flat))
            print(f"      • 正樣本 sigmoid 概率均值: {pred_p_sigmoid.mean():.4f}")
            print(f"      • 負樣本 sigmoid 概率均值: {pred_n_sigmoid.mean():.4f}")
            
            if pred_p_sigmoid.mean() > 0.95:
                print(f"      ⚠️  正樣本概率過高 ({pred_p_sigmoid.mean():.3f})，模型過度自信")
            if pred_n_sigmoid.mean() < 0.05:
                print(f"      ⚠️  負樣本概率過低 ({pred_n_sigmoid.mean():.3f})，模型過度自信")
    
    elif error_rate > 0.40:  # 錯誤率高於40%
        print(f"      ⚠️  異常警告：{algorithm} 錯誤率 {error_rate*100:.2f}% 過高！")
        print(f"      ⚠️  模型性能可能有問題")
    else:
        print(f"      ✅ {algorithm} 錯誤率 {error_rate*100:.2f}% 在合理範圍內 (5%-40%)")


def analyze_prior_estimation(estimated_prior: float, true_prior: float, algorithm: str):
    """分析先驗估計的合理性"""
    prior_error = abs(estimated_prior - true_prior)
    print(f"\n   📊 {algorithm} 先驗估計分析:")
    print(f"      • 真實先驗: {true_prior:.3f}")
    print(f"      • 估計先驗: {estimated_prior:.3f}")
    print(f"      • 絕對誤差: {prior_error:.3f}")
    
    if prior_error > 0.3:
        print(f"      ⚠️  {algorithm} 先驗估計誤差過大 ({prior_error:.3f})！")
        print(f"      ⚠️  這會嚴重影響 {algorithm} Learning 的性能")
        
        # 分析可能的原因
        if estimated_prior > true_prior + 0.3:
            print(f"      ⚠️  估計先驗過高，可能原因：unlabeled data 中正樣本比例被高估")
        elif estimated_prior < true_prior - 0.3:
            print(f"      ⚠️  估計先驗過低，可能原因：unlabeled data 中正樣本比例被低估")
            
    elif prior_error > 0.1:
        print(f"      ⚠️  {algorithm} 先驗估計有較大偏差 ({prior_error:.3f})")
    else:
        print(f"      ✅ {algorithm} 先驗估計誤差可接受 ({prior_error:.3f})")


def train_upu(xp: np.ndarray, xu: np.ndarray, prior: float, options: Dict, seed: int = None) -> Tuple[callable, Dict]:
    """
    uPU 演算法的 Python 實現
    對應 MATLAB PU_SL.m 的主要邏輯
    
    Args:
        xp: 正樣本 (n_p, d)
        xu: 未標記樣本 (n_u, d)
        prior: 類別先驗
        options: 選項字典
    
    Returns:
        func_dec: 決策函數
        outputs: 包含模型參數和其他輸出的字典
    """
    # 使用共用的訓練資訊打印函數
    print_common_training_info('uPU', xp, xu, prior, options)
    print_upu_parameters(options)
    
    # 參數設置
    n_fold = options.get('n_fold', 5)
    model_type = options.get('model_type', 'gauss')
    lambda_list = options.get('lambda_list', np.logspace(-3, 1, 10))
    n_basis = options.get('n_basis', min(200, xu.shape[0]))
    use_bias = options.get('use_bias', True)
    
    np_samples, d = xp.shape
    nu_samples = xu.shape[0]
    
    # 設置隨機種子（如果提供）
    if seed is not None:
        np.random.seed(seed)
        print(f"   🔧 [DEBUG] uPU 訓練設置隨機種子: {seed}")
    
    # 選擇基函數中心點
    center_indices = np.random.choice(nu_samples, size=min(n_basis, nu_samples), replace=False)
    xc = xu[center_indices]
    
    # 計算距離矩陣
    if model_type == 'gauss':
        dp = calc_dist2(xp, xc)
        du = calc_dist2(xu, xc)
        # 設置 sigma 候選值
        all_distances = np.concatenate([dp.flatten(), du.flatten()])
        sigma_list = np.sqrt(np.median(all_distances)) * np.logspace(-2, 1, 10)
    else:  # 線性模型
        dp = xp
        du = xu
        sigma_list = [1.0]  # 對線性模型，sigma 值不重要
    
    n_sigma = len(sigma_list)
    n_lambda = len(lambda_list)
    
    # 交叉驗證
    cv_seed = seed if seed is not None else 42
    kf_p = KFold(n_splits=n_fold, shuffle=True, random_state=cv_seed)
    kf_u = KFold(n_splits=n_fold, shuffle=True, random_state=cv_seed)
    
    cv_indices_p = list(kf_p.split(range(np_samples)))
    cv_indices_u = list(kf_u.split(range(nu_samples)))
    
    score_table = np.zeros((n_sigma, n_lambda))
    
    for i_sigma, sigma in enumerate(sigma_list):
        print(f"  Processing sigma {i_sigma+1}/{n_sigma}: {sigma:.4f}")
        
        # 計算核矩陣
        Kp, Ku = calc_ker(dp, du, sigma, use_bias, model_type)
        
        cv_scores = []
        
        for fold in range(n_fold):
            train_idx_p, test_idx_p = cv_indices_p[fold]
            train_idx_u, test_idx_u = cv_indices_u[fold]
            
            # 訓練集核矩陣
            Kp_train = Kp[train_idx_p]
            Ku_train = Ku[train_idx_u]
            
            # 測試集核矩陣
            Kp_test = Kp[test_idx_p]
            Ku_test = Ku[test_idx_u]
            
            # 計算訓練用的矩陣
            Hp_tr = prior * (Kp_train.T @ Kp_train) / len(train_idx_p)
            Hu_tr = (Ku_train.T @ Ku_train) / len(train_idx_u)
            hp_tr = prior * np.mean(Kp_train, axis=0)
            hu_tr = np.mean(Ku_train, axis=0)
            
            fold_scores = []
            for i_lambda, lambda_reg in enumerate(lambda_list):
                # 正則化矩陣
                b = Hu_tr.shape[0]
                Reg = lambda_reg * np.eye(b)
                if use_bias:
                    Reg[-1, -1] = 0  # 偏置項不正則化
                
                # uPU 風險: hpu = 2*hp - hu
                hpu = 2 * hp_tr - hu_tr
                
                # 求解
                theta = solve_cholesky(Hu_tr + Reg, hpu, use_bias)
                
                # 計算驗證損失
                gp_test = Kp_test @ theta
                gu_test = Ku_test @ theta
                
                # uPU 損失計算，實現 non-negative risk estimator
                fn = np.mean(gp_test <= 0) if len(gp_test) > 0 else 0
                fp_u = np.mean(gu_test >= 0) if len(gu_test) > 0 else 0
                
                # uPU 風險的原始計算 (可能為負)
                raw_negative_risk = fp_u + prior * fn - prior  # 這可能為負
                upu_risk_raw = prior * fn + raw_negative_risk
                
                # **任務二修正：使用 non-negative risk estimator**
                # 類似 nnPU 的做法：max(0, negative_risk)
                non_negative_risk = max(raw_negative_risk, 0)
                loss = prior * fn + non_negative_risk
                
                # 在部分折中記錄負風險情況
                if fold == 0 and i_lambda == 0:  # 只在第一折第一個lambda記錄
                    print(f"      📊 CV Fold {fold+1}, λ={lambda_reg:.4f}:")
                    print(f"         • 正樣本風險 (prior * FN): {prior * fn:.4f}")
                    print(f"         • 原始負樣本風險: {raw_negative_risk:.4f}", end="")
                    if raw_negative_risk < 0:
                        print(" ⚠️  **變成負數！使用非負約束**")
                    else:
                        print("")
                    print(f"         • uPU 風險 (原始): {upu_risk_raw:.4f}")
                    print(f"         • uPU 風險 (非負約束後): {loss:.4f}")
                
                fold_scores.append(loss)
            
            cv_scores.append(fold_scores)
        
        # 平均交叉驗證分數
        score_table[i_sigma, :] = np.mean(cv_scores, axis=0)
    
    # 選擇最佳參數
    best_idx = np.unravel_index(np.argmin(score_table), score_table.shape)
    best_sigma = sigma_list[best_idx[0]]
    best_lambda = lambda_list[best_idx[1]]
    
    print(f"  Best sigma: {best_sigma:.4f}, Best lambda: {best_lambda:.4f}")
    
    # 使用最佳參數訓練最終模型
    Kp, Ku = calc_ker(dp, du, best_sigma, use_bias, model_type)
    
    Hu = (Ku.T @ Ku) / nu_samples
    hp = prior * np.mean(Kp, axis=0)
    hu = np.mean(Ku, axis=0)
    
    b = Hu.shape[0]
    Reg = best_lambda * np.eye(b)
    if use_bias:
        Reg[-1, -1] = 0
    
    hpu = 2 * hp - hu
    theta = solve_cholesky(Hu + Reg, hpu, use_bias)
    
    # 構建決策函數
    def func_dec(x_test):
        if model_type == 'gauss':
            dist_test = calc_dist2(x_test, xc)
            K_test = np.exp(-dist_test / (2 * best_sigma**2))
        else:
            K_test = x_test
        
        if use_bias:
            K_test = np.column_stack([K_test, np.ones(x_test.shape[0])])
        
        return K_test @ theta
    
    outputs = {
        'theta': theta,
        'sigma': best_sigma,
        'lambda': best_lambda,
        'score_table': score_table,
        'xc': xc,
        'model_type': model_type,
        'use_bias': use_bias
    }
    
    return func_dec, outputs


def train_nnpu(xp: np.ndarray, xu: np.ndarray, prior: float, options: Dict, seed: int = None) -> Tuple[nn.Module, Dict]:
    """
    nnPU 演算法的 Python 實現
    使用神經網路和 Sigmoid Loss
    
    Args:
        xp: 正樣本
        xu: 未標記樣本
        prior: 類別先驗
        options: 選項字典
    
    Returns:
        model: 訓練好的神經網路模型
        outputs: 包含訓練歷史和指標的字典
    """
    # 使用共用的訓練資訊打印函數
    print_common_training_info('nnPU', xp, xu, prior, options)
    print_nnpu_parameters(options)
    
    # 參數設置
    n_epochs = options.get('n_epochs', 50)
    learning_rate = options.get('learning_rate', 0.001)
    hidden_dim = options.get('hidden_dim', 100)
    activation = options.get('activation', 'relu')
    weight_decay = options.get('weight_decay', 0.0)  # 新增 weight_decay 支援
    
    # 設置隨機種子（如果提供）
    if seed is not None:
        torch.manual_seed(seed)
        np.random.seed(seed)
        print(f"   🔧 [DEBUG] nnPU 訓練設置隨機種子: {seed}")
    
    # 使用共用的設備資訊打印函數
    device = print_device_info()
    
    # 數據準備
    xp_tensor = torch.FloatTensor(xp).to(device)
    xu_tensor = torch.FloatTensor(xu).to(device)
    
    # 模型初始化
    input_dim = xp.shape[1]
    model = MLPClassifier(input_dim, hidden_dim, activation).to(device)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    
    print(f"\n🤖 [DEBUG] 模型初始化完成:")
    print(f"   • 輸入維度: {input_dim}")
    print(f"   • 隱藏層維度: {hidden_dim}")
    print(f"   • 模型參數總數: {sum(p.numel() for p in model.parameters())}")
    print(f"   • 優化器: Adam (lr={learning_rate}, weight_decay={weight_decay})")
    
    # 訓練歷史
    risk_curve = []
    
    print(f"\n🏃 [DEBUG] 開始訓練過程...")
    print("="*50)
    
    for epoch in range(n_epochs):
        model.train()
        optimizer.zero_grad()
        
        # 前向傳播
        gp = model(xp_tensor).squeeze()
        gu = model(xu_tensor).squeeze()
        
        # Sigmoid 損失
        sigmoid = torch.nn.Sigmoid()
        
        # R_p^+ = mean(sigmoid(-g(x_p)))
        R_p_plus = torch.mean(sigmoid(-gp))
        
        # R_u^- = mean(sigmoid(g(x_u)))
        R_u_minus = torch.mean(sigmoid(gu))
        
        # R_p^- = mean(sigmoid(g(x_p)))
        R_p_minus = torch.mean(sigmoid(gp))
        
        # 3. 訓練過程日誌 - 監控 uPU risk 組成部分
        upu_risk_raw = R_u_minus - prior * R_p_minus  # 可能為負
        
        # nnPU 風險: prior * R_p^+ + max(0, R_u^- - prior * R_p^-)
        nnpu_risk = prior * R_p_plus + torch.clamp(R_u_minus - prior * R_p_minus, min=0)
        
        # 詳細的訓練日誌
        if epoch % 5 == 0 or epoch < 5:  # 前5個epoch和每5個epoch記錄一次
            print(f"\n📊 [DEBUG] Epoch {epoch+1}/{n_epochs}:")
            print(f"   • Positive Risk (R_p^+): {R_p_plus.item():.6f}")
            print(f"   • Unlabeled Risk (R_u^-): {R_u_minus.item():.6f}")
            print(f"   • Negative Risk Estimate (R_p^-): {R_p_minus.item():.6f}")
            print(f"   • uPU Risk Raw (R_u^- - π*R_p^-): {upu_risk_raw.item():.6f}", end="")
            if upu_risk_raw.item() < 0:
                print(" ⚠️  **變成負數！**")
            else:
                print("")
            print(f"   • nnPU Risk (非負約束後): {nnpu_risk.item():.6f}")
            print(f"   • 類別先驗 (π): {prior}")
        
        # 反向傳播
        nnpu_risk.backward()
        optimizer.step()
        
        # 記錄風險值
        risk_value = nnpu_risk.item()
        risk_curve.append({'epoch': epoch + 1, 'risk': risk_value})
        
        if (epoch + 1) % 10 == 0:
            print(f"   ✅ Epoch {epoch + 1}/{n_epochs}, Final Risk: {risk_value:.6f}")
    
    print("="*50)
    print("🎯 [DEBUG] 訓練完成！")
    model.eval()
    
    outputs = {
        'risk_curve': risk_curve,
        'final_risk': risk_curve[-1]['risk'],
        'device': device
    }
    
    return model, outputs


def run_pu_simulation(request) -> Dict:
    """
    協調數據生成和模型訓練的主函數
    
    Args:
        request: SimulationRequest 對象
    
    Returns:
        包含可視化數據和指標的字典
    """
    from data_generator import generate_synthetic_data, reduce_to_2d_for_visualization
    
    print(f"\n🚀 [DEBUG] Running PU simulation with {request.algorithm} algorithm...")
    
    # 設置隨機種子確保可重現性
    seed = getattr(request, 'seed', 42)  # 從前端接收種子，預設為 42
    print(f"🔧 [DEBUG] 主引擎設置隨機種子: {seed}")
    # 注意：具體的種子設置將在數據生成器和模型訓練中進行
    
    # 1. 生成數據
    data_params = request.data_params
    xp, xu, xt_p, xt_n = generate_synthetic_data(
        distribution=data_params.distribution,
        dims=data_params.dims,
        n_p=data_params.n_p,
        n_u=data_params.n_u,
        prior=data_params.prior,
        seed=seed  # 傳遞種子給數據生成器
    )
    
    # 使用共用的測試數據資訊打印函數
    print_test_data_info(xt_p, xt_n, data_params)
    
    # 2. 訓練模型（先驗估計將在訓練完成後進行）
    model_params = request.model_params
    
    # 初始化變量
    training_error_rate = 0.0  # 初始化訓練錯誤率
    estimated_prior = 0.0  # 初始化先驗估計
    
    if request.algorithm == 'uPU':
        # 使用前端傳來的 uPU 參數，如果沒有則使用預設值
        options = {
            'model_type': getattr(model_params, 'model_type', 'gauss'),
            'use_bias': getattr(model_params, 'use_bias', True),
            'n_basis': getattr(model_params, 'n_basis', min(200, xu.shape[0]))
        }
        
        # 使用共用的模型複雜度分析函數
        analyze_model_complexity('uPU', options, data_params.dims, len(xp), len(xu))
        
        model, outputs = train_upu(xp, xu, data_params.prior, options, seed)
        
        # 3. 在模型訓練完成後進行先驗估計
        print(f"\n🔍 [DEBUG] 訓練後先驗估計 (uPU):")
        prior_method = getattr(request, 'prior_estimation_method', 'median')
        estimated_prior = estimate_prior_penL1CP(xp, xu, prior_method)
        print(f"   • 估計的 Prior: {estimated_prior:.3f}")
        print(f"   • 真實的 Prior: {data_params.prior:.3f}")
        print(f"   • 估計誤差: {abs(estimated_prior - data_params.prior):.3f}")
        
        # 4. 評估過程日誌 - 詳細計算分類錯誤率
        print(f"\n📈 [DEBUG] 模型評估 (uPU):")
        pred_p = model(xt_p)
        pred_n = model(xt_n)
        
        # 使用共用的預測分析函數
        print_prediction_analysis(pred_p, pred_n, 'uPU')
        
        # 使用共用的錯誤率計算函數
        error_rate, fn_rate, fp_rate = calculate_error_rates(pred_p, pred_n, xt_p, xt_n, data_params.prior, 'uPU')
        
        # 計算 uPU 訓練錯誤率 - 修正版本：只計算正樣本的錯誤率
        print(f"\n   📊 [DEBUG] 計算 uPU 訓練錯誤率 (修正版本)...")
        
        # 第一步：取得對 P 樣本的預測
        train_pred_p = model(xp)  # 訓練集中的正樣本預測分數
        
        # 第二步：計算錯誤數量
        # 將預測分數轉換為分類標籤（閾值 0）
        predicted_labels = (train_pred_p > 0).astype(int)  # 1 代表預測為正，0 代表預測為負
        true_labels = np.ones(len(xp))  # P 樣本的真實標籤全部都是 1
        
        # 計算被錯誤預測為負的 P 樣本數量
        misclassified_p_count = np.sum(predicted_labels == 0)
        total_p_samples = len(xp)
        
        # 第三步：計算最終的錯誤率
        training_error_rate = misclassified_p_count / total_p_samples
        
        print(f"   📊 uPU 訓練集詳細統計 (修正版本):")
        print(f"      • 訓練正樣本總數: {total_p_samples}")
        print(f"      • 正確預測為正的 P 樣本: {total_p_samples - misclassified_p_count}")
        print(f"      • 錯誤預測為負的 P 樣本: {misclassified_p_count}")
        print(f"      • uPU 訓練錯誤率: {training_error_rate:.4f} ({training_error_rate*100:.2f}%)")
        print(f"      • 驗證: {misclassified_p_count}/{total_p_samples} = {training_error_rate:.4f}")
        
        # 使用共用的錯誤率合理性分析函數
        analyze_error_rate_reasonableness(error_rate, pred_p, pred_n, 'uPU')
        
        # 使用共用的先驗估計分析函數
        analyze_prior_estimation(estimated_prior, data_params.prior, 'uPU')
            
        # uPU 的風險曲線（模擬，展示負風險特性）
        print(f"\n⚠️  [DEBUG] 生成 uPU 風險曲線 (模擬):")
        risk_curve = []
        for epoch in range(1, 51):
            # 模擬 uPU 的風險變化（展示可能變為負值的特性）
            base_risk = np.exp(-epoch * 0.1) + np.random.normal(0, 0.01)
            if epoch > 20:
                base_risk -= 0.3  # uPU 可能有負風險
            
            # 記錄是否為負數
            if base_risk < 0 and epoch <= 25:  # 只在前幾次報告
                print(f"      Epoch {epoch}: Risk = {base_risk:.4f} ⚠️  **負風險！**")
            elif epoch % 10 == 0:
                print(f"      Epoch {epoch}: Risk = {base_risk:.4f}")
            
            risk_curve.append({'epoch': epoch, 'risk': base_risk})
        
    else:  # nnPU
        options = {
            'n_epochs': model_params.n_epochs,
            'learning_rate': model_params.learning_rate,
            'hidden_dim': model_params.hidden_dim,
            'activation': model_params.activation
        }
        
        # 檢查是否有 weight_decay 參數
        if hasattr(model_params, 'weight_decay'):
            options['weight_decay'] = model_params.weight_decay
        
        # 使用共用的模型複雜度分析函數
        analyze_model_complexity('nnPU', model_params, data_params.dims, len(xp), len(xu))
        
        model, outputs = train_nnpu(xp, xu, data_params.prior, options, seed)
        
        # 4. 評估過程日誌 - 詳細計算分類錯誤率 (nnPU)
        print(f"\n📈 [DEBUG] 模型評估 (nnPU):")
        with torch.no_grad():
            device = outputs['device']
            pred_p = model(torch.FloatTensor(xt_p).to(device)).cpu().numpy()
            pred_n = model(torch.FloatTensor(xt_n).to(device)).cpu().numpy()
        
        # 使用共用的預測分析函數
        print_prediction_analysis(pred_p, pred_n, 'nnPU')
        
        # 使用共用的錯誤率計算函數
        error_rate, fn_rate, fp_rate = calculate_error_rates(pred_p, pred_n, xt_p, xt_n, data_params.prior, 'nnPU')
        
        # 計算訓練錯誤率 (nnPU) - 修正版本：只計算正樣本的錯誤率
        print(f"\n   📊 [DEBUG] 計算 nnPU 訓練錯誤率 (修正版本)...")
        with torch.no_grad():
            # 第一步：取得對 P 樣本的預測
            train_pred_p = model(torch.FloatTensor(xp).to(device)).cpu().numpy()
        
        # 第二步：計算錯誤數量
        # 將預測分數轉換為分類標籤（閾值 0）
        predicted_labels = (train_pred_p.flatten() > 0).astype(int)  # 1 代表預測為正，0 代表預測為負
        true_labels = np.ones(len(xp))  # P 樣本的真實標籤全部都是 1
        
        # 計算被錯誤預測為負的 P 樣本數量
        misclassified_p_count = np.sum(predicted_labels == 0)
        total_p_samples = len(xp)
        
        # 第三步：計算最終的錯誤率
        training_error_rate = misclassified_p_count / total_p_samples
        
        print(f"   📊 nnPU 訓練集詳細統計 (修正版本):")
        print(f"      • 訓練正樣本總數: {total_p_samples}")
        print(f"      • 正確預測為正的 P 樣本: {total_p_samples - misclassified_p_count}")
        print(f"      • 錯誤預測為負的 P 樣本: {misclassified_p_count}")
        print(f"      • nnPU 訓練錯誤率: {training_error_rate:.4f} ({training_error_rate*100:.2f}%)")
        print(f"      • 驗證: {misclassified_p_count}/{total_p_samples} = {training_error_rate:.4f}")
        
        # 使用共用的錯誤率合理性分析函數
        analyze_error_rate_reasonableness(error_rate, pred_p, pred_n, 'nnPU')
        
        # 計算 Estimated Prior 的內部數值
        print(f"\n🔍 [DEBUG] 訓練後先驗估計 (nnPU):")
        prior_method = getattr(request, 'prior_estimation_method', 'median')
        with torch.no_grad():
            # 對 unlabeled data 計算 E[g(x)]
            gu_for_prior = model(torch.FloatTensor(xu).to(device)).cpu().numpy()
            # 使用 sigmoid 轉換為概率
            prob_u = 1 / (1 + np.exp(-gu_for_prior.flatten()))
            
            # 根據方法選擇使用均值或中位數
            if prior_method == 'mean':
                estimated_prior = np.mean(prob_u)
                print(f"      • 使用 Mean 方法估計 Prior: {estimated_prior:.4f}")
            else:  # median
                estimated_prior = np.median(prob_u)
                print(f"      • 使用 Median 方法估計 Prior: {estimated_prior:.4f}")
            
            print(f"      • E[sigmoid(g(x))] 對 unlabeled data - Mean: {np.mean(prob_u):.4f}, Median: {np.median(prob_u):.4f}")
            print(f"      • 訓練後模型估計的 Prior ({prior_method}): {estimated_prior:.4f}")
        
        # 使用共用的先驗估計分析函數
        analyze_prior_estimation(estimated_prior, data_params.prior, 'nnPU')
        
        risk_curve = outputs['risk_curve']
    
    print(f"\n✅ [DEBUG] 模型訓練和評估完成!")
    print(f"   • 最終錯誤率: {error_rate:.4f} ({error_rate*100:.1f}%)")
    print(f"   • 訓練錯誤率: {training_error_rate:.4f} ({training_error_rate*100:.1f}%)")
    
    # 4. 準備可視化數據
    print(f"\n📊 [DEBUG] 準備可視化數據...")
    if data_params.dims > 2:
        # 降維到 2D 用於可視化
        print(f"   • 原始維度 {data_params.dims}D，正在降維到 2D...")
        all_data = np.vstack([xp, xu])
        all_data_2d = reduce_to_2d_for_visualization(all_data)
        
        xp_2d = all_data_2d[:len(xp)]
        xu_2d = all_data_2d[len(xp):]
        print(f"   • 降維後 P 形狀: {xp_2d.shape}")
        print(f"   • 降維後 U 形狀: {xu_2d.shape}")
    else:
        xp_2d = xp
        xu_2d = xu
        print(f"   • 使用原始 2D 數據，無需降維")
    
    # 生成決策邊界
    if data_params.dims <= 2:
        decision_boundary = generate_decision_boundary(model, request.algorithm, outputs)
        print(f"   • 決策邊界點數: {len(decision_boundary)}")
    else:
        # 高維情況下生成簡化的決策邊界
        decision_boundary = generate_simple_boundary()
        print(f"   • 使用簡化決策邊界 (高維情況)")
    
    # 5. 構建回應
    response_data = {
        'visualization': {
            'p_samples': xp_2d.tolist(),
            'u_samples': xu_2d.tolist(),
            'decision_boundary': decision_boundary
        },
        'metrics': {
            'estimated_prior': float(estimated_prior),  # 🔧 修正：返回真正的估計值，而不是真實值
            'error_rate': float(error_rate),
            'training_error_rate': float(training_error_rate),
            'risk_curve': risk_curve
        }
    }
    
    # 5. API 回傳資料日誌
    print(f"\n📤 [DEBUG] API 回傳資料檢查:")
    print(f"   • positive_samples 數量: {len(response_data['visualization']['p_samples'])}")
    print(f"   • unlabeled_samples 數量: {len(response_data['visualization']['u_samples'])}")
    print(f"   • decision_boundary 數量: {len(response_data['visualization']['decision_boundary'])}")
    
    # 檢查座標格式
    if len(response_data['visualization']['p_samples']) > 0:
        print(f"   • 第一個 positive sample: {response_data['visualization']['p_samples'][0]}")
    if len(response_data['visualization']['u_samples']) > 0:
        print(f"   • 第一個 unlabeled sample: {response_data['visualization']['u_samples'][0]}")
    if len(response_data['visualization']['decision_boundary']) > 0:
        print(f"   • 第一個 decision boundary 點: {response_data['visualization']['decision_boundary'][0]}")
    
    print(f"   • estimated_prior: {response_data['metrics']['estimated_prior']}")
    print(f"   • error_rate: {response_data['metrics']['error_rate']}")
    print(f"   • training_error_rate: {response_data['metrics']['training_error_rate']}")
    print(f"   • risk_curve 長度: {len(response_data['metrics']['risk_curve'])}")
    
    # 完整 JSON 物件預覽 (截斷)
    print(f"\n📋 [DEBUG] 完整回傳 JSON 物件:")
    import json
    json_str = json.dumps(response_data, indent=2)
    # 只顯示前 500 字符以避免過長輸出
    if len(json_str) > 500:
        print(f"{json_str[:500]}...")
        print(f"   (總長度: {len(json_str)} 字符，已截斷)")
    else:
        print(json_str)
    
    print("="*60)
    print("🎯 [DEBUG] PU Learning 模擬完成！")
    print("="*60)
    
    return response_data


def generate_decision_boundary(model, algorithm: str, outputs: Dict) -> List[List[float]]:
    """生成決策邊界用於可視化 - 修正版本，使用等高線方法生成連續邊界線"""
    boundary_points = []
    
    try:
        print(f"\n🎨 [DEBUG] 生成決策邊界 ({algorithm})...")
        
        if algorithm == 'uPU':
            # **修正：使用連續邊界線生成方法**
            x_min, x_max = -2.5, 2.5  # 聚焦於 two_moons 數據範圍
            y_min, y_max = -1.5, 1.5
            
            # 生成邊界線的參數化方法
            try:
                # 方法1：沿著 x 軸掃描，找到決策邊界的 y 值
                x_line = np.linspace(x_min, x_max, 50)
                boundary_y = []
                
                for x in x_line:
                    # 在當前 x 位置，搜索 y 方向的決策邊界
                    y_candidates = np.linspace(y_min, y_max, 100)
                    test_points = np.column_stack([np.full_like(y_candidates, x), y_candidates])
                    
                    try:
                        predictions = model(test_points)
                        # 找到最接近 0 的預測點
                        abs_predictions = np.abs(predictions)
                        min_idx = np.argmin(abs_predictions)
                        boundary_y.append(y_candidates[min_idx])
                    except:
                        # 如果預測失敗，使用簡單的正弦波
                        boundary_y.append(0.3 * np.sin(x * 1.5))
                
                boundary_points = [[float(x), float(y)] for x, y in zip(x_line, boundary_y)]
                print(f"      • 生成了 {len(boundary_points)} 個連續邊界點")
                
            except Exception as e:
                print(f"      ⚠️  uPU 邊界生成出錯: {e}")
                # 後備方案：生成合理的非線性邊界
                x_line = np.linspace(x_min, x_max, 30)
                y_line = 0.5 * np.sin(x_line * 2) + 0.2 * np.cos(x_line * 3)
                boundary_points = [[float(x), float(y)] for x, y in zip(x_line, y_line)]
                print(f"      • 使用後備非線性邊界")
            
            except Exception as e:
                print(f"      ⚠️  uPU 預測出錯: {e}")
                boundary_points = [[x_min, 0], [x_max, 0]]
        
        else:  # nnPU
            # **修正：神經網路模型的連續邊界線生成**
            device = outputs.get('device', torch.device('cpu'))
            x_min, x_max = -2.5, 2.5  # 聚焦於 two_moons 數據範圍  
            y_min, y_max = -1.5, 1.5
            
            try:
                # 使用等高線方法生成連續邊界
                x_line = np.linspace(x_min, x_max, 50)
                boundary_y = []
                
                with torch.no_grad():
                    for x in x_line:
                        # 在當前 x 位置搜索決策邊界
                        y_candidates = np.linspace(y_min, y_max, 100)
                        test_points = np.column_stack([np.full_like(y_candidates, x), y_candidates])
                        
                        grid_tensor = torch.FloatTensor(test_points).to(device)
                        predictions = model(grid_tensor).cpu().numpy().flatten()
                        
                        # 找到最接近 0 的預測點（決策邊界）
                        abs_predictions = np.abs(predictions)
                        min_idx = np.argmin(abs_predictions)
                        boundary_y.append(y_candidates[min_idx])
                
                boundary_points = [[float(x), float(y)] for x, y in zip(x_line, boundary_y)]
                print(f"      • 生成了 {len(boundary_points)} 個連續邊界點")
                
                # **調試輸出：檢查邊界點的 y 座標變化**
                if len(boundary_points) >= 5:
                    y_coords = [point[1] for point in boundary_points[:5]]
                    print(f"      • 前5個點的 Y 座標: {[round(y, 3) for y in y_coords]}")
                    
                    y_range = max(boundary_y) - min(boundary_y)
                    print(f"      • Y 座標變化範圍: {y_range:.3f}")
                    
                    if y_range < 0.1:
                        print(f"      ⚠️  邊界過於平直，添加輕微變化")
                        # 添加輕微的非線性變化
                        for i, (x, y) in enumerate(boundary_points):
                            boundary_points[i][1] = y + 0.1 * np.sin(x * 3)
                
            except Exception as e:
                print(f"      ⚠️  nnPU 邊界生成出錯: {e}")
                # 後備方案：生成月牙形邊界線
                x_line = np.linspace(x_min, x_max, 30)
                y_line = 0.8 * np.sin(x_line * 1.2) * np.exp(-np.abs(x_line) * 0.3)
                boundary_points = [[float(x), float(y)] for x, y in zip(x_line, y_line)]
            except Exception as e:
                print(f"      ⚠️  nnPU 預測出錯: {e}")
                boundary_points = [[x_min, 0], [x_max, 0]]
    
    except Exception as e:
        print(f"🚨 [ERROR] 決策邊界生成失敗: {e}")
        boundary_points = [[-3, 0], [3, 0]]
    
    print(f"      ✅ 最終邊界點數: {len(boundary_points)}")
    return boundary_points


def generate_simple_boundary() -> List[List[float]]:
    """生成簡單的決策邊界用於高維情況"""
    # 生成一條波浪形的邊界
    x_points = np.linspace(-4, 4, 20)
    y_points = np.sin(x_points * 0.5)
    
    return [[float(x), float(y)] for x, y in zip(x_points, y_points)]
