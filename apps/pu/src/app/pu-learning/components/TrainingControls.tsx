// TrainingControls.tsx
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import Label from "./Label";

interface TrainingControlsProps {
	isTraining: boolean;
	onTrain: () => void;
	error?: string | null;
}

export default function TrainingControls({
	isTraining,
	onTrain,
	error,
}: TrainingControlsProps) {
	return (
		<div className="space-y-4">
			<Label className="text-sm font-semibold">
				4. Training Controls
			</Label>

			<div className="space-y-3">
				<Button
					onClick={onTrain}
					disabled={isTraining}
					className="w-full"
					size="sm"
				>
					{isTraining ? (
						<RefreshCw className="h-4 w-4 animate-spin mr-2" />
					) : (
						<Play className="h-4 w-4 mr-2" />
					)}
					{isTraining ? "Training..." : "Run Simulation"}
				</Button>

				{isTraining && (
					<div className="text-xs text-gray-500 text-center">
						Training PU Learning model... This may take a few
						seconds.
					</div>
				)}

				{error && (
					<div className="text-xs text-red-600 text-center bg-red-50 p-2 rounded">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}
