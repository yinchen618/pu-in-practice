#!/usr/bin/env python3
"""
Stage 3 Complete Demo Script
完整演示 Stage 3 MLOps Training Workbench 功能
"""

import requests
import json
import time
import uuid
from datetime import datetime

BASE_URL = "https://weakrisk.yinchen.tw/api/v2"

def print_separator(title):
    """打印分隔線"""
    print("\n" + "=" * 60)
    print(f"🎯 {title}")
    print("=" * 60)

def print_step(step_num, description):
    """打印步驟"""
    print(f"\n📋 Step {step_num}: {description}")
    print("-" * 40)

def create_experiment_run():
    """創建一個實驗運行用於演示"""
    print_step(1, "Creating Demo Experiment Run")

    experiment_data = {
        "name": f"Stage3_Demo_Experiment_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "description": "Demo experiment for Stage 3 MLOps workbench",
        "filtering_parameters": {
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "detection_rules": ["threshold_violation", "pattern_anomaly"],
            "buildings": ["Building_A"],
            "floors": ["Floor_1", "Floor_2"],
            "rooms": ["Room_101", "Room_102"]
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/experiment-runs", json=experiment_data)
        if response.status_code == 200:
            experiment = response.json()
            print(f"✅ Created experiment: {experiment['id']}")
            print(f"   Name: {experiment['name']}")
            print(f"   Status: {experiment['status']}")
            return experiment
        else:
            print(f"❌ Failed to create experiment: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def demonstrate_training_scenarios(experiment_id):
    """演示不同的訓練場景"""
    print_step(2, "Demonstrating Training Scenarios")

    scenarios = [
        {
            "name": "ERM_Baseline_LSTM",
            "scenarioType": "ERM_BASELINE",
            "modelConfig": {
                "modelType": "LSTM",
                "windowSize": 60,
                "hiddenSize": 128,
                "numLayers": 2,
                "dropout": 0.2,
                "learningRate": 0.001,
                "batchSize": 32,
                "epochs": 100
            }
        },
        {
            "name": "Generalization_Challenge_GRU",
            "scenarioType": "GENERALIZATION_CHALLENGE",
            "modelConfig": {
                "modelType": "GRU",
                "windowSize": 120,
                "hiddenSize": 256,
                "numLayers": 3,
                "dropout": 0.3,
                "learningRate": 0.0005,
                "batchSize": 16,
                "epochs": 150
            }
        },
        {
            "name": "Domain_Adaptation_Transformer",
            "scenarioType": "DOMAIN_ADAPTATION",
            "modelConfig": {
                "modelType": "Transformer",
                "windowSize": 100,
                "hiddenSize": 512,
                "numLayers": 4,
                "dropout": 0.1,
                "learningRate": 0.0001,
                "batchSize": 8,
                "epochs": 200
            }
        }
    ]

    created_models = []

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n🚀 Creating training scenario {i}/3: {scenario['scenarioType']}")

        training_data = {
            "name": f"{scenario['name']}_{datetime.now().strftime('%H%M%S')}",
            "scenarioType": scenario["scenarioType"],
            "experimentRunId": experiment_id,
            "modelConfig": scenario["modelConfig"],
            "dataSourceConfig": {
                "selectedDatasets": [f"dataset_{i}"],
                "trainRatio": 0.8,
                "timeRange": {
                    "startDate": "2024-01-01",
                    "endDate": "2024-10-31"
                }
            }
        }

        try:
            response = requests.post(f"{BASE_URL}/trained-models", json=training_data)
            if response.status_code == 200:
                model = response.json()
                created_models.append(model)
                print(f"   ✅ Model ID: {model['id']}")
                print(f"   ✅ Job ID: {model['jobId']}")
                print(f"   ✅ Status: {model['status']}")
            else:
                print(f"   ❌ Failed: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

        # 等待一下再創建下一個
        time.sleep(1)

    return created_models

def monitor_training_progress(models):
    """監控訓練進度"""
    print_step(3, "Monitoring Training Progress")

    print("📊 Real-time training monitoring...")

    for round_num in range(10):  # 監控 10 輪
        print(f"\n⏰ Round {round_num + 1}/10 - {datetime.now().strftime('%H:%M:%S')}")

        try:
            response = requests.get(f"{BASE_URL}/trained-models")
            if response.status_code == 200:
                current_models = response.json()

                for model in current_models:
                    if model['id'] in [m['id'] for m in models]:
                        status_emoji = {
                            'PENDING': '⏳',
                            'RUNNING': '🔄',
                            'COMPLETED': '✅',
                            'FAILED': '❌'
                        }.get(model['status'], '❓')

                        print(f"   {status_emoji} {model['name']}: {model['status']}")

                        # 如果有訓練指標，顯示出來
                        if model.get('trainingMetrics'):
                            metrics = model['trainingMetrics'] if isinstance(model['trainingMetrics'], dict) else {}
                            if metrics:
                                print(f"      📈 Loss: {metrics.get('final_loss', 'N/A')}, Accuracy: {metrics.get('final_accuracy', 'N/A')}")

            else:
                print(f"   ❌ Failed to fetch models: {response.status_code}")

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

        # 檢查是否所有訓練都完成了
        try:
            response = requests.get(f"{BASE_URL}/trained-models")
            if response.status_code == 200:
                current_models = response.json()
                completed_count = sum(1 for m in current_models
                                    if m['id'] in [model['id'] for model in models]
                                    and m['status'] in ['COMPLETED', 'FAILED'])

                if completed_count == len(models):
                    print("\n🎉 All training jobs completed!")
                    break

        except Exception as e:
            pass

        time.sleep(3)  # 等待 3 秒

def demonstrate_evaluation_scenarios(experiment_id):
    """演示評估場景"""
    print_step(4, "Demonstrating Evaluation Scenarios")

    # 獲取已完成的模型
    try:
        response = requests.get(f"{BASE_URL}/trained-models?experiment_run_id={experiment_id}")
        if response.status_code == 200:
            models = response.json()
            completed_models = [m for m in models if m['status'] == 'COMPLETED']

            if not completed_models:
                print("❌ No completed models available for evaluation")
                return []

            print(f"📊 Found {len(completed_models)} completed models for evaluation")

            created_evaluations = []

            for i, model in enumerate(completed_models[:2], 1):  # 只評估前 2 個模型
                print(f"\n🔬 Creating evaluation {i} for model: {model['name']}")

                evaluation_data = {
                    "name": f"Eval_{model['scenarioType']}_{datetime.now().strftime('%H%M%S')}",
                    "scenarioType": model["scenarioType"],
                    "trainedModelId": model["id"],
                    "testSetSource": {
                        "selectedDatasets": ["test_dataset"],
                        "timeRange": {
                            "startDate": "2024-11-01",
                            "endDate": "2024-12-31"
                        }
                    }
                }

                try:
                    response = requests.post(f"{BASE_URL}/evaluation-runs", json=evaluation_data)
                    if response.status_code == 200:
                        evaluation = response.json()
                        created_evaluations.append(evaluation)
                        print(f"   ✅ Evaluation ID: {evaluation['id']}")
                        print(f"   ✅ Job ID: {evaluation['jobId']}")
                        print(f"   ✅ Status: {evaluation['status']}")
                    else:
                        print(f"   ❌ Failed: {response.text}")
                except Exception as e:
                    print(f"   ❌ Error: {str(e)}")

                time.sleep(1)

            return created_evaluations

        else:
            print(f"❌ Failed to fetch models: {response.text}")
            return []

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return []

def monitor_evaluation_progress(evaluations):
    """監控評估進度"""
    print_step(5, "Monitoring Evaluation Progress")

    print("📊 Real-time evaluation monitoring...")

    for round_num in range(8):  # 監控 8 輪
        print(f"\n⏰ Round {round_num + 1}/8 - {datetime.now().strftime('%H:%M:%S')}")

        try:
            response = requests.get(f"{BASE_URL}/evaluation-runs")
            if response.status_code == 200:
                current_evaluations = response.json()

                for evaluation in current_evaluations:
                    if evaluation['id'] in [e['id'] for e in evaluations]:
                        status_emoji = {
                            'PENDING': '⏳',
                            'RUNNING': '🔄',
                            'COMPLETED': '✅',
                            'FAILED': '❌'
                        }.get(evaluation['status'], '❓')

                        print(f"   {status_emoji} {evaluation['name']}: {evaluation['status']}")

                        # 如果有評估指標，顯示出來
                        if evaluation.get('evaluationMetrics'):
                            metrics = evaluation['evaluationMetrics'] if isinstance(evaluation['evaluationMetrics'], dict) else {}
                            if metrics:
                                print(f"      📈 Accuracy: {metrics.get('accuracy', 'N/A')}, F1: {metrics.get('f1_score', 'N/A')}")

            else:
                print(f"   ❌ Failed to fetch evaluations: {response.status_code}")

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

        # 檢查是否所有評估都完成了
        try:
            response = requests.get(f"{BASE_URL}/evaluation-runs")
            if response.status_code == 200:
                current_evaluations = response.json()
                completed_count = sum(1 for e in current_evaluations
                                    if e['id'] in [evaluation['id'] for evaluation in evaluations]
                                    and e['status'] in ['COMPLETED', 'FAILED'])

                if completed_count == len(evaluations):
                    print("\n🎉 All evaluation jobs completed!")
                    break

        except Exception as e:
            pass

        time.sleep(2)  # 等待 2 秒

def display_final_results(experiment_id):
    """顯示最終結果"""
    print_step(6, "Final Results Summary")

    try:
        # 獲取訓練結果
        response = requests.get(f"{BASE_URL}/trained-models?experiment_run_id={experiment_id}")
        if response.status_code == 200:
            models = response.json()
            print(f"📊 Training Results Summary:")
            print(f"   Total Models: {len(models)}")

            for status in ['COMPLETED', 'FAILED', 'RUNNING', 'PENDING']:
                count = sum(1 for m in models if m['status'] == status)
                if count > 0:
                    status_emoji = {'COMPLETED': '✅', 'FAILED': '❌', 'RUNNING': '🔄', 'PENDING': '⏳'}[status]
                    print(f"   {status_emoji} {status}: {count}")

            # 顯示完成模型的指標
            completed_models = [m for m in models if m['status'] == 'COMPLETED']
            if completed_models:
                print(f"\n🏆 Completed Models Performance:")
                for model in completed_models:
                    print(f"   📈 {model['name']}:")
                    if model.get('trainingMetrics'):
                        metrics = model['trainingMetrics'] if isinstance(model['trainingMetrics'], dict) else {}
                        if metrics:
                            print(f"      Loss: {metrics.get('final_loss', 'N/A')}")
                            print(f"      Accuracy: {metrics.get('final_accuracy', 'N/A')}")
                            print(f"      Training Time: {metrics.get('training_time', 'N/A')}s")

        # 獲取評估結果
        response = requests.get(f"{BASE_URL}/evaluation-runs?experiment_run_id={experiment_id}")
        if response.status_code == 200:
            evaluations = response.json()
            print(f"\n📊 Evaluation Results Summary:")
            print(f"   Total Evaluations: {len(evaluations)}")

            for status in ['COMPLETED', 'FAILED', 'RUNNING', 'PENDING']:
                count = sum(1 for e in evaluations if e['status'] == status)
                if count > 0:
                    status_emoji = {'COMPLETED': '✅', 'FAILED': '❌', 'RUNNING': '🔄', 'PENDING': '⏳'}[status]
                    print(f"   {status_emoji} {status}: {count}")

            # 顯示完成評估的指標
            completed_evaluations = [e for e in evaluations if e['status'] == 'COMPLETED']
            if completed_evaluations:
                print(f"\n🏆 Completed Evaluations Performance:")
                for evaluation in completed_evaluations:
                    print(f"   📈 {evaluation['name']}:")
                    if evaluation.get('evaluationMetrics'):
                        metrics = evaluation['evaluationMetrics'] if isinstance(evaluation['evaluationMetrics'], dict) else {}
                        if metrics:
                            print(f"      Accuracy: {metrics.get('accuracy', 'N/A')}")
                            print(f"      Precision: {metrics.get('precision', 'N/A')}")
                            print(f"      Recall: {metrics.get('recall', 'N/A')}")
                            print(f"      F1-Score: {metrics.get('f1_score', 'N/A')}")
                            print(f"      AUC-ROC: {metrics.get('auc_roc', 'N/A')}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """主演示流程"""
    print_separator("Stage 3 MLOps Training Workbench - Complete Demo")

    try:
        # 1. 創建實驗
        experiment = create_experiment_run()
        if not experiment:
            print("❌ Cannot proceed without experiment")
            return

        experiment_id = experiment['id']

        # 2. 演示訓練場景
        models = demonstrate_training_scenarios(experiment_id)
        if not models:
            print("❌ No models created")
            return

        # 3. 監控訓練進度
        monitor_training_progress(models)

        # 4. 演示評估場景
        evaluations = demonstrate_evaluation_scenarios(experiment_id)

        # 5. 監控評估進度
        if evaluations:
            monitor_evaluation_progress(evaluations)

        # 6. 顯示最終結果
        display_final_results(experiment_id)

        print_separator("Demo Completed Successfully! 🎉")
        print(f"📋 Experiment ID: {experiment_id}")
        print(f"🌐 View in Browser: http://localhost:3001/case-study-v2?run={experiment_id}")
        print("💡 Go to Stage 3 tab to see the MLOps Training Workbench in action!")

    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to backend server")
        print("   Please make sure the backend is running on https://weakrisk.yinchen.tw")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()
