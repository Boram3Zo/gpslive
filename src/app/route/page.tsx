"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";

interface CustomMarker {
	id: string;
	position: google.maps.LatLngLiteral;
	title: string;
}

// 경로 측청 결과 페이지
export default function RoutePage() {
	const mapRef = useRef<HTMLDivElement>(null);
	const [pathData, setPathData] = useState<google.maps.LatLngLiteral[]>([]);
	const mapInstance = useRef<google.maps.Map | null>(null);
	const polylineRef = useRef<google.maps.Polyline | null>(null);
	const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
	const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([]);
	const [isAddingMarker, setIsAddingMarker] = useState(false);
	const markersRef = useRef<google.maps.Marker[]>([]);
	const [currentRouteId, setCurrentRouteId] = useState<string>("");

	useEffect(() => {
		// localStorage에서 경로 데이터 로드
		const savedPath = localStorage.getItem("manualPath");
		if (savedPath) {
			const path = JSON.parse(savedPath);
			setPathData(path);

			// 경로 ID 생성
			const routeId = generateRouteId(path);
			setCurrentRouteId(routeId);

			// 해당 경로의 커스텀 마커 로드
			const savedMarkers = localStorage.getItem(`customMarkers_${routeId}`);
			if (savedMarkers) {
				setCustomMarkers(JSON.parse(savedMarkers));
			}
		}
	}, []);

	// 경로 ID 생성 함수
	const generateRouteId = (path: google.maps.LatLngLiteral[]): string => {
		if (path.length === 0) return "";
		const start = path[0];
		const end = path[path.length - 1];
		return `route_${start.lat.toFixed(6)}_${start.lng.toFixed(6)}_${end.lat.toFixed(6)}_${end.lng.toFixed(6)}_${
			path.length
		}`;
	};

	// 마커 추가 함수
	const addMarkerByClick = (position: google.maps.LatLngLiteral, title: string = "새 마커") => {
		if (!currentRouteId) return;

		const newMarker: CustomMarker = {
			id: Date.now().toString(),
			position,
			title,
		};

		const updatedMarkers = [...customMarkers, newMarker];
		setCustomMarkers(updatedMarkers);
		localStorage.setItem(`customMarkers_${currentRouteId}`, JSON.stringify(updatedMarkers));

		// 지도에 마커 추가
		if (mapInstance.current) {
			createMarkerOnMap(newMarker);
		}
	};

	// 지도에 마커 생성
	const createMarkerOnMap = (markerData: CustomMarker) => {
		if (!mapInstance.current) return;

		const marker = new window.google.maps.Marker({
			map: mapInstance.current,
			position: markerData.position,
			title: markerData.title,
			icon: {
				url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%23ff9900'/%3E%3C/svg%3E",
			},
		});

		// 마커 클릭 시 삭제 기능
		marker.addListener("click", () => {
			if (confirm(`마커 "${markerData.title}"을(를) 삭제하시겠습니까?`)) {
				deleteMarker(markerData.id);
			}
		});

		markersRef.current.push(marker);
	};

	// 마커 삭제 함수
	const deleteMarker = (markerId: string) => {
		if (!currentRouteId) return;

		const updatedMarkers = customMarkers.filter(m => m.id !== markerId);
		setCustomMarkers(updatedMarkers);
		localStorage.setItem(`customMarkers_${currentRouteId}`, JSON.stringify(updatedMarkers));

		// 지도 리로드로 마커 업데이트
		if (mapInstance.current && pathData.length > 0) {
			clearMapMarkers();
			handleMapLoad();
		}
	};

	// 모든 마커 제거
	const clearMapMarkers = () => {
		markersRef.current.forEach(marker => marker.setMap(null));
		markersRef.current = [];
	};

	const handleMapLoad = () => {
		if (!mapRef.current || window.google === undefined || pathData.length === 0) return;

		// 기존 마커들 제거
		clearMapMarkers();

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
		const startMarker = new window.google.maps.Marker({
			map: mapInstance.current,
			position: pathData[0],
			title: "시작점",
			icon: {
				url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%2300ff00'/%3E%3C/svg%3E",
			},
		});
		markersRef.current.push(startMarker);

		// 끝점 마커
		const endMarker = new window.google.maps.Marker({
			map: mapInstance.current,
			position: pathData[pathData.length - 1],
			title: "끝점",
			icon: {
				url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%23ff0000'/%3E%3C/svg%3E",
			},
		});
		markersRef.current.push(endMarker);

		// 커스텀 마커들 추가
		customMarkers.forEach(marker => {
			createMarkerOnMap(marker);
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathData, customMarkers]); // handleMapLoad는 의존성에서 제외

	// 클릭 이벤트 리스너 관리 - isAddingMarker 상태 변경시마다 재등록
	useEffect(() => {
		if (mapInstance.current) {
			// 기존 클릭 리스너 제거
			if (clickListenerRef.current) {
				clickListenerRef.current.remove();
			}

			// 새 클릭 리스너 등록
			clickListenerRef.current = mapInstance.current.addListener("click", (event: google.maps.MapMouseEvent) => {
				console.log("지도 클릭됨, 현재 마커 추가 모드:", isAddingMarker); // 디버깅용

				if (isAddingMarker && event.latLng) {
					const position = { lat: event.latLng.lat(), lng: event.latLng.lng() };
					console.log("클릭 위치:", position); // 디버깅용

					const title = prompt("마커 이름을 입력하세요:") || "클릭 마커";
					addMarkerByClick(position, title);
					setIsAddingMarker(false); // 마커 추가 후 모드 해제
				}
			});
		}

		// 컴포넌트 언마운트시 리스너 정리
		return () => {
			if (clickListenerRef.current) {
				clickListenerRef.current.remove();
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAddingMarker]); // isAddingMarker 상태가 변경될 때마다 이벤트 리스너 재등록

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
				<div className="flex items-center gap-3">
					<span className="font-bold">이동 경로 기록</span>
					<button
						onClick={() => setIsAddingMarker(!isAddingMarker)}
						className={`px-3 py-1 text-sm rounded ${
							isAddingMarker ? "bg-orange-600" : "bg-green-600"
						} text-white hover:opacity-80`}
					>
						{isAddingMarker ? "마커 추가 모드 OFF" : "마커 추가 모드 ON"}
					</button>
				</div>
				<span>
					총 {pathData.length}개 지점 | 마커 {customMarkers.length}개
				</span>
			</header>
			{/* 지도 영역 */}
			<div className="flex justify-center items-center" style={{ marginTop: 56, marginBottom: 56 }}>
				<div ref={mapRef} className="w-96 h-96"></div>
			</div>

			{/* 안내 메시지 */}
			{isAddingMarker && (
				<div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg z-40 text-center">
					<div>지도를 클릭하여 마커를 추가하세요</div>
				</div>
			)}

			{/* 마커 리스트 */}
			{pathData.length > 0 && (
				<div className="max-w-4xl mx-auto px-4 pb-20">
					<h3 className="text-lg font-bold mb-4 text-center">마커 목록</h3>
					<div className="space-y-2">
						{/* 시작점 */}
						<div className="bg-green-50 border border-green-200 rounded-lg p-3">
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 bg-green-500 rounded-full"></div>
								<div>
									<div className="font-semibold text-green-700">시작점</div>
									<div className="text-sm text-gray-600">
										위도: {pathData[0].lat.toFixed(6)} | 경도: {pathData[0].lng.toFixed(6)}
									</div>
								</div>
							</div>
						</div>

						{/* 커스텀 마커들 */}
						{customMarkers.map(marker => (
							<div key={marker.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-4 h-4 bg-orange-500 rounded-full"></div>
										<div>
											<div className="font-semibold text-orange-700">{marker.title}</div>
											<div className="text-sm text-gray-600">
												위도: {marker.position.lat.toFixed(6)} | 경도: {marker.position.lng.toFixed(6)}
											</div>
										</div>
									</div>
									<button onClick={() => deleteMarker(marker.id)} className="text-red-500 hover:text-red-700 text-sm">
										삭제
									</button>
								</div>
							</div>
						))}

						{/* 끝점 */}
						{pathData.length > 1 && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-3">
								<div className="flex items-center gap-3">
									<div className="w-4 h-4 bg-red-500 rounded-full"></div>
									<div>
										<div className="font-semibold text-red-700">끝점</div>
										<div className="text-sm text-gray-600">
											위도: {pathData[pathData.length - 1].lat.toFixed(6)} | 경도:{" "}
											{pathData[pathData.length - 1].lng.toFixed(6)}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* 통계 정보 */}
					<div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
						<div className="text-center">
							<div className="text-lg font-semibold text-gray-700 mb-2">경로 정보</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div>
									<span className="font-medium">총 경로 지점:</span>
									<span className="ml-2 text-blue-600">{pathData.length}개</span>
								</div>
								<div>
									<span className="font-medium">추가된 마커:</span>
									<span className="ml-2 text-orange-600">{customMarkers.length}개</span>
								</div>
								<div>
									<span className="font-medium">총 마커:</span>
									<span className="ml-2 text-green-600">{2 + customMarkers.length}개</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			<footer className="w-screen h-14 bg-neutral-900 text-white flex items-center justify-between px-5 box-border fixed bottom-0 left-0 z-50">
				<div className="flex gap-2">
					<Link href="/" className="px-4 py-2 text-base rounded bg-blue-600 text-white">
						홈으로
					</Link>
					<button onClick={clearPath} className="px-4 py-2 text-base rounded bg-red-600 text-white">
						경로 삭제
					</button>
					{customMarkers.length > 0 && (
						<button
							onClick={() => {
								if (!currentRouteId) return;
								setCustomMarkers([]);
								localStorage.removeItem(`customMarkers_${currentRouteId}`);
								if (mapInstance.current && pathData.length > 0) {
									clearMapMarkers();
									handleMapLoad();
								}
							}}
							className="px-4 py-2 text-base rounded bg-orange-600 text-white"
						>
							마커 전체 삭제
						</button>
					)}
				</div>
				<span>ⓒ 2025 GPSLIVE</span>
			</footer>
		</div>
	);
}
