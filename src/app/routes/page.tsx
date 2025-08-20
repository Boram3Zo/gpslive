"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SavedRoute {
  id: string;
  name: string;
  createdAt: string;
  path: google.maps.LatLngLiteral[];
  pointCount: number;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);

  useEffect(() => {
    // localStorage에서 저장된 경로들 로드
    const savedRoutes = localStorage.getItem("savedRoutes");
    if (savedRoutes) {
      setRoutes(JSON.parse(savedRoutes));
    }
  }, []);

  const deleteRoute = (id: string) => {
    const updatedRoutes = routes.filter(route => route.id !== id);
    setRoutes(updatedRoutes);
    localStorage.setItem("savedRoutes", JSON.stringify(updatedRoutes));
  };

  const viewRoute = (route: SavedRoute) => {
    // 선택한 경로를 임시 저장 후 route 페이지로 이동
    localStorage.setItem("manualPath", JSON.stringify(route.path));
    window.location.href = "/route";
  };

  const clearAllRoutes = () => {
    setRoutes([]);
    localStorage.removeItem("savedRoutes");
    localStorage.removeItem("manualPath");
  };

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      <header className="w-screen h-14 bg-neutral-900 text-white flex items-center justify-between px-5 box-border fixed top-0 left-0 z-50">
        <div className="flex items-center gap-4">
          <span className="font-bold">경로 목록</span>
          <Link href="/" className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">
            홈으로
          </Link>
        </div>
        <span>총 {routes.length}개 경로</span>
      </header>

      <div className="pt-16 pb-4 px-4">
        {routes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">저장된 경로가 없습니다.</p>
            <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
              새 경로 만들기
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">저장된 경로들</h1>
              <button
                onClick={clearAllRoutes}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                모든 경로 삭제
              </button>
            </div>
            
            <div className="grid gap-4">
              {routes.map((route) => (
                <div key={route.id} className="bg-white rounded-lg shadow-md p-6 border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {route.name}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>생성일: {new Date(route.createdAt).toLocaleString('ko-KR')}</p>
                        <p>지점 수: {route.pointCount}개</p>
                        <p>시작점: 위도 {route.path[0]?.lat.toFixed(6)}, 경도 {route.path[0]?.lng.toFixed(6)}</p>
                        <p>끝점: 위도 {route.path[route.path.length - 1]?.lat.toFixed(6)}, 경도 {route.path[route.path.length - 1]?.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => viewRoute(route)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        지도 보기
                      </button>
                      <button
                        onClick={() => deleteRoute(route.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
