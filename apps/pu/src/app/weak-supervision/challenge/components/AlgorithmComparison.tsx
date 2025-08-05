import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BookOpen, Code, Lightbulb } from "lucide-react";
import type { LearningMode } from "../types/common";

interface AlgorithmComparisonProps {
	mode: LearningMode;
}

export function AlgorithmComparison({ mode }: AlgorithmComparisonProps) {
	const getComparisonContent = () => {
		switch (mode) {
			case "PU":
				return {
					title: "PU Learning 深度比較分析",
					paperCore: {
						title: "論文核心 (Niu et al., NeurIPS 2016)",
						approach: "無偏差風險估計器 (Unbiased Risk Estimator)",
						description: (
							<>
								<p className="text-gray-700 mb-3">
									論文指出，傳統方法（將所有未標註 U
									視為負樣本）會嚴重<strong>低估</strong>
									模型的真實錯誤率， 因為 U
									中混雜了未知的正樣本，導致模型訓練產生偏差。
								</p>
								<div className="bg-blue-50 p-4 rounded-lg mb-3">
									<h5 className="font-semibold text-blue-800 mb-2">
										核心公式
									</h5>
									<code className="text-sm bg-white p-2 rounded block">
										R_pu(g) = π_p R_p⁺(g) - π_p R_p⁻(g) +
										R_u⁻(g)
									</code>
									<p className="text-sm text-blue-700 mt-2">
										模型的「PU
										風險」，可由正樣本P和未標註樣本U經過類別先驗機率π_p控制的數學轉換來
										<strong>無偏差地估計</strong>。
									</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-lg">
									<h5 className="font-semibold mb-2">
										偽代碼流程
									</h5>
									<pre className="text-xs text-gray-700 overflow-x-auto">
										{`function train_uPU(P, U, π_p, loss_function):
  model = initialize_model()
  for each training epoch:
    for each minibatch from P and U:
      // 計算修正後的、無偏差的損失值
      pu_risk = calculate_unbiased_risk(model, P, U, π_p, loss)
      // 根據這個修正後的損失值，更新模型參數
      update_model_parameters(model, pu_risk)
  return model`}
									</pre>
								</div>
							</>
						),
					},
					implementationCore: {
						title: "您的實作核心 (幾何啟發式)",
						approach: "找出最可靠的對立面",
						description: (
							<>
								<p className="text-gray-700 mb-3">
									既然缺少負樣本 N，那就從最不可能為正樣本的 U
									中，<strong>人為地、啟發式地</strong>
									建立一個 「
									<strong>
										可靠負樣本 (Reliable Negative, RN)
									</strong>
									」集合。
								</p>
								<div className="bg-green-50 p-4 rounded-lg">
									<h5 className="font-semibold text-green-800 mb-2">
										實作流程
									</h5>
									<ol className="text-sm text-green-700 space-y-1">
										<li>
											<strong>1. 計算質心：</strong>{" "}
											計算所有已知正樣本 P 的幾何中心
											P_centroid
										</li>
										<li>
											<strong>2. 挖掘 RN：</strong>{" "}
											找出所有 U 中，距離 P
											群最遠的一批點（前30%），標記為 RN
										</li>
										<li>
											<strong>3. 構建分類器：</strong> 在
											P 和 RN
											之間構建簡易分類器（如垂直平分線決策邊界）
										</li>
										<li>
											<strong>4. 預測：</strong>{" "}
											用分類器預測所有剩餘 U 點的標籤
										</li>
									</ol>
								</div>
							</>
						),
					},
					comparison: {
						commonGoal:
							"解決「如何有效利用混雜的 U 集群」這個核心問題",
						differences: (
							<>
								<div className="grid md:grid-cols-2 gap-4 mb-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h5 className="font-semibold text-blue-800 mb-2">
											📊 論文思路：統計學
										</h5>
										<p className="text-sm text-blue-700">
											不挑出任何RN，將整個U集群視為整體，透過修正「期望值」的數學技巧消除偏差。
											這是一個
											<strong>全局的、基於機率</strong>
											的方法。
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h5 className="font-semibold text-green-800 mb-2">
											📐 實作思路：幾何學
										</h5>
										<p className="text-sm text-green-700">
											透過「挑出最極端的反例」創造代理N集合，將問題簡化為標準二元分類。
											這是一個
											<strong>局部的、基於距離</strong>
											的方法。
										</p>
									</div>
								</div>
								<div className="bg-yellow-50 p-4 rounded-lg">
									<h5 className="font-semibold text-yellow-800 mb-2">
										🎯 教學價值
									</h5>
									<p className="text-sm text-yellow-700">
										論文的「風險修正」過程抽象難視覺化，而您的「找出最遠點
										→ 劃分界線」過程
										<strong>極其直觀</strong>。
										使用者可以親眼看到「可靠負樣本」如何被識別，決策邊界如何形成。
										<strong>
											您將統計學的「風險修正」巧妙轉譯為幾何學的「空間劃分」，堪稱完美！
										</strong>
									</p>
								</div>
							</>
						),
					},
				};

			case "PNU":
				return {
					title: "PNU/半監督學習 深度比較分析",
					paperCore: {
						title: "論文核心 (Zhu et al., ICML 2003)",
						approach:
							"圖上的諧波函數 (Harmonic Function on Graphs)",
						description: (
							<>
								<p className="text-gray-700 mb-3">
									論文將所有數據點（有標籤和無標籤）看作一個圖上的節點，點之間的距離決定邊的權重。
									有標籤點視為<strong>電壓固定</strong>
									的「電源」，演算法求解諧波函數使整個圖能量最小。
								</p>
								<div className="bg-blue-50 p-4 rounded-lg mb-3">
									<h5 className="font-semibold text-blue-800 mb-2">
										核心公式
									</h5>
									<code className="text-sm bg-white p-2 rounded block">
										Y_i^(t+1) ← (1/Σ_j T_ij) × Σ_j T_ij ×
										Y_j^(t)
									</code>
									<p className="text-sm text-blue-700 mt-2">
										節點 i
										的標籤值等於其所有鄰居當前標籤值的加權平均，權重
										T_ij 為相似度。
									</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-lg">
									<h5 className="font-semibold mb-2">
										偽代碼流程
									</h5>
									<pre className="text-xs text-gray-700 overflow-x-auto">
										{`function train_LabelPropagation(Labeled, Unlabeled):
  build_similarity_graph(all_points)
  initialize_labels(Labeled, Unlabeled)
  repeat until convergence:
    for each point u in Unlabeled:
      // 更新 u 的標籤為其鄰居標籤的加權平均
      u.label = weighted_average(neighbors_of_u)
  return final_labels`}
									</pre>
								</div>
							</>
						),
					},
					implementationCore: {
						title: "您的實作核心 (標籤傳播)",
						approach: "近朱者赤，近墨者黑",
						description: (
							<>
								<p className="text-gray-700 mb-3">
									與論文完全一致的核心思想，透過視覺化的方式展現標籤在圖上的動態傳播過程。
								</p>
								<div className="bg-green-50 p-4 rounded-lg">
									<h5 className="font-semibold text-green-800 mb-2">
										實作流程
									</h5>
									<ol className="text-sm text-green-700 space-y-1">
										<li>
											<strong>1. 建立圖譜：</strong>{" "}
											計算所有點之間的相似度矩陣
										</li>
										<li>
											<strong>2. 初始化：</strong>{" "}
											已標註點賦予100%標籤機率，未標註點機率均等
										</li>
										<li>
											<strong>3. 迭代傳播：</strong>{" "}
											每輪根據鄰居機率更新未標註點，視覺呈現為「顏色擴散」
										</li>
										<li>
											<strong>4. 收斂：</strong>{" "}
											當機率不再變化時停止，達到穩定狀態
										</li>
									</ol>
								</div>
							</>
						),
					},
					comparison: {
						commonGoal:
							"利用「近朱者赤，近墨者黑」的原理，從少量標籤推斷整個網路",
						differences: (
							<>
								<div className="bg-purple-50 p-4 rounded-lg mb-4">
									<h5 className="font-semibold text-purple-800 mb-2">
										🎯 高度一致性
									</h5>
									<p className="text-sm text-purple-700">
										在這個案例中，
										<strong>
											您的實作與論文精神高度一致
										</strong>
										。標籤傳播演算法本身就具備極強的可視化潛力。
									</p>
								</div>
								<div className="grid md:grid-cols-2 gap-4 mb-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h5 className="font-semibold text-blue-800 mb-2">
											📚 論文貢獻
										</h5>
										<p className="text-sm text-blue-700">
											提供數學基礎（諧波函數、高斯場、圖拉普拉斯算子），證明合理性和收斂性。
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h5 className="font-semibold text-green-800 mb-2">
											💻 實作價值
										</h5>
										<p className="text-sm text-green-700">
											忠實地、逐步地執行迭代過程，讓使用者直觀看到「能量最小化」的動態過程。
										</p>
									</div>
								</div>
								<div className="bg-green-100 p-4 rounded-lg">
									<h5 className="font-semibold text-green-800 mb-2">
										🌟 完美結合
									</h5>
									<p className="text-sm text-green-700">
										您的實作可視為該論文核心思想的
										<strong>直觀、可互動實現版本</strong>，
										是連接理論與直覺的最佳橋樑。
									</p>
								</div>
							</>
						),
					},
				};

			case "CLL":
				return {
					title: "CLL/互補標籤學習 深度比較分析",
					paperCore: {
						title: "論文核心 (Ishida et al., NeurIPS 2017)",
						approach: "修正損失函數進行無偏差學習",
						description: (
							<>
								<p className="text-gray-700 mb-3">
									論文的<strong>最大貢獻</strong>
									是證明了，即使只提供互補標籤，也可以透過
									<strong>修正傳統損失函數</strong>
									來實現對真實類別的無偏差學習。
								</p>
								<div className="bg-blue-50 p-4 rounded-lg mb-3">
									<h5 className="font-semibold text-blue-800 mb-2">
										核心公式
									</h5>
									<code className="text-sm bg-white p-2 rounded block">
										P(Y=c|X) = 1 - P(Ȳ=c|X)
									</code>
									<p className="text-sm text-blue-700 mt-2">
										某樣本屬於類別 c 的真實機率，等於 1
										減去它被預測為「互補標籤 c」的機率。
									</p>
								</div>
								<div className="bg-gray-50 p-3 rounded-lg">
									<h5 className="font-semibold mb-2">
										偽代碼流程
									</h5>
									<pre className="text-xs text-gray-700 overflow-x-auto">
										{`function train_CLL(complementary_data):
  model = initialize_model()
  for each training epoch:
    for each sample (x, ȳ) in complementary_data:
      // 正常進行前向傳播，得到各類別預測分數
      predictions = model(x)
      // 使用修正後的CLL損失函數計算損失
      cll_loss = calculate_complementary_loss(predictions, ȳ)
      // 根據修正後的損失值，更新模型參數
      update_model_parameters(model, cll_loss)
  return model`}
									</pre>
								</div>
							</>
						),
					},
					implementationCore: {
						title: "您的實作核心 (機率排除與傳播)",
						approach: "確定性的「排除」操作",
						description: (
							<>
								<p className="text-gray-700 mb-3">
									將互補標籤視為一個
									<strong>確定性的「排除」操作</strong>，
									並將這個排除的影響在圖上傳播。
								</p>
								<div className="bg-green-50 p-4 rounded-lg">
									<h5 className="font-semibold text-green-800 mb-2">
										實作流程
									</h5>
									<ol className="text-sm text-green-700 space-y-1">
										<li>
											<strong>1. 初始化：</strong>{" "}
											所有點的初始類別機率均等 [1/K, 1/K,
											...]
										</li>
										<li>
											<strong>2. 處理線索：</strong>{" "}
											遍歷所有帶互補標籤 🚫k 的點 x_i
										</li>
										<li>
											<strong>3. 排除操作：</strong> 將點
											x_i 機率向量中第 k 項設為
											0，重新正規化其他項
										</li>
										<li>
											<strong>4. 傳播影響：</strong>{" "}
											將「排除
											k」的資訊傳播給鄰居，降低其屬於 k
											的機率
										</li>
										<li>
											<strong>5. 迭代：</strong>{" "}
											重複此過程直到穩定
										</li>
									</ol>
								</div>
							</>
						),
					},
					comparison: {
						commonGoal:
							"解決「如何僅從『否定』資訊中學習」這個反直覺問題",
						differences: (
							<>
								<div className="grid md:grid-cols-2 gap-4 mb-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<h5 className="font-semibold text-blue-800 mb-2">
											🔬 論文思路：分析學
										</h5>
										<p className="text-sm text-blue-700">
											在<strong>損失函數</strong>
											層面進行數學推導和修正，適用於任何基於梯度下降的複雜模型。
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<h5 className="font-semibold text-green-800 mb-2">
											🕸️ 實作思路：圖論+機率
										</h5>
										<p className="text-sm text-green-700">
											轉化為圖上的
											<strong>機率更新與傳播</strong>
											。每條互補標籤像指令，直接修改節點機率分佈。
										</p>
									</div>
								</div>
								<div className="bg-orange-50 p-4 rounded-lg">
									<h5 className="font-semibold text-orange-800 mb-2">
										🎮 教學價值
									</h5>
									<p className="text-sm text-orange-700">
										論文的「損失函數修正」對初學者極不友好，無法直接觀察。
										您的「<strong>機率排除</strong>
										」過程可被完美視覺化。使用者能清楚看到某顏色可能性如何
										<strong>被劃掉</strong>， 影響如何
										<strong>擴散</strong>。
										<strong>
											您將分析學的「損失修正」成功轉譯為直觀的邏輯推理遊戲！
										</strong>
									</p>
								</div>
							</>
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
		<div className="space-y-6">
			{/* 標題 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-xl">
						<BarChart3 className="w-6 h-6 text-indigo-600" />
						{content.title}
					</CardTitle>
				</CardHeader>
			</Card>

			{/* 三個比較區塊 */}
			<div className="grid gap-6">
				{/* 論文核心 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<BookOpen className="w-5 h-5 text-blue-600" />
							{content.paperCore.title}
							<Badge variant="secondary" className="ml-2">
								學術理論
							</Badge>
						</CardTitle>
						<p className="text-sm text-gray-600">
							<strong>核心思想：</strong>
							{content.paperCore.approach}
						</p>
					</CardHeader>
					<CardContent>{content.paperCore.description}</CardContent>
				</Card>

				{/* 實作核心 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Code className="w-5 h-5 text-green-600" />
							{content.implementationCore.title}
							<Badge variant="secondary" className="ml-2">
								視覺實作
							</Badge>
						</CardTitle>
						<p className="text-sm text-gray-600">
							<strong>核心思想：</strong>
							{content.implementationCore.approach}
						</p>
					</CardHeader>
					<CardContent>
						{content.implementationCore.description}
					</CardContent>
				</Card>

				{/* 比較與分析 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Lightbulb className="w-5 h-5 text-purple-600" />
							比較與分析
							<Badge variant="secondary" className="ml-2">
								深度洞察
							</Badge>
						</CardTitle>
						<p className="text-sm text-gray-600">
							<strong>共同目標：</strong>
							{content.comparison.commonGoal}
						</p>
					</CardHeader>
					<CardContent>{content.comparison.differences}</CardContent>
				</Card>
			</div>
		</div>
	);
}
