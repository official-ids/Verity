"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ImageItem = {
  id: string;
  src: string;
  name: string;
};

type Settings = {
  autoPlay: boolean;
  interval: number;
  navigation: "dots" | "arrows" | "both" | "none";
};

type PreviewSize = {
  width: string;
  height: string;
};

export default function CarouselGenerator() {
  const [step, setStep] = useState(1);
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");
  const [urlInput, setUrlInput] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    autoPlay: true,
    interval: 5,
    navigation: "both",
  });
  const [previewSize, setPreviewSize] = useState<PreviewSize>({
    width: "100%",
    height: "400px",
  });
  const [generatedCode, setGeneratedCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (!settings.autoPlay || step !== 3) return;
    if (images.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, settings.interval * 1000);
    return () => clearInterval(timer);
  }, [settings.autoPlay, settings.interval, step, images.length]);

  const handleFileUpload = async (files: FileList) => {
    let newTotalSize = totalSize;
    const newImages: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (newTotalSize + file.size > MAX_SIZE_BYTES) {
        alert(`Превышен лимит в ${MAX_SIZE_MB} МБ. Загрузка остановлена.`);
        break;
      }

      const base64 = await readFileAsBase64(file);
      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        src: base64,
        name: file.name,
      });
      newTotalSize += file.size;
    }

    setImages((prev) => [...prev, ...newImages]);
    setTotalSize(newTotalSize);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUrlSubmit = () => {
    const urls = urlInput.split("\n").filter((url) => url.trim() !== "");
    const newImages: ImageItem[] = urls.map((url) => ({
      id: Math.random().toString(36).substr(2, 9),
      src: url.trim(),
      name: "URL Image",
    }));
    setImages((prev) => [...prev, ...newImages]);
    setUrlInput("");
  };

  const removeImage = (id: string) => {
    const img = images.find((i) => i.id === id);
    if (img && !img.src.startsWith("http")) {
      setTotalSize((prev) => Math.max(0, prev - img.src.length * 0.75));
    }
    setImages((prev) => prev.filter((i) => i.id !== id));
    setCurrentIndex(0);
  };

  const generateWidgetCode = () => {
    const imagesJson = JSON.stringify(images.map((img) => img.src));
    const navDots = settings.navigation === "dots" || settings.navigation === "both";
    const navArrows = settings.navigation === "arrows" || settings.navigation === "both";

    const code = `<!-- Carousel Widget Start -->
<div id="custom-carousel-root" style="width: ${previewSize.width}; height: ${previewSize.height}; position: relative; overflow: hidden; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0d0d;">
  <div id="carousel-track" style="display: flex; height: 100%; transition: transform 0.5s ease-in-out;"></div>
  ${navArrows ? `
  <button onclick="moveCarousel(-1)" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,160,0,0.9); border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(255,160,0,0.3); backdrop-filter: blur(10px); color: #0d0d0d; transition: all 0.3s ease;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
  </button>
  <button onclick="moveCarousel(1)" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,160,0,0.9); border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(255,160,0,0.3); backdrop-filter: blur(10px); color: #0d0d0d; transition: all 0.3s ease;">
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
    
    images.forEach((src, index) => {
      const slide = document.createElement('div');
      slide.style.minWidth = '100%';
      slide.style.height = '100%';
      slide.style.backgroundImage = 'url(' + src + ')';
      slide.style.backgroundSize = 'cover';
      slide.style.backgroundPosition = 'center';
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

    window.moveCarousel = function(direction) {
      currentIndex = (currentIndex + direction + images.length) % images.length;
      updateCarousel();
    };

    window.goToSlide = function(index) {
      currentIndex = index;
      updateCarousel();
    };

    function updateCarousel() {
      track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      ${navDots ? `
      Array.from(dotsContainer.children).forEach((dot, idx) => {
        dot.style.width = idx === currentIndex ? '24px' : '8px';
        dot.style.background = idx === currentIndex ? '#FFA000' : 'rgba(255,255,255,0.5)';
      });` : ""}
    }

    ${settings.autoPlay ? `
    setInterval(() => {
      window.moveCarousel(1);
    }, ${settings.interval * 1000});` : ""}
  })();
</script>
<!-- Carousel Widget End -->`;

    setGeneratedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("Код скопирован в буфер обмена");
  };

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-[#FFA000] selection:text-black">
      {/* Фоновые градиенты */}
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

        {/* Прогресс-бар */}
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
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all relative ${
                      inputMode === "url" ? "bg-[#FFA000] text-black shadow-lg shadow-[#FFA000]/30" : "text-white/60 hover:text-white"
                    }`}
                  >
                    URL ссылки
                  </button>
                  <button
                    onClick={() => setInputMode("upload")}
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all relative ${
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
                      placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                      className="w-full h-32 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm focus:bg-white/10 focus:outline-none focus:border-[#FFA000]/50 transition-all resize-none text-sm text-white placeholder-white/30"
                    />
                    <button
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim()}
                      className="px-6 py-3 bg-[#FFA000] text-black rounded-xl font-semibold hover:bg-[#FFB300] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FFA000]/20"
                    >
                      Добавить URL
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer hover:border-[#FFA000]/50 hover:bg-[#FFA000]/5 transition-all group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      />
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFA000]/10 border border-[#FFA000]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFA000" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p className="text-white font-medium mb-1">Нажмите для загрузки</p>
                      <p className="text-white/40 text-sm">или перетащите файлы сюда</p>
                      <p className="text-white/30 text-xs mt-4">Максимальный общий размер: 50 МБ</p>
                    </div>
                    {totalSize > 0 && (
                      <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-white/60">Занято: {(totalSize / 1024 / 1024).toFixed(2)} МБ</span>
                        <span className="text-[#FFA000] font-medium">из 50 МБ</span>
                      </div>
                    )}
                  </div>
                )}

                {images.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-white/50 mb-4 uppercase tracking-wider">
                      Добавлено изображений: {images.length}
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {images.map((img, idx) => (
                        <motion.div
                          key={img.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
                        >
                          <img src={img.src} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
                          >
                            Удалить
                          </button>
                        </motion.div>
                      ))}
                    </div>
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
                        className="ml-15 flex items-center gap-4 mt-4"
                      >
                        <input
                          type="number"
                          value={settings.interval}
                          onChange={(e) => setSettings({ ...settings, interval: Number(e.target.value) })}
                          className="w-20 p-2.5 rounded-xl border border-white/10 bg-white/5 text-center focus:outline-none focus:border-[#FFA000]/50 text-white"
                          min="1"
                          max="60"
                        />
                        <span className="text-white/50 text-sm">секунд между слайдами</span>
                      </motion.div>
                    )}
                  </div>

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
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div 
                      className="bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden mx-auto shadow-2xl shadow-black/50"
                      style={{ width: previewSize.width, height: previewSize.height, maxWidth: "100%" }}
                    >
                      <div className="relative w-full h-full group" id="preview-container">
                        <div 
                          className="flex h-full transition-transform duration-500 ease-in-out"
                          style={{ transform: `translateX(-${(currentIndex % images.length) * 100}%)` }}
                        >
                          {images.map((img) => (
                            <div key={img.id} className="min-w-full h-full bg-zinc-900 flex items-center justify-center">
                              <img src={img.src} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        
                        {(settings.navigation === "arrows" || settings.navigation === "both") && (
                          <>
                            <button 
                              onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#FFA000]/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-[#FFA000]/30 text-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FFB300]"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                            </button>
                            <button 
                              onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
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
                      </div>
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
                        Размеры можно задавать в пикселях (px) или процентах (%). 
                        Виджет автоматически адаптируется под указанные параметры.
                      </p>
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
                    Готово
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

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
                  <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#FFA000]/10 border border-[#FFA000]/20 w-fit">
                    <div className="w-2 h-2 rounded-full bg-[#FFA000]"></div>
                    <span className="text-xs font-medium text-[#FFA000]">Виджет полностью автономен</span>
                  </div>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={generatedCode}
                      className="w-full h-72 p-5 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm text-white/90 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-4 right-4 px-4 py-2 bg-[#FFA000] text-black rounded-lg text-sm font-semibold hover:bg-[#FFB300] transition-colors shadow-lg shadow-[#FFA000]/20"
                    >
                      Копировать
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
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