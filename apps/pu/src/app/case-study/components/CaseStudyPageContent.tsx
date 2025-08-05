"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { AnomalyLabelingSystem } from "./AnomalyLabelingSystem";
import { BottomNavigation } from "./BottomNavigation";
import { ImplementationPhase } from "./ImplementationPhase";
import { MethodologyPhase } from "./MethodologyPhase";
import { PLabelingPhase } from "./PLabelingPhase";
import { ProblemPhase } from "./ProblemPhase";
import { ResultsPhase } from "./ResultsPhase";
import TabNavigation, { type TabKey } from "./TabNavigation";

export default function CaseStudyPageContent() {
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab") as TabKey;
	const [activePhase, setActivePhase] = useState<TabKey>(
		tabParam || "problem",
	);

	// Sync activePhase with URL parameters
	useEffect(() => {
		const tab = searchParams.get("tab") as TabKey;
		if (
			tab &&
			[
				"problem",
				"methodology",
				"implementation",
				"results",
				"plabeling",
				"labeling-system",
			].includes(tab)
		) {
			setActivePhase(tab);
		}
	}, [searchParams]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			{/* TabNavigation */}
			<TabNavigation
				activeTab={activePhase}
				onTabChange={setActivePhase}
			/>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-8">
				{/* Badges */}
				<div className="flex items-center justify-end gap-4 mb-8">
					<Badge className="bg-red-100 text-red-800">
						Real-world Application
					</Badge>
					<Badge className="bg-purple-100 text-purple-800">
						PU Learning
					</Badge>
				</div>

				{/* Phase Components */}
				{activePhase === "problem" && <ProblemPhase />}
				{activePhase === "methodology" && <MethodologyPhase />}
				{activePhase === "implementation" && <ImplementationPhase />}
				{activePhase === "results" && <ResultsPhase />}
				{activePhase === "plabeling" && <PLabelingPhase />}
				{activePhase === "labeling-system" && <AnomalyLabelingSystem />}

				{/* Bottom Navigation */}
				<BottomNavigation />
			</div>
		</div>
	);
}
