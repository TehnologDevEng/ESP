import React, { useState, useMemo } from 'react';
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
import { WellParameters, FluidProperties, CompletionGeometry, ElectricalParams, ApplicationMode } from './types/esp';

export default function App() {
  // Режим работы приложения: Подбор оборудования (CAD) или Режим эксплуатации (ЧРП)
  const [appMode, setAppMode] = useState<ApplicationMode>('sizing');

  // Инициализация состояний из базового пресета
  const [well, setWell] = useState<WellParameters>(PRESETS[0].well);
  const [fluid, setFluid] = useState<FluidProperties>(PRESETS[0].fluid);
  const [completion, setCompletion] = useState<CompletionGeometry>(PRESETS[0].completion);
  const [electrical, setElectrical] = useState<ElectricalParams>(PRESETS[0].electrical);

  const [selectedPumpId, setSelectedPumpId] = useState<string>(PUMP_DATABASE[0]?.id || '');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);

  // Обработчик выбора готового сценария скважины
  const handleSelectPreset = (preset: WellPreset) => {
    setWell(preset.well);
    setFluid(preset.fluid);
    setCompletion(preset.completion);
    setElectrical(preset.electrical);
  };

  // Расчет всех кандидатов из базы насосов
  const candidates = useMemo(() => {
    return PUMP_DATABASE.map(pump =>
      evaluatePumpModel(pump, well, fluid, completion, electrical)
    ).sort((a, b) => b.matchScore - a.matchScore);
  }, [well, fluid, completion, electrical]);

  // Активный выбранный вариант
  const activeResult = useMemo(() => {
    return (
      candidates.find(c => c.pump.id === selectedPumpId) ||
      candidates[0]
    );
  }, [candidates, selectedPumpId]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Главная навигационная полоса */}
      <Header
        well={well}
        activeResult={activeResult}
        appMode={appMode}
        onChangeAppMode={setAppMode}
        onSelectPreset={handleSelectPreset}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
      />

      {/* Основная рабочая область CAD интерфейса */}
      <main className="flex-1 p-3 md:p-4 max-w-[1720px] w-full mx-auto space-y-4">
        {appMode === 'sizing' ? (
          <>
            {/* Верхняя трехколоночная компоновка */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Левая колонка: Ввод технологических данных */}
              <div className="lg:col-span-3 xl:col-span-3 h-[720px]">
                <SidebarInputs
                  well={well}
                  fluid={fluid}
                  completion={completion}
                  electrical={electrical}
                  onChangeWell={setWell}
                  onChangeFluid={setFluid}
                  onChangeCompletion={setCompletion}
                  onChangeElectrical={setElectrical}
                />
              </div>

              {/* Центральная колонка: График сборки УЭЦН и карточки типоразмеров */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-4">
                {/* График суммарной сборки ступеней */}
                <div className="h-[480px]">
                  <PerformanceChart
                    result={activeResult}
                    well={well}
                    completion={completion}
                    frequency={electrical.frequency}
                  />
                </div>

                {/* Карточки рекомендуемых типоразмеров */}
                <PumpSelectorCards
                  candidates={candidates}
                  selectedPumpId={activeResult.pump.id}
                  onSelectPump={setSelectedPumpId}
                  targetQ={well.qTarget}
                />
              </div>

              {/* Правая колонка: Чертеж скважины и компоновки УЭЦН по-русски */}
              <div className="lg:col-span-3 xl:col-span-3 h-[720px]">
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

      <footer className="mt-6 bg-[#111722] border-t border-[#243044] text-xs text-slate-400">
        <div className="max-w-[1720px] mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono font-bold text-slate-200">ESP EXPERT v10.4 PRO</span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-slate-400 text-[11px]">
              Инженерно-технологический комплекс подбора погружного насосного оборудования УЭЦН
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
            <div className="bg-[#172030] px-3 py-1.5 rounded-lg border border-[#2d3d56] text-slate-300 flex items-center gap-2 shadow-sm">
              <span className="text-slate-500">Разработчик:</span>
              <span className="font-bold text-sky-300">Носар Андрей</span>
            </div>

            <div className="bg-[#172030] px-2.5 py-1.5 rounded-lg border border-[#243044] text-slate-400 hidden lg:block">
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
        selectedPumpName={activeResult?.pump?.name}
      />
    </div>
  );
}
