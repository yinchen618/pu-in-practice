import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AcademicReference() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>學術參考</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<p className="text-gray-700">
						本次實驗所演示的 PU
						學習思想，其嚴謹的統計學基礎和無偏差風險估計，主要基於杉山將教授實驗室的開創性研究。
					</p>
					<div>
						<h4 className="font-semibold mb-2">代表性論文</h4>
						<div className="bg-gray-50 p-4 rounded-lg">
							<p className="mb-2">
								Niu, G., du Plessis, M. C., Kitagawa, T., &
								Sugiyama, M. (2016).{" "}
								<a
									href="https://arxiv.org/abs/1703.00593"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline"
								>
									Positive-Unlabeled Learning with
									Non-Negative Risk Estimator
								</a>
								. In Advances in Neural Information Processing
								Systems (NeurIPS).
							</p>
							<p className="text-sm text-gray-600 mt-3">
								為何引用這篇？因為這篇論文提出的 uPU (unbiased
								PU learning) 演算法，從根本上解決了傳統 PU
								學習在評估模型風險時會出現的系統性偏差，是該領域的黃金標準之一，也奠定了後續大量研究的基礎。
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
