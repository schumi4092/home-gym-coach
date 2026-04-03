import { useMemo, useState } from "react";
import { T, iconButtonStyle, inputBaseStyle, panelStyle, primaryButtonStyle } from "../constants/theme.js";

export function ProgramEditor({ programs, onBack, onSave, isDesktop }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(programs)));
  const [selectedId, setSelectedId] = useState(programs[0]?.id ?? "");
  const selectedProgram = draft.find((program) => program.id === selectedId) ?? draft[0];

  const updateProgramField = (programId, field, value) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId ? { ...program, [field]: value } : program
    )));
  };

  const updateExerciseField = (programId, exerciseIndex, field, value) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId
        ? { ...program, exercises: program.exercises.map((exercise, index) => (index === exerciseIndex ? { ...exercise, [field]: value } : exercise)) }
        : program
    )));
  };

  const addExercise = (programId) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId
        ? { ...program, exercises: [...program.exercises, { name: "新動作", weight: 0, unit: "kg", sets: 3, repRange: "8-12", note: "" }] }
        : program
    )));
  };

  const removeExercise = (programId, exerciseIndex) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId
        ? { ...program, exercises: program.exercises.filter((_, index) => index !== exerciseIndex) }
        : program
    )));
  };

  const cleanedPrograms = useMemo(() => draft.map((program) => ({
    ...program,
    exercises: program.exercises
      .filter((exercise) => exercise.name.trim() !== "")
      .map((exercise) => ({
        name: exercise.name.trim(),
        weight: Number(exercise.weight) || 0,
        unit: exercise.unit,
        sets: Math.max(1, Number(exercise.sets) || 1),
        repRange: exercise.repRange.trim() || "8-12",
        note: exercise.note ?? "",
      })),
  })), [draft]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: isDesktop ? "28px 28px 40px" : "20px 16px", color: T.t1 }}>
      <div style={{ maxWidth: isDesktop ? 1200 : 700, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} style={iconButtonStyle}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M9 2L4 7L9 12" fill="none" stroke={T.t2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 4 }}>PROGRAM EDITOR</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>編輯課表</div>
              <div style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>可以修改動作、刪除動作，或新增新的動作。</div>
            </div>
          </div>
          <button onClick={() => onSave(cleanedPrograms)} style={primaryButtonStyle}>
            儲存課表
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "280px minmax(0,1fr)" : "1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draft.map((program) => (
              <button key={program.id} onClick={() => setSelectedId(program.id)} style={{ ...panelStyle, textAlign: "left", padding: "14px 14px", borderColor: selectedId === program.id ? `${T.accent}70` : T.border, background: selectedId === program.id ? `${T.accent}14` : T.bg2, color: T.t1, cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>{program.tag}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{program.day}</div>
                <div style={{ fontSize: 14, color: T.t3 }}>{program.exercises.length} 個動作</div>
              </button>
            ))}
          </div>

          {selectedProgram && (
            <div style={{ ...panelStyle, borderRadius: 16, padding: "16px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 120px" : "1fr", gap: 10, marginBottom: 16 }}>
                <input value={selectedProgram.day} onChange={(event) => updateProgramField(selectedProgram.id, "day", event.target.value)} style={inputBaseStyle} />
                <input value={selectedProgram.subtitle} onChange={(event) => updateProgramField(selectedProgram.id, "subtitle", event.target.value)} style={inputBaseStyle} />
                <input value={selectedProgram.tag} onChange={(event) => updateProgramField(selectedProgram.id, "tag", event.target.value)} style={inputBaseStyle} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.t3, letterSpacing: "0.08em" }}>動作列表</div>
                <button onClick={() => addExercise(selectedProgram.id)} style={{ fontSize: 14, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: T.accent, color: T.bg, fontWeight: 700 }}>新增動作</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedProgram.exercises.map((exercise, index) => (
                  <div key={`${exercise.name}-${index}`} style={{ background: T.bg3, borderRadius: 12, padding: "12px 12px", border: `1px solid ${T.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(180px,1.4fr) 90px 80px 90px 110px auto" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <input value={exercise.name} onChange={(event) => updateExerciseField(selectedProgram.id, index, "name", event.target.value)} placeholder="動作名稱" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <input type="number" value={exercise.weight} step="0.125" min="0" onChange={(event) => updateExerciseField(selectedProgram.id, index, "weight", Number(event.target.value))} placeholder="重量" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <select value={exercise.unit} onChange={(event) => updateExerciseField(selectedProgram.id, index, "unit", event.target.value)} style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }}>
                        <option value="kg">kg</option>
                        <option value="bw">bw</option>
                        <option value="sec">sec</option>
                      </select>
                      <input type="number" value={exercise.sets} min="1" onChange={(event) => updateExerciseField(selectedProgram.id, index, "sets", Number(event.target.value))} placeholder="組數" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <input value={exercise.repRange} onChange={(event) => updateExerciseField(selectedProgram.id, index, "repRange", event.target.value)} placeholder="8-12 / AMRAP" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <button onClick={() => removeExercise(selectedProgram.id, index)} style={{ height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: T.bg, color: T.red, padding: "0 12px" }}>刪除</button>
                    </div>
                    <textarea value={exercise.note ?? ""} onChange={(event) => updateExerciseField(selectedProgram.id, index, "note", event.target.value)} placeholder="備註 / 提醒" rows={2} style={{ width: "100%", resize: "vertical", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "10px 10px", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
