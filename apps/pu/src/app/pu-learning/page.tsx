"use client";
import { Suspense } from "react";
import PULearningPageContent from "./components/PULearningPageContent";

export default function PULearningPage() {
	return (
		<Suspense fallback={<PULearningPageSkeleton />}>
			<PULearningPageContent />
		</Suspense>
	);
}

function PULearningPageSkeleton() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			<div className="container mx-auto px-4 py-8">
				<div className="space-y-8">
					<div className="h-96 bg-slate-200 rounded animate-pulse" />
					<div className="h-64 bg-slate-200 rounded animate-pulse" />
					<div className="h-48 bg-slate-200 rounded animate-pulse" />
				</div>
			</div>
		</div>
	);
}
