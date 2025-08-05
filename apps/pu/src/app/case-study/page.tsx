"use client";

import { Suspense } from "react";
import CaseStudyPageContent from "./components/CaseStudyPageContent";

export default function CaseStudyPage() {
	return (
		<Suspense fallback={<CaseStudyPageSkeleton />}>
			<CaseStudyPageContent />
		</Suspense>
	);
}

function CaseStudyPageSkeleton() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-end gap-4 mb-8">
					<div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
					<div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
				</div>
				<div className="space-y-8">
					<div className="h-96 bg-slate-200 rounded animate-pulse" />
					<div className="h-64 bg-slate-200 rounded animate-pulse" />
					<div className="h-48 bg-slate-200 rounded animate-pulse" />
				</div>
			</div>
		</div>
	);
}
