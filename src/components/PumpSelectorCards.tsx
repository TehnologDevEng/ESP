import React, { useState, useMemo } from 'react';
import { CalculationResult } from '../types/esp';
import { Cpu, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface PumpSelectorCardsProps {
  candidates: CalculationResult[];
  selectedPumpId: string;
  onSelectPump: (id: string) => void;
  targetQ: number;
}

export const PumpSelectorCards: React.FC<PumpSelectorCardsProps> = ({
  candidates,
  selectedPumpId,
  onSelectPump
}) => {
  const [gabFilter, setGabFilter] = useState<string>('all');
  const [matFilter, setMatFilter] = useState<string>('all');
  const [onlyCasingOk, setOnlyCasingOk] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((res) => {
      if (onlyCasingOk && (!res.isCasingCompatible || res.fullStringHeadAtQ <= 0) && res.pump.id !== selectedPumpId) return false;
      if (gabFilter !== 'all' && res.pump.gabLabel !== gabFilter) return false;
      if (matFilter !== 'all' && res.pump.material !== matFilter) return false;
      return true;
    });
  }, [candidates, onlyCasingOk, gabFilter, matFilter, selectedPumpId]);

  const visibleCandidates = useMemo(() => {
    if (showAll) return filteredCandidates;
    const top = filteredCandidates.slice(0, 6);
    if (!top.some(c => c.pump.id === selectedPumpId)) {
      const selected = filteredCandidates.find(c => c.pump.id === selectedPumpId);
      if (selected) return [selected, ...top.slice(0, 5)];
    }
    return top;
  }, [filteredCandidates, showAll, selectedPumpId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Рейтинг подходящих типоразмеров УЭЦН</span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({filteredCandidates.length} из {candidates.length})
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Сортировка: Индекс соответствия
        </div>
      </div>

      {/* Панель фильтров по габариту, материалу и колонне */}
      <div className="bg-[#111722] border border-[#243044] rounded-xl p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {(['all', '2A', '3', '5', '5A', '6', '7A'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGabFilter(g)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
                gabFilter === g
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-[#0b0e14] text-slate-400 hover:text-slate-200 border border-[#1e2738]'
              }`}
            >
              {g === 'all' ? 'Все габ.' : `Габ.${g}`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={matFilter}
            onChange={(e) => setMatFilter(e.target.value)}
            className="bg-[#0b0e14] border border-[#243044] rounded-md px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Все материалы</option>
            <option value="нирезист">Нирезист</option>
            <option value="ПКМ">ПКМ (Полимер)</option>
            <option value="винт">Винтовые</option>
          </select>

          <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer select-none bg-[#0b0e14] border border-[#243044] rounded-md px-2 py-1">
            <input
              type="checkbox"
              checked={onlyCasingOk}
              onChange={(e) => setOnlyCasingOk(e.target.checked)}
              className="accent-blue-500 rounded"
            />
            <span>Только подходящие</span>
          </label>
        </div>
      </div>

      {visibleCandidates.length === 0 ? (
        <div className="bg-[#131924] border border-[#243044] rounded-xl p-6 text-center text-xs text-slate-400">
          Нет насосов, удовлетворяющих выбранным фильтрам. Сбросьте фильтры или проверьте внутренний диаметр колонны.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleCandidates.map((res) => {
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">{pump.name}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">
                            АКТИВЕН
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Габ. {pump.gabLabel || pump.series} ({pump.outerDiam} мм) · {pump.material || 'нирезист'}
                      </div>
                    </div>

                    {/* Индекс соответствия */}
                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono tabular-nums text-base font-extrabold ${
                          matchScore >= 80 ? 'text-emerald-400' : matchScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {matchScore}%
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">Совпадение</div>
                    </div>
                  </div>

                  {/* Сетка ключевых технических параметров сборки */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 text-xs font-mono tabular-nums">
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
                      <div className={`font-bold text-sm ${res.shaftOverload ? 'text-rose-400' : 'text-amber-400'}`}>
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

                  {(res.fullStringHeadAtQ <= 0 || res.shaftOverload || !res.isCasingCompatible || res.motorThermalOverload) && (
                    <div className="mb-2 px-2 py-1 rounded bg-rose-950/60 border border-rose-800/70 text-[10px] text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {!res.isCasingCompatible
                          ? `Не проходит в колонну (${pump.outerDiam} мм)`
                          : res.fullStringHeadAtQ <= 0
                            ? `Срыв подачи (за границей H=0)`
                            : res.shaftOverload
                              ? `Перегруз вала (${res.shaftLoadPercent.toFixed(0)}%)`
                              : `Превышение Tmax ПЭД (${motor.tempMaxC ?? 130}°C)`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Нижняя информационная полоска: Мотор + Охлаждение */}
                <div className="pt-2 border-t border-[#1e2738] flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate max-w-[110px]">{motor.name}</span>
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
      )}

      {filteredCandidates.length > 6 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-1.5 bg-[#131924] hover:bg-[#182130] border border-[#243044] rounded-lg text-xs font-medium text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Свернуть до Топ-6 вариантов
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Показать все варианты ({filteredCandidates.length})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

