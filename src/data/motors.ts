import { MotorModel } from '../types/esp';

/**
 * Каталог погружных электродвигателей (ПЭД)
 * Серии 117 мм (для 146+ мм колонн) и 103 мм (для 140 мм колонн)
 */
export const MOTOR_DATABASE: MotorModel[] = [
  {
    id: 'ped-22-103',
    name: '2ПЭД22-103',
    powerRatingKW: 22,
    voltageV: 850,
    currentA: 21.0,
    efficiency: 82.5,
    powerFactor: 0.82,
    outerDiam: 103,
    lengthM: 3.2,
    massKg: 175
  },
  {
    id: 'ped-32-117',
    name: '1ПЭД32-117',
    powerRatingKW: 32,
    voltageV: 950,
    currentA: 26.5,
    efficiency: 83.5,
    powerFactor: 0.83,
    outerDiam: 117,
    lengthM: 3.6,
    massKg: 240
  },
  {
    id: 'ped-45-117',
    name: '2ПЭД45-117',
    powerRatingKW: 45,
    voltageV: 1100,
    currentA: 33.0,
    efficiency: 84.5,
    powerFactor: 0.84,
    outerDiam: 117,
    lengthM: 4.4,
    massKg: 310
  },
  {
    id: 'ped-63-117',
    name: '2ПЭД63-117',
    powerRatingKW: 63,
    voltageV: 1350,
    currentA: 37.5,
    efficiency: 85.5,
    powerFactor: 0.85,
    outerDiam: 117,
    lengthM: 5.4,
    massKg: 420
  },
  {
    id: 'ped-80-117',
    name: '2ПЭД80-117',
    powerRatingKW: 80,
    voltageV: 1600,
    currentA: 40.5,
    efficiency: 86.0,
    powerFactor: 0.85,
    outerDiam: 117,
    lengthM: 6.2,
    massKg: 510
  },
  {
    id: 'ped-100-117',
    name: '2ПЭД100-117',
    powerRatingKW: 100,
    voltageV: 1850,
    currentA: 43.5,
    efficiency: 86.5,
    powerFactor: 0.86,
    outerDiam: 117,
    lengthM: 7.2,
    massKg: 620
  },
  {
    id: 'ped-125-117',
    name: '2ПЭД125-117',
    powerRatingKW: 125,
    voltageV: 2150,
    currentA: 46.5,
    efficiency: 87.0,
    powerFactor: 0.86,
    outerDiam: 117,
    lengthM: 8.5,
    massKg: 760
  },
  {
    id: 'ped-160-117',
    name: '2ПЭД160-117',
    powerRatingKW: 160,
    voltageV: 2300,
    currentA: 55.5,
    efficiency: 87.5,
    powerFactor: 0.87,
    outerDiam: 117,
    lengthM: 9.8,
    massKg: 920
  },
  {
    id: 'ped-200-130',
    name: 'ПЭД200-130',
    powerRatingKW: 200,
    voltageV: 2400,
    currentA: 67.0,
    efficiency: 88.0,
    powerFactor: 0.87,
    outerDiam: 130,
    lengthM: 10.5,
    massKg: 1150
  }
];
