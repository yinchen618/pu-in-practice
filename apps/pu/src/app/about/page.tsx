"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Brain,
	Building,
	Calendar,
	Code,
	Code2,
	Cpu,
	Database,
	Download,
	Github,
	Globe,
	GraduationCap,
	Linkedin,
	Mail,
	MapPin,
	Server,
	Wrench,
	Zap,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			<div className="container mx-auto px-4 py-12">
				{/* Hero Section */}
				<div className="text-center mb-16">
					<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 text-white mb-8">
						<GraduationCap className="h-12 w-12" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800">
						Yin-Chen Chen
					</h1>
					<h2 className="text-xl md:text-2xl text-slate-600 mb-6 font-medium">
						PhD Candidate in Machine Learning & IoT Systems
					</h2>
					<p className="text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed mb-8">
						Researcher & System Architect specializing in
						real-world, weakly-supervised learning applications. I
						am passionate about bridging state-of-the-art machine
						learning theory with real-world complex systems. My
						objective is to leverage a unique 95-unit smart
						residential testbed to develop and validate novel
						methodologies in weakly supervised and robust learning
						under conditions of imperfect information.
					</p>
					<div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 mb-8">
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							<span>Taiwan</span>
						</div>
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							<span>PhD Application 2026</span>
						</div>
						<div className="flex items-center gap-2">
							<Code className="h-4 w-4" />
							<span>Machine Learning & IoT</span>
						</div>
					</div>
					<div className="flex justify-center gap-4">
						<Button asChild>
							<Link
								href="/CV_YinChen_Chen_U-Tokyo_PhD_2026.pdf"
								target="_blank"
							>
								<Download className="h-4 w-4 mr-2" />
								Download CV as PDF
							</Link>
						</Button>
					</div>
				</div>

				{/* Publications Section - MOVED TO TOP */}
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
						Publications
					</h2>
					<div className="max-w-4xl mx-auto">
						<Card className="border-slate-200">
							<CardContent className="pt-6">
								{/* Note about name variation */}
								<div className="mb-4">
									<p className="text-slate-600 italic text-sm">
										Note: Earlier publications were
										published under the name Ying-Chen Chen.
									</p>
									<hr className="border-slate-300 mt-3" />
								</div>
								<div className="space-y-4">
									{/* 2022 Journal Paper - FIRST */}
									<div className="border-l-4 border-slate-600 pl-4">
										<p className="text-slate-700 leading-relaxed mb-2">
											Ray-I Chang,{" "}
											<strong>Ying-Chen Chen</strong>,
											Chi-Cheng Chuang, and Chia-Hui Wang.
											"Design and Implementation of an IoT
											Gateway for Zigbee and Wifi."{" "}
											<em>
												WSEAS Transactions on
												Communications
											</em>
											, Vol. 21, pp. 225-229, 2022.
										</p>
										<div className="flex items-center gap-2">
											<Link
												href="https://scholar.google.com.tw/citations?view_op=view_citation&hl=en&user=YiqWyHkAAAAJ&cstart=20&pagesize=80&sortby=pubdate&citation_for_view=YiqWyHkAAAAJ:SPgoriM2DtkC"
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
											>
												<Database className="h-3 w-3" />
												Cited by 1 on Google Scholar
											</Link>
										</div>
									</div>

									{/* 2009 Conference Paper - SECOND */}
									<div className="border-l-4 border-slate-600 pl-4">
										<p className="text-slate-700 leading-relaxed mb-2">
											<strong>Ying-Chen Chen</strong>,
											Chi-Cheng Chuang, Ray-I Chang,
											Jia-Shian Lin, and Te-Chih Wang.
											"Integrated Wireless Access Point
											Architecture for Wireless Sensor
											Networks."{" "}
											<em>
												Proceedings of the 11th
												International Conference on
												Advanced Communication
												Technology (ICACT)
											</em>
											, Republic of Korea, 2009.
										</p>
										<div className="flex items-center gap-2">
											<Link
												href="https://scholar.google.com.tw/citations?view_op=view_citation&hl=en&user=YiqWyHkAAAAJ&cstart=200&pagesize=100&sortby=pubdate&citation_for_view=YiqWyHkAAAAJ:_kc_bZDykSQC"
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
											>
												<Database className="h-3 w-3" />
												Cited by 15 on Google Scholar
											</Link>
										</div>
									</div>

									{/* 2009 Conference Paper - THIRD */}
									<div className="border-l-4 border-slate-600 pl-4">
										<p className="text-slate-700 leading-relaxed mb-2">
											<strong>Ying-Chen Chen</strong>,
											Chi-Cheng Chuang, and Ray-I Chang.
											"Wireless Sensor Network within an
											Open-Source Agent Framework."{" "}
											<em>
												Workshop on Wireless, Ad Hoc,
												and Sensor Networks
											</em>
											, Taiwan, Republic of China, 2009.
										</p>
									</div>

									{/* 2009 Conference Paper - FOURTH */}
									<div className="border-l-4 border-slate-600 pl-4">
										<p className="text-slate-700 leading-relaxed">
											Jia-Shian Lin, Chi-Cheng Chuang,
											Ray-I Chang,{" "}
											<strong>Ying-Chen Chen</strong>, and
											Te-Chih Wang. "A Priority-based
											Pattern Matching Location Algorithm
											for Wireless Sensor Networks."{" "}
											<em>
												Proceedings of the 11th
												International Conference on
												Advanced Communication
												Technology (ICACT)
											</em>
											, Republic of Korea, 2009.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Academic & Professional Trajectory Section - MOVED UP */}
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
						Academic & Professional Trajectory
					</h2>
					<div className="max-w-4xl mx-auto space-y-8">
						{/* Teaching Experience */}
						<Card className="border-slate-200">
							<CardHeader>
								<CardTitle className="text-xl text-slate-800 flex items-center gap-2">
									<GraduationCap className="h-5 w-5 text-slate-500" />
									Teaching Experience
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="border-l-4 border-slate-600 pl-4">
									<h3 className="font-semibold text-slate-800">
										Part-time Lecturer (AI & Programming)
									</h3>
									<p className="text-slate-600">
										Chung Yuan Christian University, Dept.
										of Commercial Design
									</p>
									<p className="text-sm text-slate-500">
										2022 - Present
									</p>
									<ul className="text-slate-600 mt-2 space-y-1">
										<li>
											• Designed and taught foundational
											AI and computing courses for
											non-STEM students
										</li>
										<li>
											• Achieved consistent teaching
											evaluations above 4.6/5.0 across all
											semesters
										</li>
										<li>
											• Developed custom systems including
											facial recognition attendance
											tracker
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>

						{/* Research Experience - ENHANCED */}
						<Card className="border-slate-200">
							<CardHeader>
								<CardTitle className="text-xl text-slate-800 flex items-center gap-2">
									<Brain className="h-5 w-5 text-slate-500" />
									Research Experience
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="border-l-4 border-slate-600 pl-4">
									<h3 className="font-semibold text-slate-800">
										Real-World Human Dynamics Laboratory
										(Smart Residential Testbed)
									</h3>
									<p className="text-slate-600">
										Lead Researcher & System Architect
									</p>
									<p className="text-sm text-slate-500">
										2015 - Present
									</p>
									<ul className="text-slate-600 mt-2 space-y-1">
										<li>
											• <strong>Led</strong> the design
											and implementation of a 95-unit
											smart residential IoT testbed for
											research in human behavior modeling
											and robust machine learning
										</li>
										<li>
											• <strong>Developed</strong> a
											complete data pipeline for
											collecting, processing, and
											analyzing high-resolution,
											multimodal time-series data
										</li>
										<li>
											• <strong>Authored</strong> and{" "}
											<strong>co-authored</strong> four
											peer-reviewed conference and journal
											papers in the fields of wireless
											sensor networks and IoT systems
										</li>
										<li>
											• Built on-premise AI systems for
											LLM (DeepSeek) and generative AI
											(Stable Diffusion) experimentation
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>

						{/* Professional Experience - ENHANCED */}
						<Card className="border-slate-200">
							<CardHeader>
								<CardTitle className="text-xl text-slate-800 flex items-center gap-2">
									<Globe className="h-5 w-5 text-slate-500" />
									Professional Experience
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="border-l-4 border-slate-600 pl-4">
									<h3 className="font-semibold text-slate-800">
										Founder / General Manager
									</h3>
									<p className="text-slate-600">
										Infowin Technology Co., Ltd., Taiwan
									</p>
									<p className="text-sm text-slate-500">
										2015 - Present
									</p>
									<ul className="text-slate-600 mt-2 space-y-1">
										<li>
											• Led a team of 3-7 to deliver
											end-to-end enterprise systems,
											managing software architecture,
											cloud deployment, and international
											client communication
										</li>
										<li>
											• Architected and deployed a smart
											campus system for Aichi
											International Academy in Nagoya,
											Japan,{" "}
											<strong>
												serving over 500 students
											</strong>{" "}
											and integrating multiple IoT sensors
										</li>
										<li>
											• Designed management systems for
											education, finance, religion, and
											real estate sectors
										</li>
									</ul>
								</div>
								<div className="border-l-4 border-slate-600 pl-4">
									<h3 className="font-semibold text-slate-800">
										Software Engineer
									</h3>
									<p className="text-slate-600">
										IBM Taiwan, Taipei
									</p>
									<p className="text-sm text-slate-500">
										2011 - 2014
									</p>
									<ul className="text-slate-600 mt-2 space-y-1">
										<li>
											• Developed and debugged UEFI
											firmware for IBM System x servers
										</li>
										<li>
											• Served on global UEFI solution
											team for critical system issues
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>

						{/* Education */}
						<Card className="border-slate-200">
							<CardHeader>
								<CardTitle className="text-xl text-slate-800 flex items-center gap-2">
									<GraduationCap className="h-5 w-5 text-slate-500" />
									Education
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="border-l-4 border-slate-600 pl-4">
									<h3 className="font-semibold text-slate-800">
										M.S., Engineering Science and Ocean
										Engineering
									</h3>
									<p className="text-slate-600">
										National Taiwan University, Taiwan |
										2009
									</p>
									<p className="text-slate-600 mt-2 italic">
										&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Laboratory:
										Information and Network Application Lab
										(Advisor: Prof. Ray-I Chang)
									</p>
									<p className="text-slate-600 mt-2 italic">
										&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Thesis:
										A Study on Integration and Configuration
										of Wireless Access Point and Wireless
										Sensor Networks
									</p>
								</div>
								<div className="border-l-4 border-slate-600 pl-4">
									<h3 className="font-semibold text-slate-800">
										B.S., Computer Science and Engineering
									</h3>
									<p className="text-slate-600">
										Tatung University, Taiwan | 2006
									</p>
								</div>
								<div className="border-l-4 border-slate-600 pl-4">
									<h3 className="font-semibold text-slate-800">
										Admitted to PhD Program, Engineering
										Science and Ocean Engineering
									</h3>
									<p className="text-slate-600">
										National Taiwan University, Taiwan |
										2009
									</p>
									<p className="text-slate-600 mt-2 italic">
										&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Admitted
										without oral examination; withdrew for
										national service and to pursue industry
										experience]
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Core Competencies Section - ENHANCED DESCRIPTIONS */}
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
						Core Competencies
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card className="text-center border-slate-200">
							<CardHeader>
								<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
									<Brain className="h-6 w-6 text-white" />
								</div>
								<CardTitle className="text-lg text-slate-800">
									Theoretical Depth
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-slate-600">
									Grounded in weakly-supervised learning
									literature (e.g., PU Learning), with
									experience in formulating and applying
									theoretical concepts to noisy, real-world
									data.
								</p>
							</CardContent>
						</Card>

						<Card className="text-center border-slate-200">
							<CardHeader>
								<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
									<Building className="h-6 w-6 text-white" />
								</div>
								<CardTitle className="text-lg text-slate-800">
									System Implementation
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-slate-600">
									Proven ability to architect and deploy
									end-to-end hardware/software systems, from
									sensor integration and on-premise AI servers
									to data pipelines and user-facing
									applications.
								</p>
							</CardContent>
						</Card>

						<Card className="text-center border-slate-200">
							<CardHeader>
								<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
									<Zap className="h-6 w-6 text-white" />
								</div>
								<CardTitle className="text-lg text-slate-800">
									Applied Problem Solving
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-slate-600">
									A decade of experience in translating
									ambiguous real-world challenges—in smart
									buildings, education, and finance—into
									robust, data-driven technical solutions.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Technical Skills */}
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
						Technical Skills
					</h2>
					<div className="max-w-4xl mx-auto">
						<Card className="border-slate-200">
							<CardContent className="pt-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* Column 1 */}
									<div className="space-y-6">
										{/* Deep Learning & Models */}
										<div>
											<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
												<Brain className="h-4 w-4" />
												Deep Learning & Models
											</h4>
											<div className="flex flex-wrap gap-2">
												<Badge
													variant="secondary"
													className="text-xs"
												>
													PU Learning (uPU, nnPU)
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Reinforcement Learning
													(Q-Learning)
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Generative Models (Stable
													Diffusion)
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													LLM Deployment (DeepSeek)
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Computer Vision (Facial
													Recognition)
												</Badge>
											</div>
										</div>

										{/* IoT & Embedded Systems */}
										<div>
											<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
												<Cpu className="h-4 w-4" />
												IoT & Embedded Systems
											</h4>
											<div className="flex flex-wrap gap-2">
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Smart Meters
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Sensor Integration
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													MCU Development
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													UEFI Firmware
												</Badge>
											</div>
										</div>
									</div>

									{/* Column 2 */}
									<div className="space-y-6">
										{/* Frameworks & Libraries */}
										<div>
											<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
												<Wrench className="h-4 w-4" />
												Frameworks & Libraries
											</h4>
											<div className="flex flex-wrap gap-2">
												<Badge
													variant="secondary"
													className="text-xs"
												>
													PyTorch
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Scikit-learn
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Pandas
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													OpenCV
												</Badge>
											</div>
										</div>

										{/* Programming & Data */}
										<div>
											<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
												<Code2 className="h-4 w-4" />
												Programming & Data
											</h4>
											<div className="flex flex-wrap gap-2">
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Python
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													C/C++
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Java
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													JavaScript
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													PostgreSQL
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													MySQL
												</Badge>
											</div>
										</div>

										{/* Infrastructure & Tools */}
										<div>
											<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
												<Server className="h-4 w-4" />
												Infrastructure & Tools
											</h4>
											<div className="flex flex-wrap gap-2">
												<Badge
													variant="secondary"
													className="text-xs"
												>
													AWS
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Docker
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Git
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Linux
												</Badge>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													RESTful APIs
												</Badge>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Awards & Honors */}
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
						Awards & Honors
					</h2>
					<div className="max-w-4xl mx-auto">
						<Card className="border-slate-200">
							<CardContent className="pt-6">
								<div className="space-y-2">
									<div className="flex items-start gap-2">
										<div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0" />
										<p className="text-slate-600">
											University-Level Excellent Course
											Design Award, Chung Yuan Christian
											University, 2024, 2025
										</p>
									</div>
									<div className="flex items-start gap-2">
										<div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0" />
										<p className="text-slate-600">
											Outstanding Landlord Award, Chung
											Yuan Christian University, 2018
										</p>
									</div>
									<div className="flex items-start gap-2">
										<div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0" />
										<p className="text-slate-600">
											Third Prize, 4th ARM Code-O-Rama
											Embedded Programming Contest, 2008
										</p>
									</div>
									<div className="flex items-start gap-2">
										<div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0" />
										<p className="text-slate-600">
											Champion, 3rd ARM Code-O-Rama
											Embedded Programming Contest, 2007
										</p>
									</div>
									<div className="flex items-start gap-2">
										<div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0" />
										<p className="text-slate-600">
											Champion, 7th NTU Innovation
											Competition, 2007
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* GitHub Section */}
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
						Project Repository & Source Code
					</h2>
					<Card className="border-slate-200 max-w-4xl mx-auto">
						<CardContent className="space-y-4">
							<p className="text-slate-600 leading-relaxed">
								In the spirit of academic transparency and open
								collaboration, the complete source code for this
								website and its underlying projects is publicly
								available on GitHub. This repository includes
								the implementation of the IoT testbed data
								explorer and the weakly-supervised learning case
								study. I encourage you to inspect the code to
								see the project's architecture, development
								process, and technical details.
							</p>
							<div className="flex gap-4">
								<Button asChild>
									<Link
										href="https://github.com/your-username/your-repo-name"
										target="_blank"
										rel="noopener noreferrer"
									>
										<Github className="h-4 w-4 mr-2" />
										View on GitHub
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Contact Section */}
				<div className="text-center">
					<h2 className="text-3xl font-bold mb-8 text-slate-800">
						Get in Touch
					</h2>
					<div className="flex justify-center gap-6">
						<Button variant="outline" asChild>
							<Link href="mailto:yinchen618@gmail.com">
								<Mail className="h-4 w-4 mr-2" />
								Email
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link
								href="https://linkedin.com/in/your-profile"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Linkedin className="h-4 w-4 mr-2" />
								LinkedIn
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link
								href="https://github.com/your-username"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Github className="h-4 w-4 mr-2" />
								GitHub
							</Link>
						</Button>
					</div>
					<div className="mt-4 text-sm text-slate-500">
						Languages: Mandarin Chinese (Native), English (Fluent),
						Japanese (Intermediate, JLPT N2)
					</div>
				</div>
			</div>
		</div>
	);
}
