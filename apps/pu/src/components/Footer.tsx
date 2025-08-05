"use client";

import { Github, Globe, Linkedin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">
					{/* Social Links */}
					<div className="flex justify-center gap-6 mb-4">
						<Link
							href="https://github.com/your-username/your-repo-name"
							target="_blank"
							rel="noopener noreferrer"
							className="text-slate-600 hover:text-slate-800 transition-colors"
							aria-label="GitHub"
						>
							<Github className="h-6 w-6" />
						</Link>
						<Link
							href="https://linkedin.com/in/your-profile"
							target="_blank"
							rel="noopener noreferrer"
							className="text-slate-600 hover:text-slate-800 transition-colors"
							aria-label="LinkedIn"
						>
							<Linkedin className="h-6 w-6" />
						</Link>
						<Link
							href="https://yinchen.tw"
							target="_blank"
							rel="noopener noreferrer"
							className="text-slate-600 hover:text-slate-800 transition-colors"
							aria-label="Personal Website"
						>
							<Globe className="h-6 w-6" />
						</Link>
					</div>

					{/* Copyright */}
					<p className="text-sm text-slate-500">
						© 2025 Yin-Chen Chen. All Rights Reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
