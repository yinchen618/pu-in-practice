"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Database, Target } from "lucide-react";
import Link from "next/link";

export function ProblemPhase() {
	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Target className="h-5 w-5 mr-2 text-red-600" />
						Problem Definition: Energy Anomaly Detection
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<div className="space-y-6">
							<div className="bg-red-50 p-6 rounded-lg">
								<h4 className="font-semibold text-red-800 mb-4 flex items-center">
									<AlertTriangle className="h-4 w-4 mr-2" />
									The Challenge
								</h4>
								<div className="space-y-3 text-sm text-red-700">
									<p>
										<strong>Context:</strong> Smart
										residential buildings generate massive
										amounts of energy consumption data, but
										anomalies are rare and hard to label
										comprehensively.
									</p>
									<p>
										<strong>Problem:</strong> Traditional
										supervised learning requires both normal
										and anomalous examples, but in our
										unique real-world testbed, we only have
										confirmed anomalies (positive examples)
										and a large amount of unlabeled data.
									</p>
									<p>
										<strong>Goal:</strong> Develop a system
										that can identify energy anomalies using
										only positive examples and unlabeled
										data (PU Learning scenario).
									</p>
								</div>
							</div>

							<div className="bg-blue-50 p-6 rounded-lg">
								<h4 className="font-semibold text-blue-800 mb-4">
									Real-world Constraints
								</h4>
								<ul className="text-sm text-blue-700 space-y-2">
									<li>
										• <strong>Limited Labels:</strong> Only
										200 confirmed anomalies from 95
										apartments
									</li>
									<li>
										• <strong>Unlabeled Data:</strong> 2.4M
										daily readings with unknown anomaly
										status
									</li>
									<li>
										• <strong>Cost Sensitivity:</strong>{" "}
										Manual inspection is expensive and
										time-consuming
									</li>
									<li>
										•{" "}
										<strong>Real-time Requirements:</strong>{" "}
										Must detect anomalies within 5 minutes
									</li>
								</ul>
							</div>
						</div>

						<div className="space-y-6">
							<div className="bg-yellow-50 p-6 rounded-lg">
								<h4 className="font-semibold text-yellow-800 mb-4">
									Dataset Characteristics
								</h4>
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<p className="text-yellow-700">
												<strong>Time Period:</strong> 18
												months
											</p>
											<p className="text-yellow-700">
												<strong>Apartments:</strong> 95
												units
											</p>
											<p className="text-yellow-700">
												<strong>Sensors:</strong> 1,695
												devices
											</p>
										</div>
										<div>
											<p className="text-yellow-700">
												<strong>Data Points:</strong>{" "}
												43.2M readings
											</p>
											<p className="text-yellow-700">
												<strong>
													Labeled Anomalies:
												</strong>{" "}
												200 cases
											</p>
											<p className="text-yellow-700">
												<strong>Unlabeled:</strong>{" "}
												43.2M - 200
											</p>
										</div>
									</div>
								</div>
							</div>

							<div className="bg-orange-50 p-6 rounded-lg">
								<h4 className="font-semibold text-orange-800 mb-4">
									Ground Truth Labeling Strategy
								</h4>
								<div className="space-y-3 text-sm text-orange-700">
									<p>
										To construct a high-quality set of
										positive examples (
										<strong>~200 anomalies</strong>), a
										two-phase funneling approach was
										employed.
									</p>
									<p>
										<strong>First</strong>, a set of
										automated heuristics (e.g., statistical
										thresholds, time-based rules) were
										applied to the entire 18-month dataset
										to generate thousands of anomaly
										candidates.
									</p>
									<p>
										<strong>Second</strong>, each candidate
										was manually reviewed and verified by a
										domain expert using a custom-built
										labeling interface. Only events
										confirmed to be highly indicative of a
										true anomaly were included in the final
										positive set.
									</p>
								</div>
							</div>

							<div className="bg-green-50 p-6 rounded-lg">
								<h4 className="font-semibold text-green-800 mb-4">
									Why PU Learning?
								</h4>
								<div className="space-y-3 text-sm text-green-700">
									<div className="flex items-start space-x-2">
										<CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
										<p>
											Perfect fit for scenarios where
											positive examples are certain but
											negatives are unclear
										</p>
									</div>
									<div className="flex items-start space-x-2">
										<CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
										<p>
											Directly addresses the fundamental
											labeling bias inherent in our
											real-world anomaly detection task
										</p>
									</div>
									<div className="flex items-start space-x-2">
										<CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
										<p>
											Provides theoretical guarantees
											under mild assumptions
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Call to Action */}
					<div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="text-lg font-semibold text-blue-900 mb-2">
									Explore the Full IoT Testbed
								</h4>
								<p className="text-blue-700">
									See how our 95-apartment, 1,695-sensor
									testbed generates real-time data for anomaly
									detection research.
								</p>
							</div>
							<Link href="/testbed">
								<Button className="bg-blue-600 hover:bg-blue-700 text-white">
									<Database className="h-4 w-4 mr-2" />
									View Testbed Platform
								</Button>
							</Link>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
