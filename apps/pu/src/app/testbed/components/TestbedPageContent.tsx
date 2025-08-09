"use client";

import { useTestbedData } from "@/hooks/use-testbed-data";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TabNavigation, { type TabKey } from "./TabNavigation";
import {
	DetailedPhotoGallery,
	ExplorerTab,
	OverviewTab,
	TestbedInfrastructure,
	TestbedNavigation,
} from "./index";

export default function TestbedPageContent() {
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab") as TabKey;
	const [activeTab, setActiveTab] = useState<TabKey>(tabParam || "overview");
	const testbedData = useTestbedData();

	// Sync activeTab with URL parameters and load data when needed
	useEffect(() => {
		const tab = searchParams.get("tab") as TabKey | "live" | null;
		if (tab === "live") {
			setActiveTab("explorer");
			return;
		}
		if (tab && (tab === "overview" || tab === "explorer")) {
			setActiveTab(tab);
		}
	}, [searchParams]);

	const handleTabChange = (tab: TabKey) => {
		setActiveTab(tab);
	};

	return (
		<div
			className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
			id="top"
		>
			{/* TabNavigation */}
			<TabNavigation
				activeTab={activeTab}
				onTabChange={handleTabChange}
			/>

			{/* Main Content */}
			<div className="container mx-auto px-6 py-8">
				{/* 1. Page Title */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-slate-900 mb-2">
						Smart Residential IoT Testbed – Real-World Data
						Foundation for PU Learning
					</h1>
					<p className="text-xl text-slate-600 max-w-4xl mx-auto">
						A 95-unit residential testbed, operating continuously
						for over 2 years, providing high-resolution electricity
						data. Designed to replicate the challenges of weak
						supervision: unlabeled events dominate, rare anomalies
						form the positive set, and behavior shifts over time
						cause label drift.
					</p>
				</div>

				{/* Overview Tab Content */}
				{activeTab === "overview" && (
					<div className="space-y-8">
						{/* Tab-specific heading */}
						<div className="text-center mb-8">
							<h2 className="text-3xl font-semibold text-slate-800 mb-4">
								Overview
							</h2>
							<div className="max-w-3xl mx-auto text-slate-700">
								<h3 className="font-semibold mb-2">
									Why Ideal for PU Learning
								</h3>
								<ul className="list-disc text-left pl-6 space-y-1">
									<li>
										Naturally unlabeled negative class (no
										ground-truth “normal” events)
									</li>
									<li>
										Seasonal and behavioral shifts create
										label-prior changes
									</li>
									<li>
										Rare anomalies form a long-tail positive
										distribution
									</li>
								</ul>
								<p className="mt-3 text-sm text-slate-600">
									Pipeline: From raw meter logs →
									preprocessing & gap detection → feature
									extraction (versioned) → Stage-1 candidate
									rules → Stage-2 expert confirmation → PU
									model registry.
								</p>
							</div>
						</div>

						{/* 2. Testbed Infrastructure Section - Hero Images */}
						<TestbedInfrastructure />

						{/* 3. Detailed Photo Gallery Section */}
						<DetailedPhotoGallery />

						{/* 4. Key Metrics Section */}
						<OverviewTab
							overviewLoading={testbedData.overviewLoading}
							overview={testbedData.overview}
						/>
					</div>
				)}

				{/* Explorer Tab */}
				{activeTab === "explorer" && (
					<div className="space-y-6">
						{/* Tab-specific heading */}
						<div className="text-center mb-8">
							<h2 className="text-3xl font-semibold text-slate-800 mb-4">
								Live Data Explorer
							</h2>
							<p className="text-slate-600 max-w-3xl mx-auto">
								Visualize live and historical power data,
								overlay detected candidate anomalies and
								confirmed events, and link directly to their
								labeling or prediction results.
							</p>
							<div className="mt-4 text-sm text-slate-700">
								<p className="mb-1 font-medium">
									Overlay Legend:
								</p>
								<ul className="list-disc text-left max-w-lg mx-auto pl-6">
									<li>
										Gray diamonds: Stage-1 rule-detected
										candidates
									</li>
									<li>
										Red stars: Stage-2 confirmed anomalies
									</li>
								</ul>
							</div>
						</div>
						<ExplorerTab />
					</div>
				)}

				{/* 6. Navigation Links */}
				<TestbedNavigation />
			</div>
		</div>
	);
}
