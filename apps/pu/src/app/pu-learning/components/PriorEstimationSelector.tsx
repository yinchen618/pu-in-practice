// PriorEstimationSelector.tsx
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface PriorEstimationSelectorProps {
	method: "mean" | "median";
	onMethodChange: (method: "mean" | "median") => void;
}

export default function PriorEstimationSelector({
	method,
	onMethodChange,
}: PriorEstimationSelectorProps) {
	return (
		<div className="space-y-3">
			{/* <Label className="text-sm font-semibold">
				Prior Estimation Method
			</Label> */}
			<Select value={method} onValueChange={onMethodChange}>
				<SelectTrigger>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="mean">Mean (Original)</SelectItem>
					<SelectItem value="median">
						Median (Recommended) ✅
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
