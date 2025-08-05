"""
PU Learning 後端測試腳本
用於測試數據生成和基本功能
"""
import sys
import os
import numpy as np

# 添加路徑
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, 'pu-learning'))

def test_data_generation():
    """測試數據生成功能"""
    print("Testing data generation...")
    
    try:
        from data_generator import generate_synthetic_data
        
        # 測試不同分布
        distributions = ['two_moons', 'gaussian', 'spiral', 'complex']
        
        for dist in distributions:
            print(f"  Testing {dist} distribution...")
            
            xp, xu, xt_p, xt_n = generate_synthetic_data(
                distribution=dist,
                dims=2,
                n_p=50,
                n_u=200,
                prior=0.3
            )
            
            print(f"    P samples: {xp.shape}")
            print(f"    U samples: {xu.shape}")
            print(f"    Test P: {xt_p.shape}")
            print(f"    Test N: {xt_n.shape}")
        
        print("✓ Data generation test passed!")
        return True
        
    except Exception as e:
        print(f"✗ Data generation test failed: {e}")
        return False

def test_real_simulation():
    """測試真實 PU Learning 引擎"""
    print("Testing real PU Learning engine...")
    
    try:
        # 創建真實請求對象
        class RealDataParams:
            distribution = 'two_moons'
            dims = 2
            n_p = 50
            n_u = 200
            prior = 0.3
        
        class RealModelParams:
            activation = 'relu'
            n_epochs = 50
            learning_rate = 0.01
            hidden_dim = 100
        
        class RealRequest:
            algorithm = 'nnPU'
            data_params = RealDataParams()
            model_params = RealModelParams()
        
        # 嘗試導入並測試真實引擎
        from pulearning_engine import run_pu_simulation
        
        results = run_pu_simulation(RealRequest())
        
        print(f"  P samples: {len(results['visualization']['p_samples'])}")
        print(f"  U samples: {len(results['visualization']['u_samples'])}")
        print(f"  Decision boundary: {len(results['visualization']['decision_boundary'])}")
        print(f"  Risk curve length: {len(results['metrics']['risk_curve'])}")
        print(f"  Estimated prior: {results['metrics']['estimated_prior']:.3f}")
        print(f"  Error rate: {results['metrics']['error_rate']:.3f}")
        
        print("✓ Real PU Learning engine test passed!")
        return True
        
    except Exception as e:
        print(f"✗ Real PU Learning engine test failed: {e}")
        return False

def test_api_models():
    """測試 API 模型"""
    print("Testing API models...")
    
    try:
        from models import SimulationRequest, SimulationResponse, DataParams, ModelParams
        
        # 創建測試請求
        data_params = DataParams(
            distribution='two_moons',
            dims=2,
            n_p=50,
            n_u=200,
            prior=0.3
        )
        
        model_params = ModelParams(
            activation='relu',
            n_epochs=50
        )
        
        request = SimulationRequest(
            algorithm='nnPU',
            data_params=data_params,
            model_params=model_params
        )
        
        print(f"  Request algorithm: {request.algorithm}")
        print(f"  Data distribution: {request.data_params.distribution}")
        print(f"  Model activation: {request.model_params.activation}")
        
        print("✓ API models test passed!")
        return True
        
    except Exception as e:
        print(f"✗ API models test failed: {e}")
        return False

def run_all_tests():
    """運行所有測試"""
    print("=" * 50)
    print("PU Learning Backend Test Suite")
    print("=" * 50)
    
    tests = [
        test_api_models,
        test_data_generation,
        test_real_simulation
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"Test {test_func.__name__} crashed: {e}")
        print()
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! The backend is ready to use.")
    else:
        print("⚠️  Some tests failed. Please check the dependencies and code.")
    
    print("=" * 50)

if __name__ == "__main__":
    run_all_tests()
