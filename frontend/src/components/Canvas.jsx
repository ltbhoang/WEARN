// src/components/Canvas.jsx
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";

const CustomCanvas = forwardRef(
  ({ width, height, disabled, onStrokeComplete, templateSvg }, ref) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const ctxRef = useRef(null);
    const lastDrawingRef = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 30;
      ctxRef.current = ctx;

      const preventDefault = (e) => {
        if (e.cancelable) e.preventDefault();
      };
      canvas.addEventListener("touchstart", preventDefault, { passive: false });
      canvas.addEventListener("touchmove", preventDefault, { passive: false });
      return () => {
        canvas.removeEventListener("touchstart", preventDefault);
        canvas.removeEventListener("touchmove", preventDefault);
      };
    }, [width, height]);

    const getCoords = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (e) => {
      if (disabled) return;
      const { x, y } = getCoords(e);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
      setIsDrawing(true);
      lastDrawingRef.current = false;
    };

    const draw = (e) => {
      if (!isDrawing || disabled) return;
      const { x, y } = getCoords(e);
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    };

    const stopDrawing = async () => {
      if (!isDrawing || disabled) return;
      setIsDrawing(false);
      if (templateSvg && !lastDrawingRef.current) {
        lastDrawingRef.current = true;
        const imageData = canvasRef.current.toDataURL();
        if (onStrokeComplete) await onStrokeComplete(imageData, templateSvg);
      }
    };

    useImperativeHandle(ref, () => ({
      clear: () => ctxRef.current.clearRect(0, 0, width, height),
    }));

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full touch-none cursor-crosshair"
      />
    );
  }
);

export default CustomCanvas;