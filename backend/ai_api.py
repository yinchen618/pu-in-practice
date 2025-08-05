# ai_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch
import torch.nn as nn
import numpy as np
import random
from typing import List, Dict, Optional
import base64
import io
from PIL import Image
import torchvision.transforms as transforms
import json
import asyncpg
import os
import datetime

router = APIRouter()

# 資料庫連接配置
DATABASE_URL = os.getenv("DATABASE_URL") or "postgresql://postgres:Info4467@supa.clkvfvz5fxb3.ap-northeast-3.rds.amazonaws.com:5432/supa"

async def get_db_connection():
    """獲取資料庫連接"""
    return await asyncpg.connect(DATABASE_URL)

# ========== 弱監督學習相關的數據模型 ==========
class DevicePowerRequest(BaseModel):
    device_id: str

class TrainPUDetectorRequest(BaseModel):
    device_id: str
    positive_timestamps: List[str]

class UUDataRequest(BaseModel):
    device_id: str

class TrainUUClassifierRequest(BaseModel):
    device_id: str

# ========== 数据模型 ==========
class LinearRegressionInput(BaseModel):
    x: float

class NeuralNetworkInput(BaseModel):
    features: List[float]

class SentimentInput(BaseModel):
    text: str

class ImageClassifierInput(BaseModel):
    image_name: str

class ModelTrainingInput(BaseModel):
    training_data: List[Dict[str, float]]

class StyleTransferInput(BaseModel):
    image_data: str  # base64 encoded image
    style: str  # "vangogh", "ukiyo-e", "pixar", etc.

class SpeechToTextInput(BaseModel):
    audio_data: str  # base64 encoded audio

class DoodleInput(BaseModel):
    drawing_data: List[List[float]]  # drawing coordinates

class ChatbotInput(BaseModel):
    message: str
    context: Optional[List[str]] = []

class StoryGeneratorInput(BaseModel):
    character: str
    theme: str
    style: str  # "fairy_tale", "poem", "adventure"

# ========== 简单的神经网络模型 ==========
class SimpleNN(nn.Module):
    def __init__(self):
        super(SimpleNN, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(4, 10),
            nn.ReLU(),
            nn.Linear(10, 10),
            nn.ReLU(),
            nn.Linear(10, 3),
            nn.Softmax(dim=1)
        )
    
    def forward(self, x):
        return self.layers(x)

# 情感分析關鍵詞
positive_keywords = ["好", "棒", "讚", "喜歡", "愛", "開心", "快樂", "滿意", "優秀", "完美", "美好", "幸福", "成功", "勝利"]
negative_keywords = ["壞", "糟", "討厭", "恨", "生氣", "難過", "失望", "痛苦", "失敗", "問題", "錯誤", "困難", "不好", "可怕"]

# 風格轉換模擬資料
style_descriptions = {
    "vangogh": "梵谷風格：充滿動感的筆觸和鮮豔的色彩",
    "ukiyo-e": "浮世繪風格：日式傳統藝術的優雅線條",
    "pixar": "皮克斯風格：3D動畫的卡通化效果",
    "watercolor": "水彩風格：柔和的色彩暈染效果",
    "oil_painting": "油畫風格：厚重的顏料質感"
}

doodle_classes = [
    "貓", "狗", "鳥", "魚", "花", "樹", "房子", "汽車", "飛機", "船",
    "太陽", "月亮", "星星", "愛心", "笑臉", "蘋果", "香蕉", "蛋糕", "帽子", "眼鏡"
]

quickdraw_categories = [
    "airplane", "apple", "banana", "bicycle", "bird", "book", "bowtie", "camera", "car", "cat",
    "chair", "clock", "cloud", "coffee cup", "crab", "crown", "diamond", "dog", "dragon", "eye",
    "face", "fish", "flower", "guitar", "hand", "hat", "heart", "house", "key", "laptop",
    "lightning", "moon", "mountain", "pencil", "phone", "pizza", "rainbow", "shoe", "smiley face", "star",
    "sun", "tree", "umbrella", "watch", "wheel", "window"
]

@router.post("/api/linear-regression")
async def linear_regression(data: LinearRegressionInput):
    noise = random.uniform(-0.5, 0.5)
    prediction = 2 * data.x + 1 + noise
    return {
        "input": data.x,
        "prediction": round(prediction, 2),
        "formula": "y = 2x + 1",
        "explanation": f"根據線性回歸模型 y = 2x + 1，當 x = {data.x} 時，預測 y = {round(prediction, 2)}。模型加入了少量雜訊來模擬真實情況。"
    }

@router.post("/api/neural-network")
async def neural_network_classify(data: NeuralNetworkInput):
    if len(data.features) != 4:
        raise HTTPException(status_code=400, detail="需要exactly 4個特徵值")
    model = SimpleNN()
    input_tensor = torch.tensor([data.features], dtype=torch.float32)
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = output[0].tolist()
    class_names = ["類別A", "類別B", "類別C"]
    predicted_class_idx = np.argmax(probabilities)
    predicted_class = class_names[predicted_class_idx]
    prob_dict = {class_names[i]: probabilities[i] for i in range(len(class_names))}
    return {
        "features": data.features,
        "predicted_class": predicted_class,
        "probabilities": prob_dict,
        "explanation": f"神經網路根據輸入特徵 {data.features}，預測最可能的類別是「{predicted_class}」，信心度為 {probabilities[predicted_class_idx]*100:.1f}%。"
    }

@router.post("/api/sentiment-analysis")
async def sentiment_analysis(data: SentimentInput):
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="文字內容不能為空")
    positive_count = sum(1 for word in positive_keywords if word in text)
    negative_count = sum(1 for word in negative_keywords if word in text)
    found_keywords = []
    for word in positive_keywords:
        if word in text:
            found_keywords.append(word)
    for word in negative_keywords:
        if word in text:
            found_keywords.append(word)
    if positive_count > negative_count:
        sentiment = "積極"
        confidence = min(0.6 + positive_count * 0.1, 0.95)
    elif negative_count > positive_count:
        sentiment = "消極"
        confidence = min(0.6 + negative_count * 0.1, 0.95)
    else:
        sentiment = "中性"
        confidence = 0.7
    return {
        "text": text,
        "sentiment": sentiment,
        "confidence": confidence,
        "keywords": found_keywords,
        "explanation": f"根據文字分析，檢測到 {len(found_keywords)} 個情感關鍵詞，判斷此文字表達{sentiment}情感。"
    }

@router.post("/api/image-classifier")
async def classify_image(data: ImageClassifierInput):
    image_name = data.image_name.lower()
    classifications = {
        "cat": {"predicted_class": "貓", "confidence": 0.95},
        "dog": {"predicted_class": "狗", "confidence": 0.92},
        "bird": {"predicted_class": "鳥", "confidence": 0.88},
        "car": {"predicted_class": "汽車", "confidence": 0.91},
        "airplane": {"predicted_class": "飛機", "confidence": 0.87},
        "ship": {"predicted_class": "船", "confidence": 0.84},
        "truck": {"predicted_class": "卡車", "confidence": 0.89},
        "frog": {"predicted_class": "青蛙", "confidence": 0.83}
    }
    if image_name not in classifications:
        all_classes = ["貓", "狗", "鳥", "汽車", "飛機", "船", "卡車", "青蛙", "馬", "鹿"]
        predicted_class = random.choice(all_classes)
        confidence = random.uniform(0.6, 0.9)
    else:
        predicted_class = classifications[image_name]["predicted_class"]
        confidence = classifications[image_name]["confidence"]
    all_classes = ["貓", "狗", "鳥", "汽車", "飛機", "船", "卡車", "青蛙", "馬", "鹿"]
    all_predictions = {}
    remaining_prob = 1.0 - confidence
    for class_name in all_classes:
        if class_name == predicted_class:
            all_predictions[class_name] = confidence
        else:
            all_predictions[class_name] = random.uniform(0, remaining_prob / (len(all_classes) - 1))
    total = sum(all_predictions.values())
    all_predictions = {k: v/total for k, v in all_predictions.items()}
    return {
        "predicted_class": predicted_class,
        "confidence": all_predictions[predicted_class],
        "all_predictions": all_predictions,
        "explanation": f"AI 模型分析圖片後，認為這是「{predicted_class}」的機率最高，達到 {all_predictions[predicted_class]*100:.1f}%。"
    }

@router.post("/api/train-simple-model")
async def train_model(data: ModelTrainingInput):
    if len(data.training_data) < 2:
        raise HTTPException(status_code=400, detail="至少需要2個資料點")
    
    x_values = [point["x"] for point in data.training_data]
    y_values = [point["y"] for point in data.training_data]
    
    # 使用梯度下降法進行訓練，記錄每個 epoch 的參數變化
    learning_rate = 0.01
    epochs = 100
    n = len(x_values)
    
    # 初始化參數
    slope = 0.0
    intercept = 0.0
    
    # 記錄訓練歷史
    training_history = []
    
    for epoch in range(epochs):
        # 計算預測值
        predictions = [slope * x + intercept for x in x_values]
        
        # 計算損失 (MSE)
        mse = sum((pred - actual) ** 2 for pred, actual in zip(predictions, y_values)) / n
        
        # 計算梯度
        slope_gradient = 0
        intercept_gradient = 0
        
        for i in range(n):
            error = predictions[i] - y_values[i]
            slope_gradient += 2 * error * x_values[i]
            intercept_gradient += 2 * error
        
        slope_gradient /= n
        intercept_gradient /= n
        
        # 更新參數
        slope -= learning_rate * slope_gradient
        intercept -= learning_rate * intercept_gradient
        
        # 每5個epoch記錄一次訓練狀態（避免數據過多）
        if epoch % 5 == 0 or epoch == epochs - 1:
            training_history.append({
                "epoch": epoch + 1,
                "slope": round(slope, 4),
                "intercept": round(intercept, 4),
                "loss": round(mse, 6),
                "slope_gradient": round(slope_gradient, 6),
                "intercept_gradient": round(intercept_gradient, 6)
            })
    
    # 最終預測
    final_predictions = [slope * x + intercept for x in x_values]
    final_mse = sum((pred - actual) ** 2 for pred, actual in zip(final_predictions, y_values)) / n
    
    equation = f"y = {slope:.3f}x + {intercept:.3f}"
    
    return {
        "model_params": {
            "slope": slope,
            "intercept": intercept
        },
        "loss": final_mse,
        "equation": equation,
        "training_points": data.training_data,
        "training_history": training_history,
        "explanation": f"模型訓練完成！經過 {epochs} 個 epoch 的梯度下降訓練，學習到的線性關係為 {equation}，最終均方誤差為 {final_mse:.4f}。斜率 {slope:.3f} 表示 x 每增加 1，y 平均增加 {slope:.3f}。"
    }

# ========== 其餘 AI 相關 API 與 function ===========

@router.post("/api/style-transfer")
async def style_transfer(data: StyleTransferInput):
    style = data.style.lower()
    if style not in style_descriptions:
        available_styles = list(style_descriptions.keys())
        style = random.choice(available_styles)
    processing_time = random.uniform(2.0, 5.0)
    success_rate = random.uniform(0.85, 0.98)
    return {
        "original_image": "原始圖片已接收",
        "style": style,
        "style_description": style_descriptions[style],
        "result_image": f"data:image/jpeg;base64,/9j/simulated_image_data_{style}",
        "processing_time": round(processing_time, 2),
        "success_rate": round(success_rate, 3),
        "explanation": f"已成功將您的圖片轉換為{style_descriptions[style]}！轉換成功率: {success_rate*100:.1f}%"
    }

@router.post("/api/speech-to-text")
async def speech_to_text(data: SpeechToTextInput):
    sample_texts = [
        "你好，這是語音轉文字測試。",
        "今天天氣真不錯。",
        "我喜歡學習人工智慧。",
        "這個語音識別系統很準確。",
        "科技讓生活更美好。"
    ]
    recognized_text = random.choice(sample_texts)
    confidence = random.uniform(0.85, 0.98)
    processing_time = random.uniform(1.0, 3.0)
    return {
        "recognized_text": recognized_text,
        "confidence": round(confidence, 3),
        "processing_time": round(processing_time, 2),
        "language": "zh-TW",
        "explanation": f"語音識別完成！識別出的文字為：「{recognized_text}」，信心度: {confidence*100:.1f}%"
    }

# recognize_doodle 及其依賴
@router.post("/api/doodle-recognition")
async def recognize_doodle(data: DoodleInput):
    drawing_data = data.drawing_data
    if not drawing_data or len(drawing_data) < 3:
        raise HTTPException(status_code=400, detail="畫圖資料不足，請畫得更完整一些")
    features = extract_drawing_features(drawing_data)
    prediction_result = classify_drawing_with_nn(features)
    return {
        "predicted_object": prediction_result["predicted_class"],
        "confidence": prediction_result["confidence"],
        "all_predictions": prediction_result["all_predictions"],
        "drawing_features": features,
        "explanation": f"AI 模型分析了您的塗鴉特徵：{features['shape_type']}形狀，{features['stroke_count']}筆畫，複雜度{features['complexity']}。預測這是「{prediction_result['predicted_class']}」，信心度: {prediction_result['confidence']*100:.1f}%"
    }

def extract_drawing_features(drawing_data):
    if not drawing_data:
        return {}
    total_points = len(drawing_data)
    total_strokes = len([stroke for stroke in drawing_data if len(stroke) >= 2])
    all_x = [point[0] for stroke in drawing_data for point in stroke if len(point) >= 2]
    all_y = [point[1] for stroke in drawing_data for point in stroke if len(point) >= 2]
    if not all_x or not all_y:
        return {"complexity": 0, "shape_type": "未知", "stroke_count": 0}
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    width = max_x - min_x
    height = max_y - min_y
    aspect_ratio = width / height if height > 0 else 1
    area = width * height
    stroke_lengths = []
    for stroke in drawing_data:
        if len(stroke) >= 2:
            length = 0
            for i in range(1, len(stroke)):
                dx = stroke[i][0] - stroke[i-1][0]
                dy = stroke[i][1] - stroke[i-1][1]
                length += (dx**2 + dy**2)**0.5
            stroke_lengths.append(length)
    avg_stroke_length = sum(stroke_lengths) / len(stroke_lengths) if stroke_lengths else 0
    shape_type = classify_shape_type(aspect_ratio, total_strokes, avg_stroke_length, area)
    complexity = calculate_complexity(total_points, total_strokes, len(stroke_lengths), area)
    return {
        "complexity": complexity,
        "shape_type": shape_type,
        "stroke_count": total_strokes,
        "aspect_ratio": round(aspect_ratio, 2),
        "area": round(area, 2),
        "avg_stroke_length": round(avg_stroke_length, 2),
        "total_points": total_points,
        "width": round(width, 2),
        "height": round(height, 2)
    }

def classify_shape_type(aspect_ratio, stroke_count, avg_stroke_length, area):
    if stroke_count <= 2:
        if aspect_ratio > 3:
            return "線條"
        elif aspect_ratio < 0.3:
            return "垂直線"
        else:
            return "簡單形狀"
    elif stroke_count <= 4:
        if 0.8 <= aspect_ratio <= 1.2:
            return "圓形"
        elif aspect_ratio > 2:
            return "矩形"
        else:
            return "橢圓"
    elif stroke_count <= 8:
        if avg_stroke_length < 20:
            return "複雜幾何"
        else:
            return "有機形狀"
    else:
        return "複雜圖案"

def calculate_complexity(total_points, stroke_count, unique_strokes, area):
    point_factor = min(total_points / 100, 1.0)
    stroke_factor = min(stroke_count / 10, 1.0)
    area_factor = min(area / 10000, 1.0)
    complexity = (point_factor * 0.4 + stroke_factor * 0.4 + area_factor * 0.2) * 100
    return round(complexity, 1)

def classify_drawing_with_nn(features):
    feature_vector = [
        features.get("complexity", 0) / 100,
        features.get("aspect_ratio", 1) / 5,
        features.get("stroke_count", 0) / 20,
        features.get("avg_stroke_length", 0) / 100,
        features.get("area", 0) / 10000,
    ]
    class DoodleClassifier(nn.Module):
        def __init__(self, input_size=5, hidden_size=20, num_classes=len(doodle_classes)):
            super(DoodleClassifier, self).__init__()
            self.layers = nn.Sequential(
                nn.Linear(input_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(hidden_size, hidden_size // 2),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(hidden_size // 2, num_classes),
                nn.Softmax(dim=1)
            )
        def forward(self, x):
            return self.layers(x)
    model = DoodleClassifier()
    input_tensor = torch.tensor([feature_vector], dtype=torch.float32)
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = output[0].tolist()
    adjusted_probabilities = adjust_probabilities_by_shape(probabilities, features.get("shape_type", "未知"))
    predicted_class_idx = np.argmax(adjusted_probabilities)
    predicted_class = doodle_classes[predicted_class_idx]
    all_predictions = {}
    for i, class_name in enumerate(doodle_classes):
        all_predictions[class_name] = adjusted_probabilities[i]
    sorted_predictions = dict(sorted(all_predictions.items(), key=lambda x: x[1], reverse=True)[:5])
    return {
        "predicted_class": predicted_class,
        "confidence": all_predictions[predicted_class],
        "all_predictions": sorted_predictions
    }

def adjust_probabilities_by_shape(probabilities, shape_type):
    shape_object_mapping = {
        "圓形": ["太陽", "月亮", "笑臉", "蘋果", "愛心"],
        "線條": ["線", "樹", "花"],
        "矩形": ["房子", "汽車", "飛機", "船"],
        "橢圓": ["鳥", "魚", "蘋果", "香蕉"],
        "複雜幾何": ["星星", "帽子", "眼鏡"],
        "有機形狀": ["貓", "狗", "鳥", "魚", "花"],
        "複雜圖案": ["貓", "狗", "汽車", "飛機", "蛋糕"]
    }
    likely_objects = shape_object_mapping.get(shape_type, doodle_classes)
    adjusted = probabilities.copy()
    boost_factor = 1.5
    for i, class_name in enumerate(doodle_classes):
        if class_name in likely_objects:
            adjusted[i] *= boost_factor
    total = sum(adjusted)
    if total > 0:
        adjusted = [p / total for p in adjusted]
    return adjusted

# quickdraw_recognition 及其依賴
@router.post("/api/quickdraw-recognition")
async def quickdraw_recognition(data: DoodleInput):
    drawing_data = data.drawing_data
    if not drawing_data or len(drawing_data) < 3:
        raise HTTPException(status_code=400, detail="畫圖資料不足，請畫得更完整一些")
    quickdraw_features = extract_quickdraw_features(drawing_data)
    recognition_result = quickdraw_classify(drawing_data, quickdraw_features)
    recognition_process = simulate_quickdraw_recognition(drawing_data, recognition_result)
    return {
        "target_word": recognition_result["target_word"],
        "predicted_category": recognition_result["predicted_category"],
        "confidence": recognition_result["confidence"],
        "recognition_time": recognition_result["recognition_time"],
        "top_predictions": recognition_result["top_predictions"],
        "recognition_process": recognition_process,
        "quickdraw_features": quickdraw_features,
        "explanation": f"Quick Draw AI 在 {recognition_result['recognition_time']:.1f} 秒內識別出您的塗鴉是「{recognition_result['predicted_category']}」！信心度: {recognition_result['confidence']*100:.1f}%"
    }

def extract_quickdraw_features(drawing_data):
    if not drawing_data:
        return {}
    total_strokes = len(drawing_data)
    total_points = sum(len(stroke) for stroke in drawing_data)
    all_x = [point[0] for stroke in drawing_data for point in stroke if len(point) >= 2]
    all_y = [point[1] for stroke in drawing_data for point in stroke if len(point) >= 2]
    if not all_x or not all_y:
        return {"stroke_count": 0, "shape_type": "unknown"}
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    width = max_x - min_x
    height = max_y - min_y
    aspect_ratio = width / height if height > 0 else 1
    area = width * height
    stroke_lengths = []
    stroke_directions = []
    for stroke in drawing_data:
        if len(stroke) >= 2:
            length = 0
            for i in range(1, len(stroke)):
                dx = stroke[i][0] - stroke[i-1][0]
                dy = stroke[i][1] - stroke[i-1][1]
                length += (dx**2 + dy**2)**0.5
            stroke_lengths.append(length)
            if len(stroke) >= 2:
                start_point = stroke[0]
                end_point = stroke[-1]
                direction = np.arctan2(end_point[1] - start_point[1], end_point[0] - start_point[0])
                stroke_directions.append(direction)
    avg_stroke_length = sum(stroke_lengths) / len(stroke_lengths) if stroke_lengths else 0
    shape_type = classify_quickdraw_shape(aspect_ratio, total_strokes, avg_stroke_length, area)
    complexity = calculate_quickdraw_complexity(total_points, total_strokes, area)
    return {
        "stroke_count": total_strokes,
        "total_points": total_points,
        "shape_type": shape_type,
        "aspect_ratio": round(aspect_ratio, 2),
        "area": round(area, 2),
        "avg_stroke_length": round(avg_stroke_length, 2),
        "complexity": complexity,
        "width": round(width, 2),
        "height": round(height, 2),
        "stroke_directions": [round(d, 2) for d in stroke_directions[:5]]
    }

def classify_quickdraw_shape(aspect_ratio, stroke_count, avg_stroke_length, area):
    if stroke_count <= 1:
        if aspect_ratio > 2:
            return "linear"
        elif 0.8 <= aspect_ratio <= 1.2:
            return "circular"
        else:
            return "curved"
    elif stroke_count <= 3:
        if 0.8 <= aspect_ratio <= 1.2:
            return "circular"
        elif aspect_ratio > 2:
            return "rectangular"
        else:
            return "oval"
    elif stroke_count <= 5:
        if avg_stroke_length < 30:
            return "detailed"
        else:
            return "organic"
    else:
        return "complex"

def calculate_quickdraw_complexity(total_points, stroke_count, area):
    point_density = total_points / max(area, 1)
    stroke_efficiency = stroke_count / max(total_points, 1)
    complexity = (point_density * 0.3 + stroke_efficiency * 0.4 + (area / 10000) * 0.3) * 100
    return round(min(complexity, 100), 1)

def quickdraw_classify(drawing_data, features):
    feature_vector = [
        features.get("stroke_count", 0) / 10,
        features.get("aspect_ratio", 1) / 5,
        features.get("avg_stroke_length", 0) / 100,
        features.get("complexity", 0) / 100,
        features.get("area", 0) / 10000,
    ]
    class QuickDrawClassifier(nn.Module):
        def __init__(self, input_size=5, hidden_size=64, num_classes=len(quickdraw_categories)):
            super(QuickDrawClassifier, self).__init__()
            self.layers = nn.Sequential(
                nn.Linear(input_size, hidden_size),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_size),
                nn.Dropout(0.3),
                nn.Linear(hidden_size, hidden_size // 2),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_size // 2),
                nn.Dropout(0.3),
                nn.Linear(hidden_size // 2, num_classes),
                nn.Softmax(dim=1)
            )
        def forward(self, x):
            return self.layers(x)
    model = QuickDrawClassifier()
    input_tensor = torch.tensor([feature_vector], dtype=torch.float32)
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = output[0].tolist()
    adjusted_probabilities = adjust_quickdraw_probabilities(probabilities, features.get("shape_type", "unknown"))
    predicted_class_idx = np.argmax(adjusted_probabilities)
    predicted_category = quickdraw_categories[predicted_class_idx]
    top_predictions = []
    for i in range(len(quickdraw_categories)):
        top_predictions.append({
            "category": quickdraw_categories[i],
            "confidence": adjusted_probabilities[i]
        })
    top_predictions.sort(key=lambda x: x["confidence"], reverse=True)
    top_predictions = top_predictions[:5]
    recognition_time = random.uniform(1.5, 4.0)
    target_word = random.choice(quickdraw_categories)
    return {
        "target_word": target_word,
        "predicted_category": predicted_category,
        "confidence": adjusted_probabilities[predicted_class_idx],
        "recognition_time": recognition_time,
        "top_predictions": top_predictions
    }

def adjust_quickdraw_probabilities(probabilities, shape_type):
    shape_category_mapping = {
        "circular": ["apple", "clock", "pizza", "sun", "watch", "wheel"],
        "rectangular": ["book", "camera", "car", "house", "laptop", "phone", "window"],
        "linear": ["pencil", "lightning"],
        "curved": ["banana", "heart", "moon", "rainbow"],
        "oval": ["eye", "fish"],
        "organic": ["bird", "cat", "dog", "flower", "tree"],
        "detailed": ["crab", "dragon", "hand", "shoe"],
        "complex": ["airplane", "bicycle", "guitar", "umbrella"]
    }
    likely_categories = shape_category_mapping.get(shape_type, quickdraw_categories)
    adjusted = probabilities.copy()
    boost_factor = 2.0
    for i, category in enumerate(quickdraw_categories):
        if category in likely_categories:
            adjusted[i] *= boost_factor
    total = sum(adjusted)
    if total > 0:
        adjusted = [p / total for p in adjusted]
    return adjusted

def simulate_quickdraw_recognition(drawing_data, recognition_result):
    process_steps = []
    stages = [
        {"time": 0.5, "stage": "特徵提取", "description": "分析筆畫和形狀特徵"},
        {"time": 1.0, "stage": "模式匹配", "description": "與已知模式進行比較"},
        {"time": 1.5, "stage": "神經網路處理", "description": "深度學習模型分析"},
        {"time": 2.0, "stage": "結果排序", "description": "計算各類別的機率"},
        {"time": recognition_result["recognition_time"], "stage": "最終識別", "description": f"識別為「{recognition_result['predicted_category']}」"}
    ]
    for stage in stages:
        process_steps.append({
            "time": stage["time"],
            "stage": stage["stage"],
            "description": stage["description"],
            "confidence": min(0.9, stage["time"] / recognition_result["recognition_time"] * recognition_result["confidence"])
        })
    return process_steps

chatbot_responses = {
    "greeting": ["你好！我是AI助手，很高興認識你！", "嗨！有什麼我可以幫助你的嗎？", "哈囉！今天過得如何？"],
    "weather": ["今天天氣真不錯呢！適合出去走走。", "不管天氣如何，保持好心情最重要！", "記得根據天氣穿合適的衣服喔！"],
    "joke": [
        "為什麼程式設計師不喜歡大自然？因為那裡沒有WiFi！",
        "什麼是AI最喜歡的音樂？演算法！",
        "為什麼電腦會感冒？因為它有太多視窗開著！"
    ],
    "ai": ["AI是人工智慧的縮寫，就像我一樣！", "AI正在幫助人類解決各種問題呢！", "AI的未來充滿無限可能！"],
    "study": ["學習是一個持續的過程，保持好奇心很重要！", "每天進步一點點，就是很大的成就！", "學習AI讓人類與科技更親近！"],
    "default": ["這真是個有趣的問題！", "我正在思考你的問題...", "告訴我更多關於這個話題吧！", "你的想法很特別！"]
}

@router.post("/api/chatbot")
async def chatbot_chat(data: ChatbotInput):
    message = data.message.lower().strip()
    response_type = "default"
    if any(word in message for word in ["你好", "嗨", "哈囉", "hello"]):
        response_type = "greeting"
    elif any(word in message for word in ["天氣", "氣象", "溫度"]):
        response_type = "weather"
    elif any(word in message for word in ["笑話", "好笑", "幽默"]):
        response_type = "joke"
    elif any(word in message for word in ["ai", "人工智慧", "機器學習"]):
        response_type = "ai"
    elif any(word in message for word in ["學習", "讀書", "考試"]):
        response_type = "study"
    response = random.choice(chatbot_responses[response_type])
    thinking_time = random.uniform(0.5, 2.0)
    return {
        "user_message": data.message,
        "bot_response": response,
        "response_type": response_type,
        "thinking_time": round(thinking_time, 2),
        "context_length": len(data.context) if data.context else 0,
        "explanation": f"根據您的訊息「{data.message}」，我判斷這是關於{response_type}的話題，並給出相應回應。"
    }

story_templates = {
    "fairy_tale": [
        "從前從前，在一個遙遠的王國裡，住著一位名叫{character}的{role}。",
        "有一天，{character}發現了一個神秘的{theme}，這改變了一切...",
        "經過許多冒險，{character}終於明白了{theme}的真正意義。",
        "從此以後，{character}過著幸福快樂的生活。"
    ],
    "adventure": [
        "{character}是一位勇敢的探險家，專門尋找失落的{theme}。",
        "在一次危險的探險中，{character}遇到了前所未見的挑戰。",
        "憑藉著智慧和勇氣，{character}克服了所有困難。",
        "最終，{character}不僅找到了{theme}，還獲得了更珍貴的東西。"
    ],
    "poem": [
        "{character}如{theme}般美麗，",
        "在晨光中翩翩起舞，",
        "帶來了希望與歡樂，",
        "讓世界充滿詩意。"
    ]
}

@router.post("/api/story-generator")
async def generate_story(data: StoryGeneratorInput):
    character = data.character.strip()
    theme = data.theme.strip()
    style = data.style.lower()
    if not character or not theme:
        raise HTTPException(status_code=400, detail="請提供角色和主題")
    if style not in story_templates:
        style = "fairy_tale"
    if any(word in character for word in ["公主", "王子", "國王", "女王"]):
        role = "皇室成員"
    elif any(word in character for word in ["魔法師", "巫師", "法師"]):
        role = "魔法師"
    elif any(word in character for word in ["騎士", "勇士", "英雄"]):
        role = "勇者"
    else:
        role = "冒險者"
    template = story_templates[style]
    story_parts = []
    for part in template:
        story_part = part.format(character=character, theme=theme, role=role)
        story_parts.append(story_part)
    full_story = " ".join(story_parts)
    creativity_score = random.uniform(0.7, 0.95)
    return {
        "character": character,
        "theme": theme,
        "style": style,
        "story": full_story,
        "word_count": len(full_story),
        "creativity_score": round(creativity_score, 3),
        "genre": "童話故事" if style == "fairy_tale" else "冒險故事" if style == "adventure" else "詩歌",
        "explanation": f"已為角色「{character}」創作了一個關於「{theme}」的{story_templates[style] and '故事' or '詩歌'}！創意分數: {creativity_score*100:.1f}%"
    }

# ...（其餘 AI 可視化 API 依 main.py 原樣搬移）...

# neural_network_visualization
@router.post("/api/neural-network-visualization")
async def neural_network_visualization(request: dict):
    try:
        layers = request.get("layers", [4, 6, 4, 2])
        input_data = request.get("input", [1.0, 0.5, -0.2, 0.8])
        network_structure = []
        for i in range(len(layers)):
            layer_info = {
                "layer_index": i,
                "neuron_count": layers[i],
                "layer_type": "input" if i == 0 else "output" if i == len(layers)-1 else "hidden",
                "neurons": []
            }
            for j in range(layers[i]):
                neuron = {
                    "neuron_index": j,
                    "bias": round(np.random.uniform(-1, 1), 3),
                    "activation": 0,
                    "weights": []
                }
                if i > 0:
                    for k in range(layers[i-1]):
                        weight = round(np.random.uniform(-2, 2), 3)
                        neuron["weights"].append({
                            "from_neuron": k,
                            "weight": weight
                        })
                if i == 0:
                    neuron["activation"] = input_data[j] if j < len(input_data) else 0
                else:
                    neuron["activation"] = round(np.random.uniform(0, 1), 3)
                layer_info["neurons"].append(neuron)
            network_structure.append(layer_info)
        return {
            "success": True,
            "network_structure": network_structure,
            "input_data": input_data,
            "forward_pass_complete": True,
            "total_parameters": sum(
                layer["neuron_count"] * layers[i-1] + layer["neuron_count"] 
                for i, layer in enumerate(network_structure) if i > 0
            )
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# cnn_visualization
@router.post("/api/cnn-visualization")
async def cnn_visualization(request: dict):
    try:
        image_size = request.get("image_size", 28)
        cnn_layers = [
            {"type": "input", "name": "輸入層", "shape": [image_size, image_size, 1], "description": "原始圖像資料"},
            {"type": "conv2d", "name": "卷積層 1", "filters": 32, "kernel_size": [3, 3], "shape": [26, 26, 32], "description": "特徵提取"},
            {"type": "maxpool", "name": "最大池化層 1", "pool_size": [2, 2], "shape": [13, 13, 32], "description": "降低維度"},
            {"type": "conv2d", "name": "卷積層 2", "filters": 64, "kernel_size": [3, 3], "shape": [11, 11, 64], "description": "深層特徵"},
            {"type": "maxpool", "name": "最大池化層 2", "pool_size": [2, 2], "shape": [5, 5, 64], "description": "進一步壓縮"},
            {"type": "flatten", "name": "展平層", "shape": [1600], "description": "轉為一維"},
            {"type": "dense", "name": "全連接層", "units": 128, "shape": [128], "description": "特徵整合"},
            {"type": "output", "name": "輸出層", "units": 10, "shape": [10], "description": "分類結果"}
        ]
        sample_kernels = [
            {"name": "邊緣檢測", "kernel": [[-1, -1, -1], [0, 0, 0], [1, 1, 1]]},
            {"name": "模糊", "kernel": [[0.1, 0.1, 0.1], [0.1, 0.2, 0.1], [0.1, 0.1, 0.1]]},
            {"name": "銳化", "kernel": [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]}
        ]
        return {
            "success": True,
            "architecture": cnn_layers,
            "sample_kernels": sample_kernels,
            "total_parameters": 93322,
            "explanation": "CNN 通過卷積層提取特徵，池化層降低維度，最後通過全連接層進行分類"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# rnn_visualization
@router.post("/api/rnn-visualization")
async def rnn_visualization(request: dict):
    try:
        sequence_length = request.get("sequence_length", 8)
        hidden_size = request.get("hidden_size", 64)
        time_steps = []
        hidden_state = np.random.uniform(-1, 1, hidden_size)
        for t in range(sequence_length):
            input_vector = np.random.uniform(-1, 1, 10)
            W_ih = np.random.uniform(-0.5, 0.5, (hidden_size, 10))
            W_hh = np.random.uniform(-0.5, 0.5, (hidden_size, hidden_size))
            new_hidden = np.tanh(np.dot(W_ih, input_vector) + np.dot(W_hh, hidden_state))
            time_steps.append({
                "time_step": t,
                "input": input_vector.tolist()[:5],
                "hidden_state_prev": hidden_state.tolist()[:10],
                "hidden_state_new": new_hidden.tolist()[:10],
                "output": (new_hidden[:5] * 0.5).tolist()
            })
            hidden_state = new_hidden
        return {
            "success": True,
            "sequence_length": sequence_length,
            "hidden_size": hidden_size,
            "time_steps": time_steps,
            "explanation": "RNN 在每個時間步驟都會更新隱藏狀態，並將資訊傳遞到下一個時間步驟",
            "use_cases": ["自然語言處理", "時序預測", "語音識別"]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# gan_visualization 及其依賴
@router.post("/api/gan-visualization")
async def gan_visualization(request: dict):
    try:
        noise_dim = request.get("noise_dim", 100)
        generator_layers = [
            {"name": "噪聲輸入", "size": noise_dim, "type": "input"},
            {"name": "隱藏層 1", "size": 256, "type": "dense", "activation": "relu"},
            {"name": "隱藏層 2", "size": 512, "type": "dense", "activation": "relu"},
            {"name": "隱藏層 3", "size": 784, "type": "dense", "activation": "relu"},
            {"name": "輸出層", "size": 784, "type": "dense", "activation": "tanh"},
            {"name": "重塑", "size": [28, 28, 1], "type": "reshape"}
        ]
        discriminator_layers = [
            {"name": "圖像輸入", "size": [28, 28, 1], "type": "input"},
            {"name": "展平", "size": 784, "type": "flatten"},
            {"name": "隱藏層 1", "size": 512, "type": "dense", "activation": "relu"},
            {"name": "隱藏層 2", "size": 256, "type": "dense", "activation": "relu"},
            {"name": "輸出層", "size": 1, "type": "dense", "activation": "sigmoid"}
        ]
        training_progress = []
        for epoch in range(0, 101, 10):
            g_loss = 2.0 * np.exp(-epoch/50) + np.random.normal(0, 0.1)
            d_loss = 1.5 * np.exp(-epoch/60) + np.random.normal(0, 0.1) + 0.3
            training_progress.append({
                "epoch": epoch,
                "generator_loss": round(max(0, g_loss), 3),
                "discriminator_loss": round(max(0, d_loss), 3),
                "quality_score": round(min(1.0, epoch/100), 2)
            })
        generated_faces = []
        training_samples = []
        for i, stage in enumerate(training_progress):
            sample_image = generate_mock_face_image(stage["quality_score"], i)
            training_samples.append(sample_image)
        for i in range(16):
            face_image = generate_mock_face_image(0.9, i)
            generated_faces.append(face_image)
        interpolation_images = []
        for i in range(11):
            interp_image = generate_mock_interpolation_image(i / 10.0)
            interpolation_images.append(interp_image)
        return {
            "success": True,
            "generator": {
                "layers": generator_layers,
                "purpose": "生成假圖像"
            },
            "discriminator": {
                "layers": discriminator_layers,
                "purpose": "判斷圖像真假"
            },
            "training_progress": training_progress,
            "generated_faces": generated_faces,
            "training_samples": training_samples,
            "interpolation_images": interpolation_images,
            "explanation": "生成器試圖創造逼真的假圖像，判別器試圖區分真假圖像，兩者相互對抗訓練",
            "applications": ["圖像生成", "資料增強", "風格轉換", "藝術創作"]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def generate_mock_face_image(quality_score, seed):
    np.random.seed(seed)
    noise_level = max(0, 1 - quality_score)
    clarity = min(1, quality_score + 0.1)
    face_color = f"hsl({np.random.randint(20, 40)}, {int(50 + clarity * 30)}%, {int(70 + clarity * 20)}%)"
    eye_size = max(3, int(8 * clarity))
    mouth_curve = "Q50,60 60,55" if quality_score > 0.5 else "L60,55"
    noise_circles = ""
    if noise_level > 0:
        for _ in range(int(noise_level * 20)):
            x = np.random.randint(10, 90)
            y = np.random.randint(10, 90)
            r = np.random.randint(1, 3)
            noise_circles += f'<circle cx="{x}" cy="{y}" r="{r}" fill="rgba(0,0,0,{noise_level * 0.3})" />'
    svg_content = f'''
    <svg width="150" height="150" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#f0f0f0"/>
        <ellipse cx="50" cy="50" rx="25" ry="30" fill="{face_color}" opacity="{clarity}"/>
        <circle cx="42" cy="42" r="{eye_size}" fill="#333" opacity="{clarity}"/>
        <circle cx="58" cy="42" r="{eye_size}" fill="#333" opacity="{clarity}"/>
        <circle cx="42" cy="42" r="{max(1, eye_size-3)}" fill="#fff" opacity="{clarity}"/>
        <circle cx="58" cy="42" r="{max(1, eye_size-3)}" fill="#fff" opacity="{clarity}"/>
        <ellipse cx="50" cy="52" rx="2" ry="4" fill="#d4a574" opacity="{clarity}"/>
        <path d="M40,55 {mouth_curve}" stroke="#8B4513" stroke-width="2" fill="none" opacity="{clarity}"/>
        {noise_circles}
        <text x="5" y="95" font-family="Arial" font-size="8" fill="#666">Q:{quality_score:.1f}</text>
    </svg>
    '''
    svg_bytes = svg_content.encode('utf-8')
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

def generate_mock_interpolation_image(interpolation_value):
    face_roundness = 25 - (interpolation_value * 10)
    hair_length = 10 + (interpolation_value * 15)
    svg_content = f'''
    <svg width="150" height="150" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#f8f8f8"/>
        <ellipse cx="50" cy="50" rx="{face_roundness}" ry="30" fill="hsl(25, 60%, 75%)"/>
        <ellipse cx="50" cy="{35 - hair_length/2}" rx="26" ry="{hair_length}" fill="hsl(30, 40%, 30%)"/>
        <circle cx="42" cy="45" r="3" fill="#333"/>
        <circle cx="58" cy="45" r="3" fill="#333"/>
        <path d="M45,58 Q50,62 55,58" stroke="#8B4513" stroke-width="2" fill="none"/>
        <text x="5" y="95" font-family="Arial" font-size="8" fill="#666">{int(interpolation_value * 100)}%</text>
    </svg>
    '''
    svg_bytes = svg_content.encode('utf-8')
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

@router.post("/api/attention-mechanism")
async def attention_mechanism(request: dict):
    try:
        sequence = request.get("sequence", ["我", "愛", "學習", "人工", "智慧"])
        seq_len = len(sequence)
        attention_weights = np.random.uniform(0, 1, (seq_len, seq_len))
        for i in range(seq_len):
            attention_weights[i] = attention_weights[i] / np.sum(attention_weights[i])
        attention_matrix = []
        for i in range(seq_len):
            row = []
            for j in range(seq_len):
                row.append({
                    "from_token": sequence[i],
                    "to_token": sequence[j],
                    "weight": round(attention_weights[i][j], 3)
                })
            attention_matrix.append(row)
        multi_head_attention = []
        for head in range(8):
            head_weights = np.random.uniform(0, 1, (seq_len, seq_len))
            for i in range(seq_len):
                head_weights[i] = head_weights[i] / np.sum(head_weights[i])
            multi_head_attention.append({
                "head_number": head + 1,
                "attention_pattern": head_weights.tolist(),
                "focus": f"注意力頭 {head + 1} 專注於{'語法' if head < 4 else '語義'}關係"
            })
        return {
            "success": True,
            "sequence": sequence,
            "attention_matrix": attention_matrix,
            "multi_head_attention": multi_head_attention,
            "explanation": "注意力機制讓模型能夠專注於輸入序列中最重要的部分",
            "key_concepts": [
                "Query (查詢)：要注意什麼",
                "Key (鍵值)：被注意的內容", 
                "Value (數值)：實際的資訊",
                "多頭注意力：同時關注不同類型的關係"
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/api/transformer-visualization")
async def transformer_visualization(request: dict):
    try:
        encoder_components = [
            {"name": "輸入嵌入", "description": "將文字轉換為向量"},
            {"name": "位置編碼", "description": "添加位置資訊"},
            {"name": "多頭自注意力", "description": "理解詞語間關係"},
            {"name": "殘差連接 + 層正規化", "description": "穩定訓練"},
            {"name": "前饋網路", "description": "非線性轉換"},
            {"name": "殘差連接 + 層正規化", "description": "最終輸出"}
        ]
        decoder_components = [
            {"name": "輸出嵌入", "description": "目標序列嵌入"},
            {"name": "位置編碼", "description": "位置資訊"},
            {"name": "掩碼多頭自注意力", "description": "防止未來資訊洩漏"},
            {"name": "殘差連接 + 層正規化", "description": "穩定性"},
            {"name": "編碼器-解碼器注意力", "description": "關注輸入序列"},
            {"name": "殘差連接 + 層正規化", "description": "整合資訊"},
            {"name": "前饋網路", "description": "特徵轉換"},
            {"name": "殘差連接 + 層正規化", "description": "最終處理"}
        ]
        attention_heads_specialization = [
            {"head": 1, "specialization": "主詞-動詞關係", "example": "我 → 學習"},
            {"head": 2, "specialization": "形容詞-名詞關係", "example": "人工 → 智慧"},
            {"head": 3, "specialization": "語法結構", "example": "句法分析"},
            {"head": 4, "specialization": "語義關聯", "example": "概念關係"},
            {"head": 5, "specialization": "長距離依賴", "example": "跨句關係"},
            {"head": 6, "specialization": "時序關係", "example": "時間順序"},
            {"head": 7, "specialization": "共指解析", "example": "代詞指向"},
            {"head": 8, "specialization": "情感分析", "example": "情緒識別"}
        ]
        training_metrics = []
        for step in range(0, 10001, 1000):
            loss = 8.0 * np.exp(-step/3000) + np.random.normal(0, 0.1)
            perplexity = np.exp(max(0, loss))
            training_metrics.append({
                "step": step,
                "loss": round(max(0, loss), 3),
                "perplexity": round(perplexity, 2),
                "bleu_score": round(min(1.0, step/10000 * 0.8 + np.random.normal(0, 0.05)), 3)
            })
        return {
            "success": True,
            "architecture": {
                "encoder": encoder_components,
                "decoder": decoder_components
            },
            "attention_heads": attention_heads_specialization,
            "training_metrics": training_metrics,
            "key_innovations": [
                "並行處理：不需要序列計算",
                "自注意力：直接建模長距離依賴",
                "多頭注意力：同時關注多種關係",
                "位置編碼：保留序列位置資訊"
            ],
            "applications": [
                "機器翻譯 (Google Translate)",
                "文字生成 (ChatGPT)",
                "程式碼生成 (GitHub Copilot)",
                "圖像理解 (Vision Transformer)"
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# 其餘 AI 相關 API 依此類推... 

# ========== 弱監督學習 API 端點 ==========

@router.get("/api/device_power")
async def get_device_power(device_id: str):
    """獲取指定設備的電力數據"""
    try:
        # 從資料庫獲取設備的歷史數據
        query = """
        SELECT "createdAt", power, voltage, currents, battery, "networkState"
        FROM ammeter_log 
        WHERE "deviceNumber" = $1 AND action = 'ammeterDetail' AND success = true
        ORDER BY "createdAt" DESC 
        LIMIT 100
        """
        
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(query, device_id)
        finally:
            await conn.close()
        
        if not rows:
            return {"data": []}
        
        # 轉換數據格式
        data = []
        for row in reversed(rows):  # 按時間順序排列
            data.append({
                "timestamp": row["createdAt"].isoformat() if row["createdAt"] else "",
                "value": float(row["power"]) if row["power"] is not None else 0.0,
                "voltage": float(row["voltage"]) if row["voltage"] is not None else 0.0,
                "currents": float(row["currents"]) if row["currents"] is not None else 0.0,
                "battery": float(row["battery"]) if row["battery"] is not None else 0.0,
                "networkState": int(row["networkState"]) if row["networkState"] is not None else 1
            })
        
        return {"data": data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取設備數據失敗: {str(e)}")

@router.post("/api/train_pu_detector")
async def train_pu_detector(data: TrainPUDetectorRequest):
    """訓練 PU 學習檢測器"""
    try:
        # 獲取設備的歷史數據
        query = """
        SELECT "createdAt", power, voltage, currents, battery, "networkState"
        FROM ammeter_log 
        WHERE "deviceNumber" = $1 AND action = 'ammeterDetail' AND success = true
        ORDER BY "createdAt" ASC
        """
        
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(query, data.device_id)
        finally:
            await conn.close()
        
        if not rows:
            raise HTTPException(status_code=400, detail="沒有找到設備數據")
        
        # 轉換為時間序列數據
        timestamps = [row["createdAt"].isoformat() for row in rows]
        power_values = [float(row["power"]) if row["power"] is not None else 0.0 for row in rows]
        
        # 創建標籤：正樣本為 1，其他為 0
        labels = [0] * len(timestamps)
        for pos_timestamp in data.positive_timestamps:
            if pos_timestamp in timestamps:
                idx = timestamps.index(pos_timestamp)
                labels[idx] = 1
        
        # 簡單的 PU 學習算法：使用正樣本和未標註樣本訓練
        # 這裡使用一個簡單的閾值方法作為示例
        positive_powers = [power_values[i] for i, label in enumerate(labels) if label == 1]
        if not positive_powers:
            raise HTTPException(status_code=400, detail="沒有有效的正樣本")
        
        # 計算正樣本的平均功率和標準差
        mean_positive = np.mean(positive_powers)
        std_positive = np.std(positive_powers)
        
        # 為所有數據點計算分數（基於與正樣本的相似度）
        scores = []
        for power in power_values:
            # 使用高斯相似度
            similarity = np.exp(-0.5 * ((power - mean_positive) / (std_positive + 1e-6)) ** 2)
            scores.append(float(similarity))
        
        return {
            "success": True,
            "scores": scores,
            "positive_samples": len(positive_powers),
            "mean_positive_power": float(mean_positive),
            "std_positive_power": float(std_positive),
            "explanation": f"基於 {len(positive_powers)} 個正樣本訓練的 PU 學習模型，平均功率為 {mean_positive:.2f}W"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PU 學習訓練失敗: {str(e)}")

@router.get("/api/uu_data")
async def get_uu_data(device_id: str):
    """獲取 UU 學習的數據"""
    try:
        # 從資料庫獲取設備的歷史數據
        query = """
        SELECT "createdAt", power, voltage, currents, battery
        FROM ammeter_log 
        WHERE "deviceNumber" = $1 AND action = 'ammeterDetail' AND success = true
        ORDER BY "createdAt" ASC
        """
        
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(query, device_id)
        finally:
            await conn.close()
        
        if not rows:
            return {"dataA": [], "dataB": []}
        
        # 轉換數據為特徵向量
        features = []
        for row in rows:
            features.append([
                float(row["power"]) if row["power"] is not None else 0.0,  # power
                float(row["voltage"]) if row["voltage"] is not None else 0.0,  # voltage
                float(row["currents"]) if row["currents"] is not None else 0.0,  # currents
                float(row["battery"]) if row["battery"] is not None else 0.0   # battery
            ])
        
        # 將數據分成兩組，模擬不同的分布
        n = len(features)
        split_point = n // 2
        
        # 第一組：正常運行時段（假設前半段）
        dataA = features[:split_point]
        
        # 第二組：高負載時段（假設後半段，並添加一些變化）
        dataB = features[split_point:]
        
        # 為第二組添加一些變化來模擬不同的分布
        for i in range(len(dataB)):
            dataB[i] = [val * (1 + 0.1 * np.random.normal(0, 1)) for val in dataB[i]]
        
        return {
            "dataA": dataA,
            "dataB": dataB,
            "explanation": f"將 {n} 個數據點分成兩組，模擬不同運行狀態下的數據分布"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取 UU 數據失敗: {str(e)}")

@router.post("/api/train_uu_classifier")
async def train_uu_classifier(data: TrainUUClassifierRequest):
    """訓練 UU 學習分類器"""
    try:
        # 獲取 UU 數據
        uu_response = await get_uu_data(data.device_id)
        dataA = uu_response["dataA"]
        dataB = uu_response["dataB"]
        
        if not dataA or not dataB:
            raise HTTPException(status_code=400, detail="沒有足夠的數據進行 UU 學習")
        
        # 計算兩組數據的統計特性
        dataA_array = np.array(dataA)
        dataB_array = np.array(dataB)
        
        meanA = np.mean(dataA_array, axis=0)
        meanB = np.mean(dataB_array, axis=0)
        stdA = np.std(dataA_array, axis=0)
        stdB = np.std(dataB_array, axis=0)
        
        # 計算分布差異
        distribution_diff = np.abs(meanB - meanA) / (stdA + stdB + 1e-6)
        
        # 使用分布差異來訓練簡單的分類器
        # 這裡使用一個基於距離的分類方法
        all_data = dataA + dataB
        labels = []
        
        for point in all_data:
            # 計算到兩組中心的距離
            dist_to_A = np.linalg.norm(np.array(point) - meanA)
            dist_to_B = np.linalg.norm(np.array(point) - meanB)
            
            # 根據距離分配標籤
            if dist_to_A < dist_to_B:
                labels.append(0)  # 屬於組 A
            else:
                labels.append(1)  # 屬於組 B
        
        # 計算分類邊界（簡單的線性邊界）
        boundary = {
            "center": ((meanA + meanB) / 2).tolist(),
            "direction": (meanB - meanA).tolist(),
            "threshold": np.linalg.norm(meanB - meanA) / 2
        }
        
        return {
            "success": True,
            "labels": labels,
            "boundary": boundary,
            "distribution_diff": distribution_diff.tolist(),
            "groupA_size": len(dataA),
            "groupB_size": len(dataB),
            "explanation": f"UU 學習成功識別出兩組數據的分布差異，共標註了 {len(labels)} 個數據點"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"UU 學習訓練失敗: {str(e)}") 
