import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Label from "./Label";

interface ModelComplexityControlsProps {
	hiddenSize: number;
	lambdaRegularization: number;
	learningRate: number;
	activationFunction: string;
	onHiddenSizeChange: (size: number) => void;
	onLambdaChange: (lambda: number) => void;
	onLearningRateChange: (rate: number) => void;
	onActivationFunctionChange: (activation: string) => void;
	onOptimalSetup: () => void;
	onBlindsEffectSetup: () => void;
}

export default function ModelComplexityControls({
	hiddenSize,
	lambdaRegularization,
	learningRate,
	activationFunction,
	onHiddenSizeChange,
	onLambdaChange,
	onLearningRateChange,
	onActivationFunctionChange,
	onOptimalSetup,
	onBlindsEffectSetup,
}: ModelComplexityControlsProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Model & Training</Label>
			</div>

			{/* Hidden Layer Size */}
			<div>
				<Label>Hidden Layer Size: {hiddenSize}</Label>
				<p className="text-xs text-gray-600 mb-2">
					Controls model capacity and complexity
				</p>
				<Slider
					value={[hiddenSize]}
					onValueChange={(value) => onHiddenSizeChange(value[0])}
					min={10}
					max={500}
					step={10}
					className="w-full"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>10 (Simple)</span>
					<span>500 (Complex)</span>
				</div>
			</div>

			{/* Learning Rate */}
			<div className="space-y-2">
				<Label className="text-xs">學習率 (Learning Rate):</Label>
				<Select
					value={learningRate.toString()}
					onValueChange={(value) =>
						onLearningRateChange(Number(value))
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0.01">快 (Fast)</SelectItem>
						<SelectItem value="0.005">
							中 (Medium - Recommended)
						</SelectItem>
						<SelectItem value="0.001">慢 (Slow)</SelectItem>
					</SelectContent>
				</Select>
				<div className="text-xs text-gray-500">
					{learningRate === 0.01 && "快速收斂，但可能不穩定"}
					{learningRate === 0.005 && "平衡的學習速度，推薦使用"}
					{learningRate === 0.001 && "穩定但收斂較慢"}
				</div>
			</div>

			{/* Activation Function */}
			<div className="space-y-2">
				<Label className="text-xs">
					激活函數 (Activation Function):
				</Label>
				<Select
					value={activationFunction}
					onValueChange={(value) => onActivationFunctionChange(value)}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="relu">ReLU (Recommended)</SelectItem>
						<SelectItem value="softsign">Softsign</SelectItem>
						<SelectItem value="tanh">Tanh</SelectItem>
					</SelectContent>
				</Select>
				<div className="text-xs text-gray-500">
					{activationFunction === "relu" &&
						"最常用的激活函數，推薦使用"}
					{activationFunction === "softsign" && "平滑的 S 形函數"}
					{activationFunction === "tanh" && "雙曲正切函數"}
				</div>
			</div>

			{/* Lambda Regularization */}
			<div className="space-y-2">
				<Label className="text-xs">Lambda Regularization:</Label>
				<Select
					value={lambdaRegularization.toString()}
					onValueChange={(value) => onLambdaChange(Number(value))}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0">無 (None)</SelectItem>
						<SelectItem value="0.0001">微弱 (Subtle)</SelectItem>
						<SelectItem value="0.005">
							最佳 (Optimal - Recommended)
						</SelectItem>
						<SelectItem value="0.01">強 (Strong)</SelectItem>
						<SelectItem value="0.1">過強 (Too Strong)</SelectItem>
					</SelectContent>
				</Select>
				<div className="text-xs text-gray-500">
					{lambdaRegularization === 0 && "無正規化，會產生過擬合"}
					{lambdaRegularization === 0.0001 && "微弱正規化"}
					{lambdaRegularization === 0.005 &&
						"最佳正規化強度，推薦使用"}
					{lambdaRegularization === 0.01 && "強正規化"}
					{lambdaRegularization === 0.1 && "過強正規化，會產生欠擬合"}
				</div>
			</div>
		</div>
	);
}
