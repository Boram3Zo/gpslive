let map,
	marker,
	pathPolyline,
	pathCoords = [];

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

	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(updatePosition, handleError, {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 10000,
		});
	} else {
		alert("이 브라우저는 GPS를 지원하지 않습니다.");
	}
}

function updatePosition(position) {
	const { latitude, longitude } = position.coords;
	const latLng = { lat: latitude, lng: longitude };
	marker.setPosition(latLng);
	map.setCenter(latLng);

	pathCoords.push(latLng);
	pathPolyline.setPath(pathCoords);
}

function handleError(error) {
	alert("GPS 오류: " + error.message);
}
