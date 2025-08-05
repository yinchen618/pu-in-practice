import type { LearningMode } from "../lib/DatasetGenerator";

interface DataPointLegendProps {
	mode: LearningMode;
}

export function DataPointLegend({ mode }: DataPointLegendProps) {
	const renderPULegend = () => (
		<>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#4285f4] mr-2" />
				<span>P: 已標記的正樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#87ceeb] mr-2" />
				<span>PP: 預測為正樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#9e9e9e] mr-2" />
				<span>RN: 可靠負樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#e0e0e0] mr-2" />
				<span>PN/U: 預測為負樣本或未標記樣本</span>
			</div>
		</>
	);

	const renderPNULegend = () => (
		<>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#4285f4] mr-2" />
				<span>α: 已標記的第一類別樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#ea4335] mr-2" />
				<span>β: 已標記的第二類別樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#e0e0e0] mr-2" />
				<span>U: 未標記樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-[#4285f4] to-[#ea4335] mr-2" />
				<span>混合顏色: 根據概率分配顯示</span>
			</div>
		</>
	);

	const renderCLLLegend = () => (
		<>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#4285f4] mr-2" />
				<span>α: 非α的樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#ea4335] mr-2" />
				<span>β: 非β的樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-[#fbbc05] mr-2" />
				<span>γ: 非γ的樣本</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-[#4285f4] via-[#ea4335] to-[#fbbc05] mr-2" />
				<span>混合顏色: 根據概率分配顯示</span>
			</div>
		</>
	);

	return (
		<div className="mt-4 pt-4 border-t border-gray-200">
			<h5 className="font-medium text-sm mb-2">數據點標記說明：</h5>
			<div className="text-xs space-y-1">
				{mode === "PU" && renderPULegend()}
				{mode === "PNU" && renderPNULegend()}
				{mode === "CLL" && renderCLLLegend()}
			</div>
		</div>
	);
}
