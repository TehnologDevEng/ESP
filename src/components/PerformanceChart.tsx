import React, { useRef, useState, useEffect } from 'react';
import { CalculationResult, WellParameters, CompletionGeometry } from '../types/esp';
import { generateFullStringCurves, generateSystemHeadCurve } from '../utils/calculations';
import { LineChart, Activity, Zap, Gauge, Sparkles, Sliders } from 'lucide-react';

interface PerformanceChartProps {
  result: CalculationResult;
  well: WellParameters;
  completion: CompletionGeometry;
  frequency: number;
}

type ChartViewMode = 'all' | 'head' | 'power_eff' | 'frequency_family';

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  result,
  well,
  completion,
  frequency
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setChartViewMode] = useState<ChartViewMode>('all');
  const [hoverData, setHoverData] = useState<{
    q: number;
    h: number;
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
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Границы графика
    const padLeft = 60;
    const padRight = 60;
    const padTop = 30;
    const padBottom = 45;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Очистка
    ctx.clearRect(0, 0, w, h);

    // Координатные преобразования
    const toX = (q: number) => padLeft + (q / maxQ) * plotW;
    const toYHead = (head: number) => padTop + plotH - (head / maxH) * plotH;
    const toYPower = (p: number) => padTop + plotH - (p / maxP) * plotH;
    const toYEff = (eff: number) => padTop + plotH - (eff / maxEff) * plotH;

    // 1. Сетка и фон рабочей зоны
    // Рекомендованный рабочий диапазон (ROR)
    const kF = frequency / 50;
    const qMinRec = pump.qMin * kF;
    const qMaxRec = pump.qMax * kF;
    const rorX1 = Math.max(padLeft, toX(qMinRec));
    const rorX2 = Math.min(padLeft + plotW, toX(qMaxRec));

    if (rorX2 > rorX1) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.fillRect(rorX1, padTop, rorX2 - rorX1, plotH);
      // Пунктирные границы зоны
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rorX1, padTop); ctx.lineTo(rorX1, padTop + plotH);
      ctx.moveTo(rorX2, padTop); ctx.lineTo(rorX2, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Горизонтальная сетка (Напор)
    const gridYCount = 5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridYCount; i++) {
      const val = (maxH / gridYCount) * i;
      const y = toYHead(val);

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      // Подпись напора слева (м)
      ctx.fillText(`${Math.round(val)} м`, padLeft - 8, y + 3);

      // Подпись мощности/КПД справа
      if (viewMode === 'all' || viewMode === 'power_eff') {
        const valEff = Math.round((maxEff / gridYCount) * i);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#10b981';
        ctx.fillText(`${valEff}%`, padLeft + plotW + 8, y + 3);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#64748b';
      }
    }

    // Вертикальная сетка (Подача Q)
    const gridXCount = 6;
    ctx.textAlign = 'center';
    for (let i = 0; i <= gridXCount; i++) {
      const qVal = (maxQ / gridXCount) * i;
      const x = toX(qVal);

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
    ctx.fillText('Подача жидкости Q, м³/сут', padLeft + plotW / 2, padTop + plotH + 34);

    // Левая ось Y (Напор всех ступеней)
    ctx.save();
    ctx.translate(14, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Суммарный напор всей сборки H (${totalStages} ст.), м`, 0, 0);
    ctx.restore();

    // Правая ось Y
    if (viewMode === 'all' || viewMode === 'power_eff') {
      ctx.save();
      ctx.translate(w - 14, padTop + plotH / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('КПД насоса η (%) / Мощность (кВт)', 0, 0);
      ctx.restore();
    }

    // 2. Отрисовка семейства частот ЧРП (если включен режим)
    if (viewMode === 'frequency_family') {
      freqCurvesMap.forEach(({ freq, points }) => {
        const isCurrent = freq === frequency;
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

        // Подпись частоты в конце линии
        const lastPt = points[points.length - 1];
        if (lastPt) {
          ctx.fillStyle = isCurrent ? '#38bdf8' : '#64748b';
          ctx.font = '9px monospace';
          ctx.fillText(`${freq} Гц`, toX(lastPt.q) + 14, toYHead(lastPt.hTotal));
        }
      });
    }

    // 3. Кривая требуемого напора системы (System Curve)
    if (viewMode === 'all' || viewMode === 'head') {
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
    if (viewMode === 'all' || viewMode === 'head') {
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

      // Освещенный градиент кривой для глубины
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Кривая мощности всей сборки P_shaft(Q)
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

    // 6. Кривая КПД всей сборки Eff(Q)
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

    // 7. Точка максимального КПД (BEP)
    const bepQ = pump.qNom * kF;
    const bepHead = result.hStageReal * totalStages; // приблизительно
    const bepX = toX(bepQ);
    const bepY = toYHead(bepHead);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(bepX, bepY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 8. Рабочая точка скважины (Operating Target Point)
    const opX = toX(well.qTarget);
    const opY = toYHead(fullStringHeadAtQ);

    // Пунктирные направляющие к осям
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(opX, padTop + plotH);
    ctx.lineTo(opX, opY);
    ctx.lineTo(padLeft, opY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Круг рабочей точки с пульсацией
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(opX, opY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Текстовая плашка рабочей точки
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    const tagText = `${well.qTarget} м³/сут · ${Math.round(fullStringHeadAtQ)} м`;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const tagW = ctx.measureText(tagText).width + 12;
    const tagX = Math.min(padLeft + plotW - tagW - 4, opX + 10);
    const tagY = Math.max(padTop + 14, opY - 14);

    ctx.fillRect(tagX, tagY - 12, tagW, 18);
    ctx.strokeRect(tagX, tagY - 12, tagW, 18);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(tagText, tagX + tagW / 2, tagY + 1);

    // 9. Отрисовка перекрестия при наведении курсора (Hover crosshair)
    if (hoverData) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      ctx.beginPath();
      ctx.moveTo(hoverData.x, padTop);
      ctx.lineTo(hoverData.x, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [result, well, completion, frequency, viewMode, hoverData]);

  // Обработка движения мыши для интерактивного перекрестия
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padLeft = 60;
    const padRight = 60;
    const padTop = 30;
    const padBottom = 45;
    const plotW = rect.width - padLeft - padRight;

    if (x < padLeft || x > padLeft + plotW || y < padTop || y > rect.height - padBottom) {
      setHoverData(null);
      return;
    }

    const relX = (x - padLeft) / plotW;
    const qHover = Math.max(0, Math.min(maxQ, relX * maxQ));

    // Находим ближайшую точку в кривых
    const closest = curves.reduce((prev, curr) =>
      Math.abs(curr.q - qHover) < Math.abs(prev.q - qHover) ? curr : prev
    );

    setHoverData({
      q: Math.round(closest.q),
      h: Math.round(closest.hTotal),
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
      {/* Верхняя инженерная панель графика */}
      <div className="bg-[#182130] px-4 py-3 border-b border-[#243044] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Характеристика всей сборки УЭЦН ({totalStages} ступеней · {numSections} секц.)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono border border-sky-800">
            Full String {frequency} Гц
          </span>
        </div>

        {/* Переключатель вкладок графика */}
        <div className="flex items-center gap-1 bg-[#0e141f] p-1 rounded-lg border border-[#243044]">
          <button
            onClick={() => setChartViewMode('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Все кривые
          </button>
          <button
            onClick={() => setChartViewMode('head')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
              viewMode === 'head'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Напор H(Q)
          </button>
          <button
            onClick={() => setChartViewMode('power_eff')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
              viewMode === 'power_eff'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Мощность & КПД
          </button>
          <button
            onClick={() => setChartViewMode('frequency_family')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 ${
              viewMode === 'frequency_family'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Семейство ЧРП
          </button>
        </div>
      </div>

      {/* Полоса мгновенных параметров рабочей точки */}
      <div className="bg-[#0f1520] px-4 py-2 border-b border-[#1e2738] flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
            <span className="text-slate-400">Рабочая точка:</span>
            <span className="font-bold text-amber-300">{well.qTarget} м³/сут</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Напор установки:</span>
            <span className="font-bold text-sky-400">{Math.round(fullStringHeadAtQ)} м</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Мощность вала:</span>
            <span className="font-bold text-amber-400">{fullStringShaftPowerKW.toFixed(1)} кВт</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">КПД насоса:</span>
            <span className="font-bold text-emerald-400">{fullStringEfficiency.toFixed(1)}%</span>
          </div>
        </div>

        {/* Бейдж соответствия диапазону */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">ОДР ({pump.qMin * (frequency / 50)} - {pump.qMax * (frequency / 50)} м³/сут):</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              result.isWithinOperatingRange
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                : 'bg-rose-950 text-rose-300 border border-rose-700/60'
            }`}
          >
            {result.isWithinOperatingRange ? 'В ОДР (Оптимально)' : 'Вне ОДР (Опасно)'}
          </span>
        </div>
      </div>

      {/* Канвас с графиком */}
      <div ref={containerRef} className="relative flex-1 p-3 bg-[#0b0e14] min-h-[360px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Всплывающая подсказка при наведении курсора */}
        {hoverData && (
          <div
            style={{
              left: `${Math.min(hoverData.x + 12, (containerRef.current?.offsetWidth || 400) - 170)}px`,
              top: `${Math.max(10, hoverData.y - 70)}px`
            }}
            className="absolute pointer-events-none bg-[#141b27]/95 backdrop-blur-md border border-blue-500/50 rounded-lg p-2.5 shadow-2xl text-[11px] font-mono space-y-1 z-30"
          >
            <div className="text-slate-300 font-bold border-b border-[#243044] pb-1">
              Q = {hoverData.q} м³/сут
            </div>
            <div className="text-sky-400 flex items-center justify-between gap-3">
              <span>H(сборки):</span>
              <span className="font-bold">{hoverData.h} м</span>
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
      <div className="bg-[#182130] px-4 py-2 border-t border-[#243044] flex flex-wrap items-center justify-between text-[11px] text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-sky-400 rounded-full" />
            <span>H(Q) Напор сборки ({totalStages} ст.)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 border-dashed rounded-full" />
            <span>Кривая сети TDH(Q)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded-full" />
            <span>N(Q) Мощность вала</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full" />
            <span>η(Q) КПД насоса</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xs" />
            <span>Зона ОДР</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          Давление на закрытую задвижку: {Math.round(result.shutoffHead)} м (~{((result.shutoffHead * result.mixDensity * 9.81) / 101325).toFixed(1)} атм)
        </div>
      </div>
    </div>
  );
};
