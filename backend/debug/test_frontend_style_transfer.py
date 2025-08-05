#!/usr/bin/env python3
"""
測試前端風格轉換的完整流程
"""

import requests
import json
import base64
import time
import hashlib

def test_frontend_style_transfer():
    """測試前端風格轉換的完整流程"""
    
    # API 端點
    url = "http://localhost:8000/api/style-transfer"
    
    # 創建一個測試圖片（模擬前端上傳的圖片）
    test_svg = '''
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="lightblue"/>
        <circle cx="100" cy="100" r="50" fill="red"/>
        <text x="100" y="120" text-anchor="middle" fill="white" font-size="16">Test</text>
    </svg>
    '''
    
    # 模擬前端的 base64 轉換（移除 data URL 前綴）
    test_image_base64 = base64.b64encode(test_svg.encode('utf-8')).decode('utf-8')
    
    # 測試不同的風格
    styles_to_test = ["vangogh", "ukiyo-e", "pixar", "watercolor", "oil_painting"]
    
    print("🧪 測試前端風格轉換完整流程")
    print("="*80)
    
    results = {}
    
    for i, style in enumerate(styles_to_test, 1):
        print(f"\n📸 測試 {i}/{len(styles_to_test)}: {style}")
        print("-" * 60)
        
        # 構建前端請求數據
        payload = {
            "image_data": test_image_base64,
            "style": style
        }
        
        try:
            # 發送請求
            start_time = time.time()
            response = requests.post(url, json=payload, timeout=10)
            elapsed_time = time.time() - start_time
            
            print(f"⏱️  響應時間: {elapsed_time:.2f} 秒")
            print(f"📊 狀態碼: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # 檢查返回的數據結構
                print(f"✅ 成功!")
                print(f"🎨 返回風格: {result.get('style', 'N/A')}")
                print(f"📝 風格描述: {result.get('style_description', 'N/A')}")
                print(f"⏱️  處理時間: {result.get('processing_time', 'N/A')} 秒")
                print(f"📈 成功率: {result.get('success_rate', 'N/A')}")
                
                # 檢查返回的圖片數據
                result_image = result.get('result_image', '')
                print(f"📊 圖片數據長度: {len(result_image)} 字符")
                
                # 計算圖片數據的哈希值
                image_hash = hashlib.md5(result_image.encode()).hexdigest()
                print(f"🔐 圖片哈希值: {image_hash}")
                
                # 檢查圖片數據格式
                if result_image.startswith('data:image/'):
                    print(f"✅ 圖片數據格式正確 (data URL)")
                else:
                    print(f"⚠️  圖片數據格式異常")
                
                # 檢查是否包含風格信息
                if style in result_image:
                    print(f"✅ 圖片數據包含風格標識: {style}")
                else:
                    print(f"⚠️  圖片數據不包含風格標識")
                
                # 儲存結果
                results[style] = {
                    'image_data': result_image,
                    'hash': image_hash,
                    'length': len(result_image),
                    'style': result.get('style', ''),
                    'description': result.get('style_description', ''),
                    'processing_time': result.get('processing_time', 0),
                    'success_rate': result.get('success_rate', 0)
                }
                
            else:
                print(f"❌ 失敗: {response.status_code}")
                print(f"錯誤信息: {response.text}")
                
        except Exception as e:
            print(f"❌ 異常: {e}")
    
    # 分析結果
    print("\n" + "="*80)
    print("📊 分析結果")
    print("="*80)
    
    if not results:
        print("❌ 沒有成功的測試結果")
        return
    
    # 檢查是否有重複的圖片
    hash_values = [results[style]['hash'] for style in results]
    unique_hashes = set(hash_values)
    
    print(f"🎯 總共測試了 {len(styles_to_test)} 種風格")
    print(f"✅ 成功處理了 {len(results)} 種風格")
    print(f"🔐 發現 {len(unique_hashes)} 個不同的圖片哈希值")
    print(f"📈 圖片多樣性: {len(unique_hashes)}/{len(results)} = {len(unique_hashes)/len(results)*100:.1f}%")
    
    if len(unique_hashes) == len(results):
        print("✅ 每種風格都返回了不同的圖片！")
    else:
        print("⚠️  發現重複的圖片數據")
        
        # 找出重複的圖片
        hash_count = {}
        for hash_val in hash_values:
            hash_count[hash_val] = hash_count.get(hash_val, 0) + 1
        
        duplicates = {h: c for h, c in hash_count.items() if c > 1}
        if duplicates:
            print("🔄 重複的圖片哈希值:")
            for hash_val, count in duplicates.items():
                styles_with_hash = [s for s in results.keys() if results[s]['hash'] == hash_val]
                print(f"   {hash_val}: {styles_with_hash}")
    
    # 顯示每種風格的詳細信息
    print(f"\n📋 詳細結果:")
    for style in results:
        result = results[style]
        print(f"   {style}:")
        print(f"     - 哈希值: {result['hash']}")
        print(f"     - 數據長度: {result['length']} 字符")
        print(f"     - 處理時間: {result['processing_time']} 秒")
        print(f"     - 成功率: {result['success_rate']:.3f}")
        print(f"     - 風格描述: {result['description']}")
    
    # 檢查處理時間的變化
    processing_times = [results[style]['processing_time'] for style in results]
    if len(set(processing_times)) > 1:
        print(f"\n⏱️  處理時間變化: {min(processing_times):.2f}s - {max(processing_times):.2f}s")
    else:
        print(f"\n⏱️  所有風格處理時間相同: {processing_times[0]:.2f}s")
    
    # 檢查成功率的變化
    success_rates = [results[style]['success_rate'] for style in results]
    if len(set(success_rates)) > 1:
        print(f"📈 成功率變化: {min(success_rates):.3f} - {max(success_rates):.3f}")
    else:
        print(f"📈 所有風格成功率相同: {success_rates[0]:.3f}")

if __name__ == "__main__":
    test_frontend_style_transfer() 
