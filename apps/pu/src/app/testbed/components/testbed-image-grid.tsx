"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Camera, Database, Home, ImageOff } from "lucide-react";
import { useState } from "react";

interface TestbedImage {
	src: string;
	alt: string;
	caption: string;
	icon: React.ComponentType<any>;
	title: string;
}

const testbedImages: TestbedImage[] = [
	{
		src: "https://images.unsplash.com/photo-1570129477492-45c003edd2e7",
		alt: "Exterior of a modern residential building.",
		caption:
			"The exterior of a residential building housing the testbed units.",
		icon: Home,
		title: "Building Exterior",
	},
	{
		src: "https://images.unsplash.com/photo-1629907492434-a84534244927",
		alt: "A clean installation of multiple smart meters in a utility panel.",
		caption:
			"The smart meter array providing high-resolution, real-time data.",
		icon: Database,
		title: "Smart Meter Array",
	},
	{
		src: "https://images.unsplash.com/photo-1540518614846-7eded433c457",
		alt: "A clean, empty studio apartment before tenant occupancy.",
		caption:
			"A representative empty unit, illustrating the monitored environment.",
		icon: Camera,
		title: "Representative Unit",
	},
];

export function TestbedImageGrid() {
	const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

	const handleImageError = (index: number) => {
		setImageErrors((prev) => new Set(prev).add(index));
	};

	return (
		<div className="mb-12">
			{/* Section Title */}
			<div className="text-center mb-6">
				<h2 className="text-2xl font-semibold text-slate-800 mb-2">
					Testbed Infrastructure
				</h2>
				<p className="text-slate-600">
					Visual evidence of our real-world data collection platform
				</p>
			</div>

			{/* Image Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{testbedImages.map((image, index) => {
					const Icon = image.icon;
					const hasError = imageErrors.has(index);

					return (
						<Card
							key={index}
							className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow duration-200"
						>
							<CardContent className="p-0">
								<figure className="m-0">
									{/* Image Header */}
									<div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
										<div className="flex items-center gap-2">
											<Icon className="h-4 w-4 text-slate-600" />
											<h3 className="text-sm font-medium text-slate-700">
												{image.title}
											</h3>
										</div>
									</div>

									{/* Image or Error State */}
									<div className="h-48 bg-slate-100 flex items-center justify-center">
										{hasError ? (
											<div className="text-center p-4">
												<ImageOff className="h-12 w-12 text-slate-400 mx-auto mb-2" />
												<p className="text-sm text-slate-500">
													Image unavailable
												</p>
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
									<figcaption className="p-4 text-center text-sm text-slate-600 leading-relaxed bg-white">
										{image.caption}
									</figcaption>
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
		</div>
	);
}
