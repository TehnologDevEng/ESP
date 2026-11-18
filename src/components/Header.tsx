import React, { useRef, useState, useEffect } from 'react';
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
  Upload,
  FolderOpen,
  ChevronDown
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
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const isSavedScenarioActive = savedWells.some(s => s.id === activeScenarioId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProjectMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

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
    setIsProjectMenuOpen(false);
  };

  return (
    <header className="no-print bg-[#111722] border-b border-[#243044] px-4 py-2.5 select-none">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Бренд и название комплекса */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-white tracking-tight whitespace-nowrap">
                ESP EXPERT
              </h1>
              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                · Новые Технологии 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block whitespace-nowrap">
              Инженерный подбор и расчёт УЭЦН
            </p>
          </div>
        </div>

        {/* Переключатель режимов: Подбор (CAD) <-> Эксплуатация (ЧРП) */}
        <div className="flex items-center p-1 bg-[#0b0f17] border border-[#243044] rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onChangeAppMode('sizing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              appMode === 'sizing'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c28]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Подбор УЭЦН</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeAppMode('operation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              appMode === 'operation'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c28]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Эксплуатация (ЧРП)</span>
          </button>
        </div>

        {/* Выбор сценария + Выпадающее меню «Проект» */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0e141f] px-2.5 py-1.5 rounded-lg border border-[#243044]">
            <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              aria-label="Выбор скважины или сценария"
              value={activeScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-transparent text-xs font-mono text-sky-300 focus:outline-none cursor-pointer pr-1 max-w-[200px]"
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

          <div className="relative" ref={projectMenuRef}>
            <button
              type="button"
              onClick={() => setIsProjectMenuOpen(prev => !prev)}
              aria-expanded={isProjectMenuOpen}
              className="px-2.5 py-1.5 bg-[#151d2b] hover:bg-[#1e293d] text-slate-200 border border-[#243044] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Проект</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProjectMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-[#141b27] border border-[#2d3d56] rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onSaveCurrentWell();
                    setIsProjectMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-emerald-300 hover:bg-[#1d2738] flex items-center gap-2 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>{isSavedScenarioActive ? 'Обновить в «Мои скважины»' : 'Сохранить в «Мои скважины»'}</span>
                </button>

                {isSavedScenarioActive && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteSavedWell(activeScenarioId);
                      setIsProjectMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Удалить сохранённую скважину</span>
                  </button>
                )}

                <div className="my-1 border-t border-[#243044]" />

                <button
                  type="button"
                  onClick={() => {
                    onExportJson();
                    setIsProjectMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-200 hover:bg-[#1d2738] flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Экспорт проекта в JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 text-left text-slate-200 hover:bg-[#1d2738] flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Импорт проекта из JSON</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFilePick}
              className="hidden"
            />
          </div>
        </div>

        {/* Каталог и Техкарта */}
        <div className="flex items-center gap-2 shrink-0">
          {statusMessage && (
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border whitespace-nowrap ${
                statusMessage.type === 'ok'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
                  : 'bg-rose-950/90 text-rose-300 border-rose-700/60'
              }`}
            >
              {statusMessage.text}
            </span>
          )}

          <button
            type="button"
            onClick={onOpenCatalog}
            className="px-3 py-1.5 bg-[#1a2332] hover:bg-[#243044] text-sky-300 border border-[#2d3d56] hover:border-sky-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            title="Открыть полный каталог оборудования ООО «Новые Технологии» на 2026 год"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Каталог НТ · 2026</span>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Техкарта УЭЦН</span>
          </button>
        </div>
      </div>
    </header>
  );
};

