import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LearningMode } from "../lib/DatasetGenerator";

interface ModeSelectionProps {
	currentMode: LearningMode;
	onModeChange: (mode: LearningMode) => void;
	isDisabled?: boolean;
}

export function ModeSelection({
	currentMode,
	onModeChange,
	isDisabled = false,
}: ModeSelectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>選擇學習模式</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{["PU", "PNU", "CLL"].map((mode) => (
					<Button
						key={mode}
						variant={currentMode === mode ? "default" : "outline"}
						className="w-full"
						onClick={() => onModeChange(mode as LearningMode)}
						disabled={isDisabled}
					>
						{mode === "PU" && "PU 學習"}
						{mode === "PNU" && "PNU 學習"}
						{mode === "CLL" && "CLL 學習"}
					</Button>
				))}
			</CardContent>
		</Card>
	);
}
