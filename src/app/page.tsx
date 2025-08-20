"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function Home() {
	const mapRef = useRef<HTMLDivElement>(null);
	const [location, setLocation] = useState<string>("위치 정보 대기 중...");
	const [tracking, setTracking] = useState(false);
	const watchIdRef = useRef<number | null>(null);
	const mapInstance = useRef<google.maps.Map | null>(null);
	const markerRef = useRef<google.maps.Marker | null>(null);
	const polylineRef = useRef<google.maps.Polyline | null>(null);
	const pathCoordsRef = useRef<google.maps.LatLngLiteral[]>([]);

	// Google Maps API 로드 후 초기화
	const handleMapLoad = () => {
		if (!mapRef.current || window.google === undefined) return;
		mapInstance.current = new window.google.maps.Map(mapRef.current, {
			zoom: 16,
			center: { lat: 37.5665, lng: 126.978 },
		});
		markerRef.current = new window.google.maps.Marker({
			map: mapInstance.current,
			position: { lat: 37.5665, lng: 126.978 },
			title: "현재 위치",
		});
		polylineRef.current = new window.google.maps.Polyline({
			path: [],
			geodesic: true,
			strokeColor: "#FF0000",
			strokeOpacity: 1.0,
			strokeWeight: 3,
			map: mapInstance.current,
		});
	};

	// 위치 추적 시작
	const startTracking = () => {
		if (navigator.geolocation) {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
			watchIdRef.current = navigator.geolocation.watchPosition(updatePosition, handleError, {
				enableHighAccuracy: true,
				maximumAge: 0,
				timeout: 10000,
			});
			setTracking(true);
			setLocation("GPS: 추적 시작");
		} else {
			setLocation("이 브라우저는 GPS를 지원하지 않습니다.");
		}
	};

	// 위치 추적 정지
	const stopTracking = () => {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
			setLocation("GPS: 추적 정지");
		}
		setTracking(false);
	};

	// 위치 업데이트
	const updatePosition = (position: GeolocationPosition) => {
		const { latitude, longitude } = position.coords;
		setLocation(`실시간 수신 중 | 위도: ${latitude.toFixed(6)} | 경도: ${longitude.toFixed(6)}`);
		if (mapInstance.current && markerRef.current && polylineRef.current) {
			const latLng = { lat: latitude, lng: longitude };
			markerRef.current.setPosition(latLng);
			mapInstance.current.setCenter(latLng);
			pathCoordsRef.current.push(latLng);
			polylineRef.current.setPath(pathCoordsRef.current);
		}
	};

	// 오류 처리
	const handleError = (error: GeolocationPositionError) => {
		setLocation("GPS 오류: " + error.message);
	};

	// Google Maps API 로드 후 초기화
	useEffect(() => {
		if (window.google && window.google.maps && mapRef.current) {
			handleMapLoad();
		}
	}, []);

	return (
		<div style={{ fontFamily: "sans-serif" }}>
			<Script
				src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDdwH85Wz-QjqWM8rP97Jrg_Gvi8Pt-Ytk"
				strategy="afterInteractive"
				onLoad={handleMapLoad}
			/>
			<header
				style={{
					width: "100vw",
					height: 56,
					background: "#222",
					color: "#fff",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0 20px",
					boxSizing: "border-box",
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: 1100,
				}}
			>
				<span style={{ fontWeight: "bold" }}>실시간 GPS 경로 추적</span>
				<span>{location}</span>
			</header>
			<div
				ref={mapRef}
				id="map"
				style={{
					width: "100vw",
					height: "calc(100vh - 112px)",
					marginTop: 56,
					marginBottom: 56,
				}}
			></div>
			<footer
				style={{
					width: "100vw",
					height: 56,
					background: "#222",
					color: "#fff",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					position: "fixed",
					bottom: 0,
					left: 0,
					zIndex: 1100,
					padding: "0 20px",
					boxSizing: "border-box",
				}}
			>
				<div>
					<button
						id="start-btn"
						style={{ marginRight: 8, padding: "8px 16px", fontSize: "1rem" }}
						onClick={startTracking}
						disabled={tracking}
					>
						시작
					</button>
					<button
						id="stop-btn"
						style={{ padding: "8px 16px", fontSize: "1rem" }}
						onClick={stopTracking}
						disabled={!tracking}
					>
						정지
					</button>
				</div>
				<span>ⓒ 2025 GPSLIVE</span>
			</footer>
		</div>
	);
}
