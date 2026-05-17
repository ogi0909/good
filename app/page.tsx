"use client";

import {
  AlertTriangle,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Info,
  Moon,
  Pill,
  ShieldCheck,
  Sun,
  Utensils,
} from "lucide-react";
import { useMemo, useState } from "react";

type AgeGroup = "adult" | "senior";
type Sex = "male" | "female";
type DoseLevel = "low" | "normal" | "high";
type TabId = "timeline" | "analysis" | "ai";
type NutrientKey =
  | "calcium"
  | "iron"
  | "magnesium"
  | "zinc"
  | "vitaminD"
  | "vitaminC";
type SupplementId =
  | "iron"
  | "calcium"
  | "magnesium"
  | "zinc"
  | "vitaminD"
  | "vitaminC"
  | "omega3"
  | "probiotic"
  | "multivitamin"
  | "lutein";
type RiskLevel = "낮음" | "주의" | "높음";

type Profile = {
  ageGroup: AgeGroup;
  sex: Sex;
};

type Supplement = {
  id: SupplementId;
  name: string;
  shortName: string;
  category: string;
  baseDose: Partial<Record<NutrientKey, number>>;
  unitHint: string;
  bestTiming: string;
  caution: string;
};

type NutrientReference = {
  label: string;
  unit: string;
  target: number;
  upper?: number;
  standard: "권장섭취량" | "충분섭취량";
};

type SelectionState = Record<SupplementId, { selected: boolean; dose: DoseLevel }>;

type TimelineItem = {
  id: string;
  label: string;
  doseLabel: string;
  reason: string;
  tags: string[];
};

type TimelineSlot = {
  id: string;
  time: string;
  title: string;
  icon: typeof Sun;
  items: TimelineItem[];
};

type InteractionWarning = {
  id: string;
  level: RiskLevel;
  score: number;
  title: string;
  message: string;
  action: string;
};

const doseOptions: Record<
  DoseLevel,
  { label: string; helper: string; multiplier: number }
> = {
  low: { label: "적게", helper: "반 알/가끔", multiplier: 0.5 },
  normal: { label: "보통", helper: "하루 한 알", multiplier: 1 },
  high: { label: "고함량", helper: "많이/강화", multiplier: 1.6 },
};

const supplements: Supplement[] = [
  {
    id: "iron",
    name: "철분",
    shortName: "철분",
    category: "미량무기질",
    baseDose: { iron: 14 },
    unitHint: "일반 철분제 1회분",
    bestTiming: "오전 간격",
    caution: "칼슘, 마그네슘, 아연과 같은 시간대를 피합니다.",
  },
  {
    id: "calcium",
    name: "칼슘",
    shortName: "칼슘",
    category: "다량무기질",
    baseDose: { calcium: 500 },
    unitHint: "칼슘 보충제 1정",
    bestTiming: "식후",
    caution: "철분 흡수를 방해할 수 있어 분리합니다.",
  },
  {
    id: "magnesium",
    name: "마그네슘",
    shortName: "마그네슘",
    category: "다량무기질",
    baseDose: { magnesium: 280 },
    unitHint: "마그네슘 보충제 1회분",
    bestTiming: "저녁",
    caution: "보충제 기준 상한에 가까워지면 설사 등 불편감이 생길 수 있습니다.",
  },
  {
    id: "zinc",
    name: "아연",
    shortName: "아연",
    category: "미량무기질",
    baseDose: { zinc: 15 },
    unitHint: "아연 보충제 1정",
    bestTiming: "식후",
    caution: "철분과 경쟁할 수 있어 식사 시간대를 나눕니다.",
  },
  {
    id: "vitaminD",
    name: "비타민 D",
    shortName: "비타민D",
    category: "지용성비타민",
    baseDose: { vitaminD: 25 },
    unitHint: "1,000 IU 기준",
    bestTiming: "지방 포함 식사",
    caution: "오메가3, 루테인처럼 식사와 함께 배치합니다.",
  },
  {
    id: "vitaminC",
    name: "비타민 C",
    shortName: "비타민C",
    category: "수용성비타민",
    baseDose: { vitaminC: 500 },
    unitHint: "비타민 C 1정",
    bestTiming: "오전 또는 점심",
    caution: "철분 흡수를 돕는 조합으로 함께 둘 수 있습니다.",
  },
  {
    id: "omega3",
    name: "오메가3",
    shortName: "오메가3",
    category: "지방산",
    baseDose: {},
    unitHint: "EPA+DHA 제품 1회분",
    bestTiming: "식후",
    caution: "식사와 함께 두면 속 불편감을 줄이는 데 유리합니다.",
  },
  {
    id: "probiotic",
    name: "유산균",
    shortName: "유산균",
    category: "장 건강",
    baseDose: {},
    unitHint: "프로바이오틱스 1회분",
    bestTiming: "아침 공복",
    caution: "물과 함께 단독 배치합니다.",
  },
  {
    id: "multivitamin",
    name: "종합비타민",
    shortName: "종합",
    category: "복합제",
    baseDose: {
      calcium: 120,
      iron: 4,
      magnesium: 50,
      zinc: 5,
      vitaminD: 10,
      vitaminC: 100,
    },
    unitHint: "일반 멀티비타민 1정",
    bestTiming: "아침 식후",
    caution: "개별 무기질 제품과 중복 섭취 여부를 확인합니다.",
  },
  {
    id: "lutein",
    name: "루테인",
    shortName: "루테인",
    category: "눈 건강",
    baseDose: {},
    unitHint: "루테인 1캡슐",
    bestTiming: "지방 포함 식사",
    caution: "지용성 성분이므로 식사 시간대에 배치합니다.",
  },
];

const supplementMap = supplements.reduce(
  (acc, supplement) => {
    acc[supplement.id] = supplement;
    return acc;
  },
  {} as Record<SupplementId, Supplement>,
);

const initialSelection: SelectionState = supplements.reduce((acc, supplement) => {
  acc[supplement.id] = {
    selected: ["iron", "calcium", "vitaminC", "vitaminD"].includes(supplement.id),
    dose: supplement.id === "calcium" ? "high" : "normal",
  };
  return acc;
}, {} as SelectionState);

const nutrientLabels: Record<NutrientKey, string> = {
  calcium: "칼슘",
  iron: "철",
  magnesium: "마그네슘",
  zinc: "아연",
  vitaminD: "비타민 D",
  vitaminC: "비타민 C",
};

const kdriReferences: Record<string, Record<NutrientKey, NutrientReference>> = {
  adult_male: {
    calcium: { label: "칼슘", unit: "mg", target: 650, upper: 2500, standard: "권장섭취량" },
    iron: { label: "철", unit: "mg", target: 8, upper: 45, standard: "권장섭취량" },
    magnesium: { label: "마그네슘", unit: "mg", target: 380, upper: 350, standard: "권장섭취량" },
    zinc: { label: "아연", unit: "mg", target: 10, upper: 35, standard: "권장섭취량" },
    vitaminD: { label: "비타민 D", unit: "ug", target: 12, upper: 100, standard: "충분섭취량" },
    vitaminC: { label: "비타민 C", unit: "mg", target: 100, upper: 2000, standard: "권장섭취량" },
  },
  adult_female: {
    calcium: { label: "칼슘", unit: "mg", target: 650, upper: 2500, standard: "권장섭취량" },
    iron: { label: "철", unit: "mg", target: 12, upper: 45, standard: "권장섭취량" },
    magnesium: { label: "마그네슘", unit: "mg", target: 280, upper: 350, standard: "권장섭취량" },
    zinc: { label: "아연", unit: "mg", target: 8, upper: 35, standard: "권장섭취량" },
    vitaminD: { label: "비타민 D", unit: "ug", target: 12, upper: 100, standard: "충분섭취량" },
    vitaminC: { label: "비타민 C", unit: "mg", target: 100, upper: 2000, standard: "권장섭취량" },
  },
  senior_male: {
    calcium: { label: "칼슘", unit: "mg", target: 750, upper: 2000, standard: "권장섭취량" },
    iron: { label: "철", unit: "mg", target: 8, upper: 45, standard: "권장섭취량" },
    magnesium: { label: "마그네슘", unit: "mg", target: 380, upper: 350, standard: "권장섭취량" },
    zinc: { label: "아연", unit: "mg", target: 9, upper: 35, standard: "권장섭취량" },
    vitaminD: { label: "비타민 D", unit: "ug", target: 12, upper: 100, standard: "충분섭취량" },
    vitaminC: { label: "비타민 C", unit: "mg", target: 100, upper: 2000, standard: "권장섭취량" },
  },
  senior_female: {
    calcium: { label: "칼슘", unit: "mg", target: 750, upper: 2000, standard: "권장섭취량" },
    iron: { label: "철", unit: "mg", target: 6, upper: 45, standard: "권장섭취량" },
    magnesium: { label: "마그네슘", unit: "mg", target: 280, upper: 350, standard: "권장섭취량" },
    zinc: { label: "아연", unit: "mg", target: 7, upper: 35, standard: "권장섭취량" },
    vitaminD: { label: "비타민 D", unit: "ug", target: 12, upper: 100, standard: "충분섭취량" },
    vitaminC: { label: "비타민 C", unit: "mg", target: 100, upper: 2000, standard: "권장섭취량" },
  },
};

const tabItems: { id: TabId; label: string; icon: typeof CalendarClock }[] = [
  { id: "timeline", label: "타임라인", icon: CalendarClock },
  { id: "analysis", label: "충돌 분석", icon: ShieldCheck },
  { id: "ai", label: "AI 협업 기록", icon: Brain },
];

const riskStyles: Record<RiskLevel, string> = {
  낮음: "border-emerald-200 bg-emerald-50 text-emerald-900",
  주의: "border-amber-200 bg-amber-50 text-amber-950",
  높음: "border-red-200 bg-red-50 text-red-950",
};

const riskBadgeStyles: Record<RiskLevel, string> = {
  낮음: "bg-emerald-700 text-white",
  주의: "bg-amber-500 text-stone-950",
  높음: "bg-red-700 text-white",
};

function profileKey(profile: Profile) {
  return `${profile.ageGroup}_${profile.sex}`;
}

function getSelectedSupplements(selection: SelectionState) {
  return supplements.filter((supplement) => selection[supplement.id].selected);
}

function estimateNutrients(selection: SelectionState) {
  const totals: Record<NutrientKey, number> = {
    calcium: 0,
    iron: 0,
    magnesium: 0,
    zinc: 0,
    vitaminD: 0,
    vitaminC: 0,
  };

  for (const supplement of supplements) {
    const selected = selection[supplement.id];
    if (!selected.selected) continue;

    const multiplier = doseOptions[selected.dose].multiplier;
    for (const [nutrient, amount] of Object.entries(supplement.baseDose)) {
      totals[nutrient as NutrientKey] += amount * multiplier;
    }
  }

  return totals;
}

function has(selection: SelectionState, id: SupplementId) {
  return selection[id].selected;
}

function doseOf(selection: SelectionState, id: SupplementId) {
  return selection[id].dose;
}

function formatAmount(value: number, unit: string) {
  if (value === 0) return `0 ${unit}`;
  if (value < 10 && !Number.isInteger(value)) return `${value.toFixed(1)} ${unit}`;
  return `${Math.round(value)} ${unit}`;
}

function addItem(
  slots: TimelineSlot[],
  slotId: string,
  item: Omit<TimelineItem, "id"> & { id?: string },
) {
  const slot = slots.find((candidate) => candidate.id === slotId);
  if (!slot) return;

  slot.items.push({
    id: item.id ?? `${slotId}-${item.label}-${slot.items.length}`,
    label: item.label,
    doseLabel: item.doseLabel,
    reason: item.reason,
    tags: item.tags,
  });
}

function buildTimeline(selection: SelectionState): TimelineSlot[] {
  const slots: TimelineSlot[] = [
    {
      id: "fasting",
      time: "07:30",
      title: "아침 공복",
      icon: Sun,
      items: [],
    },
    {
      id: "breakfast",
      time: "08:30",
      title: "아침 식후",
      icon: Utensils,
      items: [],
    },
    {
      id: "midMorning",
      time: "10:30",
      title: "오전 간격",
      icon: CalendarClock,
      items: [],
    },
    {
      id: "lunch",
      time: "12:30",
      title: "점심 식후",
      icon: Utensils,
      items: [],
    },
    {
      id: "dinner",
      time: "18:30",
      title: "저녁 식후",
      icon: Utensils,
      items: [],
    },
    {
      id: "bedtime",
      time: "21:30",
      title: "취침 전",
      icon: Moon,
      items: [],
    },
  ];

  if (has(selection, "probiotic")) {
    addItem(slots, "fasting", {
      label: "유산균",
      doseLabel: doseOptions[doseOf(selection, "probiotic")].label,
      reason: "물과 함께 단독 배치",
      tags: ["공복", "단독"],
    });
  }

  if (has(selection, "multivitamin")) {
    addItem(slots, "breakfast", {
      label: "종합비타민",
      doseLabel: doseOptions[doseOf(selection, "multivitamin")].label,
      reason: "복합 성분은 식후에 고정",
      tags: ["식후", "복합"],
    });
  }

  if (has(selection, "iron")) {
    addItem(slots, "midMorning", {
      label: "철분",
      doseLabel: doseOptions[doseOf(selection, "iron")].label,
      reason: has(selection, "vitaminC")
        ? "비타민 C와 함께 두고 칼슘군과 분리"
        : "칼슘, 마그네슘, 아연과 2시간 이상 분리",
      tags: ["분리", "흡수"],
    });
  }

  if (has(selection, "vitaminC")) {
    addItem(slots, has(selection, "iron") ? "midMorning" : "breakfast", {
      label: "비타민 C",
      doseLabel: doseOptions[doseOf(selection, "vitaminC")].label,
      reason: has(selection, "iron") ? "철분 흡수 보조 조합" : "수용성 비타민으로 오전 배치",
      tags: has(selection, "iron") ? ["철분 보조"] : ["오전"],
    });
  }

  if (has(selection, "calcium")) {
    if (doseOf(selection, "calcium") === "high") {
      addItem(slots, "lunch", {
        label: "칼슘 1/2",
        doseLabel: "분할",
        reason: "고함량은 한 번에 몰지 않고 나눔",
        tags: ["식후", "분할"],
      });
      addItem(slots, "dinner", {
        label: "칼슘 1/2",
        doseLabel: "분할",
        reason: "철분 시간대와 분리",
        tags: ["식후", "분리"],
      });
    } else {
      addItem(slots, "lunch", {
        label: "칼슘",
        doseLabel: doseOptions[doseOf(selection, "calcium")].label,
        reason: "식후 배치, 철분과 분리",
        tags: ["식후", "분리"],
      });
    }
  }

  for (const id of ["vitaminD", "omega3", "lutein"] as SupplementId[]) {
    if (!has(selection, id)) continue;
    addItem(slots, id === "omega3" ? "dinner" : "lunch", {
      label: supplementMap[id].shortName,
      doseLabel: doseOptions[doseOf(selection, id)].label,
      reason: "지방이 있는 식사와 함께 배치",
      tags: ["지용성", "식후"],
    });
  }

  if (has(selection, "zinc")) {
    addItem(slots, "dinner", {
      label: "아연",
      doseLabel: doseOptions[doseOf(selection, "zinc")].label,
      reason: "철분과 분리하고 식후 배치",
      tags: ["식후", "분리"],
    });
  }

  if (has(selection, "magnesium")) {
    addItem(slots, "bedtime", {
      label: "마그네슘",
      doseLabel: doseOptions[doseOf(selection, "magnesium")].label,
      reason: "저녁 시간대로 분리",
      tags: ["저녁", "분리"],
    });
  }

  return slots;
}

function buildWarnings(
  selection: SelectionState,
  profile: Profile,
  nutrientTotals: Record<NutrientKey, number>,
): InteractionWarning[] {
  const warnings: InteractionWarning[] = [];
  const refs = kdriReferences[profileKey(profile)];

  if (has(selection, "calcium") && has(selection, "iron")) {
    warnings.push({
      id: "calcium-iron",
      level: doseOf(selection, "calcium") === "high" || doseOf(selection, "iron") === "high" ? "높음" : "주의",
      score: doseOf(selection, "calcium") === "high" ? 34 : 26,
      title: "칼슘과 철분 흡수 충돌",
      message: "칼슘은 철분 흡수를 낮출 수 있어 같은 시간대 복용을 피해야 합니다.",
      action: "철분은 오전 간격, 칼슘은 식후 시간대로 나눕니다.",
    });
  }

  if (has(selection, "magnesium") && has(selection, "iron")) {
    warnings.push({
      id: "magnesium-iron",
      level: "주의",
      score: 18,
      title: "마그네슘과 철분 분리 권장",
      message: "무기질 보충제가 겹치면 흡수 경쟁 가능성이 커집니다.",
      action: "마그네슘은 저녁 또는 취침 전으로 이동합니다.",
    });
  }

  if (has(selection, "zinc") && has(selection, "iron")) {
    warnings.push({
      id: "zinc-iron",
      level: "주의",
      score: 18,
      title: "아연과 철분 분리 권장",
      message: "아연과 철분은 같은 시간대보다 분리 배치가 안전합니다.",
      action: "아연은 저녁 식후, 철분은 오전 간격으로 둡니다.",
    });
  }

  if (has(selection, "zinc") && has(selection, "magnesium") && doseOf(selection, "zinc") === "high") {
    warnings.push({
      id: "zinc-magnesium",
      level: "주의",
      score: 14,
      title: "고함량 아연과 마그네슘",
      message: "고용량 아연은 마그네슘 균형에 영향을 줄 수 있어 총량 확인이 필요합니다.",
      action: "아연 고함량 섭취가 계속되면 제품 라벨과 전문가 상담을 확인합니다.",
    });
  }

  if (has(selection, "iron") && has(selection, "vitaminC")) {
    warnings.push({
      id: "iron-vitamin-c",
      level: "낮음",
      score: -8,
      title: "철분과 비타민 C 보완 조합",
      message: "비타민 C는 비헴철 흡수에 유리한 조합입니다.",
      action: "두 성분은 오전 간격 시간대에 함께 배치합니다.",
    });
  }

  if (has(selection, "multivitamin")) {
    const duplicates = supplements
      .filter((supplement) => supplement.id !== "multivitamin" && selection[supplement.id].selected)
      .filter((supplement) =>
        Object.keys(supplement.baseDose).some((nutrient) =>
          Object.keys(supplementMap.multivitamin.baseDose).includes(nutrient),
        ),
      );

    if (duplicates.length > 0) {
      warnings.push({
        id: "multivitamin-duplicates",
        level: "주의",
        score: 16,
        title: "종합비타민과 개별 제품 중복",
        message: `${duplicates.map((item) => item.shortName).join(", ")} 성분이 일부 겹칠 수 있습니다.`,
        action: "개별 제품이 고함량이면 종합비타민 포함량까지 합산합니다.",
      });
    }
  }

  for (const nutrient of Object.keys(nutrientTotals) as NutrientKey[]) {
    const value = nutrientTotals[nutrient];
    const ref = refs[nutrient];
    if (!ref.upper || value === 0) continue;

    const upperRatio = value / ref.upper;
    if (upperRatio >= 1) {
      warnings.push({
        id: `${nutrient}-upper-high`,
        level: "높음",
        score: 36,
        title: `${ref.label} 상한 초과 가능성`,
        message: `추정량 ${formatAmount(value, ref.unit)}이 상한 ${formatAmount(ref.upper, ref.unit)} 이상입니다.`,
        action: "제품 라벨의 실제 함량 확인 전까지 고함량 복용을 낮춥니다.",
      });
    } else if (upperRatio >= 0.8) {
      warnings.push({
        id: `${nutrient}-upper-caution`,
        level: "주의",
        score: 18,
        title: `${ref.label} 상한 근접`,
        message: `추정량이 상한의 ${Math.round(upperRatio * 100)}% 수준입니다.`,
        action: "식사 섭취와 다른 제품의 중복 성분을 함께 확인합니다.",
      });
    }
  }

  return warnings.sort((a, b) => b.score - a.score);
}

function calculateRisk(warnings: InteractionWarning[]) {
  const rawScore = Math.max(
    0,
    Math.min(
      100,
      warnings.reduce((sum, warning) => sum + warning.score, 0),
    ),
  );

  const hasHigh = warnings.some((warning) => warning.level === "높음");
  const score = hasHigh ? Math.max(rawScore, 70) : rawScore;
  const level: RiskLevel = hasHigh || score >= 62 ? "높음" : score >= 25 ? "주의" : "낮음";

  return { score, level };
}

function getProfileCopy(profile: Profile) {
  if (profile.ageGroup === "senior" && profile.sex === "female") {
    return "시니어 여성 기준: 철 권장량은 낮아지고 칼슘 기준은 높게 반영됩니다.";
  }
  if (profile.ageGroup === "senior") {
    return "시니어 기준: 칼슘 목표량과 일부 미량무기질 기준을 별도로 반영합니다.";
  }
  return "성인 기준: 일반 건강인을 위한 2025 KDRI 대표값으로 보정합니다.";
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>({ ageGroup: "adult", sex: "female" });
  const [selection, setSelection] = useState<SelectionState>(initialSelection);
  const [activeTab, setActiveTab] = useState<TabId>("timeline");

  const selectedSupplements = useMemo(() => getSelectedSupplements(selection), [selection]);
  const orderedSupplements = useMemo(
    () =>
      [...supplements].sort((a, b) => {
        const selectedGap = Number(selection[b.id].selected) - Number(selection[a.id].selected);
        return selectedGap || supplements.indexOf(a) - supplements.indexOf(b);
      }),
    [selection],
  );
  const nutrientTotals = useMemo(() => estimateNutrients(selection), [selection]);
  const timeline = useMemo(() => buildTimeline(selection), [selection]);
  const warnings = useMemo(
    () => buildWarnings(selection, profile, nutrientTotals),
    [nutrientTotals, profile, selection],
  );
  const risk = useMemo(() => calculateRisk(warnings), [warnings]);
  const refs = kdriReferences[profileKey(profile)];

  const selectedCount = selectedSupplements.length;

  function toggleSupplement(id: SupplementId) {
    setSelection((current) => ({
      ...current,
      [id]: {
        ...current[id],
        selected: !current[id].selected,
      },
    }));
  }

  function changeDose(id: SupplementId, dose: DoseLevel) {
    setSelection((current) => ({
      ...current,
      [id]: {
        ...current[id],
        selected: true,
        dose,
      },
    }));
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900">
              <HeartPulse className="h-4 w-4" />
              2025 KDRI 보정 기반
            </div>
            <h1 className="text-3xl font-black tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
              개인 맞춤형 영양제 충돌 방지 타임라인
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">
              복용 중인 영양제와 대략적인 복용량만 선택하면 흡수 충돌을 피한 하루 시간표를 생성합니다.
            </p>
          </div>

          <div className={`rounded-lg border p-5 shadow-sm ${riskStyles[risk.level]}`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7" />
              <div>
                <p className="text-sm font-bold">현재 위험도</p>
                <p className="text-3xl font-black">{risk.level}</p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-current"
                style={{ width: `${Math.max(8, risk.score)}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-semibold">점수 {risk.score}/100 · 선택 {selectedCount}개</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-8 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-800" />
              <h2 className="text-xl font-black text-stone-950">프로필</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-bold text-stone-700">연령 기준</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["adult", "성인"],
                    ["senior", "시니어"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProfile((current) => ({ ...current, ageGroup: value as AgeGroup }))}
                      className={`min-h-12 rounded-lg border px-4 py-3 text-base font-black transition ${
                        profile.ageGroup === value
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-stone-300 bg-white text-stone-800 hover:border-emerald-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-stone-700">성별 기준</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["female", "여성"],
                    ["male", "남성"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProfile((current) => ({ ...current, sex: value as Sex }))}
                      className={`min-h-12 rounded-lg border px-4 py-3 text-base font-black transition ${
                        profile.sex === value
                          ? "border-stone-950 bg-stone-950 text-white"
                          : "border-stone-300 bg-white text-stone-800 hover:border-stone-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-stone-100 p-4 text-sm font-semibold leading-6 text-stone-700">
              {getProfileCopy(profile)}
            </p>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-800" />
              <h2 className="text-xl font-black text-stone-950">복용 영양제</h2>
            </div>

            <div className="space-y-3">
              {orderedSupplements.map((supplement) => {
                const state = selection[supplement.id];
                return (
                  <div
                    key={supplement.id}
                    className={`rounded-lg border p-4 transition ${
                      state.selected
                        ? "border-emerald-700 bg-emerald-50"
                        : "border-stone-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSupplement(supplement.id)}
                      className="flex w-full items-start justify-between gap-3 text-left"
                    >
                      <span>
                        <span className="block text-lg font-black text-stone-950">{supplement.name}</span>
                        <span className="mt-1 block text-sm font-semibold text-stone-600">
                          {supplement.category} · {supplement.unitHint}
                        </span>
                      </span>
                      <span
                        className={`mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          state.selected
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-stone-300 bg-white text-transparent"
                        }`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                    </button>

                    {state.selected && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {(Object.keys(doseOptions) as DoseLevel[]).map((dose) => (
                          <button
                            key={dose}
                            type="button"
                            onClick={() => changeDose(supplement.id, dose)}
                            className={`min-h-12 rounded-lg border px-2 py-2 text-center transition ${
                              state.dose === dose
                                ? "border-stone-950 bg-stone-950 text-white"
                                : "border-stone-300 bg-white text-stone-800 hover:border-stone-800"
                            }`}
                          >
                            <span className="block text-sm font-black">{doseOptions[dose].label}</span>
                            <span className="block text-[11px] font-semibold opacity-80">
                              {doseOptions[dose].helper}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <div className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-h-14 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition sm:text-base ${
                      activeTab === tab.id
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCount === 0 ? (
            <section className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
              <Info className="mx-auto h-10 w-10 text-stone-500" />
              <h2 className="mt-3 text-2xl font-black text-stone-950">선택된 영양제가 없습니다</h2>
              <p className="mt-2 text-base font-semibold text-stone-600">
                왼쪽 목록에서 복용 중인 영양제를 선택하면 시간표와 충돌 분석이 표시됩니다.
              </p>
            </section>
          ) : (
            <>
              {activeTab === "timeline" && (
                <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-stone-950">오늘의 복용 타임라인</h2>
                      <p className="mt-1 text-sm font-semibold text-stone-600">
                        의료 진단이 아닌 복용 시간 참고용입니다.
                      </p>
                    </div>
                    <span className={`w-fit rounded-full px-4 py-2 text-sm font-black ${riskBadgeStyles[risk.level]}`}>
                      {risk.level} 위험
                    </span>
                  </div>

                  <div className="space-y-3">
                    {timeline.map((slot) => {
                      const Icon = slot.icon;
                      return (
                        <div
                          key={slot.id}
                          className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[118px_1fr]"
                        >
                          <div className="flex items-center gap-3 sm:block">
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm sm:mb-3">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xl font-black text-stone-950">{slot.time}</p>
                              <p className="text-sm font-bold text-stone-600">{slot.title}</p>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            {slot.items.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-stone-300 bg-white p-4 text-sm font-semibold text-stone-500">
                                배치된 영양제 없음
                              </div>
                            ) : (
                              slot.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-lg font-black text-stone-950">{item.label}</p>
                                      <p className="mt-1 text-sm font-semibold text-stone-600">{item.reason}</p>
                                    </div>
                                    <span className="w-fit rounded-full bg-stone-900 px-3 py-1 text-sm font-black text-white">
                                      {item.doseLabel}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {activeTab === "analysis" && (
                <section className="space-y-5">
                  <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-stone-950">충돌 분석</h2>
                        <p className="mt-1 text-sm font-semibold text-stone-600">
                          3단계 복용량을 기준량으로 환산해 KDRI와 비교합니다.
                        </p>
                      </div>
                      <span className={`w-fit rounded-full px-4 py-2 text-sm font-black ${riskBadgeStyles[risk.level]}`}>
                        {risk.score}/100
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {(Object.keys(nutrientTotals) as NutrientKey[]).map((nutrient) => {
                        const ref = refs[nutrient];
                        const amount = nutrientTotals[nutrient];
                        const ratio = amount / ref.target;
                        const barWidth = Math.min(100, Math.round(ratio * 100));
                        return (
                          <div key={nutrient} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-black text-stone-950">{ref.label}</p>
                                <p className="text-sm font-semibold text-stone-600">{ref.standard}</p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-stone-900 shadow-sm">
                                {Math.round(ratio * 100)}%
                              </span>
                            </div>
                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                              <div
                                className={`h-full rounded-full ${
                                  ratio >= 1.4 ? "bg-amber-500" : "bg-emerald-700"
                                }`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-stone-700">
                              추정 {formatAmount(amount, ref.unit)} / 기준 {formatAmount(ref.target, ref.unit)}
                            </p>
                            {ref.upper && (
                              <p className="mt-1 text-xs font-bold text-stone-500">
                                상한 {formatAmount(ref.upper, ref.unit)}
                                {nutrient === "magnesium" ? " · 보충제 급원 기준" : ""}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-black text-stone-950">경고 및 보정 결과</h3>
                    <div className="mt-4 space-y-3">
                      {warnings.length === 0 ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0" />
                            <div>
                              <p className="text-lg font-black">뚜렷한 충돌이 감지되지 않았습니다</p>
                              <p className="mt-1 text-sm font-semibold">
                                식사 패턴, 의약품, 질환 여부에 따라 실제 권장은 달라질 수 있습니다.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        warnings.map((warning) => (
                          <div
                            key={warning.id}
                            className={`rounded-lg border p-5 ${riskStyles[warning.level]}`}
                          >
                            <div className="flex items-start gap-3">
                              {warning.level === "낮음" ? (
                                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0" />
                              ) : (
                                <AlertTriangle className="mt-1 h-6 w-6 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-lg font-black">{warning.title}</h4>
                                  <span className={`rounded-full px-3 py-1 text-xs font-black ${riskBadgeStyles[warning.level]}`}>
                                    {warning.level}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold leading-6">{warning.message}</p>
                                <p className="mt-2 text-sm font-black leading-6">권장 조치: {warning.action}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "ai" && (
                <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-700 text-white">
                      <Brain className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-stone-950">AI 협업 및 비판적 수용 기록</h2>
                      <p className="mt-1 text-sm font-semibold text-stone-600">
                        해커톤 기획 과정의 의사결정 로그
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {[
                      {
                        title: "1. 초기 AI 제안",
                        body: "성분별 mg, g, IU를 사용자가 직접 입력하고, 그 값을 기준으로 정밀 충돌 계산을 수행하는 방식이 제안되었습니다.",
                      },
                      {
                        title: "2. 인간 기획자의 비판",
                        body: "일반 사용자는 제품 라벨의 성분 단위와 실제 함량을 정확히 이해하기 어렵습니다. 특히 시니어 사용자는 입력 부담이 크면 앱을 끝까지 사용하기 어렵습니다.",
                      },
                      {
                        title: "3. 수정된 설계",
                        body: "입력은 적게, 보통, 고함량의 3단계로 단순화하고, 내부에서는 한국인 영양소 섭취기준 대표값과 제품군별 기준량을 곱해 추정 섭취량을 보정합니다.",
                      },
                      {
                        title: "4. 최종 가치",
                        body: "정밀도만 높이는 대신 실제 사용 가능성을 높였습니다. AI 제안을 그대로 수용하지 않고 현장 적용성과 접근성을 기준으로 알고리즘을 재설계했습니다.",
                      },
                    ].map((item) => (
                      <article key={item.title} className="rounded-lg border border-stone-200 bg-stone-50 p-5">
                        <div className="flex items-start gap-3">
                          <ChevronRight className="mt-1 h-6 w-6 shrink-0 text-emerald-800" />
                          <div>
                            <h3 className="text-xl font-black text-stone-950">{item.title}</h3>
                            <p className="mt-2 text-base font-semibold leading-7 text-stone-700">{item.body}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                    <div className="flex items-start gap-3">
                      <Info className="mt-1 h-6 w-6 shrink-0" />
                      <p className="text-sm font-bold leading-6">
                        본 앱의 수치는 건강한 일반인을 위한 대표 기준을 사용한 추정치입니다. 처방약 복용,
                        임신·수유, 신장질환, 빈혈 치료 중인 경우에는 전문가 상담이 우선입니다.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
