import {
  WellParameters,
  FluidProperties,
  CompletionGeometry,
  ElectricalParams,
  PumpModel,
  CalculationResult,
  CurvePoint
} from '../types/esp';
import { MOTOR_DATABASE } from '../data/motors';
import { CABLE_SPECS } from '../data/cables';

const G = 9.80665; // Ускорение свободного падения, м/с²

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
 * Расчет гидравлических потерь в НКТ по формуле Дарси-Вейсбаха и Альтшуля
 */
export function calculateTubingHydraulics(
  qM3Day: number,
  lTubingM: number,
  dInnerMm: number,
  roughnessMm: number,
  rhoMixKgM3: number,
  viscMixCP: number
) {
  const dM = dInnerMm / 1000;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4;
  const qM3Sec = qM3Day / 86400;
  const velocityMs = qM3Sec / areaM2;

  // Динамическая вязкость в Па·с
  const muPaS = (viscMixCP * 1e-3);

  // Число Рейнольдса
  const re = Math.max(1, (rhoMixKgM3 * velocityMs * dM) / muPaS);

  // Коэффициент гидравлического трения (формула Альтшуля с переходом ламинарный/турбулентный)
  let lambda: number;
  if (re < 2320) {
    lambda = 64 / re;
  } else {
    const kRel = (roughnessMm / 1000) / dM;
    lambda = 0.11 * Math.pow(kRel + 68 / re, 0.25);
  }

  // Потери напора на трение (Дарси-Вейсбах)
  const hFrictionPipe = lambda * (lTubingM / dM) * (Math.pow(velocityMs, 2) / (2 * G));
  
  // Местные сопротивления (обратный клапан КО, сбивной клапан КС, муфты) ~ 4%
  const hLocalLosses = 4.5;
  const totalFriction = hFrictionPipe + hLocalLosses;

  return {
    velocityMs,
    reynolds: re,
    lambda,
    totalFriction
  };
}

/**
 * Расчет требуемого напора скважины (TDH)
 */
export function calculateTDH(
  hDynamicM: number,
  pBufAtm: number,
  rhoMixKgM3: number,
  hFrictionM: number
) {
  // Геометрический подъем
  const hStaticLift = hDynamicM;

  // Напор, эквивалентный буферному давлению устья (м столба жидкости)
  // 1 атм = 101325 Па
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
 * Оценка давления на приеме и доли свободного газа
 */
export function calculateIntakeConditions(
  depthPumpM: number,
  hDynamicM: number,
  pAnnularAtm: number,
  rhoMixKgM3: number,
  fluid: FluidProperties,
  tReservoirC: number
) {
  const submergence = Math.max(0, depthPumpM - hDynamicM);
  const hydrostaticIntakePa = rhoMixKgM3 * G * submergence;
  const pAnnularPa = pAnnularAtm * 101325;
  
  const pIntakePa = pAnnularPa + hydrostaticIntakePa;
  const pIntakeAtm = pIntakePa / 101325;

  // Объемная доля свободного газа по эмпирической модели дегазации
  let freeGasPct = 0;
  if (pIntakeAtm < fluid.pSaturation) {
    const deltaP = fluid.pSaturation - pIntakeAtm;
    // Относительное выделение свободного газа
    const degasRatio = Math.min(0.85, deltaP / Math.max(1, fluid.pSaturation));
    // Приведение к забойным условиям
    const vGasFree = fluid.gasRatio * degasRatio * (101325 / pIntakePa) * ((273 + tReservoirC) / 293);
    const vLiquid = 1.0; // относительный объем жидкости
    freeGasPct = Math.min(75, Math.max(0, (vGasFree / (vGasFree + vLiquid)) * 100));
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

  return {
    submergenceMeters: submergence,
    intakePressureAtm: pIntakeAtm,
    freeGasIntakeFraction: freeGasPct,
    gasSeparatorRequired,
    gasSeparatorType
  };
}

/**
 * Коррекция на вязкость (ANSI/HI 9.6.7)
 */
export function getViscosityCorrections(mixViscCP: number, qNomM3Day: number) {
  // Для маловязких смесей (< 10 сП) коррекция пренебрежимо мала
  if (mixViscCP <= 10) {
    return { cH: 1.0, cQ: 1.0, cEff: 1.0, cP: 1.0 };
  }

  // Параметр вязкости B (ANSI/HI)
  const nuCSt = mixViscCP; // кинематическая вязкость ~ динамической при rho ~ 1000
  const b = 16.5 * Math.pow(nuCSt, 0.5) / Math.pow(qNomM3Day, 0.25);

  const cH = Math.max(0.70, 1 - 0.008 * b);
  const cQ = Math.max(0.75, 1 - 0.007 * b);
  const cEff = Math.max(0.50, 1 - 0.022 * b);
  const cP = 1 / cEff;

  return { cH, cQ, cEff, cP };
}

/**
 * Расчет конкретного насоса и компоновки УЭЦН
 */
export function evaluatePumpModel(
  pump: PumpModel,
  well: WellParameters,
  fluid: FluidProperties,
  completion: CompletionGeometry,
  electrical: ElectricalParams
): CalculationResult {
  const { rhoMix, mixVisc } = calculateMixtureProperties(fluid);

  // Гидравлика в НКТ
  const tubing = calculateTubingHydraulics(
    well.qTarget,
    well.depthPump,
    completion.tubingInnerDiam,
    completion.tubingRoughness,
    rhoMix,
    mixVisc
  );

  // Требуемый TDH
  const tdhInfo = calculateTDH(
    well.hDynamic,
    well.pBuf,
    rhoMix,
    tubing.totalFriction
  );

  // Условия на приеме
  const intake = calculateIntakeConditions(
    well.depthPump,
    well.hDynamic,
    well.pAnnular,
    rhoMix,
    fluid,
    well.tReservoir
  );

  // Коэффициент частоты
  const kFreq = electrical.frequency / 50;

  // Вязкостная коррекция
  const viscCorr = getViscosityCorrections(mixVisc, pump.qNom);

  // Оценка напора и мощности 1 ступени при заданной подаче и частоте
  const qEquiv = well.qTarget / kFreq;
  const [a0, a1, a2] = pump.coeffH;
  const [b0, b1, b2] = pump.coeffP;

  const hStage50 = Math.max(0.5, a0 - a1 * qEquiv - a2 * Math.pow(qEquiv, 2));
  const pStage50 = Math.max(0.1, b0 + b1 * qEquiv + b2 * Math.pow(qEquiv, 2));

  const hStageReal = hStage50 * Math.pow(kFreq, 2) * viscCorr.cH;
  const pStageReal = pStage50 * Math.pow(kFreq, 3) * (rhoMix / 1000) * viscCorr.cP;

  // Необходимое число ступеней
  const totalStages = Math.max(1, Math.ceil(tdhInfo.totalDynamicHead / hStageReal));

  // Разбивка на секции
  const numSections = Math.ceil(totalStages / pump.maxStagesPerSection);
  const stagesPerSection: number[] = [];
  let remainingStages = totalStages;
  for (let i = 0; i < numSections; i++) {
    const s = Math.min(remainingStages, Math.ceil(totalStages / numSections));
    stagesPerSection.push(s);
    remainingStages -= s;
  }

  // Общая длина насоса и установки
  const pumpModuleLength = (totalStages * pump.stageLength) / 1000 + numSections * 0.8;
  
  // Характеристики всей сборки (Full String Performance)
  const fullStringHeadAtQ = totalStages * hStageReal;
  const rawShaftPower = totalStages * pStageReal;
  
  // Дополнительные механические потери в гидрозащите (протекторе) и газосепараторе
  const pProtector = 2.5 * Math.pow(kFreq, 2);
  const pSeparator = intake.gasSeparatorRequired ? 3.5 * Math.pow(kFreq, 2) : 0;
  const fullStringShaftPowerKW = rawShaftPower + pProtector + pSeparator;

  // Полезная гидравлическая мощность
  const qM3Sec = well.qTarget / 86400;
  const fullStringHydraulicPowerKW = (rhoMix * G * qM3Sec * fullStringHeadAtQ) / 1000;
  
  // КПД всей насосной установки
  const fullStringEfficiency = Math.min(
    88,
    Math.max(5, (fullStringHydraulicPowerKW / fullStringShaftPowerKW) * 100)
  );

  // Напор на закрытую задвижку (Q = 0)
  const shutoffHead = totalStages * a0 * Math.pow(kFreq, 2) * viscCorr.cH;

  // Давление нагнетания на выкиде насоса
  const dischargePressureAtm = intake.intakePressureAtm + (rhoMix * G * fullStringHeadAtQ) / 101325;

  // Подбор оптимального электродвигателя (ПЭД)
  // Запас мощности 15-20%
  const reqMotorPower = fullStringShaftPowerKW * 1.18;
  const motor = MOTOR_DATABASE.find(m => m.powerRatingKW >= reqMotorPower) ||
    MOTOR_DATABASE[MOTOR_DATABASE.length - 1];

  const motorLoadPercent = (fullStringShaftPowerKW / motor.powerRatingKW) * 100;
  let motorLoadStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'OVERLOAD' | 'UNDERLOAD' = 'OPTIMAL';
  if (motorLoadPercent > 105) motorLoadStatus = 'OVERLOAD';
  else if (motorLoadPercent > 92) motorLoadStatus = 'ACCEPTABLE';
  else if (motorLoadPercent < 60) motorLoadStatus = 'UNDERLOAD';

  // Длина всей установки (насос + газосепаратор + гидрозащита + ПЭД + ТМС)
  const protectorLength = 1.8;
  const separatorLength = intake.gasSeparatorRequired ? 1.4 : 0.6;
  const tmsLength = 0.7;
  const totalStringLength = pumpModuleLength + separatorLength + protectorLength + motor.lengthM + tmsLength;
  const totalWeightKg = totalStages * 1.8 + numSections * 45 + motor.massKg + 160;

  // Скорость восходящего потока вдоль двигателя (охлаждение ПЭД)
  // Внутренний диаметр эксплуатационной колонны
  const dCasInMm = completion.casingOuterDiam - 2 * completion.casingWallThickness;
  const dCasInM = dCasInMm / 1000;
  const dMotorM = motor.outerDiam / 1000;

  const annularAreaM2 = Math.max(0.001, (Math.PI / 4) * (Math.pow(dCasInM, 2) - Math.pow(dMotorM, 2)));
  const coolingVelocityMs = qM3Sec / annularAreaM2;

  let coolingStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
  let coolingMessage = 'Охлаждение двигателя в норме (> 0.15 м/с)';
  let shroudRequired = false;

  // Проверка спуска ниже перфорации
  const isBelowPerf = well.depthPump > well.perfTop;

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

  // Расчет кабельной линии и падения напряжения
  const cableSpec = CABLE_SPECS.find(c => c.sectionMm2 === electrical.cableSection) || CABLE_SPECS[1];
  const tWellAvg = (well.tReservoir + well.tWellhead) / 2;
  // Температурный коэффициент меди
  const rCableTotal = cableSpec.resistanceOhmPerKm * (electrical.cableLength / 1000) * (1 + 0.00393 * (tWellAvg - 20));
  
  // Расчетный ток мотора при рабочей нагрузке
  const workCurrentA = (fullStringShaftPowerKW * 1000) / (Math.sqrt(3) * motor.voltageV * motor.powerFactor * (motor.efficiency / 100));
  const cableVoltageDropV = Math.sqrt(3) * workCurrentA * rCableTotal;
  const cableVoltageDropPercent = (cableVoltageDropV / motor.voltageV) * 100;
  const surfaceVoltageV = motor.voltageV + cableVoltageDropV;

  // Энергопотребление
  const motorActivePowerKW = fullStringShaftPowerKW / (motor.efficiency / 100);
  const cableLossKW = (3 * Math.pow(workCurrentA, 2) * rCableTotal) / 1000;
  const totalSurfacePowerKW = motorActivePowerKW + cableLossKW;

  const dailyEnergyKWh = totalSurfacePowerKW * 24;
  const specificEnergyKWhM3 = dailyEnergyKWh / well.qTarget;

  // Оценка качества подбора (Match Index)
  const qNomAtFreq = pump.qNom * kFreq;
  const qMinAtFreq = pump.qMin * kFreq;
  const qMaxAtFreq = pump.qMax * kFreq;

  const isWithinOperatingRange = well.qTarget >= qMinAtFreq && well.qTarget <= qMaxAtFreq;
  
  // Отклонение от BEP
  const devFromBep = Math.abs(well.qTarget - qNomAtFreq) / qNomAtFreq;
  let score = Math.max(20, Math.round(100 - devFromBep * 80));

  // Штрафы
  if (!isWithinOperatingRange) score -= 25;
  if (coolingStatus === 'CRITICAL') score -= 20;
  else if (coolingStatus === 'WARNING') score -= 10;
  if (motorLoadStatus === 'OVERLOAD') score -= 30;
  if (pump.outerDiam >= completion.casingOuterDiam - 2 * completion.casingWallThickness) score = 0;

  score = Math.max(5, Math.min(100, score));

  // Предупреждения
  const warnings: string[] = [];
  if (!isWithinOperatingRange) {
    warnings.push(`Целевой дебит ${well.qTarget} м³/сут вне рекомендованного диапазона (${qMinAtFreq.toFixed(0)} - ${qMaxAtFreq.toFixed(0)} м³/сут).`);
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
  if (cableVoltageDropPercent > 8) {
    warnings.push(`Падение напряжения в кабеле составляет ${cableVoltageDropPercent.toFixed(1)}% (> 8%). Рекомендуется увеличить сечение до 35 мм².`);
  }

  return {
    pump,
    motor,
    mixDensity: rhoMix,
    mixViscosity: mixVisc,
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
    submergenceMeters: intake.submergenceMeters,
    intakePressureAtm: intake.intakePressureAtm,
    freeGasIntakeFraction: intake.freeGasIntakeFraction,
    gasSeparatorRequired: intake.gasSeparatorRequired,
    gasSeparatorType: intake.gasSeparatorType,
    coolingVelocityMs,
    coolingStatus,
    coolingMessage,
    shroudRequired,
    motorLoadPercent,
    motorLoadStatus,
    cableVoltageDropV,
    cableVoltageDropPercent,
    surfaceVoltageV,
    dailyEnergyKWh,
    specificEnergyKWhM3,
    matchScore: score,
    isWithinOperatingRange,
    warnings
  };
}

/**
 * Генерация точек характеристик всей сборки (Full String Q-H, Q-P, Q-Eff)
 * для построения инженерного графика
 */
export function generateFullStringCurves(
  result: CalculationResult,
  steps = 50,
  targetFreq?: number
): CurvePoint[] {
  const { pump, totalStages, kFreq: currentKFreq, mixDensity, mixViscosity } = result;
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
    
    // Напор 1 ступени
    const h1 = Math.max(0, (a0 - a1 * qEq - a2 * Math.pow(qEq, 2)) * Math.pow(k, 2) * viscCorr.cH);
    // Напор ВСЕЙ СБОРКИ (всех ступеней)
    const hTotal = h1 * totalStages;

    // Мощность всей сборки
    const p1 = Math.max(0.05, (b0 + b1 * qEq + b2 * Math.pow(qEq, 2)) * Math.pow(k, 3) * (mixDensity / 1000) * viscCorr.cP);
    const pShaft = p1 * totalStages + 2.5 * Math.pow(k, 2);

    // КПД
    const qM3Sec = q / 86400;
    const hydrPower = (mixDensity * G * qM3Sec * hTotal) / 1000;
    const eff = pShaft > 0 ? Math.min(85, Math.max(0, (hydrPower / pShaft) * 100)) : 0;

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
 * TDH(Q) = H_stat + H_pres + c * Q^1.75
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
