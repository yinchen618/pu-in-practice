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
		const tab = searchParams.get("tab") as TabKey;
		if (tab && (tab === "overview" || tab === "explorer")) {
			setActiveTab(tab);
		}
	}, [searchParams]);

	const handleTabChange = (tab: TabKey) => {
		setActiveTab(tab);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
						Smart Residential IoT Testbed
					</h1>
					<p className="text-xl text-slate-600">
						Real-world data collection platform with 100+
						residential units
					</p>
				</div>

				{/* Overview Tab Content */}
				{activeTab === "overview" && (
					<div className="space-y-8">
						{/* Tab-specific heading */}
						<div className="text-center mb-8">
							<h2 className="text-3xl font-semibold text-slate-800 mb-4">
								Testbed Overview & Infrastructure
							</h2>
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
							<p className="text-slate-600">
								Interactive visualization and analysis of
								real-time sensor data
							</p>
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
