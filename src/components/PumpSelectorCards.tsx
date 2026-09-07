import React from 'react';
import { CalculationResult, PumpModel } from '../types/esp';
import { Check, AlertTriangle, ShieldCheck, Cpu, Droplets, ArrowUpRight } from 'lucide-react';

interface PumpSelectorCardsProps {
  candidates: CalculationResult[];
  selectedPumpId: string;
  onSelectPump: (id: string) => void;
  targetQ: number;
}

export const PumpSelectorCards: React.FC<PumpSelectorCardsProps> = ({
  candidates,
  selectedPumpId,
  onSelectPump,
  targetQ
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Рейтинг подходящих типоразмеров УЭЦН</span>
          <span className="text-[10px] text-slate-400 font-normal">({candidates.length} вариантов)</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Сортировка: Индекс соответствия (Match Index)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {candidates.map((res) => {
          const isSelected = res.pump.id === selectedPumpId;
          const { pump, motor, totalStages, numSections, matchScore, coolingStatus } = res;

          return (
            <div
              key={pump.id}
              onClick={() => onSelectPump(pump.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-[#162234] shadow-lg ring-1 ring-blue-500/50'
                  : 'border-[#243044] bg-[#131924] hover:border-[#384860] hover:bg-[#182130]'
              }`}
            >
              {/* Верхняя строка карточки */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{pump.name}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">
                          АКТИВЕН
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Габарит {pump.series} ({pump.outerDiam} мм) · {pump.manufacturer}
                    </div>
                  </div>

                  {/* Индекс соответствия */}
                  <div className="text-right">
                    <div
                      className={`font-mono text-base font-extrabold ${
                        matchScore >= 80 ? 'text-emerald-400' : matchScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {matchScore}%
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">Совпадение</div>
                  </div>
                </div>

                {/* Сетка ключевых технических параметров сборки */}
                <div className="grid grid-cols-2 gap-2 my-2.5 text-xs font-mono">
                  <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                    <div className="text-[9px] uppercase text-slate-400">Сборка ступеней</div>
                    <div className="font-bold text-sky-400 text-sm">
                      {totalStages} <span className="text-[10px] text-slate-400 font-normal">({numSections} секц.)</span>
                    </div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                    <div className="text-[9px] uppercase text-slate-400">Напор всей сборки</div>
                    <div className="font-bold text-slate-200 text-sm">
                      {Math.round(res.fullStringHeadAtQ)} <span className="text-[10px] text-slate-400 font-normal">м</span>
                    </div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                    <div className="text-[9px] uppercase text-slate-400">Мощность вала</div>
                    <div className="font-bold text-amber-400 text-sm">
                      {res.fullStringShaftPowerKW.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">кВт</span>
                    </div>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                    <div className="text-[9px] uppercase text-slate-400">КПД насоса</div>
                    <div className="font-bold text-emerald-400 text-sm">
                      {res.fullStringEfficiency.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Нижняя информационная полоска: Мотор + Охлаждение */}
              <div className="pt-2 border-t border-[#1e2738] flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span className="truncate max-w-[120px]">{motor.name}</span>
                  <span className="font-mono text-slate-400">({res.motorLoadPercent.toFixed(0)}%)</span>
                </div>

                {/* Статус охлаждения */}
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      coolingStatus === 'OPTIMAL' ? 'bg-emerald-500' :
                      coolingStatus === 'ACCEPTABLE' ? 'bg-blue-500' :
                      coolingStatus === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                  <span
                    className={`font-mono font-medium ${
                      coolingStatus === 'OPTIMAL' ? 'text-emerald-400' :
                      coolingStatus === 'ACCEPTABLE' ? 'text-blue-400' :
                      coolingStatus === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {res.coolingVelocityMs.toFixed(2)} м/с
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
