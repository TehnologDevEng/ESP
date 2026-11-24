import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  PlayCircle,
  Cpu,
  Radio,
  Layers,
  Download,
  CheckCircle2
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpSection = 'overview' | 'quickstart' | 'features' | 'operation' | 'catalog';

const GUIDE_MARKDOWN = `# ESP EXPERT v10.4 PRO — Руководство пользователя

Инженерный комплекс расчёта, подбора и анализа эксплуатации установок электроцентробежных насосов (УЭЦН) на базе каталога ООО «Новые Технологии» (2026 год).

## 1. Назначение и два режима работы
- **Подбор УЭЦН** — проектный расчёт требуемого динамического напора (TDH), автоматический подбор числа ступеней и секций насоса, ПЭД/ВПЭД, гидрозащиты, газосепаратора, кабельной линии и ранжирование всех моделей по индексу соответствия.
- **Эксплуатация (ЧРП)** — моделирование фактической работы уже спущенной компоновки: узловой анализ (Nodal Analysis), подбор частоты ЧРП (30–70 Гц), влияние устьевого штуцера и коэффициента продуктивности пласта, контроль ТМС и сводка по частотам с шагом 5 Гц.

## 2. Быстрый старт (5 шагов)
1. **Выберите сценарий или введите данные скважины**: в верхней панели выберите один из 4 готовых пресетов («Западная Сибирь», «Волга-Урал», «Тимано-Печора», «Оренбуржье») или сохранённую скважину, либо задайте параметры вручную в левой панели (вкладки «Скважина», «Флюид», «Трубы», «ЧРП/Кабель»). Второстепенные поля свёрнуты в «Доп. параметры».
2. **Оцените сводку KPI и предупреждения**: верхняя 4-блочная лента сразу показывает активный насос, TDH и давление на приёме, загрузку и охлаждение ПЭД, прочность вала. Критические ограничения выводятся сразу под KPI-лентой.
3. **Изучите напорно-энергетический график и покрутите ЧРП**: используйте ползунок ЧРП (35–65 Гц) прямо над графиком, переключайте виды («Все кривые», «Напор H(Q)», «Мощность и КПД», «Семейство ЧРП»), наведите курсор для перекрестия и сверьте точку баланса с сетью.
4. **Сравните типоразмеры насосов**: используйте фильтры по габариту (2A, 3, 5, 5A, 6, 7A) и материалу (нирезист, ПКМ, винт), а также переключатель «Карточки / Таблица».
5. **Проверьте чертёж и сформируйте техкарту**: нажмите на любой узел на схеме скважины (ЭЦН, ВМ, гидрозащита, ПЭД, ТМС) для просмотра параметров или откройте «Техкарта УЭЦН» для печати А4 / PDF и экспорта в CSV.

## 3. Основные фишки и физическая модель
- **Каталог ООО «Новые Технологии» 2026**: 78 насосов (ЭЦН, ПЭЦН, ВН), 61 двигатель (асинхронные ПЭД до 130°C и вентильные ВПЭД до 230°C), 8 протекторов гидрозащиты. Любой насос, ПЭД или гидрозащиту можно применить в расчёт прямо из окна «Каталог НТ · 2026».
- **Инклинометрия (MD / TVD)**: ввод зенитного угла переводит измеренную глубину спуска и динамический уровень в вертикальные (TVD) для точного гидростатического расчёта при длине НКТ по MD.
- **Коррекция на вязкость ANSI/HI 9.6.7**: пересчитывает напор, подачу, КПД и потребляемую мощность для эмульсий с учётом инверсии фаз при росте обводнённости.
- **Газ на приёме и деградация напора**: расчёт объёмной доли свободного газа только по нефтяной фазе, автоматический подбор ВМ / МГ / МГД / мультифазного модуля и оценка деградации напора.
- **Механика вала и терморежим ПЭД**: проверка предельной мощности вала (прямой пуск / ЧРП), скорости охлаждения двигателя (норматив >= 0.10 м/с, сигнализация необходимости шрауда) и перегрева при пластовой температуре выше 110°C.
- **Умный числовой ввод**: числа можно полностью стирать клавишей Backspace и вводить через запятую или точку без мгновенного принудительного сброса к минимуму — проверка границ срабатывает при выходе из поля.
- **Локальное хранение и JSON-обмен**: через меню «Проект ▾» скважины сохраняются в браузер («Мои скважины»), а также выгружаются и загружаются в формате JSON.

## 4. Аудит расчётов и печать
- Во вкладках внизу страницы доступны: «Сводка расчетов», «Физические формулы» и «Экспертные рекомендации».
- Модальное окно «Техкарта УЭЦН» поддерживает чистую печать А4 / PDF и выгрузку сводной таблицы в CSV (кодировка UTF-8 BOM для корректного открытия в Excel).
`;

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [section, setSection] = useState<HelpSection>('overview');

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadGuide = () => {
    const blob = new Blob([GUIDE_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ESP_EXPERT_Инструкция.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111722] border border-[#243044] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Шапка */}
        <div className="px-5 py-4 border-b border-[#243044] bg-[#0e141f] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                Инструкция пользователя · ESP EXPERT v10.4 PRO
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Описание модулей, порядок работы и ключевые возможности комплекса УЭЦН
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadGuide}
              className="px-3 py-1.5 bg-[#182130] hover:bg-[#243044] text-sky-300 border border-[#2d3d56] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Скачать (.md)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть инструкцию"
              className="w-8 h-8 rounded-lg bg-[#1a2332] hover:bg-[#243044] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Навигация по разделам */}
        <div className="px-5 py-2.5 border-b border-[#243044] bg-[#141b27] flex flex-wrap items-center gap-1.5">
          {([
            { id: 'overview', label: 'Обзор', icon: BookOpen },
            { id: 'quickstart', label: 'Быстрый старт', icon: PlayCircle },
            { id: 'features', label: 'Фишки и расчёты', icon: Cpu },
            { id: 'operation', label: 'Режим ЧРП', icon: Radio },
            { id: 'catalog', label: 'Каталог и проекты', icon: Layers }
          ] as const).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  section === item.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2332]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Контент инструкции */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#0b0e14] text-xs text-slate-300 space-y-4 leading-relaxed">
          {section === 'overview' && (
            <div className="space-y-4">
              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-white">Назначение программы</h3>
                <p className="text-slate-300">
                  <strong className="text-sky-300">ESP EXPERT</strong> — инженерный комплекс для гидравлического расчёта скважин, подбора погружных насосных установок УЭЦН и моделирования режимов эксплуатации с частотным регулированием (ЧРП).
                </p>
                <p className="text-slate-400">
                  Расчётная база построена на серийной линейке оборудования <strong className="text-slate-200">ООО «Новые Технологии» (каталог 2026 года)</strong> и учитывает требования ГОСТ 34771-2021 и API RP 11S2.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Режим 1 · Подбор УЭЦН
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                    <li>Расчёт требуемого динамического напора (TDH) с учётом кривизны ствола, трения в НКТ и буферного давления.</li>
                    <li>Автоматический подбор ступеней, числа секций, двигателя (ПЭД/ВПЭД) и гидрозащиты.</li>
                    <li>Ранжирование всех 78 насосов по индексу соответствия в виде карточек или сравнительной таблицы.</li>
                  </ul>
                </div>

                <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Режим 2 · Эксплуатация (ЧРП)
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                    <li>Анализ совместной работы спущенного насоса и скважины (Nodal Analysis) при фиксированном числе ступеней.</li>
                    <li>Регулирование частоты тока (30–70 Гц) и устьевого штуцера с мгновенным пересчётом дебита и динуровня.</li>
                    <li>Оценка загрузки ПЭД, тока, давления на приёме, свободного газа и кривых Q(f) / N(f).</li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4">
                <div className="text-xs font-bold text-slate-200 mb-2">Состав оборудования в базе 2026 года</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums text-center">
                  <div className="bg-[#0b0e14] border border-[#1e2738] rounded-lg p-2.5">
                    <div className="text-lg font-bold text-sky-400">78</div>
                    <div className="text-[11px] font-sans text-slate-400">Насосов ЭЦН / ПЭЦН / ВН</div>
                  </div>
                  <div className="bg-[#0b0e14] border border-[#1e2738] rounded-lg p-2.5">
                    <div className="text-lg font-bold text-emerald-400">61</div>
                    <div className="text-[11px] font-sans text-slate-400">Двигатель ПЭД и ВПЭД</div>
                  </div>
                  <div className="bg-[#0b0e14] border border-[#1e2738] rounded-lg p-2.5">
                    <div className="text-lg font-bold text-amber-400">8</div>
                    <div className="text-[11px] font-sans text-slate-400">Протекторов гидрозащиты</div>
                  </div>
                  <div className="bg-[#0b0e14] border border-[#1e2738] rounded-lg p-2.5">
                    <div className="text-lg font-bold text-slate-200">4</div>
                    <div className="text-[11px] font-sans text-slate-400">Типовых сценария</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'quickstart' && (
            <div className="space-y-3">
              {[
                {
                  step: '01',
                  title: 'Выберите готовый сценарий или введите данные скважины',
                  desc: 'В верхней шапке выберите один из типовых пресетов («Западная Сибирь», «Волга-Урал», «Тимано-Печора», «Оренбуржье») или отредактируйте параметры в левой панели: «Скважина», «Флюид», «Трубы», «ЧРП/Кабель». Редко меняемые поля свёрнуты в блок «Доп. параметры».'
                },
                {
                  step: '02',
                  title: 'Проверьте KPI-ленту и предупреждения наверху',
                  desc: 'Сразу под шапкой отображается сводка: активный насос (ступени, секции, длина), TDH и давление на приёме, загрузка и скорость обдува ПЭД, загрузка вала. Все критические ограничения появляются сразу над рабочей областью.'
                },
                {
                  step: '03',
                  title: 'Подберите частоту ЧРП прямо на графике',
                  desc: 'Над графиком сборки расположен ползунок ЧРП (35–65 Гц) и кнопка быстрого сброса на 50 Гц. При наведении курсора на график перекрестие показывает точный напор сборки, TDH сети, мощность и КПД, а маркер ◎ — точку баланса H(Q)=TDH(Q).'
                },
                {
                  step: '04',
                  title: 'Сравните подходящие насосы в карточках или таблице',
                  desc: 'Фильтруйте модели по габариту (2A, 3, 5, 5A, 6, 7A) и материалу (нирезист, ПКМ, винт). Переключите вид на «Таблица», чтобы быстро сравнить длину сборки, КПД, мощность и запас прочности вала.'
                },
                {
                  step: '05',
                  title: 'Изучите схему ствола и выгрузите техкарту',
                  desc: 'Справа можно приблизить призабойную зону («Зум УЭЦН») и нажать на любой узел (ЭЦН, ВМ, гидрозащита, ПЭД, ТМС) для просмотра его спецификации. Кнопка «Техкарта УЭЦН» формирует паспорт подбора для печати А4 / PDF и экспорта в CSV.'
                }
              ].map((item) => (
                <div key={item.step} className="bg-[#111722] border border-[#243044] rounded-xl p-4 flex gap-3.5 items-start">
                  <span className="font-mono text-sm font-bold text-sky-400 shrink-0 mt-0.5">{item.step}.</span>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">{item.title}</div>
                    <p className="text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-sky-300">Инклинометрия ствола (MD / TVD)</div>
                <p className="text-slate-300">
                  Учёт зенитного угла скважины: потери на трение и длина кабеля считаются по длине ствола (MD), а гидростатический столб, давление на приёме и подъём жидкости — по вертикальной глубине (TVD).
                </p>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-amber-300">Высоковязкие эмульсии (ANSI/HI 9.6.7)</div>
                <p className="text-slate-300">
                  Модель учитывает инверсию фаз при росте обводнённости и автоматически пересчитывает поправочные коэффициенты напора, подачи, КПД и мощности на валу (включая положение точки BEP на графике).
                </p>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-emerald-300">Свободный газ и сепарация</div>
                <p className="text-slate-300">
                  Растворённый газ пересчитывается строго на нефтяную фазу смеси с учётом обводнённости. При доле свободного газа &gt; 6% программа подбирает МГ-сепаратор, &gt; 22% — диспергатор МГД, &gt; 45% — мультифазную ступень и учитывает деградацию напора.
                </p>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-rose-300">Прочность вала и тепловой баланс ПЭД</div>
                <p className="text-slate-300">
                  Контролируется предельная мощность на валу (с учётом режима пуска с ЧРП), скорость обдува двигателя в кольцевом зазоре (норматив ≥ 0.10 м/с, сигнал на установку шрауда) и перегрев при пластовой температуре &gt; 110°C с автопереходом на ВПЭД (до 230°C).
                </p>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-slate-100">Удобный числовой ввод без сброса</div>
                <p className="text-slate-300">
                  Поля ввода позволяют полностью стирать значение клавишей Backspace и набирать числа через точку или запятую на русской раскладке. Приведение к допустимым границам срабатывает только после окончания ввода.
                </p>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-1.5">
                <div className="font-bold text-slate-100">Инженерный аудит и рекомендации</div>
                <p className="text-slate-300">
                  В нижней секции доступны детальные значения по гидравлике Дарси–Вейсбаха, структуре TDH, кабельным потерям напряжения, справочник формул и вкладка «Экспертные рекомендации» по улучшению подбора.
                </p>
              </div>
            </div>
          )}

          {section === 'operation' && (
            <div className="space-y-3">
              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-emerald-300">Зачем нужен режим «Эксплуатация (ЧРП)»</h3>
                <p className="text-slate-300">
                  Если в режиме «Подбор» программа ищет число ступеней под целевой дебит, то в режиме «Эксплуатация» число ступеней <span className="font-mono text-sky-300">Z</span> фиксируется (как у реально спущенной в скважину установки) и вычисляется фактическая точка равновесия между насосом и притоком пласта.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                  <div className="font-bold text-white">Что можно регулировать</div>
                  <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                    <li><strong className="text-emerald-300">Частота ЧРП</strong> — от 30.0 до 70.0 Гц с шагом 0.1 Гц, быстрые кнопки (-5, -1, ±0.5, +1, +5) и уставки 40–60 Гц.</li>
                    <li><strong className="text-sky-300">Устьевой штуцер и Pбуф / Pзатр</strong> — оценка противодавления при штуцировании (5–14 мм) или свободном изливе.</li>
                    <li><strong className="text-amber-300">Продуктивность пласта Kпрод</strong> и число смонтированных ступеней с кнопкой синхронизации из подбора.</li>
                  </ul>
                </div>

                <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                  <div className="font-bold text-white">Два режима графиков</div>
                  <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                    <li><strong>Nodal Analysis</strong> — пересечение напорной кривой насоса H(Q) и характеристики скважины TDH(Q) с зоной ОДР.</li>
                    <li><strong>Диаграмма Q(f) и N(f)</strong> — зависимость фактического дебита и мощности вала от частоты от 35 до 65 Гц с отсечкой номинальной мощности ПЭД.</li>
                    <li><strong>Таблица ЧРП</strong> — кликабельные строки с шагом 5 Гц для мгновенного переключения режима.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {section === 'catalog' && (
            <div className="space-y-3">
              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-sky-300">Онлайн-каталог НТ · 2026</h3>
                <p className="text-slate-300">
                  В модальном окне «Каталог НТ · 2026» собраны три вкладки с поиском и фильтрами: насосы (по габаритам и материалу), двигатели (ПЭД/ВПЭД и диаметр) и протекторы гидрозащиты.
                </p>
                <div className="flex items-start gap-2 text-emerald-300 pt-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    В каждой вкладке работает кнопка <strong>«Применить в расчет»</strong> — она сразу подставляет выбранный насос, ПЭД/ВПЭД или гидрозащиту в текущую скважину.
                  </span>
                </div>
              </div>

              <div className="bg-[#111722] border border-[#243044] rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-white">Меню «Проект ▾», сохранение и печать</h3>
                <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                  <li><strong>Сохранение в «Мои скважины»</strong> — сохраняет все исходные данные, выбранный насос, ПЭД и гидрозащиту локально в браузере.</li>
                  <li><strong>Экспорт и импорт JSON</strong> — позволяет передать проект коллеге файлом или сохранить резервную копию расчёта.</li>
                  <li><strong>Техкарта УЭЦН</strong> — формирует готовую спецификацию с поддержкой чистой печати А4 / PDF и выгрузки в CSV для Excel.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="px-5 py-3 border-t border-[#243044] bg-[#0e141f] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span className="font-mono">ESP EXPERT v10.4 PRO · Разработчик: Носар Андрей</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a2332] hover:bg-[#243044] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
