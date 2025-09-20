#!/usr/bin/env python3
"""
ERM Baseline 超參數搜索腳本 (修正版)
自動測試不同的超參數組合來找出最佳模型配置
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any

# 配置
API_BASE = "https://weakrisk.yinchen.tw"
EXPERIMENT_RUN_ID = "bc38412a-ead9-4aec-b5fe-b2526d4ca478"  # 從用戶提供的 ID
MAX_WAIT_TIME = 1200  # 最長等待 20 分鐘
POLL_INTERVAL = 15  # 每 15 秒檢查一次

class HyperparameterSearcher:
    def __init__(self, experiment_run_id: str):
        self.experiment_run_id = experiment_run_id
        self.results = []
        self.exp_info = None

    def get_experiment_run_info(self):
        """獲取實驗運行的基本信息和數據源配置"""
        try:
            response = requests.get(f"{API_BASE}/api/v2/experiment-runs/{self.experiment_run_id}")
            if response.status_code == 200:
                exp_data = response.json()

                # 解析 filteringParameters 以獲取數據集 ID
                filtering_params = exp_data.get('filtering_parameters')
                if filtering_params:
                    try:
                        # 如果 filtering_parameters 已經是字典，直接使用
                        if isinstance(filtering_params, dict):
                            params = filtering_params
                        else:
                            # 如果是字符串，需要解析
                            params = json.loads(filtering_params)

                        selected_dataset_ids = params.get('selectedDatasetIds', [])
                        print(f"🔍 找到選中的數據集: {selected_dataset_ids}")
                        exp_data['selectedDatasetIds'] = selected_dataset_ids
                    except Exception as e:
                        print(f"⚠️ 解析 filteringParameters 失敗: {e}")
                        exp_data['selectedDatasetIds'] = []
                else:
                    exp_data['selectedDatasetIds'] = []

                self.exp_info = exp_data
                return exp_data
            else:
                print(f"❌ 無法獲取實驗運行信息: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ 獲取實驗運行信息時出錯: {e}")
            return None

    def generate_hyperparameter_configs(self) -> List[Dict[str, Any]]:
        """生成 10 組不同的超參數配置進行測試"""

        configs = [
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
                "patience": 8,
                "learningRateScheduler": "none"
            },
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
                "patience": 12,
                "learningRateScheduler": "none"
            },
            {
                "name": "Config_3_Large_Deep",
                "modelType": "LSTM",
                "hiddenSize": 128,
                "numLayers": 3,
                "dropout": 0.4,
                "windowSize": 20,
                "learningRate": 0.0001,
                "batchSize": 32,
                "epochs": 100,
                "classPrior": 0.2,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0001,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "none"
            },
            {
                "name": "Config_4_High_LR",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.25,
                "windowSize": 12,
                "learningRate": 0.005,
                "batchSize": 64,
                "epochs": 60,
                "classPrior": 0.12,
                "activationFunction": "tanh",
                "optimizer": "adam",
                "l2Regularization": 0.001,
                "earlyStopping": True,
                "patience": 10,
                "learningRateScheduler": "none"
            },
            {
                "name": "Config_5_SGD_Optimizer",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 15,
                "learningRate": 0.01,
                "batchSize": 32,
                "epochs": 80,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "sgd",
                "l2Regularization": 0.0005,
                "earlyStopping": True,
                "patience": 12,
                "learningRateScheduler": "none"
            },
            {
                "name": "Config_6_Low_Dropout",
                "modelType": "LSTM",
                "hiddenSize": 96,
                "numLayers": 2,
                "dropout": 0.1,
                "windowSize": 18,
                "learningRate": 0.0008,
                "batchSize": 48,
                "epochs": 70,
                "classPrior": 0.18,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0003,
                "earlyStopping": True,
                "patience": 10,
                "learningRateScheduler": "none"
            },
            {
                "name": "Config_7_Large_Batch",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.35,
                "windowSize": 15,
                "learningRate": 0.0003,
                "batchSize": 128,
                "epochs": 90,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0008,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "none"
            },
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
            {
                "name": "Config_9_Large_Window",
                "modelType": "LSTM",
                "hiddenSize": 64,
                "numLayers": 2,
                "dropout": 0.3,
                "windowSize": 30,
                "learningRate": 0.0005,
                "batchSize": 32,
                "epochs": 80,
                "classPrior": 0.15,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.0005,
                "earlyStopping": True,
                "patience": 15,
                "learningRateScheduler": "none"
            },
            {
                "name": "Config_10_Conservative",
                "modelType": "LSTM",
                "hiddenSize": 48,
                "numLayers": 1,
                "dropout": 0.4,
                "windowSize": 12,
                "learningRate": 0.0003,
                "batchSize": 64,
                "epochs": 60,
                "classPrior": 0.1,
                "activationFunction": "relu",
                "optimizer": "adam",
                "l2Regularization": 0.001,
                "earlyStopping": True,
                "patience": 8,
                "learningRateScheduler": "none"
            }
        ]

        return configs

    def create_training_job(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """創建訓練作業"""
        taiwan_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        model_name = f"ERM_BASELINE_{config['name']}_{taiwan_time}"

        # 🔥 關鍵修正：正確設置 P 和 U 數據源
        if not self.exp_info or not self.exp_info.get('selectedDatasetIds'):
            print("❌ 沒有找到數據集 ID，無法創建訓練作業")
            return None

        selected_dataset_ids = self.exp_info['selectedDatasetIds']

        # 為 PU Learning 設置數據源配置
        data_source_config = {
            "trainRatio": 70,
            "validationRatio": 20,
            "testRatio": 10,
            # 🔥 關鍵：設置 P 和 U 數據源
            "positiveDataSourceIds": selected_dataset_ids,  # P 數據來源
            "unlabeledDataSourceIds": selected_dataset_ids  # U 數據來源
        }

        payload = {
            "name": model_name,
            "scenario_type": "ERM_BASELINE",
            "experimentRunId": self.experiment_run_id,
            "modelConfig": json.dumps(config),
            "dataSourceConfig": json.dumps(data_source_config)
        }

        try:
            response = requests.post(
                f"{API_BASE}/api/v2/trained-models",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ 訓練作業已開始: {result.get('jobId', 'N/A')}")
                return result
            else:
                print(f"   ❌ 創建訓練作業失敗: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   🚨 錯誤詳情: {error_detail}")
                except:
                    print(f"   🚨 錯誤詳情: {response.text}")
                return None

        except Exception as e:
            print(f"   ❌ 創建訓練作業時出錯: {e}")
            return None

    def wait_for_training_completion(self, job_id: str, model_id: str, config_name: str) -> Optional[Dict[str, Any]]:
        """等待訓練完成並獲取結果"""
        print(f"   ⏳ 等待訓練完成 (最長等待 {MAX_WAIT_TIME // 60} 分鐘)...")

        start_time = time.time()
        last_status = None

        while time.time() - start_time < MAX_WAIT_TIME:
            try:
                # 獲取所有訓練模型來找到我們的模型
                response = requests.get(f"{API_BASE}/api/v2/trained-models")
                if response.status_code == 200:
                    models = response.json()

                    # 找到我們的模型
                    our_model = None
                    for model in models:
                        if model.get('id') == model_id or model.get('jobId') == job_id:
                            our_model = model
                            break

                    if our_model:
                        status = our_model.get('status', 'UNKNOWN')
                        if status != last_status:
                            print(f"   📊 狀態更新: {status}")
                            last_status = status

                        if status == 'COMPLETED':
                            print(f"   ✅ 訓練完成!")
                            return our_model
                        elif status == 'FAILED':
                            print(f"   ❌ 訓練失敗")
                            return our_model
                        elif status in ['PENDING', 'RUNNING']:
                            # 繼續等待
                            pass
                        else:
                            print(f"   ⚠️ 未知狀態: {status}")
                    else:
                        print(f"   ⚠️ 找不到模型 ID: {model_id}")
                else:
                    print(f"   ⚠️ 無法獲取訓練狀態: {response.status_code}")

                time.sleep(POLL_INTERVAL)

            except Exception as e:
                print(f"   ⚠️ 檢查訓練狀態時出錯: {e}")
                time.sleep(POLL_INTERVAL)

        print(f"   ⏰ 訓練超時 ({MAX_WAIT_TIME // 60} 分鐘)")
        return None

    def extract_model_performance(self, model_data: Dict[str, Any]) -> Dict[str, Any]:
        """從模型數據中提取性能指標"""
        performance = {
            "status": model_data.get('status', 'UNKNOWN'),
            "f1_score": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "training_time": 0.0,
            "epochs_trained": 0,
            "best_epoch": 0,
            "early_stopped": False
        }

        try:
            # 解析訓練指標
            training_metrics = model_data.get('trainingMetrics')
            if training_metrics:
                metrics = json.loads(training_metrics) if isinstance(training_metrics, str) else training_metrics

                performance.update({
                    "f1_score": metrics.get('best_val_f1_score', metrics.get('final_test_f1_score', 0.0)),
                    "precision": metrics.get('final_test_precision', 0.0),
                    "recall": metrics.get('final_test_recall', 0.0),
                    "training_time": metrics.get('training_time_seconds', 0.0),
                    "epochs_trained": metrics.get('total_epochs_trained', 0),
                    "best_epoch": metrics.get('best_epoch', 0),
                    "early_stopped": metrics.get('early_stopped', False)
                })

            # 解析驗證指標
            validation_metrics = model_data.get('validationMetrics')
            if validation_metrics:
                val_metrics = json.loads(validation_metrics) if isinstance(validation_metrics, str) else validation_metrics

                # 如果訓練指標中沒有 F1 分數，嘗試從驗證指標中獲取
                if performance["f1_score"] == 0.0:
                    performance["f1_score"] = val_metrics.get('test_f1_score', val_metrics.get('validation_f1_score', 0.0))

        except Exception as e:
            print(f"   ⚠️ 解析性能指標時出錯: {e}")

        return performance

    def run_hyperparameter_search(self):
        """執行完整的超參數搜索"""
        print("🚀 開始 ERM Baseline 超參數搜索")
        print("=" * 60)

        # 獲取實驗運行信息
        print(f"🔍 獲取實驗運行信息: {self.experiment_run_id}")
        if not self.get_experiment_run_info():
            print("❌ 無法獲取實驗運行信息，退出")
            return

        print(f"✅ 實驗運行信息獲取成功")
        print(f"   📊 實驗名稱: {self.exp_info.get('name', 'N/A')}")
        print(f"   📊 可用數據集: {len(self.exp_info.get('selectedDatasetIds', []))}")
        print("")

        # 生成超參數配置
        configs = self.generate_hyperparameter_configs()
        print(f"📋 生成了 {len(configs)} 組超參數配置")
        print("")

        # 開始測試每組配置
        for i, config in enumerate(configs, 1):
            print(f"📊 配置 {i}/{len(configs)}: {config['name']}")
            print("-" * 60)

            # 顯示配置詳情
            print(f"🚀 開始訓練: {config['name']}")
            print(f"   📋 模型名稱: ERM_BASELINE_{config['name']}_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}")
            print(f"   🧠 Hidden Size: {config['hiddenSize']}, Layers: {config['numLayers']}")
            print(f"   📊 Window Size: {config['windowSize']}, Batch Size: {config['batchSize']}")
            print(f"   📈 Learning Rate: {config['learningRate']}, Optimizer: {config['optimizer']}")

            # 創建訓練作業
            job_result = self.create_training_job(config)
            if not job_result:
                print(f"   ❌ 跳過此配置")
                self.results.append({
                    "config": config,
                    "performance": {"status": "FAILED_TO_CREATE", "f1_score": 0.0},
                    "error": "Failed to create training job"
                })
                print("")
                continue

            job_id = job_result.get('jobId')
            model_id = job_result.get('id')

            # 等待訓練完成
            final_model = self.wait_for_training_completion(job_id, model_id, config['name'])

            if final_model:
                performance = self.extract_model_performance(final_model)
                print(f"   📊 最終性能:")
                print(f"      🎯 F1 Score: {performance['f1_score']:.4f}")
                print(f"      📈 Precision: {performance['precision']:.4f}")
                print(f"      📉 Recall: {performance['recall']:.4f}")
                print(f"      ⏱️ 訓練時間: {performance['training_time']:.2f}s")
                print(f"      🔄 訓練輪數: {performance['epochs_trained']}")

                self.results.append({
                    "config": config,
                    "performance": performance,
                    "model_id": model_id,
                    "job_id": job_id
                })
            else:
                print(f"   ❌ 訓練超時或失敗")
                self.results.append({
                    "config": config,
                    "performance": {"status": "TIMEOUT_OR_FAILED", "f1_score": 0.0},
                    "error": "Training timeout or failed"
                })

            print("")

        # 顯示最終結果
        self.display_final_results()

    def display_final_results(self):
        """顯示最終搜索結果"""
        print("🏆 超參數搜索結果總結")
        print("=" * 80)

        # 按 F1 分數排序
        valid_results = [r for r in self.results if r['performance']['status'] == 'COMPLETED']
        valid_results.sort(key=lambda x: x['performance']['f1_score'], reverse=True)

        if valid_results:
            print(f"✅ 成功完成 {len(valid_results)} 個配置的訓練")
            print("")

            # 顯示排名前 5 的配置
            top_n = min(5, len(valid_results))
            for i, result in enumerate(valid_results[:top_n], 1):
                config = result['config']
                perf = result['performance']

                print(f"🥇 第 {i} 名: {config['name']}")
                print(f"   🎯 F1 Score: {perf['f1_score']:.4f}")
                print(f"   📈 Precision: {perf['precision']:.4f}")
                print(f"   📉 Recall: {perf['recall']:.4f}")
                print(f"   ⏱️ 訓練時間: {perf['training_time']:.2f}s")
                print(f"   🔄 訓練輪數: {perf['epochs_trained']}")
                print(f"   🧠 架構: Hidden={config['hiddenSize']}, Layers={config['numLayers']}")
                print(f"   📊 參數: Window={config['windowSize']}, Batch={config['batchSize']}, LR={config['learningRate']}")
                print("")

            # 保存詳細結果到文件
            self.save_results_to_file()

        else:
            print("❌ 沒有成功完成的訓練配置")

        # 顯示失敗統計
        failed_results = [r for r in self.results if r['performance']['status'] != 'COMPLETED']
        if failed_results:
            print(f"⚠️ 失敗的配置: {len(failed_results)}")
            for result in failed_results:
                print(f"   ❌ {result['config']['name']}: {result['performance']['status']}")

    def save_results_to_file(self):
        """保存詳細結果到文件"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"hyperparameter_search_results_{timestamp}.json"

        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False, default=str)
            print(f"💾 詳細結果已保存到: {filename}")
        except Exception as e:
            print(f"⚠️ 保存結果文件時出錯: {e}")

def main():
    """主函數"""
    print("🔬 ERM Baseline 超參數搜索工具")
    print(f"🎯 實驗運行 ID: {EXPERIMENT_RUN_ID}")
    print("")

    # 創建搜索器並運行
    searcher = HyperparameterSearcher(EXPERIMENT_RUN_ID)
    searcher.run_hyperparameter_search()

    print("")
    print("🏁 超參數搜索完成!")

if __name__ == "__main__":
    main()
