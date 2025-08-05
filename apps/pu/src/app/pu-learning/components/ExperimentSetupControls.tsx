import { LaTeX } from "@/app/weak-supervision/challenge/components/LaTeX";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Label from "./Label";
import type { DataParams } from "./types";

interface ExperimentSetupControlsProps {
	dataParams: DataParams;
	onDataParamsChange: (params: DataParams) => void;
	randomSeed: number;
	setRandomSeed: (seed: number) => void;
	handleRandomizeSeed: () => void;
}

export default function ExperimentSetupControls({
	dataParams,
	onDataParamsChange,
	randomSeed,
	setRandomSeed,
	handleRandomizeSeed,
}: ExperimentSetupControlsProps) {
	const updateDataParams = (updates: Partial<DataParams>) => {
		onDataParamsChange({ ...dataParams, ...updates });
	};

	return (
		<div className="space-y-4">
			{/* Distribution */}
			<div className="space-y-2">
				<Label className="text-xs">Distribution:</Label>
				<Select
					value={dataParams.distribution}
					onValueChange={(value) =>
						updateDataParams({ distribution: value })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="gaussian">Gaussian ✅</SelectItem>
						<SelectItem value="two_moons">Two Moons</SelectItem>
						<SelectItem value="spiral">Spiral</SelectItem>
						<SelectItem value="complex">Complex</SelectItem>
					</SelectContent>
				</Select>
				{/* <div className="text-xs text-gray-500">
					Gaussian distribution works best for PU Learning demos
				</div> */}
			</div>

			{/* Random Seed */}
			<div className="space-y-2">
				<Label className="text-xs">Random Seed:</Label>
				<div className="flex gap-2">
					<input
						type="number"
						value={randomSeed}
						onChange={(e) => setRandomSeed(Number(e.target.value))}
						className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Enter seed value"
						min="0"
						max="99999"
					/>
					<button
						type="button"
						onClick={handleRandomizeSeed}
						className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
						title="Generate random seed"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							aria-label="Refresh random seed"
						>
							<title>Refresh random seed</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</button>
				</div>
				<div className="text-xs text-gray-500">
					Set random seed to ensure experiment reproducibility
				</div>
			</div>

			{/* Dimensions */}
			<div className="space-y-2">
				<Label className="text-xs">Dimensions:</Label>
				<Select
					value={dataParams.dimensions.toString()}
					onValueChange={(value) =>
						updateDataParams({
							dimensions: Number.parseInt(value, 10),
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="2">2D (Visualizable)</SelectItem>
						<SelectItem value="4">
							4D (Better performance)
						</SelectItem>
						<SelectItem value="8">8D (Optimal) ✅</SelectItem>
						<SelectItem value="16">
							16D (Best performance)
						</SelectItem>
						<SelectItem value="32">
							32D (High-dimensional)
						</SelectItem>
						<SelectItem value="50">
							50D (Very high-dimensional)
						</SelectItem>
					</SelectContent>
				</Select>
				{/* <div className="text-xs text-gray-500">
					Higher dimensions = better classification
				</div> */}
			</div>

			{/* Positive Samples */}
			<div className="space-y-2">
				<Label className="text-xs">
					Positive Samples ({" "}
					<span className="font-mono">
						<LaTeX displayMode={false}>{"n_p"}</LaTeX>
					</span>
					): {dataParams.nPositive}
				</Label>
				<Slider
					value={[dataParams.nPositive]}
					onValueChange={(value) =>
						updateDataParams({ nPositive: value[0] })
					}
					max={200}
					min={10}
					step={10}
					className="w-full"
				/>
			</div>

			{/* Unlabeled Samples */}
			<div className="space-y-2">
				<Label className="text-xs">
					Unlabeled Samples ({" "}
					<span className="font-mono">
						<LaTeX displayMode={false}>{"n_u"}</LaTeX>
					</span>
					): {dataParams.nUnlabeled}
				</Label>
				<Slider
					value={[dataParams.nUnlabeled]}
					onValueChange={(value) =>
						updateDataParams({ nUnlabeled: value[0] })
					}
					max={500}
					min={50}
					step={25}
					className="w-full"
				/>
			</div>

			{/* Class Prior */}
			<div className="space-y-2">
				<Label className="text-xs">
					Class Prior ({" "}
					<span className="font-mono">
						<LaTeX displayMode={false}>{"\\pi_p"}</LaTeX>
					</span>
					): {dataParams.prior.toFixed(2)}
				</Label>
				<Slider
					value={[dataParams.prior]}
					onValueChange={(value) =>
						updateDataParams({ prior: value[0] })
					}
					max={0.8}
					min={0.1}
					step={0.05}
					className="w-full"
				/>
			</div>
		</div>
	);
}
