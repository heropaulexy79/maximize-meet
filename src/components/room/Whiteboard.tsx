"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pen,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Type,
  Undo2,
  Trash2,
  Download,
  X,
  ChevronDown,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWhiteboard, type Tool, type WhiteboardEvent } from "@/hooks/useWhiteboard";

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
  "#71717a", "#ffffff",
];

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "pen", icon: <Pen className="w-4 h-4" />, label: "Pen" },
  { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Eraser" },
  { id: "rect", icon: <Square className="w-4 h-4" />, label: "Rectangle" },
  { id: "circle", icon: <Circle className="w-4 h-4" />, label: "Circle" },
  { id: "line", icon: <Minus className="w-4 h-4" />, label: "Line" },
  { id: "arrow", icon: <ArrowRight className="w-4 h-4" />, label: "Arrow" },
  { id: "text", icon: <Type className="w-4 h-4" />, label: "Text" },
];

const STROKE_WIDTHS = [
  { value: 2, label: "Thin" },
  { value: 4, label: "Medium" },
  { value: 8, label: "Thick" },
];

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// ─── Whiteboard Component ──────────────────────────────────────────────────────
interface WhiteboardProps {
  isAdmin: boolean;
  onClose: () => void;
}

export function Whiteboard({ isAdmin, onClose }: WhiteboardProps) {
  const room = useRoomContext();
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Text tool state
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Color palette visibility
  const [showPalette, setShowPalette] = useState(false);

  const publishData = useCallback(
    async (data: Uint8Array) => {
      if (room?.localParticipant) {
        await room.localParticipant.publishData(data, { reliable: true });
      }
    },
    [room]
  );

  const wb = useWhiteboard(baseCanvasRef, activeCanvasRef, publishData);

  // ── Broadcast open/close to all participants ─────────────────────────────────
  useEffect(() => {
    const broadcast = (open: boolean) => {
      if (!room?.localParticipant) return;
      const payload = JSON.stringify({ category: "whiteboard", type: "whiteboard_state", open });
      room.localParticipant
        .publishData(new TextEncoder().encode(payload), { reliable: true })
        .catch(() => {});
    };
    broadcast(true);
    return () => broadcast(false);
  }, [room]);

  // ── Initialize canvas background ────────────────────────────────────────────
  useEffect(() => {
    const ctx = baseCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff"; // White background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // ── Listen for remote whiteboard events ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const event = (e as CustomEvent<WhiteboardEvent>).detail;
      wb.handleRemoteEvent(event);
    };
    window.addEventListener("whiteboard-data", handler);
    return () => window.removeEventListener("whiteboard-data", handler);
  }, [wb.handleRemoteEvent]);

  // ── Handle canvas click for text tool ───────────────────────────────────────
  const handleCanvasClick = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (wb.tool !== "text") return;
      const canvas = activeCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      // Position the input visually aligned with click
      setTextPos({ x, y });
      setShowTextInput(true);
      setTimeout(() => textInputRef.current?.focus(), 50);
    },
    [wb.tool]
  );

  const commitText = useCallback(() => {
    if (textPos && textInput.trim()) {
      wb.placeText(textPos.x, textPos.y, textInput);
    }
    setTextInput("");
    setTextPos(null);
    setShowTextInput(false);
  }, [textPos, textInput, wb]);

  // ── Cursor style ─────────────────────────────────────────────────────────────
  const cursorStyle =
    wb.tool === "eraser"
      ? "cursor-cell"
      : wb.tool === "text"
      ? "cursor-text"
      : "cursor-crosshair";

  return (
    <motion.div
      key="whiteboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute inset-0 z-40 flex flex-col bg-white overflow-hidden"
    >
      {/* ── Top Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-zinc-900/95 backdrop-blur border-b border-white/5 shadow-lg flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => { wb.setTool(t.id); setShowPalette(false); }}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 text-white/60 hover:text-white hover:bg-white/10",
                wb.tool === t.id && "bg-primary/20 text-primary border border-primary/40 shadow-inner"
              )}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Stroke Width */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {STROKE_WIDTHS.map((sw) => (
            <button
              key={sw.value}
              title={sw.label}
              onClick={() => wb.setStrokeWidth(sw.value)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-white/10",
                wb.strokeWidth === sw.value
                  ? "bg-primary/20 border border-primary/40"
                  : ""
              )}
            >
              <div
                className="rounded-full bg-white"
                style={{
                  width: sw.value * 2.5,
                  height: sw.value * 2.5,
                  maxWidth: 18,
                  maxHeight: 18,
                }}
              />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowPalette((p) => !p)}
            className="flex items-center gap-2 px-3 h-8 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
          >
            <div
              className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
              style={{ background: wb.color }}
            />
            <Palette className="w-3 h-3 text-white/40" />
          </button>

          <AnimatePresence>
            {showPalette && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-10 left-0 z-50 bg-zinc-900 border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-3"
              >
                {/* Preset swatches */}
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { wb.setColor(c); setShowPalette(false); }}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95",
                        wb.color === c ? "border-white scale-110" : "border-transparent"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                {/* Native color picker */}
                <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer hover:text-white/60 transition-colors">
                  <input
                    type="color"
                    value={wb.color}
                    onChange={(e) => wb.setColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none outline-none"
                  />
                  Custom color
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Actions */}
        <button
          title="Undo"
          onClick={wb.undo}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {isAdmin && (
          <button
            title="Clear All (Admin only)"
            onClick={() => wb.clearAll(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <button
          title="Download as PNG"
          onClick={wb.downloadPNG}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Current color preview + label — right side */}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:block text-[10px] text-white/30 uppercase tracking-widest font-bold">
            Whiteboard
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            title="Close Whiteboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Canvas Area ──────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-white"
        onClick={() => setShowPalette(false)}
      >
        {/* Shadow wrapper */}
        <div className="relative w-full h-full" style={{ touchAction: "none" }}>
          {/* Base canvas — committed strokes */}
          <canvas
            ref={baseCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: "auto" }}
          />

          {/* Active canvas — in-progress local stroke */}
          <canvas
            ref={activeCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={cn("absolute inset-0 w-full h-full", cursorStyle)}
            style={{ imageRendering: "auto" }}
            onPointerDown={wb.tool === "text" ? handleCanvasClick : wb.handlePointerDown}
            onPointerMove={wb.tool !== "text" ? wb.handlePointerMove : undefined}
            onPointerUp={wb.tool !== "text" ? wb.handlePointerUp : undefined}
          />
        </div>

        {/* Text input overlay */}
        <AnimatePresence>
          {showTextInput && textPos && (
            <motion.div
              key="text-input"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-50 flex items-center gap-2 bg-zinc-900 border border-white/20 rounded-xl px-3 py-2 shadow-2xl"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitText();
                  if (e.key === "Escape") {
                    setShowTextInput(false);
                    setTextInput("");
                    setTextPos(null);
                  }
                }}
                placeholder="Type and press Enter…"
                className="bg-transparent text-white text-sm outline-none min-w-[200px] placeholder:text-white/30"
                style={{ color: wb.color, fontSize: `${wb.strokeWidth * 4 + 12}px` }}
              />
              <button
                onClick={commitText}
                className="text-primary text-xs font-bold hover:text-primary/80 transition-colors"
              >
                Place
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile bottom tool hint ──────────────────────────────────────────── */}
      <div className="sm:hidden flex items-center justify-center py-2 bg-zinc-900/80 border-t border-white/5">
        <span className="text-[10px] text-white/30 uppercase tracking-widest">
          {TOOLS.find((t) => t.id === wb.tool)?.label} · tap &amp; draw
        </span>
      </div>
    </motion.div>
  );
}
