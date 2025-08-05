import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Brain, Users } from "lucide-react";
import type { LearningMode } from "../types/common";

interface AlgorithmStoryProps {
	mode: LearningMode;
}

export function AlgorithmStory({ mode }: AlgorithmStoryProps) {
	const getStoryContent = () => {
		switch (mode) {
			case "PU":
				return {
					icon: <Users className="w-5 h-5 text-blue-600" />,
					title: "PU Learning: 醫學診斷的挑戰",
					scenario: (
						<>
							<p className="text-gray-700 mb-4">
								🏥 <strong>情境設定：</strong>
								杉山教授的醫學AI實驗室正在開發一套癌症診斷系統。在實際醫療數據中，我們只能確定某些病例是「陽性」（確診癌症），但對於「陰性」樣本，我們永遠無法100%確定它們真的沒有癌症——可能只是我們還沒有發現。
							</p>
							<p className="text-gray-700 mb-4">
								🎯 <strong>學習目標：</strong>
								如何僅從「確診陽性」和「未標記」的數據中，訓練出準確的分類器？這就是PU
								Learning要解決的核心問題。
							</p>
							<div className="bg-blue-50 p-4 rounded-lg">
								<h4 className="font-semibold text-blue-800 mb-2">
									實驗過程
								</h4>
								<ul className="text-sm text-blue-700 space-y-1">
									<li>• 📍 尋找陽性樣本的質心位置</li>
									<li>• 🔍 識別可能的陰性樣本</li>
									<li>• 🤖 訓練支持向量機分類器</li>
									<li>• 📊 評估診斷準確率</li>
								</ul>
							</div>
						</>
					),
					theory: "基於杉山將教授實驗室的無偏差風險估計理論，PU Learning能夠在缺乏確定陰性樣本的情況下，仍然訓練出可靠的分類器。",
				};

			case "PNU":
				return {
					icon: <Brain className="w-5 h-5 text-green-600" />,
					title: "PNU Learning: 社交網路中的信息傳播",
					scenario: (
						<>
							<p className="text-gray-700 mb-4">
								🌐 <strong>情境設定：</strong>
								在社交網路平台上，只有少數用戶明確表達了對某個話題的立場，但大多數用戶保持沉默。杉山教授的團隊想要預測所有用戶的潛在觀點。
							</p>
							<p className="text-gray-700 mb-4">
								💡 <strong>核心思想：</strong>
								利用「物以類聚」的原理——如果兩個用戶在社交網路中關係密切，他們很可能有相似的觀點。透過圖網路上的標籤傳播，讓已知觀點在網路中「擴散」。
							</p>
							<div className="bg-green-50 p-4 rounded-lg">
								<h4 className="font-semibold text-green-800 mb-2">
									傳播機制
								</h4>
								<ul className="text-sm text-green-700 space-y-1">
									<li>• 🕸️ 建構用戶關係圖網路</li>
									<li>• 📡 標籤在網路中逐步傳播</li>
									<li>• ⚖️ 平衡局部與全域信息</li>
									<li>• 🎯 收斂到穩定預測</li>
								</ul>
							</div>
						</>
					),
					theory: "基於調和函數和高斯隨機場理論，標籤傳播演算法將半監督學習轉化為圖上的能量最小化問題。",
				};

			case "CLL":
				return {
					icon: <BookOpen className="w-5 h-5 text-purple-600" />,
					title: "CLL Learning: 反向思考的藝術",
					scenario: (
						<>
							<p className="text-gray-700 mb-4">
								🎭 <strong>情境設定：</strong>
								杉山教授在教授機器學習課程時發現，有時候告訴學生「這不是什麼」比直接說「這是什麼」更有效。受此啟發，他開發了互補標籤學習。
							</p>
							<p className="text-gray-700 mb-4">
								🔄 <strong>學習策略：</strong>
								與其標記「這張圖片是貓」，我們標記「這張圖片不是狗、不是鳥、不是魚...」。透過排除法，機器逐漸學會識別真正的目標。
							</p>
							<div className="bg-purple-50 p-4 rounded-lg">
								<h4 className="font-semibold text-purple-800 mb-2">
									推理過程
								</h4>
								<ul className="text-sm text-purple-700 space-y-1">
									<li>• 🎲 初始化所有可能性</li>
									<li>• ❌ 處理互補標籤線索</li>
									<li>• 🧮 更新概率分布</li>
									<li>• 🎯 收斂到正確答案</li>
								</ul>
							</div>
						</>
					),
					theory: "這種學習範式體現了認知科學中的對比學習原理，證明了「負面信息」同樣蕴含豐富的學習價值。",
				};

			default:
				return null;
		}
	};

	const content = getStoryContent();
	if (!content) {
		return null;
	}

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{content.icon}
					{content.title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{content.scenario}

					<div className="border-t pt-4">
						<h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
							📚 理論基礎
						</h4>
						<p className="text-sm text-gray-600 italic">
							{content.theory}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
