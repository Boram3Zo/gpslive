"use client";

import { useEffect, useState, useRef } from "react";

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
	DELTA = 0.01,
	onMove,
}: ManualGpsControlProps) {
	const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			setKeysPressed(prev => new Set(prev).add(e.key));
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			setKeysPressed(prev => {
				const newKeys = new Set(prev);
				newKeys.delete(e.key);
				return newKeys;
			});
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	useEffect(() => {
		if (!manualLatLng) return;

		const animate = () => {
			let { lat, lng } = manualLatLng;
			let moved = false;

			if (keysPressed.has("w") || keysPressed.has("ArrowUp")) {
				lat += DELTA;
				moved = true;
			}
			if (keysPressed.has("s") || keysPressed.has("ArrowDown")) {
				lat -= DELTA;
				moved = true;
			}
			if (keysPressed.has("a") || keysPressed.has("ArrowLeft")) {
				lng -= DELTA;
				moved = true;
			}
			if (keysPressed.has("d") || keysPressed.has("ArrowRight")) {
				lng += DELTA;
				moved = true;
			}

			if (moved) {
				const newLatLng = { lat, lng };
				setManualLatLng(newLatLng);
				setLocation(`수동 모드 | 위도: ${lat.toFixed(6)} | 경도: ${lng.toFixed(6)}`);
				if (onMove) onMove(newLatLng);
			}

			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [keysPressed, manualLatLng, setManualLatLng, setLocation, DELTA, onMove]);

	return null;
}
