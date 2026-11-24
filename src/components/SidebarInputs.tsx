import React, { useState } from 'react';
import {
  WellParameters,
  FluidProperties,
  CompletionGeometry,
  ElectricalParams,
  MotorPreference,
  MotorModel,
  HydroModel
} from '../types/esp';
import { MOTOR_DATABASE, HYDRO_DATABASE } from '../data/motors';
import { getTvdFactor } from '../utils/calculations';
import { Settings2, Droplet, Cylinder, Zap, RotateCcw, ChevronDown } from 'lucide-react';
import { SmartNumberInput } from './SmartNumberInput';

interface SidebarInputsProps {
  well: WellParameters;
  fluid: FluidProperties;
  completion: CompletionGeometry;
  electrical: ElectricalParams;
  motorPreference: MotorPreference;
  manualMotorId: string;
  manualHydroId: string;
  activeMotor: MotorModel;
  activeHydro: HydroModel;
  onChangeWell: (well: WellParameters) => void;
  onChangeFluid: (fluid: FluidProperties) => void;
  onChangeCompletion: (comp: CompletionGeometry) => void;
  onChangeElectrical: (elec: ElectricalParams) => void;
  onChangeMotorPreference: (pref: MotorPreference) => void;
  onChangeManualMotorId: (id: string) => void;
  onChangeManualHydroId: (id: string) => void;
}

type TabKey = 'well' | 'fluid' | 'completion' | 'electrical';

export const SidebarInputs: React.FC<SidebarInputsProps> = ({
  well,
  fluid,
  completion,
  electrical,
  motorPreference,
  manualMotorId,
  manualHydroId,
  activeMotor,
  activeHydro,
  onChangeWell,
  onChangeFluid,
  onChangeCompletion,
  onChangeElectrical,
  onChangeMotorPreference,
  onChangeManualMotorId,
  onChangeManualHydroId
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('well');
  const [showWellAdvanced, setShowWellAdvanced] = useState<boolean>(false);
  const [showCompletionAdvanced, setShowCompletionAdvanced] = useState<boolean>(false);
  const [showElectricalAdvanced, setShowElectricalAdvanced] = useState<boolean>(false);

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

  const dCasInMm = completion.casingOuterDiam - 2 * completion.casingWallThickness;
  const tvdFactor = getTvdFactor(well.inclinationDeg);

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
      <div className="p-3.5 flex-1 space-y-3">
        {/* ===================== ВКЛАДКА: СКВАЖИНА ===================== */}
        {activeTab === 'well' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Основные параметры скважины
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

            {/* Динамический и статический уровни */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Динамич. (Hдин)</label>
                <SmartNumberInput
                  value={well.hDynamic}
                  onChange={(val) => updateWell('hDynamic', val)}
                  min={0}
                  max={4000}
                  unit="м"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Статич. (Hстат)</label>
                <SmartNumberInput
                  value={well.hStatic}
                  onChange={(val) => updateWell('hStatic', val)}
                  min={0}
                  max={4000}
                  unit="м"
                />
              </div>
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

            {/* Пластовое давление и зенитный угол (MD/TVD) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1e2738]">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">P пластовое</label>
                <SmartNumberInput
                  value={well.pReservoir}
                  onChange={(val) => updateWell('pReservoir', val)}
                  min={10}
                  max={600}
                  unit="атм"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400">Угол</label>
                  <span className="text-[10px] font-mono text-sky-400">
                    TVD {Math.round(well.depthPump * tvdFactor)} м
                  </span>
                </div>
                <SmartNumberInput
                  value={well.inclinationDeg ?? 0}
                  onChange={(val) => updateWell('inclinationDeg', val)}
                  min={0}
                  max={75}
                  unit="°"
                />
              </div>
            </div>

            {/* Сворачиваемая секция: Паспорт, перфорация и температуры */}
            <div className="pt-1 border-t border-[#1e2738]">
              <button
                type="button"
                onClick={() => setShowWellAdvanced(prev => !prev)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#0e141f] hover:bg-[#182130] border border-[#243044] flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <span className="font-medium truncate">
                  Доп. параметры ({well.wellName} · Tпл {well.tReservoir}°C)
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showWellAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showWellAdvanced && (
                <div className="mt-2.5 space-y-2.5 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Скважина</label>
                      <input
                        type="text"
                        value={well.wellName}
                        onChange={(e) => updateWell('wellName', e.target.value)}
                        className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Месторождение</label>
                      <input
                        type="text"
                        value={well.field}
                        onChange={(e) => updateWell('field', e.target.value)}
                        className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Кровля</label>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">T пласта</label>
                      <SmartNumberInput
                        value={well.tReservoir}
                        onChange={(val) => updateWell('tReservoir', val)}
                        min={5}
                        max={220}
                        unit="°C"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">T на устье</label>
                      <SmartNumberInput
                        value={well.tWellhead}
                        onChange={(val) => updateWell('tWellhead', val)}
                        min={-30}
                        max={90}
                        unit="°C"
                      />
                    </div>
                  </div>
                </div>
              )}
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

            {/* Сворачиваемые доп. параметры конструкции и гидравлики НКТ */}
            <div className="pt-1 border-t border-[#1e2738]">
              <button
                type="button"
                onClick={() => setShowCompletionAdvanced(prev => !prev)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#0e141f] hover:bg-[#182130] border border-[#243044] flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <span className="font-medium truncate">
                  Геометрия и шероховатость (Dвн {completion.tubingInnerDiam} мм · Δ {completion.tubingRoughness})
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showCompletionAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showCompletionAdvanced && (
                <div className="mt-2.5 space-y-2.5 pt-1">
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
                Сечение основного кабеля
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[16, 25, 35].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() =>
                      onChangeElectrical({
                        ...electrical,
                        cableSection: sec,
                        thermoInsertSection: sec
                      })
                    }
                    className={`py-2 px-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                      electrical.cableSection === sec
                        ? 'border-blue-500 bg-blue-600/30 text-blue-300'
                        : 'border-[#243044] bg-[#0b0e14] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3 × {sec} мм²
                  </button>
                ))}
              </div>
            </div>

            {/* Длина кабеля */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-400">Общая длина линии</label>
                <span className="font-mono text-slate-300">{electrical.cableLength} м</span>
              </div>
              <SmartNumberInput
                value={electrical.cableLength}
                onChange={(val) => updateElectrical('cableLength', val)}
                min={50}
                max={5000}
                unit="м"
              />
              {(() => {
                const useIns = electrical.useThermoInsert ?? true;
                const mleL = Math.min(electrical.cableLength, Math.max(5, electrical.mleLengthM ?? 25));
                const insL = useIns ? Math.min(Math.max(0, electrical.cableLength - mleL), Math.max(0, electrical.thermoInsertLengthM ?? 350)) : 0;
                const mainL = Math.max(0, electrical.cableLength - mleL - insL);
                return (
                  <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between bg-[#0b0e14] px-2 py-1 rounded border border-[#1e2738]">
                    <span>Осн: <strong className="text-slate-200">{mainL}м</strong></span>
                    <span>Вст: <strong className={insL > 0 ? 'text-amber-300' : 'text-slate-500'}>{insL}м</strong></span>
                    <span>Удл: <strong className="text-sky-300">{mleL}м</strong></span>
                  </div>
                );
              })()}
            </div>

            {/* Термовставка (300-400 м) */}
            <div className="bg-[#0e141f] border border-[#243044] rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300">Термовставка (над удлинителем)</span>
                <button
                  type="button"
                  onClick={() => updateElectrical('useThermoInsert', !(electrical.useThermoInsert ?? true))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                    (electrical.useThermoInsert ?? true)
                      ? 'bg-amber-600/25 border-amber-500/70 text-amber-300'
                      : 'bg-[#0b0e14] border-[#243044] text-slate-500'
                  }`}
                >
                  {(electrical.useThermoInsert ?? true) ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>

              {(electrical.useThermoInsert ?? true) && (
                <div className="space-y-2 pt-0.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[300, 350, 400].map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => updateElectrical('thermoInsertLengthM', len)}
                        className={`py-1 rounded border text-[10px] font-mono font-bold transition-all ${
                          (electrical.thermoInsertLengthM ?? 350) === len
                            ? 'border-amber-500/70 bg-amber-600/25 text-amber-200'
                            : 'border-[#243044] bg-[#0b0e14] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {len} м
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Длина вставки</label>
                      <SmartNumberInput
                        value={electrical.thermoInsertLengthM ?? 350}
                        onChange={(val) => updateElectrical('thermoInsertLengthM', val)}
                        min={50}
                        max={1200}
                        unit="м"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Марка вставки</label>
                      <select
                        value={electrical.thermoInsertType ?? 'КПсТБП-150'}
                        onChange={(e) => updateElectrical('thermoInsertType', e.target.value)}
                        className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-2 py-2 text-[11px] font-mono text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="КПсТБП-150">КПсТБП-150 (150°C)</option>
                        <option value="КПпБП-180">КПпБП-180 (180°C)</option>
                        <option value="КПсТБП-230">КПсТБП-230 (230°C)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Выбор типа и модели двигателя ПЭД / ВПЭД */}
            <div className="pt-2 border-t border-[#1e2738] space-y-2.5">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Двигатель (ПЭД / ВПЭД)
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { key: 'auto', label: 'Авто' },
                  { key: 'пэд', label: 'ПЭД (130°C)' },
                  { key: 'впэд', label: 'ВПЭД (230°C)' }
                ] as { key: MotorPreference; label: string }[]).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onChangeMotorPreference(item.key);
                      onChangeManualMotorId('');
                    }}
                    className={`py-1.5 px-1 rounded-lg border text-[10px] font-semibold transition-all ${
                      motorPreference === item.key && !manualMotorId
                        ? 'border-emerald-500 bg-emerald-600/25 text-emerald-300'
                        : 'border-[#243044] bg-[#0b0e14] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <label className="text-slate-400">Модель двигателя</label>
                  <span className="font-mono text-[10px] text-emerald-400">
                    {manualMotorId ? 'Ручной' : 'Автоподбор'}
                  </span>
                </div>
                <select
                  value={manualMotorId}
                  onChange={(e) => onChangeManualMotorId(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Авто: {activeMotor.name} ({activeMotor.powerRatingKW} кВт, D{activeMotor.outerDiam})</option>
                  {MOTOR_DATABASE.filter(m => m.outerDiam <= dCasInMm - 4).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.powerRatingKW} кВт · D{m.outerDiam} · до {m.tempMaxC ?? 130}°C
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Сворачиваемая секция: Марка кабеля и Протектор гидрозащиты */}
            <div className="pt-1 border-t border-[#1e2738]">
              <button
                type="button"
                onClick={() => setShowElectricalAdvanced(prev => !prev)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#0e141f] hover:bg-[#182130] border border-[#243044] flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <span className="font-medium truncate">
                  Кабель и гидрозащита ({electrical.cableType} · {activeHydro.name})
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showElectricalAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showElectricalAdvanced && (
                <div className="mt-2.5 space-y-2.5 pt-1">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Марка основного кабеля</label>
                    <select
                      value={electrical.cableType}
                      onChange={(e) => updateElectrical('cableType', e.target.value)}
                      className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    >
                      <option value="КПБП-90">КПБП-90 (ПЭ стандарт, до 90°C)</option>
                      <option value="КПбП-120">КПбП-120 (Стандартный, до 120°C)</option>
                      <option value="КПсБП-130">КПсБП-130 (Сшитый ПЭ, до 130°C)</option>
                      <option value="КПсТБП-150">КПсТБП-150 (Термостойкий, до 150°C)</option>
                    </select>
                  </div>

                  {/* Параметры плоского удлинителя (MLE) */}
                  <div className="bg-[#0b0e14] border border-[#1e2738] rounded-lg p-2.5 space-y-2">
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      Плоский удлинитель вдоль УЭЦН (MLE)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Длина удлинителя</label>
                        <SmartNumberInput
                          value={electrical.mleLengthM ?? 25}
                          onChange={(val) => updateElectrical('mleLengthM', val)}
                          min={5}
                          max={60}
                          unit="м"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Сечение MLE</label>
                        <div className="grid grid-cols-2 gap-1">
                          {[10, 16].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => updateElectrical('mleSection', sec)}
                              className={`py-2 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                                (electrical.mleSection ?? 16) === sec
                                  ? 'border-sky-500 bg-sky-600/25 text-sky-200'
                                  : 'border-[#243044] bg-[#131924] text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              3×{sec}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Марка удлинителя</label>
                      <select
                        value={electrical.mleType ?? 'КПпБП-180'}
                        onChange={(e) => updateElectrical('mleType', e.target.value)}
                        className="w-full bg-[#131924] border border-[#243044] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white focus:outline-none"
                      >
                        <option value="КПпБП-180">КПпБП-180 (Плоский, до 180°C)</option>
                        <option value="КПсТБП-230">КПсТБП-230 (Сверхтермостойкий, до 230°C)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <label className="text-slate-400">Протектор гидрозащиты</label>
                      <span className="font-mono text-[10px] text-sky-400">
                        {manualHydroId ? 'Ручной' : 'Авто'}
                      </span>
                    </div>
                    <select
                      value={manualHydroId}
                      onChange={(e) => onChangeManualHydroId(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Авто: {activeHydro.name} (D{activeHydro.outerDiam}, {activeHydro.axialLoadKg} кгс)</option>
                      {HYDRO_DATABASE.filter(h => h.outerDiam <= dCasInMm - 4).map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} · D{h.outerDiam} · {h.axialLoadKg} кгс · до {h.tempMaxC}°C
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
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
