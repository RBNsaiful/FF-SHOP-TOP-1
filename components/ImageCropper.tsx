
import React, { useState, useRef, useEffect, FC } from 'react';

interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedImage: string) => void;
}

const ImageCropper: FC<ImageCropperProps> = ({ imageSrc, onCancel, onCropComplete }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    imageRef.current.src = imageSrc;
    imageRef.current.onload = () => {
      draw();
    };
  }, [imageSrc]);

  useEffect(() => {
    draw();
  }, [zoom, pan]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (canvas && ctx && img) {
      const size = 300; // Crop box size
      canvas.width = size;
      canvas.height = size;
      
      ctx.clearRect(0, 0, size, size);
      
      // Calculate scaling to fit image initially then apply zoom
      const scale = Math.max(size / img.width, size / img.height) * zoom;
      
      const centerX = size / 2;
      const centerY = size / 2;
      
      ctx.save();
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling on touch
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      onCropComplete(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in">
      <h3 className="text-white font-bold mb-4">Adjust Image</h3>
      
      <div 
        ref={containerRef}
        className="relative w-[300px] h-[300px] overflow-hidden rounded-full border-4 border-white/30 shadow-2xl bg-black cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white"></div>
        </div>
      </div>

      <div className="w-[300px] mt-6">
        <label className="text-white text-xs font-bold uppercase mb-2 block">Zoom</label>
        <input 
          type="range" 
          min="1" 
          max="3" 
          step="0.1" 
          value={zoom} 
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex gap-4 mt-8 w-[300px]">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
        >
          Crop & Save
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
