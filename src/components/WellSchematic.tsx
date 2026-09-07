import React, { useState } from 'react';
import { CalculationResult, WellParameters, CompletionGeometry } from '../types/esp';
import { ZoomIn, ZoomOut, Info, ShieldAlert, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

interface WellSchematicProps {
  result: CalculationResult;
  well: WellParameters;
  completion: CompletionGeometry;
}

export const WellSchematic: React.FC<WellSchematicProps> = ({ result, well, completion }) => {
  const [viewMode, setViewMode] = useState<'profile' | 'detail'>('profile');
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const { pump, motor, totalStages, numSections } = result;

  // Расчет относительных координат для схемы скважины
  // Общая глубина отображения (до забоя с запасом)
  const maxDepth = Math.max(well.depthWell, well.perfBottom + 80, well.depthPump + 120);

  // Функция перевода глубины в метрах в пиксели SVG
  const svgHeight = 620;
  const svgWidth = 280;
  const topOffset = 45;
  const bottomOffset = 35;
  const drawableHeight = svgHeight - topOffset - bottomOffset;

  const depthToY = (depthM: number) => {
    return topOffset + (Math.max(0, Math.min(maxDepth, depthM)) / maxDepth) * drawableHeight;
  };

  // Вычисляемые координаты
  const yWellhead = topOffset;
  const yConductor = depthToY(completion.conductorDepth);
  const yStaticLevel = depthToY(well.hStatic);
  const yDynamicLevel = depthToY(well.hDynamic);
  const yPumpIntake = depthToY(well.depthPump);
  const yCheckValve = depthToY(Math.max(10, well.depthPump - 25)); // 25м выше насоса
  const yMotorBottom = depthToY(well.depthPump + result.totalStringLength);
  const yPerfTop = depthToY(well.perfTop);
  const yPerfBottom = depthToY(well.perfBottom);
  const yCasingShoe = depthToY(completion.casingShoeDepth);
  const yTotalDepth = depthToY(well.depthWell);

  // Координаты по ширине
  const centerX = 120;
  const casingHalfW = 34;
  const conductorHalfW = 44;
  const tubingHalfW = 9;

  // Цвет статуса охлаждения мотора
  const coolingColor =
    result.coolingStatus === 'OPTIMAL' ? '#10b981' :
    result.coolingStatus === 'ACCEPTABLE' ? '#3b82f6' :
    result.coolingStatus === 'WARNING' ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-[#131924] border border-[#243044] rounded-xl overflow-hidden flex flex-col h-full shadow-xl">
      {/* Заголовок и переключатель видов */}
      <div className="bg-[#182130] px-4 py-3 border-b border-[#243044] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Конструкция скважины
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono border border-blue-700/50">
            {well.wellName}
          </span>
        </div>

        {/* Переключатель вида */}
        <div className="flex items-center bg-[#0e141f] p-0.5 rounded-lg border border-[#243044]">
          <button
            onClick={() => setViewMode('profile')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              viewMode === 'profile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ствол скважины
          </button>
          <button
            onClick={() => setViewMode('detail')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              viewMode === 'detail'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Компоновка УЭЦН
          </button>
        </div>
      </div>

      {/* Основная область схемы */}
      <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto">
        {viewMode === 'profile' ? (
          <div className="relative flex justify-center items-center">
            {/* SVG Чертеж скважины */}
            <svg
              className="w-full max-w-[340px] h-[580px] bg-[#0b0e14] rounded-lg border border-[#1e2738]"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            >
              <defs>
                {/* Штриховка цементного кольца */}
                <pattern id="cementHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#374151" strokeWidth="1" />
                </pattern>
                {/* Перфорационный градиент */}
                <linearGradient id="fluidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.65" />
                </linearGradient>
                {/* Градиент металла НКТ */}
                <linearGradient id="tubingGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>

              {/* Фоновая масштабная сетка глубин */}
              {[500, 1000, 1500, 2000, 2500].map(depth => {
                if (depth > maxDepth) return null;
                const y = depthToY(depth);
                return (
                  <g key={depth} opacity="0.25">
                    <line x1="15" y1={y} x2={svgWidth - 15} y2={y} stroke="#475569" strokeDasharray="2,3" />
                    <text x="20" y={y - 2} fill="#64748b" fontSize="8" fontFamily="monospace">
                      {depth} м
                    </text>
                  </g>
                );
              })}

              {/* Устьевая арматура (АФК) */}
              <g transform={`translate(${centerX}, ${yWellhead - 26})`}>
                <rect x="-36" y="0" width="72" height="12" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="2" />
                <rect x="-14" y="-12" width="28" height="12" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                {/* Лубрикаторная задвижка */}
                <circle cx="0" cy="-15" r="4" fill="#0284c7" />
                {/* Боковые выкидные линии устья */}
                <line x1="-36" y1="6" x2="-52" y2="6" stroke="#64748b" strokeWidth="3" />
                <line x1="36" y1="6" x2="52" y2="6" stroke="#64748b" strokeWidth="3" />
                <text x="0" y="24" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                  Устье (0 м)
                </text>
              </g>

              {/* Кондуктор */}
              <rect
                x={centerX - conductorHalfW}
                y={yWellhead}
                width={conductorHalfW * 2}
                height={yConductor - yWellhead}
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
              <text x={centerX - conductorHalfW - 4} y={yConductor - 4} textAnchor="end" fill="#64748b" fontSize="7.5">
                Кондуктор {completion.conductorDepth} м
              </text>

              {/* Цементное кольцо за эксплуатационной колонной */}
              <rect
                x={centerX - casingHalfW - 8}
                y={yWellhead}
                width={8}
                height={yCasingShoe - yWellhead}
                fill="url(#cementHatch)"
              />
              <rect
                x={centerX + casingHalfW}
                y={yWellhead}
                width={8}
                height={yCasingShoe - yWellhead}
                fill="url(#cementHatch)"
              />

              {/* Эксплуатационная колонна */}
              <rect
                x={centerX - casingHalfW}
                y={yWellhead}
                width={casingHalfW * 2}
                height={yCasingShoe - yWellhead}
                fill="#0f172a"
                stroke="#64748b"
                strokeWidth="2"
              />

              {/* Столб жидкости от динамического уровня до забоя */}
              <rect
                x={centerX - casingHalfW + 1}
                y={yDynamicLevel}
                width={casingHalfW * 2 - 2}
                height={yTotalDepth - yDynamicLevel}
                fill="url(#fluidGradient)"
              />

              {/* Статический уровень жидкости (пунктир) */}
              <line
                x1={centerX - casingHalfW}
                y1={yStaticLevel}
                x2={centerX + casingHalfW}
                y2={yStaticLevel}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <text x={centerX + casingHalfW + 6} y={yStaticLevel + 3} fill="#38bdf8" fontSize="8" fontFamily="monospace">
                Hстат: {well.hStatic} м
              </text>

              {/* Динамический уровень жидкости (сплошной маркер и волна) */}
              <line
                x1={centerX - casingHalfW}
                y1={yDynamicLevel}
                x2={centerX + casingHalfW}
                y2={yDynamicLevel}
                stroke="#0284c7"
                strokeWidth="2.5"
              />
              <text x={centerX + casingHalfW + 6} y={yDynamicLevel + 3} fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                Hдин: {well.hDynamic} м
              </text>

              {/* Колонна НКТ */}
              <rect
                x={centerX - tubingHalfW}
                y={yWellhead}
                width={tubingHalfW * 2}
                height={yPumpIntake - yWellhead}
                fill="url(#tubingGrad)"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Муфтовые соединения НКТ */}
              {Array.from({ length: 9 }).map((_, i) => {
                const y = yWellhead + ((yPumpIntake - yWellhead) / 10) * (i + 1);
                return (
                  <rect
                    key={i}
                    x={centerX - tubingHalfW - 1.5}
                    y={y - 2}
                    width={tubingHalfW * 2 + 3}
                    height="4"
                    fill="#64748b"
                    rx="0.5"
                  />
                );
              })}

              {/* Обратный и сливной клапаны (КО/КС) */}
              <g transform={`translate(${centerX}, ${yCheckValve})`}>
                <rect x={-tubingHalfW - 2} y="-6" width={tubingHalfW * 2 + 4} height="12" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" rx="1" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold">КО/КС</text>
              </g>

              {/* Силовой бронированный кабель вдоль НКТ */}
              <path
                d={`M ${centerX + tubingHalfW + 3} ${yWellhead} L ${centerX + tubingHalfW + 3} ${yPumpIntake + 20}`}
                stroke="#e11d48"
                strokeWidth="2.2"
                strokeDasharray="8,2"
              />
              {/* Пояски крепления кабеля (клямсы) */}
              {Array.from({ length: 6 }).map((_, i) => {
                const y = yWellhead + ((yPumpIntake - yWellhead) / 7) * (i + 1);
                return (
                  <circle
                    key={i}
                    cx={centerX + tubingHalfW + 3}
                    cy={y}
                    r="2"
                    fill="#f59e0b"
                  />
                );
              })}

              {/* Компоновка УЭЦН в стволе скважины */}
              <g id="esp-string-group">
                {/* 1. Насосная часть (ЭЦН) */}
                <rect
                  x={centerX - 13}
                  y={yPumpIntake - 22}
                  width="26"
                  height="22"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  rx="2"
                />
                <text x={centerX} y={yPumpIntake - 8} textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                  ЭЦН ({totalStages} ст.)
                </text>

                {/* 2. Приемный модуль / Газосепаратор */}
                <rect
                  x={centerX - 12}
                  y={yPumpIntake}
                  width="24"
                  height="10"
                  fill="#d97706"
                  stroke="#fbbf24"
                  strokeWidth="1"
                  rx="1"
                />
                {/* Сетка заборных отверстий */}
                <line x1={centerX - 8} y1={yPumpIntake + 5} x2={centerX + 8} y2={yPumpIntake + 5} stroke="#1e293b" strokeWidth="2" strokeDasharray="2,2" />

                {/* 3. Гидрозащита (Протектор) */}
                <rect
                  x={centerX - 11}
                  y={yPumpIntake + 10}
                  width="22"
                  height="12"
                  fill="#475569"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />

                {/* 4. Погружной электродвигатель (ПЭД) */}
                <rect
                  x={centerX - 13}
                  y={yPumpIntake + 22}
                  width="26"
                  height="34"
                  fill={coolingColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  rx="2"
                />
                <text x={centerX} y={yPumpIntake + 42} textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">
                  ПЭД {motor.powerRatingKW} кВт
                </text>

                {/* 5. Блок телеметрии ТМС */}
                <rect
                  x={centerX - 9}
                  y={yPumpIntake + 56}
                  width="18"
                  height="8"
                  fill="#7c3aed"
                  stroke="#a78bfa"
                  strokeWidth="1"
                  rx="1"
                />
                <text x={centerX} y={yPumpIntake + 63} textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="bold">
                  ТМС
                </text>
              </g>

              {/* Выноска приема УЭЦН */}
              <line x1={centerX + 16} y1={yPumpIntake + 5} x2={centerX + casingHalfW + 10} y2={yPumpIntake + 5} stroke="#f59e0b" strokeWidth="1" />
              <text x={centerX + casingHalfW + 12} y={yPumpIntake + 8} fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                Прием: {well.depthPump} м
              </text>

              {/* Интервал перфорации пласта */}
              <g>
                {/* Отверстия перфорации в стенке колонны */}
                {Array.from({ length: 7 }).map((_, i) => {
                  const y = yPerfTop + ((yPerfBottom - yPerfTop) / 8) * (i + 1);
                  return (
                    <g key={i}>
                      {/* Левая сторона */}
                      <circle cx={centerX - casingHalfW} cy={y} r="2" fill="#ef4444" />
                      <line x1={centerX - casingHalfW - 6} y1={y} x2={centerX - casingHalfW} y2={y} stroke="#ef4444" strokeWidth="1.5" />
                      {/* Правая сторона */}
                      <circle cx={centerX + casingHalfW} cy={y} r="2" fill="#ef4444" />
                      <line x1={centerX + casingHalfW} y1={y} x2={centerX + casingHalfW + 6} y2={y} stroke="#ef4444" strokeWidth="1.5" />
                      {/* Стрелки притока флюида */}
                      <polygon points={`${centerX - casingHalfW + 4},${y} ${centerX - casingHalfW + 1},${y - 2} ${centerX - casingHalfW + 1},${y + 2}`} fill="#38bdf8" />
                      <polygon points={`${centerX + casingHalfW - 4},${y} ${centerX + casingHalfW - 1},${y - 2} ${centerX + casingHalfW - 1},${y + 2}`} fill="#38bdf8" />
                    </g>
                  );
                })}

                {/* Выноска пласта */}
                <rect x={centerX - casingHalfW - 65} y={yPerfTop - 2} width="58" height="14" fill="#1e293b" stroke="#ef4444" strokeWidth="0.8" rx="2" />
                <text x={centerX - casingHalfW - 36} y={yPerfTop + 8} textAnchor="middle" fill="#fca5a5" fontSize="7" fontWeight="bold">
                  Пласт ({well.perfTop}-{well.perfBottom}м)
                </text>
              </g>

              {/* Искусственный забой скважины */}
              <g transform={`translate(${centerX}, ${yTotalDepth})`}>
                <line x1={-casingHalfW} y1="0" x2={casingHalfW} y2="0" stroke="#ef4444" strokeWidth="3" />
                {/* Штриховка зумпфа */}
                <line x1="-20" y1="4" x2="20" y2="4" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,3" />
                <line x1="-12" y1="8" x2="12" y2="8" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="0" y="18" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  Забой {well.depthWell} м
                </text>
              </g>
            </svg>

            {/* Легенда и информационный блок охлаждения прямо на схеме */}
            <div className="absolute top-2 right-2 bg-[#0e141f]/90 backdrop-blur-sm border border-[#243044] rounded-lg p-2.5 max-w-[155px] text-[10px] space-y-1.5 shadow-lg">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#243044] pb-1">
                Охлаждение мотора
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">V потока:</span>
                <span className={`font-bold ${result.coolingStatus === 'OPTIMAL' || result.coolingStatus === 'ACCEPTABLE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.coolingVelocityMs.toFixed(2)} м/с
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Норматив:</span>
                <span className="text-slate-300">≥ 0.10 м/с</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Шрауд:</span>
                <span className={`font-bold ${result.shroudRequired ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {result.shroudRequired ? 'Требуется' : 'Не нужен'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Крупный инженерный план сборки УЭЦН */
          <div className="bg-[#0b0e14] border border-[#1e2738] rounded-lg p-4 space-y-4">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
              <span>Спецификация секций компоновки УЭЦН</span>
              <span className="text-[10px] font-mono text-slate-400">Длина установки: {result.totalStringLength.toFixed(1)} м</span>
            </div>

            {/* Интерактивная схема узлов в разрезе */}
            <div className="space-y-2">
              {/* 1. Ловильная головка и переводник */}
              <div
                onMouseEnter={() => setHoveredPart('head')}
                onMouseLeave={() => setHoveredPart(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredPart === 'head' ? 'border-blue-500 bg-blue-950/40' : 'border-[#243044] bg-[#141b27]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="font-bold text-slate-200">Ловильная головка + Переводник НКТ</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">L ≈ 0.6 м · 35 кг</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 pl-4.5">
                  Муфтовое соединение с НКТ {completion.tubingOuterDiam} мм, встроенная ловильная шейка.
                </div>
              </div>

              {/* 2. Секции насоса ЭЦН */}
              <div
                onMouseEnter={() => setHoveredPart('pump')}
                onMouseLeave={() => setHoveredPart(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredPart === 'pump' ? 'border-blue-500 bg-blue-950/40' : 'border-blue-900/60 bg-[#0f233a]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-bold text-blue-200">{pump.name} ({totalStages} ступеней)</span>
                  </div>
                  <span className="font-mono text-[11px] text-blue-300 font-bold">
                    {numSections} {numSections === 1 ? 'секция' : numSections < 5 ? 'секции' : 'секций'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 pl-4.5 space-y-0.5">
                  <div>Габарит: {pump.outerDiam} мм · Длина секций: {result.totalPumpLength.toFixed(1)} м</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Ступени по секциям: {result.stagesPerSection.join(' + ')} ст.
                  </div>
                </div>
              </div>

              {/* 3. Газосепаратор или входной модуль */}
              <div
                onMouseEnter={() => setHoveredPart('sep')}
                onMouseLeave={() => setHoveredPart(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredPart === 'sep' ? 'border-amber-500 bg-amber-950/40' : 'border-amber-900/50 bg-[#241a0e]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-amber-200">
                      {result.gasSeparatorRequired ? result.gasSeparatorType : 'Входной модуль (ВМ)'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-amber-400">
                    Газ: {result.freeGasIntakeFraction.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 pl-4.5">
                  {result.gasSeparatorRequired
                    ? `Эффективность сепарации до 90%. Защита ступеней ЭЦН от кавитации.`
                    : `Прямой прием пластовой жидкости через фильтрующую сетку.`}
                </div>
              </div>

              {/* 4. Протектор (Гидрозащита) */}
              <div
                onMouseEnter={() => setHoveredPart('protector')}
                onMouseLeave={() => setHoveredPart(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredPart === 'protector' ? 'border-slate-400 bg-slate-800/40' : 'border-[#243044] bg-[#141b27]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="font-bold text-slate-200">Гидрозащита (Протектор) 2П92Д</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">L = 1.8 м · 75 кг</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 pl-4.5">
                  Компенсация теплового расширения масла ПЭД, разгрузка осевой нагрузки вала.
                </div>
              </div>

              {/* 5. Погружной электродвигатель (ПЭД) */}
              <div
                onMouseEnter={() => setHoveredPart('motor')}
                onMouseLeave={() => setHoveredPart(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredPart === 'motor' ? 'border-emerald-500 bg-emerald-950/40' : 'border-emerald-900/60 bg-[#0f241c]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-200">{motor.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 font-bold">
                    {motor.powerRatingKW} кВт ({result.motorLoadPercent.toFixed(0)}% загр.)
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 pl-4.5 space-y-0.5">
                  <div>Uном = {motor.voltageV} В · Iном = {motor.currentA} А · d = {motor.outerDiam} мм</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Длина: {motor.lengthM} м · Масса: {motor.massKg} кг
                  </div>
                </div>
              </div>

              {/* 6. Термоманометрическая система (ТМС) */}
              <div
                onMouseEnter={() => setHoveredPart('tms')}
                onMouseLeave={() => setHoveredPart(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredPart === 'tms' ? 'border-purple-500 bg-purple-950/40' : 'border-purple-900/50 bg-[#1c132b]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="font-bold text-purple-200">Блок телеметрии ТМСН-3</span>
                  </div>
                  <span className="font-mono text-[11px] text-purple-300 font-bold">P, T, Vyb, Rиз</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 pl-4.5">
                  Онлайн контроль давления на приеме ({result.intakePressureAtm.toFixed(1)} атм), температуры обмоток ПЭД и вибрации.
                </div>
              </div>
            </div>

            {/* Итоговая полоса массы и габаритов */}
            <div className="bg-[#141d2b] p-3 rounded-lg border border-[#243044] flex items-center justify-between text-xs">
              <span className="text-slate-400">Общая масса компоновки:</span>
              <span className="font-mono font-bold text-slate-100">{Math.round(result.totalWeightKg)} кг (~{(result.totalWeightKg / 1000).toFixed(2)} т)</span>
            </div>
          </div>
        )}

        {/* Нижняя панель ключевых отметок глубин */}
        <div className="mt-3 pt-3 border-t border-[#243044] grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="bg-[#0b0e14] p-1.5 rounded border border-[#1e2738]">
            <div className="text-slate-400">Дин. уровень</div>
            <div className="font-mono font-bold text-sky-400 text-[11px]">{well.hDynamic} м</div>
          </div>
          <div className="bg-[#0b0e14] p-1.5 rounded border border-[#1e2738]">
            <div className="text-slate-400">Спуск УЭЦН</div>
            <div className="font-mono font-bold text-amber-400 text-[11px]">{well.depthPump} м</div>
          </div>
          <div className="bg-[#0b0e14] p-1.5 rounded border border-[#1e2738]">
            <div className="text-slate-400">Погружение</div>
            <div className="font-mono font-bold text-emerald-400 text-[11px]">{result.submergenceMeters} м</div>
          </div>
        </div>
      </div>
    </div>
  );
};
