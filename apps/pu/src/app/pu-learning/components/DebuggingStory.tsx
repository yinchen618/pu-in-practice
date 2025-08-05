// DebuggingStory.tsx
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Bug, CheckCircle } from "lucide-react";

export default function DebuggingStory() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bug className="w-5 h-5 text-amber-600" />
					Debugging Story & Technical Insights
				</CardTitle>
				<CardDescription>
					Real-world debugging challenges and solutions encountered
					during development
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{/* Prior Estimation Debugging */}
					<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
						<div className="flex items-center gap-2 mb-3">
							<AlertTriangle className="w-4 h-4 text-amber-600" />
							<h4 className="font-semibold text-amber-900">
								Prior Estimation Method Selection
							</h4>
						</div>
						<div className="text-sm text-amber-800 space-y-2">
							<p>
								<strong>Problem Discovered:</strong> Using{" "}
								<code>mean</code> for prior estimation was
								causing the "blinds effect" - unstable estimates
								leading to poor model performance.
							</p>
							<p>
								<strong>Root Cause:</strong> Mean estimation is
								sensitive to outliers in unlabeled data, causing
								the class-prior π_p to fluctuate wildly during
								training.
							</p>
							<p>
								<strong>Solution:</strong> Switched to{" "}
								<code>median</code> estimation for more robust
								prior calculation, providing stable training
								dynamics.
							</p>
						</div>
					</div>

					{/* Model Complexity Insights */}
					<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-center gap-2 mb-3">
							<CheckCircle className="w-4 h-4 text-blue-600" />
							<h4 className="font-semibold text-blue-900">
								Model Complexity Optimization
							</h4>
						</div>
						<div className="text-sm text-blue-800 space-y-2">
							<p>
								<strong>Optimal Configuration:</strong> Hidden
								size 256 with λ=0.001 provides the best balance
								between model capacity and regularization.
							</p>
							<p>
								<strong>High Capacity Setup:</strong> Hidden
								size 512 with λ=0.01 for complex datasets, but
								watch for overfitting in uPU scenarios.
							</p>
							<p>
								<strong>Key Insight:</strong> nnPU is more
								robust to higher model complexity due to its
								non-negative risk constraint.
							</p>
						</div>
					</div>

					{/* Dimension Analysis */}
					<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
						<div className="flex items-center gap-2 mb-3">
							<CheckCircle className="w-4 h-4 text-green-600" />
							<h4 className="font-semibold text-green-900">
								8-Dimensional Sweet Spot
							</h4>
						</div>
						<div className="text-sm text-green-800 space-y-2">
							<p>
								<strong>Performance Analysis:</strong> 8
								dimensions emerged as the optimal balance point
								- sufficient complexity for meaningful patterns
								while avoiding curse of dimensionality.
							</p>
							<p>
								<strong>Gaussian Distribution:</strong> Works
								best with 8D as it maintains clear separability
								between positive and unlabeled clusters.
							</p>
							<p>
								<strong>Recommendation:</strong> Start with 8
								dimensions for most PU learning experiments
								unless domain-specific requirements dictate
								otherwise.
							</p>
						</div>
					</div>

					{/* Implementation Notes */}
					<div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
						<div className="flex items-center gap-2 mb-3">
							<Bug className="w-4 h-4 text-purple-600" />
							<h4 className="font-semibold text-purple-900">
								Implementation Considerations
							</h4>
						</div>
						<div className="text-sm text-purple-800 space-y-2">
							<p>
								<strong>API Compatibility:</strong> Frontend
								parameters must align with backend validation
								ranges to avoid 422 errors.
							</p>
							<p>
								<strong>Error Handling:</strong> Comprehensive
								parameter validation prevents common mistakes
								and provides clear feedback.
							</p>
							<p>
								<strong>Component Architecture:</strong> Modular
								design enables easy maintenance and future
								extensions of the PU learning demo.
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
