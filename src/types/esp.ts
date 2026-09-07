/**
 * Типы данных для инженерного подбора УЭЦН и моделирования скважины
 */

export interface WellParameters {
  wellName: string;            // Номер / наименование скважины
  field: string;               // Месторождение / куст
  qTarget: number;             // Целевой дебит жидкости, м³/сут
  depthPump: number;           // Глубина спуска насоса (приема), м
  hDynamic: number;            // Динамический уровень жидкости от устья, м
  hStatic: number;             // Статический уровень, м
  depthWell: number;           // Искусственный забой, м
  perfTop: number;             // Кровля интервала перфорации, м
  perfBottom: number;          // Подошва интервала перфорации, м
  pBuf: number;                // Буферное давление на устье, атм (кгс/см²)
  pAnnular: number;            // Затрубное давление, атм
  pReservoir: number;          // Пластовое давление, атм
  tReservoir: number;          // Пластовая температура, °C
  tWellhead: number;           // Температура на устье, °C
}

export interface FluidProperties {
  waterCut: number;            // Обводненность, % (0 - 100)
  oilDensity: number;          // Плотность дегазированной нефти, кг/м³ (обычно 820-920)
  waterDensity: number;        // Плотность пластовой воды, кг/м³ (обычно 1000-1180)
  oilViscosity: number;        // Вязкость нефти в пластовых условиях, сП (мПа·с)
  gasRatio: number;            // Газовый фактор (ГОФ), м³/т
  pSaturation: number;         // Давление насыщения нефти газом, атм
  gasRelativeDensity: number;  // Относительная плотность газа по воздуху (обычно 0.7 - 0.9)
}

export interface CompletionGeometry {
  casingOuterDiam: number;     // Наружный диаметр экспл. колонны, мм (140, 146, 168, 178)
  casingWallThickness: number; // Толщина стенки колонны, мм (7.7, 8.5, 9.2...)
  casingShoeDepth: number;     // Глубина башмака эксплуатационной колонны, м
  conductorDepth: number;      // Глубина башмака кондуктора, м
  tubingOuterDiam: number;     // Наружный диаметр НКТ, мм (60, 73, 89)
  tubingInnerDiam: number;     // Внутренний диаметр НКТ, мм (50.3, 62.0, 75.9)
  tubingRoughness: number;     // Абсолютная шероховатость НКТ, мм (0.05 - 0.15)
}

export interface ElectricalParams {
  frequency: number;           // Частота питающего тока ЧРП, Гц (30 - 70)
  cableLength: number;         // Длина кабеля (L_спуск + запас на устье), м
  cableType: string;           // Марка кабеля (КПбП-120, КПсБП-130)
  cableSection: number;        // Сечение токопроводящей жилы, мм² (16, 25, 35)
}

export interface PumpModel {
  id: string;
  name: string;
  manufacturer: string;        // Борец, Новомет, Алнас, Римэра
  series: number;              // Габарит: 2А (69 мм), 3 (86 мм), 5 (92 мм), 5А (103 мм), 6 (117 мм)
  outerDiam: number;           // Наружный диаметр насоса, мм
  minCasingID: number;         // Минимальный внутренний диаметр колонны, мм
  qNom: number;                // Номинальная подача на 50 Гц, м³/сут
  qMin: number;                // Левая граница рабочего диапазона (50 Гц), м³/сут
  qMax: number;                // Правая граница рабочего диапазона (50 Гц), м³/сут
  hStageNom: number;           // Напор 1 ступени в номинале (50 Гц), м
  pStageNom: number;           // Мощность 1 ступени в номинале (50 Гц), кВт
  effNom: number;              // Максимальный КПД ступени, %
  stageLength: number;         // Монтажная длина одной ступени, мм
  maxStagesPerSection: number; // Максимальное число ступеней в одном корпусе (секции)
  // Коэффициенты аппроксимации кривых 2-го порядка: H(Q) = a0 - a1*Q - a2*Q^2
  coeffH: [number, number, number];
  // Коэффициенты мощности P(Q) = b0 + b1*Q + b2*Q^2
  coeffP: [number, number, number];
  // Коэффициенты КПД Eff(Q) = c0 + c1*Q - c2*Q^2
  coeffEff: [number, number, number];
}

export interface MotorModel {
  id: string;
  name: string;
  powerRatingKW: number;       // Номинальная мощность, кВт
  voltageV: number;            // Номинальное напряжение, В
  currentA: number;            // Номинальный ток, А
  efficiency: number;          // КПД двигателя, %
  powerFactor: number;         // cos phi
  outerDiam: number;           // Диаметр корпуса двигателя, мм
  lengthM: number;             // Длина двигателя, м
  massKg: number;              // Масса двигателя, кг
}

export interface CalculationResult {
  pump: PumpModel;
  motor: MotorModel;
  
  // Гидравлика пластовой смеси
  mixDensity: number;          // Плотность смеси, кг/м³
  mixViscosity: number;        // Эффективная вязкость смеси, сП
  
  // Напоры и потери
  hStaticLift: number;         // Геометрический подъем (H_дин), м
  hWellheadHead: number;       // Напор противодавления устья, м
  hFriction: number;           // Потери на трение в НКТ, м
  flowVelocityTubing: number;  // Скорость потока в НКТ, м/с
  reynoldsTubing: number;      // Число Рейнольдса в НКТ
  frictionFactor: number;      // Коэффициент сопротивления Дарси
  totalDynamicHead: number;    // Итоговый требуемый напор (TDH), м
  
  // Ступени и сборка
  kFreq: number;               // Коэффициент подобия частоты (f / 50)
  hStageReal: number;          // Фактический напор 1 ступени при рабочей подаче и частоте, м
  pStageReal: number;          // Мощность 1 ступени, кВт
  totalStages: number;         // Необходимое общее количество ступеней
  numSections: number;         // Количество секций насоса
  stagesPerSection: number[];  // Распределение ступеней по секциям
  totalPumpLength: number;     // Общая длина насосной части, м
  totalStringLength: number;   // Длина всей установки УЭЦН, м
  totalWeightKg: number;       // Примерная масса УЭЦН в сборе, кг
  
  // Характеристики всей сборки (Full String Performance)
  fullStringHeadAtQ: number;   // Суммарный напор всей сборки при целевом дебите, м
  fullStringShaftPowerKW: number; // Мощность на валу всей сборки, кВт
  fullStringHydraulicPowerKW: number; // Полезная гидравлическая мощность, кВт
  fullStringEfficiency: number; // КПД насоса в рабочей точке, %
  shutoffHead: number;         // Напор на закрытую задвижку (при Q=0), м
  dischargePressureAtm: number; // Давление нагнетания насоса, атм
  
  // Условия на приеме насоса
  submergenceMeters: number;   // Погружение под динамический уровень, м
  intakePressureAtm: number;   // Давление на приеме насоса, атм
  freeGasIntakeFraction: number; // Объемная доля свободного газа на приеме, %
  gasSeparatorRequired: boolean; // Нужен ли газосепаратор
  gasSeparatorType: 'НЕТ' | 'МГ (Сепаратор)' | 'МГД (Диспергатор)' | 'Мультифазный';
  
  // Охлаждение ПЭД
  coolingVelocityMs: number;   // Скорость восходящего потока вдоль двигателя, м/с
  coolingStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL';
  coolingMessage: string;
  shroudRequired: boolean;     // Требуется ли кожух охлаждения
  
  // Электрика и двигатель
  motorLoadPercent: number;    // Коэффициент загрузки двигателя, %
  motorLoadStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'OVERLOAD' | 'UNDERLOAD';
  cableVoltageDropV: number;   // Падение напряжения в кабеле, В
  cableVoltageDropPercent: number; // Падение напряжения, %
  surfaceVoltageV: number;     // Требуемое напряжение на выходе ТМПН, В
  dailyEnergyKWh: number;      // Суточный расход электроэнергии, кВт·ч/сут
  specificEnergyKWhM3: number; // Удельный расход электроэнергии, кВт·ч/м³
  
  // Оценка соответствия (Match Index)
  matchScore: number;          // Индекс качества подбора, 0 - 100%
  isWithinOperatingRange: boolean; // Внутри рекомендованного диапазона подачи
  warnings: string[];          // Предупреждения и рекомендации
}

export interface CurvePoint {
  q: number;                   // Дебит, м³/сут
  hTotal: number;              // Напор всей сборки, м
  pShaft: number;              // Мощность всей сборки, кВт
  efficiency: number;          // КПД, %
}
