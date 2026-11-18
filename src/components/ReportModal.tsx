import React from 'react';
import { CalculationResult, WellParameters, FluidProperties, CompletionGeometry, ElectricalParams } from '../types/esp';
import { X, Printer, Download, FileText } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult;
  well: WellParameters;
  fluid: FluidProperties;
  completion: CompletionGeometry;
  electrical: ElectricalParams;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  result,
  well,
  fluid,
  completion,
  electrical
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const rows = [
      ['Раздел', 'Параметр', 'Значение', 'Ед. изм.'],
      ['Скважина', 'Наименование', well.wellName, '-'],
      ['Скважина', 'Месторождение', well.field, '-'],
      ['Скважина', 'Целевой дебит', String(well.qTarget), 'м³/сут'],
      ['Скважина', 'Глубина спуска (MD)', String(well.depthPump), 'м'],
      ['Скважина', 'Зенитный угол', String(well.inclinationDeg ?? 0), 'град.'],
      ['Скважина', 'Динамический уровень (MD)', String(well.hDynamic), 'м'],
      ['Скважина', 'Пластовое давление', String(well.pReservoir), 'атм'],
      ['Скважина', 'Пластовая температура', String(well.tReservoir), '°C'],
      ['Флюид', 'Обводненность', String(fluid.waterCut), '%'],
      ['Флюид', 'Плотность смеси', String(Math.round(result.mixDensity)), 'кг/м³'],
      ['Флюид', 'Вязкость смеси', result.mixViscosity.toFixed(1), 'сП'],
      ['Оборудование', 'Насос ЭЦН', result.pump.name, '-'],
      ['Оборудование', 'Число ступеней / секций', `${result.totalStages} / ${result.numSections}`, 'шт'],
      ['Оборудование', 'Приемный модуль', result.gasSeparatorRequired ? result.gasSeparatorType : 'Входной модуль ВМ', '-'],
      ['Оборудование', 'Гидрозащита', result.hydro.name, '-'],
      ['Оборудование', 'Электродвигатель', result.motor.name, '-'],
      ['Оборудование', 'Кабель', `${electrical.cableType} 3x${electrical.cableSection} (${electrical.cableLength} м)`, '-'],
      ['Расчет', 'Требуемый напор TDH', String(Math.round(result.totalDynamicHead)), 'м'],
      ['Расчет', 'Напор сборки H(Q)', String(Math.round(result.fullStringHeadAtQ)), 'м'],
      ['Расчет', 'Мощность на валу', result.fullStringShaftPowerKW.toFixed(1), 'кВт'],
      ['Расчет', 'Загрузка вала от предела', result.shaftLoadPercent.toFixed(0), '%'],
      ['Расчет', 'КПД насоса', result.fullStringEfficiency.toFixed(1), '%'],
      ['Расчет', 'Скорость охлаждения ПЭД', result.coolingVelocityMs.toFixed(3), 'м/с'],
      ['Расчет', 'Давление на приеме', result.intakePressureAtm.toFixed(1), 'атм'],
      ['Расчет', 'Свободный газ на приеме', result.freeGasIntakeFraction.toFixed(1), '%'],
      ['Расчет', 'Удельный расход энергии', result.specificEnergyKWhM3.toFixed(2), 'кВт·ч/м³']
    ];

    const csvContent = '\uFEFF' + rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TechCard_${well.wellName.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { pump, motor, hydro, totalStages, numSections } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print-modal-root">
      <div className="bg-[#131924] border border-[#243044] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print-report-card">
        {/* Шапка модального окна (скрывается при печати, т.к. заменяется печатным заголовком) */}
        <div className="bg-[#182130] px-6 py-4 border-b border-[#243044] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">Технологическая карта подбора УЭЦН</h2>
              <p className="text-xs text-slate-400 font-mono">
                {well.field} · {well.wellName} · Дата расчета: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-[#0e141f] hover:bg-[#243044] border border-[#2d3d56] text-sky-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Экспорт CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              Печать / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#243044] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Тело паспорта компоновки */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 print-report-body">
          {/* Заголовок только для печатной формы А4 */}
          <div className="hidden print-only border-b-2 border-slate-800 pb-2 mb-4">
            <div className="flex items-baseline justify-between">
              <h1 className="text-lg font-bold">ТЕХНОЛОГИЧЕСКАЯ КАРТА ПОДБОРА УЭЦН</h1>
              <span className="font-mono text-xs">ESP EXPERT v10.4 PRO</span>
            </div>
            <div className="text-xs font-mono mt-1">
              {well.field} · {well.wellName} · Дата: {new Date().toLocaleDateString('ru-RU')}
            </div>
          </div>

          {/* 1. Общие сведения о скважине */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-[#243044] pb-1 mb-2.5">
              1. Исходные данные скважины и пластового флюида
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono bg-[#0b0e14] p-3 rounded-lg border border-[#1e2738] print-box">
              <div>
                <span className="text-slate-400 block text-[10px]">Скважина:</span>
                <span className="font-bold text-slate-100">{well.wellName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Дебит Qж:</span>
                <span className="font-bold text-sky-400">{well.qTarget} м³/сут</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Дин. уровень (MD / TVD):</span>
                <span className="font-bold text-slate-100">{well.hDynamic} / {Math.round(result.tvdDynamicM)} м</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Спуск приема (Угол):</span>
                <span className="font-bold text-amber-400">{well.depthPump} м ({well.inclinationDeg ?? 0}°)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Обводненность:</span>
                <span className="font-bold text-emerald-400">{fluid.waterCut}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Плотность / Вязкость:</span>
                <span className="font-bold text-slate-100">{Math.round(result.mixDensity)} кг/м³ · {result.mixViscosity.toFixed(1)} сП</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Pпл / Pбуф / Pзатр:</span>
                <span className="font-bold text-slate-100">{well.pReservoir} / {well.pBuf} / {well.pAnnular} атм</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tпласт / Колонна:</span>
                <span className="font-bold text-slate-100">{well.tReservoir}°C · D{completion.casingOuterDiam} мм</span>
              </div>
            </div>
          </div>

          {/* 2. Спецификация оборудования УЭЦН */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-[#243044] pb-1 mb-2.5">
              2. Спецификация погружного оборудования УЭЦН
            </h3>
            <table className="w-full text-left font-mono border-collapse border border-[#243044] rounded-lg overflow-hidden">
              <thead className="bg-[#182130] text-slate-300 text-[11px]">
                <tr>
                  <th className="p-2 border-b border-[#243044]">Узел компоновки</th>
                  <th className="p-2 border-b border-[#243044]">Марка / Типоразмер</th>
                  <th className="p-2 border-b border-[#243044]">Ключевые параметры</th>
                  <th className="p-2 border-b border-[#243044]">Длина</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2738] bg-[#0b0e14] print-box">
                <tr>
                  <td className="p-2 font-bold text-blue-300">Насосная часть (ЭЦН)</td>
                  <td className="p-2 text-slate-200">{pump.name}</td>
                  <td className="p-2 text-slate-300">
                    {totalStages} ст. ({numSections} секц.) · D{pump.outerDiam} мм · Вал {result.shaftLoadPercent.toFixed(0)}%
                  </td>
                  <td className="p-2 text-slate-400">{result.totalPumpLength.toFixed(1)} м</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-amber-300">Приемный модуль</td>
                  <td className="p-2 text-slate-200">
                    {result.gasSeparatorRequired ? result.gasSeparatorType : `Входной модуль ВМ-${pump.outerDiam}`}
                  </td>
                  <td className="p-2 text-slate-300">
                    Газ на приеме: {result.freeGasIntakeFraction.toFixed(1)}% · Pпр = {result.intakePressureAtm.toFixed(1)} атм
                  </td>
                  <td className="p-2 text-slate-400">{result.gasSeparatorRequired ? '1.4 м' : '0.6 м'}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-300">Гидрозащита</td>
                  <td className="p-2 text-slate-200">Протектор {hydro.name}</td>
                  <td className="p-2 text-slate-300">D{hydro.outerDiam} мм · Осевая нагрузка до {hydro.axialLoadKg} кгс</td>
                  <td className="p-2 text-slate-400">{hydro.lengthM} м</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-emerald-300">Электродвигатель</td>
                  <td className="p-2 text-slate-200">{motor.name}</td>
                  <td className="p-2 text-slate-300">
                    {motor.powerRatingKW} кВт · {motor.voltageV} В · Загрузка: {result.motorLoadPercent.toFixed(0)}% · Tmax {motor.tempMaxC ?? 130}°C
                  </td>
                  <td className="p-2 text-slate-400">{motor.lengthM} м</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-purple-300">Телеметрия и кабель</td>
                  <td className="p-2 text-slate-200">ТМСН-3 + {electrical.cableType}</td>
                  <td className="p-2 text-slate-300">3×{electrical.cableSection} мм² · L = {electrical.cableLength} м</td>
                  <td className="p-2 text-slate-400">0.7 м</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. Результаты расчета рабочего режима */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-[#243044] pb-1 mb-2.5">
              3. Расчетные технологические и энергетические показатели
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono bg-[#0b0e14] p-3 rounded-lg border border-[#1e2738] print-box">
              <div>
                <span className="text-slate-400 block text-[10px]">Напор всей сборки H(Q):</span>
                <span className="font-bold text-sky-400">{Math.round(result.fullStringHeadAtQ)} м</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Требуемый напор TDH:</span>
                <span className="font-bold text-slate-100">{Math.round(result.totalDynamicHead)} м</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Потери на трение в НКТ:</span>
                <span className="font-bold text-slate-100">{result.hFriction.toFixed(1)} м</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Мощность на валу насоса:</span>
                <span className="font-bold text-amber-400">{result.fullStringShaftPowerKW.toFixed(1)} кВт (предел {result.shaftLimitKW} кВт)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">КПД насоса:</span>
                <span className="font-bold text-emerald-400">{result.fullStringEfficiency.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Скорость охлаждения ПЭД:</span>
                <span className="font-bold text-emerald-400">{result.coolingVelocityMs.toFixed(3)} м/с</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Падение U в кабеле:</span>
                <span className="font-bold text-slate-100">{Math.round(result.cableVoltageDropV)} В ({result.cableVoltageDropPercent.toFixed(1)}%)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Напряжение ТМПН:</span>
                <span className="font-bold text-slate-100">{Math.round(result.surfaceVoltageV)} В</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Удельный расход энергии:</span>
                <span className="font-bold text-emerald-400">{result.specificEnergyKWhM3.toFixed(2)} кВт·ч/м³</span>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="mt-3 p-2.5 rounded-lg border border-amber-700/60 bg-amber-950/20 print-box">
                <div className="font-bold text-amber-300 text-[11px] mb-1">Технологические ограничения:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200/90">
                  {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {/* Подписи и реквизиты разработчика */}
            <div className="mt-5 pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span>Разработчик инженерного комплекса:</span>
                <span className="font-bold text-slate-100 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 print-box">Носар Андрей</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span>Стандарт: ГОСТ 34771 / API RP 11S2</span>
                <span>•</span>
                <span>Дата генерации: {new Date().toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Футер */}
        <div className="bg-[#182130] px-6 py-3 border-t border-[#243044] flex items-center justify-between text-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Программный комплекс расчета УЭЦН «ESP Expert v10.4»</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Разработчик: <strong className="text-sky-300 font-medium">Носар Андрей</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#243044] hover:bg-[#334155] text-slate-200 rounded-lg transition-all font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

