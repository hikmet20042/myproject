"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperProps {
  image: string | File;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/png");
  });
};

const optimizeImage = async (blob: Blob): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No 2d context"));
        return;
      }

      // Profile pictures are displayed small, so keep output lightweight.
      const MAX_SIZE = 320;
      const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      canvas.width = width;
      canvas.height = height;

      // High quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP with balanced quality for small avatar rendering.
      canvas.toBlob(
        (optimizedBlob) => {
          if (optimizedBlob) {
            const file = new File([optimizedBlob], "avatar.webp", {
              type: "image/webp",
            });
            resolve(file);
          } else {
            reject(new Error("Optimizasiya uğursuz oldu"));
          }
        },
        "image/webp",
        0.72,
      );
    };
    img.onerror = () => reject(new Error("Şəkil yüklənə bilmədi"));
    img.src = URL.createObjectURL(blob);
  });
};

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  isLoading = false,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (typeof image === "string") {
          setImageSrc(image);
        } else {
          const url = URL.createObjectURL(image);
          setImageSrc(url);
          return () => URL.revokeObjectURL(url);
        }
      } catch {
        setError("Şəkil yüklənərkən xəta baş verdi");
      }
    };

    void loadImage();
  }, [image]);

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) {
      setError("Kəsmə sahəsi seçilməyib");
      return;
    }

    try {
      setError("");
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const optimizedFile = await optimizeImage(croppedBlob);
      onCropComplete(optimizedFile);
    } catch {
      setError("Şəkil kəsilərkən xəta baş verdi");
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Profil şəkilini kəs"
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative h-80 w-full overflow-hidden rounded-xl bg-gray-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={handleCropComplete}
            cropShape="rect"
            showGrid={false}
            restrictPosition={true}
            minZoom={0.5}
            maxZoom={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="h-4 w-4 text-slate-500" />
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="flex-1"
            aria-label="Şəkil böyütmə"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Ləğv et
          </Button>
          <Button onClick={handleApplyCrop} disabled={isLoading}>
            <Check className="mr-2 h-4 w-4" />
            {isLoading ? "Yüklənir..." : "Tətbiq et"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
