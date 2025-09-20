/**
 * API 優化效果測試腳本
 *
 * 在瀏覽器控制台中運行此腳本來驗證 API 調用去重和緩存效果
 */

// 模擬重複 API 調用測試
async function testApiDeduplication() {
  console.log('🧪 開始測試 API 調用去重效果...')

  // 測試同時發起多個相同的請求
  const testUrl = 'https://weakrisk.yinchen.tw/api/v1/experiment-runs'

  console.log('📡 同時發起 5 個相同的 API 請求...')
  const startTime = Date.now()

  // 同時發起 5 個請求
  const promises = Array(5)
    .fill()
    .map((_, i) => {
      console.log(`發起請求 ${i + 1}`)
      return fetch(testUrl).then(res => res.json())
    })

  try {
    const results = await Promise.all(promises)
    const endTime = Date.now()

    console.log(`✅ 所有請求完成，耗時: ${endTime - startTime}ms`)
    console.log(`📊 返回結果數量: ${results.length}`)

    // 檢查是否所有結果都相同（說明是同一個請求的結果）
    const firstResult = JSON.stringify(results[0])
    const allSame = results.every(result => JSON.stringify(result) === firstResult)

    if (allSame) {
      console.log('✅ 所有結果相同，去重機制可能有效')
    } else {
      console.log('⚠️ 結果不同，可能沒有去重')
    }
  } catch (error) {
    console.error('❌ 測試失敗:', error)
  }
}

// 測試緩存機制
async function testApiCaching() {
  console.log('🗃️ 開始測試 API 緩存機制...')

  const testUrl = 'https://weakrisk.yinchen.tw/api/v1/experiment-runs'

  // 第一次請求
  console.log('📡 發起第一次請求...')
  const start1 = Date.now()
  const result1 = await fetch(testUrl).then(res => res.json())
  const time1 = Date.now() - start1
  console.log(`⏱️ 第一次請求耗時: ${time1}ms`)

  // 等待一秒後第二次請求
  console.log('⏳ 等待 1 秒...')
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('📡 發起第二次請求...')
  const start2 = Date.now()
  const result2 = await fetch(testUrl).then(res => res.json())
  const time2 = Date.now() - start2
  console.log(`⏱️ 第二次請求耗時: ${time2}ms`)

  if (time2 < time1 * 0.5) {
    console.log('✅ 第二次請求明顯更快，緩存可能有效')
  } else {
    console.log('⚠️ 第二次請求沒有明顯加速，檢查緩存配置')
  }

  console.log(`📈 性能提升: ${(((time1 - time2) / time1) * 100).toFixed(1)}%`)
}

// 檢查全局 API 管理器
function checkGlobalApiManager() {
  console.log('🔍 檢查全局 API 管理器...')

  if (typeof window !== 'undefined' && window.globalApiManager) {
    console.log('✅ 全局 API 管理器已載入')
    console.log('📊 當前緩存大小:', window.globalApiManager.cache.size)
    console.log('📊 正在進行的請求:', window.globalApiManager.pendingRequests.size)
  } else {
    console.log('⚠️ 全局 API 管理器未找到')
  }
}

// 主測試函數
async function runAllTests() {
  console.log('🚀 開始 API 優化測試套件...\n')

  checkGlobalApiManager()
  console.log('\n')

  await testApiDeduplication()
  console.log('\n')

  await testApiCaching()
  console.log('\n')

  console.log('🎉 所有測試完成！')
}

// 如果在瀏覽器環境中，自動運行測試
if (typeof window !== 'undefined') {
  // 延遲 3 秒運行，確保頁面加載完成
  setTimeout(() => {
    console.log('📋 API 優化測試腳本已載入')
    console.log('💡 手動運行: runAllTests()')
    console.log('💡 單獨測試去重: testApiDeduplication()')
    console.log('💡 單獨測試緩存: testApiCaching()')

    // 暴露測試函數到全局
    window.testApiOptimization = {
      runAllTests,
      testApiDeduplication,
      testApiCaching,
      checkGlobalApiManager,
    }
  }, 3000)
}

export { runAllTests, testApiDeduplication, testApiCaching, checkGlobalApiManager }
