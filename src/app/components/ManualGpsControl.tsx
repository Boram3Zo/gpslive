"use client";

import { useEffect } from "react";

export interface ManualGpsControlProps {
	manualLatLng: { lat: number; lng: number } | null;
	setManualLatLng: (latlng: { lat: number; lng: number }) => void;
	setLocation: (msg: string) => void;
	DELTA?: number;
	onMove?: (latlng: { lat: number; lng: number }) => void;
}

export default function ManualGpsControl({
	manualLatLng,
	setManualLatLng,
	setLocation,
	DELTA = 0.0001,
	onMove,
}: ManualGpsControlProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!manualLatLng) return;
			let { lat, lng } = manualLatLng;
			switch (e.key) {
				case "w":
				case "ArrowUp":
					lat += DELTA;
					break;
				case "s":
				case "ArrowDown":
					lat -= DELTA;
					break;
				case "a":
				case "ArrowLeft":
					lng -= DELTA;
					break;
				case "d":
				case "ArrowRight":
					lng += DELTA;
					break;
				default:
					return;
			}
			const newLatLng = { lat, lng };
			setManualLatLng(newLatLng);
			setLocation(`수동 모드 | 위도: ${lat.toFixed(6)} | 경도: ${lng.toFixed(6)}`);
			if (onMove) onMove(newLatLng);
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [manualLatLng, setManualLatLng, setLocation, DELTA, onMove]);

	return null;
}
