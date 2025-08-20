let map,
	marker,
	pathPolyline,
	pathCoords = [],
	statusDiv,
	watchId = null;

function initMap() {
	map = new google.maps.Map(document.getElementById("map"), {
		zoom: 16,
		center: { lat: 37.5665, lng: 126.978 }, // 초기 위치(서울)
	});

	marker = new google.maps.Marker({
		map,
		position: map.getCenter(),
		title: "현재 위치",
	});

	pathPolyline = new google.maps.Polyline({
		path: pathCoords,
		geodesic: true,
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 3,
		map,
	});

	// 헤더 위치 정보 span 참조
	statusDiv = document.getElementById("location-info");

	// 버튼 이벤트 등록
	document.getElementById("start-btn").addEventListener("click", startTracking);
	document.getElementById("stop-btn").addEventListener("click", stopTracking);

	updateStatus("GPS: 대기 중...");
}

function startTracking() {
	if (navigator.geolocation) {
		if (watchId !== null) {
			navigator.geolocation.clearWatch(watchId);
		}
		watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 10000,
		});
		updateStatus("GPS: 추적 시작");
	} else {
		updateStatus("이 브라우저는 GPS를 지원하지 않습니다.");
	}
}

function stopTracking() {
	if (watchId !== null) {
		navigator.geolocation.clearWatch(watchId);
		watchId = null;
		updateStatus("GPS: 추적 정지");
	}
}

function updatePosition(position) {
	const { latitude, longitude } = position.coords;
	const latLng = { lat: latitude, lng: longitude };
	marker.setPosition(latLng);
	map.setCenter(latLng);

	pathCoords.push(latLng);
	pathPolyline.setPath(pathCoords);

	updateStatus(`실시간 수신 중 | 위도: ${latitude.toFixed(6)} | 경도: ${longitude.toFixed(6)}`);
}

function handleError(error) {
	updateStatus("GPS 오류: " + error.message);
}

function updateStatus(msg) {
	if (statusDiv) {
		statusDiv.innerText = msg;
	}
}
