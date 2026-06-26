// components/CameraWeb.jsx
import React, { useRef, useState, useEffect } from 'react';

const CameraWeb = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    setError('');
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ camera.');
      }

      let constraints = { video: { facingMode: { exact: facingMode } } };
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (exactErr) {
        console.warn('Exact facingMode lỗi, thử không exact:', exactErr);
        constraints = { video: { facingMode: facingMode } };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('play error', e));
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMsg = 'Không thể truy cập camera. ';
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Vui lòng cấp quyền camera trong trình duyệt.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'Không tìm thấy camera trên thiết bị.';
      } else {
        errorMsg += err.message || 'Vui lòng kiểm tra lại.';
      }
      setError(errorMsg);
    } finally {
      setIsRequesting(false);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
      }
    } else {
      setError('Chưa sẵn sàng chụp ảnh, vui lòng thử lại.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onCapture(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    // Reset input để có thể chọn cùng file lại
    e.target.value = null;
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500 text-white text-center py-2 px-4 rounded-lg z-20">
          {error}
          <button
            onClick={startCamera}
            className="ml-3 underline bg-white text-red-500 px-2 py-0.5 rounded"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-20">
        <button
          onClick={triggerFileInput}
          className="px-8 py-3 bg-[#FF6B6B] text-white rounded-full font-bold text-base shadow-lg active:scale-95 transition-transform"
        >
          📁 Chọn ảnh
        </button>
        
        <button
          onClick={capture}
          className="px-5 py-3 bg-blue-600 text-white rounded-full font-bold text-base shadow-lg active:scale-95 transition-transform"
        >
          📸 Chụp
        </button>
        
        <button
          onClick={onClose}
          className="px-5 py-3 bg-gray-500 text-white rounded-full font-bold text-base shadow-lg active:scale-95 transition-transform"
        >
          ✖ Đóng
        </button>
      </div>

      {/* Input file ẩn để chọn ảnh từ thư viện */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default CameraWeb;
