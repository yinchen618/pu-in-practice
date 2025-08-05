"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building, HardDrive, ImageOff, Zap } from "lucide-react";
import { useState } from "react";

interface GalleryImage {
	title: string;
	icon: React.ComponentType<any>;
	alt: string;
	src: string;
}

const galleryImages: GalleryImage[] = [
	{
		title: "View of Building B",
		icon: Building,
		alt: "Alternative view of the second residential building",
		src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
	},
	{
		title: "Decentralized Meter Installation",
		icon: Zap,
		alt: "Individual smart meter installations in residential units",
		src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
	},
	{
		title: "Smart Meter Close-up",
		icon: Zap,
		alt: "Detailed view of smart meter technology and interfaces",
		src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
	},
	{
		title: "On-Premise Server Rack",
		icon: HardDrive,
		alt: "Server infrastructure for data collection and processing",
		src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
	},
];

export function DetailedPhotoGallery() {
	const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

	const handleImageError = (index: number) => {
		setImageErrors((prev) => new Set(prev).add(index));
	};

	return (
		<section className="mt-12 mb-8">
			{/* Section Header */}
			<div className="text-center mb-8">
				<h2 className="text-2xl font-semibold text-slate-800 mb-2">
					Infrastructure in Detail
				</h2>
				<p className="text-slate-600">
					Additional perspectives on our comprehensive monitoring
					system
				</p>
			</div>

			{/* Gallery Grid - 4 Columns */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{galleryImages.map((image, index) => {
					const Icon = image.icon;
					const hasError = imageErrors.has(index);

					return (
						<Card
							key={index}
							className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow duration-200"
						>
							<CardContent className="p-0">
								<figure className="m-0">
									{/* Image or Error State - 1:1 Aspect Ratio */}
									<div className="relative w-full bg-slate-100 flex items-center justify-center aspect-square">
										{hasError ? (
											<div className="text-center p-4">
												<ImageOff className="h-8 w-8 text-slate-400 mx-auto mb-2" />
												<span className="text-xs text-slate-500 font-medium">
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
									<div className="p-3 bg-white">
										<div className="flex items-center gap-2 justify-center">
											<Icon className="h-3 w-3 text-slate-500" />
											<h3 className="text-xs font-medium text-slate-700 text-center">
												{image.title}
											</h3>
										</div>
									</div>
								</figure>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Additional Information */}
			<div className="text-center mt-6">
				<p className="text-xs text-slate-500 italic">
					Detailed infrastructure components supporting our real-time
					monitoring capabilities
				</p>
			</div>
		</section>
	);
}
