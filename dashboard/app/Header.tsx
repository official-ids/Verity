"use client";

import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-xs font-medium tracking-widest uppercase text-white/60">
          Projects Hub
        </span>
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
        Инструменты и проекты
      </h1>
      <p className="text-xl text-white/50 max-w-2xl leading-relaxed">
        Централизованная панель управления всеми разработками.
      </p>
    </motion.div>
  );
}