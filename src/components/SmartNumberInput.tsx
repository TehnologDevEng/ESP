import React, { useState, useEffect } from 'react';

export interface SmartNumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  unit?: string;
  disabled?: boolean;
  allowDecimals?: boolean;
  selectOnFocus?: boolean;
}

/**
 * Инженерный числовой инпут с естественным вводом:
 * - Позволяет полностью стирать значение клавишей Backspace / Delete без сброса на минимум (например, 100).
 * - Поддерживает замену запятой на точку при русской раскладке клавиатуры.
 * - Ограничения диапазона (min / max) применяются только при потере фокуса (onBlur),
 *   что позволяет спокойно стирать и вводить числа любой разрядности.
 */
export const SmartNumberInput: React.FC<SmartNumberInputProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className = '',
  unit,
  disabled = false,
  allowDecimals = true,
  selectOnFocus = true
}) => {
  // Локальное строковое состояние для беспрепятственного набора текста
  const [localValue, setLocalValue] = useState<string>(() =>
    value !== undefined && value !== null && !isNaN(value) ? String(value) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // Синхронизация с входящим пропсом value, когда поле не находится под активным вводом
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(
        value !== undefined && value !== null && !isNaN(value) ? String(value) : ''
      );
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Автоматическая замена запятой на точку для удобства на русской раскладке
    raw = raw.replace(',', '.');

    // Если поле полностью очищено или введен только знак минус
    if (raw === '' || raw === '-') {
      setLocalValue(raw);
      // Передаем 0 в родительский расчет, но в поле ввода оставляем пустую строку!
      onChange(0);
      return;
    }

    // Проверка допустимости символов
    const regex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    if (!regex.test(raw)) {
      return;
    }

    setLocalValue(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      // Передаем значение наружу БЕЗ жесткого min-clamp во время набора!
      // Это позволяет ввести, например, сначала "1", затем "18", затем "185", затем "1850"
      // без автоматического сброса до 100!
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Если поле оставлено пустым, восстанавливаем значение по умолчанию
    if (localValue === '' || localValue === '-' || isNaN(parseFloat(localValue))) {
      const fallback = min !== undefined ? min : 0;
      setLocalValue(String(fallback));
      onChange(fallback);
      return;
    }

    let parsed = parseFloat(localValue);

    // Применение ограничений диапазона min / max только в момент завершения ввода
    if (min !== undefined && parsed < min) {
      parsed = min;
    }
    if (max !== undefined && parsed > max) {
      parsed = max;
    }

    // Округляем при необходимости
    const cleaned = String(Math.round(parsed * 1000) / 1000);
    setLocalValue(cleaned);
    onChange(parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (selectOnFocus) {
      e.target.select();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const defaultInputClass =
    'w-full bg-[#0b0e14] border border-[#243044] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 transition-colors';

  const inputElem = (
    <input
      id={id}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={
        className ||
        `${defaultInputClass} ${unit ? 'pr-12' : ''}`
      }
    />
  );

  if (unit) {
    return (
      <div className="relative flex items-center w-full">
        {inputElem}
        <span className="absolute right-3 text-xs text-slate-400 font-mono pointer-events-none select-none">
          {unit}
        </span>
      </div>
    );
  }

  return inputElem;
};
