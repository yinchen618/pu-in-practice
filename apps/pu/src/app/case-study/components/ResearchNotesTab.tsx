"use client";
import AlgorithmFormalism from "@/app/case-study/components/researchnotes/AlgorithmFormalism";
import LessonsPractice from "@/app/case-study/components/researchnotes/LessonsPractice";
import ResearchHighlights from "@/app/case-study/components/researchnotes/ResearchHighlights";
import { Activity, BarChart3, Brain } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

export default function ResearchNotesTab() {
	const [activeSection, setActiveSection] = useState("lessons-practice");

	// Handle scroll to update active section (與 ProblemApproachTab 相同)
	useEffect(() => {
		const handleScroll = () => {
			const sections = [
				"lessons-practice",
				"algorithm-formalism",
				"research-highlights",
			];
			const scrollPosition = window.scrollY + 100;

			for (const section of sections) {
				const element = document.getElementById(section);
				if (element) {
					const { offsetTop, offsetHeight } = element;
					if (
						scrollPosition >= offsetTop &&
						scrollPosition < offsetTop + offsetHeight
					) {
						setActiveSection(section);
						break;
					}
				}
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			const elementPosition = element.offsetTop;
			const offsetPosition = elementPosition - 100;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	};

	return (
		<div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
			<div className="flex mx-auto">
				{/* Left Sidebar - Navigation (1/4) */}
				<div className="w-1/4 p-6">
					<div className="sticky top-6">
						{/* Page Title */}
						<div className="mb-8">
							<h1 className="text-2xl font-bold text-slate-800 mb-2">
								Research Notes & Insights
							</h1>
							<p className="text-sm text-slate-600">
								Key learnings, algorithm formalism, and research
								highlights from a
								<strong>risk-estimation–driven</strong> PU
								learning pipeline (nnPU; class-prior{" "}
								<em>
									π<sub>p</sub>
								</em>
								).
							</p>
						</div>

						{/* Navigation */}
						<nav className="space-y-2">
							{[
								{
									id: "lessons-practice",
									label: "Core Takeaways",
									icon: Brain,
								},
								{
									id: "algorithm-formalism",
									label: "Algorithm & Formalism",
									icon: Activity,
								},
								{
									id: "research-highlights",
									label: "Research Insights",
									icon: BarChart3,
								},
							].map((item) => (
								<div key={item.id}>
									<button
										type="button"
										onClick={() => scrollToSection(item.id)}
										className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
											activeSection === item.id
												? "bg-blue-100 text-blue-800 border-l-4 border-blue-600"
												: "text-slate-600 hover:bg-slate-100"
										}`}
									>
										<item.icon className="h-4 w-4" />
										<span className="text-sm font-medium">
											{item.label}
										</span>
									</button>
								</div>
							))}
						</nav>
					</div>
				</div>

				{/* Right Content Area (3/4) */}
				<div className="w-3/4 p-6 space-y-10">
					<LessonsPractice />
					<AlgorithmFormalism />
					<ResearchHighlights />
				</div>
			</div>
		</div>
	);
}
