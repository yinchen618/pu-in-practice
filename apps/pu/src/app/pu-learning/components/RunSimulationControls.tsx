import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";

interface RunSimulationControlsProps {
	isTraining: boolean;
	onTrain: () => void;
	error?: string | null;
}

export default function RunSimulationControls({
	isTraining,
	onTrain,
	error,
}: RunSimulationControlsProps) {
	return (
		<div className="space-y-4">
			<Button
				onClick={onTrain}
				disabled={isTraining}
				className="w-full"
				size="lg"
			>
				{isTraining ? (
					<RefreshCw className="h-5 w-5 animate-spin mr-2" />
				) : (
					<Play className="h-5 w-5 mr-2" />
				)}
				{isTraining ? "Training..." : "Run Simulation"}
			</Button>

			{/* {isTraining && (
				<div className="text-xs text-gray-500 text-center">
					Training PU Learning model... This may take a few seconds.
				</div>
			)} */}

			{error && (
				<div className="text-xs text-red-600 text-center bg-red-50 p-2 rounded">
					{error}
				</div>
			)}
		</div>
	);
}
