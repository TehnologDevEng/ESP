import React, { useState, useMemo, useEffect } from 'react';
import { PRESETS, WellPreset } from './data/presets';
import { PUMP_DATABASE } from './data/pumps';
import { evaluatePumpModel } from './utils/calculations';
import { Header } from './components/Header';
import { SidebarInputs } from './components/SidebarInputs';
import { PerformanceChart } from './components/PerformanceChart';
import { WellSchematic } from './components/WellSchematic';
import { PumpSelectorCards } from './components/PumpSelectorCards';
import { CalculationsAudit } from './components/CalculationsAudit';
import { OperationModeView } from './components/OperationModeView';
import { ReportModal } from './components/ReportModal';
import { EquipmentCatalogModal } from './components/EquipmentCatalogModal';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import {
  WellParameters,
  FluidProperties,
  CompletionGeometry,
  ElectricalParams,
  ApplicationMode,
  MotorPreference,
  SavedWellScenario
} from './types/esp';

const SAVED_WELLS_STORAGE_KEY = 'esp_expert_saved_wells_v1';

function loadSavedWells(): SavedWellScenario[] {
  try {
    const raw = localStorage.getItem(SAVED_WELLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  // Режим работы приложения: Подбор оборудования (CAD) или Режим эксплуатации (ЧРП)
  const [appMode, setAppMode] = useState<ApplicationMode>('sizing');

  // Инициализация состояний из базового пресета
  const [activeScenarioId, setActiveScenarioId] = useState<string>(PRESETS[0].id);
  const [well, setWell] = useState<WellParameters>(PRESETS[0].well);
  const [fluid, setFluid] = useState<FluidProperties>(PRESETS[0].fluid);
  const [completion, setCompletion] = useState<CompletionGeometry>(PRESETS[0].completion);
  const [electrical, setElectrical] = useState<ElectricalParams>(PRESETS[0].electrical);

  // Предпочтение типа двигателя и ручной подбор ПЭД / Гидрозащиты
  const [motorPreference, setMotorPreference] = useState<MotorPreference>('auto');
  const [manualMotorId, setManualMotorId] = useState<string>('');
  const [manualHydroId, setManualHydroId] = useState<string>('');

  const [selectedPumpId, setSelectedPumpId] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [showAllWarnings, setShowAllWarnings] = useState<boolean>(false);

  // Сохраненные пользователем скважины
  const [savedWells, setSavedWells] = useState<SavedWellScenario[]>(() => loadSavedWells());
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_WELLS_STORAGE_KEY, JSON.stringify(savedWells));
    } catch {
      // Игнорируем переполнение localStorage в приватном режиме
    }
  }, [savedWells]);

  const showStatus = (text: string, type: 'ok' | 'err' = 'ok') => {
    setStatusMessage({ text, type });
    window.setTimeout(() => {
      setStatusMessage(prev => (prev?.text === text ? null : prev));
    }, 2800);
  };

  // Обработчик выбора готового сценария скважины
  const handleSelectPreset = (preset: WellPreset) => {
    setActiveScenarioId(preset.id);
    setWell(preset.well);
    setFluid(preset.fluid);
    setCompletion(preset.completion);
    setElectrical(preset.electrical);
    setMotorPreference('auto');
    setManualMotorId('');
    setManualHydroId('');
    setSelectedPumpId('');
  };

  // Обработчик выбора сохраненной скважины
  const handleSelectSavedWell = (scenario: SavedWellScenario) => {
    setActiveScenarioId(scenario.id);
    setWell(scenario.well);
    setFluid(scenario.fluid);
    setCompletion(scenario.completion);
    setElectrical(scenario.electrical);
    setMotorPreference(scenario.motorPreference || 'auto');
    setManualMotorId(scenario.manualMotorId || '');
    setManualHydroId(scenario.manualHydroId || '');
    if (scenario.selectedPumpId) {
      setSelectedPumpId(scenario.selectedPumpId);
    }
  };

  // Сохранить или обновить текущую скважину в localStorage
  const handleSaveCurrentWell = () => {
    const label = `Скв. ${well.wellName || 'Б/Н'} · ${well.field || 'Месторождение'}`;
    const existing = savedWells.find(s => s.id === activeScenarioId);

    if (existing) {
      const updated: SavedWellScenario = {
        ...existing,
        name: label,
        savedAt: new Date().toISOString(),
        well,
        fluid,
        completion,
        electrical,
        motorPreference,
        manualMotorId,
        manualHydroId,
        selectedPumpId: activeResult.pump.id
      };
      setSavedWells(prev => prev.map(s => (s.id === existing.id ? updated : s)));
      showStatus('Скважина обновлена');
    } else {
      const newScenario: SavedWellScenario = {
        id: `saved:${Date.now()}`,
        name: label,
        savedAt: new Date().toISOString(),
        well,
        fluid,
        completion,
        electrical,
        motorPreference,
        manualMotorId,
        manualHydroId,
        selectedPumpId: activeResult.pump.id
      };
      setSavedWells(prev => [newScenario, ...prev]);
      setActiveScenarioId(newScenario.id);
      showStatus('Сохранено в «Мои скважины»');
    }
  };

  const handleDeleteSavedWell = (id: string) => {
    setSavedWells(prev => prev.filter(s => s.id !== id));
    setActiveScenarioId(PRESETS[0].id);
    showStatus('Скважина удалена');
  };

  // Расчет всех кандидатов из базы насосов
  const candidates = useMemo(() => {
    return PUMP_DATABASE.map(pump =>
      evaluatePumpModel(pump, well, fluid, completion, electrical, {
        motorPreference,
        manualMotorId: manualMotorId || undefined,
        manualHydroId: manualHydroId || undefined
      })
    ).sort((a, b) => b.matchScore - a.matchScore);
  }, [well, fluid, completion, electrical, motorPreference, manualMotorId, manualHydroId]);

  // Активный выбранный вариант
  const activeResult = useMemo(() => {
    return (
      candidates.find(c => c.pump.id === selectedPumpId) ||
      candidates[0]
    );
  }, [candidates, selectedPumpId]);

  // Экспорт проекта в JSON
  const handleExportJson = () => {
    const payload = {
      version: 'esp-expert-10.4',
      exportedAt: new Date().toISOString(),
      well,
      fluid,
      completion,
      electrical,
      motorPreference,
      manualMotorId,
      manualHydroId,
      selectedPumpId: activeResult.pump.id
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (well.wellName || 'well').replace(/[^\wа-яА-ЯёЁ-]+/g, '_');
    a.href = url;
    a.download = `esp-project-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('Проект выгружен в JSON');
  };

  // Импорт проекта из JSON
  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed.well || !parsed.fluid || !parsed.completion || !parsed.electrical) {
          showStatus('Некорректный формат файла JSON', 'err');
          return;
        }
        setWell(parsed.well);
        setFluid(parsed.fluid);
        setCompletion(parsed.completion);
        setElectrical(parsed.electrical);
        setMotorPreference(parsed.motorPreference || 'auto');
        setManualMotorId(parsed.manualMotorId || '');
        setManualHydroId(parsed.manualHydroId || '');
        if (parsed.selectedPumpId) {
          setSelectedPumpId(parsed.selectedPumpId);
        }
        setActiveScenarioId('__imported__');
        showStatus('Проект загружен из JSON');
      } catch {
        showStatus('Ошибка чтения JSON файла', 'err');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Главная навигационная полоса */}
      <Header
        activeResult={activeResult}
        appMode={appMode}
        activeScenarioId={activeScenarioId}
        savedWells={savedWells}
        statusMessage={statusMessage}
        onChangeAppMode={setAppMode}
        onSelectPreset={handleSelectPreset}
        onSelectSavedWell={handleSelectSavedWell}
        onSaveCurrentWell={handleSaveCurrentWell}
        onDeleteSavedWell={handleDeleteSavedWell}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
      />

      {/* Основная рабочая область CAD интерфейса */}
      <main className="no-print flex-1 p-3 md:p-4 max-w-[1720px] w-full mx-auto space-y-4">
        {appMode === 'sizing' ? (
          <>
            {/* Сводная KPI-лента ключевых показателей подбора */}
            <section
              aria-label="Ключевые показатели подбора УЭЦН"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <div className="bg-[#111722] border border-[#243044] rounded-xl px-3.5 py-2.5 flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Активный насос
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-white truncate">{activeResult.pump.name}</span>
                  <span className="text-xs font-mono tabular-nums text-sky-400 shrink-0">
                    {activeResult.totalStages} ст.
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-400">
                  {activeResult.numSections} {activeResult.numSections === 1 ? 'секц.' : 'секц.'} · L = {activeResult.totalPumpLength.toFixed(1)} м
                </div>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl px-3.5 py-2.5 flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Напор TDH и приём
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2 font-mono tabular-nums">
                  <span className="text-sm font-bold text-slate-100">
                    {Math.round(activeResult.totalDynamicHead)} м
                  </span>
                  <span className="text-xs text-sky-400">
                    Hсб {Math.round(activeResult.fullStringHeadAtQ)} м
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-400">
                  Pпр {activeResult.intakePressureAtm.toFixed(1)} атм · Газ {activeResult.freeGasIntakeFraction.toFixed(1)}%
                </div>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl px-3.5 py-2.5 flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  ПЭД и охлаждение
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-slate-100 truncate">{activeResult.motor.name}</span>
                  <span
                    className={`text-xs font-mono tabular-nums shrink-0 ${
                      activeResult.motorLoadPercent > 100 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {activeResult.motorLoadPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-mono tabular-nums flex items-center justify-between gap-2">
                  <span
                    className={
                      activeResult.coolingStatus === 'OPTIMAL'
                        ? 'text-emerald-400'
                        : activeResult.coolingStatus === 'ACCEPTABLE'
                          ? 'text-sky-400'
                          : activeResult.coolingStatus === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                    }
                  >
                    v = {activeResult.coolingVelocityMs.toFixed(2)} м/с
                  </span>
                  <span className="text-slate-400">
                    {activeResult.shroudRequired ? 'Шрауд' : 'Без шрауда'}
                  </span>
                </div>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl px-3.5 py-2.5 flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Прочность вала и индекс
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2 font-mono tabular-nums">
                  <span
                    className={`text-sm font-bold ${
                      activeResult.shaftOverload ? 'text-rose-400' : 'text-amber-300'
                    }`}
                  >
                    Вал {activeResult.shaftLoadPercent.toFixed(0)}%
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      activeResult.matchScore >= 80
                        ? 'text-emerald-400'
                        : activeResult.matchScore >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                    }`}
                  >
                    Индекс {activeResult.matchScore}%
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-400">
                  {activeResult.fullStringShaftPowerKW.toFixed(1)} / {Math.round(activeResult.shaftLimitKW)} кВт
                </div>
              </div>
            </section>

            {/* Баннер критических предупреждений в верхней части экрана */}
            {activeResult.warnings.length > 0 && (
              <section
                aria-label="Предупреждения по текущей компоновке"
                className="bg-amber-950/25 border border-amber-700/50 rounded-xl px-3.5 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Предупреждения по текущей сборке ({activeResult.warnings.length})
                    </span>
                  </div>
                  {activeResult.warnings.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setShowAllWarnings(prev => !prev)}
                      className="text-[11px] font-mono text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
                    >
                      <span>{showAllWarnings ? 'Скрыть' : `Показать все (${activeResult.warnings.length})`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllWarnings ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-200/90 pl-5 list-disc">
                  {(showAllWarnings ? activeResult.warnings : activeResult.warnings.slice(0, 2)).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Верхняя трехколоночная компоновка */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Левая колонка: Ввод технологических данных */}
              <div className="lg:col-span-3 xl:col-span-3 flex flex-col">
                <SidebarInputs
                  well={well}
                  fluid={fluid}
                  completion={completion}
                  electrical={electrical}
                  motorPreference={motorPreference}
                  manualMotorId={manualMotorId}
                  manualHydroId={manualHydroId}
                  activeMotor={activeResult.motor}
                  activeHydro={activeResult.hydro}
                  onChangeWell={setWell}
                  onChangeFluid={setFluid}
                  onChangeCompletion={setCompletion}
                  onChangeElectrical={setElectrical}
                  onChangeMotorPreference={setMotorPreference}
                  onChangeManualMotorId={setManualMotorId}
                  onChangeManualHydroId={setManualHydroId}
                />
              </div>

              {/* Центральная колонка: График сборки УЭЦН и карточки типоразмеров */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-4">
                <div className="h-[490px]">
                  <PerformanceChart
                    result={activeResult}
                    well={well}
                    completion={completion}
                    frequency={electrical.frequency}
                    onChangeFrequency={(f) => setElectrical(prev => ({ ...prev, frequency: f }))}
                  />
                </div>

                <PumpSelectorCards
                  candidates={candidates}
                  selectedPumpId={activeResult.pump.id}
                  onSelectPump={setSelectedPumpId}
                  targetQ={well.qTarget}
                />
              </div>

              {/* Правая колонка: Чертеж скважины и компоновки УЭЦН */}
              <div className="lg:col-span-3 xl:col-span-3 flex flex-col">
                <WellSchematic
                  result={activeResult}
                  well={well}
                  completion={completion}
                />
              </div>
            </div>

            {/* Нижняя полноразмерная секция: Инженерный аудит расчетов и рекомендации */}
            <CalculationsAudit
              result={activeResult}
              well={well}
              fluid={fluid}
              completion={completion}
              electrical={electrical}
            />
          </>
        ) : (
          /* Режим эксплуатации спущенной установки (ЧРП и устьевое штуцирование) */
          <OperationModeView
            pump={activeResult.pump}
            motor={activeResult.motor}
            baseResult={activeResult}
            well={well}
            fluid={fluid}
            completion={completion}
            electrical={electrical}
            onUpdateBaseFreq={(f) => setElectrical(prev => ({ ...prev, frequency: f }))}
          />
        )}
      </main>

      {/* Инженерный CAD-футер приложения */}
      <footer className="no-print mt-6 bg-[#111722] border-t border-[#243044] text-xs text-slate-400">
        <div className="max-w-[1720px] mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="font-mono font-bold text-slate-200">ESP EXPERT v10.4 PRO</span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="text-slate-400 text-[11px]">
              Инженерно-технологический комплекс подбора погружного насосного оборудования УЭЦН
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
            <div className="bg-[#172030] px-3 py-1.5 rounded-lg border border-[#2d3d56] text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">Разработчик:</span>
              <span className="font-bold text-sky-300">Носар Андрей</span>
            </div>

            <div className="text-slate-400 hidden lg:block">
              ГОСТ 34771-2021 / API RP 11S2
            </div>

            <span className="text-slate-500">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* Модальное окно паспорта / техкарты для печати */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        result={activeResult}
        well={well}
        fluid={fluid}
        completion={completion}
        electrical={electrical}
      />

      {/* Модальное окно онлайн-каталога оборудования ООО «Новые Технологии» на 2026 год */}
      <EquipmentCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectPump={(pumpId) => setSelectedPumpId(pumpId)}
        onSelectMotor={(motorId) => {
          setManualMotorId(motorId);
          showStatus('Двигатель применён в расчёт');
        }}
        onSelectHydro={(hydroId) => {
          setManualHydroId(hydroId);
          showStatus('Гидрозащита применена в расчёт');
        }}
        selectedPumpName={activeResult?.pump?.name}
        selectedMotorName={activeResult?.motor?.name}
        selectedHydroName={activeResult?.hydro?.name}
      />
    </div>
  );
}
