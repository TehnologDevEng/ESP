import React, { useRef, useState, useEffect } from 'react';
import { CalculationResult, WellParameters, CompletionGeometry } from '../types/esp';
import { generateFullStringCurves, generateSystemHeadCurve, getViscosityCorrections } from '../utils/calculations';
import { LineChart, Sliders, RotateCcw } from 'lucide-react';

interface PerformanceChartProps {
  result: CalculationResult;
  well: WellParameters;
  completion: CompletionGeometry;
  frequency: number;
  onChangeFrequency?: (f: number) => void;
}

type ChartViewMode = 'all' | 'head' | 'power_eff' | 'frequency_family';

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  result,
  well,
  completion,
  frequency,
  onChangeFrequency
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setChartViewMode] = useState<ChartViewMode>('all');
  const [hoverData, setHoverData] = useState<{
    q: number;
    h: number;
    tdh: number;
    p: number;
    eff: number;
    x: number;
    y: number;
  } | null>(null);

  const { pump, totalStages, numSections, fullStringHeadAtQ, fullStringShaftPowerKW, fullStringEfficiency } = result;

  // Основные кривые для текущей частоты
  const curves = generateFullStringCurves(result, 60);

  // Максимальный расход для масштабирования
  const maxQ = Math.max(...curves.map(c => c.q), well.qTarget * 1.35, 100);
  const maxH = Math.max(...curves.map(c => c.hTotal), result.totalDynamicHead * 1.25, 500);
  const maxP = Math.max(...curves.map(c => c.pShaft), 10);
  const maxEff = 100;

  // Кривая сети
  const systemCurves = generateSystemHeadCurve(result, well, completion, maxQ);

  // Точка пересечения кривой насоса H(Q) и кривой сети TDH(Q)
  const intersectionPoint = (() => {
    const count = Math.min(curves.length, systemCurves.length);
    for (let i = 1; i < count; i++) {
      // Находим TDH при q = curves[i].q линейной интерполяцией по systemCurves
      const qPrev = curves[i - 1].q;
      const qCurr = curves[i].q;
      const interpTdh = (qVal: number) => {
        const idx = systemCurves.findIndex(s => s.q >= qVal);
        if (idx <= 0) return systemCurves[0]?.hReq ?? 0;
        const s0 = systemCurves[idx - 1];
        const s1 = systemCurves[idx];
        const ratio = (qVal - s0.q) / Math.max(1e-6, s1.q - s0.q);
        return s0.hReq + ratio * (s1.hReq - s0.hReq);
      };
      const diffPrev = curves[i - 1].hTotal - interpTdh(qPrev);
      const diffCurr = curves[i].hTotal - interpTdh(qCurr);
      if (diffPrev >= 0 && diffCurr <= 0 && (diffPrev - diffCurr) > 1e-6) {
        const t = diffPrev / (diffPrev - diffCurr);
        return {
          q: qPrev + t * (qCurr - qPrev),
          h: curves[i - 1].hTotal + t * (curves[i].hTotal - curves[i - 1].hTotal)
        };
      }
    }
    return null;
  })();

  // Семейство частот ЧРП для режима 'frequency_family'
  const freqFamilyList = [40, 45, 50, 55, 60];
  const freqCurvesMap = freqFamilyList.map(f => ({
    freq: f,
    points: generateFullStringCurves(result, 50, f)
  }));

  // Отрисовка на Canvas с поддержкой Retina High-DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Границы графика
    const padLeft = 62;
    const padRight = viewMode === 'all' || viewMode === 'power_eff' ? 76 : 44;
    const padTop = 26;
    const padBottom = 42;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    ctx.clearRect(0, 0, w, h);

    // Координатные преобразования
    const toX = (q: number) => padLeft + (q / maxQ) * plotW;
    const toYHead = (head: number) => padTop + plotH - (head / maxH) * plotH;
    const toYPower = (p: number) => padTop + plotH - (p / maxP) * plotH;
    const toYEff = (eff: number) => padTop + plotH - (eff / maxEff) * plotH;

    // 1. Зона ОДР
    const kF = frequency / 50;
    const qMinRec = pump.qMin * kF;
    const qMaxRec = pump.qMax * kF;
    const rorX1 = Math.max(padLeft, toX(qMinRec));
    const rorX2 = Math.min(padLeft + plotW, toX(qMaxRec));

    if (rorX2 > rorX1) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.fillRect(rorX1, padTop, rorX2 - rorX1, plotH);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rorX1, padTop); ctx.lineTo(rorX1, padTop + plotH);
      ctx.moveTo(rorX2, padTop); ctx.lineTo(rorX2, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Горизонтальная сетка (Напор + КПД/Мощность справа)
    const gridYCount = 5;
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let i = 0; i <= gridYCount; i++) {
      const val = (maxH / gridYCount) * i;
      const y = toYHead(val);

      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      // Подпись напора слева (м)
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${Math.round(val)} м`, padLeft - 8, y + 3);

      // Подпись КПД и мощности справа
      if (viewMode === 'all' || viewMode === 'power_eff') {
        const valEff = Math.round((maxEff / gridYCount) * i);
        const valPow = ((maxP / gridYCount) * i).toFixed(0);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#10b981';
        ctx.fillText(`${valEff}%`, padLeft + plotW + 8, y - 1);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`${valPow} кВт`, padLeft + plotW + 8, y + 10);
      }
    }

    // Вертикальная сетка (Подача Q)
    const gridXCount = 6;
    ctx.textAlign = 'center';
    for (let i = 0; i <= gridXCount; i++) {
      const qVal = (maxQ / gridXCount) * i;
      const x = toX(qVal);

      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${Math.round(qVal)}`, x, padTop + plotH + 16);
    }

    // Подписи осей
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Подача жидкости Q, м³/сут', padLeft + plotW / 2, padTop + plotH + 33);

    // Левая ось Y
    ctx.save();
    ctx.translate(14, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Напор сборки H (${totalStages} ст.), м`, 0, 0);
    ctx.restore();

    // Правая ось Y
    if (viewMode === 'all' || viewMode === 'power_eff') {
      ctx.save();
      ctx.translate(w - 11, padTop + plotH / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('КПД (%) · Мощность (кВт)', 0, 0);
      ctx.restore();
    }

    // 2. Семейство частот ЧРП
    if (viewMode === 'frequency_family') {
      freqCurvesMap.forEach(({ freq, points }) => {
        const isCurrent = Math.abs(freq - frequency) < 0.25;
        ctx.strokeStyle = isCurrent ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = isCurrent ? 3 : 1.5;
        ctx.setLineDash(isCurrent ? [] : [3, 3]);

        ctx.beginPath();
        points.forEach((pt, idx) => {
          const x = toX(pt.q);
          const y = toYHead(pt.hTotal);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        const lastPt = points[points.length - 1];
        if (lastPt) {
          ctx.fillStyle = isCurrent ? '#38bdf8' : '#64748b';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${freq} Гц`, Math.min(w - 36, toX(lastPt.q) + 4), toYHead(lastPt.hTotal) - 3);
        }
      });
    }

    // 3. Кривая требуемого напора системы TDH(Q)
    if (viewMode === 'all' || viewMode === 'head' || viewMode === 'frequency_family') {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      systemCurves.forEach((pt, idx) => {
        const x = toX(pt.q);
        const y = toYHead(pt.hReq);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Основная напорная характеристика всей сборки H_total(Q)
    if (viewMode === 'all' || viewMode === 'head' || viewMode === 'frequency_family') {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      curves.forEach((pt, idx) => {
        const x = toX(pt.q);
        const y = toYHead(pt.hTotal);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Кривая мощности P_shaft(Q)
    if (viewMode === 'all' || viewMode === 'power_eff') {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      curves.forEach((pt, idx) => {
        const x = toX(pt.q);
        const y = toYPower(pt.pShaft);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 6. Кривая КПД Eff(Q)
    if (viewMode === 'all' || viewMode === 'power_eff') {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      curves.forEach((pt, idx) => {
        const x = toX(pt.q);
        const y = toYEff(pt.efficiency);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 7. Точка максимального КПД (BEP) строго на кривой H(Q) с точной ANSI/HI вязкостью
    if (viewMode !== 'power_eff') {
      const bepQ = pump.qNom * kF;
      const [a0, a1, a2] = pump.coeffH;
      const { cH } = getViscosityCorrections(result.mixViscosity, pump.qNom);
      const hBepStage = Math.max(
        0,
        (a0 - a1 * pump.qNom - a2 * Math.pow(pump.qNom, 2)) *
          Math.pow(kF, 2) *
          cH *
          result.gasHeadDegradationFactor
      );
      const bepHead = hBepStage * totalStages;
      const bepX = toX(bepQ);
      const bepY = toYHead(bepHead);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(bepX, bepY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 8. Пересечение с сетью H(Q) = TDH(Q)
    if (intersectionPoint && viewMode !== 'power_eff') {
      const intX = toX(intersectionPoint.q);
      const intY = toYHead(intersectionPoint.h);
      ctx.fillStyle = '#0b0e14';
      ctx.beginPath();
      ctx.arc(intX, intY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 9. Рабочая точка скважины (Target Q)
    const opX = toX(well.qTarget);
    const opY = viewMode === 'power_eff' ? toYEff(fullStringEfficiency) : toYHead(fullStringHeadAtQ);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(opX, padTop + plotH);
    ctx.lineTo(opX, opY);
    ctx.lineTo(padLeft, opY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(opX, opY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Подпись рабочей точки
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    const tagText = viewMode === 'power_eff'
      ? `${well.qTarget} м³/сут · η=${fullStringEfficiency.toFixed(1)}%`
      : `${well.qTarget} м³/сут · ${Math.round(fullStringHeadAtQ)} м`;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const tagW = ctx.measureText(tagText).width + 12;
    const tagX = Math.max(padLeft + 4, Math.min(padLeft + plotW - tagW - 4, opX + 10));
    const tagY = Math.max(padTop + 16, opY - 12);

    ctx.fillRect(tagX, tagY - 12, tagW, 18);
    ctx.strokeRect(tagX, tagY - 12, tagW, 18);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(tagText, tagX + tagW / 2, tagY + 1);

    // 10. Интерактивное перекрестие и маркеры на кривых
    if (hoverData) {
      const hx = toX(hoverData.q);
      const hyHead = toYHead(hoverData.h);
      const hyPow = toYPower(hoverData.p);
      const hyEff = toYEff(hoverData.eff);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, padTop + plotH);
      if (viewMode !== 'power_eff') {
        ctx.moveTo(padLeft, hyHead);
        ctx.lineTo(padLeft + plotW, hyHead);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (viewMode !== 'power_eff') {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(hx, hyHead, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (viewMode === 'all' || viewMode === 'power_eff') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(hx, hyPow, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(hx, hyEff, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [result, well, completion, frequency, viewMode, hoverData, intersectionPoint]);

  // Обработка движения мыши
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padLeft = 62;
    const padRight = viewMode === 'all' || viewMode === 'power_eff' ? 76 : 44;
    const padTop = 26;
    const padBottom = 42;
    const plotW = rect.width - padLeft - padRight;

    if (x < padLeft || x > padLeft + plotW || y < padTop || y > rect.height - padBottom) {
      setHoverData(null);
      return;
    }

    const relX = (x - padLeft) / plotW;
    const qHover = Math.max(0, Math.min(maxQ, relX * maxQ));

    const closest = curves.reduce((prev, curr) =>
      Math.abs(curr.q - qHover) < Math.abs(prev.q - qHover) ? curr : prev
    );

    const closestSys = systemCurves.reduce((prev, curr) =>
      Math.abs(curr.q - closest.q) < Math.abs(prev.q - closest.q) ? curr : prev
    );

    setHoverData({
      q: Math.round(closest.q),
      h: Math.round(closest.hTotal),
      tdh: Math.round(closestSys.hReq),
      p: Math.round(closest.pShaft * 10) / 10,
      eff: Math.round(closest.efficiency * 10) / 10,
      x,
      y
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div className="bg-[#131924] border border-[#243044] rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Верхняя панель графика */}
      <div className="bg-[#182130] px-4 py-2.5 border-b border-[#243044] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <LineChart className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
            Сборка УЭЦН: {totalStages} ст. · {numSections} секц.
          </span>
          <span className="text-[11px] font-mono text-sky-400 whitespace-nowrap">
            · {frequency} Гц
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#0e141f] p-1 rounded-lg border border-[#243044]">
          <button
            type="button"
            onClick={() => setChartViewMode('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Все кривые
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode('head')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'head'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Напор H(Q)
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode('power_eff')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'power_eff'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Мощность и КПД
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode('frequency_family')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
              viewMode === 'frequency_family'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Семейство ЧРП
          </button>
        </div>
      </div>

      {/* Встроенный регулятор ЧРП и показатели рабочей точки */}
      <div className="bg-[#0f1520] px-4 py-2 border-b border-[#1e2738] flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div>
            <span className="text-slate-400">Точка: </span>
            <span className="font-bold text-amber-300">{well.qTarget} м³/сут</span>
          </div>
          <div>
            <span className="text-slate-400">H: </span>
            <span className="font-bold text-sky-400">{Math.round(fullStringHeadAtQ)} м</span>
          </div>
          <div>
            <span className="text-slate-400">N: </span>
            <span className="font-bold text-amber-400">{fullStringShaftPowerKW.toFixed(1)} кВт</span>
          </div>
          <div>
            <span className="text-slate-400">η: </span>
            <span className="font-bold text-emerald-400">{fullStringEfficiency.toFixed(1)}%</span>
          </div>
          <div className={result.isWithinOperatingRange ? 'text-emerald-400' : 'text-rose-400'}>
            {result.isWithinOperatingRange ? '● В ОДР' : '▲ Вне ОДР'}
          </div>
        </div>

        {onChangeFrequency && (
          <div className="flex items-center gap-2 ml-auto">
            <label htmlFor="chart-vfd-slider" className="text-[11px] font-sans text-slate-400 whitespace-nowrap">
              ЧРП:
            </label>
            <input
              id="chart-vfd-slider"
              type="range"
              min={35}
              max={65}
              step={0.5}
              value={frequency}
              onChange={(e) => onChangeFrequency(parseFloat(e.target.value))}
              className="w-24 sm:w-28 h-1.5 bg-[#1e2738] rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="w-14 text-right font-bold text-sky-300">{frequency.toFixed(1)} Гц</span>
            {Math.abs(frequency - 50) > 0.1 && (
              <button
                type="button"
                onClick={() => onChangeFrequency(50)}
                title="Сбросить частоту на 50 Гц"
                className="px-1.5 py-0.5 rounded bg-[#182130] hover:bg-[#243044] text-slate-300 text-[10px] border border-[#243044] flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                50
              </button>
            )}
          </div>
        )}
      </div>

      {/* Канвас с графиком */}
      <div ref={containerRef} className="relative flex-1 p-2.5 bg-[#0b0e14] min-h-[340px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block cursor-crosshair"
        />

        {hoverData && (
          <div
            style={{
              left: `${Math.min(hoverData.x + 14, (containerRef.current?.offsetWidth || 400) - 185)}px`,
              top: `${Math.max(10, hoverData.y - 84)}px`
            }}
            className="absolute pointer-events-none bg-[#141b27]/95 backdrop-blur-md border border-blue-500/50 rounded-lg p-2.5 shadow-2xl text-[11px] font-mono tabular-nums space-y-1 z-30 min-w-[165px]"
          >
            <div className="text-slate-200 font-bold border-b border-[#243044] pb-1">
              Q = {hoverData.q} м³/сут
            </div>
            <div className="text-sky-400 flex items-center justify-between gap-3">
              <span>H сборки:</span>
              <span className="font-bold">{hoverData.h} м</span>
            </div>
            <div className="text-rose-400 flex items-center justify-between gap-3">
              <span>TDH сети:</span>
              <span className="font-bold">{hoverData.tdh} м</span>
            </div>
            <div className="text-amber-400 flex items-center justify-between gap-3">
              <span>Мощность:</span>
              <span className="font-bold">{hoverData.p} кВт</span>
            </div>
            <div className="text-emerald-400 flex items-center justify-between gap-3">
              <span>КПД:</span>
              <span className="font-bold">{hoverData.eff}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Инженерная легенда кривых */}
      <div className="bg-[#182130] px-4 py-2 border-t border-[#243044] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-sky-400 rounded-full" />
            <span>H(Q) сборки</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500" />
            <span>Сеть TDH(Q)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded-full" />
            <span>N(Q)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full" />
            <span>η(Q)</span>
          </div>
          {intersectionPoint && (
            <div className="flex items-center gap-1.5 text-rose-300 font-mono text-[10px]">
              <span>◎ Баланс: {Math.round(intersectionPoint.q)} м³/сут</span>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
          Напор при Q=0: {Math.round(result.shutoffHead)} м ({((result.shutoffHead * result.mixDensity * 9.81) / 101325).toFixed(1)} атм)
        </div>
      </div>
    </div>
  );
};

