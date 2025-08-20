"use client";

import { useState } from "react";
import GpsMap from "./components/GpsMap";

export default function Home() {
	const [location, setLocation] = useState<string>("위치 정보 대기 중...");

	return (
		<div className="font-sans">
			<header className="w-screen h-14 bg-neutral-900 text-white flex items-center justify-between px-5 box-border fixed top-0 left-0 z-50">
				<span className="font-bold">실시간 GPS 경로 추적</span>
				<span>{location}</span>
			</header>
			<GpsMap onLocationChange={setLocation} />
			<footer className="w-screen h-14 bg-neutral-900 text-white flex items-center justify-center px-5 box-border fixed bottom-0 left-0 z-50">
				<span>ⓒ 2025 GPSLIVE</span>
			</footer>
		</div>
	);
}
