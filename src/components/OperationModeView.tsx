import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  PumpModel,
  CalculationResult,
  WellParameters,
  FluidProperties,
  CompletionGeometry,
  ElectricalParams,
  OperationParameters
} from '../types/esp';
import {
  calculateOperatingPoint,
  generateOperatingPointCurves,
  generateVFDRegulationCurves,
  estimateProductivityIndex
} from '../utils/calculations';
import {
  Zap,
  Gauge,
  Activity,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Droplets,
  Layers,
  Cpu,
  BarChart3,
  Flame,
  Radio
} from 'lucide-react';

interface OperationModeViewProps {
  pump: PumpModel;
  motor: CalculationResult['motor'];
  baseResult: CalculationResult;
  well: WellParameters;
  fluid: FluidProperties;
  completion: CompletionGeometry;
  electrical: ElectricalParams;
  onUpdateBaseFreq: (newFreq: number) => void;
}

export const OperationModeView: React.FC<OperationModeViewProps> = ({
  pump,
  motor,
  baseResult,
  well,
  fluid,
  completion,
  electrical,
  onUpdateBaseFreq
}) => {
  // Вычисляем базовый K_прод
  const initialKProd = useMemo(() => estimateProductivityIndex(well, fluid), [well, fluid]);

  // Состояние эксплуатационных параметров
  const [oper, setOper] = useState<OperationParameters>({
    fixedStages: baseResult.totalStages,
    operatingFrequency: electrical.frequency || 50,
    pBufOper: well.pBuf,
    pAnnularOper: well.pAnnular,
    chokeDiameterMm: 0, // 0 = без штуцера (полное открытие)
    productivityIndex: initialKProd,
    tmsBottomholeP: Math.round((well.pReservoir - (well.qTarget / initialKProd)) * 10) / 10,
    tmsMotorTempC: Math.min(130, well.tReservoir + 35),
    tmsVibrationXY: 0.8
  });

  // Вкладка графика
  const [chartTab, setChartTab] = useState<'nodal' | 'regulation'>('nodal');

  // Фактический расчет в режиме эксплуатации
  const opResult = useMemo(() => {
    return calculateOperatingPoint(
      pump,
      motor,
      well,
      fluid,
      completion,
      electrical,
      oper
    );
  }, [pump, motor, well, fluid, completion, electrical, oper]);

  // Кривые совместной работы (Nodal Analysis)
  const nodalCurves = useMemo(() => {
    const maxQPlot = Math.max(pump.qMax * (oper.operatingFrequency / 50) * 1.4, opResult.actualQ * 1.3, 120);
    return generateOperatingPointCurves(
      pump,
      well,
      fluid,
      completion,
      oper,
      maxQPlot
    );
  }, [pump, well, fluid, completion, oper, opResult.actualQ]);

  // Семейство частотного регулирования (Regulation Envelope)
  const regCurves = useMemo(() => {
    return generateVFDRegulationCurves(
      pump,
      motor,
      well,
      fluid,
      completion,
      electrical,
      oper
    );
  }, [pump, motor, well, fluid, completion, electrical, oper]);

  // Регулировка частоты
  const handleFreqChange = (newFreq: number) => {
    const clamped = Math.max(30, Math.min(70, Math.round(newFreq * 10) / 10));
    setOper(prev => ({ ...prev, operatingFrequency: clamped }));
    onUpdateBaseFreq(clamped);
  };

  // Синхронизация ступеней со сборкой
  const handleSyncStages = () => {
    setOper(prev => ({ ...prev, fixedStages: baseResult.totalStages }));
  };

  // Canvas рендеринг графиков
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    ctx.clearRect(0, 0, w, h);

    const padLeft = 60;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 40;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    if (chartTab === 'nodal') {
      // 1. График совместной работы Насос + Сеть
      const allQ = [...nodalCurves.pumpCurve.map(p => p.q), ...nodalCurves.systemCurve.map(p => p.q), opResult.actualQ];
      const allH = [...nodalCurves.pumpCurve.map(p => p.h), ...nodalCurves.systemCurve.map(p => p.h), opResult.actualHead];

      const maxQ = Math.max(80, Math.max(...allQ) * 1.1);
      const maxH = Math.max(400, Math.max(...allH) * 1.15);

      const toX = (q: number) => padLeft + (q / maxQ) * plotW;
      const toY = (head: number) => padTop + plotH - (head / maxH) * plotH;

      // Сетка
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padTop + (plotH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - padRight, y);
        ctx.stroke();

        const hVal = Math.round(maxH * (1 - i / 5));
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${hVal}`, padLeft - 8, y + 3);
      }

      for (let i = 0; i <= 5; i++) {
        const x = padLeft + (plotW / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();

        const qVal = Math.round((maxQ / 5) * i);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${qVal}`, x, padTop + plotH + 18);
      }

      // Зона ОДР
      const xOdrMin = toX(nodalCurves.odrMinQ);
      const xOdrMax = toX(nodalCurves.odrMaxQ);
      if (xOdrMax > xOdrMin) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fillRect(xOdrMin, padTop, xOdrMax - xOdrMin, plotH);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xOdrMin, padTop);
        ctx.lineTo(xOdrMin, padTop + plotH);
        ctx.moveTo(xOdrMax, padTop);
        ctx.lineTo(xOdrMax, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Кривая напора насоса H_pump(Q)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      nodalCurves.pumpCurve.forEach((pt, idx) => {
        const x = toX(pt.q);
        const y = toY(pt.h);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Кривая сети H_sys(Q)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      nodalCurves.systemCurve.forEach((pt, idx) => {
        const x = toX(pt.q);
        const y = toY(pt.h);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Рабочая точка (Intersection)
      if (opResult.actualQ > 0) {
        const ptX = toX(opResult.actualQ);
        const ptY = toY(opResult.actualHead);

        // Пунктиры к осям
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ptX, padTop + plotH);
        ctx.lineTo(ptX, ptY);
        ctx.lineTo(padLeft, ptY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Внешнее свечение
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(ptX, ptY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Точка
        ctx.fillStyle = opResult.isWithinODR ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(ptX, ptY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Подпись точки
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `Раб. точка: ${opResult.actualQ} м³/сут, ${opResult.actualHead} м`,
          Math.min(ptX + 12, w - 240),
          Math.max(ptY - 12, padTop + 20)
        );
      }
    } else {
      // 2. Диаграмма частотного регулирования Q(f) и Мощность(f)
      const minF = 35;
      const maxF = 65;
      const maxQ = Math.max(100, Math.max(...regCurves.map(r => r.q)) * 1.15);
      const maxPower = Math.max(50, motor.powerRatingKW * 1.3);

      const toX = (f: number) => padLeft + ((f - minF) / (maxF - minF)) * plotW;
      const toYQ = (q: number) => padTop + plotH - (q / maxQ) * plotH;
      const toYP = (p: number) => padTop + plotH - (p / maxPower) * plotH;

      // Сетка
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padTop + (plotH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - padRight, y);
        ctx.stroke();
      }

      for (let f = 35; f <= 65; f += 5) {
        const x = toX(f);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${f} Гц`, x, padTop + plotH + 18);
      }

      // Линия 100% мощности двигателя
      const yPMax = toYP(motor.powerRatingKW);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, yPMax);
      ctx.lineTo(w - padRight, yPMax);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`N_ном ПЭД (${motor.powerRatingKW} кВт)`, w - padRight - 5, yPMax - 4);

      // Кривая Дебита Q(f)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      regCurves.forEach((pt, idx) => {
        const x = toX(pt.freq);
        const y = toYQ(pt.q);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Кривая Мощности P(f)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      regCurves.forEach((pt, idx) => {
        const x = toX(pt.freq);
        const y = toYP(pt.powerKW);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Текущая рабочая частота вертикальная линия
      const curX = toX(oper.operatingFrequency);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curX, padTop);
      ctx.lineTo(curX, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${oper.operatingFrequency} Гц`, curX, padTop - 6);
    }
  }, [nodalCurves, regCurves, chartTab, opResult, oper.operatingFrequency, motor.powerRatingKW]);

  return (
    <div className="space-y-4">
      {/* Шапка режима эксплуатации */}
      <div className="bg-[#111722] border border-[#243044] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                СТАНЦИЯ УПРАВЛЕНИЯ ЧРП · РЕЖИМ ЭКСПЛУАТАЦИИ
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-[10px] font-bold">
                В РАБОТЕ (ONLINE)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Моделирование работы спущенной компоновки {pump.name} ({oper.fixedStages} ст.) со станцией частотного регулирования
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleFreqChange(50)}
            className="px-3 py-1.5 bg-[#182232] hover:bg-[#223046] border border-[#2e3e57] text-slate-200 text-xs font-mono font-medium rounded-xl flex items-center gap-1.5 transition-all"
            title="Сбросить частоту на номинальные 50.0 Гц"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>50.0 Гц (Номинал)</span>
          </button>

          <button
            onClick={handleSyncStages}
            className="px-3 py-1.5 bg-[#182232] hover:bg-[#223046] border border-[#2e3e57] text-slate-200 text-xs font-mono font-medium rounded-xl flex items-center gap-1.5 transition-all"
            title="Синхронизировать число ступеней с расчетным из режима подбора"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Синхр. ступеней ({baseResult.totalStages} ст.)</span>
          </button>
        </div>
      </div>

      {/* Основная рабочая сетка */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Левая колонка: Пульт управления ЧРП и устьевым штуцированием */}
        <div className="lg:col-span-4 space-y-4">
          {/* Пульт ЧРП */}
          <div className="bg-[#111722] border border-[#243044] rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#243044] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Регулятор частоты ЧРП
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                n ≈ {Math.round((oper.operatingFrequency / 50) * 2910)} об/мин
              </span>
            </div>

            {/* Цифровой LCD дисплей частоты */}
            <div className="bg-[#080c13] border border-[#1e293b] rounded-xl p-4 text-center relative overflow-hidden">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                Текущая выходная частота
              </div>
              <div className="text-4xl font-extrabold font-mono text-emerald-400 tracking-tight flex items-baseline justify-center gap-1">
                <span>{oper.operatingFrequency.toFixed(1)}</span>
                <span className="text-xl text-emerald-500/70 font-semibold">Гц</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Диапазон: 30.0 — 70.0 Гц | Шаг: 0.1 Гц
              </div>
            </div>

            {/* Ползунок регулятора частоты */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>30 Гц</span>
                <span className="text-emerald-400 font-bold">{oper.operatingFrequency.toFixed(1)} Гц</span>
                <span>70 Гц</span>
              </div>
              <input
                type="range"
                min="30"
                max="70"
                step="0.5"
                value={oper.operatingFrequency}
                onChange={(e) => handleFreqChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#1a2332] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Быстрые кнопки регулировки */}
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              <button
                onClick={() => handleFreqChange(oper.operatingFrequency - 5)}
                className="px-2 py-1.5 bg-[#182130] hover:bg-[#223046] text-slate-300 font-mono text-xs rounded-lg border border-[#2e3e57] active:scale-95 transition-all"
              >
                -5
              </button>
              <button
                onClick={() => handleFreqChange(oper.operatingFrequency - 1)}
                className="px-2 py-1.5 bg-[#182130] hover:bg-[#223046] text-slate-300 font-mono text-xs rounded-lg border border-[#2e3e57] active:scale-95 transition-all"
              >
                -1
              </button>
              <button
                onClick={() => handleFreqChange(oper.operatingFrequency - 0.5)}
                className="px-2 py-1.5 bg-[#182130] hover:bg-[#223046] text-slate-300 font-mono text-xs rounded-lg border border-[#2e3e57] active:scale-95 transition-all"
              >
                -0.5
              </button>
              <button
                onClick={() => handleFreqChange(oper.operatingFrequency + 0.5)}
                className="px-2 py-1.5 bg-[#182130] hover:bg-[#223046] text-slate-300 font-mono text-xs rounded-lg border border-[#2e3e57] active:scale-95 transition-all"
              >
                +0.5
              </button>
              <button
                onClick={() => handleFreqChange(oper.operatingFrequency + 1)}
                className="px-2 py-1.5 bg-[#182130] hover:bg-[#223046] text-slate-300 font-mono text-xs rounded-lg border border-[#2e3e57] active:scale-95 transition-all"
              >
                +1
              </button>
              <button
                onClick={() => handleFreqChange(oper.operatingFrequency + 5)}
                className="px-2 py-1.5 bg-[#182130] hover:bg-[#223046] text-slate-300 font-mono text-xs rounded-lg border border-[#2e3e57] active:scale-95 transition-all"
              >
                +5
              </button>
            </div>

            {/* Фиксированные частотные уставки */}
            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#243044]">
              {[40, 45, 50, 55, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFreqChange(f)}
                  className={`flex-1 py-1 text-[11px] font-mono rounded-md border transition-all ${
                    Math.abs(oper.operatingFrequency - f) < 0.2
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                      : 'bg-[#182232] text-slate-400 border-[#2e3e57] hover:text-slate-200'
                  }`}
                >
                  {f} Гц
                </button>
              ))}
            </div>
          </div>

          {/* Панель устьевого штуцирования и пласта */}
          <div className="bg-[#111722] border border-[#243044] rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#243044] pb-3">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Устье и скважинные условия
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Буферное давление P_буф */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Буферное давление (P_буф):</span>
                  <span className="font-mono font-bold text-sky-400">{oper.pBufOper} атм</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={oper.pBufOper}
                  onChange={(e) => setOper(prev => ({ ...prev, pBufOper: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-[#1a2332] rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* Затрубное давление P_затр */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Затрубное давление (P_затр):</span>
                  <span className="font-mono font-bold text-amber-400">{oper.pAnnularOper} атм</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={oper.pAnnularOper}
                  onChange={(e) => setOper(prev => ({ ...prev, pAnnularOper: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-[#1a2332] rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Устьевой штуцер */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-slate-400">Штуцер на устье:</span>
                <select
                  value={oper.chokeDiameterMm}
                  onChange={(e) => setOper(prev => ({ ...prev, chokeDiameterMm: parseFloat(e.target.value) }))}
                  className="bg-[#182232] border border-[#2e3e57] text-slate-200 font-mono px-2.5 py-1 rounded-lg text-xs focus:outline-none"
                >
                  <option value={0}>Свободный излив (без шт.)</option>
                  <option value={5}>Штуцер 5 мм</option>
                  <option value={6}>Штуцер 6 мм</option>
                  <option value={8}>Штуцер 8 мм</option>
                  <option value={10}>Штуцер 10 мм</option>
                  <option value={12}>Штуцер 12 мм</option>
                  <option value={14}>Штуцер 14 мм</option>
                </select>
              </div>

              {/* Смонтированное число ступеней Z */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#243044]">
                <span className="text-slate-400">Смонтировано ступеней (Z):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="20"
                    max="550"
                    value={oper.fixedStages}
                    onChange={(e) => setOper(prev => ({ ...prev, fixedStages: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-20 bg-[#182232] border border-[#2e3e57] text-sky-400 font-mono font-bold px-2 py-1 rounded-lg text-xs text-right focus:outline-none"
                  />
                  <span className="text-slate-400 text-xs">ст.</span>
                </div>
              </div>

              {/* Продуктивность пласта K_прод */}
              <div className="space-y-1 pt-1 border-t border-[#243044]">
                <div className="flex justify-between text-slate-300">
                  <span>Коэфф. продуктивности (K_прод):</span>
                  <span className="font-mono font-bold text-emerald-400">{oper.productivityIndex} м³/(сут·атм)</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="10.0"
                  step="0.1"
                  value={oper.productivityIndex}
                  onChange={(e) => setOper(prev => ({ ...prev, productivityIndex: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-[#1a2332] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Потенциал скважины:</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    ~{Math.round(oper.productivityIndex * well.pReservoir)} м³/сут
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Центральная и правая секция: График совместной работы и SCADA-панель параметров */}
        <div className="lg:col-span-8 space-y-4">
          {/* Главные показатели скважины в текущем режиме (Dashboard) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Карточка 1: Дебит */}
            <div className="bg-[#111722] border border-[#243044] rounded-xl p-3 shadow-lg relative overflow-hidden">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Фактический дебит</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                  {opResult.actualQ}
                </span>
                <span className="text-xs text-slate-400 font-mono">м³/сут</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`px-1.5 py-0.5 rounded font-bold ${
                  opResult.isWithinODR ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {opResult.isWithinODR ? 'В ОДР' : 'ВНЕ ОДР'}
                </span>
                <span className="text-slate-500">
                  {opResult.actualQ > baseResult.pump.qNom ? `+${(opResult.actualQ - baseResult.pump.qNom).toFixed(0)}` : (opResult.actualQ - baseResult.pump.qNom).toFixed(0)} м³
                </span>
              </div>
            </div>

            {/* Карточка 2: Напор */}
            <div className="bg-[#111722] border border-[#243044] rounded-xl p-3 shadow-lg">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Фактический напор</span>
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                  {opResult.actualHead}
                </span>
                <span className="text-xs text-slate-400 font-mono">м</span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-400">
                Р_закр: {opResult.shutoffHead} м
              </div>
            </div>

            {/* Карточка 3: Загрузка двигателя */}
            <div className="bg-[#111722] border border-[#243044] rounded-xl p-3 shadow-lg">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Загрузка ПЭД</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold font-mono tracking-tight ${
                  opResult.motorLoadStatus === 'OVERLOAD' ? 'text-rose-400' :
                  opResult.motorLoadStatus === 'ACCEPTABLE' ? 'text-amber-300' : 'text-emerald-400'
                }`}>
                  {opResult.motorLoadPct}%
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {motor.powerRatingKW} кВт</span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-400">
                Ток: <span className="font-bold text-slate-200">{opResult.motorCurrentA} А</span>
              </div>
            </div>

            {/* Карточка 4: Динамический уровень и прием */}
            <div className="bg-[#111722] border border-[#243044] rounded-xl p-3 shadow-lg">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Динуровень / Прием</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                  {opResult.actualHDynamic}
                </span>
                <span className="text-xs text-slate-400 font-mono">м</span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-400">
                P_прием: <span className="font-bold text-sky-400">{opResult.pIntakeAtm} атм</span>
              </div>
            </div>
          </div>

          {/* Инженерный график */}
          <div className="bg-[#111722] border border-[#243044] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-[#182130] px-4 py-2.5 border-b border-[#243044] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChartTab('nodal')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartTab === 'nodal'
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white bg-[#111722]'
                  }`}
                >
                  Кривые совместной работы (Nodal Analysis: H_насоса vs H_сети)
                </button>
                <button
                  onClick={() => setChartTab('regulation')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartTab === 'regulation'
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white bg-[#111722]'
                  }`}
                >
                  Диаграмма частотного регулирования Q(f) и N(f)
                </button>
              </div>

              <div className="text-xs font-mono text-slate-400">
                {chartTab === 'nodal'
                  ? `Частота: ${oper.operatingFrequency.toFixed(1)} Гц`
                  : `Диапазон: 35 — 65 Гц`}
              </div>
            </div>

            {/* Канвас графика */}
            <div className="h-[360px] bg-[#0b0e14] p-3 relative">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Легенда */}
            <div className="bg-[#141b27] px-4 py-2 border-t border-[#243044] flex flex-wrap items-center justify-between text-[11px] text-slate-300">
              {chartTab === 'nodal' ? (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-sky-400 rounded-full" />
                    <span>H_насоса (Q, {oper.operatingFrequency} Гц)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-rose-500 rounded-full" />
                    <span>H_сети скважины TDH(Q)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <span>Равновесная рабочая точка</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xs" />
                    <span>Зона ОДР ({nodalCurves.odrMinQ} - {nodalCurves.odrMaxQ} м³/сут)</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-sky-400 rounded-full" />
                    <span>Дебит Q(f), м³/сут</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-amber-400 rounded-full" />
                    <span>Мощность на валу N(f), кВт</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-rose-500 border-dashed rounded-full" />
                    <span>Предел ПЭД ({motor.powerRatingKW} кВт)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                    <span>Текущая частота ({oper.operatingFrequency} Гц)</span>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-500 font-mono">
                КПД в рабочей точке: {opResult.efficiencyPct}% | Удельный расход: {opResult.specificEnergyKWhM3} кВт·ч/м³
              </div>
            </div>
          </div>

          {/* Вспомогательные параметры и таблица регулирования */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ТМС телеметрия и охлаждение */}
            <div className="bg-[#111722] border border-[#243044] rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#243044] pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Телеметрия ТМС и охлаждение</h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">ТМС-01 ONLINE</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0e141f] p-2.5 rounded-xl border border-[#243044]">
                  <div className="text-slate-400 text-[10px]">Скорость охлаждения:</div>
                  <div className="text-slate-200 font-mono font-bold mt-0.5">
                    {opResult.coolingVelocityMs} м/с
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${
                    opResult.coolingStatus === 'OPTIMAL' ? 'text-emerald-400' :
                    opResult.coolingStatus === 'ACCEPTABLE' ? 'text-sky-400' : 'text-rose-400'
                  }`}>
                    {opResult.coolingStatus === 'OPTIMAL' ? 'В норме (>0.15 м/с)' :
                     opResult.coolingStatus === 'ACCEPTABLE' ? 'Допустимо' : 'Критично низкая!'}
                  </div>
                </div>

                <div className="bg-[#0e141f] p-2.5 rounded-xl border border-[#243044]">
                  <div className="text-slate-400 text-[10px]">Газ на приеме:</div>
                  <div className="text-slate-200 font-mono font-bold mt-0.5">
                    {opResult.freeGasIntakePct}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate" title={opResult.gasSeparatorStatus}>
                    {opResult.freeGasIntakePct > 20 ? 'Газосепаратор активен' : 'Без срыва подачи'}
                  </div>
                </div>

                <div className="bg-[#0e141f] p-2.5 rounded-xl border border-[#243044]">
                  <div className="text-slate-400 text-[10px]">Забойное давление:</div>
                  <div className="text-slate-200 font-mono font-bold mt-0.5">
                    {opResult.pBottomholeAtm} атм
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    P_пл: {well.pReservoir} атм
                  </div>
                </div>

                <div className="bg-[#0e141f] p-2.5 rounded-xl border border-[#243044]">
                  <div className="text-slate-400 text-[10px]">Погружение под уровень:</div>
                  <div className="text-slate-200 font-mono font-bold mt-0.5">
                    {opResult.submergenceM} м
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    H_спуск: {well.depthPump} м
                  </div>
                </div>
              </div>

              {/* Предупреждения */}
              {opResult.warnings.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Технологические предупреждения:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-100">
                    {opResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Таблица диапазона частотного регулирования */}
            <div className="bg-[#111722] border border-[#243044] rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#243044] pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Сводка регулирования ЧРП</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Шаг 5 Гц</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#243044] text-[10px] text-slate-400">
                      <th className="py-1">Частота</th>
                      <th className="py-1">Дебит</th>
                      <th className="py-1">Напор</th>
                      <th className="py-1">Мощность</th>
                      <th className="py-1">Загрузка</th>
                      <th className="py-1 text-center">ОДР</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b] text-[11px]">
                    {regCurves.filter(r => r.freq % 5 === 0).map((r) => {
                      const isCurrent = Math.abs(r.freq - oper.operatingFrequency) < 0.5;
                      return (
                        <tr
                          key={r.freq}
                          onClick={() => handleFreqChange(r.freq)}
                          className={`cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-blue-950/60 font-bold text-sky-300'
                              : 'hover:bg-[#182232] text-slate-300'
                          }`}
                        >
                          <td className="py-1.5 flex items-center gap-1">
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            <span>{r.freq} Гц</span>
                          </td>
                          <td className="py-1.5">{r.q} м³</td>
                          <td className="py-1.5">{r.head} м</td>
                          <td className="py-1.5">{r.powerKW} кВт</td>
                          <td className={`py-1.5 ${r.motorLoadPct > 100 ? 'text-rose-400 font-bold' : ''}`}>
                            {r.motorLoadPct}%
                          </td>
                          <td className="py-1.5 text-center">
                            {r.isWithinODR ? (
                              <span className="text-emerald-400">●</span>
                            ) : (
                              <span className="text-amber-400">▲</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-[#243044] pt-2 flex items-center justify-between">
                <span>Кликните на строку таблицы для быстрой уставки частоты</span>
                <span className="text-emerald-400">● В ОДР</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
