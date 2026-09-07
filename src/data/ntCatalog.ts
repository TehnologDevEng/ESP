import { PumpModel, MotorModel } from '../types/esp';

export interface NTPumpRaw {
  name: string;
  q50: number;
  qmin: number;
  qmax: number;
  h_sec: number;       // напор секции (100 ступеней), м
  n100: number;        // мощность на 100 ступеней, кВт
  eff: number;         // КПД, %
  diam: number;        // диаметр насоса, мм
  gab: '2A' | '3' | '5' | '5A' | '6' | '7A';
  mat: 'нирезист' | 'ПКМ' | 'винт';
  minCol: number;      // мин. внутр. диаметр колонны, мм
  maxPwrDir: number;   // макс. мощность вала при прямом пуске, кВт
  maxPwrSoft: number;  // макс. мощность вала при ЧРП/мягком пуске, кВт
  l_sec: number;       // длина секции / ступени, м
  stages_per_section: number;
  type?: string;
}

export interface NTMotorRaw {
  name: string;
  power: number;       // кВт
  diam: number;        // мм (81, 103, 117, 130, 143)
  type: 'пэд' | 'впэд';
  sections: number;
  temp_max: number;    // °C (130 для ПЭД, 230 для ВПЭД)
  eff_m: number;       // КПД (0.82 - 0.94)
  len: number;         // длина, м
}

export interface NTHydroRaw {
  name: string;
  diam: number;        // мм
  axial_kg: number;    // допустимая осевая нагрузка пяты, кгс
  temp: number;        // макс. температура, °C
  oil: number;         // объем масла, л
}

export const NT_CATALOG_2026 = {
  pumps: [
    // 2А нирезист
    {name:"Х22ЭЦНКИС2А-30И",q50:30,qmin:20,qmax:42,h_sec:560,n100:8.0,eff:42,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:61,maxPwrSoft:77,l_sec:0.36,stages_per_section:100},
    {name:"Х25ЭЦНКИС2А-30И",q50:30,qmin:20,qmax:42,h_sec:560,n100:8.0,eff:42,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:61,maxPwrSoft:77,l_sec:0.36,stages_per_section:100},
    {name:"Х22ЭЦНКИС2А-50И",q50:50,qmin:33,qmax:68,h_sec:720,n100:8.0,eff:46,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:68,maxPwrSoft:86,l_sec:0.36,stages_per_section:100},
    {name:"Х25ЭЦНКИС2А-50И",q50:50,qmin:33,qmax:68,h_sec:720,n100:8.0,eff:46,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:68,maxPwrSoft:86,l_sec:0.36,stages_per_section:100},
    {name:"Х22ЭЦНКИС2А-60И",q50:60,qmin:40,qmax:82,h_sec:910,n100:7.0,eff:48,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:103,l_sec:0.32,stages_per_section:100},
    {name:"Х25ЭЦНКИС2А-60И",q50:60,qmin:40,qmax:82,h_sec:910,n100:7.0,eff:48,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:103,l_sec:0.32,stages_per_section:100},
    {name:"Х22ЭЦНКИС2А-80И",q50:80,qmin:52,qmax:108,h_sec:719,n100:10.4,eff:48,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:65,maxPwrSoft:82,l_sec:0.47,stages_per_section:100},
    {name:"Х25ЭЦНКИС2А-80И",q50:80,qmin:52,qmax:108,h_sec:719,n100:10.4,eff:48,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:65,maxPwrSoft:82,l_sec:0.47,stages_per_section:100},
    {name:"Х22ЭЦНКИС2А-100И",q50:100,qmin:65,qmax:135,h_sec:1122,n100:20.8,eff:52,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:125,l_sec:0.94,stages_per_section:100},
    {name:"Х25ЭЦНКИС2А-100И",q50:100,qmin:65,qmax:135,h_sec:1122,n100:20.8,eff:52,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:125,l_sec:0.94,stages_per_section:100},
    {name:"Х22ЭЦНКИС2А-160",q50:160,qmin:104,qmax:216,h_sec:2100,n100:28.6,eff:55,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:125,l_sec:1.29,stages_per_section:100},
    {name:"Х25ЭЦНКИС2А-160",q50:160,qmin:104,qmax:216,h_sec:2100,n100:28.6,eff:55,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:125,l_sec:1.29,stages_per_section:100},
    {name:"Х22ЭЦНКИС2А-200",q50:200,qmin:130,qmax:270,h_sec:675,n100:33.3,eff:58,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:103,l_sec:1.50,stages_per_section:100},
    {name:"Х25ЭЦНКИС2А-200",q50:200,qmin:130,qmax:270,h_sec:675,n100:33.3,eff:58,diam:69,gab:"2A",mat:"нирезист",minCol:90,maxPwrDir:81,maxPwrSoft:103,l_sec:1.50,stages_per_section:100},
    
    // 2А ПКМ
    {name:"Х25ПЭЦНКИС2А-80И",q50:80,qmin:52,qmax:108,h_sec:719,n100:10.4,eff:48,diam:69,gab:"2A",mat:"ПКМ",minCol:90,maxPwrDir:65,maxPwrSoft:82,l_sec:0.47,stages_per_section:100},
    
    // 3 нирезист
    {name:"Х25ЭЦНКИС3-80И",q50:80,qmin:52,qmax:108,h_sec:1500,n100:26.1,eff:64,diam:81,gab:"3",mat:"нирезист",minCol:102,maxPwrDir:106,maxPwrSoft:134,l_sec:1.17,stages_per_section:100},
    {name:"Х25ЭЦНКИС3-160",q50:160,qmin:104,qmax:216,h_sec:1085,n100:30.9,eff:55,diam:81,gab:"3",mat:"нирезист",minCol:102,maxPwrDir:96,maxPwrSoft:122,l_sec:1.39,stages_per_section:100},
    {name:"Х22ЭЦНКИС3-350",q50:350,qmin:228,qmax:473,h_sec:1162,n100:46.0,eff:59,diam:81,gab:"3",mat:"нирезист",minCol:102,maxPwrDir:95,maxPwrSoft:120,l_sec:2.07,stages_per_section:100},
    
    // 5 нирезист
    {name:"X22ЭЦНКИД5-20",q50:20,qmin:13,qmax:28,h_sec:460,n100:3.6,eff:42,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:100,maxPwrSoft:120,l_sec:0.16,stages_per_section:100},
    {name:"X22ЭЦНКИС5-25И",q50:25,qmin:16,qmax:35,h_sec:485,n100:3.2,eff:42,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:100,maxPwrSoft:120,l_sec:0.14,stages_per_section:100},
    {name:"X22ЭЦНКИД5-30",q50:30,qmin:20,qmax:42,h_sec:520,n100:4.8,eff:44,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:120,maxPwrSoft:150,l_sec:0.22,stages_per_section:100},
    {name:"X22ЭЦНКИС5-30И",q50:30,qmin:20,qmax:42,h_sec:468,n100:3.2,eff:44,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:120,maxPwrSoft:150,l_sec:0.14,stages_per_section:100},
    {name:"X22ЭЦНКИД5-35",q50:35,qmin:23,qmax:49,h_sec:450,n100:5.0,eff:46,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:120,maxPwrSoft:150,l_sec:0.23,stages_per_section:100},
    {name:"X22ЭЦНКИД5-45",q50:45,qmin:29,qmax:62,h_sec:438,n100:5.0,eff:50,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:130,maxPwrSoft:160,l_sec:0.23,stages_per_section:100},
    {name:"X22ЭЦНКИД5-50",q50:50,qmin:33,qmax:68,h_sec:510,n100:6.0,eff:58,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:130,maxPwrSoft:160,l_sec:0.27,stages_per_section:100},
    {name:"X22ЭЦНКИД5-60",q50:60,qmin:40,qmax:82,h_sec:475,n100:7.0,eff:58,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:130,maxPwrSoft:160,l_sec:0.32,stages_per_section:100},
    {name:"X22ЭЦНКИД5-80",q50:80,qmin:52,qmax:108,h_sec:432,n100:7.0,eff:60,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:150,maxPwrSoft:180,l_sec:0.32,stages_per_section:100},
    {name:"X22ЭЦНКИД5-80И",q50:80,qmin:52,qmax:108,h_sec:811,n100:9.0,eff:62,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:150,maxPwrSoft:180,l_sec:0.41,stages_per_section:100},
    {name:"X22ЭЦНКИД5-100",q50:100,qmin:65,qmax:135,h_sec:466,n100:10.0,eff:63,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:160,maxPwrSoft:200,l_sec:0.45,stages_per_section:100},
    {name:"X22ЭЦНКИД5-100И",q50:100,qmin:65,qmax:135,h_sec:465,n100:10.0,eff:63,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:160,maxPwrSoft:200,l_sec:0.45,stages_per_section:100},
    {name:"X22ЭЦНКИД5-125",q50:125,qmin:82,qmax:168,h_sec:470,n100:9.0,eff:64,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:170,maxPwrSoft:210,l_sec:0.41,stages_per_section:100},
    {name:"X22ЭЦНКИД5-125М",q50:125,qmin:82,qmax:168,h_sec:869,n100:10.0,eff:64,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:170,maxPwrSoft:210,l_sec:0.45,stages_per_section:100},
    {name:"X22ЭЦНКИ5-125",q50:125,qmin:82,qmax:168,h_sec:485,n100:9.0,eff:64,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:170,maxPwrSoft:210,l_sec:0.41,stages_per_section:100},
    {name:"X22ЭЦНКИД5-160",q50:160,qmin:104,qmax:216,h_sec:329,n100:10.0,eff:65,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:180,maxPwrSoft:220,l_sec:0.45,stages_per_section:100},
    {name:"X22ЭЦНКИД5-200И",q50:200,qmin:130,qmax:270,h_sec:304,n100:16.0,eff:66,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:200,maxPwrSoft:250,l_sec:0.72,stages_per_section:100},
    {name:"X22ЭЦНКИД5-200М",q50:200,qmin:130,qmax:270,h_sec:1207,n100:9.0,eff:66,diam:92,gab:"5",mat:"нирезист",minCol:140,maxPwrDir:200,maxPwrSoft:250,l_sec:0.41,stages_per_section:100},
    
    // 5 ПКМ
    {name:"X22ПЭЦНКИД5-30",q50:30,qmin:20,qmax:42,h_sec:520,n100:5.0,eff:48,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:120,maxPwrSoft:150,l_sec:0.23,stages_per_section:100},
    {name:"X22ПЭЦНКИД5-45",q50:45,qmin:29,qmax:62,h_sec:438,n100:5.0,eff:52,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:130,maxPwrSoft:160,l_sec:0.23,stages_per_section:100},
    {name:"X22ПЭЦНКИД5-50",q50:50,qmin:33,qmax:68,h_sec:510,n100:6.0,eff:58,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:130,maxPwrSoft:160,l_sec:0.27,stages_per_section:100},
    {name:"X22ПЭЦНКИД5-60",q50:60,qmin:40,qmax:82,h_sec:475,n100:7.0,eff:60,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:130,maxPwrSoft:160,l_sec:0.32,stages_per_section:100},
    {name:"X22ПЭЦНКИД5-80",q50:80,qmin:52,qmax:108,h_sec:432,n100:7.0,eff:62,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:150,maxPwrSoft:180,l_sec:0.32,stages_per_section:100},
    {name:"X22ПЭЦНКИ5-125",q50:125,qmin:82,qmax:168,h_sec:485,n100:9.0,eff:64,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:170,maxPwrSoft:210,l_sec:0.41,stages_per_section:100},
    {name:"X22ПЭЦНКИ5-145",q50:145,qmin:94,qmax:196,h_sec:485,n100:10.0,eff:65,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:170,maxPwrSoft:210,l_sec:0.45,stages_per_section:100},
    {name:"X22ПЭЦНКИ5-200И",q50:200,qmin:130,qmax:270,h_sec:304,n100:16.0,eff:66,diam:92,gab:"5",mat:"ПКМ",minCol:140,maxPwrDir:200,maxPwrSoft:250,l_sec:0.72,stages_per_section:100},
    
    // 5А нирезист
    {name:"X22ЭЦНКИД5А-25И",q50:25,qmin:16,qmax:35,h_sec:1200,n100:5.0,eff:48,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:130,maxPwrSoft:160,l_sec:0.23,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-35И",q50:35,qmin:23,qmax:49,h_sec:1050,n100:6.0,eff:50,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:130,maxPwrSoft:160,l_sec:0.27,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-35",q50:35,qmin:23,qmax:49,h_sec:1050,n100:6.0,eff:50,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:130,maxPwrSoft:160,l_sec:0.27,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-45",q50:45,qmin:29,qmax:62,h_sec:960,n100:7.0,eff:52,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:140,maxPwrSoft:170,l_sec:0.32,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-50",q50:50,qmin:33,qmax:68,h_sec:920,n100:8.0,eff:54,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:140,maxPwrSoft:170,l_sec:0.36,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-60",q50:60,qmin:40,qmax:82,h_sec:840,n100:9.0,eff:56,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:150,maxPwrSoft:180,l_sec:0.41,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-80И",q50:80,qmin:52,qmax:108,h_sec:720,n100:10.0,eff:58,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:160,maxPwrSoft:200,l_sec:0.45,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-100",q50:100,qmin:65,qmax:135,h_sec:640,n100:11.0,eff:60,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:170,maxPwrSoft:210,l_sec:0.50,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-125",q50:125,qmin:82,qmax:168,h_sec:580,n100:12.0,eff:62,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:180,maxPwrSoft:220,l_sec:0.54,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-160И",q50:160,qmin:104,qmax:216,h_sec:500,n100:14.0,eff:64,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:200,maxPwrSoft:240,l_sec:0.63,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-160М",q50:160,qmin:104,qmax:216,h_sec:520,n100:15.0,eff:64,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:200,maxPwrSoft:240,l_sec:0.68,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-200М",q50:200,qmin:130,qmax:270,h_sec:450,n100:17.0,eff:66,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:220,maxPwrSoft:260,l_sec:0.77,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-250",q50:250,qmin:163,qmax:338,h_sec:400,n100:20.0,eff:68,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:250,maxPwrSoft:300,l_sec:0.90,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-250М",q50:250,qmin:163,qmax:338,h_sec:420,n100:21.0,eff:68,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:250,maxPwrSoft:300,l_sec:0.95,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-280М",q50:280,qmin:182,qmax:378,h_sec:380,n100:23.0,eff:70,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:270,maxPwrSoft:320,l_sec:1.04,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-320",q50:320,qmin:208,qmax:432,h_sec:350,n100:25.0,eff:72,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:280,maxPwrSoft:340,l_sec:1.13,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-360",q50:360,qmin:234,qmax:486,h_sec:310,n100:28.0,eff:73,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:300,maxPwrSoft:360,l_sec:1.26,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-400",q50:400,qmin:260,qmax:540,h_sec:290,n100:30.0,eff:74,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:320,maxPwrSoft:380,l_sec:1.35,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-400М",q50:400,qmin:260,qmax:540,h_sec:300,n100:32.0,eff:74,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:320,maxPwrSoft:380,l_sec:1.44,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-500",q50:500,qmin:325,qmax:675,h_sec:250,n100:35.0,eff:76,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:360,maxPwrSoft:420,l_sec:1.58,stages_per_section:100},
    {name:"X22ЭЦНКИД5А-500М",q50:500,qmin:325,qmax:675,h_sec:260,n100:38.0,eff:76,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:360,maxPwrSoft:420,l_sec:1.71,stages_per_section:100},
    {name:"X22ЭЦНКИС5А-700",q50:700,qmin:455,qmax:945,h_sec:200,n100:45.0,eff:78,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:400,maxPwrSoft:480,l_sec:2.03,stages_per_section:100},
    {name:"X22ЭЦНКИС5А-800",q50:800,qmin:520,qmax:1080,h_sec:170,n100:50.0,eff:79,diam:103,gab:"5A",mat:"нирезист",minCol:130,maxPwrDir:450,maxPwrSoft:520,l_sec:2.25,stages_per_section:100},
    
    // 5А ПКМ
    {name:"X22ПЭЦНКИД5А-35И",q50:35,qmin:23,qmax:49,h_sec:1050,n100:6.0,eff:50,diam:103,gab:"5A",mat:"ПКМ",minCol:130,maxPwrDir:130,maxPwrSoft:160,l_sec:0.27,stages_per_section:100},
    {name:"X22ПЭЦНКИД5А-60И",q50:60,qmin:40,qmax:82,h_sec:840,n100:9.0,eff:56,diam:103,gab:"5A",mat:"ПКМ",minCol:130,maxPwrDir:150,maxPwrSoft:180,l_sec:0.41,stages_per_section:100},
    {name:"X22ПЭЦНКИ5А-160М",q50:160,qmin:104,qmax:216,h_sec:520,n100:15.0,eff:64,diam:103,gab:"5A",mat:"ПКМ",minCol:130,maxPwrDir:200,maxPwrSoft:240,l_sec:0.68,stages_per_section:100},
    {name:"X22ПЭЦНКИ5А-250",q50:250,qmin:163,qmax:338,h_sec:400,n100:20.0,eff:68,diam:103,gab:"5A",mat:"ПКМ",minCol:130,maxPwrDir:250,maxPwrSoft:300,l_sec:0.90,stages_per_section:100},
    {name:"X22ПЭЦНКИД5А-400",q50:400,qmin:260,qmax:540,h_sec:290,n100:30.0,eff:74,diam:103,gab:"5A",mat:"ПКМ",minCol:130,maxPwrDir:320,maxPwrSoft:380,l_sec:1.35,stages_per_section:100},
    
    // 6 нирезист
    {name:"X22ЭЦНКИС6-1000",q50:1000,qmin:650,qmax:1350,h_sec:160,n100:190,eff:58,diam:114,gab:"6",mat:"нирезист",minCol:168,maxPwrDir:500,maxPwrSoft:600,l_sec:8.55,stages_per_section:100},
    {name:"X22ЭЦНКИС6-1250",q50:1250,qmin:812,qmax:1688,h_sec:130,n100:220,eff:58,diam:114,gab:"6",mat:"нирезист",minCol:168,maxPwrDir:600,maxPwrSoft:720,l_sec:9.90,stages_per_section:100},
    
    // 7А нирезист
    {name:"X22ЭЦНКИС7А-1000",q50:1000,qmin:650,qmax:1350,h_sec:180,n100:210,eff:59,diam:136,gab:"7A",mat:"нирезист",minCol:178,maxPwrDir:600,maxPwrSoft:720,l_sec:9.45,stages_per_section:100},
    {name:"X22ЭЦНКИС7А-1500",q50:1500,qmin:975,qmax:2025,h_sec:140,n100:290,eff:59,diam:136,gab:"7A",mat:"нирезист",minCol:178,maxPwrDir:700,maxPwrSoft:840,l_sec:13.05,stages_per_section:100},
    {name:"X22ЭЦНКИС7А-1600",q50:1600,qmin:1040,qmax:2160,h_sec:130,n100:305,eff:59,diam:136,gab:"7A",mat:"нирезист",minCol:178,maxPwrDir:750,maxPwrSoft:900,l_sec:13.73,stages_per_section:100},
    
    // Винтовой
    {name:"ВН5-50-1500",type:"винтовой",q50:50,qmin:20,qmax:70,h_sec:1500,n100:15.0,eff:65,diam:102,gab:"5A",mat:"винт",minCol:130,maxPwrDir:100,maxPwrSoft:140,l_sec:0.68,stages_per_section:100}
  ] as NTPumpRaw[],

  motors: [
    {name:"ПЭД8-103В5",power:8,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.82,len:4.5},
    {name:"ПЭД12-103В5",power:12,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.83,len:5.0},
    {name:"ПЭД14-103В5",power:14,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.83,len:5.2},
    {name:"ПЭД16-103В5",power:16,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.84,len:5.5},
    {name:"ПЭД22-103В5",power:22,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.85,len:6.0},
    {name:"ПЭД32-103В5",power:32,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.86,len:6.5},
    {name:"ПЭД45-103В5",power:45,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.87,len:7.0},
    {name:"ПЭД63-103В5",power:63,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.88,len:8.0},
    {name:"ПЭД80-103В5",power:80,diam:103,type:"пэд",sections:1,temp_max:130,eff_m:0.88,len:9.0},
    {name:"ПЭДС90-103В5",power:90,diam:103,type:"пэд",sections:2,temp_max:130,eff_m:0.88,len:10.0},
    {name:"ПЭДС125-103В5",power:125,diam:103,type:"пэд",sections:2,temp_max:130,eff_m:0.89,len:11.0},
    {name:"ПЭДС160-103В5",power:160,diam:103,type:"пэд",sections:2,temp_max:130,eff_m:0.89,len:12.5},
    {name:"ПЭДС210-103В5",power:210,diam:103,type:"пэд",sections:3,temp_max:130,eff_m:0.90,len:14.0},
    {name:"ПЭД8-117В5",power:8,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.82,len:4.0},
    {name:"ПЭД16-117В5",power:16,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.84,len:5.0},
    {name:"ПЭД22-117В5",power:22,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.85,len:5.5},
    {name:"ПЭД32-117В5",power:32,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.86,len:6.0},
    {name:"ПЭД45-117В5",power:45,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.87,len:6.5},
    {name:"ПЭД63-117В5",power:63,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.88,len:7.5},
    {name:"ПЭД80-117В5",power:80,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.88,len:8.0},
    {name:"ПЭД100-117В5",power:100,diam:117,type:"пэд",sections:1,temp_max:130,eff_m:0.89,len:9.0},
    {name:"ПЭДС90-117В5",power:90,diam:117,type:"пэд",sections:2,temp_max:130,eff_m:0.88,len:9.5},
    {name:"ПЭДС125-117В5",power:125,diam:117,type:"пэд",sections:2,temp_max:130,eff_m:0.89,len:10.5},
    {name:"ПЭДС180-117В5",power:180,diam:117,type:"пэд",sections:2,temp_max:130,eff_m:0.90,len:12.0},
    {name:"ПЭДС250-117В5",power:250,diam:117,type:"пэд",sections:3,temp_max:130,eff_m:0.91,len:14.0},
    {name:"ПЭДС360-117В5",power:360,diam:117,type:"пэд",sections:3,temp_max:130,eff_m:0.91,len:16.0},
    {name:"ПЭД16-130В5",power:16,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.84,len:5.0},
    {name:"ПЭД22-130В5",power:22,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.85,len:5.5},
    {name:"ПЭД32-130В5",power:32,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.86,len:6.0},
    {name:"ПЭД45-130В5",power:45,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.87,len:6.5},
    {name:"ПЭД63-130В5",power:63,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.88,len:7.5},
    {name:"ПЭД80-130В5",power:80,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.88,len:8.0},
    {name:"ПЭД100-130В5",power:100,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.89,len:9.0},
    {name:"ПЭД125-130В5",power:125,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.89,len:10.0},
    {name:"ПЭД160-130В5",power:160,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.90,len:11.0},
    {name:"ПЭД180-130В5",power:180,diam:130,type:"пэд",sections:1,temp_max:130,eff_m:0.90,len:12.0},
    {name:"ПЭДС200-130В5",power:200,diam:130,type:"пэд",sections:2,temp_max:130,eff_m:0.90,len:13.0},
    {name:"ПЭДС250-130В5",power:250,diam:130,type:"пэд",sections:2,temp_max:130,eff_m:0.91,len:14.5},
    {name:"ПЭДС360-130В5",power:360,diam:130,type:"пэд",sections:3,temp_max:130,eff_m:0.92,len:16.5},
    {name:"ПЭДС500-130В5",power:500,diam:130,type:"пэд",sections:3,temp_max:130,eff_m:0.92,len:18.0},
    {name:"ПЭД32-143В5",power:32,diam:143,type:"пэд",sections:1,temp_max:130,eff_m:0.86,len:6.0},
    {name:"ПЭД63-143В5",power:63,diam:143,type:"пэд",sections:1,temp_max:130,eff_m:0.88,len:7.5},
    {name:"ПЭД100-143В5",power:100,diam:143,type:"пэд",sections:1,temp_max:130,eff_m:0.89,len:9.0},
    {name:"ПЭД160-143В5",power:160,diam:143,type:"пэд",sections:1,temp_max:130,eff_m:0.90,len:11.0},
    {name:"ПЭД220-143В5",power:220,diam:143,type:"пэд",sections:1,temp_max:130,eff_m:0.90,len:13.0},
    {name:"ПЭДС260-143В5",power:260,diam:143,type:"пэд",sections:2,temp_max:130,eff_m:0.91,len:14.0},
    {name:"ПЭДС400-143В5",power:400,diam:143,type:"пэд",sections:3,temp_max:130,eff_m:0.92,len:17.0},
    {name:"ПЭДС555-143В5",power:555,diam:143,type:"пэд",sections:3,temp_max:130,eff_m:0.93,len:19.0},
    {name:"ВПЭД18-117",power:18,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.88,len:4.5},
    {name:"ВПЭД27-117",power:27,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.89,len:5.0},
    {name:"ВПЭД45-117",power:45,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.90,len:6.0},
    {name:"ВПЭД60-117",power:60,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.91,len:7.0},
    {name:"ВПЭД80-117",power:80,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.92,len:8.0},
    {name:"ВПЭД100-117",power:100,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.93,len:9.0},
    {name:"ВПЭД140-117",power:140,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.93,len:10.0},
    {name:"ВПЭД250-117",power:250,diam:117,type:"впэд",sections:1,temp_max:230,eff_m:0.94,len:12.0},
    {name:"ВПЭДГ14-81",power:14,diam:81,type:"впэд",sections:1,temp_max:230,eff_m:0.87,len:4.0},
    {name:"ВПЭДГ28-81",power:28,diam:81,type:"впэд",sections:1,temp_max:230,eff_m:0.89,len:5.0},
    {name:"ВПЭДГ40-81",power:40,diam:81,type:"впэд",sections:1,temp_max:230,eff_m:0.90,len:6.0},
    {name:"ВПЭДГ55-81",power:55,diam:81,type:"впэд",sections:1,temp_max:230,eff_m:0.91,len:7.0},
    {name:"ВПЭДГ70-81",power:70,diam:81,type:"впэд",sections:1,temp_max:230,eff_m:0.92,len:8.0}
  ] as NTMotorRaw[],

  hydros: [
    {name:"ПА92Д",diam:92,axial_kg:100,temp:140,oil:6.0},
    {name:"2ПА92Д",diam:92,axial_kg:950,temp:140,oil:6.0},
    {name:"3ПА92Д",diam:92,axial_kg:950,temp:360,oil:8.0},
    {name:"4ПА92Д",diam:92,axial_kg:750,temp:140,oil:6.0},
    {name:"2ПА103Д",diam:103,axial_kg:1200,temp:140,oil:6.0},
    {name:"3ПА114Д",diam:114,axial_kg:1500,temp:500,oil:11.0},
    {name:"ПАВ92Д",diam:92,axial_kg:360,temp:360,oil:6.0},
    {name:"ПАД92",diam:92,axial_kg:360,temp:360,oil:2.5}
  ] as NTHydroRaw[]
};

// Функция преобразования сырых данных насоса НТ в объект PumpModel для расчетов
export function convertNTPumpToModel(p: NTPumpRaw, index: number): PumpModel {
  const stagesCount = p.stages_per_section || 100;
  const hStageNom = p.h_sec / stagesCount;
  const pStageNom = p.n100 / stagesCount;
  
  // Коэффициенты аппроксимации кривой H(Q) = a0 - a1*Q - a2*Q^2
  // a0 ~ 1.25 * hStageNom (напор при закрытой задвижке)
  const a0 = Number((hStageNom * 1.28).toFixed(3));
  const a2 = Number((0.28 * hStageNom / (p.q50 * p.q50)).toFixed(7));
  const a1 = Number(((a0 - hStageNom - a2 * p.q50 * p.q50) / p.q50).toFixed(5));

  // Коэффициенты аппроксимации мощности P(Q) = b0 + b1*Q + b2*Q^2
  const b0 = Number((pStageNom * 0.52).toFixed(4));
  const b1 = Number(((pStageNom * 0.48) / p.q50).toFixed(6));
  const b2 = 0;

  // КПД: Eff(Q) = c0 + c1*Q - c2*Q^2
  const c2 = Number((p.eff / (p.q50 * p.q50)).toFixed(6));
  const c1 = Number((2 * p.eff / p.q50).toFixed(4));
  const c0 = 0;

  // Габаритная серия насоса
  const seriesNum = p.gab === '2A' ? 2 : p.gab === '3' ? 3 : p.gab === '5' ? 5 : p.gab === '5A' ? 5.5 : p.gab === '6' ? 6 : 7;
  
  // Монтажная длина одной ступени (мм)
  const stageLengthMm = Math.max(35, Math.min(85, Math.round(p.l_sec * 1000 / 4)));

  const id = `nt-${p.name.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-')}-${index}`;

  return {
    id,
    name: p.name,
    manufacturer: 'ООО «Новые Технологии»',
    series: seriesNum,
    outerDiam: p.diam,
    minCasingID: p.minCol,
    qNom: p.q50,
    qMin: p.qmin,
    qMax: p.qmax,
    hStageNom: Number(hStageNom.toFixed(2)),
    pStageNom: Number(pStageNom.toFixed(3)),
    effNom: p.eff,
    stageLength: stageLengthMm,
    maxStagesPerSection: stagesCount,
    coeffH: [a0, Math.max(0.001, a1), Math.max(0.00001, a2)],
    coeffP: [b0, b1, b2],
    coeffEff: [c0, c1, c2]
  };
}

// Преобразование моторов НТ в MotorModel
export function convertNTMotorToModel(m: NTMotorRaw, index: number): MotorModel {
  // Номинальное напряжение в зависимости от мощности
  const voltage = m.power <= 16 ? 600 : m.power <= 32 ? 800 : m.power <= 63 ? 1000 : m.power <= 125 ? 1300 : m.power <= 250 ? 1800 : 2300;
  const efficiency = Math.round(m.eff_m * 1000) / 10;
  const powerFactor = m.type === 'впэд' ? 0.94 : 0.84;
  // Ток: I = P / (sqrt(3) * U * cosPhi * eff)
  const current = Number(((m.power * 1000) / (Math.sqrt(3) * voltage * powerFactor * (efficiency / 100))).toFixed(1));
  const massKg = Math.round(m.len * 50 + m.power * 3.5);

  return {
    id: `nt-motor-${m.name.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-')}-${index}`,
    name: m.name,
    powerRatingKW: m.power,
    voltageV: voltage,
    currentA: current,
    efficiency: efficiency,
    powerFactor: powerFactor,
    outerDiam: m.diam,
    lengthM: m.len,
    massKg: massKg
  };
}
