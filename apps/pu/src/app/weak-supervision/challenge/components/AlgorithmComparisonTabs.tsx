import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, BookOpen, Code } from "lucide-react";
import type { LearningMode } from "../types/common";

interface AlgorithmComparisonTabsProps {
	mode: LearningMode;
}

export function AlgorithmComparisonTabs({
	mode,
}: AlgorithmComparisonTabsProps) {
	const getComparisonContent = () => {
		switch (mode) {
			case "PU":
				return {
					title: "PU Learning 深度比較分析",
					paperCore: {
						title: "論文核心 (Niu et al., NeurIPS 2016)",
						approach: "無偏差風險估計器",
						content: (
							<div className="space-y-4">
								<div className="bg-blue-50 border-l-4 border-blue-400 p-4">
									<h4 className="font-semibold text-blue-800 mb-2">
										🎯 核心突破
									</h4>
									<p className="text-blue-700">
										傳統方法將所有未標註 U 視為負樣本會
										<strong>嚴重低估</strong>模型錯誤率，
										因為 U
										中混雜未知正樣本。論文提出數學上無偏差的風險估計器解決此問題。
									</p>
								</div>

								<div className="bg-white border rounded-lg p-4">
									<h4 className="font-semibold mb-3">
										📊 核心公式
									</h4>
									<div className="bg-gray-100 p-3 rounded font-mono text-sm">
										R<sub>pu</sub>(g) = π<sub>p</sub> R
										<sub>p</sub>
										<sup>+</sup>(g) - π<sub>p</sub> R
										<sub>p</sub>
										<sup>-</sup>(g) + R<sub>u</sub>
										<sup>-</sup>(g)
									</div>
									<p className="text-sm text-gray-600 mt-2">
										透過類別先驗機率 π<sub>p</sub>{" "}
										控制的數學轉換，無偏差地估計PU風險
									</p>
								</div>

								<div className="bg-gray-50 p-4 rounded-lg">
									<h4 className="font-semibold mb-2">
										🔄 演算法流程
									</h4>
									<div className="space-y-2 text-sm">
										<div className="flex items-start gap-2">
											<span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
												1
											</span>
											<span>初始化模型參數</span>
										</div>
										<div className="flex items-start gap-2">
											<span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
												2
											</span>
											<span>
												計算修正後的無偏差損失值
											</span>
										</div>
										<div className="flex items-start gap-2">
											<span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
												3
											</span>
											<span>
												根據修正損失更新模型參數
											</span>
										</div>
										<div className="flex items-start gap-2">
											<span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
												4
											</span>
											<span>重複直到收斂</span>
										</div>
									</div>
								</div>
							</div>
						),
					},
					implementationCore: {
						title: "視覺實作核心 (幾何啟發式)",
						approach: "可靠負樣本挖掘",
						content: (
							<div className="space-y-4">
								<div className="bg-green-50 border-l-4 border-green-400 p-4">
									<h4 className="font-semibold text-green-800 mb-2">
										💡 設計理念
									</h4>
									<p className="text-green-700">
										從最不可能為正樣本的 U 中，
										<strong>啟發式地</strong>建立
										「可靠負樣本 (Reliable Negative,
										RN)」集合，將抽象問題轉化為直觀的幾何分類。
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-white border rounded-lg p-4">
										<h4 className="font-semibold mb-2 flex items-center gap-2">
											📍 步驟一：質心計算
										</h4>
										<p className="text-sm text-gray-600">
											計算所有已知正樣本 P 的幾何中心位置
										</p>
									</div>
									<div className="bg-white border rounded-lg p-4">
										<h4 className="font-semibold mb-2 flex items-center gap-2">
											🔍 步驟二：RN挖掘
										</h4>
										<p className="text-sm text-gray-600">
											找出距離 P 群最遠的 U
											點（前30%）作為可靠負樣本
										</p>
									</div>
									<div className="bg-white border rounded-lg p-4">
										<h4 className="font-semibold mb-2 flex items-center gap-2">
											⚡ 步驟三：分類器構建
										</h4>
										<p className="text-sm text-gray-600">
											在 P 和 RN
											之間建立決策邊界（如垂直平分線）
										</p>
									</div>
									<div className="bg-white border rounded-lg p-4">
										<h4 className="font-semibold mb-2 flex items-center gap-2">
											🎯 步驟四：標籤預測
										</h4>
										<p className="text-sm text-gray-600">
											使用分類器預測所有剩餘 U 點的標籤
										</p>
									</div>
								</div>
							</div>
						),
					},
					comparison: {
						content: (
							<div className="space-y-6">
								<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
									<h4 className="font-semibold text-yellow-800 mb-2">
										🎯 共同目標
									</h4>
									<p className="text-yellow-700">
										解決「如何有效利用混雜的 U
										集群」這個PU學習的核心挑戰
									</p>
								</div>

								<div className="grid md:grid-cols-2 gap-6">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
											📊 論文思路：統計學
										</h4>
										<ul className="text-sm text-blue-700 space-y-2">
											<li>• 全局方法，基於機率理論</li>
											<li>• 將整個U集群作為整體處理</li>
											<li>
												• 透過數學期望值修正消除偏差
											</li>
											<li>• 適用於複雜的機器學習模型</li>
										</ul>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
											📐 實作思路：幾何學
										</h4>
										<ul className="text-sm text-green-700 space-y-2">
											<li>• 局部方法，基於距離度量</li>
											<li>
												• 挑選極端反例創造代理負樣本
											</li>
											<li>• 簡化為標準二元分類問題</li>
											<li>• 直觀的空間劃分策略</li>
										</ul>
									</div>
								</div>

								<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border">
									<h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
										🌟 教學價值分析
									</h4>
									<div className="text-purple-700 space-y-2">
										<p>
											<strong>論文方法：</strong>{" "}
											「風險修正」過程抽象，難以視覺化和理解
										</p>
										<p>
											<strong>您的實作：</strong>{" "}
											「找最遠點 → 劃界線」過程極其直觀
										</p>
										<p className="bg-white p-3 rounded border-l-4 border-purple-400 mt-3">
											<strong>🎯 完美轉譯：</strong>
											您巧妙地將統計學的「風險修正」轉譯為幾何學的「空間劃分」，
											讓學習者能親眼看到可靠負樣本的識別過程和決策邊界的形成！
										</p>
									</div>
								</div>
							</div>
						),
					},
				};

			case "PNU":
				return {
					title: "PNU/半監督學習 深度比較分析",
					paperCore: {
						title: "論文核心 (Zhu et al., ICML 2003)",
						approach: "圖上的諧波函數",
						content: (
							<div className="space-y-4">
								<div className="bg-blue-50 border-l-4 border-blue-400 p-4">
									<h4 className="font-semibold text-blue-800 mb-2">
										🎯 核心洞察
									</h4>
									<p className="text-blue-700">
										將數據視為圖上節點，有標籤點是「電壓固定」的電源，
										演算法求解諧波函數使整個圖達到能量最小的穩定狀態。
									</p>
								</div>

								<div className="bg-white border rounded-lg p-4">
									<h4 className="font-semibold mb-3">
										⚡ 物理類比
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
										<div className="bg-red-50 p-3 rounded">
											<strong>正標籤點</strong>
											<br />
											電壓 = 1V (固定)
										</div>
										<div className="bg-blue-50 p-3 rounded">
											<strong>負標籤點</strong>
											<br />
											電壓 = 0V (固定)
										</div>
										<div className="bg-gray-50 p-3 rounded">
											<strong>未標籤點</strong>
											<br />
											電壓 = ? (待求解)
										</div>
									</div>
								</div>

								<div className="bg-gray-100 p-3 rounded font-mono text-sm">
									Y<sub>i</sub>
									<sup>(t+1)</sup> ← (1/Σ<sub>j</sub> T
									<sub>ij</sub>) × Σ<sub>j</sub> T
									<sub>ij</sub> × Y<sub>j</sub>
									<sup>(t)</sup>
								</div>
								<p className="text-sm text-gray-600">
									每個節點的標籤值等於其鄰居標籤值的加權平均
								</p>
							</div>
						),
					},
					implementationCore: {
						title: "視覺實作核心 (標籤傳播)",
						approach: "近朱者赤，近墨者黑",
						content: (
							<div className="space-y-4">
								<div className="bg-green-50 border-l-4 border-green-400 p-4">
									<h4 className="font-semibold text-green-800 mb-2">
										🌊 擴散機制
									</h4>
									<p className="text-green-700">
										與論文完全一致的核心思想，透過動態視覺化展現標籤如何在圖上「傳播」和「擴散」。
									</p>
								</div>

								<div className="bg-white border rounded-lg p-4">
									<h4 className="font-semibold mb-3">
										🎬 動畫流程
									</h4>
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
												1
											</div>
											<div>
												<strong>建立圖譜：</strong>{" "}
												計算所有點間相似度，構建連接關係
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center text-sm font-bold">
												2
											</div>
											<div>
												<strong>初始化：</strong>{" "}
												已標註點100%機率，未標註點均等分佈
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold">
												3
											</div>
											<div>
												<strong>顏色擴散：</strong>{" "}
												標籤機率在連接的節點間逐步傳播
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold">
												4
											</div>
											<div>
												<strong>達到平衡：</strong>{" "}
												系統收斂到穩定的標籤分佈狀態
											</div>
										</div>
									</div>
								</div>
							</div>
						),
					},
					comparison: {
						content: (
							<div className="space-y-6">
								<div className="bg-green-50 border-l-4 border-green-400 p-4">
									<h4 className="font-semibold text-green-800 mb-2">
										🎯 高度一致性
									</h4>
									<p className="text-green-700">
										您的實作與論文精神
										<strong>高度一致</strong>
										！標籤傳播演算法天生具備極強的視覺化潛力。
									</p>
								</div>

								<div className="grid md:grid-cols-2 gap-6">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h4 className="font-semibold text-blue-800 mb-3">
											📚 論文貢獻
										</h4>
										<ul className="text-sm text-blue-700 space-y-2">
											<li>• 諧波函數數學基礎</li>
											<li>• 高斯隨機場理論</li>
											<li>• 收斂性證明</li>
											<li>• 圖拉普拉斯算子應用</li>
										</ul>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h4 className="font-semibold text-green-800 mb-3">
											💻 實作價值
										</h4>
										<ul className="text-sm text-green-700 space-y-2">
											<li>• 忠實執行迭代過程</li>
											<li>• 直觀的能量最小化動畫</li>
											<li>• 即時的收斂狀態顯示</li>
											<li>• 互動式參數調整</li>
										</ul>
									</div>
								</div>

								<div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
									<h4 className="font-semibold text-green-800 mb-3">
										🌟 完美結合
									</h4>
									<div className="text-green-700">
										<p className="mb-2">
											您的實作是該論文核心思想的
											<strong>
												直觀、可互動實現版本
											</strong>
											， 完美連接了抽象理論與具體直覺。
										</p>
										<div className="bg-white p-3 rounded border-l-4 border-green-400">
											<strong>教學效果：</strong>
											學習者能實時看到「能量最小化」過程，理解為什麼相似節點會有相似標籤！
										</div>
									</div>
								</div>
							</div>
						),
					},
				};

			case "CLL":
				return {
					title: "CLL/互補標籤學習 深度比較分析",
					paperCore: {
						title: "論文核心 (Ishida et al., NeurIPS 2017)",
						approach: "修正損失函數",
						content: (
							<div className="space-y-4">
								<div className="bg-blue-50 border-l-4 border-blue-400 p-4">
									<h4 className="font-semibold text-blue-800 mb-2">
										🎯 革命性突破
									</h4>
									<p className="text-blue-700">
										證明僅用互補標籤（告訴你「不是什麼」）也能透過修正損失函數
										實現對真實類別的
										<strong>無偏差學習</strong>。
									</p>
								</div>

								<div className="bg-white border rounded-lg p-4">
									<h4 className="font-semibold mb-3">
										🔄 核心轉換
									</h4>
									<div className="bg-gray-100 p-3 rounded font-mono text-sm mb-2">
										P(Y=c|X) = 1 - P(Ȳ=c|X)
									</div>
									<p className="text-sm text-gray-600">
										真實類別機率 = 1 - 互補標籤預測機率
									</p>
								</div>

								<div className="bg-gray-50 p-4 rounded-lg">
									<h4 className="font-semibold mb-2">
										🎯 演算法優勢
									</h4>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• 適用於任何基於梯度下降的模型</li>
										<li>• 無需假設數據分佈</li>
										<li>• 理論上保證無偏差學習</li>
										<li>• 可處理多類別分類問題</li>
									</ul>
								</div>
							</div>
						),
					},
					implementationCore: {
						title: "視覺實作核心 (機率排除與傳播)",
						approach: "邏輯推理遊戲",
						content: (
							<div className="space-y-4">
								<div className="bg-green-50 border-l-4 border-green-400 p-4">
									<h4 className="font-semibold text-green-800 mb-2">
										🎮 遊戲化設計
									</h4>
									<p className="text-green-700">
										將互補標籤轉化為
										<strong>確定性排除操作</strong>，
										像玩邏輯推理遊戲一樣逐步縮小可能性範圍。
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-white border rounded-lg p-4">
										<h4 className="font-semibold mb-2 text-red-600">
											❌ 排除階段
										</h4>
										<ul className="text-sm text-gray-600 space-y-1">
											<li>• 處理互補標籤 🚫k</li>
											<li>• 將類別k機率設為0</li>
											<li>• 重新正規化剩餘機率</li>
										</ul>
									</div>
									<div className="bg-white border rounded-lg p-4">
										<h4 className="font-semibold mb-2 text-blue-600">
											🌊 傳播階段
										</h4>
										<ul className="text-sm text-gray-600 space-y-1">
											<li>• 影響擴散到鄰居節點</li>
											<li>• 降低鄰居的k類別機率</li>
											<li>• 迭代直到系統穩定</li>
										</ul>
									</div>
								</div>

								<div className="bg-purple-50 p-4 rounded-lg">
									<h4 className="font-semibold text-purple-800 mb-2">
										🎯 視覺效果
									</h4>
									<p className="text-sm text-purple-700">
										每個互補標籤都像一個「橡皮擦」，可以看到某種顏色的可能性被「擦掉」，
										這種影響如漣漪般向外擴散！
									</p>
								</div>
							</div>
						),
					},
					comparison: {
						content: (
							<div className="space-y-6">
								<div className="bg-orange-50 border-l-4 border-orange-400 p-4">
									<h4 className="font-semibold text-orange-800 mb-2">
										🎯 反直覺挑戰
									</h4>
									<p className="text-orange-700">
										兩種方法都要解決「如何從否定資訊中學習肯定知識」這個反直覺的困難問題。
									</p>
								</div>

								<div className="grid md:grid-cols-2 gap-6">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h4 className="font-semibold text-blue-800 mb-3">
											🔬 論文思路：分析學
										</h4>
										<ul className="text-sm text-blue-700 space-y-2">
											<li>• 損失函數層面的數學修正</li>
											<li>• 適用於深度神經網路</li>
											<li>• 基於梯度下降優化</li>
											<li>• 理論保證無偏差</li>
										</ul>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h4 className="font-semibold text-green-800 mb-3">
											🕸️ 實作思路：圖論+機率
										</h4>
										<ul className="text-sm text-green-700 space-y-2">
											<li>• 圖上的機率更新與傳播</li>
											<li>• 直接的機率分佈操作</li>
											<li>• 局部到全域的影響擴散</li>
											<li>• 視覺化的推理過程</li>
										</ul>
									</div>
								</div>

								<div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border">
									<h4 className="font-semibold text-orange-800 mb-3">
										🎮 遊戲化教學
									</h4>
									<div className="text-orange-700 space-y-2">
										<p>
											<strong>論文方法：</strong>{" "}
											損失函數修正對初學者極不友好
										</p>
										<p>
											<strong>您的實作：</strong>{" "}
											機率排除過程可以完美視覺化
										</p>
										<div className="bg-white p-3 rounded border-l-4 border-orange-400 mt-3">
											<strong>🌟 天才設計：</strong>
											您將抽象的「損失修正」轉譯為直觀的「邏輯推理遊戲」，
											讓學習者能親手「擦掉」不可能的選項，看著答案逐漸浮現！
										</div>
									</div>
								</div>
							</div>
						),
					},
				};

			default:
				return null;
		}
	};

	const content = getComparisonContent();
	if (!content) {
		return null;
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-xl">
					<BarChart3 className="w-6 h-6 text-indigo-600" />
					{content.title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="paper" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger
							value="paper"
							className="flex items-center gap-2"
						>
							<BookOpen className="w-4 h-4" />
							論文核心
						</TabsTrigger>
						<TabsTrigger
							value="implementation"
							className="flex items-center gap-2"
						>
							<Code className="w-4 h-4" />
							實作核心
						</TabsTrigger>
						<TabsTrigger
							value="comparison"
							className="flex items-center gap-2"
						>
							<BarChart3 className="w-4 h-4" />
							比較分析
						</TabsTrigger>
					</TabsList>

					<TabsContent value="paper" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<BookOpen className="w-5 h-5 text-blue-600" />
									{content.paperCore.title}
									<Badge variant="secondary">學術理論</Badge>
								</CardTitle>
								<p className="text-gray-600">
									<strong>核心思想：</strong>
									{content.paperCore.approach}
								</p>
							</CardHeader>
							<CardContent>
								{content.paperCore.content}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="implementation" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Code className="w-5 h-5 text-green-600" />
									{content.implementationCore.title}
									<Badge variant="secondary">視覺實作</Badge>
								</CardTitle>
								<p className="text-gray-600">
									<strong>核心思想：</strong>
									{content.implementationCore.approach}
								</p>
							</CardHeader>
							<CardContent>
								{content.implementationCore.content}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="comparison" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<BarChart3 className="w-5 h-5 text-purple-600" />
									深度比較分析
									<Badge variant="secondary">核心洞察</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent>
								{content.comparison.content}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
