import { STORAGE_KEYS } from "../constants/defaults.js";
import { storage } from "../storage/index.js";
import { calcAvgRpe, formatLocalDate, isLocalDateWithinDays } from "./format.js";
import { normalizeHistory } from "./history.js";

export function exportToMarkdown(history) {
  if (history.length === 0) return "目前沒有訓練紀錄。";

  const lines = [];
  const totalMinutes = history.reduce((sum, e) => sum + (e.duration || 0), 0);
  const recentSessions = history.filter((entry) => isLocalDateWithinDays(entry.date, 7)).length;

  lines.push("# 訓練紀錄報告");
  lines.push(`> 匯出時間：${formatLocalDate()}`);
  lines.push("");
  lines.push("## 整體摘要");
  lines.push(`- 總訓練次數：${history.length} 次`);
  lines.push(`- 總訓練時間：${totalMinutes} 分鐘`);
  lines.push(`- 最近 7 天：${recentSessions} 次`);
  lines.push(`- 紀錄區間：${history.at(-1)?.date} ～ ${history[0]?.date}`);
  lines.push("");

  lines.push("## 各動作進度");
  const allNames = [...new Set(history.flatMap((e) => e.exercises.map((ex) => ex.name)))];
  for (const name of allNames) {
    const sessions = history
      .filter((e) => e.exercises.some((ex) => ex.name === name))
      .map((e) => {
        const ex = e.exercises.find((item) => item.name === name);
        const validReps = ex.reps.filter((r) => r > 0);
        return { date: e.date, weight: ex.weight, unit: ex.unit, reps: validReps, avgRpe: calcAvgRpe(ex.rpe) };
      })
      .reverse();
    if (sessions.length === 0) continue;
    lines.push(`### ${name}`);
    lines.push("| 日期 | 重量 | 次數 | 平均 RPE |");
    lines.push("|------|------|------|----------|");
    for (const s of sessions) {
      const load = s.weight > 0 ? `${s.weight} ${s.unit}` : "自體重";
      lines.push(`| ${s.date} | ${load} | ${s.reps.length > 0 ? s.reps.join("/") : "-"} | ${s.avgRpe > 0 ? s.avgRpe : "-"} |`);
    }
    lines.push("");
  }

  lines.push("## 最近訓練記錄（最新 10 筆）");
  for (const entry of history.slice(0, 10)) {
    lines.push(`### ${entry.date} — ${entry.day}（${entry.duration} 分鐘）`);
    for (const ex of entry.exercises) {
      const validReps = ex.reps.filter((r) => r > 0);
      if (validReps.length === 0) continue;
      const load = ex.weight > 0 ? `${ex.weight} ${ex.unit}` : "自體重";
      const rpeStr = calcAvgRpe(ex.rpe) > 0 ? `，RPE ${calcAvgRpe(ex.rpe)}` : "";
      lines.push(`- ${ex.name}：${load}，${validReps.join("/")} 下${rpeStr}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function exportBackup(history, programs) {
  const data = { version: 1, exportedAt: new Date().toISOString(), history, programs };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `home-gym-backup-${formatLocalDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file, setHistory, setPrograms) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.version || !Array.isArray(data.history) || !Array.isArray(data.programs) || data.programs.length === 0) {
    throw new Error("invalid format");
  }
  const nextHistory = normalizeHistory(data.history);
  await storage.set(STORAGE_KEYS.history, JSON.stringify(nextHistory));
  await storage.set(STORAGE_KEYS.program, JSON.stringify(data.programs));
  setHistory(nextHistory);
  setPrograms(data.programs);
}
