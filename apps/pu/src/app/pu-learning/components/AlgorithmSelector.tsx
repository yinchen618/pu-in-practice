import Label from "./Label";
import RadioGroup from "./RadioGroup";
import RadioGroupItem from "./RadioGroupItem";

interface AlgorithmSelectorProps {
	algorithm: "uPU" | "nnPU";
	onAlgorithmChange: (algorithm: "uPU" | "nnPU") => void;
}

export default function AlgorithmSelector({
	algorithm,
	onAlgorithmChange,
}: AlgorithmSelectorProps) {
	return (
		<div className="space-y-3 mt-2">
			{/* <Label className="text-sm font-semibold">
				1. Algorithm Selection
			</Label> */}
			<RadioGroup>
				<div className="flex items-center space-x-2">
					<RadioGroupItem
						value="uPU"
						id="upu"
						checked={algorithm === "uPU"}
						onChange={() => onAlgorithmChange("uPU")}
					/>
					<Label htmlFor="upu" className="text-sm">
						uPU (ICML 2015){" "}
						<span className="text-xs text-muted-foreground">
							[cite: 1, 2]
						</span>
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem
						value="nnPU"
						id="nnpu"
						checked={algorithm === "nnPU"}
						onChange={() => onAlgorithmChange("nnPU")}
					/>
					<Label htmlFor="nnpu" className="text-sm">
						nnPU (NIPS 2017){" "}
						<span className="text-xs text-muted-foreground">
							[cite: 3]
						</span>
					</Label>
				</div>
			</RadioGroup>

			{/* Algorithm Comparison Indicator */}
			{/* <div
				className={`p-3 border rounded text-xs ${
					algorithm === "nnPU"
						? "bg-green-50 border-green-200"
						: "bg-orange-50 border-orange-200"
				}`}
			>
				{algorithm === "nnPU" ? (
					<>✅ Non-negative risk constraint prevents overfitting</>
				) : (
					<>⚠️ May show negative risk (overfitting indicator)</>
				)}
			</div>
			<div className="text-xs text-gray-600">
				Switch algorithms above to compare uPU vs nnPU performance
			</div> */}
		</div>
	);
}
