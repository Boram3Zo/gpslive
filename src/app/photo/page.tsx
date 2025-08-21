"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import exifr from "exifr";

interface ExifData {
	make?: string;
	model?: string;
	dateTime?: string;
	dateTimeOriginal?: string;
	latitude?: number;
	longitude?: number;
	orientation?: number;
	flash?: string;
	focalLength?: number;
	iso?: number;
	aperture?: number;
	shutterSpeed?: string;
	width?: number;
	height?: number;
	fileSize?: number;
	fileName?: string;
	colorSpace?: string;
	whiteBalance?: string;
	exposureMode?: string;
	meteringMode?: string;
	sceneCaptureType?: string;
	digitalZoomRatio?: number;
	exposureBias?: number;
	maxApertureValue?: number;
	subjectDistance?: number;
	lens?: string;
	software?: string;
	artist?: string;
	copyright?: string;
	imageDescription?: string;
	xResolution?: number;
	yResolution?: number;
	resolutionUnit?: string;
	compression?: string;
	photometricInterpretation?: string;
	samplesPerPixel?: number;
	bitsPerSample?: number[];
	planarConfiguration?: number;
	[key: string]: unknown; // 기타 모든 EXIF 데이터를 포함하기 위함
}

interface UploadedPhoto {
	id: string;
	file: File;
	previewUrl: string;
	exifData: ExifData;
}

export default function PhotoPage() {
	const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
	const [selectedPhoto, setSelectedPhoto] = useState<UploadedPhoto | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 안전한 문자열 변환 함수
	const safeStringify = (value: unknown): string => {
		if (value === null || value === undefined) return "";
		if (typeof value === "string") return value;
		if (typeof value === "number" || typeof value === "boolean") return String(value);
		if (value instanceof Date) return value.toLocaleString();
		if (typeof value === "object") {
			try {
				return JSON.stringify(value);
			} catch {
				return String(value);
			}
		}
		return String(value);
	};

	// EXIF 데이터 추출 함수
	const extractExifData = async (file: File): Promise<ExifData> => {
		try {
			// exifr을 사용하여 모든 EXIF 데이터 추출
			const exifData = (await exifr.parse(file, true)) || {};

			// 이미지 크기 정보를 얻기 위해 HTMLImageElement 객체 생성
			const img = document.createElement("img");
			const imageUrl = URL.createObjectURL(file);

			return new Promise(resolve => {
				img.onload = () => {
					const fullExifData: ExifData = {
						// 기본 파일 정보
						fileName: file.name,
						fileSize: file.size,
						width: img.width,
						height: img.height,

						// EXIF 데이터
						make: exifData.Make,
						model: exifData.Model,
						dateTime: exifData.DateTime,
						dateTimeOriginal: exifData.DateTimeOriginal,
						latitude: exifData.latitude,
						longitude: exifData.longitude,
						orientation: exifData.Orientation,
						flash: exifData.Flash,
						focalLength: exifData.FocalLength,
						iso: exifData.ISO,
						aperture: exifData.FNumber || exifData.ApertureValue,
						shutterSpeed: exifData.ExposureTime,
						colorSpace: exifData.ColorSpace,
						whiteBalance: exifData.WhiteBalance,
						exposureMode: exifData.ExposureMode,
						meteringMode: exifData.MeteringMode,
						sceneCaptureType: exifData.SceneCaptureType,
						digitalZoomRatio: exifData.DigitalZoomRatio,
						exposureBias: exifData.ExposureBiasValue,
						maxApertureValue: exifData.MaxApertureValue,
						subjectDistance: exifData.SubjectDistance,
						lens: exifData.LensModel || exifData.LensMake,
						software: exifData.Software,
						artist: exifData.Artist,
						copyright: exifData.Copyright,
						imageDescription: exifData.ImageDescription,
						xResolution: exifData.XResolution,
						yResolution: exifData.YResolution,
						resolutionUnit: exifData.ResolutionUnit,
						compression: exifData.Compression,
						photometricInterpretation: exifData.PhotometricInterpretation,
						samplesPerPixel: exifData.SamplesPerPixel,
						bitsPerSample: exifData.BitsPerSample,
						planarConfiguration: exifData.PlanarConfiguration,

						// 모든 원본 EXIF 데이터 포함
						...exifData,
					};

					URL.revokeObjectURL(imageUrl);
					resolve(fullExifData);
				};

				img.onerror = () => {
					// 이미지 로드 실패시 기본 정보만 반환
					URL.revokeObjectURL(imageUrl);
					resolve({
						fileName: file.name,
						fileSize: file.size,
						...exifData,
					});
				};

				img.src = imageUrl;
			});
		} catch (error) {
			console.error("EXIF 데이터 추출 실패:", error);
			// 에러 발생시 기본 파일 정보만 반환
			return {
				fileName: file.name,
				fileSize: file.size,
			};
		}
	};

	// 파일 업로드 처리
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setIsLoading(true);
		const newPhotos: UploadedPhoto[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			// 이미지 파일인지 확인
			if (!file.type.startsWith("image/")) {
				alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
				continue;
			}

			try {
				const previewUrl = URL.createObjectURL(file);
				const exifData = await extractExifData(file);

				const photo: UploadedPhoto = {
					id: Date.now().toString() + i,
					file,
					previewUrl,
					exifData,
				};

				newPhotos.push(photo);
			} catch (error) {
				console.error(`${file.name} 처리 실패:`, error);
			}
		}

		setPhotos(prev => [...prev, ...newPhotos]);
		setIsLoading(false);

		// 파일 입력 리셋
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// 파일 크기 포맷팅
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	// 사진 삭제
	const deletePhoto = (photoId: string) => {
		setPhotos(prev => {
			const updatedPhotos = prev.filter(photo => photo.id !== photoId);
			// URL 메모리 해제
			const photoToDelete = prev.find(photo => photo.id === photoId);
			if (photoToDelete) {
				URL.revokeObjectURL(photoToDelete.previewUrl);
			}
			return updatedPhotos;
		});

		// 선택된 사진이 삭제된 경우
		if (selectedPhoto?.id === photoId) {
			setSelectedPhoto(null);
		}
	};

	// 모든 사진 삭제
	const clearAllPhotos = () => {
		photos.forEach(photo => {
			URL.revokeObjectURL(photo.previewUrl);
		});
		setPhotos([]);
		setSelectedPhoto(null);
	};

	return (
		<div className="font-sans min-h-screen bg-gray-50">
			{/* 헤더 */}
			<header className="w-screen h-14 bg-neutral-900 text-white flex items-center justify-between px-5 box-border fixed top-0 left-0 z-50">
				<div className="flex items-center gap-4">
					<span className="font-bold">사진 메타데이터 분석</span>
					<Link href="/" className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">
						홈으로
					</Link>
				</div>
				<span>{photos.length}개 사진</span>
			</header>

			<div className="pt-16 pb-4">
				<div className="max-w-6xl mx-auto px-4">
					{/* 업로드 영역 */}
					<div className="bg-white rounded-lg shadow-md p-6 mb-6">
						<h2 className="text-xl font-bold mb-4">사진 업로드</h2>
						<div className="flex flex-col gap-4">
							<input
								ref={fileInputRef}
								type="file"
								multiple
								accept="image/*"
								onChange={handleFileUpload}
								className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							<div className="flex gap-2">
								<button
									onClick={() => fileInputRef.current?.click()}
									className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
									disabled={isLoading}
								>
									{isLoading ? "처리 중..." : "사진 선택"}
								</button>
								{photos.length > 0 && (
									<button onClick={clearAllPhotos} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
										모두 삭제
									</button>
								)}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* 사진 목록 */}
						<div className="bg-white rounded-lg shadow-md p-6">
							<h2 className="text-xl font-bold mb-4">업로드된 사진</h2>
							{photos.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<p>업로드된 사진이 없습니다.</p>
									<p className="text-sm">위에서 사진을 선택해주세요.</p>
								</div>
							) : (
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									{photos.map(photo => (
										<div
											key={photo.id}
											className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
												selectedPhoto?.id === photo.id
													? "border-blue-500 shadow-lg"
													: "border-gray-200 hover:border-gray-300"
											}`}
											onClick={() => setSelectedPhoto(photo)}
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={photo.previewUrl} alt={photo.exifData.fileName} className="w-full h-24 object-cover" />
											<div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity"></div>
											<button
												onClick={e => {
													e.stopPropagation();
													deletePhoto(photo.id);
												}}
												className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
											>
												×
											</button>
											<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1">
												<p className="text-xs truncate">{photo.exifData.fileName}</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* 메타데이터 정보 */}
						<div className="bg-white rounded-lg shadow-md p-6">
							<h2 className="text-xl font-bold mb-4">메타데이터 정보</h2>
							{!selectedPhoto ? (
								<div className="text-center py-8 text-black">
									<p>사진을 선택하면 메타데이터 정보가 표시됩니다.</p>
								</div>
							) : (
								<div className="space-y-4">
									{/* 선택된 사진 미리보기 */}
									<div className="text-center mb-4">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={selectedPhoto.previewUrl}
											alt={selectedPhoto.exifData.fileName}
											className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm"
										/>
									</div>

									{/* 메타데이터 테이블 */}
									<div className="space-y-4">
										{/* 기본 파일 정보 */}
										<div>
											<h3 className="font-semibold text-lg mb-3 text-blue-600">📄 파일 정보</h3>
											<div className="grid grid-cols-1 gap-2 text-sm bg-blue-50 p-3 rounded-lg">
												{selectedPhoto.exifData.fileName && (
													<div className="flex justify-between py-1 border-b border-blue-200">
														<span className="font-medium text-black">파일명:</span>
														<span className="text-right text-black">{selectedPhoto.exifData.fileName}</span>
													</div>
												)}
												{selectedPhoto.exifData.fileSize && (
													<div className="flex justify-between py-1 border-b border-blue-200">
														<span className="font-medium text-black">파일 크기:</span>
														<span className="text-right text-black">{formatFileSize(selectedPhoto.exifData.fileSize)}</span>
													</div>
												)}
												{selectedPhoto.exifData.width && selectedPhoto.exifData.height && (
													<div className="flex justify-between py-1 border-b border-blue-200">
														<span className="font-medium text-black">이미지 크기:</span>
														<span className="text-right text-black">
															{selectedPhoto.exifData.width} × {selectedPhoto.exifData.height}
														</span>
													</div>
												)}
												{selectedPhoto.exifData.xResolution && selectedPhoto.exifData.yResolution && (
													<div className="flex justify-between py-1 border-b border-blue-200">
														<span className="font-medium text-black">해상도:</span>
														<span className="text-right text-black">
															{selectedPhoto.exifData.xResolution} × {selectedPhoto.exifData.yResolution} DPI
														</span>
													</div>
												)}
												{selectedPhoto.exifData.colorSpace && (
													<div className="flex justify-between py-1">
														<span className="font-medium text-black">색상 공간:</span>
														<span className="text-right text-black">{selectedPhoto.exifData.colorSpace}</span>
													</div>
												)}
											</div>
										</div>

										{/* 카메라 정보 */}
										{(selectedPhoto.exifData.make || selectedPhoto.exifData.model || selectedPhoto.exifData.lens) && (
											<div>
												<h3 className="font-semibold text-lg mb-3 text-green-600">📷 카메라 정보</h3>
												<div className="grid grid-cols-1 gap-2 text-sm bg-green-50 p-3 rounded-lg">
													{selectedPhoto.exifData.make && (
														<div className="flex justify-between py-1 border-b border-green-200">
															<span className="font-medium text-black">제조사:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.make}</span>
														</div>
													)}
													{selectedPhoto.exifData.model && (
														<div className="flex justify-between py-1 border-b border-green-200">
															<span className="font-medium text-black">모델:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.model}</span>
														</div>
													)}
													{selectedPhoto.exifData.lens && (
														<div className="flex justify-between py-1 border-b border-green-200">
															<span className="font-medium text-black">렌즈:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.lens}</span>
														</div>
													)}
													{selectedPhoto.exifData.software && (
														<div className="flex justify-between py-1">
															<span className="font-medium text-black">소프트웨어:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.software}</span>
														</div>
													)}
												</div>
											</div>
										)}

										{/* 촬영 설정 */}
										{(selectedPhoto.exifData.iso ||
											selectedPhoto.exifData.aperture ||
											selectedPhoto.exifData.shutterSpeed ||
											selectedPhoto.exifData.focalLength) && (
											<div>
												<h3 className="font-semibold text-lg mb-3 text-purple-600">⚙️ 촬영 설정</h3>
												<div className="grid grid-cols-1 gap-2 text-sm bg-purple-50 p-3 rounded-lg">
													{selectedPhoto.exifData.iso && (
														<div className="flex justify-between py-1 border-b border-purple-200">
															<span className="font-medium text-black">ISO:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.iso}</span>
														</div>
													)}
													{selectedPhoto.exifData.aperture && (
														<div className="flex justify-between py-1 border-b border-purple-200">
															<span className="font-medium text-black">조리개:</span>
															<span className="text-right text-black">f/{selectedPhoto.exifData.aperture}</span>
														</div>
													)}
													{selectedPhoto.exifData.shutterSpeed && (
														<div className="flex justify-between py-1 border-b border-purple-200">
															<span className="font-medium text-black">셔터 속도:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.shutterSpeed}s</span>
														</div>
													)}
													{selectedPhoto.exifData.focalLength && (
														<div className="flex justify-between py-1 border-b border-purple-200">
															<span className="font-medium text-black">초점 거리:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.focalLength}mm</span>
														</div>
													)}
													{selectedPhoto.exifData.exposureBias && (
														<div className="flex justify-between py-1 border-b border-purple-200">
															<span className="font-medium text-black">노출 보정:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.exposureBias} EV</span>
														</div>
													)}
													{selectedPhoto.exifData.flash && (
														<div className="flex justify-between py-1 border-b border-purple-200">
															<span className="font-medium text-black">플래시:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.flash}</span>
														</div>
													)}
													{selectedPhoto.exifData.whiteBalance && (
														<div className="flex justify-between py-1 border-b border-purple-200">
															<span className="font-medium text-black">화이트 밸런스:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.whiteBalance}</span>
														</div>
													)}
													{selectedPhoto.exifData.meteringMode && (
														<div className="flex justify-between py-1">
															<span className="font-medium text-black">측광 모드:</span>
															<span className="text-right text-black">{selectedPhoto.exifData.meteringMode}</span>
														</div>
													)}
												</div>
											</div>
										)}

										{/* 날짜/시간 정보 */}
										{(selectedPhoto.exifData.dateTime || selectedPhoto.exifData.dateTimeOriginal) && (
											<div>
												<h3 className="font-semibold text-lg mb-3 text-orange-600">📅 날짜/시간 정보</h3>
												<div className="grid grid-cols-1 gap-2 text-sm bg-orange-50 p-3 rounded-lg">
													{selectedPhoto.exifData.dateTimeOriginal && (
														<div className="flex justify-between py-1 border-b border-orange-200">
															<span className="font-medium text-black">촬영 날짜:</span>
															<span className="text-right text-black">
																{safeStringify(selectedPhoto.exifData.dateTimeOriginal)}
															</span>
														</div>
													)}
													{selectedPhoto.exifData.dateTime && (
														<div className="flex justify-between py-1">
															<span className="font-medium text-black">파일 수정 날짜:</span>
															<span className="text-right text-black">{safeStringify(selectedPhoto.exifData.dateTime)}</span>
														</div>
													)}
												</div>
											</div>
										)}

										{/* GPS 위치 정보 */}
										{selectedPhoto.exifData.latitude && selectedPhoto.exifData.longitude && (
											<div>
												<h3 className="font-semibold text-lg mb-3 text-red-600">📍 GPS 위치 정보</h3>
												<div className="grid grid-cols-1 gap-2 text-sm bg-red-50 p-3 rounded-lg">
													<div className="flex justify-between py-1 border-b border-red-200">
														<span className="font-medium text-black">위도:</span>
														<span className="text-right text-black">{selectedPhoto.exifData.latitude}°</span>
													</div>
													<div className="flex justify-between py-1">
														<span className="font-medium text-black">경도:</span>
														<span className="text-right text-black">{selectedPhoto.exifData.longitude}°</span>
													</div>
												</div>
											</div>
										)}

										{/* 기타 메타데이터 */}
										<div>
											<h3 className="font-semibold text-lg mb-3 text-gray-600">🔧 기타 EXIF 데이터</h3>
											<div className="grid grid-cols-1 gap-2 text-sm bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
												{Object.entries(selectedPhoto.exifData)
													.filter(
														([key, value]) =>
															value !== undefined &&
															value !== null &&
															value !== "" &&
															![
																"fileName",
																"fileSize",
																"width",
																"height",
																"make",
																"model",
																"dateTime",
																"dateTimeOriginal",
																"latitude",
																"longitude",
																"iso",
																"aperture",
																"shutterSpeed",
																"focalLength",
																"flash",
																"whiteBalance",
																"meteringMode",
																"exposureBias",
																"lens",
																"software",
																"colorSpace",
																"xResolution",
																"yResolution",
															].includes(key)
													)
													.map(([key, value]) => (
														<div key={key} className="flex justify-between py-1 border-b border-gray-200">
															<span className="font-medium text-black capitalize">
																{key.replace(/([A-Z])/g, " $1")}:
															</span>
															<span className="text-right text-xs max-w-xs truncate text-black" title={safeStringify(value)}>
																{safeStringify(value)}
															</span>
														</div>
													))}
											</div>
										</div>
									</div>

									{/* 액션 버튼 */}
									<div className="flex gap-2 mt-4">
										<button
											onClick={() => deletePhoto(selectedPhoto.id)}
											className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
										>
											이 사진 삭제
										</button>
										<button
											onClick={() => {
												const link = document.createElement("a");
												link.href = selectedPhoto.previewUrl;
												link.download = selectedPhoto.exifData.fileName || "photo";
												link.click();
											}}
											className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
										>
											다운로드
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
