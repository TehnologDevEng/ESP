export interface CableSpec {
  name: string;
  sectionMm2: number;
  resistanceOhmPerKm: number;
  maxCurrentA: number;
  maxTempC: number;
}

export const CABLE_SPECS: CableSpec[] = [
  {
    name: 'КПбП-120 (3x16)',
    sectionMm2: 16,
    resistanceOhmPerKm: 1.18,
    maxCurrentA: 55,
    maxTempC: 120
  },
  {
    name: 'КПсБП-130 (3x25)',
    sectionMm2: 25,
    resistanceOhmPerKm: 0.75,
    maxCurrentA: 78,
    maxTempC: 130
  },
  {
    name: 'КПсТБП-150 (3x35)',
    sectionMm2: 35,
    resistanceOhmPerKm: 0.54,
    maxCurrentA: 98,
    maxTempC: 150
  }
];
