import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { CLLLearningAlgorithm } from "../lib/CLLLearningAlgorithm";
import type { DataPoint, LearningMode } from "../lib/DatasetGenerator";
import { DatasetGenerator } from "../lib/DatasetGenerator";
import type { PNULearningAlgorithm } from "../lib/PNULearningAlgorithm";
import type { PULearningAlgorithm } from "../lib/PULearningAlgorithm";
import type { SVGRenderer } from "../lib/SVGRenderer";
import { SVGRenderer as SVGRendererClass } from "../lib/SVGRenderer";
import type {
	ExperimentStep,
	LogMessage,
	UIController,
} from "../lib/UIController";
import { UIController as UIControllerClass } from "../lib/UIController";
import type { CLLDashboardData } from "../lib/types/CLLDashboardData";
import type { PNUDashboardData } from "../lib/types/PNUDashboardData";
import type { PUDashboardData } from "../lib/types/PUDashboardData";
import type {
	CLLAlgorithmStep,
	PNUAlgorithmStep,
	PUAlgorithmStep,
} from "../types/common";

export interface ExperimentState {
	// 基本狀態
	currentMode: LearningMode;
	currentStep: ExperimentStep;
	dataPoints: DataPoint[];
	currentLog: LogMessage | null;
	animationProgress: number;
	accuracy: number;
	isRunning: boolean;

	// 渲染相關
	renderer: SVGRenderer | null;
	uiController: UIController | null;

	// 算法實例
	puAlgorithm: PULearningAlgorithm | null;
	pnuAlgorithm: PNULearningAlgorithm | null;
	cllAlgorithm: CLLLearningAlgorithm | null;

	// 統計數據
	puStats: PUDashboardData | null;
	pnuStats: PNUDashboardData | null;
	cllStats: CLLDashboardData | null;

	// PU 分析詳細統計
	puAnalysisStats: {
		totalPoints: number;
		truePositives: number;
		falsePositives: number;
		trueNegatives: number;
		falseNegatives: number;
		accuracy: number;
	} | null;

	// PU學習專用
	showPredictionResult: boolean;
	dashboardState: {
		currentStep: PUAlgorithmStep;
		pCentroid: { x: number; y: number } | null;
		rnCount: number;
		iteration: number;
		margin: number;
		logs: string[];
		phase1Status: "waiting" | "running" | "complete";
		phase2Status: "waiting" | "running" | "complete";
	};

	// PNU學習專用
	pnuCurrentStep: PNUAlgorithmStep;
	pnuIteration: number;
	pnuConvergence: number;
	pnuTotalNodes: number;
	pnuLabeledNodes: number;

	// CLL學習專用
	cllCurrentStep: CLLAlgorithmStep;
	cllCluesProcessed: number;
	cllModelConfidence: number;
}

export function useExperimentState(
	svgRef: React.RefObject<SVGSVGElement | null>,
) {
	const searchParams = useSearchParams();

	// 基本狀態
	const [currentMode, setCurrentMode] = useState<LearningMode>("PU");
	const [currentStep, setCurrentStep] = useState<ExperimentStep>("setup");
	const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
	const [currentLog, setCurrentLog] = useState<LogMessage | null>(null);
	const [animationProgress, setAnimationProgress] = useState(0);
	const [accuracy, setAccuracy] = useState(0);
	const [isRunning, setIsRunning] = useState(false);

	// 渲染相關
	const [renderer, setRenderer] = useState<SVGRenderer | null>(null);
	const [uiController, setUIController] = useState<UIController | null>(null);

	// 算法實例
	const [puAlgorithm, setPuAlgorithm] = useState<PULearningAlgorithm | null>(
		null,
	);
	const [pnuAlgorithm, setPnuAlgorithm] =
		useState<PNULearningAlgorithm | null>(null);
	const [cllAlgorithm, setCllAlgorithm] =
		useState<CLLLearningAlgorithm | null>(null);

	// 統計數據狀態
	const [puStats, setPuStats] = useState<PUDashboardData | null>(null);
	const [pnuStats, setPnuStats] = useState<PNUDashboardData | null>(null);
	const [cllStats, setCllStats] = useState<CLLDashboardData | null>(null);

	// PU 分析詳細統計
	const [puAnalysisStats, setPuAnalysisStats] = useState<{
		totalPoints: number;
		truePositives: number;
		falsePositives: number;
		trueNegatives: number;
		falseNegatives: number;
		accuracy: number;
	} | null>(null);

	// PU學習專用狀態
	const [showPredictionResult, setShowPredictionResult] = useState(false);
	const [dashboardState, setDashboardState] = useState({
		currentStep: "IDLE" as PUAlgorithmStep,
		pCentroid: null as { x: number; y: number } | null,
		rnCount: 0,
		iteration: 0,
		margin: 0,
		logs: [] as string[],
		phase1Status: "waiting" as "waiting" | "running" | "complete",
		phase2Status: "waiting" as "waiting" | "running" | "complete",
	});

	// PNU學習專用狀態
	const [pnuCurrentStep, setPnuCurrentStep] =
		useState<PNUAlgorithmStep>("IDLE");
	const [pnuIteration, setPnuIteration] = useState(0);
	const [pnuConvergence, setPnuConvergence] = useState(0);
	const [pnuTotalNodes, setPnuTotalNodes] = useState(0);
	const [pnuLabeledNodes, setPnuLabeledNodes] = useState(0);

	// CLL學習專用狀態
	const [cllCurrentStep, setCllCurrentStep] =
		useState<CLLAlgorithmStep>("IDLE");
	const [cllCluesProcessed, setCllCluesProcessed] = useState(0);
	const [cllModelConfidence, setCllModelConfidence] = useState(33.3);

	// 初始化
	useEffect(() => {
		if (!svgRef.current) {
			return;
		}

		// 創建渲染器
		const newRenderer = new SVGRendererClass(svgRef.current, 800, 600, 50);
		setRenderer(newRenderer);

		// 創建UI控制器
		const newUIController = new UIControllerClass({
			onModeChange: (mode) => {
				setCurrentMode(mode);
				resetExperiment(mode);
			},
			onStepChange: (step) => {
				setCurrentStep(step);
			},
			onLogUpdate: (log) => {
				setCurrentLog(log);
			},
			onProgressUpdate: (progress) => {
				setAnimationProgress(progress * 100);
			},
		});
		setUIController(newUIController);

		// 生成初始數據
		resetExperiment("PU");

		// 檢查 URL 參數中的模式
		const modeParam = searchParams.get("mode");
		if (modeParam && ["PU", "PNU", "CLL"].includes(modeParam)) {
			setCurrentMode(modeParam as LearningMode);
			resetExperiment(modeParam as LearningMode);
		}

		return () => {
			// 清理
		};
	}, [searchParams]);

	// 重置實驗
	const resetExperiment = useCallback(
		(mode: LearningMode) => {
			const generator = DatasetGenerator.getInstance();
			const baseDataPoints = generator.generateDataset();
			const adjustedDataPoints = generator.initializeLabelsForMode(
				baseDataPoints,
				mode,
			);

			setDataPoints(adjustedDataPoints);
			setCurrentStep("setup");
			setAnimationProgress(0);
			setAccuracy(0);
			setIsRunning(false);

			// 清理算法實例
			setPuAlgorithm(null);
			setPnuAlgorithm(null);
			setCllAlgorithm(null);

			// 重置統計數據
			setPuStats(null);
			setPnuStats(null);
			setCllStats(null);
			setPuAnalysisStats(null);

			// 重置各演算法專用狀態
			setShowPredictionResult(false);
			setPnuCurrentStep("IDLE");
			setPnuIteration(0);
			setPnuConvergence(0);
			setPnuTotalNodes(adjustedDataPoints.length);
			setPnuLabeledNodes(
				adjustedDataPoints.filter((point) => point.isLabeled).length,
			);
			setCllCurrentStep("IDLE");
			setCllCluesProcessed(0);
			setCllModelConfidence(33.3);

			setDashboardState({
				currentStep: "IDLE",
				pCentroid: null,
				rnCount: 0,
				iteration: 0,
				margin: 0,
				logs: [],
				phase1Status: "waiting",
				phase2Status: "waiting",
			});

			if (renderer) {
				renderer.clearDynamicElements(); // 清除所有動態元素，包括錯誤標記
				renderer.renderDataPoints(adjustedDataPoints, mode);
				renderer.renderDecisionBoundary(null);
			}

			if (uiController) {
				uiController.setMode(mode);
			}
		},
		[renderer, uiController],
	);

	const state: ExperimentState = {
		currentMode,
		currentStep,
		dataPoints,
		currentLog,
		animationProgress,
		accuracy,
		isRunning,
		renderer,
		uiController,
		puAlgorithm,
		pnuAlgorithm,
		cllAlgorithm,
		puStats,
		pnuStats,
		cllStats,
		puAnalysisStats,
		showPredictionResult,
		dashboardState,
		pnuCurrentStep,
		pnuIteration,
		pnuConvergence,
		pnuTotalNodes,
		pnuLabeledNodes,
		cllCurrentStep,
		cllCluesProcessed,
		cllModelConfidence,
	};

	const actions = {
		setCurrentMode,
		setCurrentStep,
		setDataPoints,
		setAnimationProgress,
		setAccuracy,
		setIsRunning,
		setShowPredictionResult,
		setDashboardState,
		setPuAlgorithm,
		setPnuAlgorithm,
		setCllAlgorithm,
		setPuStats,
		setPnuStats,
		setCllStats,
		setPuAnalysisStats,
		setPnuCurrentStep,
		setPnuIteration,
		setPnuConvergence,
		setCllCurrentStep,
		setCllCluesProcessed,
		setCllModelConfidence,
		resetExperiment,
	};

	return { state, actions };
}
