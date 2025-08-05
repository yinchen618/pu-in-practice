import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import AlgorithmSelector from "./AlgorithmSelector";
import Label from "./Label";
import PriorEstimationSelector from "./PriorEstimationSelector";

interface ModelConfigurationControlsProps {
	algorithm: "uPU" | "nnPU";
	onAlgorithmChange: (alg: "uPU" | "nnPU") => void;
	priorEstimationMethod: "mean" | "median";
	onMethodChange: (m: "mean" | "median") => void;
	hiddenSize: number;
	setHiddenSize: (s: number) => void;
	lambdaRegularization: number;
	setLambdaRegularization: (l: number) => void;
	learningRate: number;
	setLearningRate: (r: number) => void;
	activationFunction: string;
	setActivationFunction: (a: string) => void;
	epochs: number;
	setEpochs: (e: number) => void;
	onOptimalSetup: () => void;
	onBlindsEffectSetup: () => void;
}

export default function ModelConfigurationControls({
	algorithm,
	onAlgorithmChange,
	priorEstimationMethod,
	onMethodChange,
	hiddenSize,
	setHiddenSize,
	lambdaRegularization,
	setLambdaRegularization,
	learningRate,
	setLearningRate,
	activationFunction,
	setActivationFunction,
	epochs,
	setEpochs,
	onOptimalSetup,
	onBlindsEffectSetup,
}: ModelConfigurationControlsProps) {
	// 判斷是否為 uPU 演算法
	const isUPU = algorithm === "uPU";

	return (
		<div className="space-y-4">
			{/* Algorithm Selection */}
			<div className="space-y-2">
				<Label className="text-xs ">Algorithm Selection:</Label>
				<AlgorithmSelector
					algorithm={algorithm}
					onAlgorithmChange={onAlgorithmChange}
				/>
			</div>

			{/* uPU 說明文字 */}
			{isUPU && (
				<div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
					<p className="text-xs text-blue-800">
						<strong>
							Classic uPU uses kernel methods with
							cross-validation to automatically find optimal
							solutions, no need to manually adjust learning rate
							and activation functions.
						</strong>
					</p>
				</div>
			)}

			{/* Prior Estimation Method */}
			<div className="space-y-2">
				<Label className="text-xs">Prior Estimation Method:</Label>
				<PriorEstimationSelector
					method={priorEstimationMethod}
					onMethodChange={onMethodChange}
				/>
			</div>

			{/* Model Complexity (Hidden Layer Size) */}
			<div className="space-y-2">
				<Label className="text-xs">
					{isUPU
						? "Model Complexity (Basis Functions):"
						: "Model Complexity (Hidden Layer Size):"}{" "}
					{hiddenSize}
				</Label>
				<Slider
					value={[hiddenSize]}
					onValueChange={(value) => setHiddenSize(value[0])}
					min={10}
					max={500}
					step={10}
					className="w-full"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>10 (Simple)</span>
					<span>500 (Complex)</span>
				</div>
				{isUPU && (
					<div className="text-xs text-gray-500">
						uPU basis functions: Controls kernel method complexity,
						more basis functions provide more flexible decision
						boundaries
					</div>
				)}
			</div>

			{/* Activation Function */}
			<div className="space-y-2">
				<Label className="text-xs">Activation Function:</Label>
				<Select
					value={activationFunction}
					onValueChange={(value) => setActivationFunction(value)}
					disabled={isUPU}
				>
					<SelectTrigger
						className={isUPU ? "opacity-50 cursor-not-allowed" : ""}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="relu">ReLU ✅</SelectItem>
						<SelectItem value="softsign">Softsign</SelectItem>
						<SelectItem value="tanh">Tanh</SelectItem>
					</SelectContent>
				</Select>
				{isUPU && (
					<div className="text-xs text-gray-500">
						uPU uses kernel methods, no activation function needed
					</div>
				)}
			</div>

			{/* Learning Rate */}
			<div className="space-y-2">
				<Label className="text-xs">Learning Rate:</Label>
				<Select
					value={learningRate.toString()}
					onValueChange={(value) => setLearningRate(Number(value))}
					disabled={isUPU}
				>
					<SelectTrigger
						className={isUPU ? "opacity-50 cursor-not-allowed" : ""}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0.01">Fast (0.01)</SelectItem>
						<SelectItem value="0.005">Medium (0.005) ✅</SelectItem>
						<SelectItem value="0.001">Slow (0.001)</SelectItem>
					</SelectContent>
				</Select>
				{isUPU && (
					<div className="text-xs text-gray-500">
						uPU uses direct analytical solution, no learning rate
						needed
					</div>
				)}
			</div>

			{/* Lambda Regularization */}
			<div className="space-y-2">
				<Label className="text-xs">Lambda Regularization:</Label>
				<Select
					value={lambdaRegularization.toString()}
					onValueChange={(value) => {
						console.log(
							"🔧 [DEBUG] Lambda Regularization 變更:",
							value,
							typeof value,
						);
						setLambdaRegularization(Number(value));
					}}
					disabled={isUPU}
				>
					<SelectTrigger
						className={isUPU ? "opacity-50 cursor-not-allowed" : ""}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0">None (0)</SelectItem>
						<SelectItem value="0.0001">
							Subtle (0.0001) ✅
						</SelectItem>
						<SelectItem value="0.001">Light (0.001)</SelectItem>
						<SelectItem value="0.005">Medium (0.005)</SelectItem>
						<SelectItem value="0.01">Strong (0.01)</SelectItem>
						<SelectItem value="0.1">Too Strong (0.1)</SelectItem>
					</SelectContent>
				</Select>
				{isUPU && (
					<div className="text-xs text-gray-500">
						uPU regularization parameters are automatically selected
						by cross-validation, no manual setting needed
					</div>
				)}
			</div>

			{/* Training Epochs */}
			<div className="space-y-2">
				<Label className="text-xs">Training Epochs: {epochs}</Label>
				<Slider
					value={[epochs]}
					onValueChange={(value) => setEpochs(value[0])}
					min={50}
					max={500}
					step={10}
					className="w-full"
					disabled={isUPU}
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>50 (Fast)</span>
					<span>500 (Thorough)</span>
				</div>
				<div className="text-xs text-gray-500">
					Controls how long the model trains.
				</div>
				{isUPU && (
					<div className="text-xs text-gray-500">
						uPU uses analytical solution, no iterative training
						needed
					</div>
				)}
			</div>
		</div>
	);
}
