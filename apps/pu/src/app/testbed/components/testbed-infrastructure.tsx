"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Camera, Database, Home, ImageOff } from "lucide-react";
import { useState } from "react";

interface InfrastructureImage {
	title: string;
	caption: string;
	icon: React.ComponentType<any>;
	alt: string;
	src: string;
}

const infrastructureImages: InfrastructureImage[] = [
	{
		title: "Building Exterior",
		caption:
			"The two residential buildings that comprise the 95-unit testbed.",
		icon: Home,
		alt: "Exterior view of the residential buildings housing the testbed units",
		src: "https://images.unsplash.com/photo-1570129477492-45c003edd2e7",
	},
	{
		title: "Smart Meter Array",
		caption:
			"A centralized smart meter array providing high-resolution, real-time data.",
		icon: Database,
		alt: "Smart meter installation providing real-time energy monitoring",
		src: "https://images.unsplash.com/photo-1629907492434-a84534244927",
	},
	{
		title: "Representative Unit",
		caption:
			"A representative empty unit, illustrating the monitored environment.",
		icon: Camera,
		alt: "Empty residential unit showing the monitored environment",
		src: "https://images.unsplash.com/photo-1540518614846-7eded433c457",
	},
];

export function TestbedInfrastructure() {
	const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

	const handleImageError = (index: number) => {
		setImageErrors((prev) => new Set(prev).add(index));
	};

	return (
		<section className="mb-12">
			{/* Section Header */}
			<div className="text-center mb-6">
				<h2 className="text-2xl font-semibold text-slate-800 mb-2">
					Testbed Infrastructure
				</h2>
				<p className="text-slate-600">
					Visual evidence of our real-world data collection platform.
				</p>
			</div>

			{/* Hero Image Grid - 3 Columns */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{infrastructureImages.map((image, index) => {
					const Icon = image.icon;
					const hasError = imageErrors.has(index);

					return (
						<Card
							key={index}
							className="overflow-hidden border-slate-200 hover:shadow-lg transition-shadow duration-300"
						>
							<CardContent className="p-0">
								<figure className="m-0">
									{/* Image or Error State - 4:3 Aspect Ratio */}
									<div className="relative w-full bg-slate-100 flex items-center justify-center aspect-[4/3]">
										{hasError ? (
											<div className="text-center p-6">
												<ImageOff className="h-12 w-12 text-slate-400 mx-auto mb-3" />
												<span className="text-sm text-slate-500 font-medium">
													Image Unavailable
												</span>
											</div>
										) : (
											<img
												src={image.src}
												alt={image.alt}
												className="w-full h-full object-cover"
												loading="lazy"
												onError={() =>
													handleImageError(index)
												}
											/>
										)}
									</div>

									{/* Caption */}
									<div className="p-4 bg-white">
										<div className="flex items-center gap-2 mb-2">
											<Icon className="h-4 w-4 text-slate-600" />
											<h3 className="text-sm font-semibold text-slate-800">
												{image.title}
											</h3>
										</div>
										<p className="text-sm text-slate-600 leading-relaxed">
											{image.caption}
										</p>
									</div>
								</figure>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Footnote */}
			<div className="text-center mt-6">
				<p className="text-xs text-slate-500 italic">
					* Images are representative of the testbed infrastructure.
					Actual implementation may vary based on specific building
					requirements.
				</p>
			</div>
		</section>
	);
}
