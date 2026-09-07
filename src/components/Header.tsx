import React from 'react';
import { PRESETS, WellPreset } from '../data/presets';
import { WellParameters, CalculationResult } from '../types/esp';
import { Gauge, FileText, Sparkles, SlidersHorizontal, HardDrive, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  well: WellParameters;
  activeResult: CalculationResult;
  onSelectPreset: (preset: WellPreset) => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  well,
  activeResult,
  onSelectPreset,
  onOpenReport
}) => {
  return (
    <header className="bg-[#111722] border-b border-[#243044] px-4 py-3 select-none">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Логотип и название комплекса */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 p-0.5 shadow-lg flex items-center justify-center">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                ESP EXPERT <span className="text-blue-400 font-mono text-xs font-bold">v10.4 PRO</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[9px] border border-blue-800">
                INDUSTRIAL CAD
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Комплексный инженерный расчет и подбор установок электроцентробежных насосов (УЭЦН)
            </p>
          </div>
        </div>

        {/* Быстрый выбор скважинного сценария (Пресеты) */}
        <div className="flex items-center gap-2 bg-[#0e141f] px-3 py-1.5 rounded-xl border border-[#243044]">
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-slate-300 font-medium">Сценарий:</span>
          <select
            onChange={(e) => {
              const p = PRESETS.find(pr => pr.id === e.target.value);
              if (p) onSelectPreset(p);
            }}
            className="bg-transparent text-xs font-mono text-blue-300 focus:outline-none cursor-pointer pr-2"
          >
            {PRESETS.map(p => (
              <option key={p.id} value={p.id} className="bg-[#141b27] text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Сводные индикаторы и кнопка техкарты */}
        <div className="flex items-center gap-3">
          {/* Индикатор выбранного типоразмера */}
          <div className="hidden lg:flex items-center gap-2 bg-[#0e141f] px-3 py-1.5 rounded-xl border border-[#243044] text-xs font-mono">
            <span className="text-slate-400">Сборка:</span>
            <span className="font-bold text-sky-400">{activeResult.pump.name}</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-bold">{activeResult.totalStages} ст.</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">{Math.round(activeResult.fullStringHeadAtQ)} м</span>
          </div>

          {/* Кнопка отчета / техкарты */}
          <button
            onClick={onOpenReport}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Техкарта УЭЦН</span>
          </button>
        </div>
      </div>
    </header>
  );
};
