#!/usr/bin/env python3
"""
詳細檢查風格轉換返回的圖片數據
"""

import requests
import json
import base64
import hashlib

def debug_style_transfer_images():
    """詳細檢查風格轉換返回的圖片數據"""
    
    url = "http://localhost:8000/api/style-transfer"
    
    # 創建測試圖片
    test_svg = '''
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="blue"/>
        <circle cx="50" cy="50" r="30" fill="red"/>
    </svg>
    '''
    test_image_base64 = base64.b64encode(test_svg.encode('utf-8')).decode('utf-8')
    
    # 測試風格
    styles = ["vangogh", "ukiyo-e", "pixar", "watercolor", "oil_painting"]
    
    print("🔍 詳細檢查風格轉換圖片數據")
    print("="*80)
    
    results = {}
    
    for style in styles:
        print(f"\n📸 測試風格: {style}")
        print("-" * 50)
        
        payload = {
            "image_data": test_image_base64,
            "style": style
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                result_image = result.get('result_image', '')
                
                # 計算圖片數據的哈希值
                image_hash = hashlib.md5(result_image.encode()).hexdigest()
                
                results[style] = {
                    'image_data': result_image,
                    'hash': image_hash,
                    'length': len(result_image)
                }
                
                print(f"📊 圖片數據長度: {len(result_image)} 字符")
                print(f"🔐 圖片哈希值: {image_hash}")
                print(f"📝 圖片數據前100字符: {result_image[:100]}...")
                
            else:
                print(f"❌ 請求失敗: {response.status_code}")
                
        except Exception as e:
            print(f"❌ 異常: {e}")
    
    # 分析結果
    print("\n" + "="*80)
    print("📊 分析結果")
    print("="*80)
    
    # 檢查是否有重複的圖片
    hash_values = [results[style]['hash'] for style in results]
    unique_hashes = set(hash_values)
    
    print(f"🎯 總共測試了 {len(styles)} 種風格")
    print(f"🔐 發現 {len(unique_hashes)} 個不同的圖片哈希值")
    print(f"📈 圖片多樣性: {len(unique_hashes)}/{len(styles)} = {len(unique_hashes)/len(styles)*100:.1f}%")
    
    if len(unique_hashes) == len(styles):
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
                styles_with_hash = [s for s in styles if results[s]['hash'] == hash_val]
                print(f"   {hash_val}: {styles_with_hash}")
    
    # 顯示每種風格的詳細信息
    print(f"\n📋 詳細結果:")
    for style in styles:
        result = results[style]
        print(f"   {style}: {result['hash']} ({result['length']} 字符)")

if __name__ == "__main__":
    debug_style_transfer_images() 
