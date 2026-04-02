export const DEFAULT_PROGRAM = [
  {
    id: "upper-a",
    day: "上半身 A",
    subtitle: "胸肩推為主",
    tag: "PUSH",
    exercises: [
      { name: "啞鈴平板臥推", weight: 10, unit: "kg", sets: 4, repRange: "8-10", note: "選擇能完成 8-10 下、最後一組略感吃力的重量。" },
      { name: "上斜啞鈴臥推", weight: 8, unit: "kg", sets: 3, repRange: "8-10", note: "上斜角約 30-45 度，保持肩胛收緊。" },
      { name: "啞鈴肩推", weight: 8, unit: "kg", sets: 3, repRange: "8-10", note: "核心收緊，避免下背代償。" },
      { name: "啞鈴側平舉", weight: 5, unit: "kg", sets: 3, repRange: "12-15", note: "控制離心，不要聳肩。" },
      { name: "啞鈴前平舉", weight: 5, unit: "kg", sets: 3, repRange: "15-20", note: "手臂與地面平行即可，不需過高。" },
      { name: "單手過頭三頭伸展", weight: 5, unit: "kg", sets: 3, repRange: "12-15", note: "組間休息抓 90 秒。" },
    ],
  },
  {
    id: "lower-a",
    day: "下半身 A",
    subtitle: "股四頭為主",
    tag: "QUAD",
    exercises: [
      { name: "高腳杯深蹲", weight: 10, unit: "kg", sets: 4, repRange: "8-10", note: "蹲至大腿與地面平行，膝蓋跟著腳尖方向。" },
      { name: "保加利亞分腿蹲", weight: 8, unit: "kg", sets: 3, repRange: "8-12", note: "後腳放在椅上，重心放前腳。" },
      { name: "羅馬尼亞硬舉", weight: 10, unit: "kg", sets: 3, repRange: "8-12", note: "保持背部中立，感受腿後側拉伸。" },
      { name: "徒手弓箭步", weight: 0, unit: "bw", sets: 3, repRange: "20-25", note: "左右腳都算，目標每組 20-25 下。" },
      { name: "站姿提踵", weight: 5, unit: "kg", sets: 3, repRange: "15-20", note: "頂峰停 1 秒，感受小腿收縮。" },
    ],
  },
  {
    id: "upper-b",
    day: "上半身 B",
    subtitle: "背部拉為主",
    tag: "PULL",
    exercises: [
      { name: "引體向上", weight: 0, unit: "bw", sets: 4, repRange: "AMRAP", note: "做到力竭，若無法完成可改用彈力帶輔助。" },
      { name: "單臂啞鈴划船", weight: 10, unit: "kg", sets: 4, repRange: "8-12", note: "手肘拉向腰部，感受背部發力。" },
      { name: "上斜啞鈴臥推", weight: 8, unit: "kg", sets: 3, repRange: "10-12", note: "補胸量，不需要做到完全力竭。" },
      { name: "後三角飛鳥", weight: 4, unit: "kg", sets: 3, repRange: "15-20", note: "控制軌跡，手肘微彎。" },
      { name: "啞鈴彎舉", weight: 5, unit: "kg", sets: 3, repRange: "12-15", note: "手腕保持中立，避免甩動借力。" },
    ],
  },
  {
    id: "lower-b",
    day: "下半身 B",
    subtitle: "臀腿後側為主",
    tag: "POST",
    exercises: [
      { name: "羅馬尼亞硬舉", weight: 10, unit: "kg", sets: 4, repRange: "8-10", note: "動作穩定後再逐步加重。" },
      { name: "啞鈴臀推", weight: 10, unit: "kg", sets: 3, repRange: "10-12", note: "頂峰停頓，專注臀部發力。" },
      { name: "啞鈴相撲深蹲", weight: 12, unit: "kg", sets: 3, repRange: "12-15", note: "腳尖外開，膝蓋跟著腳尖方向。" },
      { name: "平板撐體", weight: 0, unit: "bw", sets: 3, repRange: "30-40", note: "每組維持 30-40 秒，腹部持續出力。" },
      { name: "登山者", weight: 0, unit: "bw", sets: 3, repRange: "12-15", note: "速度穩定，不要聳肩。" },
    ],
  },
];

export const TRAINING_FLOW = [
  { label: "第 1 天", type: "upper-a", short: "上A" },
  { label: "第 2 天", type: "lower-a", short: "下A" },
  { label: "第 3 天", type: "rest", short: "休" },
  { label: "第 4 天", type: "upper-b", short: "上B" },
  { label: "第 5 天", type: "lower-b", short: "下B" },
  { label: "第 6 天", type: "rest", short: "休" },
  { label: "第 7 天", type: "rest", short: "休" },
];

export const RPE_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export const STORAGE_KEYS = { history: "wk-hist-v5", live: "wk-live-v5", program: "wk-program-v1" };
