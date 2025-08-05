import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Target, Zap } from "lucide-react";
import type { LearningMode } from "../types/common";

interface ExperimentContextProps {
	mode: LearningMode;
}

export function ExperimentContext({ mode }: ExperimentContextProps) {
	const getContextContent = () => {
		switch (mode) {
			case "PU":
				return {
					title: "PU Learning 實驗設定",
					challenge: "如何從「陽性」和「未標記」數據中學習？",
					dataDescription: (
						<>
							<div className="flex items-start gap-3 mb-3">
								<Target className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-red-700">
										紅色圓點 (P)
									</span>
									<p className="text-sm text-gray-600">
										確定的陽性樣本 - 我們確信這些是目標類別
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 mb-3">
								<div className="w-4 h-4 bg-gray-400 rounded-full mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-gray-700">
										灰色圓點 (U)
									</span>
									<p className="text-sm text-gray-600">
										未標記樣本 - 可能是陽性，也可能是陰性
									</p>
								</div>
							</div>
						</>
					),
					algorithmGoal:
						"透過分析陽性樣本的分布特徵，從未標記數據中識別出可能的陰性樣本，然後訓練分類器。",
					realWorldExample:
						"醫學診斷、文件分類、推薦系統中，我們只能確定部分正面案例，但無法確定所有負面案例。",
				};

			case "PNU":
				return {
					title: "PNU Learning 實驗設定",
					challenge: "如何利用少量標記數據預測整個網路？",
					dataDescription: (
						<>
							<div className="flex items-start gap-3 mb-3">
								<Target className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-red-700">
										紅色圓點
									</span>
									<p className="text-sm text-gray-600">
										已知的正面標籤節點
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 mb-3">
								<div className="w-4 h-4 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-blue-700">
										藍色圓點
									</span>
									<p className="text-sm text-gray-600">
										已知的負面標籤節點
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 mb-3">
								<div className="w-4 h-4 bg-gray-400 rounded-full mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-gray-700">
										灰色圓點
									</span>
									<p className="text-sm text-gray-600">
										未標記節點 - 等待預測
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="w-4 h-1 bg-gray-300 mt-2 flex-shrink-0" />
								<div>
									<span className="font-semibold text-gray-700">
										連接線
									</span>
									<p className="text-sm text-gray-600">
										節點間的相似性關係
									</p>
								</div>
							</div>
						</>
					),
					algorithmGoal:
						"建立節點間的關係圖，讓已知標籤在相似節點間傳播，直到整個網路的標籤穩定。",
					realWorldExample:
						"社交網路分析、推薦系統、生物網路分析中，利用局部信息推斷全域模式。",
				};

			case "CLL":
				return {
					title: "CLL Learning 實驗設定",
					challenge: "如何從「不是什麼」的信息中學會「是什麼」？",
					dataDescription: (
						<>
							<div className="flex items-start gap-3 mb-3">
								<div className="w-4 h-4 bg-gray-400 rounded-full mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-gray-700">
										灰色圓點
									</span>
									<p className="text-sm text-gray-600">
										待分類的樣本點
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 mb-3">
								<Info className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-orange-700">
										互補標籤
									</span>
									<p className="text-sm text-gray-600">
										告訴我們每個樣本「不屬於」哪個類別
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<Zap className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
								<div>
									<span className="font-semibold text-purple-700">
										推理過程
									</span>
									<p className="text-sm text-gray-600">
										通過排除法逐步縮小可能的類別範圍
									</p>
								</div>
							</div>
						</>
					),
					algorithmGoal:
						"從每個樣本的互補標籤（它不是什麼）開始，透過概率推理確定它最可能屬於哪個類別。",
					realWorldExample:
						"醫學診斷中的排除診斷法、多選題考試的消除法、產品推薦中的負面反饋分析。",
				};

			default:
				return null;
		}
	};

	const content = getContextContent();
	if (!content) {
		return null;
	}

	return (
		<Card className="mb-4">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg">{content.title}</CardTitle>
				<p className="text-sm text-gray-600 font-medium">
					{content.challenge}
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<h4 className="font-semibold text-gray-800 mb-2">
						📊 數據說明
					</h4>
					<div className="bg-gray-50 p-3 rounded-lg">
						{content.dataDescription}
					</div>
				</div>

				<div>
					<h4 className="font-semibold text-gray-800 mb-2">
						🎯 演算法目標
					</h4>
					<p className="text-sm text-gray-700">
						{content.algorithmGoal}
					</p>
				</div>

				<div>
					<h4 className="font-semibold text-gray-800 mb-2">
						🌍 實際應用
					</h4>
					<p className="text-sm text-gray-600">
						{content.realWorldExample}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
