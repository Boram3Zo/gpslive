let map,
	marker,
	pathPolyline,
	pathCoords = [],
	statusDiv;

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

	// 오른쪽 상단 상태 표시 div 생성
	statusDiv = document.createElement("div");
	statusDiv.id = "gps-status";
	statusDiv.style.position = "fixed";
	statusDiv.style.top = "16px";
	statusDiv.style.right = "16px";
	statusDiv.style.background = "rgba(0,0,0,0.7)";
	statusDiv.style.color = "#fff";
	statusDiv.style.padding = "8px 16px";
	statusDiv.style.borderRadius = "8px";
	statusDiv.style.zIndex = "1000";
	statusDiv.style.fontSize = "1rem";
	statusDiv.innerText = "GPS: 연결 대기 중...";
	document.body.appendChild(statusDiv);

	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(updatePosition, handleError, {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 10000,
		});
	} else {
		updateStatus("이 브라우저는 GPS를 지원하지 않습니다.");
	}
}

function updatePosition(position) {
	const { latitude, longitude } = position.coords;
	const latLng = { lat: latitude, lng: longitude };
	marker.setPosition(latLng);
	map.setCenter(latLng);

	pathCoords.push(latLng);
	pathPolyline.setPath(pathCoords);

	updateStatus(`GPS: 실시간 수신 중\n위도: ${latitude.toFixed(6)}\n경도: ${longitude.toFixed(6)}`);
}

function handleError(error) {
	updateStatus("GPS 오류: " + error.message);
}

function updateStatus(msg) {
	if (statusDiv) {
		statusDiv.innerText = msg;
		// 줄바꿈 처리
		statusDiv.innerHTML = msg.replace(/\n/g, "<br>");
	}
}
