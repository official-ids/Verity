"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Tool } from "@/lib/tools";

interface ProjectsListProps {
  tools: Tool[];
}

export default function ProjectsList({ tools }: ProjectsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool, index) => (
        <motion.div
          key={tool.url}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Link 
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block h-full"
          >
            <div className="h-full p-6 rounded-2xl border border-white/10 bg-zinc-900/30 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-zinc-900/60 hover:-translate-y-1">
              
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src={tool.avatar} 
                    alt=""
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-white group-hover:text-black transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <span className="text-xs font-mono text-white/40 truncate block">
                  {tool.url.replace(/^https?:\/\//, '')}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}