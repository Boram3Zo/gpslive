"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import ManualGpsControl from "./ManualGpsControl";

export default function GpsMap({ onLocationChange }: { onLocationChange?: (msg: string) => void }) {
	const mapRef = useRef<HTMLDivElement>(null);
	const [location, setLocation] = useState<string>("위치 정보 대기 중...");
	const [tracking, setTracking] = useState(false);
	const [manualMode, setManualMode] = useState(false);
	const [manualLatLng, setManualLatLng] = useState<{ lat: number; lng: number } | null>(null);
	const watchIdRef = useRef<number | null>(null);
	const mapInstance = useRef<google.maps.Map | null>(null);
	const markerRef = useRef<google.maps.Marker | null>(null);
	const polylineRef = useRef<google.maps.Polyline | null>(null);
	const pathCoordsRef = useRef<google.maps.LatLngLiteral[]>([]);

	const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
	const DELTA = 0.0001;

	useEffect(() => {
		if (onLocationChange) onLocationChange(location);
	}, [location, onLocationChange]);

	const handleMapLoad = () => {
		if (!mapRef.current || window.google === undefined) return;
		mapInstance.current = new window.google.maps.Map(mapRef.current, {
			zoom: 16,
			center: DEFAULT_CENTER,
		});
		markerRef.current = new window.google.maps.Marker({
			map: mapInstance.current,
			position: DEFAULT_CENTER,
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

	const startTracking = () => {
		if (manualMode) return;
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

	const stopTracking = () => {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
			setLocation("GPS: 추적 정지");
		}
		setTracking(false);
	};

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

	const handleError = (error: GeolocationPositionError) => {
		setLocation("GPS 오류: " + error.message);
	};

	const toggleManualMode = () => {
		if (tracking) return;
		setManualMode(prev => {
			const next = !prev;
			if (next) {
				setManualLatLng(DEFAULT_CENTER);
				setLocation(`수동 모드 | 위도: ${DEFAULT_CENTER.lat.toFixed(6)} | 경도: ${DEFAULT_CENTER.lng.toFixed(6)}`);
				pathCoordsRef.current = [DEFAULT_CENTER];
				if (mapInstance.current && markerRef.current && polylineRef.current) {
					markerRef.current.setPosition(DEFAULT_CENTER);
					mapInstance.current.setCenter(DEFAULT_CENTER);
					polylineRef.current.setPath([DEFAULT_CENTER]);
				}
			} else {
				setManualLatLng(null);
				setLocation("수동 모드 종료");
			}
			return next;
		});
	};

	// ManualGpsControl에서 지도/마커/경로 업데이트
	const handleManualMove = (newLatLng: { lat: number; lng: number }) => {
		if (mapInstance.current && markerRef.current && polylineRef.current) {
			markerRef.current.setPosition(newLatLng);
			mapInstance.current.setCenter(newLatLng);
			pathCoordsRef.current.push(newLatLng);
			polylineRef.current.setPath(pathCoordsRef.current);
		}
	};

	useEffect(() => {
		if (window.google && window.google.maps && mapRef.current) {
			handleMapLoad();
		}
	}, []);

	return (
		<div className="font-sans">
			<Script
				src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDdwH85Wz-QjqWM8rP97Jrg_Gvi8Pt-Ytk"
				strategy="afterInteractive"
				onLoad={handleMapLoad}
			/>
			<div className="flex justify-center items-center flex-col">
				<div ref={mapRef} id="map" className="size-96"></div>
				<div className="flex gap-2 justify-center mt-2">
					<button
						id="start-btn"
						className="px-4 py-2 text-base rounded bg-blue-600 text-white disabled:bg-gray-400"
						onClick={startTracking}
						disabled={tracking || manualMode}
					>
						시작
					</button>
					<button
						id="stop-btn"
						className="px-4 py-2 text-base rounded bg-red-600 text-white disabled:bg-gray-400"
						onClick={stopTracking}
						disabled={!tracking}
					>
						정지
					</button>
					<button
						className={`px-4 py-2 text-base rounded ${manualMode ? "bg-yellow-500" : "bg-gray-600"} text-white`}
						onClick={toggleManualMode}
						disabled={tracking}
					>
						{manualMode ? "수동모드 종료" : "수동모드"}
					</button>
				</div>
			</div>
			{/* 수동모드 활성화 시 ManualGpsControl 사용 */}
			{manualMode && (
				<ManualGpsControl
					manualLatLng={manualLatLng}
					setManualLatLng={setManualLatLng}
					setLocation={setLocation}
					DELTA={DELTA}
					onMove={handleManualMove}
				/>
			)}
		</div>
	);
}
