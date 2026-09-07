import { WellParameters, FluidProperties, CompletionGeometry, ElectricalParams } from '../types/esp';

export interface WellPreset {
  id: string;
  name: string;
  description: string;
  well: WellParameters;
  fluid: FluidProperties;
  completion: CompletionGeometry;
  electrical: ElectricalParams;
}

export const PRESETS: WellPreset[] = [
  {
    id: 'west-siberia-standard',
    name: 'Западная Сибирь · Базовый режим',
    description: 'Скважина скважина 104к Самотлорского месторождения. Средний дебит, нормальные пластовые условия.',
    well: {
      wellName: 'Скв. 104к',
      field: 'Самотлорское м/р, Куст 14',
      qTarget: 130,
      depthPump: 2200,
      hDynamic: 1350,
      hStatic: 720,
      depthWell: 2450,
      perfTop: 2320,
      perfBottom: 2355,
      pBuf: 15,
      pAnnular: 10,
      pReservoir: 185,
      tReservoir: 68,
      tWellhead: 18
    },
    fluid: {
      waterCut: 42,
      oilDensity: 855,
      waterDensity: 1015,
      oilViscosity: 4.8,
      gasRatio: 52,
      pSaturation: 82,
      gasRelativeDensity: 0.78
    },
    completion: {
      casingOuterDiam: 146,
      casingWallThickness: 8.5,
      casingShoeDepth: 2430,
      conductorDepth: 450,
      tubingOuterDiam: 73,
      tubingInnerDiam: 62.0,
      tubingRoughness: 0.08
    },
    electrical: {
      frequency: 50,
      cableLength: 2260,
      cableType: 'КПсБП-130',
      cableSection: 25
    }
  },
  {
    id: 'high-watercut-heavy',
    name: 'Волга-Урал · Высокодебитная / Обводненная',
    description: 'Высокий дебит, обводненность 82%, форсированный отбор на 55 Гц.',
    well: {
      wellName: 'Скв. 512',
      field: 'Ромашкинское м/р, ЦДНГ-2',
      qTarget: 260,
      depthPump: 1850,
      hDynamic: 1150,
      hStatic: 580,
      depthWell: 2050,
      perfTop: 1910,
      perfBottom: 1945,
      pBuf: 18,
      pAnnular: 12,
      pReservoir: 150,
      tReservoir: 42,
      tWellhead: 15
    },
    fluid: {
      waterCut: 82,
      oilDensity: 885,
      waterDensity: 1120,
      oilViscosity: 12.0,
      gasRatio: 35,
      pSaturation: 65,
      gasRelativeDensity: 0.82
    },
    completion: {
      casingOuterDiam: 168,
      casingWallThickness: 8.9,
      casingShoeDepth: 2020,
      conductorDepth: 520,
      tubingOuterDiam: 89,
      tubingInnerDiam: 75.9,
      tubingRoughness: 0.1
    },
    electrical: {
      frequency: 55,
      cableLength: 1910,
      cableType: 'КПсТБП-150',
      cableSection: 35
    }
  },
  {
    id: 'viscous-deep',
    name: 'Тимано-Печора · Глубокая высоковязкая',
    description: 'Вязкость 28 сП, глубокий динамический уровень, расчет с поправкой ANSI/HI.',
    well: {
      wellName: 'Скв. 88-Бис',
      field: 'Усинское месторождение',
      qTarget: 65,
      depthPump: 2450,
      hDynamic: 1650,
      hStatic: 950,
      depthWell: 2700,
      perfTop: 2510,
      perfBottom: 2540,
      pBuf: 22,
      pAnnular: 8,
      pReservoir: 210,
      tReservoir: 55,
      tWellhead: 10
    },
    fluid: {
      waterCut: 25,
      oilDensity: 915,
      waterDensity: 1030,
      oilViscosity: 28.5,
      gasRatio: 45,
      pSaturation: 90,
      gasRelativeDensity: 0.85
    },
    completion: {
      casingOuterDiam: 146,
      casingWallThickness: 8.5,
      casingShoeDepth: 2680,
      conductorDepth: 600,
      tubingOuterDiam: 73,
      tubingInnerDiam: 62.0,
      tubingRoughness: 0.1
    },
    electrical: {
      frequency: 48,
      cableLength: 2510,
      cableType: 'КПсБП-130',
      cableSection: 25
    }
  },
  {
    id: 'high-gas',
    name: 'Оренбуржье · Высокий газовый фактор',
    description: 'Низкое забойное давление, интенсивное разгазирование на приеме насоса.',
    well: {
      wellName: 'Скв. 302',
      field: 'Оренбургское НГКМ',
      qTarget: 110,
      depthPump: 2000,
      hDynamic: 1420,
      hStatic: 800,
      depthWell: 2250,
      perfTop: 2080,
      perfBottom: 2120,
      pBuf: 20,
      pAnnular: 16,
      pReservoir: 160,
      tReservoir: 62,
      tWellhead: 20
    },
    fluid: {
      waterCut: 35,
      oilDensity: 840,
      waterDensity: 1010,
      oilViscosity: 3.5,
      gasRatio: 115,
      pSaturation: 110,
      gasRelativeDensity: 0.72
    },
    completion: {
      casingOuterDiam: 146,
      casingWallThickness: 8.5,
      casingShoeDepth: 2220,
      conductorDepth: 400,
      tubingOuterDiam: 73,
      tubingInnerDiam: 62.0,
      tubingRoughness: 0.08
    },
    electrical: {
      frequency: 52,
      cableLength: 2060,
      cableType: 'КПсБП-130',
      cableSection: 25
    }
  }
];
