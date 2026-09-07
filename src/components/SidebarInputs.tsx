import React, { useState } from 'react';
import { WellParameters, FluidProperties, CompletionGeometry, ElectricalParams } from '../types/esp';
import { Settings2, Droplet, Cylinder, Zap, RotateCcw, HelpCircle } from 'lucide-react';
import { SmartNumberInput } from './SmartNumberInput';

interface SidebarInputsProps {
  well: WellParameters;
  fluid: FluidProperties;
  completion: CompletionGeometry;
  electrical: ElectricalParams;
  onChangeWell: (well: WellParameters) => void;
  onChangeFluid: (fluid: FluidProperties) => void;
  onChangeCompletion: (comp: CompletionGeometry) => void;
  onChangeElectrical: (elec: ElectricalParams) => void;
}

type TabKey = 'well' | 'fluid' | 'completion' | 'electrical';

export const SidebarInputs: React.FC<SidebarInputsProps> = ({
  well,
  fluid,
  completion,
  electrical,
  onChangeWell,
  onChangeFluid,
  onChangeCompletion,
  onChangeElectrical
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('well');

  const updateWell = (field: keyof WellParameters, value: any) => {
    onChangeWell({ ...well, [field]: value });
  };

  const updateFluid = (field: keyof FluidProperties, value: any) => {
    onChangeFluid({ ...fluid, [field]: value });
  };

  const updateCompletion = (field: keyof CompletionGeometry, value: any) => {
    onChangeCompletion({ ...completion, [field]: value });
  };

  const updateElectrical = (field: keyof ElectricalParams, value: any) => {
    onChangeElectrical({ ...electrical, [field]: value });
  };

  return (
    <div className="bg-[#131924] border border-[#243044] rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Верхние табы параметров */}
      <div className="bg-[#182130] border-b border-[#243044] p-1.5 grid grid-cols-4 gap-1">
        <button
          onClick={() => setActiveTab('well')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
            activeTab === 'well'
              ? 'bg-blue-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2a3c]'
          }`}
        >
          <Settings2 className="w-4 h-4 mb-1" />
          <span className="text-[10px] leading-tight">Скважина</span>
        </button>

        <button
          onClick={() => setActiveTab('fluid')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
            activeTab === 'fluid'
              ? 'bg-blue-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2a3c]'
          }`}
        >
          <Droplet className="w-4 h-4 mb-1" />
          <span className="text-[10px] leading-tight">Флюид</span>
        </button>

        <button
          onClick={() => setActiveTab('completion')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
            activeTab === 'completion'
              ? 'bg-blue-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2a3c]'
          }`}
        >
          <Cylinder className="w-4 h-4 mb-1" />
          <span className="text-[10px] leading-tight">Трубы</span>
        </button>

        <button
          onClick={() => setActiveTab('electrical')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
            activeTab === 'electrical'
              ? 'bg-blue-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2a3c]'
          }`}
        >
          <Zap className="w-4 h-4 mb-1" />
          <span className="text-[10px] leading-tight">ЧРП/Кабель</span>
        </button>
      </div>

      {/* Содержимое активной вкладки */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* ===================== ВКЛАДКА: СКВАЖИНА ===================== */}
        {activeTab === 'well' && (
          <div className="space-y-3.5">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Технологические параметры скважины
            </div>

            {/* Целевой дебит жидкости */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">Дебит жидкости (Q)</label>
                <span className="font-mono text-sky-400 font-bold">{well.qTarget} м³/сут</span>
              </div>
              <SmartNumberInput
                value={well.qTarget}
                onChange={(val) => updateWell('qTarget', val)}
                min={5}
                max={800}
                unit="м³/сут"
              />
              <input
                type="range"
                min="10"
                max="600"
                step="5"
                value={well.qTarget}
                onChange={(e) => updateWell('qTarget', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#1e2738] rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1.5"
              />
            </div>

            {/* Глубина спуска насоса */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">Глубина спуска приема (Lспуск)</label>
                <span className="font-mono text-amber-400 font-bold">{well.depthPump} м</span>
              </div>
              <SmartNumberInput
                value={well.depthPump}
                onChange={(val) => updateWell('depthPump', val)}
                min={100}
                max={4500}
                unit="м"
              />
            </div>

            {/* Динамический уровень */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">Динамический уровень (Hдин)</label>
                <span className="font-mono text-sky-300 font-bold">{well.hDynamic} м</span>
              </div>
              <SmartNumberInput
                value={well.hDynamic}
                onChange={(val) => updateWell('hDynamic', val)}
                min={0}
                max={4000}
                unit="м"
              />
            </div>

            {/* Статический уровень */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-400">Статический уровень (Hстат)</label>
                <span className="font-mono text-slate-300">{well.hStatic} м</span>
              </div>
              <SmartNumberInput
                value={well.hStatic}
                onChange={(val) => updateWell('hStatic', val)}
                min={0}
                max={4000}
                unit="м"
              />
            </div>

            {/* Давления: Буферное и Затрубное */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">P буферное</label>
                <SmartNumberInput
                  value={well.pBuf}
                  onChange={(val) => updateWell('pBuf', val)}
                  min={0}
                  max={100}
                  unit="атм"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">P затрубное</label>
                <SmartNumberInput
                  value={well.pAnnular}
                  onChange={(val) => updateWell('pAnnular', val)}
                  min={0}
                  max={100}
                  unit="атм"
                />
              </div>
            </div>

            {/* Интервал перфорации и забой */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Кровля пласта</label>
                <SmartNumberInput
                  value={well.perfTop}
                  onChange={(val) => updateWell('perfTop', val)}
                  min={0}
                  max={6000}
                  className="w-full bg-[#0b0e14] border border-[#243044] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Подошва</label>
                <SmartNumberInput
                  value={well.perfBottom}
                  onChange={(val) => updateWell('perfBottom', val)}
                  min={0}
                  max={6000}
                  className="w-full bg-[#0b0e14] border border-[#243044] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Забой</label>
                <SmartNumberInput
                  value={well.depthWell}
                  onChange={(val) => updateWell('depthWell', val)}
                  min={0}
                  max={6000}
                  className="w-full bg-[#0b0e14] border border-[#243044] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== ВКЛАДКА: ФЛЮИД ===================== */}
        {activeTab === 'fluid' && (
          <div className="space-y-3.5">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Физико-химические свойства флюида
            </div>

            {/* Обводненность */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">Обводненность продукции</label>
                <span className="font-mono text-emerald-400 font-bold">{fluid.waterCut}%</span>
              </div>
              <SmartNumberInput
                value={fluid.waterCut}
                onChange={(val) => updateFluid('waterCut', val)}
                min={0}
                max={99.9}
                unit="%"
              />
              <input
                type="range"
                min="0"
                max="99"
                value={fluid.waterCut}
                onChange={(e) => updateFluid('waterCut', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#1e2738] rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-1.5"
              />
            </div>

            {/* Вязкость нефти */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">Вязкость нефти (пластовая)</label>
                <span className="font-mono text-amber-400 font-bold">{fluid.oilViscosity} сП</span>
              </div>
              <SmartNumberInput
                value={fluid.oilViscosity}
                onChange={(val) => updateFluid('oilViscosity', val)}
                min={0.2}
                max={300}
                unit="мПа·с"
              />
            </div>

            {/* Плотности нефти и воды */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Плотность нефти</label>
                <SmartNumberInput
                  value={fluid.oilDensity}
                  onChange={(val) => updateFluid('oilDensity', val)}
                  min={500}
                  max={1200}
                  unit="кг/м³"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Плотность воды</label>
                <SmartNumberInput
                  value={fluid.waterDensity}
                  onChange={(val) => updateFluid('waterDensity', val)}
                  min={800}
                  max={1300}
                  unit="кг/м³"
                />
              </div>
            </div>

            {/* Газовый фактор и давление насыщения */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Газовый фактор</label>
                <SmartNumberInput
                  value={fluid.gasRatio}
                  onChange={(val) => updateFluid('gasRatio', val)}
                  min={0}
                  max={600}
                  unit="м³/т"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">P насыщения</label>
                <SmartNumberInput
                  value={fluid.pSaturation}
                  onChange={(val) => updateFluid('pSaturation', val)}
                  min={0}
                  max={400}
                  unit="атм"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== ВКЛАДКА: КОНСТРУКЦИЯ / ТРУБЫ ===================== */}
        {activeTab === 'completion' && (
          <div className="space-y-3.5">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Конструкция скважины и колонны труб
            </div>

            {/* Выбор эксплуатационной колонны */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Эксплуатационная колонна (ГОСТ 632)
              </label>
              <select
                value={completion.casingOuterDiam}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const wall = val === 146 ? 8.5 : val === 140 ? 7.7 : val === 168 ? 8.9 : 9.2;
                  onChangeCompletion({
                    ...completion,
                    casingOuterDiam: val,
                    casingWallThickness: wall
                  });
                }}
                className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              >
                <option value={140}>140 мм · Стенка 7.7 мм (Dвн = 124.6 мм)</option>
                <option value={146}>146 мм · Стенка 8.5 мм (Dвн = 129.0 мм) [Стандарт РФ]</option>
                <option value={168}>168 мм · Стенка 8.9 мм (Dвн = 150.2 мм)</option>
                <option value={178}>178 мм · Стенка 9.2 мм (Dвн = 159.6 мм)</option>
                <option value={114}>114 мм · Стенка 7.4 мм (Dвн = 99.2 мм) [Малогабарит]</option>
              </select>
            </div>

            {/* Выбор НКТ */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Колонна НКТ (ГОСТ 633)
              </label>
              <select
                value={completion.tubingOuterDiam}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const inner = val === 73 ? 62.0 : val === 89 ? 75.9 : val === 60 ? 50.3 : 100.5;
                  onChangeCompletion({
                    ...completion,
                    tubingOuterDiam: val,
                    tubingInnerDiam: inner
                  });
                }}
                className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              >
                <option value={60}>НКТ-60 · Внутр. 50.3 мм</option>
                <option value={73}>НКТ-73 · Внутр. 62.0 мм [Оптимально до 180 м³/сут]</option>
                <option value={89}>НКТ-89 · Внутр. 75.9 мм [Высокие дебиты &gt; 200 м³/сут]</option>
              </select>
            </div>

            {/* Внутренний диаметр НКТ и шероховатость */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Dвн трубы НКТ</label>
                <SmartNumberInput
                  value={completion.tubingInnerDiam}
                  onChange={(val) => updateCompletion('tubingInnerDiam', val)}
                  min={30}
                  max={150}
                  unit="мм"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Шероховатость Δ</label>
                <SmartNumberInput
                  value={completion.tubingRoughness}
                  onChange={(val) => updateCompletion('tubingRoughness', val)}
                  min={0.005}
                  max={0.5}
                  unit="мм"
                />
              </div>
            </div>

            {/* Башмак кондуктора и башмак колонны */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Кондуктор</label>
                <SmartNumberInput
                  value={completion.conductorDepth}
                  onChange={(val) => updateCompletion('conductorDepth', val)}
                  min={0}
                  max={2500}
                  unit="м"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Башмак колонны</label>
                <SmartNumberInput
                  value={completion.casingShoeDepth}
                  onChange={(val) => updateCompletion('casingShoeDepth', val)}
                  min={0}
                  max={6000}
                  unit="м"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== ВКЛАДКА: ЭНЕРГЕТИКА И ЧРП ===================== */}
        {activeTab === 'electrical' && (
          <div className="space-y-3.5">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Станция управления с ЧРП и кабель
            </div>

            {/* Частота питающего тока ЧРП */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">Частота тока ЧРП</label>
                <span className="font-mono text-sky-400 font-extrabold text-sm">{electrical.frequency} Гц</span>
              </div>
              <SmartNumberInput
                value={electrical.frequency}
                onChange={(val) => updateElectrical('frequency', val)}
                min={30}
                max={70}
                unit="Гц"
              />
              <input
                type="range"
                min="35"
                max="65"
                step="1"
                value={electrical.frequency}
                onChange={(e) => updateElectrical('frequency', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#1e2738] rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1.5"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                <span>35 Гц</span>
                <span className="text-blue-400">50 Гц (База)</span>
                <span>65 Гц</span>
              </div>
            </div>

            {/* Сечение кабеля */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Сечение жилы кабеля
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[16, 25, 35].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => updateElectrical('cableSection', sec)}
                    className={`py-2 px-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                      electrical.cableSection === sec
                        ? 'border-blue-500 bg-blue-600/30 text-blue-300'
                        : 'border-[#243044] bg-[#0b0e14] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3 x {sec} мм²
                  </button>
                ))}
              </div>
            </div>

            {/* Длина кабеля */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-400">Длина кабельной линии</label>
                <span className="font-mono text-slate-300">{electrical.cableLength} м</span>
              </div>
              <SmartNumberInput
                value={electrical.cableLength}
                onChange={(val) => updateElectrical('cableLength', val)}
                min={50}
                max={5000}
                unit="м"
              />
            </div>

            {/* Марка кабеля */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Марка кабеля</label>
              <select
                value={electrical.cableType}
                onChange={(e) => updateElectrical('cableType', e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
              >
                <option value="КПсБП-130">КПсБП-130 (Бронированный, до 130°C)</option>
                <option value="КПбП-120">КПбП-120 (Стандартный, до 120°C)</option>
                <option value="КПсТБП-150">КПсТБП-150 (Термостойкий, до 150°C)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Быстрая кнопка сброса длины кабеля на глубину подвески + 50м */}
      <div className="bg-[#182130] p-3 border-t border-[#243044] flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">Синхронизация кабеля:</span>
        <button
          onClick={() => updateElectrical('cableLength', well.depthPump + 50)}
          className="px-2.5 py-1 bg-[#0e141f] border border-[#243044] hover:border-blue-500 rounded text-[10px] text-blue-300 font-mono flex items-center gap-1 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Lспуск + 50м ({well.depthPump + 50}м)
        </button>
      </div>
    </div>
  );
};
