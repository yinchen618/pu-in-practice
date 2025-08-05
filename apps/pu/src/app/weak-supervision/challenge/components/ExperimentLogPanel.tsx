import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LearningMode } from "../lib/DatasetGenerator";
import { DataPointLegend } from "./DataPointLegend";
import { LogViewer } from "./logger/LogViewer";

interface ExperimentLogPanelProps {
	mode: LearningMode;
	logs: string[];
	phase1Status?: "waiting" | "running" | "complete";
	phase2Status?: "waiting" | "running" | "complete";
	phase1Title?: string;
	phase2Title?: string;
}

export function ExperimentLogPanel({
	mode,
	logs,
	phase1Status = "waiting",
	phase2Status = "waiting",
	phase1Title,
	phase2Title,
}: ExperimentLogPanelProps) {
	const getDefaultPhaseTitles = (mode: LearningMode) => {
		switch (mode) {
			case "PU":
				return {
					phase1: "階段一：找出可靠負樣本",
					phase2: "階段二：SVM分類",
				};
			case "PNU":
				return {
					phase1: "階段一：估計類別先驗",
					phase2: "階段二：密度比估計",
				};
			case "CLL":
				return {
					phase1: "階段一：互補標籤傳播",
					phase2: "階段二：一致性正則化",
				};
			default:
				return {
					phase1: "階段一",
					phase2: "階段二",
				};
		}
	};

	const defaultTitles = getDefaultPhaseTitles(mode);

	return (
		<Card>
			<CardHeader>
				<CardTitle>實驗日誌</CardTitle>
			</CardHeader>
			<CardContent>
				<LogViewer
					logs={logs}
					phase1Status={phase1Status}
					phase2Status={phase2Status}
					phase1Title={phase1Title || defaultTitles.phase1}
					phase2Title={phase2Title || defaultTitles.phase2}
					className="min-h-[400px]"
				/>
				<DataPointLegend mode={mode} />
			</CardContent>
		</Card>
	);
}
