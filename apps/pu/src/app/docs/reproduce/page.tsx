export default function ReproduceDocs() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-4">Reproducibility Guide</h1>
			<p className="text-slate-700 mb-4">
				All key runs include config hashes (seed, π̂ method, feature
				version, model). Exact reproduction steps are documented here.
			</p>
			<ul className="list-disc pl-6 text-slate-700 space-y-2">
				<li>
					PU Demo → export parameters; Case Study → import for
					Stage‑3.
				</li>
				<li>
					Record: seed, prior method, feature version, model config.
				</li>
				<li>
					Backend API: /api/v1/models/train-and-predict with saved
					payload.
				</li>
			</ul>
		</div>
	);
}
