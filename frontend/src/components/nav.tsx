import type { ReactNode } from "react";
import type { Capability } from "../auth/PermissionsContext";

/** یک آیتم ناوبری.
 *
 *  `module` اختیاری: اگر آن بخش خاموش باشد، لینک اصلاً ساخته نمی‌شود. لینکی که
 *  کلیکش به «این بخش غیرفعال است» برسد، بدتر از نبودنش است.
 *
 *  `capability` اختیاری: لینک‌هایی که به *مجوز* گره خورده‌اند نه به نقش. حساب
 *  مدیر سامانه نقشی در زنجیرهٔ ارزیابی ندارد، پس جدولِ نقش‌محور برایش خالی است —
 *  ولی مجوز ساخت حساب و تنظیم شاخص را دارد و باید به آن صفحه‌ها برسد.
 */
export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  module?: string;
  /** هر کدام از این مجوزها کافی است. */
  anyCapability?: Capability[];
}

const s = (d: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {d}
  </svg>
);

export const ICONS = {
  dashboard: s(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="11" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="18" width="7" height="3" rx="1" />
    </>
  ),
  queue: s(
    <>
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M15 4h3a2 2 0 0 1 2 2v4M8 9h7M8 13h3" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <circle cx="17" cy="17" r="5" />
      <path d="M17 14v3l2 1" />
    </>
  ),
  personnel: s(
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 4.5a3.5 3.5 0 0 1 0 7M19 14.5a5 5 0 0 1 3 4.5v2" />
    </>
  ),
  accounts: s(
    <>
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <circle cx="8" cy="10" r="2.5" />
      <path d="M4.5 17a3.5 3.5 0 0 1 7 0M15 9h4M15 13h4M15 17h2" />
    </>
  ),
  indicators: s(
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  scheme: s(
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M8 6h8v3H8zM8 13h1M12 13h1M16 13h.01M8 17h1M12 17h1M16 17v2" />
    </>
  ),
  periods: s(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M8 15l3 3 5-5" />
    </>
  ),
  improvement: s(
    <>
      <path d="M3 3v18h18M6 16l5-5 4 3 6-8M16 6h5v5" />
    </>
  ),
  chart: s(
    <>
      <path d="M3 3v18h18" />
      <rect x="6" y="12" width="3" height="6" rx=".5" />
      <rect x="11" y="5" width="3" height="13" rx=".5" />
      <rect x="16" y="9" width="3" height="9" rx=".5" />
    </>
  ),
  org: s(
    <>
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <rect x="15" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4M6 16v-4h12v4" />
    </>
  ),
  scorecard: s(
    <>
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M8 13l3 3 5-6" />
    </>
  ),
  audit: s(
    <>
      <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10l4 4v3M14 3v5h5M7 8h3M7 12h3M7 16h2" />
      <circle cx="17" cy="17" r="5" />
      <path d="M17 14v3l2 1" />
    </>
  ),
  settings: s(
    <>
      <path d="m9 3-.5 2.5-2 1.2L4 6l-2 3.5 2 1.8v1.4l-2 1.8L4 18l2.5-.7 2 1.2L9 21h6l.5-2.5 2-1.2 2.5.7 2-3.5-2-1.8v-1.4l2-1.8L20 6l-2.5.7-2-1.2L15 3z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
} as const;

/** ناوبری هر نقش. ترتیب = ترتیبِ کارِ روزمرهٔ آن نقش، نه الفبا. */
export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  hr: [
    { to: "/hr/dashboard", label: "داشبورد", icon: ICONS.dashboard },
    { to: "/hr/queue", label: "صف بررسی", icon: ICONS.queue },
    { to: "/me", label: "خودارزیابی من", icon: ICONS.scorecard, module: "self_assessment" },
    { to: "/hr/people", label: "مدیریت حساب و پرسنل", icon: ICONS.accounts },
    { to: "/hr/indicators", label: "شاخص‌ها", icon: ICONS.indicators },
    // کنار «شاخص‌ها» چون هر دو «فرمِ ارزیابی» را تعریف می‌کنند: یکی چه چیزی
    // سنجیده می‌شود، دیگری چطور به نتیجه تبدیل می‌شود (P1-04).
    { to: "/hr/scoring-schemes", label: "طرح نمره‌دهی", icon: ICONS.scheme },
    { to: "/hr/periods", label: "دوره‌های ارزیابی", icon: ICONS.periods, module: "periods" },
    {
      to: "/improvement-plans",
      label: "برنامه‌های بهبود",
      icon: ICONS.improvement,
      module: "improvement_plans",
    },
  ],
  // مسئول واحد و معاونت ممکن است «مسئول پیگیریِ» یک برنامهٔ بهبود باشند (P1-10).
  // سرور فهرست را به برنامه‌های خودشان محدود می‌کند؛ بدون این لینک، تنها راه
  // رسیدن به آن، کلیک روی اعلان بود.
  unit_supervisor: [
    { to: "/supervisor", label: "افراد زیرمجموعه", icon: ICONS.personnel },
    { to: "/me", label: "خودارزیابی من", icon: ICONS.scorecard, module: "self_assessment" },
    // P2-01: تا پیش از این، ارزیاب هیچ راهی نداشت بفهمد نمره‌دهی‌اش نسبت به
    // بقیه کجاست — و این مفیدترین بازخوردی است که یک نمره‌دهنده می‌گیرد.
    { to: "/my-scoring", label: "الگوی نمره‌دهی من", icon: ICONS.chart, module: "role_analytics" },
    { to: "/improvement-plans", label: "برنامه‌های بهبود", icon: ICONS.improvement },
  ],
  // معاونت هم نمره می‌دهد (مسیر «مدیر») و هم تصمیم‌گیر است، پس هر دو نما را دارد.
  deputy: [
    { to: "/deputy", label: "پرونده‌های در انتظار", icon: ICONS.queue },
    { to: "/my-scoring", label: "الگوی نمره‌دهی من", icon: ICONS.chart, module: "role_analytics" },
    { to: "/executive", label: "تحلیل سازمان", icon: ICONS.org, module: "role_analytics" },
    { to: "/improvement-plans", label: "برنامه‌های بهبود", icon: ICONS.improvement },
  ],
  ceo: [
    { to: "/ceo", label: "پرونده‌های در انتظار", icon: ICONS.queue },
    { to: "/executive", label: "تحلیل سازمان", icon: ICONS.org, module: "role_analytics" },
  ],
  employee: [{ to: "/me", label: "خودارزیابی و کارنامه من", icon: ICONS.scorecard }],
  // ادمین کل فقط بخش‌های مدیریتی را از مجوزهایش دریافت می‌کند.
  support: [],
};

/** لینک‌هایی که به مجوز گره خورده‌اند، نه به نقش.
 *
 *  این فهرست تفاوتِ «مدیر سامانه» با یک نقشِ زنجیره را جبران می‌کند: حساب
 *  `support` جدولِ نقش‌محورِ خالی دارد، ولی مجوزهایش به او اجازهٔ ساخت حساب،
 *  تنظیم شاخص و مدیریت پرسنل را می‌دهند. تا امروز آن صفحه‌ها فقط از منوی نقش
 *  `hr` قابل رسیدن بودند — یعنی مجوز داشت و راه نداشت.
 */
export const NAV_BY_CAPABILITY: NavItem[] = [
  {
    to: "/hr/people",
    label: "مدیریت حساب و پرسنل",
    icon: ICONS.accounts,
    anyCapability: ["manage_personnel", "manage_users"],
  },
  { to: "/hr/indicators", label: "شاخص‌ها", icon: ICONS.indicators, anyCapability: ["manage_scoring"] },
  {
    to: "/hr/scoring-schemes",
    label: "طرح نمره‌دهی",
    icon: ICONS.scheme,
    anyCapability: ["manage_scoring"],
  },
  {
    to: "/hr/audit-log",
    label: "گزارش رویدادها",
    icon: ICONS.audit,
    anyCapability: ["view_audit_log", "view_diagnostics"],
  },
  {
    to: "/administration",
    label: "مدیریت سامانه",
    icon: ICONS.settings,
    anyCapability: ["manage_capabilities", "manage_modules", "manage_integrations"],
  },
];

/** فهرست نهاییِ لینک‌ها برای این کاربر — نقش، سپس مجوزها، بدون تکرار. */
export function navItemsFor(
  role: string,
  can: (capability: Capability) => boolean,
  moduleEnabled: (module: string) => boolean
): NavItem[] {
  const items = (NAV_BY_ROLE[role] ?? []).filter(
    (item) => item.module === undefined || moduleEnabled(item.module)
  );
  const seen = new Set(items.map((item) => item.to));
  for (const item of NAV_BY_CAPABILITY) {
    if (seen.has(item.to)) continue;
    if (!item.anyCapability?.some(can)) continue;
    items.push(item);
    seen.add(item.to);
  }
  return items;
}
