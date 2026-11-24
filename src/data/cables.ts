export interface CableSpec {
  name: string;
  sectionMm2: number;
  resistanceOhmPerKm: number;
  maxCurrentA: number;
  maxTempC: number;
}

export interface CableSectionSpec {
  sectionMm2: number;
  resistanceOhmPerKm: number; // Сопротивление медной жилы при 20°C (ГОСТ 22483), Ом/км
  baseMaxCurrentA: number;    // Базовый длительно допустимый ток в скважине (при 20°C), А
}

export interface CableGradeSpec {
  code: string;
  label: string;
  maxTempC: number;
  role: 'main' | 'thermo' | 'both';
}

export const CABLE_SECTION_SPECS: CableSectionSpec[] = [
  { sectionMm2: 10, resistanceOhmPerKm: 1.83, baseMaxCurrentA: 42 },
  { sectionMm2: 16, resistanceOhmPerKm: 1.15, baseMaxCurrentA: 58 },
  { sectionMm2: 25, resistanceOhmPerKm: 0.727, baseMaxCurrentA: 80 },
  { sectionMm2: 35, resistanceOhmPerKm: 0.524, baseMaxCurrentA: 100 }
];

export const CABLE_GRADES: CableGradeSpec[] = [
  { code: 'КПБП-90', label: 'КПБП-90 (ПЭ, до 90°C)', maxTempC: 90, role: 'main' },
  { code: 'КПбП-120', label: 'КПбП-120 (Стандартный, до 120°C)', maxTempC: 120, role: 'main' },
  { code: 'КПсБП-130', label: 'КПсБП-130 (Сшитый ПЭ, до 130°C)', maxTempC: 130, role: 'both' },
  { code: 'КПсТБП-150', label: 'КПсТБП-150 (Термостойкий, до 150°C)', maxTempC: 150, role: 'both' },
  { code: 'КПпБП-180', label: 'КПпБП-180 (Повыш. термост., до 180°C)', maxTempC: 180, role: 'thermo' },
  { code: 'КПсТБП-230', label: 'КПсТБП-230 (Сверхтермост., до 230°C)', maxTempC: 230, role: 'thermo' }
];

export const CABLE_SPECS: CableSpec[] = [
  {
    name: 'КПбП-120 (3x16)',
    sectionMm2: 16,
    resistanceOhmPerKm: 1.15,
    maxCurrentA: 58,
    maxTempC: 120
  },
  {
    name: 'КПсБП-130 (3x25)',
    sectionMm2: 25,
    resistanceOhmPerKm: 0.727,
    maxCurrentA: 80,
    maxTempC: 130
  },
  {
    name: 'КПсТБП-150 (3x35)',
    sectionMm2: 35,
    resistanceOhmPerKm: 0.524,
    maxCurrentA: 100,
    maxTempC: 150
  }
];

export function getCableSectionSpec(sectionMm2: number): CableSectionSpec {
  return (
    CABLE_SECTION_SPECS.find(s => s.sectionMm2 === sectionMm2) ||
    CABLE_SECTION_SPECS[1] // 16 мм² по умолчанию
  );
}

export function getCableGradeMaxTemp(code: string | undefined, fallback = 130): number {
  if (!code) return fallback;
  const found = CABLE_GRADES.find(g => g.code === code);
  if (found) return found.maxTempC;
  const match = code.match(/(\d{2,3})/);
  return match ? Number(match[1]) : fallback;
}
