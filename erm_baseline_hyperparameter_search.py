#!/usr/bin/env python3
"""
ERM Baseline 超參數搜索腳本
自動訓練多個模型並找出最佳超參數組合
"""

import requests
import json
import time
import uuid
from datetime import datetime
import sqlite3
import asyncio
from typing import Dict, List, Tuple, Optional

# API 配置
API_BASE = "https://weakrisk.yinchen.tw/api/v2"

class ERMBaselineHyperparameterSearch:
    def __init__(self):
        self.results = []
        self.best_model = None
        self.best_f1_score = 0.0

    def get_experiment_runs(self) -> List[Dict]:
        """獲取可用的實驗運行"""
        try:
            response = requests.get(f"{API_BASE}/experiment-runs")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ 無法獲取實驗運行: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ 獲取實驗運行時出錯: {e}")
            return []

    def get_analysis_datasets(self) -> List[Dict]:
        """獲取可用的數據集"""
        try:
            response = requests.get(f"{API_BASE}/analysis-datasets")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ 無法獲取數據集: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ 獲取數據集時出錯: {e}")
            return []

    def generate_hyperparameter_configs(self) -> List[Dict]:
        """生成10組不同的超參數配置"""
        configs = [
            # Config 1: 基礎配置 - 小模型，快速訓練
            {
                "name": "Config_1_Small_Fast",
                "modelType": "LSTM",
                "hiddenSize": 32,
                "numLayers": 1,
                "dropout": 0.2,
                "windowSize": 10,
                "learningRate": 0.001,
                "batchSize": 32,
                "epochs": 50,
                "classPrior": 0.1,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.001,
                "earlyStopping": True,
                "patience": 10,
                "learningRateScheduler": "none"
            },
            # Config 2: 中等模型 - 平衡配置
            {
                "name": "Config_2_Medium_Balanced",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 15,
                "learningRate": 0.0005,
                "batchSize": 64,
                "epochs": 80,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0005,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "step"
            },
            # Config 3: 大模型 - 高容量
            {
                "name": "Config_3_Large_Capacity",
                "modelType": "LSTM",
                "hiddenSize": 128,
                "numLayers": 3,
                "dropout": 0.4,
                "windowSize": 20,
                "learningRate": 0.0003,
                "batchSize": 128,
                "epochs": 100,
                "classPrior": 0.2,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0001,
                "earlyStopping": True,
                "patience": 20,
                "learningRateScheduler": "cosine"
            },
            # Config 4: 低學習率 - 穩定訓練
            {
                "name": "Config_4_Low_LR_Stable",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.25,
                "windowSize": 12,
                "learningRate": 0.0001,
                "batchSize": 64,
                "epochs": 120,
                "classPrior": 0.12,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.001,
                "earlyStopping": True,
                "patience": 25,
                "learningRateScheduler": "none"
            },
            # Config 5: 高 Dropout - 防止過擬合
            {
                "name": "Config_5_High_Dropout",
                "modelType": "LSTM",
                "hiddenSize": 96,
                "numLayers": 2,
                "dropout": 0.5,
                "windowSize": 18,
                "learningRate": 0.0008,
                "batchSize": 32,
                "epochs": 80,
                "classPrior": 0.18,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0008,
                "earlyStopping": True,
                "patience": 12,
                "learningRateScheduler": "step"
            },
            # Config 6: 大批次 - 穩定梯度
            {
                "name": "Config_6_Large_Batch",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 15,
                "learningRate": 0.002,  # 大批次配合高學習率
                "batchSize": 256,
                "epochs": 60,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0003,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "none"
            },
            # Config 7: SGD 優化器
            {
                "name": "Config_7_SGD_Momentum",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 15,
                "learningRate": 0.01,  # SGD 通常需要更高學習率
                "batchSize": 64,
                "epochs": 100,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "sgd",
                "l2Regularization": 0.0005,
                "earlyStopping": True,
                "patience": 20,
                "learningRateScheduler": "step"
            },
            # Config 8: 小窗口 - 細粒度特徵
            {
                "name": "Config_8_Small_Window",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 5,
                "learningRate": 0.001,
                "batchSize": 64,
                "epochs": 80,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0005,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "none"
            },
            # Config 9: 大窗口 - 長期依賴
            {
                "name": "Config_9_Large_Window",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 30,
                "learningRate": 0.0005,
                "batchSize": 64,
                "epochs": 80,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0005,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "none"
            },
            # Config 10: 高 Class Prior - 更多正樣本假設
            {
                "name": "Config_10_High_Prior",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 15,
                "learningRate": 0.0008,
                "batchSize": 64,
                "epochs": 80,
                "classPrior": 0.3,  # 假設 30% 的未標記樣本為正樣本
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0005,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "none"
            }
        ]

        return configs

    def start_training_job(self, experiment_run_id: str, config: Dict) -> Optional[Dict]:
        """開始訓練作業"""
        # 生成台灣時間的模型名稱
        taiwan_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        model_name = f"ERM_BASELINE_{config['name']}_{taiwan_time}"

        # 數據源配置 - 使用標準分割
        data_source_config = {
            "trainRatio": 70,
            "validationRatio": 20,
            "testRatio": 10,
            "timeRange": "all",
            "positiveDataSourceIds": [],  # 會由後端自動填充
            "unlabeledDataSourceIds": []  # 會由後端自動填充
        }

        payload = {
            "name": model_name,
            "scenario_type": "ERM_BASELINE",
            "experimentRunId": experiment_run_id,
            "modelConfig": json.dumps(config),
            "dataSourceConfig": json.dumps(data_source_config)
        }

        try:
            print(f"🚀 開始訓練: {config['name']}")
            print(f"   📋 模型名稱: {model_name}")
            print(f"   🧠 Hidden Size: {config['hiddenSize']}, Layers: {config['numLayers']}")
            print(f"   📊 Window Size: {config['windowSize']}, Batch Size: {config['batchSize']}")
            print(f"   📈 Learning Rate: {config['learningRate']}, Optimizer: {config['optimizer']}")

            response = requests.post(f"{API_BASE}/trained-models", json=payload)

            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                print(f"   ✅ 訓練作業已開始: {result.get('jobId', 'Unknown')}")
                return result
            else:
                print(f"   ❌ 訓練請求失敗: {response.status_code}")
                print(f"   📝 錯誤詳情: {response.text}")
                return None

        except Exception as e:
            print(f"   ❌ 訓練請求異常: {e}")
            return None

    def wait_for_training_completion(self, job_id: str, timeout_minutes: int = 20) -> bool:
        """等待訓練完成"""
        start_time = time.time()
        timeout_seconds = timeout_minutes * 60
        check_interval = 15  # 每15秒檢查一次

        print(f"   ⏳ 等待訓練完成 (最長等待 {timeout_minutes} 分鐘)...")

        # 第一次嘗試直接查找 job_id
        attempts = 0
        while time.time() - start_time < timeout_seconds:
            try:
                # 查詢訓練狀態
                response = requests.get(f"{API_BASE}/trained-models")
                if response.status_code == 200:
                    models = response.json()

                    # 方法1: 找到對應的 job_id
                    target_model = None
                    for model in models:
                        model_job_id = model.get('jobId') or model.get('job_id')
                        if model_job_id == job_id:
                            target_model = model
                            break

                    # 方法2: 如果找不到 job_id，嘗試用最近創建的模型
                    if not target_model and attempts < 5:
                        # 按創建時間排序，找最新的 RUNNING 或 PENDING 模型
                        for model in sorted(models, key=lambda x: x.get('createdAt', ''), reverse=True):
                            status = model.get('status', '').upper()
                            if status in ['RUNNING', 'PENDING']:
                                target_model = model
                                print(f"   🔍 使用最新的運行中模型: {model.get('name', 'Unknown')}")
                                break

                    if target_model:
                        status = target_model.get('status', 'UNKNOWN').upper()
                        model_name = target_model.get('name', 'Unknown')

                        if status == 'COMPLETED':
                            print(f"   ✅ 訓練完成! 模型: {model_name}")
                            return True
                        elif status == 'FAILED':
                            print(f"   ❌ 訓練失敗! 模型: {model_name}")
                            return False
                        else:
                            # 顯示進度
                            elapsed = int(time.time() - start_time)
                            print(f"   ⏳ 訓練中... (已等待 {elapsed}s, 狀態: {status}, 模型: {model_name})")
                            time.sleep(check_interval)
                    else:
                        attempts += 1
                        if attempts <= 3:
                            print(f"   🔍 搜索中... (嘗試 {attempts}/3)")
                            time.sleep(5)
                        else:
                            print(f"   ⚠️ 找不到對應的訓練作業 (Job ID: {job_id})")
                            time.sleep(check_interval)
                else:
                    print(f"   ⚠️ 無法查詢模型狀態: {response.status_code}")
                    time.sleep(check_interval)

            except Exception as e:
                print(f"   ⚠️ 查詢狀態時出錯: {e}")
                time.sleep(check_interval)

        print(f"   ⏰ 等待超時 ({timeout_minutes} 分鐘)")
        return False

    def get_model_performance(self, job_id: str) -> Optional[Dict]:
        """獲取模型性能指標"""
        try:
            response = requests.get(f"{API_BASE}/trained-models")
            if response.status_code == 200:
                models = response.json()

                # 方法1: 嘗試用 job_id 找到模型
                target_model = None
                for model in models:
                    model_job_id = model.get('jobId') or model.get('job_id')
                    if model_job_id == job_id:
                        target_model = model
                        break

                # 方法2: 如果找不到，使用最新完成的模型
                if not target_model:
                    print(f"   🔍 找不到指定 Job ID，使用最新完成的模型...")
                    completed_models = [m for m in models if m.get('status', '').upper() == 'COMPLETED']
                    if completed_models:
                        # 按創建時間排序，取最新的
                        target_model = sorted(completed_models, key=lambda x: x.get('createdAt', ''), reverse=True)[0]
                        print(f"   📋 使用模型: {target_model.get('name', 'Unknown')}")

                if target_model:
                    # 解析訓練指標
                    training_metrics = target_model.get('trainingMetrics')
                    if training_metrics:
                        if isinstance(training_metrics, str):
                            training_metrics = json.loads(training_metrics)

                        return {
                            'model_id': target_model.get('id'),
                            'model_name': target_model.get('name'),
                            'status': target_model.get('status'),
                            'final_test_f1_score': training_metrics.get('final_test_f1_score', 0.0),
                            'best_val_f1_score': training_metrics.get('best_val_f1_score', 0.0),
                            'final_test_precision': training_metrics.get('final_test_precision', 0.0),
                            'final_test_recall': training_metrics.get('final_test_recall', 0.0),
                            'training_time_seconds': training_metrics.get('training_time_seconds', 0),
                            'total_epochs_trained': training_metrics.get('total_epochs_trained', 0),
                            'early_stopped': training_metrics.get('early_stopped', False),
                            'training_metrics': training_metrics
                        }
                    else:
                        print(f"   ⚠️ 模型 {target_model.get('name')} 沒有訓練指標")
                        return None

                print(f"   ❌ 找不到任何匹配的模型")
                return None
            else:
                print(f"❌ 無法獲取模型列表: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ 獲取模型性能時出錯: {e}")
            return None

    def run_hyperparameter_search(self):
        """執行超參數搜索"""
        print("🔍 ERM Baseline 超參數搜索開始")
        print("=" * 80)

        # 1. 獲取實驗運行
        print("📋 獲取可用的實驗運行...")
        experiment_runs = self.get_experiment_runs()

        if not experiment_runs:
            print("❌ 沒有可用的實驗運行")
            return

        # 選擇第一個 COMPLETED 狀態的實驗運行
        target_experiment = None
        for exp in experiment_runs:
            if exp.get('status') == 'COMPLETED':
                target_experiment = exp
                break

        if not target_experiment:
            print("❌ 沒有找到 COMPLETED 狀態的實驗運行")
            return

        experiment_run_id = target_experiment['id']
        print(f"✅ 使用實驗運行: {target_experiment['name']} (ID: {experiment_run_id})")

        # 2. 生成超參數配置
        print(f"\n🧬 生成超參數配置...")
        configs = self.generate_hyperparameter_configs()
        print(f"✅ 生成了 {len(configs)} 組超參數配置")

        # 3. 逐一訓練和評估
        print(f"\n🚀 開始超參數搜索 (總共 {len(configs)} 組配置)")
        print("=" * 80)

        for i, config in enumerate(configs, 1):
            print(f"\n📊 配置 {i}/{len(configs)}: {config['name']}")
            print("-" * 60)

            # 開始訓練
            training_result = self.start_training_job(experiment_run_id, config)

            if not training_result:
                print(f"   ❌ 配置 {i} 訓練啟動失敗，跳過")
                continue

            job_id = training_result.get('jobId')
            if not job_id:
                print(f"   ❌ 配置 {i} 沒有獲得 Job ID，跳過")
                continue

            # 等待訓練完成
            success = self.wait_for_training_completion(job_id, timeout_minutes=20)

            if not success:
                print(f"   ❌ 配置 {i} 訓練未能在時限內完成，跳過")
                continue

            # 獲取性能指標
            performance = self.get_model_performance(job_id)

            if performance:
                self.results.append({
                    'config_name': config['name'],
                    'config': config,
                    'performance': performance,
                    'job_id': job_id
                })

                f1_score = performance['final_test_f1_score']
                precision = performance['final_test_precision']
                recall = performance['final_test_recall']
                training_time = performance['training_time_seconds']
                epochs = performance['total_epochs_trained']

                print(f"   📈 性能結果:")
                print(f"      🎯 Test F1 Score: {f1_score:.4f}")
                print(f"      🎯 Test Precision: {precision:.4f}")
                print(f"      📊 Test Recall: {recall:.4f}")
                print(f"      ⏱️ 訓練時間: {training_time:.1f}s ({training_time/60:.1f}min)")
                print(f"      🔄 訓練輪數: {epochs}")

                # 更新最佳模型
                if f1_score > self.best_f1_score:
                    self.best_f1_score = f1_score
                    self.best_model = {
                        'config_name': config['name'],
                        'config': config,
                        'performance': performance,
                        'job_id': job_id
                    }
                    print(f"   🌟 新的最佳模型! (F1: {f1_score:.4f})")
            else:
                print(f"   ❌ 配置 {i} 無法獲取性能指標")

        # 4. 總結結果
        self.print_final_results()

    def print_final_results(self):
        """打印最終結果"""
        print("\n" + "=" * 80)
        print("🏁 超參數搜索完成")
        print("=" * 80)

        if not self.results:
            print("❌ 沒有成功完成的訓練")
            return

        # 按 F1 分數排序
        sorted_results = sorted(self.results, key=lambda x: x['performance']['final_test_f1_score'], reverse=True)

        print(f"📊 完成訓練數量: {len(self.results)}/10")
        print(f"🏆 最佳 F1 分數: {self.best_f1_score:.4f}")
        print(f"🥇 最佳配置: {self.best_model['config_name'] if self.best_model else 'None'}")

        print("\n📈 所有結果排名:")
        print("-" * 80)
        print(f"{'排名':<4} {'配置名稱':<25} {'F1分數':<8} {'精確度':<8} {'召回率':<8} {'訓練時間':<10}")
        print("-" * 80)

        for i, result in enumerate(sorted_results, 1):
            perf = result['performance']
            f1 = perf['final_test_f1_score']
            precision = perf['final_test_precision']
            recall = perf['final_test_recall']
            time_min = perf['training_time_seconds'] / 60

            print(f"{i:<4} {result['config_name']:<25} {f1:<8.4f} {precision:<8.4f} {recall:<8.4f} {time_min:<10.1f}")

        if self.best_model:
            print(f"\n🎯 最佳配置詳細信息:")
            print("-" * 40)
            best_config = self.best_model['config']
            for key, value in best_config.items():
                if key != 'name':
                    print(f"  {key}: {value}")

            print(f"\n📊 最佳模型性能:")
            print("-" * 40)
            best_perf = self.best_model['performance']
            print(f"  Test F1 Score: {best_perf['final_test_f1_score']:.4f}")
            print(f"  Test Precision: {best_perf['final_test_precision']:.4f}")
            print(f"  Test Recall: {best_perf['final_test_recall']:.4f}")
            print(f"  Best Val F1: {best_perf['best_val_f1_score']:.4f}")
            print(f"  Training Time: {best_perf['training_time_seconds']:.1f}s")
            print(f"  Epochs Trained: {best_perf['total_epochs_trained']}")
            print(f"  Early Stopped: {best_perf['early_stopped']}")

        # 保存結果到文件
        self.save_results_to_file()

    def save_results_to_file(self):
        """保存結果到文件"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"hyperparameter_search_results_{timestamp}.json"

        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    'search_timestamp': timestamp,
                    'total_configs_tested': len(self.results),
                    'best_f1_score': self.best_f1_score,
                    'best_model': self.best_model,
                    'all_results': self.results
                }, f, indent=2, ensure_ascii=False)

            print(f"\n💾 結果已保存到: {filename}")

        except Exception as e:
            print(f"\n❌ 保存結果失敗: {e}")

def main():
    """主函數"""
    print("🚀 ERM Baseline 超參數搜索工具")
    print("目標: 測試 10 組不同的超參數配置，找出最佳組合")
    print("=" * 80)

    # 檢查後端服務是否可用
    try:
        response = requests.get(f"{API_BASE}/analysis-datasets", timeout=5)
        if response.status_code != 200:
            print(f"❌ 後端服務不可用 (狀態碼: {response.status_code})")
            return
    except Exception as e:
        print(f"❌ 無法連接到後端服務: {e}")
        print("請確保後端服務運行在 https://weakrisk.yinchen.tw")
        return

    # 開始搜索
    searcher = ERMBaselineHyperparameterSearch()
    searcher.run_hyperparameter_search()

if __name__ == "__main__":
    main()
