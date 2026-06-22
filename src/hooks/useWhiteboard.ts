"use client";

import { useCallback, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type Tool = "pen" | "eraser" | "rect" | "circle" | "arrow" | "line" | "text";

export interface StrokeStyle {
  color: string;
  width: number;
  tool: Tool;
}

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardEvent {
  type: "stroke_start" | "stroke_move" | "stroke_end" | "clear" | "text_place";
  tool: Tool;
  color: string;
  width: number;
  x: number;
  y: number;
  /** For shapes: the origin point when mousedown started */
  originX?: number;
  originY?: number;
  /** For text tool */
  text?: string;
  /** Sender identity — set by the receiver from participant data */
  senderIdentity?: string;
}

export interface ActiveRemoteStroke {
  identity: string;
  tool: Tool;
  color: string;
  width: number;
  originX: number;
  originY: number;
  points: WhiteboardPoint[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const CURSOR_LABEL_FONT = "bold 11px Inter, sans-serif";
const MAX_UNDO_STEPS = 30;

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useWhiteboard(
  baseCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  activeCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  publishData: (data: Uint8Array) => Promise<void>
) {
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000"); // default black
  const [strokeWidth, setStrokeWidth] = useState(3);

  // local drawing state
  const isDrawing = useRef(false);
  const lastPoint = useRef<WhiteboardPoint | null>(null);
  const originPoint = useRef<WhiteboardPoint | null>(null);
  // snapshot of base canvas at stroke start — used for shape preview
  const baseSnapshot = useRef<ImageData | null>(null);
  // undo stack: ImageData snapshots after each committed stroke
  const undoStack = useRef<ImageData[]>([]);

  // remote strokes currently in progress (keyed by senderIdentity)
  const remoteStrokes = useRef<Map<string, ActiveRemoteStroke>>(new Map());

  // ── helpers ──────────────────────────────────────────────────────────────────
  const getBaseCtx = useCallback(() => {
    const canvas = baseCanvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }, [baseCanvasRef]);

  const getActiveCtx = useCallback(() => {
    const canvas = activeCanvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }, [activeCanvasRef]);

  const clearActiveCanvas = useCallback(() => {
    const ctx = getActiveCtx();
    const canvas = activeCanvasRef.current;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [getActiveCtx, activeCanvasRef]);

  const saveUndoSnapshot = useCallback(() => {
    const ctx = getBaseCtx();
    const canvas = baseCanvasRef.current;
    if (!ctx || !canvas) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_UNDO_STEPS) {
      undoStack.current.shift();
    }
  }, [getBaseCtx, baseCanvasRef]);

  const applyStyle = useCallback(
    (ctx: CanvasRenderingContext2D, s: StrokeStyle) => {
      ctx.strokeStyle = s.tool === "eraser" ? "#ffffff" : s.color;
      ctx.fillStyle = s.tool === "eraser" ? "#ffffff" : s.color;
      ctx.lineWidth = s.tool === "eraser" ? s.width * 10 : s.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "source-over"; // Always source-over, just draw white to erase
    },
    []
  );

  // ── Shape drawing helpers ─────────────────────────────────────────────────────
  const drawShape = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      shapeTool: Tool,
      ox: number,
      oy: number,
      ex: number,
      ey: number
    ) => {
      ctx.beginPath();
      if (shapeTool === "rect") {
        ctx.strokeRect(ox, oy, ex - ox, ey - oy);
      } else if (shapeTool === "circle") {
        const rx = Math.abs(ex - ox) / 2;
        const ry = Math.abs(ey - oy) / 2;
        const cx = ox + (ex - ox) / 2;
        const cy = oy + (ey - oy) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shapeTool === "line") {
        ctx.moveTo(ox, oy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else if (shapeTool === "arrow") {
        // line
        ctx.moveTo(ox, oy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // arrowhead
        const angle = Math.atan2(ey - oy, ex - ox);
        const headLen = Math.max(10, ctx.lineWidth * 4);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - headLen * Math.cos(angle - Math.PI / 6),
          ey - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          ex - headLen * Math.cos(angle + Math.PI / 6),
          ey - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    },
    []
  );

  // ── Local pointer events ──────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = activeCanvasRef.current;
      if (!canvas) return;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      isDrawing.current = true;
      lastPoint.current = { x, y };
      originPoint.current = { x, y };

      // Snapshot base canvas for shape preview / undo
      const baseCtx = getBaseCtx();
      const baseCanvas = baseCanvasRef.current;
      if (baseCtx && baseCanvas) {
        baseSnapshot.current = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      }

      const activeCtx = getActiveCtx();
      if (activeCtx) {
        applyStyle(activeCtx, { color, width: strokeWidth, tool });
        if (tool === "pen" || tool === "eraser") {
          activeCtx.beginPath();
          activeCtx.moveTo(x, y);
        }
      }

      publish({ type: "stroke_start", tool, color, width: strokeWidth, x, y });
    },
    [tool, color, strokeWidth, getActiveCtx, getBaseCtx, activeCanvasRef, baseCanvasRef, applyStyle]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      const canvas = activeCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      const activeCtx = getActiveCtx();
      if (activeCtx) {
        applyStyle(activeCtx, { color, width: strokeWidth, tool });
        if (tool === "pen" || tool === "eraser") {
          activeCtx.lineTo(x, y);
          activeCtx.stroke();
        } else {
          // shape preview — redraw on active canvas from snapshot
          clearActiveCanvas();
          const origin = originPoint.current!;
          drawShape(activeCtx, tool, origin.x, origin.y, x, y);
        }
      }

      lastPoint.current = { x, y };
      publish({
        type: "stroke_move",
        tool,
        color,
        width: strokeWidth,
        x,
        y,
        originX: originPoint.current?.x,
        originY: originPoint.current?.y,
      });
    },
    [tool, color, strokeWidth, getActiveCtx, clearActiveCanvas, drawShape, applyStyle, activeCanvasRef]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const canvas = activeCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      // Save undo snapshot BEFORE committing
      saveUndoSnapshot();

      // Commit active canvas to base canvas
      const baseCtx = getBaseCtx();
      const baseCanvas = baseCanvasRef.current;
      if (baseCtx && baseCanvas) {
        if (tool === "pen" || tool === "eraser") {
          // copy the active canvas path to base
          const activeCtx = getActiveCtx();
          if (activeCtx) {
            applyStyle(baseCtx, { color, width: strokeWidth, tool });
            const imageData = activeCtx.getImageData(0, 0, canvas.width, canvas.height);
            // Draw active layer onto base
            baseCtx.drawImage(canvas, 0, 0);
          }
        } else {
          // shape: restore snapshot then draw final shape on base
          if (baseSnapshot.current) {
            baseCtx.putImageData(baseSnapshot.current, 0, 0);
          }
          const origin = originPoint.current!;
          applyStyle(baseCtx, { color, width: strokeWidth, tool });
          drawShape(baseCtx, tool, origin.x, origin.y, x, y);
        }
      }

      clearActiveCanvas();

      publish({
        type: "stroke_end",
        tool,
        color,
        width: strokeWidth,
        x,
        y,
        originX: originPoint.current?.x,
        originY: originPoint.current?.y,
      });

      originPoint.current = null;
      lastPoint.current = null;
      baseSnapshot.current = null;
    },
    [
      tool,
      color,
      strokeWidth,
      getBaseCtx,
      getActiveCtx,
      clearActiveCanvas,
      saveUndoSnapshot,
      drawShape,
      applyStyle,
      activeCanvasRef,
      baseCanvasRef,
    ]
  );

  // ── Text placement ────────────────────────────────────────────────────────────
  const placeText = useCallback(
    (x: number, y: number, text: string) => {
      const ctx = getBaseCtx();
      if (!ctx || !text.trim()) return;
      saveUndoSnapshot();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.font = `${strokeWidth * 6 + 10}px Inter, sans-serif`;
      ctx.fillText(text, x, y);
      publish({ type: "text_place", tool: "text", color, width: strokeWidth, x, y, text });
    },
    [getBaseCtx, color, strokeWidth, saveUndoSnapshot]
  );

  // ── Undo ─────────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const ctx = getBaseCtx();
    const canvas = baseCanvasRef.current;
    if (!ctx || !canvas) return;
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    ctx.putImageData(prev, 0, 0);
  }, [getBaseCtx, baseCanvasRef]);

  // ── Clear ────────────────────────────────────────────────────────────────────
  const clearAll = useCallback(
    (broadcastToPeers = true) => {
      const baseCtx = getBaseCtx();
      const activeCtx = getActiveCtx();
      const baseCanvas = baseCanvasRef.current;
      const activeCanvas = activeCanvasRef.current;
      if (baseCtx && baseCanvas) {
        saveUndoSnapshot();
        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
      }
      if (activeCtx && activeCanvas) {
        activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      }
      undoStack.current = [];
      if (broadcastToPeers) {
        publish({ type: "clear", tool: "pen", color, width: strokeWidth, x: 0, y: 0 });
      }
    },
    [getBaseCtx, getActiveCtx, baseCanvasRef, activeCanvasRef, saveUndoSnapshot, color, strokeWidth]
  );

  // ── Download ─────────────────────────────────────────────────────────────────
  const downloadPNG = useCallback(() => {
    const baseCanvas = baseCanvasRef.current;
    if (!baseCanvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = baseCanvas.toDataURL("image/png");
    link.click();
  }, [baseCanvasRef]);

  // ── Publish helper ────────────────────────────────────────────────────────────
  function publish(event: Omit<WhiteboardEvent, "senderIdentity">) {
    const payload = JSON.stringify({ category: "whiteboard", ...event });
    publishData(new TextEncoder().encode(payload)).catch(() => {});
  }

  // ── Receive remote events ─────────────────────────────────────────────────────
  const handleRemoteEvent = useCallback(
    (event: WhiteboardEvent) => {
      const { senderIdentity, tool: eTool, color: eColor, width: eWidth, x, y } = event;
      const id = senderIdentity || "unknown";

      const baseCtx = getBaseCtx();
      const baseCanvas = baseCanvasRef.current;

      if (event.type === "clear") {
        if (baseCtx && baseCanvas) {
          baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        }
        remoteStrokes.current.clear();
        return;
      }

      if (event.type === "text_place") {
        if (baseCtx && event.text) {
          baseCtx.globalCompositeOperation = "source-over";
          baseCtx.fillStyle = eColor;
          baseCtx.font = `${eWidth * 6 + 10}px Inter, sans-serif`;
          baseCtx.fillText(event.text, x, y);
        }
        return;
      }

      if (event.type === "stroke_start") {
        remoteStrokes.current.set(id, {
          identity: id,
          tool: eTool,
          color: eColor,
          width: eWidth,
          originX: x,
          originY: y,
          points: [{ x, y }],
        });
        return;
      }

      const stroke = remoteStrokes.current.get(id);
      if (!stroke) return;

      if (event.type === "stroke_move") {
        stroke.points.push({ x, y });
        if (eTool === "pen" || eTool === "eraser") {
          if (baseCtx) {
            applyStyle(baseCtx, { color: eColor, width: eWidth, tool: eTool });
            const pts = stroke.points;
            const prev = pts[pts.length - 2];
            if (prev) {
              baseCtx.beginPath();
              baseCtx.moveTo(prev.x, prev.y);
              baseCtx.lineTo(x, y);
              baseCtx.stroke();
            }
          }
        }
        return;
      }

      if (event.type === "stroke_end") {
        stroke.points.push({ x, y });
        if ((eTool === "rect" || eTool === "circle" || eTool === "line" || eTool === "arrow") && baseCtx) {
          applyStyle(baseCtx, { color: eColor, width: eWidth, tool: eTool });
          const ox = event.originX ?? stroke.originX;
          const oy = event.originY ?? stroke.originY;
          drawShape(baseCtx, eTool, ox, oy, x, y);
        }
        remoteStrokes.current.delete(id);
      }
    },
    [getBaseCtx, baseCanvasRef, applyStyle, drawShape]
  );

  return {
    tool, setTool,
    color, setColor,
    strokeWidth, setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    placeText,
    undo,
    clearAll,
    downloadPNG,
    handleRemoteEvent,
  };
}
