import { MotorModel, HydroModel } from '../types/esp';
import { NT_CATALOG_2026, convertNTMotorToModel, convertNTHydroToModel } from './ntCatalog';

/**
 * Каталог погружных электродвигателей (ПЭД / ВПЭД) и гидрозащит ООО «Новые Технологии» (2026 год)
 * Включает:
 * - Асинхронные двигатели ПЭД и ПЭДС (103, 117, 130, 143 мм) термостойкостью до 130°C
 * - Высокоэффективные вентильные двигатели с постоянными магнитами ВПЭД и ВПЭДГ (81, 117 мм) термостойкостью до 230°C
 * - Протекторы гидрозащиты серии ПА / ПЭД-П
 */
export const MOTOR_DATABASE: MotorModel[] = NT_CATALOG_2026.motors.map((m, idx) => convertNTMotorToModel(m, idx));

export const HYDRO_DATABASE: HydroModel[] = NT_CATALOG_2026.hydros.map((h, idx) => convertNTHydroToModel(h, idx));

// Вспомогательные фильтры
export const ASYNC_MOTORS = MOTOR_DATABASE.filter(m => m.motorType === 'пэд');
export const PMSM_MOTORS = MOTOR_DATABASE.filter(m => m.motorType === 'впэд');
