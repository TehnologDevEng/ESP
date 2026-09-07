import { PumpModel } from '../types/esp';
import { NT_CATALOG_2026, convertNTPumpToModel } from './ntCatalog';

/**
 * База данных насосного оборудования ООО «Новые Технологии» (2026 год)
 * Габариты: 2А (69 мм), 3 (81 мм), 5 (92 мм), 5А (103 мм), 6 (114 мм), 7А (136 мм)
 * Материалы: коррозионно-износостойкий чугун (Нирезист), композитные полимеры (ПКМ), винтовые
 */
export const PUMP_DATABASE: PumpModel[] = NT_CATALOG_2026.pumps.map((p, idx) => convertNTPumpToModel(p, idx));

// Удобные фильтры для быстрого поиска по габариту
export const PUMPS_BY_GAB = {
  '2A': PUMP_DATABASE.filter(p => p.outerDiam === 69),
  '3': PUMP_DATABASE.filter(p => p.outerDiam === 81),
  '5': PUMP_DATABASE.filter(p => p.outerDiam === 92),
  '5A': PUMP_DATABASE.filter(p => p.outerDiam === 103),
  '6': PUMP_DATABASE.filter(p => p.outerDiam === 114),
  '7A': PUMP_DATABASE.filter(p => p.outerDiam === 136)
};
