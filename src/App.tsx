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
import { ReportModal } from './components/ReportModal';
import { WellParameters, FluidProperties, CompletionGeometry, ElectricalParams } from './types/esp';

export default function App() {
  // Инициализация состояний из базового пресета
  const [well, setWell] = useState<WellParameters>(PRESETS[0].well);
  const [fluid, setFluid] = useState<FluidProperties>(PRESETS[0].fluid);
  const [completion, setCompletion] = useState<CompletionGeometry>(PRESETS[0].completion);
  const [electrical, setElectrical] = useState<ElectricalParams>(PRESETS[0].electrical);

  const [selectedPumpId, setSelectedPumpId] = useState<string>('ecn5-125');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

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
        onSelectPreset={handleSelectPreset}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Основная рабочая область CAD интерфейса */}
      <main className="flex-1 p-3 md:p-4 max-w-[1720px] w-full mx-auto space-y-4">
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
      </main>

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
    </div>
  );
}
