"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";

export default function RoutePage() {
	const mapRef = useRef<HTMLDivElement>(null);
	const [pathData, setPathData] = useState<google.maps.LatLngLiteral[]>([]);
	const mapInstance = useRef<google.maps.Map | null>(null);
	const polylineRef = useRef<google.maps.Polyline | null>(null);

	useEffect(() => {
		// localStorage에서 경로 데이터 로드
		const savedPath = localStorage.getItem("manualPath");
		if (savedPath) {
			const path = JSON.parse(savedPath);
			setPathData(path);
		}
	}, []);

	const handleMapLoad = () => {
		if (!mapRef.current || window.google === undefined || pathData.length === 0) return;

		// 경로의 중심점 계산
		const center = pathData.reduce(
			(acc, point) => ({
				lat: acc.lat + point.lat / pathData.length,
				lng: acc.lng + point.lng / pathData.length,
			}),
			{ lat: 0, lng: 0 }
		);

		mapInstance.current = new window.google.maps.Map(mapRef.current, {
			zoom: 16,
			center: center,
		});

		// 시작점 마커
		new window.google.maps.Marker({
			map: mapInstance.current,
			position: pathData[0],
			title: "시작점",
			icon: {
				url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%2300ff00'/%3E%3C/svg%3E",
			},
		});

		// 끝점 마커
		new window.google.maps.Marker({
			map: mapInstance.current,
			position: pathData[pathData.length - 1],
			title: "끝점",
			icon: {
				url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%23ff0000'/%3E%3C/svg%3E",
			},
		});

		// 경로선 그리기
		polylineRef.current = new window.google.maps.Polyline({
			path: pathData,
			geodesic: true,
			strokeColor: "#0000FF",
			strokeOpacity: 1.0,
			strokeWeight: 3,
			map: mapInstance.current,
		});
	};

	useEffect(() => {
		if (window.google && window.google.maps && mapRef.current && pathData.length > 0) {
			handleMapLoad();
		}
	}, [pathData]);

	const clearPath = () => {
		localStorage.removeItem("manualPath");
		setPathData([]);
	};

	return (
		<div className="font-sans">
			<Script
				src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDdwH85Wz-QjqWM8rP97Jrg_Gvi8Pt-Ytk"
				strategy="afterInteractive"
				onLoad={() => {
					if (pathData.length > 0) handleMapLoad();
				}}
			/>
			<header className="w-screen h-14 bg-neutral-900 text-white flex items-center justify-between px-5 box-border fixed top-0 left-0 z-50">
				<span className="font-bold">이동 경로 기록</span>
				<span>총 {pathData.length}개 지점</span>
			</header>
			<div
				ref={mapRef}
				className="w-screen"
				style={{ height: "calc(100vh - 112px)", marginTop: 56, marginBottom: 56 }}
			></div>
			<footer className="w-screen h-14 bg-neutral-900 text-white flex items-center justify-between px-5 box-border fixed bottom-0 left-0 z-50">
				<div className="flex gap-2">
					<Link href="/" className="px-4 py-2 text-base rounded bg-blue-600 text-white">
						홈으로
					</Link>
					<button onClick={clearPath} className="px-4 py-2 text-base rounded bg-red-600 text-white">
						경로 삭제
					</button>
				</div>
				<span>ⓒ 2025 GPSLIVE</span>
			</footer>
		</div>
	);
}
