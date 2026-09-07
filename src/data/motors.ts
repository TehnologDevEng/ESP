import { MotorModel } from '../types/esp';
import { NT_CATALOG_2026, convertNTMotorToModel } from './ntCatalog';

/**
 * Каталог погружных электродвигателей (ПЭД / ВПЭД) ООО «Новые Технологии» (2026 год)
 * Включает:
 * - Асинхронные двигатели ПЭД и ПЭДС (103, 117, 130, 143 мм) термостойкостью до 130°C
 * - Высокоэффективные вентильные двигатели с постоянными магнитами ВПЭД и ВПЭДГ (81, 117 мм) термостойкостью до 230°C
 */
export const MOTOR_DATABASE: MotorModel[] = NT_CATALOG_2026.motors.map((m, idx) => convertNTMotorToModel(m, idx));

// Вспомогательные фильтры
export const ASYNC_MOTORS = MOTOR_DATABASE.filter(m => m.name.startsWith('ПЭД'));
export const PMSM_MOTORS = MOTOR_DATABASE.filter(m => m.name.startsWith('ВПЭД'));
