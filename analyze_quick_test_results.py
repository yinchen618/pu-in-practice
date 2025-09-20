#!/usr/bin/env python3
"""
重新分析已完成的快速測試結果
"""
import requests
import json

class ResultAnalyzer:
    def __init__(self):
        self.api_base = "https://weakrisk.yinchen.tw"

    def extract_model_performance(self, model_data):
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
            # 使用正確的字段名稱（下劃線格式）
            training_metrics = model_data.get('training_metrics') or model_data.get('trainingMetrics')
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

        except Exception as e:
            print(f"   ⚠️ 解析性能指標時出錯: {e}")

        return performance

    def analyze_completed_tests(self):
        """分析已完成的快速測試結果"""
        print("📊 重新分析快速測試結果")
        print("=" * 60)

        # 獲取所有模型
        response = requests.get(f"{self.api_base}/api/v2/trained-models")
        if response.status_code != 200:
            print("❌ 無法獲取模型列表")
            return

        models = response.json()

        # 找到快速測試的模型
        quick_models = []
        for model in models:
            if (model.get('name', '').startswith('ERM_BASELINE_Quick_') and
                model.get('status') == 'COMPLETED'):
                quick_models.append(model)

        if not quick_models:
            print("❌ 沒有找到已完成的快速測試模型")
            return

        print(f"✅ 找到 {len(quick_models)} 個已完成的快速測試模型")
        print("")

        # 分析每個模型
        results = []
        for model in quick_models:
            config_name = model['name'].split('_')[2]  # 提取配置名稱
            performance = self.extract_model_performance(model)

            # 從 model_config 中提取配置信息
            model_config = model.get('model_config', {})

            results.append({
                "config_name": config_name,
                "model_config": model_config,
                "performance": performance,
                "model": model
            })

        # 按 F1 分數排序
        results.sort(key=lambda x: x['performance']['f1_score'], reverse=True)

        # 顯示結果
        for i, result in enumerate(results, 1):
            config = result['model_config']
            perf = result['performance']

            print(f"🥇 第 {i} 名: {result['config_name']}")
            print(f"   🎯 F1 Score: {perf['f1_score']:.4f}")
            print(f"   📈 Precision: {perf['precision']:.4f}")
            print(f"   📉 Recall: {perf['recall']:.4f}")
            print(f"   ⏱️ 訓練時間: {perf['training_time']:.2f}s")
            print(f"   🔄 訓練輪數: {perf['epochs_trained']}")
            print(f"   🧠 架構: Hidden={config.get('hiddenSize')}, Layers={config.get('numLayers')}")
            print(f"   📊 參數: Window={config.get('windowSize')}, Batch={config.get('batchSize')}, LR={config.get('learningRate')}")
            print("")

        if results:
            best_result = results[0]
            print("🎯 推薦配置 (基於最高 F1 Score):")
            print(f"   📋 名稱: {best_result['config_name']}")
            print(f"   🎯 F1 Score: {best_result['performance']['f1_score']:.4f}")
            config = best_result['model_config']
            print(f"   🧠 Hidden Size: {config.get('hiddenSize')}")
            print(f"   🏗️ Layers: {config.get('numLayers')}")
            print(f"   📊 Window Size: {config.get('windowSize')}")
            print(f"   🎲 Batch Size: {config.get('batchSize')}")
            print(f"   📈 Learning Rate: {config.get('learningRate')}")
            print(f"   💧 Dropout: {config.get('dropout')}")

def main():
    analyzer = ResultAnalyzer()
    analyzer.analyze_completed_tests()

if __name__ == "__main__":
    main()
