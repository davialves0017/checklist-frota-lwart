"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function SignaturePad({ onChange }: { onChange: (blob: Blob | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx?.scale(ratio, ratio);
    if (ctx) { ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 2.4; ctx.strokeStyle = "#12345a"; }
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    ctx?.beginPath(); ctx?.moveTo(p.x, p.y);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    ctx?.lineTo(p.x, p.y); ctx?.stroke();
    if (!hasInk) setHasInk(true);
  };
  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    canvasRef.current?.toBlob((blob) => onChange(blob), "image/png");
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false); onChange(null);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><label className="font-semibold text-[#12345a]">Assinatura</label><Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk}><RotateCcw className="mr-1 h-4 w-4" />Limpar</Button></div>
      <canvas ref={canvasRef} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} className="signature-canvas h-44 w-full rounded-xl border-2 border-dashed border-[#9db8c7] bg-white" aria-label="Área para assinatura" />
      <p className="mt-2 text-sm text-[#587083]">Assine com o dedo dentro da área.</p>
    </div>
  );
}
