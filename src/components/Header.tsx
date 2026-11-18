import React, { useRef } from 'react';
import { PRESETS, WellPreset } from '../data/presets';
import { CalculationResult, ApplicationMode, SavedWellScenario } from '../types/esp';
import {
  Gauge,
  FileText,
  HardDrive,
  Layers,
  Wrench,
  Radio,
  Save,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface HeaderProps {
  activeResult: CalculationResult;
  appMode: ApplicationMode;
  activeScenarioId: string;
  savedWells: SavedWellScenario[];
  statusMessage?: { text: string; type: 'ok' | 'err' } | null;
  onChangeAppMode: (mode: ApplicationMode) => void;
  onSelectPreset: (preset: WellPreset) => void;
  onSelectSavedWell: (scenario: SavedWellScenario) => void;
  onSaveCurrentWell: () => void;
  onDeleteSavedWell: (id: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onOpenReport: () => void;
  onOpenCatalog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeResult,
  appMode,
  activeScenarioId,
  savedWells,
  statusMessage,
  onChangeAppMode,
  onSelectPreset,
  onSelectSavedWell,
  onSaveCurrentWell,
  onDeleteSavedWell,
  onExportJson,
  onImportJson,
  onOpenReport,
  onOpenCatalog
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSavedScenarioActive = savedWells.some(s => s.id === activeScenarioId);

  const handleScenarioChange = (val: string) => {
    const preset = PRESETS.find(pr => pr.id === val);
    if (preset) {
      onSelectPreset(preset);
      return;
    }
    const saved = savedWells.find(s => s.id === val);
    if (saved) {
      onSelectSavedWell(saved);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
    }
    e.target.value = '';
  };

  return (
    <header className="no-print bg-[#111722] border-b border-[#243044] px-4 py-3 select-none">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Логотип и название комплекса */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight whitespace-nowrap">
                ESP EXPERT <span className="text-blue-400 font-mono text-xs font-bold">v10.4 PRO</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[9px] border border-blue-800 whitespace-nowrap">
                INDUSTRIAL CAD
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[9px] border border-emerald-800 whitespace-nowrap">
                НОВЫЕ ТЕХНОЛОГИИ · 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Комплексный инженерный расчет и подбор установок электроцентробежных насосов (УЭЦН)
            </p>
          </div>
        </div>

        {/* Переключатель режимов: Подбор (CAD) <-> Эксплуатация (ЧРП) */}
        <div className="flex items-center p-1 bg-[#0b0f17] border border-[#243044] rounded-2xl shadow-inner">
          <button
            onClick={() => onChangeAppMode('sizing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              appMode === 'sizing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c28]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Подбор УЭЦН (CAD)</span>
          </button>

          <button
            onClick={() => onChangeAppMode('operation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all relative whitespace-nowrap ${
              appMode === 'operation'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c28]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Режим эксплуатации (ЧРП)</span>
            {appMode !== 'operation' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Выбор сценария + Мои скважины + JSON экспорт/импорт */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-2 bg-[#0e141f] px-2.5 py-1.5 rounded-xl border border-[#243044]">
            <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium hidden md:inline">Скважина:</span>
            <select
              value={activeScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-transparent text-xs font-mono text-blue-300 focus:outline-none cursor-pointer pr-1 max-w-[210px]"
            >
              {activeScenarioId === '__imported__' && (
                <option value="__imported__" className="bg-[#141b27] text-amber-300">
                  Импортированный проект
                </option>
              )}
              <optgroup label="Типовые сценарии" className="bg-[#141b27] text-slate-400">
                {PRESETS.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#141b27] text-white">
                    {p.name}
                  </option>
                ))}
              </optgroup>
              {savedWells.length > 0 && (
                <optgroup label="Мои скважины (локально)" className="bg-[#141b27] text-emerald-400">
                  {savedWells.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#141b27] text-emerald-300">
                      ★ {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <button
            onClick={onSaveCurrentWell}
            title={isSavedScenarioActive ? 'Обновить сохранённую скважину' : 'Сохранить текущую скважину в «Мои скважины»'}
            className="px-2.5 py-1.5 bg-[#151d2b] hover:bg-emerald-950/70 text-emerald-300 border border-emerald-700/40 hover:border-emerald-500/60 text-xs font-medium rounded-xl flex items-center gap-1 transition-all whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{isSavedScenarioActive ? 'Обновить' : 'Сохранить'}</span>
          </button>

          {isSavedScenarioActive && (
            <button
              onClick={() => onDeleteSavedWell(activeScenarioId)}
              title="Удалить выбранную сохранённую скважину"
              className="px-2 py-1.5 bg-[#151d2b] hover:bg-red-950/70 text-red-400 border border-red-800/40 hover:border-red-500/60 text-xs rounded-xl flex items-center transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onExportJson}
            title="Скачать проект скважины в JSON"
            className="px-2 py-1.5 bg-[#151d2b] hover:bg-[#1e293d] text-slate-300 border border-[#243044] text-[11px] font-mono rounded-xl flex items-center gap-1 transition-all whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Загрузить проект скважины из JSON"
            className="px-2 py-1.5 bg-[#151d2b] hover:bg-[#1e293d] text-slate-300 border border-[#243044] text-[11px] font-mono rounded-xl flex items-center gap-1 transition-all whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Импорт</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFilePick}
            className="hidden"
          />
        </div>

        {/* Сводные индикаторы и кнопки каталога / техкарты */}
        <div className="flex items-center gap-2.5">
          {statusMessage && (
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border whitespace-nowrap ${
                statusMessage.type === 'ok'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
                  : 'bg-red-950/90 text-red-300 border-red-700/60'
              }`}
            >
              {statusMessage.text}
            </span>
          )}

          {/* Индикатор выбранного типоразмера */}
          <div className="hidden 2xl:flex items-center gap-2 bg-[#0e141f] px-3 py-1.5 rounded-xl border border-[#243044] text-xs font-mono">
            <span className="text-slate-400">Сборка:</span>
            <span className="font-bold text-sky-400">{activeResult.pump.name}</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-bold">{activeResult.totalStages} ст.</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">{Math.round(activeResult.fullStringHeadAtQ)} м</span>
          </div>

          {/* Кнопка онлайн-каталога оборудования 2026 */}
          <button
            onClick={onOpenCatalog}
            className="px-3 py-1.5 bg-[#1a2332] hover:bg-[#243044] text-sky-300 border border-sky-500/30 hover:border-sky-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            title="Открыть полный каталог оборудования ООО «Новые Технологии» на 2026 год"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Каталог НТ · 2026</span>
          </button>

          {/* Кнопка отчета / техкарты */}
          <button
            onClick={onOpenReport}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Техкарта УЭЦН</span>
          </button>
        </div>
      </div>
    </header>
  );
};
