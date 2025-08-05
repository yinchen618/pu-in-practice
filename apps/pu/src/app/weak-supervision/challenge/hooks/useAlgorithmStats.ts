import { useEffect } from "react";
import type { CLLLearningAlgorithm } from "../lib/CLLLearningAlgorithm";
import type { PNULearningAlgorithm } from "../lib/PNULearningAlgorithm";
import type { PULearningAlgorithm } from "../lib/PULearningAlgorithm";
import type { CLLDashboardData } from "../lib/types/CLLDashboardData";
import type { PNUDashboardData } from "../lib/types/PNUDashboardData";
import type { PUDashboardData } from "../lib/types/PUDashboardData";

interface UseAlgorithmStatsParams {
	puAlgorithm: PULearningAlgorithm | null;
	pnuAlgorithm: PNULearningAlgorithm | null;
	cllAlgorithm: CLLLearningAlgorithm | null;
	setPuStats: (stats: PUDashboardData | null) => void;
	setPnuStats: (stats: PNUDashboardData | null) => void;
	setCllStats: (stats: CLLDashboardData | null) => void;
}

/**
 * Hook to manage algorithm statistics by setting up callbacks
 */
export function useAlgorithmStats({
	puAlgorithm,
	pnuAlgorithm,
	cllAlgorithm,
	setPuStats,
	setPnuStats,
	setCllStats,
}: UseAlgorithmStatsParams) {
	// 設置PU算法的回調
	useEffect(() => {
		if (puAlgorithm) {
			// 檢查算法是否有設置回調的方法
			if (
				typeof (puAlgorithm as any).setOnDashboardUpdate === "function"
			) {
				(puAlgorithm as any).setOnDashboardUpdate(
					(data: PUDashboardData) => {
						setPuStats(data);
					},
				);
			}
		} else {
			setPuStats(null);
		}
	}, [puAlgorithm, setPuStats]);

	// 設置PNU算法的回調
	useEffect(() => {
		if (pnuAlgorithm) {
			// 檢查算法是否有設置回調的方法
			if (
				typeof (pnuAlgorithm as any).setOnDashboardUpdate === "function"
			) {
				(pnuAlgorithm as any).setOnDashboardUpdate(
					(data: PNUDashboardData) => {
						setPnuStats(data);
					},
				);
			}
		} else {
			setPnuStats(null);
		}
	}, [pnuAlgorithm, setPnuStats]);

	// 設置CLL算法的回調
	useEffect(() => {
		if (cllAlgorithm) {
			// 檢查算法是否有設置回調的方法
			if (
				typeof (cllAlgorithm as any).setOnDashboardUpdate === "function"
			) {
				(cllAlgorithm as any).setOnDashboardUpdate(
					(data: CLLDashboardData) => {
						setCllStats(data);
					},
				);
			}
		} else {
			setCllStats(null);
		}
	}, [cllAlgorithm, setCllStats]);
}
