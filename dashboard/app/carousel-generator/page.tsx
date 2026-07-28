"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

type ImageItem = {
  id: string;
  src: string;
  name: string;
  size: number;
};

type Settings = {
  autoPlay: boolean;
  interval: number;
  navigation: "dots" | "arrows" | "both" | "none";
  transition: "slide" | "fade" | "zoom";
  transitionSpeed: number;
  borderRadius: number;
  shadow: "none" | "sm" | "md" | "lg" | "xl";
  loop: boolean;
  pauseOnHover: boolean;
};

type PreviewSize = {
  width: string;
  height: string;
};

type DevicePreset = {
  name: string;
  icon: string;
  width: string;
  height: string;
};

const DEVICE_PRESETS: DevicePreset[] = [
  {
    name: "Desktop",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
    width: "100%",
    height: "400px",
  },
  {
    name: "Tablet",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>`,
    width: "768px",
    height: "400px",
  },
  {
    name: "Mobile",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>`,
    width: "375px",
    height: "300px",
  },
];

const SHADOW_OPTIONS = [
  { value: "none", label: "Нет" },
  { value: "sm", label: "Малая" },
  { value: "md", label: "Средняя" },
  { value: "lg", label: "Большая" },
  { value: "xl", label: "Огромная" },
];

const SHADOW_STYLES: Record<string, string> = {
  none: "none",
  sm: "0 2px 8px rgba(0,0,0,0.3)",
  md: "0 4px 16px rgba(0,0,0,0.4)",
  lg: "0 8px 32px rgba(0,0,0,0.5)",
  xl: "0 16px 64px rgba(0,0,0,0.6)",
};

export default function CarouselGenerator() {
  const [step, setStep] = useState(1);
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");
  const [urlInput, setUrlInput] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverZone, setDragOverZone] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [settings, setSettings] = useState<Settings>({
    autoPlay: true,
    interval: 5,
    navigation: "both",
    transition: "slide",
    transitionSpeed: 500,
    borderRadius: 16,
    shadow: "lg",
    loop: true,
    pauseOnHover: true,
  });
  const [previewSize, setPreviewSize] = useState<PreviewSize>({
    width: "100%",
    height: "400px",
  });
  const [generatedCode, setGeneratedCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const showNotification = useCallback((text: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Auto-play with progress
  useEffect(() => {
    if (!settings.autoPlay || step !== 3 || isPaused || images.length === 0) {
      setProgress(0);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    const intervalMs = settings.interval * 1000;
    const tickRate = 50;
    let elapsed = 0;

    progressRef.current = setInterval(() => {
      elapsed += tickRate;
      setProgress((elapsed / intervalMs) * 100);

      if (elapsed >= intervalMs) {
        elapsed = 0;
        setProgress(0);
        setCurrentIndex((prev) => {
          if (!settings.loop && prev === images.length - 1) return prev;
          return (prev + 1) % images.length;
        });
      }
    }, tickRate);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [settings.autoPlay, settings.interval, settings.loop, step, images.length, isPaused]);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    let newTotalSize = totalSize;
    const newImages: ImageItem[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        showNotification(`Файл "${file.name}" не является изображением`, "error");
        continue;
      }

      if (newTotalSize + file.size > MAX_SIZE_BYTES) {
        showNotification(`Превышен лимит в ${MAX_SIZE_MB} МБ. Остальные файлы не загружены.`, "error");
        break;
      }

      const base64 = await readFileAsBase64(file);
      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        src: base64,
        name: file.name,
        size: file.size,
      });
      newTotalSize += file.size;
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      setTotalSize(newTotalSize);
      showNotification(`Загружено ${newImages.length} изображений`, "success");
    }
  };

  const handleUrlSubmit = () => {
    const urls = urlInput.split("\n").filter((url) => url.trim() !== "");
    if (urls.length === 0) return;

    const newImages: ImageItem[] = urls.map((url) => ({
      id: Math.random().toString(36).substr(2, 9),
      src: url.trim(),
      name: url.trim().split("/").pop() || "URL Image",
      size: 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
    setUrlInput("");
    showNotification(`Добавлено ${newImages.length} изображений по URL`, "success");
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        setTotalSize((prevSize) => Math.max(0, prevSize - img.size));
      }
      return prev.filter((i) => i.id !== id);
    });
    if (currentIndex >= images.length - 1) {
      setCurrentIndex(Math.max(0, images.length - 2));
    }
  };

  const clearAllImages = () => {
    setImages([]);
    setTotalSize(0);
    setCurrentIndex(0);
    showNotification("Все изображения удалены", "info");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(false);
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(true);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(false);
    setIsDragging(false);
  };

  const exportConfig = () => {
    const config = {
      images: images.map((img) => ({ src: img.src, name: img.name })),
      settings,
      previewSize,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carousel-config.json";
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Конфигурация экспортирована", "success");
  };

  const importConfig = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const config = JSON.parse(text);
        if (config.images) {
          const newImages = config.images.map((img: { src: string; name: string }) => ({
            id: Math.random().toString(36).substr(2, 9),
            src: img.src,
            name: img.name || "Imported",
            size: 0,
          }));
          setImages(newImages);
        }
        if (config.settings) setSettings(config.settings);
        if (config.previewSize) setPreviewSize(config.previewSize);
        showNotification("Конфигурация импортирована", "success");
      } catch {
        showNotification("Ошибка при импорте файла", "error");
      }
    };
    input.click();
  };

  const generateWidgetCode = () => {
    const imagesJson = JSON.stringify(images.map((img) => img.src));
    const navDots = settings.navigation === "dots" || settings.navigation === "both";
    const navArrows = settings.navigation === "arrows" || settings.navigation === "both";
    const shadowStyle = SHADOW_STYLES[settings.shadow] || "none";

    const transitionCSS =
      settings.transition === "fade"
        ? "opacity 0.5s ease-in-out"
        : settings.transition === "zoom"
        ? "transform 0.5s ease-in-out, opacity 0.5s ease-in-out"
        : `transform ${settings.transitionSpeed}ms ease-in-out`;

    const code = `<!-- Carousel Widget Start -->
<div id="custom-carousel-root" style="width: ${previewSize.width}; height: ${previewSize.height}; position: relative; overflow: hidden; border-radius: ${settings.borderRadius}px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0d0d; box-shadow: ${shadowStyle};">
  <div id="carousel-track" style="display: flex; height: 100%; transition: ${transitionCSS};">
  </div>
  ${navArrows ? `
  <button onclick="moveCarousel(-1)" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,160,0,0.9); border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(255,160,0,0.3); backdrop-filter: blur(10px); color: #0d0d0d; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,179,0,1)'" onmouseout="this.style.background='rgba(255,160,0,0.9)'">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
  </button>
  <button onclick="moveCarousel(1)" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,160,0,0.9); border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(255,160,0,0.3); backdrop-filter: blur(10px); color: #0d0d0d; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,179,0,1)'" onmouseout="this.style.background='rgba(255,160,0,0.9)'">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
  </button>` : ""}
  ${navDots ? `<div id="carousel-dots" style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px 12px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px;"></div>` : ""}
</div>
<script>
  (function() {
    const images = ${imagesJson};
    let currentIndex = 0;
    const track = document.getElementById('carousel-track');
    const dotsContainer = document.getElementById('carousel-dots');
    const root = document.getElementById('custom-carousel-root');
    
    images.forEach((src, index) => {
      const slide = document.createElement('div');
      slide.style.minWidth = '100%';
      slide.style.height = '100%';
      slide.style.backgroundImage = 'url(' + src + ')';
      slide.style.backgroundSize = 'cover';
      slide.style.backgroundPosition = 'center';
      ${settings.transition === "fade" ? `slide.style.opacity = index === 0 ? '1' : '0'; slide.style.position = index === 0 ? 'relative' : 'absolute'; slide.style.top = '0'; slide.style.left = '0';` : ""}
      ${settings.transition === "zoom" ? `slide.style.transform = index === 0 ? 'scale(1)' : 'scale(0.8)'; slide.style.opacity = index === 0 ? '1' : '0';` : ""}
      track.appendChild(slide);
      
      ${navDots ? `
      const dot = document.createElement('button');
      dot.style.width = index === 0 ? '24px' : '8px';
      dot.style.height = '8px';
      dot.style.borderRadius = '4px';
      dot.style.border = 'none';
      dot.style.background = index === 0 ? '#FFA000' : 'rgba(255,255,255,0.5)';
      dot.style.cursor = 'pointer';
      dot.style.transition = 'all 0.3s ease';
      dot.onclick = () => goToSlide(index);
      dotsContainer.appendChild(dot);` : ""}
    });

    ${settings.transition === "fade" ? `track.style.position = 'relative';` : ""}

    window.moveCarousel = function(direction) {
      const newIndex = currentIndex + direction;
      ${settings.loop ? `currentIndex = (newIndex + images.length) % images.length;` : `if (newIndex >= 0 && newIndex < images.length) currentIndex = newIndex;`}
      updateCarousel();
    };

    window.goToSlide = function(index) {
      currentIndex = index;
      updateCarousel();
    };

    function updateCarousel() {
      ${settings.transition === "slide" ? `track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';` : ""}
      ${settings.transition === "fade" ? `
      Array.from(track.children).forEach((slide, idx) => {
        slide.style.opacity = idx === currentIndex ? '1' : '0';
        slide.style.zIndex = idx === currentIndex ? '1' : '0';
      });` : ""}
      ${settings.transition === "zoom" ? `
      Array.from(track.children).forEach((slide, idx) => {
        slide.style.transform = idx === currentIndex ? 'scale(1)' : 'scale(0.8)';
        slide.style.opacity = idx === currentIndex ? '1' : '0';
        slide.style.zIndex = idx === currentIndex ? '1' : '0';
      });` : ""}
      ${navDots ? `
      Array.from(dotsContainer.children).forEach((dot, idx) => {
        dot.style.width = idx === currentIndex ? '24px' : '8px';
        dot.style.background = idx === currentIndex ? '#FFA000' : 'rgba(255,255,255,0.5)';
      });` : ""}
    }

    ${settings.pauseOnHover ? `
    let isPaused = false;
    root.addEventListener('mouseenter', () => { isPaused = true; });
    root.addEventListener('mouseleave', () => { isPaused = false; });
    ` : ""}

    ${settings.autoPlay ? `
    setInterval(() => {
      ${settings.pauseOnHover ? `if (!isPaused)` : ""} window.moveCarousel(1);
    }, ${settings.interval * 1000});` : ""}
  })();
</script>
<!-- Carousel Widget End -->`;

    setGeneratedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    showNotification("Код скопирован в буфер обмена!", "success");
  };

  const progressPercentage = (step / 4) * 100;

  const getTransitionStyle = (): React.CSSProperties => {
    if (settings.transition === "fade") {
      return {
        position: "relative",
        width: "100%",
        height: "100%",
      };
    }
    if (settings.transition === "zoom") {
      return {
        position: "relative",
        width: "100%",
        height: "100%",
      };
    }
    return {
      display: "flex",
      height: "100%",
      transition: `transform ${settings.transitionSpeed}ms ease-in-out`,
      transform: `translateX(-${(currentIndex % Math.max(images.length, 1)) * 100}%)`,
    };
  };

  const getSlideStyle = (idx: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      minWidth: "100%",
      height: "100%",
      flexShrink: 0,
    };

    if (settings.transition === "fade") {
      return {
        ...base,
        position: "absolute",
        top: 0,
        left: 0,
        opacity: idx === currentIndex ? 1 : 0,
        transition: `opacity ${settings.transitionSpeed}ms ease-in-out`,
        zIndex: idx === currentIndex ? 1 : 0,
      };
    }
    if (settings.transition === "zoom") {
      return {
        ...base,
        position: "absolute",
        top: 0,
        left: 0,
        transform: idx === currentIndex ? "scale(1)" : "scale(0.8)",
        opacity: idx === currentIndex ? 1 : 0,
        transition: `transform ${settings.transitionSpeed}ms ease-in-out, opacity ${settings.transitionSpeed}ms ease-in-out`,
        zIndex: idx === currentIndex ? 1 : 0,
      };
    }
    return base;
  };

  return (
    <div
      className="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-[#FFA000] selection:text-black"
      onDragOver={(e) => {
        e.preventDefault();
        if (step === 1 && inputMode === "upload") setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (step === 1 && inputMode === "upload" && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files);
        }
      }}
    >
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl text-sm font-medium ${
              notification.type === "success"
                ? "bg-green-500/20 border-green-500/30 text-green-300"
                : notification.type === "error"
                ? "bg-red-500/20 border-red-500/30 text-red-300"
                : "bg-[#FFA000]/20 border-[#FFA000]/30 text-[#FFA000]"
            }`}
          >
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global drag overlay */}
      <AnimatePresence>
        {isDragging && step === 1 && inputMode === "upload" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[#FFA000]/20 border-2 border-dashed border-[#FFA000] flex items-center justify-center animate-pulse">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFA000" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white mb-2">Отпустите файлы</p>
              <p className="text-white/50">Изображения будут загружены автоматически</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen preview */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(false);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div
              className="relative overflow-hidden shadow-2xl"
              style={{
                width: "90vw",
                height: "80vh",
                borderRadius: `${settings.borderRadius}px`,
                background: "#0d0d0d",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={getTransitionStyle()}>
                {images.map((img, idx) => (
                  <div key={img.id} style={getSlideStyle(idx)}>
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {(settings.navigation === "arrows" || settings.navigation === "both") && (
                <>
                  <button
                    onClick={() => setCurrentIndex((prev) => {
                      if (!settings.loop && prev === 0) return 0;
                      return (prev - 1 + images.length) % images.length;
                    })}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#FFA000]/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg text-black hover:bg-[#FFB300] transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button
                    onClick={() => setCurrentIndex((prev) => {
                      if (!settings.loop && prev === images.length - 1) return prev;
                      return (prev + 1) % images.length;
                    })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#FFA000]/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg text-black hover:bg-[#FFB300] transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </>
              )}
              {(settings.navigation === "dots" || settings.navigation === "both") && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? "w-6 bg-[#FFA000]" : "w-2 bg-white/50 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFA000] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#F57C00] opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-[#FFA000] animate-pulse"></div>
              <span className="text-xs font-medium tracking-wider uppercase text-white/70">Carousel Builder</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-white to-[#FFA000] bg-clip-text text-transparent">
              Генератор карусели
            </h1>
            <p className="text-white/50 text-lg">Создайте адаптивный виджет для вашего сайта за несколько шагов</p>
          </motion.div>
        </header>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/50">Шаг {step} из 4</span>
            <span className="text-sm text-[#FFA000] font-medium">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FFA000] to-[#F57C00] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl shadow-black/50">
          <AnimatePresence mode="wait">
            {/* STEP 1 - Images */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl font-bold mb-2">Добавление изображений</h2>
                <p className="text-white/40 mb-8">Загрузите файлы или укажите ссылки на изображения</p>

                <div className="flex gap-2 mb-8 p-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 w-fit">
                  <button
                    onClick={() => setInputMode("url")}
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      inputMode === "url" ? "bg-[#FFA000] text-black shadow-lg shadow-[#FFA000]/30" : "text-white/60 hover:text-white"
                    }`}
                  >
                    URL ссылки
                  </button>
                  <button
                    onClick={() => setInputMode("upload")}
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      inputMode === "upload" ? "bg-[#FFA000] text-black shadow-lg shadow-[#FFA000]/30" : "text-white/60 hover:text-white"
                    }`}
                  >
                    Загрузка файлов
                  </button>
                </div>

                {inputMode === "url" ? (
                  <div className="space-y-4">
                    <textarea
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg\nhttps://example.com/image3.jpg"}
                      className="w-full h-40 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm focus:bg-white/10 focus:outline-none focus:border-[#FFA000]/50 transition-all resize-none text-sm text-white placeholder-white/30"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        className="px-6 py-3 bg-[#FFA000] text-black rounded-xl font-semibold hover:bg-[#FFB300] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FFA000]/20"
                      >
                        Добавить URL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all group ${
                        dragOverZone
                          ? "border-[#FFA000] bg-[#FFA000]/10 scale-[1.02]"
                          : "border-white/10 hover:border-[#FFA000]/50 hover:bg-[#FFA000]/5"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      />
                      <motion.div
                        animate={dragOverZone ? { scale: 1.1 } : { scale: 1 }}
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFA000]/10 border border-[#FFA000]/20 flex items-center justify-center transition-colors"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFA000" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </motion.div>
                      <p className="text-white font-medium mb-1">
                        {dragOverZone ? "Отпустите для загрузки" : "Нажмите для загрузки"}
                      </p>
                      <p className="text-white/40 text-sm">или перетащите файлы сюда</p>
                      <p className="text-white/30 text-xs mt-4">Максимальный общий размер: {MAX_SIZE_MB} МБ</p>
                    </div>
                    {totalSize > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-white/60">Занято: {(totalSize / 1024 / 1024).toFixed(2)} МБ</span>
                          <span className="text-[#FFA000] font-medium">из {MAX_SIZE_MB} МБ</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FFA000] to-[#F57C00] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((totalSize / MAX_SIZE_BYTES) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {images.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
                        Добавлено: {images.length} {images.length === 1 ? "изображение" : "изображений"}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={exportConfig}
                          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
                        >
                          Экспорт
                        </button>
                        <button
                          onClick={importConfig}
                          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
                        >
                          Импорт
                        </button>
                        <button
                          onClick={clearAllImages}
                          className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                          Очистить
                        </button>
                      </div>
                    </div>
                    <Reorder.Group axis="x" values={images} onReorder={setImages} className="flex gap-3 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <Reorder.Item
                          key={img.id}
                          value={img}
                          className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 group cursor-grab active:cursor-grabbing"
                        >
                          <img src={img.src} alt="" className="w-full h-full object-cover" draggable={false} />
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-black/70 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white">
                            {idx + 1}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(img.id);
                            }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
                          >
                            Удалить
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                    {images.length > 1 && (
                      <p className="text-xs text-white/30 mt-2">Перетаскивайте изображения для изменения порядка</p>
                    )}
                  </div>
                )}

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={images.length === 0}
                    className="px-8 py-3 bg-[#FFA000] text-black rounded-xl font-semibold hover:bg-[#FFB300] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-[#FFA000]/20"
                  >
                    Далее
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 - Settings */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl font-bold mb-2">Настройка карусели</h2>
                <p className="text-white/40 mb-8">Выберите режим работы и элементы управления</p>

                <div className="space-y-8">
                  {/* Auto-play toggle */}
                  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={settings.autoPlay}
                          onChange={(e) => setSettings({ ...settings, autoPlay: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-12 h-7 rounded-full transition-colors ${settings.autoPlay ? "bg-[#FFA000]" : "bg-white/10"}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${settings.autoPlay ? "translate-x-6" : "translate-x-1"}`} />
                        </div>
                      </div>
                      <span className="font-medium">Автоматическое переключение</span>
                    </label>
                    {settings.autoPlay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="ml-15 flex flex-wrap items-center gap-4 mt-4"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={settings.interval}
                            onChange={(e) => setSettings({ ...settings, interval: Number(e.target.value) })}
                            className="w-20 p-2.5 rounded-xl border border-white/10 bg-white/5 text-center focus:outline-none focus:border-[#FFA000]/50 text-white"
                            min="1"
                            max="60"
                          />
                          <span className="text-white/50 text-sm">сек</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.loop}
                            onChange={(e) => setSettings({ ...settings, loop: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#FFA000]"
                          />
                          <span className="text-white/60 text-sm">Зациклить</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.pauseOnHover}
                            onChange={(e) => setSettings({ ...settings, pauseOnHover: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#FFA000]"
                          />
                          <span className="text-white/60 text-sm">Пауза при наведении</span>
                        </label>
                      </motion.div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div>
                    <label className="block font-medium mb-4">Элементы управления</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(["none", "dots", "arrows", "both"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSettings({ ...settings, navigation: type })}
                          className={`p-4 rounded-2xl border text-sm font-medium transition-all ${
                            settings.navigation === type
                              ? "border-[#FFA000] bg-[#FFA000]/10 text-[#FFA000] shadow-lg shadow-[#FFA000]/10"
                              : "border-white/10 bg-white/5 hover:border-white/20 text-white/60 hover:text-white"
                          }`}
                        >
                          {type === "none" && "Без кнопок"}
                          {type === "dots" && "Только точки"}
                          {type === "arrows" && "Только стрелки"}
                          {type === "both" && "Точки и стрелки"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transition effect */}
                  <div>
                    <label className="block font-medium mb-4">Эффект перехода</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["slide", "fade", "zoom"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSettings({ ...settings, transition: type })}
                          className={`p-4 rounded-2xl border text-sm font-medium transition-all ${
                            settings.transition === type
                              ? "border-[#FFA000] bg-[#FFA000]/10 text-[#FFA000] shadow-lg shadow-[#FFA000]/10"
                              : "border-white/10 bg-white/5 hover:border-white/20 text-white/60 hover:text-white"
                          }`}
                        >
                          {type === "slide" && "Слайд"}
                          {type === "fade" && "Затухание"}
                          {type === "zoom" && "Зум"}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-white/50 text-sm w-28">Скорость:</span>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={settings.transitionSpeed}
                        onChange={(e) => setSettings({ ...settings, transitionSpeed: Number(e.target.value) })}
                        className="flex-1 accent-[#FFA000]"
                      />
                      <span className="text-[#FFA000] text-sm font-mono w-16 text-right">{settings.transitionSpeed}ms</span>
                    </div>
                  </div>

                  {/* Appearance */}
                  <div>
                    <label className="block font-medium mb-4">Внешний вид</label>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/50 text-sm">Скругление углов</span>
                          <span className="text-[#FFA000] text-sm font-mono">{settings.borderRadius}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={settings.borderRadius}
                          onChange={(e) => setSettings({ ...settings, borderRadius: Number(e.target.value) })}
                          className="w-full accent-[#FFA000]"
                        />
                      </div>
                      <div>
                        <span className="text-white/50 text-sm block mb-2">Тень</span>
                        <div className="grid grid-cols-5 gap-2">
                          {SHADOW_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setSettings({ ...settings, shadow: opt.value as Settings["shadow"] })}
                              className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                                settings.shadow === opt.value
                                  ? "border-[#FFA000] bg-[#FFA000]/10 text-[#FFA000]"
                                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 text-white/60 font-medium hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Назад
                  </button>
                  <button
                    onClick={() => {
                      generateWidgetCode();
                      setStep(3);
                    }}
                    className="px-8 py-3 bg-[#FFA000] text-black rounded-xl font-semibold hover:bg-[#FFB300] transition-all flex items-center gap-2 shadow-lg shadow-[#FFA000]/20"
                  >
                    Предпросмотр
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 - Preview */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl font-bold mb-2">Предпросмотр и размер</h2>
                <p className="text-white/40 mb-8">Проверьте как будет выглядеть карусель и настройте размеры</p>

                {/* Device presets */}
                <div className="flex gap-2 mb-6">
                  {DEVICE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setPreviewSize({ width: preset.width, height: preset.height })}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                        previewSize.width === preset.width && previewSize.height === preset.height
                          ? "border-[#FFA000] bg-[#FFA000]/10 text-[#FFA000]"
                          : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <span>{preset.icon}</span>
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-center p-4 bg-white/[0.02] rounded-2xl border border-white/5 min-h-[450px] overflow-auto">
                      <div
                        className="relative overflow-hidden flex-shrink-0 group"
                        style={{
                          width: previewSize.width,
                          height: previewSize.height,
                          maxWidth: "100%",
                          maxHeight: "420px",
                          borderRadius: `${settings.borderRadius}px`,
                          background: "#0d0d0d",
                          boxShadow: SHADOW_STYLES[settings.shadow],
                        }}
                      >
                        {/* Auto-play progress bar */}
                        {settings.autoPlay && !isPaused && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-20">
                            <div
                              className="h-full bg-[#FFA000] transition-none"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}

                        <div style={getTransitionStyle()}>
                          {images.map((img, idx) => (
                            <div key={img.id} style={getSlideStyle(idx)}>
                              <img src={img.src} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>

                        {(settings.navigation === "arrows" || settings.navigation === "both") && (
                          <>
                            <button
                              onClick={() => setCurrentIndex((prev) => {
                                if (!settings.loop && prev === 0) return 0;
                                return (prev - 1 + images.length) % images.length;
                              })}
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#FFA000]/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-[#FFA000]/30 text-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FFB300]"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                            </button>
                            <button
                              onClick={() => setCurrentIndex((prev) => {
                                if (!settings.loop && prev === images.length - 1) return prev;
                                return (prev + 1) % images.length;
                              })}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#FFA000]/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-[#FFA000]/30 text-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FFB300]"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                          </>
                        )}

                        {(settings.navigation === "dots" || settings.navigation === "both") && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  idx === currentIndex ? "w-6 bg-[#FFA000]" : "w-2 bg-white/50 hover:bg-white/70"
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Pause/play button */}
                        {settings.autoPlay && settings.pauseOnHover && (
                          <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all text-xs"
                          >
                            {isPaused ? "▶" : "⏸"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fullscreen button */}
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setIsFullscreen(true)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                        </svg>
                        Полноэкранный предпросмотр
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Ширина</label>
                      <input
                        type="text"
                        value={previewSize.width}
                        onChange={(e) => setPreviewSize({ ...previewSize, width: e.target.value })}
                        className="w-full p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm focus:outline-none focus:border-[#FFA000]/50 text-white placeholder-white/30"
                        placeholder="100% или 800px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Высота</label>
                      <input
                        type="text"
                        value={previewSize.height}
                        onChange={(e) => setPreviewSize({ ...previewSize, height: e.target.value })}
                        className="w-full p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm focus:outline-none focus:border-[#FFA000]/50 text-white placeholder-white/30"
                        placeholder="400px"
                      />
                    </div>
                    <div className="p-4 bg-[#FFA000]/5 rounded-xl border border-[#FFA000]/20">
                      <p className="text-xs text-white/60 leading-relaxed">
                        Размеры задаются в пикселях (px) или процентах (%).
                        Виджет адаптируется под указанные параметры. Используйте пресеты устройств для быстрого выбора.
                      </p>
                    </div>
                    {/* Current settings summary */}
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                      <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Текущие настройки</p>
                      <div className="space-y-1 text-xs text-white/60">
                        <p>{previewSize.width} × {previewSize.height}</p>
                        <p>Скругление: {settings.borderRadius}px</p>
                        <p>Тень: {SHADOW_OPTIONS.find(s => s.value === settings.shadow)?.label}</p>
                        <p>Переход: {settings.transition}</p>
                        <p>Скорость: {settings.transitionSpeed}ms</p>
                        <p>Автоплей: {settings.autoPlay ? `${settings.interval}с` : "выкл"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 text-white/60 font-medium hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Назад
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="px-8 py-3 bg-[#FFA000] text-black rounded-xl font-semibold hover:bg-[#FFB300] transition-all flex items-center gap-2 shadow-lg shadow-[#FFA000]/20"
                  >
                    Получить код
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4 - Code */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl font-bold mb-2">Получение кода</h2>
                <p className="text-white/40 mb-8">Скопируйте готовый код и вставьте его на ваш сайт</p>

                <div className="mb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFA000]/10 border border-[#FFA000]/20">
                      <div className="w-2 h-2 rounded-full bg-[#FFA000]"></div>
                      <span className="text-xs font-medium text-[#FFA000]">Виджет полностью автономен</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                      <span className="text-xs font-medium text-green-400">{images.length} изображений</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="text-xs font-medium text-blue-400">Без зависимостей</span>
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={generatedCode}
                      className="w-full h-80 p-5 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm text-white/90 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-[#FFA000] text-black rounded-lg text-sm font-semibold hover:bg-[#FFB300] transition-colors shadow-lg shadow-[#FFA000]/20 flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Копировать
                      </button>
                    </div>
                  </div>
                </div>

                {/* Code stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xl font-bold text-[#FFA000]">{(generatedCode.length / 1024).toFixed(1)}</p>
                    <p className="text-xs text-white/40 mt-1">КБ размер кода</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xl font-bold text-[#FFA000]">{images.length}</p>
                    <p className="text-xs text-white/40 mt-1">Слайдов</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xl font-bold text-[#FFA000]">{generatedCode.split("\n").length}</p>
                    <p className="text-xs text-white/40 mt-1">Строк кода</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-4">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 text-white/60 font-medium hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Назад к предпросмотру
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      setImages([]);
                      setTotalSize(0);
                      setUrlInput("");
                      setCurrentIndex(0);
                      setProgress(0);
                    }}
                    className="px-8 py-3 bg-[#FFA000] text-black rounded-xl font-semibold hover:bg-[#FFB300] transition-all shadow-lg shadow-[#FFA000]/20"
                  >
                    Создать новую карусель
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-8 text-center text-white/30 text-sm">
          Оптимизировано для Vercel. Все вычисления происходят в браузере.
        </footer>
      </div>
    </div>
  );
}