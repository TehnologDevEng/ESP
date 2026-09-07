import React, { useState } from 'react';
import { CalculationResult, WellParameters, FluidProperties, CompletionGeometry, ElectricalParams } from '../types/esp';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Thermometer,
  Zap,
  Gauge,
  Flame
} from 'lucide-react';

interface CalculationsAuditProps {
  result: CalculationResult;
  well: WellParameters;
  fluid: FluidProperties;
  completion: CompletionGeometry;
  electrical: ElectricalParams;
}

export const CalculationsAudit: React.FC<CalculationsAuditProps> = ({
  result,
  well,
  fluid,
  completion,
  electrical
}) => {
  const [activeSection, setActiveSection] = useState<'formulas' | 'audit' | 'recommendations'>('audit');

  const { pump, motor } = result;

  return (
    <div className="bg-[#131924] border border-[#243044] rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Заголовок аудита */}
      <div className="bg-[#182130] px-4 py-3 border-b border-[#243044] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Инженерная верификация и аудит гидродинамических расчетов
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">
            Audit v10.4 Verified
          </span>
        </div>

        <div className="flex items-center bg-[#0e141f] p-1 rounded-lg border border-[#243044]">
          <button
            onClick={() => setActiveSection('audit')}
            className={`px-3 py-1 text-[11px] font-medium rounded transition-all ${
              activeSection === 'audit'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Сводка расчетов
          </button>
          <button
            onClick={() => setActiveSection('formulas')}
            className={`px-3 py-1 text-[11px] font-medium rounded transition-all ${
              activeSection === 'formulas'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Физические формулы
          </button>
          <button
            onClick={() => setActiveSection('recommendations')}
            className={`px-3 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1.5 ${
              activeSection === 'recommendations'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Что можно улучшить
          </button>
        </div>
      </div>

      {/* Контент активного раздела */}
      <div className="p-4 space-y-4">
        {/* ================= РАЗДЕЛ 1: СВОДКА РАСЧЕТОВ ================= */}
        {activeSection === 'audit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Карточка 1: Гидравлика НКТ */}
            <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1e2738] space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-[#1e2738] pb-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  Гидравлика в НКТ
                </span>
                <span className="text-[10px] font-mono text-sky-400">Дарси-Вейсбах</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Скорость в НКТ:</span>
                  <span className="text-slate-200 font-bold">{result.flowVelocityTubing.toFixed(2)} м/с</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Число Рейнольдса (Re):</span>
                  <span className="text-slate-200">{Math.round(result.reynoldsTubing)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Коэфф. трения (λ):</span>
                  <span className="text-slate-200">{result.frictionFactor.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-[#1e2738] pt-1 mt-1">
                  <span>Потери на трение (hтр):</span>
                  <span className="text-amber-400 font-bold">{result.hFriction.toFixed(1)} м</span>
                </div>
              </div>
            </div>

            {/* Карточка 2: Требуемый напор TDH */}
            <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1e2738] space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-[#1e2738] pb-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Структура TDH
                </span>
                <span className="text-[10px] font-mono text-blue-400">Всего {Math.round(result.totalDynamicHead)} м</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>H статический подъем:</span>
                  <span className="text-slate-200">{Math.round(result.hStaticLift)} м</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>H буферного давл. (Pуст):</span>
                  <span className="text-slate-200">{Math.round(result.hWellheadHead)} м</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>H потерь трения:</span>
                  <span className="text-slate-200">{Math.round(result.hFriction)} м</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-[#1e2738] pt-1 mt-1">
                  <span>Коэфф. запаса (3%):</span>
                  <span className="text-emerald-400 font-bold">+{(result.totalDynamicHead * 0.03).toFixed(1)} м</span>
                </div>
              </div>
            </div>

            {/* Карточка 3: Охлаждение ПЭД */}
            <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1e2738] space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-[#1e2738] pb-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                  Теплосъем двигателя
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    result.coolingStatus === 'OPTIMAL' || result.coolingStatus === 'ACCEPTABLE'
                      ? 'text-emerald-400 bg-emerald-950/80'
                      : 'text-rose-400 bg-rose-950/80'
                  }`}
                >
                  {result.coolingStatus}
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Скорость потока v:</span>
                  <span className={`font-bold ${result.coolingVelocityMs >= 0.1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.coolingVelocityMs.toFixed(3)} м/с
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Норматив:</span>
                  <span className="text-slate-300">≥ 0.100 м/с</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Зазор колонна-ПЭД:</span>
                  <span className="text-slate-200">
                    {((completion.casingOuterDiam - 2 * completion.casingWallThickness - motor.outerDiam) / 2).toFixed(1)} мм
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-[#1e2738] pt-1 mt-1">
                  <span>Кожух (Шрауд):</span>
                  <span className={`font-bold ${result.shroudRequired ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {result.shroudRequired ? 'НЕОБХОДИМ' : 'НЕ ТРЕБУЕТСЯ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Карточка 4: Электрические потери */}
            <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#1e2738] space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-[#1e2738] pb-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Кабельная линия
                </span>
                <span className="text-[10px] font-mono text-amber-400">{electrical.cableType}</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Падение напряжения:</span>
                  <span className="text-amber-300 font-bold">{Math.round(result.cableVoltageDropV)} В ({result.cableVoltageDropPercent.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Напряжение на устье:</span>
                  <span className="text-slate-200">{Math.round(result.surfaceVoltageV)} В</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Суточное энергопотребл.:</span>
                  <span className="text-slate-200">{Math.round(result.dailyEnergyKWh)} кВт·ч</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-[#1e2738] pt-1 mt-1">
                  <span>Удельный расход:</span>
                  <span className="text-emerald-400 font-bold">{result.specificEnergyKWhM3.toFixed(2)} кВт·ч/м³</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= РАЗДЕЛ 2: ФИЗИЧЕСКИЕ ФОРМУЛЫ ================= */}
        {activeSection === 'formulas' && (
          <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e2738] space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Формула 1: TDH */}
              <div className="space-y-1.5 bg-[#141b27] p-3 rounded-lg border border-[#243044]">
                <div className="font-bold text-blue-400">1. Полный динамический напор (TDH)</div>
                <div className="font-mono bg-[#0b0e14] p-2 rounded text-slate-200">
                  TDH = (Hдин + (Pбуф · 10⁵) / (ρсм · g) + hтр) · 1.03
                </div>
                <p className="text-slate-400 text-[11px]">
                  Учитывает статический подъем столба жидкости от динамического уровня, устьевое буферное давление,
                  гидравлическое трение в колонне НКТ и технологический резерв 3% на изменение забойного давления.
                </p>
              </div>

              {/* Формула 2: Гидравлика */}
              <div className="space-y-1.5 bg-[#141b27] p-3 rounded-lg border border-[#243044]">
                <div className="font-bold text-blue-400">2. Гидравлические потери в НКТ (Дарси-Вейсбах & Альтшуль)</div>
                <div className="font-mono bg-[#0b0e14] p-2 rounded text-slate-200">
                  hтр = λ · (Lнкт / dвн) · (v² / 2g), где λ = 0.11 · (Δ/d + 68/Re)^0.25
                </div>
                <p className="text-slate-400 text-[11px]">
                  Определяет потери давления потока на трение о стенки труб и внутренние муфты.
                  Для НКТ-73 при расходах выше 150 м³/сут потери резко растут по квадратичной параболе.
                </p>
              </div>

              {/* Формула 3: Скорость охлаждения двигателя */}
              <div className="space-y-1.5 bg-[#141b27] p-3 rounded-lg border border-[#243044]">
                <div className="font-bold text-blue-400">3. Скорость восходящего потока охлаждения ПЭД</div>
                <div className="font-mono bg-[#0b0e14] p-2 rounded text-slate-200">
                  v_охл = Qсек / [ π/4 · (Dэк_вн² - Dпэд²) ] ≥ 0.10 м/с
                </div>
                <p className="text-slate-400 text-[11px]">
                  Критический критерий безаварийной работы погружного электродвигателя. При скорости ниже 0.1 м/с
                  масло внутри двигателя перегревается, приводя к пробою изоляции обмоток статора.
                </p>
              </div>

              {/* Формула 4: Многоступенчатый напор */}
              <div className="space-y-1.5 bg-[#141b27] p-3 rounded-lg border border-[#243044]">
                <div className="font-bold text-blue-400">4. Масштабирование ступеней и ЧРП (Full String)</div>
                <div className="font-mono bg-[#0b0e14] p-2 rounded text-slate-200">
                  Z = ⌈ TDH / (hст · (f/50)² · C_H) ⌉ ; H_total = Z · hст(Q, f)
                </div>
                <p className="text-slate-400 text-[11px]">
                  График отображает не одиночную ступень, а итоговую сборку из всех Z ступеней (до нескольких сотен метров/километров),
                  с учетом квадратичного изменения напора и кубического изменения потребляемой мощности вала от частоты ЧРП.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= РАЗДЕЛ 3: ЧТО МОЖНО УЛУЧШИТЬ ================= */}
        {activeSection === 'recommendations' && (
          <div className="space-y-3 text-xs">
            <div className="text-slate-300 font-medium">
              Экспертный анализ технологического режима и рекомендации по доработке компоновки:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Рекомендация 1: Охлаждение */}
              <div className="bg-[#141b27] p-3 rounded-lg border border-[#243044] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  Охлаждение и положение ПЭД
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {well.depthPump > well.perfTop ? (
                    <span className="text-rose-300">
                      <strong>Внимание!</strong> Насос спущен в/ниже интервала перфорации ({well.depthPump}м &gt; {well.perfTop}м).
                      В зазоре отсутствует направленный восходящий поток. Обязательна установка кожуха охлаждения (шрауда) с хвостовиком!
                    </span>
                  ) : result.coolingVelocityMs < 0.12 ? (
                    <span className="text-amber-300">
                      Скорость потока {result.coolingVelocityMs.toFixed(3)} м/с близка к пороговому нормативу 0.10 м/с.
                      Рекомендуется установка кожуха или повышение частоты ЧРП для увеличения дебита.
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      Условия теплосъема оптимальные ({result.coolingVelocityMs.toFixed(2)} м/с). Двигатель надежно охлаждается притоком пластовой жидкости.
                    </span>
                  )}
                </p>
              </div>

              {/* Рекомендация 2: Диаметр НКТ */}
              <div className="bg-[#141b27] p-3 rounded-lg border border-[#243044] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <Gauge className="w-4 h-4" />
                  Оптимизация диаметра НКТ
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {well.qTarget > 180 && completion.tubingOuterDiam < 89 ? (
                    <span>
                      При дебите {well.qTarget} м³/сут потери на трение в НКТ-{completion.tubingOuterDiam} составляют {result.hFriction.toFixed(1)} м.
                      Переход на <strong>НКТ-89</strong> снизит потери в 2.4 раза и сэкономит до 4.5 кВт мощности двигателя.
                    </span>
                  ) : (
                    <span>
                      Выбранный типоразмер НКТ-{completion.tubingOuterDiam} гидравлически оптимален для дебита {well.qTarget} м³/сут.
                      Потери на трение составляют умеренные {result.hFriction.toFixed(1)} м.
                    </span>
                  )}
                </p>
              </div>

              {/* Рекомендация 3: Энергетика кабеля */}
              <div className="bg-[#141b27] p-3 rounded-lg border border-[#243044] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Zap className="w-4 h-4" />
                  Энергоэффективность кабеля
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {result.cableVoltageDropPercent > 6 ? (
                    <span>
                      Потери напряжения в кабеле сечением {electrical.cableSection} мм² составляют {result.cableVoltageDropPercent.toFixed(1)}%.
                      Рекомендуется увеличить сечение до <strong>35 мм²</strong> для снижения тепловых потерь и нагрева ствола скважины.
                    </span>
                  ) : (
                    <span>
                      Кабель {electrical.cableSection} мм² обеспечивает экономичное падение напряжения ({result.cableVoltageDropPercent.toFixed(1)}% &lt; 6%).
                      Нагрев изоляции в пределах паспортных норм.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
