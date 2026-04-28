export const DEFAULT_PROGRAM = [
  {
    id: "upper-a",
    day: "上半身 A",
    subtitle: "槓鈴胸推主項",
    tag: "PUSH",
    accent: "#C8501E",
    exercises: [
      { name: "槓鈴平板臥推", weight: 40, unit: "kg", step: 2.5, sets: 4, repRange: "6-8", note: "退槓後肩胛收緊、下放至胸下緣，啟動前先吸氣憋住。" },
      { name: "上斜啞鈴臥推", weight: 12, unit: "kg", step: 1, sets: 3, repRange: "8-10", note: "椅背 30-45 度，啞鈴下放至胸口外側。" },
      { name: "槓鈴肩推", weight: 25, unit: "kg", step: 2.5, sets: 3, repRange: "6-8", note: "站姿或坐姿皆可，臀腿夾緊避免下背過度後仰。" },
      { name: "啞鈴側平舉", weight: 6, unit: "kg", step: 1, sets: 3, repRange: "12-15", note: "手肘略彎，抬至與肩同高，控制離心。" },
      { name: "繩索三頭下壓", weight: 15, unit: "kg", step: 2.5, sets: 3, repRange: "12-15", note: "上臂貼身固定，僅由肘關節發力。" },
    ],
  },
  {
    id: "lower-a",
    day: "下半身 A",
    subtitle: "深蹲主項",
    tag: "QUAD",
    accent: "#3B6B4F",
    exercises: [
      { name: "槓鈴背蹲", weight: 50, unit: "kg", step: 2.5, sets: 4, repRange: "6-8", note: "槓位高背、蹲至大腿與地面平行，膝蓋跟著腳尖方向。" },
      { name: "腿推機", weight: 80, unit: "kg", step: 5, sets: 3, repRange: "10-12", note: "下放至大腿貼近胸口，避免下背離開椅墊。" },
      { name: "腿伸展機", weight: 30, unit: "kg", step: 2.5, sets: 3, repRange: "12-15", note: "頂峰停 1 秒，控制離心 2 秒。" },
      { name: "啞鈴行走弓箭步", weight: 10, unit: "kg", step: 1, sets: 3, repRange: "10-12", note: "左右腳各一下算一下，後腳膝蓋輕觸地。" },
      { name: "站姿提踵機", weight: 30, unit: "kg", step: 2.5, sets: 3, repRange: "15-20", note: "頂峰停 1 秒，下放至最低再啟動。" },
    ],
  },
  {
    id: "upper-b",
    day: "上半身 B",
    subtitle: "划船與下拉",
    tag: "PULL",
    accent: "#1F4E79",
    exercises: [
      { name: "引體向上", weight: 0, unit: "bw", sets: 4, repRange: "AMRAP", note: "做到力竭，無法完成可改負重輔助機。" },
      { name: "槓鈴俯身划船", weight: 35, unit: "kg", step: 2.5, sets: 4, repRange: "6-8", note: "髖部略屈、背部中立，槓拉至下腹。" },
      { name: "滑輪下拉", weight: 35, unit: "kg", step: 2.5, sets: 3, repRange: "10-12", note: "肩胛先下沉再啟動，拉至鎖骨。" },
      { name: "繩索面拉", weight: 15, unit: "kg", step: 2.5, sets: 3, repRange: "15-20", note: "繩索拉至眼睛高度，後三角與菱形肌發力。" },
      { name: "槓鈴彎舉", weight: 20, unit: "kg", step: 2.5, sets: 3, repRange: "8-12", note: "手腕中立，避免身體前後晃動借力。" },
    ],
  },
  {
    id: "lower-b",
    day: "下半身 B",
    subtitle: "硬舉與臀推",
    tag: "POST",
    accent: "#7A4E8C",
    exercises: [
      { name: "槓鈴硬舉", weight: 60, unit: "kg", step: 2.5, sets: 3, repRange: "5", note: "啟動前肩胛收緊、槓貼脛骨，髖膝同時鎖定。" },
      { name: "槓鈴臀推", weight: 50, unit: "kg", step: 2.5, sets: 3, repRange: "8-10", note: "頂峰停 1 秒，下巴內收避免拱腰。" },
      { name: "俯臥腿彎舉", weight: 25, unit: "kg", step: 2.5, sets: 3, repRange: "10-12", note: "頂峰收緊、離心緩慢，避免甩動。" },
      { name: "啞鈴相撲深蹲", weight: 16, unit: "kg", step: 1, sets: 3, repRange: "12-15", note: "腳尖外開，膝蓋跟著腳尖方向。" },
      { name: "平板撐體", weight: 0, unit: "bw", sets: 3, repRange: "30-40", note: "每組維持 30-40 秒，腹部與臀部持續出力。" },
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
