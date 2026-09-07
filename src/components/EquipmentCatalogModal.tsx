import React, { useState, useMemo } from 'react';
import { NT_CATALOG_2026, NTPumpRaw, NTMotorRaw, NTHydroRaw } from '../data/ntCatalog';
import { PUMP_DATABASE } from '../data/pumps';
import {
  X,
  Search,
  Layers,
  Zap,
  Shield,
  Filter,
  Check,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Download,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface EquipmentCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPump: (pumpId: string) => void;
  selectedPumpName?: string;
}

export const EquipmentCatalogModal: React.FC<EquipmentCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectPump,
  selectedPumpName
}) => {
  const [activeTab, setActiveTab] = useState<'pumps' | 'motors' | 'hydros'>('pumps');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Фильтры для насосов
  const [gabFilter, setGabFilter] = useState<string>('all');
  const [matFilter, setMatFilter] = useState<string>('all');

  // Фильтры для двигателей
  const [motorTypeFilter, setMotorTypeFilter] = useState<string>('all');
  const [motorDiamFilter, setMotorDiamFilter] = useState<string>('all');

  // Фильтрация насосов
  const filteredPumps = useMemo(() => {
    return NT_CATALOG_2026.pumps.filter(p => {
      if (gabFilter !== 'all' && p.gab !== gabFilter) return false;
      if (matFilter !== 'all' && p.mat !== matFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesGab = p.gab.toLowerCase().includes(q);
        const matchesMat = p.mat.toLowerCase().includes(q);
        const matchesQ = String(p.q50).includes(q);
        if (!matchesName && !matchesGab && !matchesMat && !matchesQ) return false;
      }
      return true;
    });
  }, [gabFilter, matFilter, searchQuery]);

  // Фильтрация двигателей
  const filteredMotors = useMemo(() => {
    return NT_CATALOG_2026.motors.filter(m => {
      if (motorTypeFilter !== 'all' && m.type !== motorTypeFilter) return false;
      if (motorDiamFilter !== 'all' && String(m.diam) !== motorDiamFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesPower = String(m.power).includes(q);
        const matchesDiam = String(m.diam).includes(q);
        if (!matchesName && !matchesPower && !matchesDiam) return false;
      }
      return true;
    });
  }, [motorTypeFilter, motorDiamFilter, searchQuery]);

  // Фильтрация гидрозащит
  const filteredHydros = useMemo(() => {
    return NT_CATALOG_2026.hydros.filter(h => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return h.name.toLowerCase().includes(q) || String(h.diam).includes(q);
      }
      return true;
    });
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleApplyPump = (pRaw: NTPumpRaw) => {
    // Находим соответствующий насос в PUMP_DATABASE
    const found = PUMP_DATABASE.find(p => p.name === pRaw.name);
    if (found) {
      onSelectPump(found.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111722] border border-[#243044] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Заголовок модального окна */}
        <div className="px-6 py-4 border-b border-[#243044] flex items-center justify-between bg-[#0e141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Оборудование ООО «Новые Технологии»
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  КАТАЛОГ 2026 ГОДА
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Полный серийный ряд погружного оборудования: насосы ЭЦН/ПЭЦН/ВН, двигатели ПЭД/ВПЭД и гидрозащиты
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a2332] hover:bg-[#243044] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Панель вкладок категорий и поиска */}
        <div className="px-6 py-3 border-b border-[#243044] bg-[#141b27] flex flex-wrap items-center justify-between gap-3">
          {/* Вкладки */}
          <div className="flex items-center gap-1.5 bg-[#0b0e14] p-1 rounded-xl border border-[#243044]">
            <button
              onClick={() => { setActiveTab('pumps'); setSearchQuery(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'pumps'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Насосы ЭЦН / ПЭЦН ({NT_CATALOG_2026.pumps.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('motors'); setSearchQuery(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'motors'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Двигатели ПЭД / ВПЭД ({NT_CATALOG_2026.motors.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('hydros'); setSearchQuery(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'hydros'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Гидрозащиты ({NT_CATALOG_2026.hydros.length})</span>
            </button>
          </div>

          {/* Строка поиска */}
          <div className="relative flex items-center min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по шифру / параметру..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0e14] border border-[#243044] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Панель фильтров для активной вкладки */}
        <div className="px-6 py-2.5 border-b border-[#243044] bg-[#0e141f] flex flex-wrap items-center gap-4 text-xs">
          {activeTab === 'pumps' && (
            <>
              {/* Фильтр по габариту */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Габарит:</span>
                <div className="flex items-center gap-1">
                  {['all', '2A', '3', '5', '5A', '6', '7A'].map(gab => (
                    <button
                      key={gab}
                      onClick={() => setGabFilter(gab)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        gabFilter === gab
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-[#1a2332] text-slate-400 hover:text-white'
                      }`}
                    >
                      {gab === 'all' ? 'Все' : gab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Фильтр по материалу */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Материал:</span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'Все' },
                    { id: 'нирезист', label: 'Нирезист' },
                    { id: 'ПКМ', label: 'ПКМ (Полимер)' },
                    { id: 'винт', label: 'Винтовой' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMatFilter(m.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        matFilter === m.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-[#1a2332] text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto text-[11px] font-mono text-slate-400">
                Отображено: <span className="text-white font-bold">{filteredPumps.length}</span> из {NT_CATALOG_2026.pumps.length}
              </div>
            </>
          )}

          {activeTab === 'motors' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Тип двигателя:</span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'Все' },
                    { id: 'пэд', label: 'Асинхронные ПЭД (до 130°C)' },
                    { id: 'впэд', label: 'Вентильные ВПЭД (до 230°C)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setMotorTypeFilter(t.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        motorTypeFilter === t.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-[#1a2332] text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Диаметр:</span>
                <div className="flex items-center gap-1">
                  {['all', '81', '103', '117', '130', '143'].map(d => (
                    <button
                      key={d}
                      onClick={() => setMotorDiamFilter(d)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        motorDiamFilter === d
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-[#1a2332] text-slate-400 hover:text-white'
                      }`}
                    >
                      {d === 'all' ? 'Все' : `${d} мм`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto text-[11px] font-mono text-slate-400">
                Отображено: <span className="text-white font-bold">{filteredMotors.length}</span> из {NT_CATALOG_2026.motors.length}
              </div>
            </>
          )}

          {activeTab === 'hydros' && (
            <div className="text-[11px] font-mono text-slate-400">
              Гидрозащиты протекторного типа серии ПА / 2ПА / 3ПА / 4ПА производства ООО «Новые Технологии»
            </div>
          )}
        </div>

        {/* Основное содержимое каталога с прокруткой */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#0b0e14]">
          {/* ================= НАСОСЫ ================= */}
          {activeTab === 'pumps' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPumps.map((p, idx) => {
                const isSelected = selectedPumpName === p.name;
                return (
                  <div
                    key={idx}
                    className={`bg-[#111722] border rounded-xl p-4 transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                        : 'border-[#243044] hover:border-slate-500 hover:bg-[#141b27]'
                    }`}
                  >
                    <div>
                      {/* Верхняя строка карточки */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white font-mono">{p.name}</h3>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Габарит {p.gab} · Ø{p.diam} мм · скв. ≥{p.minCol} мм
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            p.mat === 'ПКМ'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : p.mat === 'винт'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {p.mat}
                        </span>
                      </div>

                      {/* Технические характеристики */}
                      <div className="grid grid-cols-3 gap-1.5 my-3 text-center">
                        <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                          <span className="text-[10px] text-slate-400 block">Подача Qном</span>
                          <span className="text-xs font-bold font-mono text-sky-400">{p.q50} м³/сут</span>
                          <span className="text-[9px] text-slate-400 block">({p.qmin}–{p.qmax})</span>
                        </div>
                        <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                          <span className="text-[10px] text-slate-400 block">Напор секции</span>
                          <span className="text-xs font-bold font-mono text-emerald-400">{p.h_sec} м</span>
                          <span className="text-[9px] text-slate-400 block">{(p.h_sec / (p.stages_per_section || 100)).toFixed(1)} м/ст</span>
                        </div>
                        <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                          <span className="text-[10px] text-slate-400 block">КПД ступени</span>
                          <span className="text-xs font-bold font-mono text-amber-400">{p.eff}%</span>
                          <span className="text-[9px] text-slate-400 block">{p.n100} кВт/100ст</span>
                        </div>
                      </div>

                      {/* Дополнительные параметры */}
                      <div className="space-y-1 text-[11px] font-mono text-slate-400 py-1 border-t border-[#1e2738]">
                        <div className="flex justify-between">
                          <span>Предел мощности вала (прямой):</span>
                          <span className="text-slate-200">{p.maxPwrDir} кВт</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Предел мощности вала (с ЧРП):</span>
                          <span className="text-sky-300">{p.maxPwrSoft} кВт</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ступеней в секции:</span>
                          <span className="text-slate-200">{p.stages_per_section || 100} шт.</span>
                        </div>
                      </div>
                    </div>

                    {/* Кнопка выбора для расчета */}
                    <div className="mt-3 pt-2 border-t border-[#1e2738]">
                      <button
                        onClick={() => handleApplyPump(p)}
                        className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 cursor-default'
                            : 'bg-[#1a2332] hover:bg-blue-600 text-slate-200 hover:text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Выбран в скважине</span>
                          </>
                        ) : (
                          <>
                            <span>Применить в расчет</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= ДВИГАТЕЛИ ================= */}
          {activeTab === 'motors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMotors.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-[#111722] border border-[#243044] hover:border-slate-500 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono">{m.name}</h3>
                        <p className="text-[11px] text-slate-400">
                          Ø{m.diam} мм · {m.sections} {m.sections === 1 ? 'секция' : 'секции'} · L={m.len} м
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          m.type === 'впэд'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {m.type === 'впэд' ? 'Вентильный (PMSM)' : 'Асинхронный (ПЭД)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 my-3 text-center">
                      <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                        <span className="text-[10px] text-slate-400 block">Мощность</span>
                        <span className="text-xs font-bold font-mono text-sky-400">{m.power} кВт</span>
                      </div>
                      <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                        <span className="text-[10px] text-slate-400 block">КПД двигателя</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">{(m.eff_m * 100).toFixed(1)}%</span>
                      </div>
                      <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                        <span className="text-[10px] text-slate-400 block">Термостойкость</span>
                        <span className="text-xs font-bold font-mono text-amber-400">{m.temp_max}°C</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-slate-400 py-1 border-t border-[#1e2738]">
                      <div className="flex justify-between">
                        <span>Типовой диапазон частот ЧРП:</span>
                        <span className="text-slate-200">
                          {m.type === 'впэд' ? '35 – 200 Гц (до 6000 об/мин)' : '40 – 60 Гц (до 3000 об/мин)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Габарит обсадной колонны:</span>
                        <span className="text-slate-200">
                          {m.diam <= 103 ? 'от 140 мм' : m.diam <= 117 ? 'от 146 мм' : m.diam <= 130 ? 'от 168 мм' : 'от 178 мм'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= ГИДРОЗАЩИТЫ ================= */}
          {activeTab === 'hydros' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredHydros.map((h, idx) => (
                <div
                  key={idx}
                  className="bg-[#111722] border border-[#243044] hover:border-slate-500 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-white font-mono">{h.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                        Ø{h.diam} мм
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3">
                      Модуль гидрозащиты электродвигателя с открытой/диафрагменной камерой
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                        <span className="text-[10px] text-slate-400 block">Осевая нагрузка пяты</span>
                        <span className="text-sm font-bold text-emerald-400">{h.axial_kg} кгс</span>
                      </div>
                      <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                        <span className="text-[10px] text-slate-400 block">Объем барьерного масла</span>
                        <span className="text-sm font-bold text-sky-400">{h.oil} л</span>
                      </div>
                      <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1e2738]">
                        <span className="text-[10px] text-slate-400 block">Макс. температура</span>
                        <span className="text-sm font-bold text-amber-400">{h.temp}°C</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Нижний информационный колонтитул */}
        <div className="px-6 py-3 border-t border-[#243044] bg-[#0e141f] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div>
            Завод-изготовитель: <span className="text-slate-200 font-semibold">ООО «Новые Технологии» (НТ)</span> · Стандарты ГОСТ Р 56830-2015
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a2332] hover:bg-[#243044] text-white text-xs font-semibold rounded-xl transition-all"
          >
            Закрыть реестр
          </button>
        </div>

      </div>
    </div>
  );
};
