import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  ClipboardCheck,
  ClipboardList,
  Coins,
  FileText,
  Home,
  LayoutGrid,
  Leaf,
  ListChecks,
  LogOut,
  Mail,
  MapPin,
  Menu,
  PieChart,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  Trash2,
  UserRound,
  WalletCards,
  Wheat,
  X,
} from 'lucide-react';
import {
  categories,
  costBreakdown,
  navItems,
} from './data.js';

const iconMap = {
  ข้อมูลภาพรวม: Home,
  บันทึกกิจกรรม: ClipboardList,
  กิจกรรมล่าสุด: ListChecks,
  บัญชีต้นทุน: FileText,
  ผลผลิต: Wheat,
  รายงาน: PieChart,
  ศูนย์ช่วยเหลือ: CircleHelp,
};

const categoryIconMap = {
  ทั้งหมด: LayoutGrid,
  เพาะปลูก: Sprout,
  ดูแล: Leaf,
  เก็บเกี่ยว: Wheat,
};

const baht = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 0,
});

const decimalBaht = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const thaiDateFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatActivityDate(value) {
  const thaiDatePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const thaiDateMatch = String(value || '').trim().match(thaiDatePattern);
  if (thaiDateMatch) {
    const [, day, month, year] = thaiDateMatch;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  const fallbackDate = new Date();
  const date = value ? new Date(`${value}T00:00:00`) : fallbackDate;

  if (Number.isNaN(date.getTime())) return value || '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const buddhistYear = date.getFullYear() + 543;
  return `${day}/${month}/${buddhistYear}`;
}

function getTodayDisplayDate() {
  return formatActivityDate(getTodayInputValue());
}

function formatDateInputDisplay(value) {
  return formatActivityDate(value || getTodayInputValue());
}

function getCurrentThaiTime() {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

const cropOptions = ['ข้าว', 'มันสำปะหลัง', 'อ้อย', 'ข้าวโพด', 'ถั่วเหลือง', 'อื่นๆ'];
const productionUnitOptions = ['กิโลกรัม', 'ตัน', 'กรัม', 'ลิตร', 'อื่นๆ'];

function getPlotLabel(plot) {
  if (!plot) return '';
  return `แปลงที่ ${plot.number} - ${plot.name}`;
}

function formatPlotArea(plotArea) {
  if (!plotArea) return '-';

  const rai = Number(plotArea.rai || 0);
  const ngan = Number(plotArea.ngan || 0);
  const wah = Number(plotArea.wah || 0);

  if (rai <= 0 && ngan <= 0 && wah <= 0) return '-';

  return `${rai} ไร่ ${ngan} งาน ${wah} วา`;
}

function getPlotNumberFromLabel(plotLabel) {
  const match = String(plotLabel || '').match(/แปลงที่\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

const USER_STORAGE_KEY = 'farmcost:session:v3';
const DEFAULT_SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzShwF8OHH_94wKJsds_VVhFNxAor-76fkRj8pMx_6UkgbAvjs_PqcnWUuJ8wq5aEvM/exec';
const LOCAL_USERS_KEY = 'farmcost:localUsers:v3';
const LOCAL_STATES_KEY = 'farmcost:localStates:v3';
const farmFieldsImage = `${import.meta.env.BASE_URL}farm-fields.png`;
const farmCostLogo = `${import.meta.env.BASE_URL}farmcost-logo.png`;

function getStoredSession() {
  try {
    const stored = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);
    if (!session?.user?.id) return null;

    return {
      ...session,
      endpoint: typeof session.endpoint === 'string' ? session.endpoint : DEFAULT_SHEET_ENDPOINT,
      mode: session.mode || (session.endpoint ? 'google-sheet' : 'local'),
    };
  } catch {
    return null;
  }
}

function getStoredEndpoint() {
  return DEFAULT_SHEET_ENDPOINT;
}

function createDefaultUserState() {
  return {
    activities: [],
    plots: [],
    updatedAt: new Date().toISOString(),
  };
}

function getLocalCollection(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function setLocalCollection(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app still works for the current session when storage is unavailable.
  }
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) return `0${digits.slice(2)}`;
  if (digits.startsWith('660') && digits.length === 12) return `0${digits.slice(3)}`;
  return digits;
}

function normalizePhoneInput(phone) {
  return normalizePhone(phone).slice(0, 10);
}

function userFriendlyAuthMessage(result, mode) {
  const rawMessage = String(result?.message || '').trim();
  const normalized = rawMessage.toLowerCase();

  if (mode === 'login') {
    if (normalized.includes('not found') || normalized.includes('account')) {
      return 'ไม่พบบัญชีของเบอร์นี้ กรุณาสมัครสมาชิกก่อน หรือใช้เบอร์ที่เคยสมัครไว้';
    }

    if (normalized.includes('wrong') || normalized.includes('password') || normalized.includes('pin')) {
      return 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    }

    if (normalized.includes('inactive')) {
      return 'บัญชีนี้ยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
    }
  }

  if (mode === 'register' && normalized.includes('registered')) {
    return 'เบอร์โทรนี้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ';
  }

  return rawMessage || 'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง';
}

function createUserId() {
  return window.crypto?.randomUUID?.() || `user-${Date.now()}`;
}

async function hashSecret(value) {
  const cleanValue = value.trim();
  if (window.crypto?.subtle && window.TextEncoder) {
    const bytes = new TextEncoder().encode(`farmcost:${cleanValue}`);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return window.btoa(unescape(encodeURIComponent(cleanValue)));
}

function requestJsonp(endpoint, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `farmcostCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => {
      delete window[callbackName];
      script.remove();
      reject(new Error('หมดเวลารอการตอบกลับจากระบบจัดเก็บข้อมูล'));
    }, 15000);

    window[callbackName] = (response) => {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
      resolve(response);
    };

    const url = new URL(endpoint);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    url.searchParams.set('callback', callbackName);

    script.onerror = () => {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
      reject(new Error('เชื่อมต่อระบบจัดเก็บข้อมูลไม่สำเร็จ'));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function callMembershipApi(action, payload, endpoint) {
  const cleanEndpoint = endpoint.trim();
  if (!cleanEndpoint) {
    return callLocalMembershipApi(action, payload);
  }

  try {
    const remoteResult = await requestJsonp(cleanEndpoint, {
      action,
      payload,
      clientTime: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
    });

    if (remoteResult?.ok) return remoteResult;

    const shouldRetryWithoutLeadingZero = action === 'login'
      && payload.phone?.startsWith('0')
      && payload.phone.length === 10
      && String(remoteResult?.message || '').toLowerCase().includes('not found');

    if (shouldRetryWithoutLeadingZero) {
      const retryResult = await requestJsonp(cleanEndpoint, {
        action,
        payload: {
          ...payload,
          phone: payload.phone.slice(1),
        },
        clientTime: new Date().toISOString(),
        userAgent: window.navigator.userAgent,
      });

      if (retryResult?.ok) {
        return {
          ...retryResult,
          user: retryResult.user
            ? { ...retryResult.user, phone: payload.phone }
            : retryResult.user,
        };
      }
    }

    const localResult = await callLocalMembershipApi(action, payload);
    if (localResult.ok) {
      return {
        ...localResult,
        localOnly: true,
        message: action === 'login'
          ? 'เข้าสู่ระบบจากข้อมูลในเครื่องนี้แล้ว และจะบันทึกข้อมูลใหม่ในเครื่องนี้ก่อน'
          : localResult.message,
      };
    }

    return remoteResult;
  } catch (error) {
    const localResult = await callLocalMembershipApi(action, payload);
    if (localResult.ok) {
      return {
        ...localResult,
        localOnly: true,
        message: action === 'login'
          ? 'เชื่อมต่อ Google Sheets ไม่สำเร็จ จึงเข้าสู่ระบบจากข้อมูลในเครื่องนี้'
          : localResult.message,
      };
    }

    return { ok: false, message: error.message || 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' };
  }
}

async function callLocalMembershipApi(action, payload) {
  const users = getLocalCollection(LOCAL_USERS_KEY);
  const states = getLocalCollection(LOCAL_STATES_KEY);
  const phone = normalizePhone(payload.phone || '');

  if (action === 'register') {
    if (users[phone]) {
      return { ok: false, message: 'เบอร์โทรนี้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ' };
    }

    const user = {
      id: createUserId(),
      name: payload.name,
      phone,
      farmName: payload.farmName,
      role: payload.role,
      createdAt: new Date().toISOString(),
    };

    users[phone] = { ...user, pinHash: payload.pinHash };
    states[user.id] = createDefaultUserState();
    setLocalCollection(LOCAL_USERS_KEY, users);
    setLocalCollection(LOCAL_STATES_KEY, states);

    return {
      ok: true,
      user,
      token: `local-${Date.now()}`,
      state: states[user.id],
      message: 'สมัครสมาชิกสำเร็จ',
    };
  }

  if (action === 'login') {
    const record = users[phone];
    if (!record || record.pinHash !== payload.pinHash) {
      return { ok: false, message: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง' };
    }

    const { pinHash, ...user } = record;
    return {
      ok: true,
      user,
      token: `local-${Date.now()}`,
      state: states[user.id] || createDefaultUserState(),
      message: 'เข้าสู่ระบบสำเร็จ',
    };
  }

  return { ok: false, message: 'ไม่รู้จักคำสั่งนี้' };
}

async function saveUserState(session, appState) {
  const state = {
    ...appState,
    updatedAt: new Date().toISOString(),
  };

  const states = getLocalCollection(LOCAL_STATES_KEY);
  states[session.user.id] = state;
  setLocalCollection(LOCAL_STATES_KEY, states);

  const endpoint = session.endpoint || DEFAULT_SHEET_ENDPOINT;
  if (!endpoint.trim()) {
    return { ok: true, localOnly: true };
  }

  const savePayload = {
    userId: session.user.id,
    token: session.token,
    state,
    savedAt: new Date().toISOString(),
  };

  try {
    const remoteResult = await requestJsonp(endpoint, {
      action: 'saveState',
      payload: savePayload,
      clientTime: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
    });

    if (remoteResult?.ok) return remoteResult;
  } catch {
    // Long or rejected JSONP requests fall back to POST below.
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveState',
        ...savePayload,
      }),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function totalCost(activity) {
  return Number(activity.labor) + materialTotal(activity) + Number(activity.plotRentExpense || 0);
}

function materialTotal(activity) {
  if (Array.isArray(activity.materialItems)) {
    return activity.materialItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  return Number(activity.material || 0);
}

function incomeTotal(activity) {
  if (Array.isArray(activity.productionItems)) {
    const productionIncome = activity.productionItems.reduce((sum, item) => sum + Number(item.income || 0), 0);
    if (productionIncome > 0) return productionIncome;
  }

  return Number(activity.income || 0);
}

function productionItems(activity) {
  return Array.isArray(activity.productionItems) ? activity.productionItems : [];
}

function productionTotal(activity) {
  return productionItems(activity).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function getProductionTotalsByUnit(items) {
  const grouped = (Array.isArray(items) ? items : []).reduce((collection, item) => {
    const quantity = Number(item.quantity || 0);
    const unit = String(item.unitOther || item.unit || '').trim() || 'ไม่ระบุหน่วย';
    if (quantity <= 0) return collection;

    collection[unit] = (collection[unit] || 0) + quantity;
    return collection;
  }, {});

  return Object.entries(grouped).map(([unit, quantity]) => ({ unit, quantity }));
}

function formatProductionTotalsByUnit(items) {
  const rows = getProductionTotalsByUnit(items);
  if (rows.length === 0) return '-';

  return rows
    .map(({ unit, quantity }) => `${decimalBaht.format(quantity)} ${unit}`)
    .join(', ');
}

function ProductionUnitTotals({ totals }) {
  if (!Array.isArray(totals) || totals.length === 0) {
    return <strong className="production-unit-totals empty">-</strong>;
  }

  return (
    <strong className="production-unit-totals">
      {totals.map(({ unit, quantity }, index) => (
        <span className={`unit-total unit-tone-${(index % 4) + 1}`} key={unit}>
          {decimalBaht.format(quantity)} {unit}
        </span>
      ))}
    </strong>
  );
}

function formatProductionSummary(activity) {
  return formatProductionTotalsByUnit(productionItems(activity));
}

function getMonthlyCost(activities) {
  return activities.reduce((sum, item) => sum + totalCost(item), 0);
}

function getMonthlyIncome(activities) {
  return activities.reduce((sum, item) => sum + incomeTotal(item), 0);
}

function getPlotExpenseRows(activities) {
  const grouped = activities.reduce((collection, activity) => {
    const plot = activity.plot || 'ไม่ระบุแปลง';
    if (!collection[plot]) {
      collection[plot] = {
        plot,
        labor: 0,
        material: 0,
        total: 0,
      };
    }

    collection[plot].labor += Number(activity.labor || 0);
    collection[plot].material += materialTotal(activity);
    collection[plot].total += totalCost(activity);
    return collection;
  }, {});

  return Object.values(grouped).sort((a, b) => getPlotNumberFromLabel(b.plot) - getPlotNumberFromLabel(a.plot));
}

function getPlotCycleRows(activities) {
  const grouped = activities.reduce((collection, activity) => {
    const plot = activity.plot || 'ไม่ระบุแปลง';
    if (!collection[plot]) {
      collection[plot] = {
        plot,
        activities: 0,
        cost: 0,
        rent: 0,
        income: 0,
        crops: new Set(),
      };
    }

    collection[plot].activities += 1;
    collection[plot].cost += totalCost(activity);
    collection[plot].rent += Number(activity.plotRentExpense || 0);
    collection[plot].income += incomeTotal(activity);
    if (activity.crop) collection[plot].crops.add(activity.crop);
    return collection;
  }, {});

  return Object.values(grouped)
    .map((row) => ({
      ...row,
      profit: row.income - row.cost,
      crops: Array.from(row.crops),
    }))
    .sort((a, b) => getPlotNumberFromLabel(b.plot) - getPlotNumberFromLabel(a.plot));
}

function getNavView(item) {
  return {
    [navItems[0]]: 'overview',
    [navItems[1]]: 'activities',
    [navItems[2]]: 'activityHistory',
    [navItems[3]]: 'settings',
  }[item];
}

const pageTitles = {
  overview: 'แดชบอร์ดฟาร์ม',
  activities: 'บันทึกกิจกรรม',
  activityHistory: 'กิจกรรมล่าสุด',
  costs: 'บัญชีต้นทุน',
  produce: 'ผลผลิต',
  reports: 'รายงาน',
  settings: 'ศูนย์ช่วยเหลือ',
};

function Sidebar({ activeView, currentUser, onLogout, setActiveView }) {
  return (
    <aside className="sidebar" aria-label="เมนูหลัก">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <img className="brand-logo" src={farmCostLogo} alt="" />
        </div>
        <div>
          <strong>FarmCost</strong>
          <span>ระบบบันทึกกิจกรรมฟาร์ม และบัญชีต้นทุนเกษตรกร</span>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = iconMap[item];
          const view = getNavView(item);
          return (
            <button
              className={`nav-item ${activeView === view ? 'active' : ''}`}
              key={item}
              onClick={() => setActiveView(view)}
              type="button"
            >
              <Icon size={22} />
              <span>{item}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-art" aria-hidden="true">
        <img src={farmFieldsImage} alt="" />
      </div>

      <div className="farm-user">
        <span className="user-avatar">
          <UserRound size={24} />
        </span>
        <span>
          <strong>{currentUser.name}</strong>
          <small>{currentUser.farmName || currentUser.role || 'ผู้ใช้งานฟาร์ม'}</small>
        </span>
        <button className="logout-button" onClick={onLogout} type="button" aria-label="ออกจากระบบ">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

function MobileHeader({ onLogout, setActiveView }) {
  return (
    <header className="mobile-header">
      <div className="mobile-brand">
        <span className="brand-mark" aria-hidden="true">
          <img className="brand-logo" src={farmCostLogo} alt="" />
        </span>
        <div>
          <strong>FarmCost</strong>
          <span>ระบบสมาชิกสำหรับบันทึกกิจกรรมฟาร์มและบัญชีต้นทุน</span>
        </div>
      </div>
      <div className="mobile-header-actions">
        <button
          className="icon-button light"
          onClick={() => setActiveView('settings')}
          type="button"
          aria-label="ศูนย์ช่วยเหลือ"
        >
          <CircleHelp size={23} />
        </button>
        <button className="icon-button light" onClick={onLogout} type="button" aria-label="ออกจากระบบ">
          <LogOut size={23} />
        </button>
      </div>
    </header>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    farmName: '',
    role: 'เจ้าของฟาร์ม',
    pin: '',
  });
  const endpoint = getStoredEndpoint();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(key, value) {
    setMessage('');
    setForm((current) => ({
      ...current,
      [key]: key === 'phone' ? normalizePhoneInput(value) : value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(mode === 'register' ? 'กำลังสมัครสมาชิก...' : 'กำลังเข้าสู่ระบบ...');

    if (form.pin.trim().length < 4) {
      setMessage('กรุณาตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      setIsSubmitting(false);
      return;
    }

    const phone = normalizePhone(form.phone);
    if (phone.length !== 10) {
      setMessage('กรุณากรอกเบอร์โทรเป็นตัวเลข 10 หลัก');
      setIsSubmitting(false);
      return;
    }

    const pinHash = await hashSecret(form.pin);
    const payload = {
      name: form.name.trim(),
      phone,
      farmName: form.farmName.trim(),
      role: form.role.trim() || 'ผู้ใช้งานฟาร์ม',
      pinHash,
      userAgent: window.navigator.userAgent,
    };

    const result = await callMembershipApi(mode === 'register' ? 'register' : 'login', payload, endpoint);

    if (!result.ok) {
      setMessage(userFriendlyAuthMessage(result, mode));
      setIsSubmitting(false);
      return;
    }

    if (mode === 'register') {
      setMode('login');
      setForm((current) => ({
        ...current,
        name: '',
        farmName: '',
        role: 'เจ้าของฟาร์ม',
        pin: '',
      }));
      setMessage('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบด้วยเบอร์โทรและรหัสผ่านที่สมัครไว้');
      setIsSubmitting(false);
      return;
    }

    onLogin(
      {
        user: result.user,
        token: result.token,
        endpoint: result.localOnly ? '' : endpoint.trim(),
        mode: result.localOnly || !endpoint.trim() ? 'local' : 'google-sheet',
      },
      result.state || createDefaultUserState(),
    );
    setIsSubmitting(false);
  }

  return (
    <main
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(9, 97, 55, 0.92), rgba(5, 61, 40, 0.9)), url("${farmFieldsImage}")`,
      }}
    >
      <section className="login-card" aria-label="เข้าสู่ระบบและสมัครสมาชิก FarmCost">
        <div className="login-brand">
          <span className="brand-mark">
            <img className="brand-logo" src={farmCostLogo} alt="" />
          </span>
          <div>
            <strong>FarmCost</strong>
            <p>ระบบสมาชิกสำหรับบันทึกกิจกรรมฟาร์มและบัญชีต้นทุน</p>
          </div>
        </div>

        <div className="login-copy">
          <h1>{mode === 'register' ? 'สมัครสมาชิกเกษตรกร' : 'เข้าสู่ระบบฟาร์มของคุณ'}</h1>
          <p>
            เมื่อเข้าสู่ระบบ แอปจะโหลดข้อมูลกิจกรรมและบัญชีต้นทุนของผู้ใช้คนนั้นกลับมาเหมือนเดิม
            และบันทึกการเปลี่ยนแปลงไว้ในระบบจัดเก็บข้อมูลที่ตั้งค่าไว้แล้ว
          </p>
        </div>

        <div className="login-tabs" role="tablist" aria-label="เลือกโหมดบัญชี">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
            role="tab"
            type="button"
            aria-selected={mode === 'login'}
          >
            เข้าสู่ระบบ
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
            role="tab"
            type="button"
            aria-selected={mode === 'register'}
          >
            สมัครสมาชิก
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-grid">
            {mode === 'register' && (
              <label>
                <span>ชื่อผู้ใช้งาน</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="เช่น สมชาย เกษตรกร"
                  required
                  type="text"
                />
              </label>
            )}
            <label>
              <span>เบอร์โทร</span>
              <input
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="08xxxxxxxx"
                required
                type="tel"
              />
            </label>
            <label>
              <span>รหัสผ่าน/PIN</span>
              <input
                value={form.pin}
                onChange={(event) => updateField('pin', event.target.value)}
                placeholder="อย่างน้อย 4 ตัวอักษร"
                required
                type="password"
              />
            </label>
            {mode === 'register' && (
              <>
                <label>
                  <span>ชื่อฟาร์ม</span>
                  <input
                    value={form.farmName}
                    onChange={(event) => updateField('farmName', event.target.value)}
                    placeholder="เช่น ฟาร์มผักอินทรีย์"
                    type="text"
                  />
                </label>
                <label>
                  <span>บทบาท</span>
                  <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
                    <option>เจ้าของฟาร์ม</option>
                    <option>ผู้จัดการแปลง</option>
                    <option>พนักงานบันทึกข้อมูล</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <p className="login-note">
            <ShieldCheck size={18} />
            ระบบจะเก็บรหัสผ่านเป็นค่า hash และบันทึกข้อมูลกิจกรรม/ต้นทุนแยกตามบัญชีผู้ใช้
          </p>

          <button className="login-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'กำลังดำเนินการ...' : mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
          {message && <p className="login-status">{message}</p>}
        </form>
      </section>
    </main>
  );
}

function Topbar({ activeView, query, setQuery }) {
  return (
    <div className="topbar">
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหากิจกรรมหรือแปลง"
            type="search"
          />
        </label>
        <button className="icon-button" aria-label="แจ้งเตือน">
          <Bell size={22} />
        </button>
        <button className="icon-button" aria-label="ช่วยเหลือ">
          <CircleHelp size={22} />
        </button>
      </div>
    </div>
  );
}

function KpiCard({ tone, icon: Icon, title, value, suffix, change }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <span className="kpi-icon">
        <Icon size={30} />
      </span>
      <div>
        <h2>{title}</h2>
        <strong>{value}</strong>
        <p>{suffix}</p>
      </div>
      <small className={tone === 'danger' ? 'danger-text' : 'trend-text'}>{change}</small>
    </article>
  );
}

function DashboardStats({ activities }) {
  const cost = getMonthlyCost(activities);
  const income = getMonthlyIncome(activities);
  const profit = income - cost;

  return (
    <section className="kpi-grid" aria-label="สรุปภาพรวม">
      <KpiCard
        tone="green"
        icon={WalletCards}
        title="ต้นทุนทั้งหมด"
        value={decimalBaht.format(cost)}
        suffix="บาท"
        change="เริ่มจากข้อมูลที่บันทึกจริง"
      />
      <KpiCard
        tone="blue"
        icon={Coins}
        title="รายรับผลผลิต"
        value={decimalBaht.format(income)}
        suffix="บาท"
        change="รวมรายรับจากกิจกรรมที่บันทึก"
      />
      <KpiCard
        tone="gold"
        icon={BarChart3}
        title="กำไรสุทธิ"
        value={decimalBaht.format(profit)}
        suffix="บาท"
        change="คำนวณจากรายรับ - ต้นทุน"
      />
    </section>
  );
}

function PlotCycleDashboard({ activities }) {
  const rows = getPlotCycleRows(activities);

  return (
    <article className="panel plot-cycle-panel">
      <div className="panel-heading">
        <div>
          <h2>รอบการเพาะปลูกและแปลงเพาะปลูก</h2>
          <p>สรุปกิจกรรมและงบประมาณจำแนกตามรายแปลงเพาะปลูก</p>
          <p className="plot-cycle-formula">
            ต้นทุนสะสม = ค่าแรง/ค่าจ้าง + ค่าวัสดุ + ค่าเช่า ของทุกกิจกรรมในแปลงนี้
            <br />
            กำไรสุทธิ = รายรับรวม - ต้นทุนสะสม
          </p>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="plot-cycle-grid">
          {rows.map((row) => (
            <section className="plot-cycle-card" key={row.plot}>
              <div>
                <span>{row.activities} กิจกรรม</span>
                <h3>{row.plot}</h3>
                <p>{row.crops.length > 0 ? row.crops.join(', ') : 'ยังไม่ระบุพืชที่ปลูก'}</p>
              </div>
              <dl>
                <div>
                  <dt>ต้นทุนสะสม</dt>
                  <dd>{decimalBaht.format(row.cost)} บาท</dd>
                </div>
                <div>
                  <dt>กำไรสุทธิ</dt>
                  <dd className={row.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                    {decimalBaht.format(row.profit)} บาท
                  </dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <p className="chart-empty">ยังไม่มีข้อมูลรอบการเพาะปลูกและแปลงเพาะปลูก</p>
      )}
    </article>
  );
}

function PlotExpenseBarChart({ activities, onShowAll }) {
  const rows = getPlotExpenseRows(activities);
  const maxValue = Math.max(...rows.map((row) => row.total), 0);

  return (
    <article className="panel plot-expense-panel">
      <div className="panel-heading">
        <div>
          <h2>สัดส่วนค่าใช้จ่ายสะสม</h2>
          <p>เปรียบเทียบค่าแรง/ค่าจ้างและค่าวัสดุของแต่ละแปลงเพาะปลูก</p>
        </div>
        <div className="chart-legend" aria-label="คำอธิบายกราฟแท่ง">
          <span className="bar-key labor">ค่าแรง/ค่าจ้าง</span>
          <span className="bar-key material">ค่าวัสดุ</span>
        </div>
      </div>

      {rows.length > 0 && maxValue > 0 ? (
        <div className="plot-bars" role="img" aria-label="กราฟแท่งค่าใช้จ่ายสะสมแยกตามแปลง">
          {rows.map((row) => {
            const laborPercent = (row.labor / maxValue) * 100;
            const materialPercent = (row.material / maxValue) * 100;
            return (
              <div className="plot-bar-row" key={row.plot}>
                <div className="plot-bar-label">
                  <strong>{row.plot}</strong>
                  <span>{decimalBaht.format(row.total)} บาท</span>
                </div>
                <div className="stacked-bar">
                  <span className="labor" style={{ width: `${laborPercent}%` }} />
                  <span className="material" style={{ width: `${materialPercent}%` }} />
                </div>
                <div className="plot-bar-values">
                  <span>ค่าแรง/ค่าจ้าง {decimalBaht.format(row.labor)}</span>
                  <span>วัสดุ {decimalBaht.format(row.material)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="chart-empty">ยังไม่มีข้อมูลค่าใช้จ่ายรายแปลง</p>
      )}
    </article>
  );
}

function DonutChart() {
  const total = costBreakdown.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;

  if (costBreakdown.length === 0 || total <= 0) {
    return (
      <article className="panel donut-panel">
        <div className="panel-heading">
          <h2>ต้นทุนตามหมวด</h2>
        </div>
        <p className="chart-empty">ยังไม่มีข้อมูลต้นทุน</p>
      </article>
    );
  }

  return (
    <article className="panel donut-panel">
      <div className="panel-heading">
        <h2>ต้นทุนตามหมวด</h2>
      </div>
      <div className="donut-layout">
        <div className="donut-wrap">
          <svg viewBox="0 0 120 120" role="img" aria-label="ต้นทุนตามหมวด">
            <circle cx="60" cy="60" r="42" className="donut-track" />
            {costBreakdown.map((item) => {
              const portion = (item.value / total) * 100;
              const dash = `${portion} ${100 - portion}`;
              const segment = (
                <circle
                  key={item.label}
                  cx="60"
                  cy="60"
                  r="42"
                  className="donut-segment"
                  stroke={item.color}
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                />
              );
              offset -= portion;
              return segment;
            })}
          </svg>
          <div className="donut-center">
            <strong>{decimalBaht.format(total)}</strong>
            <span>บาท</span>
          </div>
        </div>
        <ul className="legend-list">
          {costBreakdown.map((item) => (
            <li key={item.label}>
              <span className="legend-dot" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
              <strong>{decimalBaht.format(item.value)}</strong>
            </li>
          ))}
        </ul>
      </div>
      <button className="text-link" onClick={onShowAll} type="button">
        ดูทั้งหมด <ChevronRight size={17} />
      </button>
    </article>
  );
}

function parseDisplayDate(value) {
  const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const christianYear = Number(year) > 2400 ? Number(year) - 543 : Number(year);
  const date = new Date(christianYear, Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function cashflowPointLabel(date) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function getCashflowData(activities) {
  const grouped = activities.reduce((collection, activity) => {
    const date = parseDisplayDate(activity.date) || new Date();
    const key = date.toISOString().slice(0, 10);

    if (!collection[key]) {
      collection[key] = {
        key,
        date,
        month: cashflowPointLabel(date),
        income: 0,
        expense: 0,
      };
    }

    collection[key].income += incomeTotal(activity);
    collection[key].expense += totalCost(activity);
    return collection;
  }, {});

  return Object.values(grouped)
    .sort((a, b) => a.date - b.date)
    .slice(-6);
}

function chartPath(data, key, maxValue, height = 150, width = 440) {
  if (data.length < 2 || maxValue <= 0) return '';

  const step = width / (data.length - 1);
  return data
    .map((item, index) => {
      const x = index * step;
      const y = height - (item[key] / maxValue) * (height - 16) + 6;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function CashflowChart({ activities }) {
  const cashflowData = getCashflowData(activities);
  const maxValue = Math.max(...cashflowData.flatMap((item) => [item.income, item.expense, Math.abs(item.income - item.expense)]), 0);

  if (cashflowData.length === 0 || !Number.isFinite(maxValue) || maxValue <= 0) {
    return (
      <article className="panel cashflow-panel">
        <div className="panel-heading">
          <h2>กระแสเงินสด</h2>
        </div>
        <p className="chart-empty">ยังไม่มีข้อมูลกระแสเงินสด</p>
      </article>
    );
  }

  const incomePath = chartPath(cashflowData, 'income', maxValue);
  const expensePath = chartPath(cashflowData, 'expense', maxValue);
  const profitPoints = cashflowData.map((item) => ({ ...item, profit: Math.max(item.income - item.expense, 0) }));
  const profitPath = chartPath(profitPoints, 'profit', maxValue);
  const singlePoint = cashflowData.length === 1;

  return (
    <article className="panel cashflow-panel">
      <div className="panel-heading">
        <h2>กระแสเงินสด</h2>
        <div className="chart-legend" aria-label="คำอธิบายกราฟ">
          <span className="line-key income">รายรับ</span>
          <span className="line-key expense">รายจ่าย</span>
          <span className="line-key profit">กำไรสุทธิ</span>
        </div>
      </div>
      <div className="line-chart" role="img" aria-label="กราฟกระแสเงินสดรายเดือน">
        <svg viewBox="0 0 500 218">
          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              className="grid-line"
              x1="34"
              x2="474"
              y1={36 + line * 42}
              y2={36 + line * 42}
            />
          ))}
          <g transform="translate(34 24)">
            {!singlePoint && <path d={incomePath} className="chart-line income" />}
            {!singlePoint && <path d={expensePath} className="chart-line expense" />}
            {!singlePoint && <path d={profitPath} className="chart-line profit" />}
            {cashflowData.map((item, index) => {
              const step = singlePoint ? 0 : 440 / (cashflowData.length - 1);
              const x = singlePoint ? 220 : index * step;
              const incomeY = 150 - (item.income / maxValue) * 134 + 6;
              const expenseY = 150 - (item.expense / maxValue) * 134 + 6;
              const profit = Math.max(item.income - item.expense, 0);
              const profitY = 150 - (profit / maxValue) * 134 + 6;

              return (
                <g key={item.key}>
                  <circle cx={x} cy={incomeY} r="4.8" className="income-dot" />
                  <circle cx={x} cy={expenseY} r="4.8" className="expense-dot" />
                  <circle cx={x} cy={profitY} r="4.2" className="profit-dot" />
                </g>
              );
            })}
          </g>
          {[1, 0.8, 0.6, 0.4, 0.2, 0].map((portion, index) => (
            <text key={portion} x="0" y={27 + index * 31} className="axis-label">
              {baht.format(maxValue * portion)}
            </text>
          ))}
          {cashflowData.map((item, index) => (
            <text key={item.key} x={singlePoint ? 254 : 34 + index * (440 / (cashflowData.length - 1))} y="207" className="axis-label month">
              {item.month}
            </text>
          ))}
        </svg>
      </div>
    </article>
  );
}

function CategoryFilters({ activeCategory, setActiveCategory }) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="กรองกิจกรรม">
      {categories.map((category) => (
        <button
          key={category}
          className={activeCategory === category ? 'active' : ''}
          onClick={() => setActiveCategory(category)}
          role="tab"
          aria-selected={activeCategory === category}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

function CategoryChip({ category }) {
  const Icon = categoryIconMap[category] || Leaf;
  return (
    <span className={`category-chip ${category}`}>
      <Icon size={14} />
      {category}
    </span>
  );
}

function ActivityTable({ activities, activeCategory, onClearActivities, onDeleteActivity, setActiveCategory }) {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [activityPendingDelete, setActivityPendingDelete] = useState(null);
  const filteredActivities = activities.filter((item) => {
    return activeCategory === 'ทั้งหมด' || item.category === activeCategory;
  });
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const plot = activity.plot || 'ไม่ระบุแปลง';
    if (!groups[plot]) groups[plot] = [];
    groups[plot].push(activity);
    return groups;
  }, {});

  return (
    <article className="panel activity-panel">
      <div className="panel-heading table-heading">
        <h2>กิจกรรมล่าสุด</h2>
        <CategoryFilters activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>แปลง</th>
              <th>พืชที่ปลูก</th>
              <th>กิจกรรม</th>
              <th>ประเภท</th>
              <th>ค่าแรง/ค่าจ้าง (บาท)</th>
              <th>ค่าวัสดุ (บาท)</th>
              <th>รายรับ (บาท)</th>
              <th>ผลผลิต</th>
              <th>รวม (บาท)</th>
              <th>เวลาบันทึก</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <tr key={activity.id} className="clickable-row" onClick={() => setSelectedActivity(activity)}>
                  <td>{activity.date}</td>
                  <td>
                    <strong className="plot-name-cell">{activity.plot}</strong>
                  </td>
                  <td>{activity.crop || '-'}</td>
                  <td>{activity.task}</td>
                  <td>
                    <CategoryChip category={activity.category} />
                  </td>
                  <td>{decimalBaht.format(activity.labor)}</td>
                  <td>{decimalBaht.format(materialTotal(activity))}</td>
                  <td>{decimalBaht.format(incomeTotal(activity))}</td>
                  <td>{formatProductionSummary(activity)}</td>
                  <td>{decimalBaht.format(totalCost(activity))}</td>
                  <td>{activity.savedTime || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="table-detail-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedActivity(activity);
                        }}
                        type="button"
                      >
                        ดู
                      </button>
                      <button
                        className="table-delete-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActivityPendingDelete(activity);
                        }}
                        type="button"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="empty-table-cell">
                  ยังไม่มีกิจกรรมของผู้ใช้นี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="activity-list">
        {filteredActivities.length > 0 ? (
          Object.entries(groupedActivities).map(([plot, plotActivities]) => (
            <section className="activity-plot-group" key={plot}>
              <h3>{plot}</h3>
              {plotActivities.map((activity) => (
                <div className="activity-card" key={activity.id}>
                  <div className="activity-card-main">
                    <span className="activity-icon">
                      <Leaf size={22} />
                    </span>
                    <span className="activity-time-stack">
                      <small className="activity-timestamp">
                        <CalendarDays size={16} />
                        {activity.date || '-'}
                      </small>
                      <small className="activity-timestamp">
                        <Clock size={16} />
                        {activity.savedTime || '-'}
                      </small>
                    </span>
                  </div>
                  <div className="activity-card-actions">
                    <button className="activity-detail-action" onClick={() => setSelectedActivity(activity)} type="button">
                      ดูรายละเอียด
                    </button>
                    <button className="activity-delete-button" onClick={() => setActivityPendingDelete(activity)} type="button">
                      <Trash2 size={16} />
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ))
        ) : (
          <p className="empty-list">ยังไม่มีกิจกรรมของผู้ใช้นี้</p>
        )}
      </div>

      {filteredActivities.length > 0 && (
        <button className="danger-action clear-activities" onClick={() => setIsConfirmingClear(true)} type="button">
          <Trash2 size={18} />
          ลบกิจกรรมทั้งหมด
        </button>
      )}

      {isConfirmingClear && (
        <ConfirmClearModal
          activityCount={activities.length}
          onCancel={() => setIsConfirmingClear(false)}
          onConfirm={() => {
            onClearActivities();
            setIsConfirmingClear(false);
          }}
        />
      )}

      {activityPendingDelete && (
        <ConfirmDeleteActivityModal
          activity={activityPendingDelete}
          onCancel={() => setActivityPendingDelete(null)}
          onConfirm={() => {
            onDeleteActivity(activityPendingDelete.id);
            setActivityPendingDelete(null);
          }}
        />
      )}

      {selectedActivity && (
        <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      )}
    </article>
  );
}

function ConfirmClearModal({ activityCount, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-label="ยืนยันการลบกิจกรรมทั้งหมด" onClick={(event) => event.stopPropagation()}>
        <div className="confirm-icon">
          <Trash2 size={26} />
        </div>
        <div>
          <span className="confirm-eyebrow">ยืนยันการลบ</span>
          <h2>ต้องการลบกิจกรรมทั้งหมดหรือไม่?</h2>
          <p>
            ระบบจะลบกิจกรรมที่บันทึกไว้ทั้งหมด {activityCount} รายการออกจากบัญชีผู้ใช้นี้
            และไม่สามารถย้อนกลับได้
          </p>
        </div>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel} type="button">
            ยกเลิก
          </button>
          <button className="danger-action confirm-danger" onClick={onConfirm} type="button">
            <Trash2 size={18} />
            ยืนยันลบทั้งหมด
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmDeleteActivityModal({ activity, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-label="ยืนยันการลบกิจกรรม" onClick={(event) => event.stopPropagation()}>
        <div className="confirm-icon">
          <Trash2 size={26} />
        </div>
        <div>
          <span className="confirm-eyebrow">ยืนยันการลบ</span>
          <h2>ต้องการลบกิจกรรมนี้หรือไม่?</h2>
          <p>
            ระบบจะลบกิจกรรม "{activity.task}" ของ {activity.plot || 'แปลงนี้'}
            ออกจากบัญชีผู้ใช้นี้ และไม่สามารถย้อนกลับได้
          </p>
        </div>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel} type="button">
            ยกเลิก
          </button>
          <button className="danger-action confirm-danger" onClick={onConfirm} type="button">
            <Trash2 size={18} />
            ยืนยันลบ
          </button>
        </div>
      </section>
    </div>
  );
}

function ActivityDetailModal({ activity, onClose }) {
  const materials = Array.isArray(activity.materialItems) ? activity.materialItems : [];
  const outputs = productionItems(activity);
  const netProfit = incomeTotal(activity) - totalCost(activity);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="activity-detail-modal" role="dialog" aria-modal="true" aria-label="รายละเอียดกิจกรรม" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span>{activity.date} • {activity.savedTime || '-'}</span>
            <p>{activity.plot}</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="ปิดรายละเอียด">
            <X size={22} />
          </button>
        </div>

        <div className="detail-metrics">
          <div>
            <span>ค่าแรง/ค่าจ้าง</span>
            <strong className="metric-expense">{decimalBaht.format(activity.labor || 0)} บาท</strong>
          </div>
          <div>
            <span>ค่าวัสดุ</span>
            <strong className="metric-expense">{decimalBaht.format(materialTotal(activity))} บาท</strong>
          </div>
          <div>
            <span>ค่าเช่า</span>
            <strong className="metric-expense">{decimalBaht.format(activity.plotRentExpense || 0)} บาท</strong>
          </div>
          <div>
            <span>รายรับ</span>
            <strong>{decimalBaht.format(incomeTotal(activity))} บาท</strong>
          </div>
          <div>
            <span>กำไรสุทธิ</span>
            <strong className={netProfit < 0 ? 'metric-negative' : ''}>{decimalBaht.format(netProfit)} บาท</strong>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <h3>ข้อมูลกิจกรรม</h3>
            <dl>
              <div><dt>พืชที่ปลูก</dt><dd>{activity.crop || '-'}</dd></div>
              <div><dt>ขนาดพื้นที่</dt><dd>{formatPlotArea(activity.plotArea)}</dd></div>
            </dl>
          </div>
          <div>
            <h3>รายการวัสดุ</h3>
            {materials.length > 0 ? (
              <ul className="detail-list">
                {materials.map((item) => (
                  <li key={item.id || item.name}>
                    <span>{item.name || 'ไม่ระบุชื่อวัสดุ'}</span>
                    <strong>{decimalBaht.format(item.amount || 0)} บาท</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-empty">ไม่มีรายการวัสดุ</p>
            )}
          </div>
          <div>
            <h3>ผลผลิตที่ได้</h3>
            {outputs.length > 0 ? (
              <ul className="detail-list">
                {outputs.map((item) => (
                  <li key={item.id || `${item.quantity}-${item.unit}`}>
                    <span>{item.name || 'ผลผลิต'}</span>
                    <strong>
                      {decimalBaht.format(item.quantity || 0)} {item.unitOther || item.unit}
                      {Number(item.income || 0) > 0 ? ` / ${decimalBaht.format(item.income || 0)} บาท` : ''}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-empty">ยังไม่มีข้อมูลผลผลิต</p>
            )}
          </div>
          <div>
            <h3>หมายเหตุ</h3>
            <p className="detail-note">{activity.note || 'ไม่มีหมายเหตุ'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickEntryForm({ plots, onAddActivity, onDeletePlot, onSavePlot }) {
  const dateInputRef = useRef(null);
  const plotCropSelectRef = useRef(null);
  const plotSelectRef = useRef(null);
  const productionUnitSelectRefs = useRef({});
  const [form, setForm] = useState(() => ({
    date: getTodayInputValue(),
    crop: cropOptions[0],
    cropOther: '',
    plotId: '',
    plot: '',
    category: 'บันทึกกิจกรรม',
    task: 'บันทึกกิจกรรม',
    labor: '',
    rentCost: '',
    materialItems: [{ id: `material-${Date.now()}`, name: '', amount: '' }],
    productionItems: [{ id: `production-${Date.now()}`, name: '', quantity: '', unit: productionUnitOptions[0], unitOther: '', income: '' }],
    note: '',
  }));
  const [plotPanelOpen, setPlotPanelOpen] = useState(false);
  const [plotDraft, setPlotDraft] = useState({
    id: null,
    number: '',
    name: '',
    crop: cropOptions[0],
    cropOther: '',
    rai: '',
    ngan: '',
    wah: '',
    ownership: 'ตนเอง',
  });
  const [saved, setSaved] = useState(false);
  const materialSum = form.materialItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const productionIncomeTotal = form.productionItems.reduce((sum, item) => sum + Number(item.income || 0), 0);

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;

    openPicker(input);
  }

  function openPicker(input) {
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Some embedded browsers reject showPicker unless the click is fully trusted.
      }
    }

    input.focus();
    input.click();
  }

  function closePickerAfterSelect(input) {
    window.requestAnimationFrame(() => {
      input?.blur();
    });
  }

  function updateForm(key, value) {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePlotDraft(key, value) {
    setPlotDraft((current) => ({ ...current, [key]: value }));
  }

  function updateMaterialItem(id, key, value) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      materialItems: current.materialItems.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  function addMaterialItem() {
    setSaved(false);
    setForm((current) => ({
      ...current,
      materialItems: [...current.materialItems, { id: `material-${Date.now()}`, name: '', amount: '' }],
    }));
  }

  function removeMaterialItem(id) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      materialItems:
        current.materialItems.length > 1
          ? current.materialItems.filter((item) => item.id !== id)
          : [{ id: `material-${Date.now()}`, name: '', amount: '' }],
    }));
  }

  function updateProductionItem(id, key, value) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      productionItems: current.productionItems.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  function addProductionItem() {
    setSaved(false);
    setForm((current) => ({
      ...current,
      productionItems: [
        ...current.productionItems,
        { id: `production-${Date.now()}`, name: '', quantity: '', unit: productionUnitOptions[0], unitOther: '', income: '' },
      ],
    }));
  }

  function removeProductionItem(id) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      productionItems:
        current.productionItems.length > 1
          ? current.productionItems.filter((item) => item.id !== id)
          : [{ id: `production-${Date.now()}`, name: '', quantity: '', unit: productionUnitOptions[0], unitOther: '', income: '' }],
    }));
  }

  function handleSelectPlot(plotId) {
    const selectedPlot = plots.find((plot) => plot.id === plotId);
    updateForm('plotId', plotId);
    updateForm('plot', selectedPlot ? getPlotLabel(selectedPlot) : '');
    if (selectedPlot?.crop) {
      updateForm('crop', cropOptions.includes(selectedPlot.crop) ? selectedPlot.crop : 'อื่นๆ');
      updateForm('cropOther', cropOptions.includes(selectedPlot.crop) ? '' : selectedPlot.crop);
    }
  }

  function handleSavePlot(event) {
    event.preventDefault();

    const number = String(plotDraft.number).trim();
    const name = plotDraft.name.trim();
    const crop = plotDraft.crop === 'อื่นๆ' ? plotDraft.cropOther.trim() : plotDraft.crop;
    if (!number || !name || !crop) return;

    const savedPlot = onSavePlot({
      id: plotDraft.id || `plot-${Date.now()}`,
      number,
      name,
      crop,
      rai: plotDraft.rai,
      ngan: plotDraft.ngan,
      wah: plotDraft.wah,
      ownership: plotDraft.ownership,
    });

    setPlotDraft({
      id: null,
      number: '',
      name: '',
      crop: cropOptions[0],
      cropOther: '',
      rai: '',
      ngan: '',
      wah: '',
      ownership: 'ตนเอง',
    });
    setPlotPanelOpen(false);
    updateForm('plotId', savedPlot.id);
    updateForm('plot', getPlotLabel(savedPlot));
    updateForm('crop', cropOptions.includes(savedPlot.crop) ? savedPlot.crop : 'อื่นๆ');
    updateForm('cropOther', cropOptions.includes(savedPlot.crop) ? '' : savedPlot.crop);
  }

  function handleEditPlot(plot) {
    setPlotDraft({
      id: plot.id,
      number: plot.number,
      name: plot.name,
      crop: cropOptions.includes(plot.crop) ? plot.crop : 'อื่นๆ',
      cropOther: cropOptions.includes(plot.crop) ? '' : plot.crop || '',
      rai: plot.rai || '',
      ngan: plot.ngan || '',
      wah: plot.wah || '',
      ownership: plot.ownership || 'ตนเอง',
    });
    setPlotPanelOpen(true);
  }

  function handleDeletePlot(plotId) {
    onDeletePlot(plotId);
    if (form.plotId === plotId) {
      updateForm('plotId', '');
      updateForm('plot', '');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const crop = form.crop === 'อื่นๆ' ? form.cropOther.trim() : form.crop;
    const selectedPlot = plots.find((plot) => plot.id === form.plotId);
    const plot = selectedPlot ? getPlotLabel(selectedPlot) : form.plot.trim();
    const materialItems = form.materialItems
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        amount: Number(item.amount || 0),
      }))
      .filter((item) => item.name || item.amount > 0);
    const material = materialItems.reduce((sum, item) => sum + item.amount, 0);
    const normalizedProductionItems = form.productionItems
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        quantity: Number(item.quantity || 0),
        unit: item.unit,
        unitOther: item.unit === 'อื่นๆ' ? item.unitOther.trim() : '',
        income: Number(item.income || 0),
      }))
      .filter((item) => item.name || item.quantity > 0 || item.income > 0);

    if (!crop || !plot) return;

    onAddActivity({
      ...form,
      crop,
      plot,
      task: normalizedProductionItems[0]?.name || 'บันทึกกิจกรรม',
      category: 'บันทึกกิจกรรม',
      note: form.note.trim(),
      id: Date.now(),
      date: formatActivityDate(form.date),
      status: 'รอดำเนินการ',
      savedTime: getCurrentThaiTime(),
      labor: Number(form.labor || 0),
      material,
      materialItems,
      income: normalizedProductionItems.reduce((sum, item) => sum + Number(item.income || 0), 0),
      productionItems: normalizedProductionItems,
      plotRentExpense: Number(form.rentCost || 0),
      plotArea: selectedPlot ? {
        rai: selectedPlot.rai || 0,
        ngan: selectedPlot.ngan || 0,
        wah: selectedPlot.wah || 0,
      } : null,
    });
    setForm((current) => ({
      ...current,
      task: 'บันทึกกิจกรรม',
      labor: '',
      rentCost: '',
      materialItems: [{ id: `material-${Date.now()}`, name: '', amount: '' }],
      productionItems: [{ id: `production-${Date.now()}`, name: '', quantity: '', unit: productionUnitOptions[0], unitOther: '', income: '' }],
      note: '',
    }));
    setSaved(true);
  }

  return (
    <aside className="panel entry-panel" id="entry-form">
      <span className="sheet-handle" aria-hidden="true" />
      <form onSubmit={handleSubmit}>
        <label>
          <span>วันที่</span>
          <div className="input-shell date-shell" onClick={openDatePicker}>
            <CalendarDays size={18} />
            <button className="date-display-button" onClick={openDatePicker} type="button">
              {formatDateInputDisplay(form.date)}
            </button>
            <input
              ref={dateInputRef}
              value={form.date}
              onChange={(event) => updateForm('date', event.target.value)}
              aria-label="เลือกวันที่"
              className="date-native-input"
              required
              type="date"
            />
          </div>
        </label>

        <div className="plot-manager">
          <div className="plot-manager-heading">
            <span>แปลงเพาะปลูก</span>
            <button
              className="mini-action"
              onClick={() => {
                setPlotDraft({
                  id: null,
                  number: '',
                  name: '',
                  crop: cropOptions[0],
                  cropOther: '',
                  rai: '',
                  ngan: '',
                  wah: '',
                  ownership: 'ตนเอง',
                });
                setPlotPanelOpen((current) => !current);
              }}
              type="button"
            >
              <Plus size={17} />
              เพิ่มแปลง
            </button>
          </div>

          {plotPanelOpen && (
            <div className="plot-editor">
              <input
                value={plotDraft.number}
                onChange={(event) => updatePlotDraft('number', event.target.value.replace(/\D/g, ''))}
                className="text-input"
                inputMode="numeric"
                min="1"
                placeholder="แปลงที่"
                required
                type="text"
              />
              <input
                value={plotDraft.name}
                onChange={(event) => updatePlotDraft('name', event.target.value)}
                className="text-input"
                placeholder="ชื่อแปลง"
                required
                type="text"
              />
              <label className="plot-crop-field">
                <span>พืชที่ปลูก</span>
                <div className="input-shell select-shell plot-crop-select" onClick={() => openPicker(plotCropSelectRef.current)}>
                  <Sprout size={18} />
                  <select
                    ref={plotCropSelectRef}
                    value={plotDraft.crop}
                    onChange={(event) => updatePlotDraft('crop', event.target.value)}
                    required
                  >
                    {cropOptions.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>
              {plotDraft.crop === 'อื่นๆ' && (
                <input
                  value={plotDraft.cropOther}
                  onChange={(event) => updatePlotDraft('cropOther', event.target.value)}
                  className="text-input plot-custom-crop"
                  placeholder="ระบุพืช"
                  required
                  type="text"
                />
              )}
              <label className="plot-area-field">
                <span>ขนาดพื้นที่</span>
                <div className="plot-area-grid">
                  <input
                    value={plotDraft.rai}
                    onChange={(event) => updatePlotDraft('rai', event.target.value)}
                    className="text-input"
                    min="0"
                    placeholder="ไร่"
                    type="number"
                  />
                  <input
                    value={plotDraft.ngan}
                    onChange={(event) => updatePlotDraft('ngan', event.target.value)}
                    className="text-input"
                    min="0"
                    placeholder="งาน"
                    type="number"
                  />
                  <input
                    value={plotDraft.wah}
                    onChange={(event) => updatePlotDraft('wah', event.target.value)}
                    className="text-input"
                    min="0"
                    placeholder="วา"
                    type="number"
                  />
                </div>
              </label>
              <button className="mini-save" onClick={handleSavePlot} type="button">
                <Save size={17} />
                บันทึกแปลง
              </button>
            </div>
          )}

          {plots.length > 0 && (
            <div className="plot-list">
              {plots.map((plot) => (
                <div className="plot-row" key={plot.id}>
                  <span>
                    <strong>{getPlotLabel(plot)}</strong>
                    <small>
                      {plot.crop || '-'} · {plot.rai || 0} ไร่ {plot.ngan || 0} งาน {plot.wah || 0} วา
                    </small>
                  </span>
                  <button onClick={() => handleEditPlot(plot)} type="button" aria-label={`แก้ไข ${getPlotLabel(plot)}`}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDeletePlot(plot.id)} type="button" aria-label={`ลบ ${getPlotLabel(plot)}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="plot-select-label">
            <span>เลือกแปลง</span>
            <div className="input-shell select-shell" onClick={() => openPicker(plotSelectRef.current)}>
            <Tractor size={18} />
              <select
                ref={plotSelectRef}
                value={form.plotId}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                  handleSelectPlot(event.target.value);
                  closePickerAfterSelect(event.currentTarget);
                }}
                required
              >
                <option value="">เลือกแปลงเพาะปลูก</option>
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {getPlotLabel(plot)}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} />
            </div>
          </label>
        </div>

        <label>
          <span>ค่าแรง/ค่าจ้าง (บาท)</span>
          <input
            value={form.labor}
            onChange={(event) => updateForm('labor', event.target.value)}
            className="text-input"
            min="0"
            type="number"
          />
        </label>

        <label>
          <span>ค่าเช่า (บาท)</span>
          <input
            value={form.rentCost}
            onChange={(event) => updateForm('rentCost', event.target.value)}
            className="text-input"
            min="0"
            type="number"
          />
        </label>

        <div className="materials-editor">
          <div className="materials-heading">
            <span>รายการค่าวัสดุ</span>
            <button className="mini-action" onClick={addMaterialItem} type="button">
              <Plus size={17} />
              เพิ่มวัสดุ
            </button>
          </div>
          <div className="materials-list">
            {form.materialItems.map((item) => (
              <div className="material-row" key={item.id}>
                <input
                  value={item.name}
                  onChange={(event) => updateMaterialItem(item.id, 'name', event.target.value)}
                  className="text-input"
                  placeholder="ชื่อวัสดุ เช่น ปุ๋ย"
                  type="text"
                />
                <input
                  value={item.amount}
                  onChange={(event) => updateMaterialItem(item.id, 'amount', event.target.value)}
                  className="text-input"
                  min="0"
                  placeholder="บาท"
                  type="number"
                />
                <button onClick={() => removeMaterialItem(item.id)} type="button" aria-label="ลบวัสดุ">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="material-total material-cost-total">
            <span>รวมค่าวัสดุ</span>
            <strong>{decimalBaht.format(materialSum)} บาท</strong>
          </div>
        </div>

        <div className="production-editor">
          <div className="materials-heading">
            <span>ผลผลิตที่ได้</span>
            <button className="mini-action" onClick={addProductionItem} type="button">
              <Plus size={17} />
              เพิ่มผลผลิต
            </button>
          </div>
          <div className="materials-list">
            {form.productionItems.map((item) => (
              <div className={`production-row ${item.unit === 'อื่นๆ' ? 'has-custom-unit' : ''}`} key={item.id}>
                <input
                  value={item.name}
                  onChange={(event) => updateProductionItem(item.id, 'name', event.target.value)}
                  className="text-input production-name-input"
                  placeholder="ชื่อผลผลิต เช่น ข้าวเปลือก"
                  type="text"
                />
                <input
                  value={item.quantity}
                  onChange={(event) => updateProductionItem(item.id, 'quantity', event.target.value)}
                  className="text-input production-quantity-input"
                  min="0"
                  placeholder="จำนวน"
                  type="number"
                />
                <div
                  className="input-shell select-shell compact-select"
                  onClick={() => openPicker(productionUnitSelectRefs.current[item.id])}
                >
                  <select
                    ref={(element) => {
                      if (element) {
                        productionUnitSelectRefs.current[item.id] = element;
                      } else {
                        delete productionUnitSelectRefs.current[item.id];
                      }
                    }}
                    value={item.unit}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      updateProductionItem(item.id, 'unit', event.target.value);
                      closePickerAfterSelect(event.currentTarget);
                    }}
                  >
                    {productionUnitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
                {item.unit === 'อื่นๆ' && (
                  <input
                    value={item.unitOther}
                    onChange={(event) => updateProductionItem(item.id, 'unitOther', event.target.value)}
                    className="text-input"
                    placeholder="ระบุหน่วย"
                    type="text"
                  />
                )}
                <input
                  value={item.income}
                  onChange={(event) => updateProductionItem(item.id, 'income', event.target.value)}
                  className="text-input production-income-input"
                  min="0"
                  placeholder="รายรับ (ขาย)"
                  type="number"
                />
                <button className="production-remove-button" onClick={() => removeProductionItem(item.id)} type="button" aria-label="ลบผลผลิต">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="material-total production-total">
            <span>รวมรายรับทั้งสิ้น</span>
            <strong className="production-income-total">{decimalBaht.format(productionIncomeTotal)} บาท</strong>
          </div>
        </div>

        <label>
          <span>หมายเหตุ</span>
          <textarea
            value={form.note}
            onChange={(event) => updateForm('note', event.target.value)}
            placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
            maxLength="200"
          />
          <small className="counter">{form.note.length} / 200</small>
        </label>

        <button className="save-button" type="submit">
          <Save size={20} />
          บันทึก
        </button>
        {saved && <p className="success-message">บันทึกรายการใหม่แล้ว</p>}
      </form>
    </aside>
  );
}

function CostPage({ activities }) {
  const cost = getMonthlyCost(activities);
  const extraCost = activities.reduce((sum, item) => sum + totalCost(item), 0);

  return (
    <section className="page-grid">
      <DonutChart />
      <article className="panel detail-panel">
        <div className="panel-heading">
          <h2>สรุปบัญชีต้นทุน</h2>
        </div>
        <div className="cost-summary">
          <div>
            <span>ต้นทุนฐานเดือนนี้</span>
            <strong>{decimalBaht.format(cost - extraCost)} บาท</strong>
          </div>
          <div>
            <span>รายการที่เพิ่มใหม่</span>
            <strong>{decimalBaht.format(extraCost)} บาท</strong>
          </div>
          <div>
            <span>รวมต้นทุนทั้งหมด</span>
            <strong>{decimalBaht.format(cost)} บาท</strong>
          </div>
        </div>
      </article>
      <article className="panel detail-panel wide-panel">
        <div className="panel-heading">
          <h2>รายการต้นทุนตามกิจกรรม</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>แปลง</th>
                <th>กิจกรรม</th>
                <th>ค่าแรง</th>
                <th>ค่าวัสดุ</th>
                <th>รวม</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.date}</td>
                    <td>{activity.plot}</td>
                    <td>{activity.task}</td>
                    <td>{decimalBaht.format(activity.labor)}</td>
                    <td>{decimalBaht.format(materialTotal(activity))}</td>
                    <td>{decimalBaht.format(totalCost(activity))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-table-cell" colSpan="6">
                    ยังไม่มีรายการต้นทุน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function ReportsPage({ activities }) {
  const cost = getMonthlyCost(activities);
  const income = getMonthlyIncome(activities);
  const pending = activities.filter((item) => item.status === 'รอดำเนินการ').length;

  return (
    <section className="page-grid">
      <article className="panel report-card">
        <BarChart3 size={28} />
        <span>กำไรสุทธิเดือนนี้</span>
        <strong>{decimalBaht.format(income - cost)} บาท</strong>
      </article>
      <article className="panel report-card">
        <ClipboardCheck size={28} />
        <span>กิจกรรมที่ต้องติดตาม</span>
        <strong>{pending} รายการ</strong>
      </article>
      <article className="panel report-card">
        <Wheat size={28} />
        <span>รายรับผลผลิต</span>
        <strong>{decimalBaht.format(income)} บาท</strong>
      </article>
      <div className="wide-panel">
        <CashflowChart activities={activities} />
      </div>
    </section>
  );
}

function SimplePage({ title, description, icon: Icon }) {
  return (
    <section className="panel empty-state">
      <Icon size={36} />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

function SettingsPage({ session }) {
  const currentUser = session.user;

  return (
    <section className="settings-layout">
      <article className="panel profile-panel">
        <div className="panel-heading">
          <h2>ผู้ใช้งานปัจจุบัน</h2>
        </div>
        <div className="profile-summary">
          <span className="user-avatar large">
            <UserRound size={31} />
          </span>
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.farmName || 'ยังไม่ได้ระบุชื่อฟาร์ม'}</span>
            <small>
              {currentUser.role} • ข้อมูลถูกบันทึกแยกตามบัญชีผู้ใช้
            </small>
          </div>
        </div>
      </article>

      <article className="panel help-panel">
        <div className="panel-heading">
          <h2>เกี่ยวกับระบบ</h2>
        </div>
        <div className="help-summary">
          <p>
            FarmCost เป็น Web Application สำหรับบันทึกกิจกรรมฟาร์ม ต้นทุน รายรับ ค่าเช่า และผลผลิตของแต่ละแปลงเพาะปลูก
            เพื่อช่วยให้เกษตรกรติดตามต้นทุนสะสม กำไรสุทธิ และประวัติการทำงานได้ง่ายในบัญชีผู้ใช้ของตนเอง
          </p>
        </div>
      </article>

      <article className="panel developer-panel">
        <div className="panel-heading">
          <h2>ผู้พัฒนา</h2>
        </div>
        <div className="developer-summary">
          <span className="developer-icon" aria-hidden="true">
            <img src="./cooperative-department-logo.png" alt="" />
          </span>
          <div>
            <span>ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 14 จังหวัดชัยนาท</span>
            <strong>กรมส่งเสริมสหกรณ์</strong>
            <ul className="developer-contact">
              <li>
                <MapPin size={16} />
                <span>253 หมู่ 5 ตำบลบางหลวง อำเภอสรรพยา จังหวัดชัยนาท 17150</span>
              </li>
              <li>
                <Phone size={16} />
                <span>0-5640-5114</span>
              </li>
              <li>
                <Mail size={16} />
                <span>saraban_ccttd14@cpd.go.th</span>
              </li>
            </ul>
          </div>
        </div>
      </article>
    </section>
  );
}

function BottomNav({ activeView, setActiveView }) {
  const mobileItems = [
    ['ข้อมูลภาพรวม', 'overview', Home],
    ['บันทึกกิจกรรม', 'activities', ListChecks],
    ['ล่าสุด', 'activityHistory', ClipboardList],
  ];

  return (
    <nav className="bottom-nav" aria-label="เมนูมือถือ">
      {mobileItems.map(([label, view, Icon]) => (
        <button
          className={activeView === view ? 'active' : ''}
          key={label}
          onClick={() => setActiveView(view)}
          type="button"
        >
          <Icon size={24} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [session, setSession] = useState(getStoredSession);
  const [activities, setActivities] = useState(() => {
    const storedSession = getStoredSession();
    if (!storedSession?.user?.id) return [];

    const states = getLocalCollection(LOCAL_STATES_KEY);
    return states[storedSession.user.id]?.activities || [];
  });
  const [plots, setPlots] = useState(() => {
    const storedSession = getStoredSession();
    if (!storedSession?.user?.id) return [];

    const states = getLocalCollection(LOCAL_STATES_KEY);
    return states[storedSession.user.id]?.plots || [];
  });
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [activeView, setActiveView] = useState('overview');
  const [query, setQuery] = useState('');

  const visibleActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return activities;

    return activities.filter((activity) => {
      return [activity.task, activity.plot, activity.crop, activity.category, activity.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activities, query]);

  function addActivity(activity) {
    setActivities((current) => {
      const nextActivities = [activity, ...current];
      saveCurrentState({ activities: nextActivities, plots });
      return nextActivities;
    });
    setActiveCategory('ทั้งหมด');
    setActiveView('activityHistory');
  }

  function clearActivities() {
    setActivities([]);
    saveCurrentState({ activities: [], plots });
  }

  function deleteActivity(activityId) {
    setActivities((current) => {
      const nextActivities = current.filter((activity) => activity.id !== activityId);
      saveCurrentState({ activities: nextActivities, plots });
      return nextActivities;
    });
  }

  function savePlot(plot) {
    const normalizedPlot = {
      ...plot,
      number: String(plot.number).trim(),
      name: plot.name.trim(),
      crop: String(plot.crop || '').trim(),
      rai: Number(plot.rai || 0),
      ngan: Number(plot.ngan || 0),
      wah: Number(plot.wah || 0),
      ownership: plot.ownership || 'ตนเอง',
    };

    setPlots((current) => {
      const exists = current.some((item) => item.id === normalizedPlot.id);
      const nextPlots = exists
        ? current.map((item) => (item.id === normalizedPlot.id ? normalizedPlot : item))
        : [...current, normalizedPlot];
      saveCurrentState({ activities, plots: nextPlots });
      return nextPlots;
    });

    return normalizedPlot;
  }

  function deletePlot(plotId) {
    setPlots((current) => {
      const nextPlots = current.filter((plot) => plot.id !== plotId);
      saveCurrentState({ activities, plots: nextPlots });
      return nextPlots;
    });
  }

  function storeSession(nextSession) {
    try {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextSession));
    } catch {
      // The session still works in memory if storage is unavailable.
    }
  }

  function handleLogin(nextSession, userState) {
    const localStates = getLocalCollection(LOCAL_STATES_KEY);
    const localState = localStates[nextSession.user.id] || {};
    const remoteActivities = Array.isArray(userState?.activities) ? userState.activities : [];
    const remotePlots = Array.isArray(userState?.plots) ? userState.plots : [];
    const localActivities = Array.isArray(localState.activities) ? localState.activities : [];
    const localPlots = Array.isArray(localState.plots) ? localState.plots : [];
    const nextActivities = remoteActivities.length > 0 ? remoteActivities : localActivities;
    const nextPlots = remotePlots.length > 0 ? remotePlots : localPlots;

    storeSession(nextSession);
    setSession(nextSession);
    setActivities(nextActivities);
    setPlots(nextPlots);
    setActiveCategory('ทั้งหมด');
    setActiveView('overview');

    if ((remoteActivities.length === 0 && localActivities.length > 0) || (remotePlots.length === 0 && localPlots.length > 0)) {
      saveUserState(nextSession, { activities: nextActivities, plots: nextPlots });
    }
  }

  async function persistActivities(nextActivities) {
    if (!session) return { ok: false, localOnly: true };
    return saveUserState(session, { activities: nextActivities, plots });
  }

  async function saveCurrentState(state = { activities, plots }) {
    if (!session) return { ok: false, localOnly: true };
    return saveUserState(session, state);
  }

  function handleLogout() {
    try {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Nothing else is needed when local storage is unavailable.
    }
    setActiveView('overview');
    setSession(null);
    setActivities([]);
    setPlots([]);
  }

  function renderActiveView() {
    if (activeView === 'activities') {
      return (
        <section className="form-page">
          <QuickEntryForm
            plots={plots}
            onAddActivity={addActivity}
            onDeletePlot={deletePlot}
            onSavePlot={savePlot}
          />
        </section>
      );
    }

    if (activeView === 'activityHistory') {
      return (
        <ActivityTable
          activities={visibleActivities}
          activeCategory={activeCategory}
          onClearActivities={clearActivities}
          onDeleteActivity={deleteActivity}
          setActiveCategory={setActiveCategory}
        />
      );
    }

    if (activeView === 'costs') {
      return <CostPage activities={activities} />;
    }

    if (activeView === 'reports') {
      return <ReportsPage activities={activities} />;
    }

    if (activeView === 'produce') {
      return (
        <SimplePage
          description="เตรียมพื้นที่สำหรับบันทึกผลผลิต น้ำหนัก ราคา และช่องทางจำหน่ายของแต่ละแปลง"
          icon={Wheat}
          title="หน้าผลผลิต"
        />
      );
    }

    if (activeView === 'settings') {
      return <SettingsPage session={session} />;
    }

    return (
      <>
        <DashboardStats activities={activities} />

        <section className="analytics-grid" aria-label="กราฟสรุปต้นทุนและรายรับ">
          <PlotCycleDashboard activities={activities} />
          <PlotExpenseBarChart activities={activities} onShowAll={() => {
            setActiveCategory(categories[0]);
            setActiveView('activityHistory');
          }} />
          <CashflowChart activities={activities} />
        </section>
      </>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        currentUser={session.user}
        onLogout={handleLogout}
        setActiveView={setActiveView}
      />
      <MobileHeader onLogout={handleLogout} setActiveView={setActiveView} />
      <main className="content">
        {renderActiveView()}
      </main>
      <BottomNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
