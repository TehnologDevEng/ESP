import {
  WellParameters,
  FluidProperties,
  CompletionGeometry,
  ElectricalParams,
  PumpModel,
  MotorModel,
  HydroModel,
  MotorPreference,
  CalculationResult,
  CurvePoint,
  OperationParameters,
  OperatingPointResult,
  RegulationPoint
} from '../types/esp';
import { MOTOR_DATABASE, HYDRO_DATABASE } from '../data/motors';
import { getCableSectionSpec, getCableGradeMaxTemp } from '../data/cables';

const G = 9.80665; // Ускорение свободного падения, м/с²

export interface CompositeCableCalculation {
  workCurrentA: number;
  allowableCurrentA: number;
  rTotalOhm: number;
  voltageDropV: number;
  voltageDropPercent: number;
  surfaceVoltageV: number;
  cableLossKW: number;
  spliceTempC: number;
  maxCoreTempMainC: number;
  maxCoreTempInsertC: number;
  maxCoreTempMleC: number;
  mainLengthM: number;
  insertLengthM: number;
  mleLengthM: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL';
  statusMessage: string;
  warnings: string[];
}

/**
 * Расчет составной кабельной линии УЭЦН:
 * 1) Плоский удлинитель вдоль УЭЦН (MLE, обычно 20-30 м)
 * 2) Термовставка над удлинителем (обычно 300-400 м, повышенная термостойкость 150-230°C)
 * 3) Основной бронированный кабель до устья (обычно 3×16 / 3×25 / 3×35, 90-130°C)
 */
export function calculateCompositeCableLine(
  well: WellParameters,
  electrical: ElectricalParams,
  motor: MotorModel,
  shaftPowerKW: number
): CompositeCableCalculation {
  const totalL = Math.max(50, electrical.cableLength);
  const mleLengthM = Math.min(totalL, Math.max(5, electrical.mleLengthM ?? 25));
  const useInsert = electrical.useThermoInsert ?? true;
  const requestedInsertM = useInsert ? Math.max(0, electrical.thermoInsertLengthM ?? 350) : 0;
  const insertLengthM = Math.min(Math.max(0, totalL - mleLengthM), requestedInsertM);
  const mainLengthM = Math.max(0, totalL - mleLengthM - insertLengthM);

  const mleSection = electrical.mleSection ?? 16;
  const insertSection = electrical.thermoInsertSection ?? electrical.cableSection;
  const mainSection = electrical.cableSection;

  const mleSpec = getCableSectionSpec(mleSection);
  const insertSpec = getCableSectionSpec(insertSection);
  const mainSpec = getCableSectionSpec(mainSection);

  const depthRef = Math.max(100, well.depthPump);
  const tempAtDepth = (z: number) =>
    well.tWellhead + (well.tReservoir - well.tWellhead) * Math.max(0, Math.min(1, z / depthRef));

  // Температурные зоны по стволу
  const tMleAmb = well.tReservoir + 12; // Удлинитель проходит вдоль ПЭД и насоса (+подогрев от ПЭД)
  const zInsertBottom = Math.max(0, well.depthPump - mleLengthM);
  const zSplice = Math.max(0, well.depthPump - mleLengthM - insertLengthM);
  const tInsertBottom = tempAtDepth(zInsertBottom) + 6;
  const spliceTempC = insertLengthM > 0 ? tempAtDepth(zSplice) : tInsertBottom;
  const tInsertAvg = (tInsertBottom + spliceTempC) / 2;
  const tMainBottom = spliceTempC;
  const tMainAvg = (tMainBottom + well.tWellhead) / 2;

  // Активное сопротивление фазы по участкам (с температурной поправкой меди α = 0.00393 / °C)
  const rMle = mleSpec.resistanceOhmPerKm * (mleLengthM / 1000) * (1 + 0.00393 * (tMleAmb - 20));
  const rInsert = insertSpec.resistanceOhmPerKm * (insertLengthM / 1000) * (1 + 0.00393 * (tInsertAvg - 20));
  const rMain = mainSpec.resistanceOhmPerKm * (mainLengthM / 1000) * (1 + 0.00393 * (tMainAvg - 20));
  const rTotalOhm = rMle + rInsert + rMain;

  // Рабочий ток, падение напряжения и потери
  const workCurrentA =
    shaftPowerKW > 0
      ? (shaftPowerKW * 1000) / (Math.sqrt(3) * motor.voltageV * motor.powerFactor * (motor.efficiency / 100))
      : 0;
  const voltageDropV = Math.sqrt(3) * workCurrentA * rTotalOhm;
  const voltageDropPercent = (voltageDropV / motor.voltageV) * 100;
  const surfaceVoltageV = motor.voltageV + voltageDropV;
  const cableLossKW = (3 * Math.pow(workCurrentA, 2) * rTotalOhm) / 1000;

  // Самонагрев медной жилы током (порядка 22°C при номинальном токе)
  const dTMle = Math.min(80, 22 * Math.pow(workCurrentA / mleSpec.baseMaxCurrentA, 2));
  const dTInsert = Math.min(80, 22 * Math.pow(workCurrentA / insertSpec.baseMaxCurrentA, 2));
  const dTMain = Math.min(80, 22 * Math.pow(workCurrentA / mainSpec.baseMaxCurrentA, 2));

  const maxCoreTempMleC = tMleAmb + dTMle;
  const maxCoreTempInsertC = tInsertBottom + dTInsert;
  const maxCoreTempMainC = tMainBottom + dTMain;

  // Классы термостойкости изоляции
  const tMaxMain = getCableGradeMaxTemp(electrical.cableType, 130);
  const insertType = electrical.thermoInsertType ?? 'КПсТБП-150';
  const tMaxInsert = getCableGradeMaxTemp(insertType, 150);
  const mleType = electrical.mleType ?? 'КПпБП-180';
  const tMaxMle = getCableGradeMaxTemp(mleType, 180);

  // Допустимый ток основного кабеля с температурной поправкой
  const derateMain =
    tMainBottom >= tMaxMain
      ? 0.2
      : Math.min(1, Math.sqrt(Math.max(0.05, (tMaxMain - tMainBottom) / Math.max(20, tMaxMain - 20))));
  const allowableCurrentA = Math.round(mainSpec.baseMaxCurrentA * derateMain * 10) / 10;

  const nextSection = mainSection < 25 ? 25 : mainSection < 35 ? 35 : null;
  const warnings: string[] = [];
  let status: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';

  // 1. Проверка допустимого тока
  if (workCurrentA > allowableCurrentA) {
    status = 'CRITICAL';
    warnings.push(
      `Перегрузка кабеля 3×${mainSection} мм² по току: ${workCurrentA.toFixed(1)} А > допустимых ${allowableCurrentA.toFixed(0)} А (при T=${tMainBottom.toFixed(0)}°C). ${
        nextSection
          ? `Увеличьте сечение до ${nextSection} мм².`
          : 'Выберите более высоковольтный ПЭД для снижения тока.'
      }`
    );
  }

  // 2. Проверка термостойкости изоляции по зонам
  if (maxCoreTempMainC > tMaxMain) {
    status = 'CRITICAL';
    if (insertLengthM === 0) {
      warnings.push(
        `Перегрев изоляции основного кабеля ${electrical.cableType} (жила ${maxCoreTempMainC.toFixed(0)}°C > ${tMaxMain}°C). Включите термовставку 300–400 м (150–230°C).`
      );
    } else {
      warnings.push(
        `В точке стыка с термовставкой (L=${insertLengthM} м) температура жилы основного кабеля ${maxCoreTempMainC.toFixed(0)}°C превышает предел ${electrical.cableType} (${tMaxMain}°C). Увеличьте длину термовставки или класс основного кабеля.`
      );
    }
  }

  if (insertLengthM > 0 && maxCoreTempInsertC > tMaxInsert) {
    status = 'CRITICAL';
    warnings.push(
      `Перегрев термовставки ${insertType} (жила ${maxCoreTempInsertC.toFixed(0)}°C > ${tMaxInsert}°C). Выберите вставку КПпБП-180 или КПсТБП-230.`
    );
  }

  if (maxCoreTempMleC > tMaxMle) {
    status = 'CRITICAL';
    warnings.push(
      `Перегрев плоского удлинителя ${mleType} вдоль ПЭД (жила ${maxCoreTempMleC.toFixed(0)}°C > ${tMaxMle}°C). Выберите удлинитель КПсТБП-230.`
    );
  }

  // 3. Проверка падения напряжения с учётом отпаек ТМПН (промысловые пороги)
  if (voltageDropPercent > 18 || surfaceVoltageV > 3000) {
    if (status !== 'CRITICAL') status = 'WARNING';
    warnings.push(
      `Высокое падение напряжения в кабеле: ${Math.round(voltageDropV)} В (${voltageDropPercent.toFixed(1)}%, потери ${cableLossKW.toFixed(1)} кВт). ${
        nextSection
          ? `Рекомендуется увеличить сечение до ${nextSection} мм² или выбрать более высоковольтный ПЭД.`
          : 'Рекомендуется выбрать более высоковольтный ПЭД.'
      }`
    );
  } else if (voltageDropPercent > 12 && status === 'OPTIMAL') {
    status = 'ACCEPTABLE';
  }

  let statusMessage = `Ток ${workCurrentA.toFixed(1)}/${allowableCurrentA.toFixed(0)} А, падение ${voltageDropPercent.toFixed(1)}% (компенс. ТМПН), изоляция в норме.`;
  if (status === 'CRITICAL') {
    statusMessage = warnings[0] || 'Превышены допустимые параметры кабельной линии.';
  } else if (status === 'WARNING') {
    statusMessage = warnings[0] || `Высокие потери в кабеле (${cableLossKW.toFixed(1)} кВт).`;
  } else if (status === 'ACCEPTABLE') {
    statusMessage = `Падение ${voltageDropPercent.toFixed(1)}% штатно компенсируется отпайкой ТМПН (${Math.round(surfaceVoltageV)} В), потери ${cableLossKW.toFixed(1)} кВт.${
      nextSection ? ` Для экономии энергии можно сравнить с 3×${nextSection} мм².` : ''
    }`;
  }

  return {
    workCurrentA,
    allowableCurrentA,
    rTotalOhm,
    voltageDropV,
    voltageDropPercent,
    surfaceVoltageV,
    cableLossKW,
    spliceTempC,
    maxCoreTempMainC,
    maxCoreTempInsertC,
    maxCoreTempMleC,
    mainLengthM,
    insertLengthM,
    mleLengthM,
    status,
    statusMessage,
    warnings
  };
}

export interface EvaluationOptions {
  motorPreference?: MotorPreference;
  manualMotorId?: string;
  manualHydroId?: string;
}

/**
 * Коэффициент перевода глубины по стволу (MD) в вертикальную глубину (TVD)
 */
export function getTvdFactor(inclinationDeg?: number): number {
  const angle = Math.max(0, Math.min(80, inclinationDeg || 0));
  return Math.cos((angle * Math.PI) / 180);
}

/**
 * Расчет плотности и реологии пластовой смеси
 */
export function calculateMixtureProperties(fluid: FluidProperties) {
  const wc = Math.max(0, Math.min(100, fluid.waterCut)) / 100;
  const rhoMix = fluid.oilDensity * (1 - wc) + fluid.waterDensity * wc;

  // Эффективная вязкость смеси с учетом инверсии фаз (эмпирическая модель Велфлина / ВНИИнефть)
  let mixVisc = fluid.oilViscosity;
  if (wc < 0.65) {
    // Прямая эмульсия "вода в нефти" (вязкость возрастает)
    mixVisc = fluid.oilViscosity * (1 + 2.5 * wc + 10 * Math.pow(wc, 2));
  } else {
    // Инверсия фаз в "нефть в воде" (вязкость стремится к водной фазе)
    const waterVisc = 1.0;
    mixVisc = waterVisc * (1 + 2.5 * (1 - wc));
  }

  return { rhoMix, mixVisc };
}

/**
 * Расчет гидравлических потерь в НКТ по формуле Дарси-Вейсбаха и Альтшуля (по измеренной длине MD)
 */
export function calculateTubingHydraulics(
  qM3Day: number,
  lTubingM: number,
  dInnerMm: number,
  roughnessMm: number,
  rhoMixKgM3: number,
  viscMixCP: number
) {
  const dM = Math.max(0.02, dInnerMm / 1000);
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4;
  const qM3Sec = Math.max(0, qM3Day) / 86400;
  const velocityMs = qM3Sec / areaM2;

  // Динамическая вязкость в Па·с
  const muPaS = Math.max(0.0002, viscMixCP * 1e-3);

  // Число Рейнольдса
  const re = Math.max(1, (rhoMixKgM3 * velocityMs * dM) / muPaS);

  // Коэффициент гидравлического трения (формула Альтшуля с переходом ламинарный/турбулентный)
  let lambda: number;
  if (qM3Day <= 0.01) {
    lambda = 0;
  } else if (re < 2320) {
    lambda = 64 / re;
  } else {
    const kRel = (roughnessMm / 1000) / dM;
    lambda = 0.11 * Math.pow(kRel + 68 / re, 0.25);
  }

  // Потери напора на трение (Дарси-Вейсбах)
  const hFrictionPipe = lambda * (lTubingM / dM) * (Math.pow(velocityMs, 2) / (2 * G));

  // Местные сопротивления (обратный клапан КО, сбивной клапан КС, муфты) ~ 4.5 м при рабочем расходе
  const hLocalLosses = qM3Day > 0.1 ? 4.5 : 0;
  const totalFriction = hFrictionPipe + hLocalLosses;

  return {
    velocityMs,
    reynolds: re,
    lambda,
    totalFriction
  };
}

/**
 * Расчет требуемого напора скважины (TDH) по вертикальному подъему TVD
 */
export function calculateTDH(
  hDynamicTvdM: number,
  pBufAtm: number,
  rhoMixKgM3: number,
  hFrictionM: number
) {
  // Геометрический подъем (TVD)
  const hStaticLift = hDynamicTvdM;

  // Напор, эквивалентный буферному давлению устья (м столба жидкости)
  const pBufPa = pBufAtm * 101325;
  const hWellheadHead = pBufPa / (rhoMixKgM3 * G);

  // Итоговый динамический напор (TDH) с технологическим запасом 3%
  const tdhBase = hStaticLift + hWellheadHead + hFrictionM;
  const totalDynamicHead = tdhBase * 1.03;

  return {
    hStaticLift,
    hWellheadHead,
    hFriction: hFrictionM,
    totalDynamicHead
  };
}

/**
 * Оценка давления на приеме (по TVD), доли свободного газа с учетом обводненности и деградации напора
 */
export function calculateIntakeConditions(
  depthPumpTvdM: number,
  hDynamicTvdM: number,
  pAnnularAtm: number,
  rhoMixKgM3: number,
  fluid: FluidProperties,
  tReservoirC: number
) {
  const submergence = Math.max(0, depthPumpTvdM - hDynamicTvdM);
  const hydrostaticIntakePa = rhoMixKgM3 * G * submergence;
  const pAnnularPa = pAnnularAtm * 101325;

  const pIntakePa = Math.max(101325, pAnnularPa + hydrostaticIntakePa);
  const pIntakeAtm = pIntakePa / 101325;

  // Объемная доля свободного газа по нефти: газ растворен только в нефтяной фазе
  let freeGasPct = 0;
  if (pIntakeAtm < fluid.pSaturation && fluid.gasRatio > 0) {
    const deltaP = fluid.pSaturation - pIntakeAtm;
    const degasRatio = Math.min(0.88, deltaP / Math.max(1, fluid.pSaturation));
    const oilFraction = Math.max(0, 1 - Math.max(0, Math.min(100, fluid.waterCut)) / 100);
    // Пересчет ГОФ (м³/т дегазированной нефти) на 1 м³ смеси с учетом обводненности и плотности нефти
    const oilTonsPerM3Mix = oilFraction * (fluid.oilDensity / 1000);
    const vGasFree =
      fluid.gasRatio *
      oilTonsPerM3Mix *
      degasRatio *
      (101325 / pIntakePa) *
      ((273 + tReservoirC) / 293);
    const vLiquid = 1.0;
    freeGasPct = Math.min(78, Math.max(0, (vGasFree / (vGasFree + vLiquid)) * 100));
  }

  let gasSeparatorRequired = false;
  let gasSeparatorType: 'НЕТ' | 'МГ (Сепаратор)' | 'МГД (Диспергатор)' | 'Мультифазный' = 'НЕТ';

  if (freeGasPct > 45) {
    gasSeparatorRequired = true;
    gasSeparatorType = 'Мультифазный';
  } else if (freeGasPct > 22) {
    gasSeparatorRequired = true;
    gasSeparatorType = 'МГД (Диспергатор)';
  } else if (freeGasPct > 6) {
    gasSeparatorRequired = true;
    gasSeparatorType = 'МГ (Сепаратор)';
  }

  // Коэффициент деградации напора ступеней от остаточного несепарированного газа (модель Turpin)
  const separatorEfficiency =
    gasSeparatorType === 'Мультифазный' ? 0.85 :
    gasSeparatorType === 'МГД (Диспергатор)' ? 0.80 :
    gasSeparatorType === 'МГ (Сепаратор)' ? 0.78 : 0;
  const residualGasPct = freeGasPct * (1 - separatorEfficiency);
  const gasHeadDegradationFactor =
    residualGasPct > 8
      ? Math.max(0.65, 1 - 0.011 * (residualGasPct - 8))
      : 1.0;

  return {
    submergenceMeters: submergence,
    intakePressureAtm: pIntakeAtm,
    freeGasIntakeFraction: freeGasPct,
    gasHeadDegradationFactor,
    gasSeparatorRequired,
    gasSeparatorType
  };
}

/**
 * Коррекция на вязкость (ANSI/HI 9.6.7)
 */
export function getViscosityCorrections(mixViscCP: number, qNomM3Day: number) {
  if (mixViscCP <= 8) {
    return { cH: 1.0, cQ: 1.0, cEff: 1.0, cP: 1.0 };
  }

  const qM3H = Math.max(0.5, qNomM3Day / 24);
  const b = (2.6 * Math.pow(mixViscCP - 5, 0.5)) / Math.pow(qM3H, 0.25);

  const cH = Math.max(0.70, 1 - 0.011 * b);
  const cQ = Math.max(0.75, 1 - 0.009 * b);
  const cEff = Math.max(0.45, 1 - 0.026 * b);
  const cP = cH / cEff;

  return { cH, cQ, cEff, cP };
}

/**
 * Подбор оптимального двигателя с учетом габарита колонны, термостойкости и ручных предпочтений
 */
function selectMotorForWell(
  reqMotorPowerKW: number,
  pump: PumpModel,
  dCasInMm: number,
  tReservoirC: number,
  options?: EvaluationOptions
): MotorModel {
  if (options?.manualMotorId) {
    const manual = MOTOR_DATABASE.find(m => m.id === options.manualMotorId);
    if (manual) return manual;
  }

  const pref = options?.motorPreference || 'auto';
  const highTempRequired = tReservoirC + 20 > 130;

  // Фильтруем по габариту колонны (радиальный зазор мин. 3 мм -> 6 мм по диаметру)
  const casingFitting = MOTOR_DATABASE.filter(m => m.outerDiam <= dCasInMm - 6);
  const pool = casingFitting.length > 0 ? casingFitting : MOTOR_DATABASE;

  // Фильтр по типу ПЭД / ВПЭД:
  // В режиме 'auto' при высокой температуре (>110°C) выбираем термостойкий ВПЭД,
  // а в стандартных скважинах — серийный асинхронный ПЭД
  let typeFiltered = pool;
  if (pref === 'впэд' || (pref === 'auto' && highTempRequired)) {
    const pmsmPool = pool.filter(m => m.motorType === 'впэд');
    if (pmsmPool.length > 0) typeFiltered = pmsmPool;
  } else if (pref === 'пэд' || (pref === 'auto' && !highTempRequired)) {
    const asyncPool = pool.filter(m => m.motorType === 'пэд');
    if (asyncPool.length > 0) typeFiltered = asyncPool;
  }

  // Кандидаты с достаточной мощностью
  const powerFitting = typeFiltered.filter(m => m.powerRatingKW >= reqMotorPowerKW);
  if (powerFitting.length > 0) {
    // Предпочитаем минимальную достаточную мощность, а при равной — ближе по габариту к насосу
    return [...powerFitting].sort((a, b) => {
      const powerDiff = a.powerRatingKW - b.powerRatingKW;
      if (Math.abs(powerDiff) > 2) return powerDiff;
      return Math.abs(a.outerDiam - pump.outerDiam) - Math.abs(b.outerDiam - pump.outerDiam);
    })[0];
  }

  // Если среди выбранного типа не хватило мощности (например, для малогабаритного ВПЭД-81 > 70 кВт), пробуем общий пул по колонне
  const anyFitting = pool.filter(m => m.powerRatingKW >= reqMotorPowerKW);
  if (anyFitting.length > 0) {
    return [...anyFitting].sort((a, b) => a.powerRatingKW - b.powerRatingKW)[0];
  }

  return [...pool].sort((a, b) => b.powerRatingKW - a.powerRatingKW)[0];
}

/**
 * Подбор протектора гидрозащиты из каталога
 */
function selectHydroForWell(
  pump: PumpModel,
  dCasInMm: number,
  tReservoirC: number,
  options?: EvaluationOptions
): HydroModel {
  if (options?.manualHydroId) {
    const manual = HYDRO_DATABASE.find(h => h.id === options.manualHydroId);
    if (manual) return manual;
  }

  const fitting = HYDRO_DATABASE.filter(h => h.outerDiam <= dCasInMm - 6);
  const pool = fitting.length > 0 ? fitting : HYDRO_DATABASE;
  const tempFitting = pool.filter(h => h.tempMaxC >= tReservoirC + 15);
  const finalPool = tempFitting.length > 0 ? tempFitting : pool;

  return [...finalPool].sort((a, b) => {
    const diamDiffA = Math.abs(a.outerDiam - pump.outerDiam);
    const diamDiffB = Math.abs(b.outerDiam - pump.outerDiam);
    if (diamDiffA !== diamDiffB) return diamDiffA - diamDiffB;
    return b.axialLoadKg - a.axialLoadKg;
  })[0];
}

/**
 * Расчет конкретного насоса и компоновки УЭЦН
 */
export function evaluatePumpModel(
  pump: PumpModel,
  well: WellParameters,
  fluid: FluidProperties,
  completion: CompletionGeometry,
  electrical: ElectricalParams,
  options?: EvaluationOptions
): CalculationResult {
  const { rhoMix, mixVisc } = calculateMixtureProperties(fluid);

  // Безопасные значения параметров во время промежуточного набора текста
  const safeQ = Math.max(0.1, well.qTarget || 0.1);
  const safeDepthMD = Math.max(0, well.depthPump || 0);
  const safeFreq = Math.max(20, electrical.frequency || 50);

  // Пересчет MD -> TVD с учетом зенитного угла
  const tvdFactor = getTvdFactor(well.inclinationDeg);
  const tvdDynamicM = well.hDynamic * tvdFactor;
  const tvdPumpM = safeDepthMD * tvdFactor;

  // Гидравлика в НКТ считается по измеренной длине ствола (MD)
  const tubing = calculateTubingHydraulics(
    safeQ,
    safeDepthMD,
    completion.tubingInnerDiam,
    completion.tubingRoughness,
    rhoMix,
    mixVisc
  );

  // Требуемый TDH считается по вертикальному подъему (TVD) + трение по MD
  const tdhInfo = calculateTDH(
    tvdDynamicM,
    well.pBuf,
    rhoMix,
    tubing.totalFriction
  );

  // Условия на приеме (по вертикальному погружению TVD и с учетом доли нефти в газовом факторе)
  const intake = calculateIntakeConditions(
    tvdPumpM,
    tvdDynamicM,
    well.pAnnular,
    rhoMix,
    fluid,
    well.tReservoir
  );

  // Коэффициент частоты
  const kFreq = safeFreq / 50;

  // Вязкостная коррекция
  const viscCorr = getViscosityCorrections(mixVisc, pump.qNom);

  // Оценка напора и мощности 1 ступени при заданной подаче и частоте
  const qEquiv = safeQ / kFreq;
  const [a0, a1, a2] = pump.coeffH;
  const [b0, b1, b2] = pump.coeffP;

  const hStageRaw50 = a0 - a1 * qEquiv - a2 * Math.pow(qEquiv, 2);
  const isHydraulicHeadZero = hStageRaw50 <= 0;
  const hStage50 = Math.max(0, hStageRaw50);
  const pStage50 = Math.max(0.02, b0 + b1 * qEquiv + b2 * Math.pow(qEquiv, 2));

  const hStageReal = isHydraulicHeadZero
    ? 0
    : hStage50 * Math.pow(kFreq, 2) * viscCorr.cH * intake.gasHeadDegradationFactor;
  const pStageReal = pStage50 * Math.pow(kFreq, 3) * (rhoMix / 1000) * viscCorr.cP;

  // Опорный напор на правой границе рабочего диапазона (для оценки, если точка ушла за H=0)
  const hStageAtQMax50 = Math.max(0.5, a0 - a1 * pump.qMax - a2 * Math.pow(pump.qMax, 2));
  const hStageSizing = isHydraulicHeadZero
    ? hStageAtQMax50 * Math.pow(kFreq, 2) * viscCorr.cH * intake.gasHeadDegradationFactor
    : Math.max(0.5, hStageReal);

  // Необходимое число ступеней (ограничение физического секционирования не более 8 секций для аварийных случаев)
  const maxAllowedStages = pump.maxStagesPerSection * 8;
  const rawTotalStages = Math.max(1, Math.ceil(tdhInfo.totalDynamicHead / hStageSizing));
  const stagesCapped = rawTotalStages > maxAllowedStages;
  const totalStages = isHydraulicHeadZero
    ? Math.min(pump.maxStagesPerSection * 6, rawTotalStages)
    : Math.min(maxAllowedStages, rawTotalStages);

  // Разбивка на секции
  const numSections = Math.ceil(totalStages / pump.maxStagesPerSection);
  const stagesPerSection: number[] = [];
  let remainingStages = totalStages;
  for (let i = 0; i < numSections; i++) {
    const s = Math.min(remainingStages, Math.ceil(totalStages / numSections));
    stagesPerSection.push(s);
    remainingStages -= s;
  }

  // Общая длина насоса
  const pumpModuleLength = (totalStages * pump.stageLength) / 1000 + numSections * 0.8;

  // Характеристики всей сборки (Full String Performance)
  const fullStringHeadAtQ = totalStages * hStageReal;
  const rawShaftPower = totalStages * pStageReal;

  // Дополнительные механические потери в гидрозащите и газосепараторе
  const pProtector = 2.5 * Math.pow(kFreq, 2);
  const pSeparator = intake.gasSeparatorRequired ? 3.5 * Math.pow(kFreq, 2) : 0;
  const fullStringShaftPowerKW = rawShaftPower + pProtector + pSeparator;

  // Полезная гидравлическая мощность
  const qM3Sec = safeQ / 86400;
  const fullStringHydraulicPowerKW = (rhoMix * G * qM3Sec * fullStringHeadAtQ) / 1000;

  // КПД всей насосной установки
  const fullStringEfficiency = isHydraulicHeadZero
    ? 0
    : Math.min(
        88,
        Math.max(5, (fullStringHydraulicPowerKW / Math.max(0.1, fullStringShaftPowerKW)) * 100)
      );

  // Напор на закрытую задвижку (Q = 0)
  const shutoffHead = totalStages * a0 * Math.pow(kFreq, 2) * viscCorr.cH * intake.gasHeadDegradationFactor;

  // Давление нагнетания на выкиде насоса
  const dischargePressureAtm = intake.intakePressureAtm + (rhoMix * G * fullStringHeadAtQ) / 101325;

  // Внутренний диаметр эксплуатационной колонны
  const dCasInMm = completion.casingOuterDiam - 2 * completion.casingWallThickness;
  const isCasingCompatible = pump.outerDiam <= dCasInMm - 4 && dCasInMm >= pump.minCasingID;

  // Проверка прочности вала насоса
  const shaftLimitKW = pump.maxPwrSoft ?? 220;
  const shaftLoadPercent = (fullStringShaftPowerKW / shaftLimitKW) * 100;
  const shaftOverload = shaftLoadPercent > 100;

  // Подбор ПЭД и гидрозащиты с учетом габарита колонны и температуры
  const reqMotorPower = fullStringShaftPowerKW * 1.15;
  const motor = selectMotorForWell(reqMotorPower, pump, dCasInMm, well.tReservoir, options);
  const hydro = selectHydroForWell(pump, dCasInMm, well.tReservoir, options);

  const motorLoadPercent = (fullStringShaftPowerKW / motor.powerRatingKW) * 100;
  let motorLoadStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'OVERLOAD' | 'UNDERLOAD' = 'OPTIMAL';
  if (motorLoadPercent > 105) motorLoadStatus = 'OVERLOAD';
  else if (motorLoadPercent > 92) motorLoadStatus = 'ACCEPTABLE';
  else if (motorLoadPercent < 55) motorLoadStatus = 'UNDERLOAD';

  const motorMaxTemp = motor.tempMaxC ?? 130;
  const motorThermalOverload = well.tReservoir + 20 > motorMaxTemp;

  // Длина и масса всей установки (насос + газосепаратор + протектор + ПЭД + ТМС)
  const separatorLength = intake.gasSeparatorRequired ? 1.4 : 0.6;
  const tmsLength = 0.7;
  const totalStringLength = pumpModuleLength + separatorLength + hydro.lengthM + motor.lengthM + tmsLength;
  const totalWeightKg = totalStages * 1.8 + numSections * 45 + hydro.massKg + motor.massKg + 85;

  // Скорость восходящего потока вдоль двигателя (охлаждение ПЭД)
  const dCasInM = dCasInMm / 1000;
  const dMotorM = motor.outerDiam / 1000;

  const annularAreaM2 = Math.max(0.001, (Math.PI / 4) * (Math.pow(dCasInM, 2) - Math.pow(dMotorM, 2)));
  const coolingVelocityMs = qM3Sec / annularAreaM2;

  let coolingStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
  let coolingMessage = 'Охлаждение двигателя в норме (> 0.15 м/с)';
  let shroudRequired = false;

  // Проверка спуска ниже перфорации
  const isBelowPerf = safeDepthMD > well.perfTop;

  if (isBelowPerf) {
    coolingStatus = 'CRITICAL';
    coolingMessage = 'Насос спущен в/ниже зоны перфорации! Поток не омывает двигатель. Требуется кожух охлаждения (шрауд).';
    shroudRequired = true;
  } else if (coolingVelocityMs < 0.08) {
    coolingStatus = 'CRITICAL';
    coolingMessage = `Критически низкая скорость потока (${coolingVelocityMs.toFixed(3)} м/с < 0.1 м/с). Высокий риск перегрева ПЭД! Обязателен кожух.`;
    shroudRequired = true;
  } else if (coolingVelocityMs < 0.12) {
    coolingStatus = 'WARNING';
    coolingMessage = `Пониженная скорость потока (${coolingVelocityMs.toFixed(3)} м/с). Рекомендуется установка кожуха или центрирующих фонарей.`;
    shroudRequired = true;
  } else if (coolingVelocityMs < 0.16) {
    coolingStatus = 'ACCEPTABLE';
    coolingMessage = `Удовлетворительная скорость потока (${coolingVelocityMs.toFixed(2)} м/с).`;
  }

  // Расчет составной кабельной линии (удлинитель + термовставка + основной кабель)
  const cableCalc = calculateCompositeCableLine(well, electrical, motor, fullStringShaftPowerKW);
  const cableVoltageDropV = cableCalc.voltageDropV;
  const cableVoltageDropPercent = cableCalc.voltageDropPercent;
  const surfaceVoltageV = cableCalc.surfaceVoltageV;

  const motorActivePowerKW = fullStringShaftPowerKW / (motor.efficiency / 100);
  const cableLossKW = cableCalc.cableLossKW;
  const totalSurfacePowerKW = motorActivePowerKW + cableLossKW;

  const dailyEnergyKWh = totalSurfacePowerKW * 24;
  const specificEnergyKWhM3 = dailyEnergyKWh / safeQ;

  // Оценка качества подбора (Match Index)
  const qNomAtFreq = pump.qNom * kFreq;
  const qMinAtFreq = pump.qMin * kFreq;
  const qMaxAtFreq = pump.qMax * kFreq;

  const isWithinOperatingRange = safeQ >= qMinAtFreq && safeQ <= qMaxAtFreq;

  const devFromBep = Math.abs(safeQ - qNomAtFreq) / qNomAtFreq;
  let score = Math.max(20, Math.round(100 - devFromBep * 75));

  // Инженерные штрафы и бонусы
  if (!isWithinOperatingRange) score -= 25;
  if (numSections > 4) score -= Math.min(24, (numSections - 4) * 6);
  if (pump.effNom >= 60) score += 3;
  if (coolingStatus === 'CRITICAL') score -= 20;
  else if (coolingStatus === 'WARNING') score -= 10;
  if (motorLoadStatus === 'OVERLOAD') score -= 25;
  if (shaftOverload) score -= 30;
  if (motorThermalOverload) score -= 20;
  if (!isCasingCompatible || isHydraulicHeadZero) score = 0;

  score = isCasingCompatible && !isHydraulicHeadZero ? Math.max(5, Math.min(100, score)) : 0;

  // Предупреждения
  const warnings: string[] = [];
  if (isHydraulicHeadZero) {
    warnings.push(
      `КРИТИЧЕСКОЕ НЕСООТВЕТСТВИЕ ПОДАЧИ: при дебите ${safeQ} м³/сут насос ${pump.name} (Qмакс=${qMaxAtFreq.toFixed(0)} м³/сут) выходит за границу нулевого напора (H = 0 м). Выберите насос большей производительности.`
    );
  }
  if (stagesCapped) {
    warnings.push(
      `Расчетное число ступеней превышает физический предел секционирования (${rawTotalStages} ст. / >8 секций). Напор одной ступени недостаточен для данной глубины — выберите более высоконапорный насос.`
    );
  } else if (numSections > 5 && !isHydraulicHeadZero) {
    warnings.push(
      `Компоновка содержит ${numSections} секций (${totalStages} ст., L=${pumpModuleLength.toFixed(1)} м), что усложняет спуск и монтаж. Рекомендуется типоразмер с более высоким напором ступени.`
    );
  }
  if (!isCasingCompatible) {
    warnings.push(`Насос D=${pump.outerDiam} мм не проходит в колонну Dвн=${dCasInMm.toFixed(1)} мм (мин. требование ${pump.minCasingID} мм).`);
  }
  if (!isWithinOperatingRange && !isHydraulicHeadZero) {
    warnings.push(`Целевой дебит ${safeQ} м³/сут вне рекомендованного диапазона (${qMinAtFreq.toFixed(0)} - ${qMaxAtFreq.toFixed(0)} м³/сут).`);
  }
  if (shaftOverload) {
    warnings.push(`ПРЕВЫШЕНИЕ ПРОЧНОСТИ ВАЛА НАСОСА: ${fullStringShaftPowerKW.toFixed(1)} кВт > ${shaftLimitKW} кВт (${shaftLoadPercent.toFixed(0)}%). Необходимо снизить частоту, выбрать габарит крупнее или усиленный вал.`);
  }
  if (motorThermalOverload) {
    warnings.push(`Пластовая температура (${well.tReservoir}°C) близка или превышает предел термостойкости двигателя ${motor.name} (${motorMaxTemp}°C). Выберите ВПЭД (до 230°C).`);
  }
  if (coolingStatus === 'CRITICAL' || coolingStatus === 'WARNING') {
    warnings.push(coolingMessage);
  }
  if (intake.intakePressureAtm < 15) {
    warnings.push(`Низкое давление на приеме (${intake.intakePressureAtm.toFixed(1)} атм). Возможен срыв подачи.`);
  }
  if (intake.freeGasIntakeFraction > 15) {
    warnings.push(`Высокое содержание свободного газа на приеме (${intake.freeGasIntakeFraction.toFixed(1)}%). Необходим ${intake.gasSeparatorType}.`);
  }
  if (cableCalc.warnings.length > 0) {
    warnings.push(...cableCalc.warnings);
  }

  return {
    pump,
    motor,
    hydro,
    mixDensity: rhoMix,
    mixViscosity: mixVisc,
    tvdFactor,
    tvdDynamicM,
    tvdPumpM,
    hStaticLift: tdhInfo.hStaticLift,
    hWellheadHead: tdhInfo.hWellheadHead,
    hFriction: tdhInfo.hFriction,
    flowVelocityTubing: tubing.velocityMs,
    reynoldsTubing: tubing.reynolds,
    frictionFactor: tubing.lambda,
    totalDynamicHead: tdhInfo.totalDynamicHead,
    kFreq,
    hStageReal,
    pStageReal,
    totalStages,
    numSections,
    stagesPerSection,
    totalPumpLength: pumpModuleLength,
    totalStringLength,
    totalWeightKg,
    fullStringHeadAtQ,
    fullStringShaftPowerKW,
    fullStringHydraulicPowerKW,
    fullStringEfficiency,
    shutoffHead,
    dischargePressureAtm,
    shaftLimitKW,
    shaftLoadPercent,
    shaftOverload,
    submergenceMeters: intake.submergenceMeters,
    intakePressureAtm: intake.intakePressureAtm,
    freeGasIntakeFraction: intake.freeGasIntakeFraction,
    gasHeadDegradationFactor: intake.gasHeadDegradationFactor,
    gasSeparatorRequired: intake.gasSeparatorRequired,
    gasSeparatorType: intake.gasSeparatorType,
    coolingVelocityMs,
    coolingStatus,
    coolingMessage,
    shroudRequired,
    motorThermalOverload,
    motorLoadPercent,
    motorLoadStatus,
    cableVoltageDropV,
    cableVoltageDropPercent,
    surfaceVoltageV,
    dailyEnergyKWh,
    specificEnergyKWhM3,
    cableWorkCurrentA: cableCalc.workCurrentA,
    cableAllowableCurrentA: cableCalc.allowableCurrentA,
    cableLossKW: cableCalc.cableLossKW,
    cableTotalResistanceOhm: cableCalc.rTotalOhm,
    cableSpliceTempC: cableCalc.spliceTempC,
    cableMaxCoreTempC: cableCalc.maxCoreTempMainC,
    cableMainLengthM: cableCalc.mainLengthM,
    cableInsertLengthM: cableCalc.insertLengthM,
    cableMleLengthM: cableCalc.mleLengthM,
    cableStatus: cableCalc.status,
    cableStatusMessage: cableCalc.statusMessage,
    matchScore: score,
    isWithinOperatingRange,
    isCasingCompatible,
    warnings
  };
}

/**
 * Генерация точек характеристик всей сборки (Full String Q-H, Q-P, Q-Eff)
 */
export function generateFullStringCurves(
  result: CalculationResult,
  steps = 50,
  targetFreq?: number
): CurvePoint[] {
  const {
    pump,
    totalStages,
    kFreq: currentKFreq,
    mixDensity,
    mixViscosity,
    gasHeadDegradationFactor,
    gasSeparatorRequired
  } = result;
  const k = targetFreq ? targetFreq / 50 : currentKFreq;
  const viscCorr = getViscosityCorrections(mixViscosity, pump.qNom);

  const qMinPlot = 0;
  const qMaxPlot = pump.qMax * k * 1.35;
  const step = (qMaxPlot - qMinPlot) / steps;

  const [a0, a1, a2] = pump.coeffH;
  const [b0, b1, b2] = pump.coeffP;

  const points: CurvePoint[] = [];

  for (let q = 0; q <= qMaxPlot; q += step) {
    const qEq = q / k;

    const h1 = Math.max(0, (a0 - a1 * qEq - a2 * Math.pow(qEq, 2)) * Math.pow(k, 2) * viscCorr.cH * gasHeadDegradationFactor);
    const hTotal = h1 * totalStages;

    const p1 = Math.max(0.05, (b0 + b1 * qEq + b2 * Math.pow(qEq, 2)) * Math.pow(k, 3) * (mixDensity / 1000) * viscCorr.cP);
    const pProtector = 2.5 * Math.pow(k, 2);
    const pSeparator = gasSeparatorRequired ? 3.5 * Math.pow(k, 2) : 0;
    const pShaft = p1 * totalStages + pProtector + pSeparator;

    const qM3Sec = q / 86400;
    const hydrPower = (mixDensity * G * qM3Sec * hTotal) / 1000;
    const eff = pShaft > 0 ? Math.min(88, Math.max(0, (hydrPower / pShaft) * 100)) : 0;

    points.push({
      q: Math.round(q * 10) / 10,
      hTotal: Math.round(hTotal * 10) / 10,
      pShaft: Math.round(pShaft * 10) / 10,
      efficiency: Math.round(eff * 10) / 10
    });
  }

  return points;
}

/**
 * Кривая противодавления системы (System Head Curve)
 */
export function generateSystemHeadCurve(
  result: CalculationResult,
  well: WellParameters,
  completion: CompletionGeometry,
  maxQ: number
): { q: number; hReq: number }[] {
  const points: { q: number; hReq: number }[] = [];
  const steps = 30;
  const step = maxQ / steps;

  const hBase = result.hStaticLift + result.hWellheadHead;

  for (let q = 0; q <= maxQ; q += step) {
    const hydr = calculateTubingHydraulics(
      q,
      well.depthPump,
      completion.tubingInnerDiam,
      completion.tubingRoughness,
      result.mixDensity,
      result.mixViscosity
    );
    const hReq = hBase + hydr.totalFriction;
    points.push({
      q: Math.round(q * 10) / 10,
      hReq: Math.round(hReq * 10) / 10
    });
  }

  return points;
}

/**
 * =========================================================================
 * РЕЖИМ ЭКСПЛУАТАЦИИ (FIELD OPERATION & VFD REGULATION ANALYSIS)
 * =========================================================================
 */

/**
 * Расчет базового коэффициента продуктивности пласта K_прод по скважинным параметрам (с учетом TVD)
 */
export function estimateProductivityIndex(
  well: WellParameters,
  fluid: FluidProperties
): number {
  const { rhoMix } = calculateMixtureProperties(fluid);
  const tvdFactor = getTvdFactor(well.inclinationDeg);
  const deltaH = Math.max(10, (well.hDynamic - well.hStatic) * tvdFactor);
  const deltaPAtm = (deltaH * rhoMix * G) / 101325;
  const kProd = well.qTarget / Math.max(1, deltaPAtm);
  return Math.max(0.1, Math.round(kProd * 100) / 100);
}

/**
 * Расчет рабочей точки в режиме эксплуатации
 */
export function calculateOperatingPoint(
  pump: PumpModel,
  motor: MotorModel,
  well: WellParameters,
  fluid: FluidProperties,
  completion: CompletionGeometry,
  electrical: ElectricalParams,
  oper: OperationParameters
): OperatingPointResult {
  const { rhoMix, mixVisc } = calculateMixtureProperties(fluid);
  const viscCorr = getViscosityCorrections(mixVisc, pump.qNom);
  const kFreq = oper.operatingFrequency / 50;
  const tvdFactor = getTvdFactor(well.inclinationDeg);

  const [a0, a1, a2] = pump.coeffH;
  const [b0, b1, b2] = pump.coeffP;

  // Оценочный фактор газа по текущему погружению/затрубу
  const approxSubmergenceTvd = Math.max(0, (well.depthPump - well.hDynamic) * tvdFactor);
  const approxPIntake = oper.pAnnularOper + (approxSubmergenceTvd * rhoMix * G) / 101325;
  const approxIntake = calculateIntakeConditions(
    well.depthPump * tvdFactor,
    well.hDynamic * tvdFactor,
    oper.pAnnularOper,
    rhoMix,
    fluid,
    well.tReservoir
  );

  const getChokeHeadLoss = (q: number) => {
    if (oper.chokeDiameterMm <= 0 || q <= 0) return 0;
    const dChokeM = oper.chokeDiameterMm / 1000;
    const aChokeM2 = (Math.PI * Math.pow(dChokeM, 2)) / 4;
    const vChoke = (q / 86400) / aChokeM2;
    const hLoss = 1.25 * (Math.pow(vChoke, 2) / (2 * G));
    return Math.min(250, hLoss);
  };

  const getSystemHead = (q: number) => {
    const deltaP = q / Math.max(0.01, oper.productivityIndex);
    const pWf = Math.max(0, well.pReservoir - deltaP);
    const hStaticTvd = well.hStatic * tvdFactor;
    const hDynamicTvd = hStaticTvd + ((well.pReservoir - pWf) * 101325) / (rhoMix * G);

    const hBuf = (oper.pBufOper * 101325) / (rhoMix * G);
    const hAnn = (oper.pAnnularOper * 101325) / (rhoMix * G);
    const hWellheadNet = Math.max(0, hBuf - hAnn);

    const tubing = calculateTubingHydraulics(
      q,
      well.depthPump,
      completion.tubingInnerDiam,
      completion.tubingRoughness,
      rhoMix,
      mixVisc
    );

    const hChoke = getChokeHeadLoss(q);
    return hDynamicTvd + hWellheadNet + tubing.totalFriction + hChoke;
  };

  const solveForIntake = (gasFactor: number) => {
    const getHeadAtQ = (q: number) => {
      if (q < 0) return oper.fixedStages * a0 * Math.pow(kFreq, 2) * viscCorr.cH * gasFactor;
      const qEq = q / kFreq;
      const h1 = (a0 - a1 * qEq - a2 * Math.pow(qEq, 2)) * Math.pow(kFreq, 2) * viscCorr.cH * gasFactor;
      return oper.fixedStages * Math.max(0, h1);
    };

    const sHead = oper.fixedStages * a0 * Math.pow(kFreq, 2) * viscCorr.cH * gasFactor;
    const hZero = getSystemHead(0);
    let qRes = 0;
    let hRes = sHead;

    if (sHead > hZero) {
      let qLow = 0;
      let qHigh = Math.max(20, pump.qMax * kFreq * 1.6);
      while (getHeadAtQ(qHigh) > getSystemHead(qHigh) && qHigh < 2500) {
        qHigh += 40;
      }
      for (let iter = 0; iter < 40; iter++) {
        const qMid = (qLow + qHigh) / 2;
        if (getHeadAtQ(qMid) - getSystemHead(qMid) > 0) qLow = qMid;
        else qHigh = qMid;
      }
      qRes = Math.max(0, (qLow + qHigh) / 2);
      hRes = getHeadAtQ(qRes);
    }
    return { qRes, hRes, sHead };
  };

  // Первое приближение по базовому динамическому уровню + уточнение по равновесному погружению
  const pass1 = solveForIntake(approxIntake.gasHeadDegradationFactor);
  const deltaP1 = pass1.qRes / Math.max(0.01, oper.productivityIndex);
  const pWf1 = Math.max(0, well.pReservoir - deltaP1);
  const dynTvd1 = well.hStatic * tvdFactor + ((well.pReservoir - pWf1) * 101325) / (rhoMix * G);
  const intakePass2 = calculateIntakeConditions(
    well.depthPump * tvdFactor,
    dynTvd1,
    oper.pAnnularOper,
    rhoMix,
    fluid,
    well.tReservoir
  );
  const pass2 = solveForIntake(intakePass2.gasHeadDegradationFactor);
  const actualQ = pass2.qRes;
  const actualHead = pass2.hRes;
  const shutoffHead = pass2.sHead;

  // Расчет установившихся эксплуатационных параметров в рабочей точке
  const deltaPActual = actualQ / Math.max(0.01, oper.productivityIndex);
  const pBottomholeAtm = Math.max(0, well.pReservoir - deltaPActual);
  const actualHDynamicTvd = well.hStatic * tvdFactor + ((well.pReservoir - pBottomholeAtm) * 101325) / (rhoMix * G);
  const actualHDynamicMD = actualHDynamicTvd / Math.max(0.2, tvdFactor);
  const submergenceTvdM = Math.max(0, well.depthPump * tvdFactor - actualHDynamicTvd);

  const realIntake = calculateIntakeConditions(
    well.depthPump * tvdFactor,
    actualHDynamicTvd,
    oper.pAnnularOper,
    rhoMix,
    fluid,
    well.tReservoir
  );
  const pIntakeAtm = approxPIntake >= 0 ? realIntake.intakePressureAtm : 1;
  const freeGasPct = realIntake.freeGasIntakeFraction;

  let gasSeparatorStatus = 'Газосодержание в норме';
  if (freeGasPct > 45) {
    gasSeparatorStatus = 'Критический уровень газа (>45%). Требуется мультифазный модуль';
  } else if (freeGasPct > 20) {
    gasSeparatorStatus = 'Повышенный уровень газа (>20%). Включен диспергатор';
  } else if (freeGasPct > 6) {
    gasSeparatorStatus = 'Умеренный газ (>6%). Работает сепаратор';
  }

  // Мощность и КПД
  const qEq = actualQ / kFreq;
  const p1 = Math.max(0.05, (b0 + b1 * qEq + b2 * Math.pow(qEq, 2)) * Math.pow(kFreq, 3) * (rhoMix / 1000) * viscCorr.cP);
  const pProtector = 2.5 * Math.pow(kFreq, 2);
  const pSeparator = freeGasPct > 6 ? 3.5 * Math.pow(kFreq, 2) : 0;
  const shaftPowerKW = oper.fixedStages * p1 + pProtector + pSeparator;

  const qM3Sec = actualQ / 86400;
  const hydraulicPowerKW = (rhoMix * G * qM3Sec * actualHead) / 1000;
  const efficiencyPct = shaftPowerKW > 0 ? Math.min(88, Math.max(0, (hydraulicPowerKW / shaftPowerKW) * 100)) : 0;

  // Загрузка двигателя и электрика
  const motorLoadPct = (shaftPowerKW / motor.powerRatingKW) * 100;
  let motorLoadStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'OVERLOAD' | 'UNDERLOAD' = 'OPTIMAL';
  if (motorLoadPct > 105) motorLoadStatus = 'OVERLOAD';
  else if (motorLoadPct > 92) motorLoadStatus = 'ACCEPTABLE';
  else if (motorLoadPct < 55) motorLoadStatus = 'UNDERLOAD';

  const cableCalc = calculateCompositeCableLine(well, electrical, motor, shaftPowerKW);
  const motorCurrentA = cableCalc.workCurrentA;
  const cableVoltageDropV = cableCalc.voltageDropV;
  const surfaceVoltageV = cableCalc.surfaceVoltageV;

  const motorActivePowerKW = shaftPowerKW / (motor.efficiency / 100);
  const cableLossKW = cableCalc.cableLossKW;
  const totalSurfacePowerKW = motorActivePowerKW + cableLossKW;
  const dailyEnergyKWh = totalSurfacePowerKW * 24;
  const specificEnergyKWhM3 = actualQ > 0 ? dailyEnergyKWh / actualQ : 0;

  // Скорость охлаждения
  const dCasInMm = completion.casingOuterDiam - 2 * completion.casingWallThickness;
  const annularAreaM2 = Math.max(0.001, (Math.PI / 4) * (Math.pow(dCasInMm / 1000, 2) - Math.pow(motor.outerDiam / 1000, 2)));
  const coolingVelocityMs = actualQ > 0 ? qM3Sec / annularAreaM2 : 0;

  let coolingStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
  if (actualQ === 0 || coolingVelocityMs < 0.08) {
    coolingStatus = 'CRITICAL';
  } else if (coolingVelocityMs < 0.12) {
    coolingStatus = 'WARNING';
  } else if (coolingVelocityMs < 0.16) {
    coolingStatus = 'ACCEPTABLE';
  }

  // Границы ОДР на текущей частоте
  const qMinODR = pump.qMin * kFreq;
  const qMaxODR = pump.qMax * kFreq;
  const isWithinODR = actualQ >= qMinODR && actualQ <= qMaxODR;

  // Проверка прочности вала насоса
  const shaftLimitKW = pump.maxPwrSoft ?? 220;
  const shaftOverload = shaftPowerKW > shaftLimitKW;

  // Предупреждения по эксплуатации
  const warnings: string[] = [];
  if (actualQ === 0) {
    warnings.push('Насос не продавливает систему (дебит = 0). Увеличьте частоту ЧРП или снизьте буферное давление.');
  } else if (!isWithinODR) {
    if (actualQ < qMinODR) {
      warnings.push(`Фактический дебит (${actualQ.toFixed(1)} м³/сут) ниже левой границы ОДР (${qMinODR.toFixed(1)} м³/сут). Риск перегрева и засорения.`);
    } else {
      warnings.push(`Фактический дебит (${actualQ.toFixed(1)} м³/сут) выше правой границы ОДР (${qMaxODR.toFixed(1)} м³/сут). Риск осевого износа рабочих колес вниз.`);
    }
  }

  if (shaftOverload) {
    warnings.push(`ПРЕДЕЛ ПРОЧНОСТИ ВАЛА НАСОСА: ${shaftPowerKW.toFixed(1)} кВт > ${shaftLimitKW} кВт! Снизьте частоту ЧРП во избежание обрыва вала.`);
  }
  if (motorLoadStatus === 'OVERLOAD') {
    warnings.push(`ПЕРЕГРУЗКА ДВИГАТЕЛЯ (${motorLoadPct.toFixed(1)}% от номинала ${motor.powerRatingKW} кВт). Риск срабатывания защиты по току!`);
  }
  if (coolingStatus === 'CRITICAL') {
    warnings.push(`Критически низкая скорость охлаждения ПЭД (${coolingVelocityMs.toFixed(3)} м/с). Риск термического пробоя изоляции обмоток.`);
  }
  if (pIntakeAtm < 12) {
    warnings.push(`Низкое давление на приеме (${pIntakeAtm.toFixed(1)} атм). Высокий риск срыва подачи и кавитации.`);
  }
  if (freeGasPct > 25) {
    warnings.push(`Повышенное содержание свободного газа на приеме (${freeGasPct.toFixed(1)}%). Рекомендуется приоткрыть затрубную задвижку.`);
  }
  if (cableCalc.warnings.length > 0) {
    warnings.push(...cableCalc.warnings);
  }

  return {
    actualQ: Math.round(actualQ * 10) / 10,
    actualHead: Math.round(actualHead * 10) / 10,
    actualHDynamic: Math.round(actualHDynamicMD * 10) / 10,
    submergenceM: Math.round(submergenceTvdM * 10) / 10,
    pIntakeAtm: Math.round(pIntakeAtm * 10) / 10,
    pBottomholeAtm: Math.round(pBottomholeAtm * 10) / 10,
    freeGasIntakePct: Math.round(freeGasPct * 10) / 10,
    gasSeparatorStatus,
    shaftPowerKW: Math.round(shaftPowerKW * 10) / 10,
    hydraulicPowerKW: Math.round(hydraulicPowerKW * 10) / 10,
    efficiencyPct: Math.round(efficiencyPct * 10) / 10,
    motorLoadPct: Math.round(motorLoadPct * 10) / 10,
    motorLoadStatus,
    motorCurrentA: Math.round(motorCurrentA * 10) / 10,
    coolingVelocityMs: Math.round(coolingVelocityMs * 1000) / 1000,
    coolingStatus,
    cableVoltageDropV: Math.round(cableVoltageDropV * 10) / 10,
    surfaceVoltageV: Math.round(surfaceVoltageV * 10) / 10,
    dailyEnergyKWh: Math.round(dailyEnergyKWh * 10) / 10,
    specificEnergyKWhM3: Math.round(specificEnergyKWhM3 * 100) / 100,
    isWithinODR,
    qMinODR: Math.round(qMinODR * 10) / 10,
    qMaxODR: Math.round(qMaxODR * 10) / 10,
    shutoffHead: Math.round(shutoffHead * 10) / 10,
    warnings
  };
}

/**
 * Кривые совместной работы скважины и насоса для графика в режиме эксплуатации
 */
export function generateOperatingPointCurves(
  pump: PumpModel,
  well: WellParameters,
  fluid: FluidProperties,
  completion: CompletionGeometry,
  oper: OperationParameters,
  maxQPlot: number
): {
  pumpCurve: { q: number; h: number }[];
  systemCurve: { q: number; h: number }[];
  odrMinQ: number;
  odrMaxQ: number;
} {
  const { rhoMix, mixVisc } = calculateMixtureProperties(fluid);
  const viscCorr = getViscosityCorrections(mixVisc, pump.qNom);
  const kFreq = oper.operatingFrequency / 50;
  const tvdFactor = getTvdFactor(well.inclinationDeg);

  const approxIntake = calculateIntakeConditions(
    well.depthPump * tvdFactor,
    well.hDynamic * tvdFactor,
    oper.pAnnularOper,
    rhoMix,
    fluid,
    well.tReservoir
  );

  const [a0, a1, a2] = pump.coeffH;

  const pumpCurve: { q: number; h: number }[] = [];
  const systemCurve: { q: number; h: number }[] = [];

  const steps = 40;
  const step = maxQPlot / steps;

  for (let q = 0; q <= maxQPlot; q += step) {
    const qEq = q / kFreq;
    const h1 = (a0 - a1 * qEq - a2 * Math.pow(qEq, 2)) * Math.pow(kFreq, 2) * viscCorr.cH * approxIntake.gasHeadDegradationFactor;
    const hPump = oper.fixedStages * Math.max(0, h1);
    pumpCurve.push({ q: Math.round(q * 10) / 10, h: Math.round(hPump * 10) / 10 });

    const deltaP = q / Math.max(0.01, oper.productivityIndex);
    const pWf = Math.max(0, well.pReservoir - deltaP);
    const hDynamicTvd = well.hStatic * tvdFactor + ((well.pReservoir - pWf) * 101325) / (rhoMix * G);
    const hBuf = (oper.pBufOper * 101325) / (rhoMix * G);
    const hAnn = (oper.pAnnularOper * 101325) / (rhoMix * G);
    const hWellheadNet = Math.max(0, hBuf - hAnn);

    const tubing = calculateTubingHydraulics(
      q,
      well.depthPump,
      completion.tubingInnerDiam,
      completion.tubingRoughness,
      rhoMix,
      mixVisc
    );

    let hChoke = 0;
    if (oper.chokeDiameterMm > 0 && q > 0) {
      const dChokeM = oper.chokeDiameterMm / 1000;
      const vChoke = (q / 86400) / ((Math.PI * Math.pow(dChokeM, 2)) / 4);
      hChoke = Math.min(250, 1.25 * (Math.pow(vChoke, 2) / (2 * G)));
    }

    const hSys = hDynamicTvd + hWellheadNet + tubing.totalFriction + hChoke;
    systemCurve.push({ q: Math.round(q * 10) / 10, h: Math.round(hSys * 10) / 10 });
  }

  return {
    pumpCurve,
    systemCurve,
    odrMinQ: Math.round(pump.qMin * kFreq * 10) / 10,
    odrMaxQ: Math.round(pump.qMax * kFreq * 10) / 10
  };
}

/**
 * Диапазон регулирования ЧРП (Regulation Envelope)
 */
export function generateVFDRegulationCurves(
  pump: PumpModel,
  motor: MotorModel,
  well: WellParameters,
  fluid: FluidProperties,
  completion: CompletionGeometry,
  electrical: ElectricalParams,
  oper: OperationParameters
): RegulationPoint[] {
  const freqs = [35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65];
  const points: RegulationPoint[] = [];

  for (const f of freqs) {
    const res = calculateOperatingPoint(
      pump,
      motor,
      well,
      fluid,
      completion,
      electrical,
      { ...oper, operatingFrequency: f }
    );

    points.push({
      freq: f,
      q: res.actualQ,
      head: res.actualHead,
      powerKW: res.shaftPowerKW,
      currentA: res.motorCurrentA,
      motorLoadPct: res.motorLoadPct,
      coolingVelocityMs: res.coolingVelocityMs,
      isWithinODR: res.isWithinODR,
      isMotorOverloaded: res.motorLoadPct > 100
    });
  }

  return points;
}
