import { LaTeX } from "@/app/weak-supervision/challenge/components/LaTeX";
// DataGenerationControls.tsx
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

interface DataGenerationControlsProps {
	dataParams: DataParams;
	onDataParamsChange: (params: DataParams) => void;
}

export default function DataGenerationControls({
	dataParams,
	onDataParamsChange,
}: DataGenerationControlsProps) {
	const updateDataParams = (updates: Partial<DataParams>) => {
		onDataParamsChange({ ...dataParams, ...updates });
	};

	return (
		<div className="space-y-4">
			<Label className="text-sm font-semibold">3. Data Generation</Label>

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
						<SelectItem value="gaussian">
							Gaussian (Recommended) ✅
						</SelectItem>
						<SelectItem value="two_moons">
							Two Moons (Challenging)
						</SelectItem>
						<SelectItem value="spiral">Spiral (Complex)</SelectItem>
						<SelectItem value="complex">
							Complex (Scikit-learn)
						</SelectItem>
					</SelectContent>
				</Select>
				<div className="text-xs text-gray-500">
					Gaussian distribution works best for PU Learning demos
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
				<div className="text-xs text-gray-500">
					Higher dimensions = better classification
				</div>
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
