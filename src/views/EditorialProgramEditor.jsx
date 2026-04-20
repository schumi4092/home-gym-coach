import { useMemo, useState } from "react";
import { TE, ES, primaryBtn, secondaryBtn } from "../constants/editorial-theme.js";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${TE.ink}`,
  color: TE.ink,
  padding: "8px 2px",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 13,
  outline: "none",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 48,
  padding: "8px 10px",
  border: `1px solid ${TE.ink4}`,
  borderRadius: 0,
  background: TE.surface,
};

export function EditorialProgramEditor({ programs, onBack, onSave }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(programs)));
  const [selectedId, setSelectedId] = useState(programs[0]?.id ?? "");
  const selectedProgram = draft.find((program) => program.id === selectedId) ?? draft[0];

  const updateProgramField = (programId, field, value) => {
    setDraft((prev) => prev.map((p) => (p.id === programId ? { ...p, [field]: value } : p)));
  };

  const updateExerciseField = (programId, exIdx, field, value) => {
    setDraft((prev) => prev.map((p) => (
      p.id === programId
        ? { ...p, exercises: p.exercises.map((ex, i) => (i === exIdx ? { ...ex, [field]: value } : ex)) }
        : p
    )));
  };

  const addExercise = (programId) => {
    setDraft((prev) => prev.map((p) => (
      p.id === programId
        ? { ...p, exercises: [...p.exercises, { name: "新動作", weight: 0, unit: "kg", sets: 3, repRange: "8-12", note: "" }] }
        : p
    )));
  };

  const removeExercise = (programId, exIdx) => {
    setDraft((prev) => prev.map((p) => (
      p.id === programId
        ? { ...p, exercises: p.exercises.filter((_, i) => i !== exIdx) }
        : p
    )));
  };

  const cleanedPrograms = useMemo(() => draft.map((p) => ({
    ...p,
    exercises: p.exercises
      .filter((ex) => ex.name.trim() !== "")
      .map((ex) => ({
        name: ex.name.trim(),
        weight: Number(ex.weight) || 0,
        unit: ex.unit,
        sets: Math.max(1, Number(ex.sets) || 1),
        repRange: ex.repRange.trim() || "8-12",
        note: ex.note ?? "",
      })),
  })), [draft]);

  return (
    <div style={ES.shell}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <div style={{ ...ES.label, marginBottom: 10 }}>THE TRAINING RECORD · PROGRAM EDITOR</div>
          <hr style={ES.thickRule} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "18px 0 14px" }}>
            <div>
              <h1 style={{ ...ES.num, fontSize: 44, margin: 0, lineHeight: 1 }}>編輯課表</h1>
              <div style={{ ...ES.label, marginTop: 10, textTransform: "none", letterSpacing: "0.02em", fontSize: 13, color: TE.ink3 }}>
                Modify, remove, or append movements to any program.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onBack} style={secondaryBtn}>← Back</button>
              <button onClick={() => onSave(cleanedPrograms)} style={primaryBtn}>Save Program</button>
            </div>
          </div>
          <hr style={ES.rule} />
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 24 }}>
          <aside style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${TE.ink}`, borderBottom: `1px solid ${TE.ink}` }}>
            {draft.map((program, idx) => {
              const active = selectedId === program.id;
              return (
                <button
                  key={program.id}
                  onClick={() => setSelectedId(program.id)}
                  style={{
                    textAlign: "left",
                    padding: "16px 14px",
                    background: active ? TE.ink : "transparent",
                    color: active ? TE.bg : TE.ink,
                    border: "none",
                    borderBottom: idx < draft.length - 1 ? `1px solid ${TE.ink4}` : "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: active ? TE.highlight : TE.ink3,
                  }}>{program.tag}</span>
                  <span style={{ ...ES.num, fontSize: 20 }}>{program.day}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: active ? TE.bgAlt : TE.ink3 }}>
                    {program.exercises.length} movements
                  </span>
                </button>
              );
            })}
          </aside>

          {selectedProgram && (
            <section style={{ background: TE.surface, border: `1px solid ${TE.ink}`, padding: "22px 22px 24px" }}>
              <div style={{ ...ES.label, marginBottom: 12 }}>Program Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 18, marginBottom: 28 }}>
                <LabeledField label="Day">
                  <input value={selectedProgram.day} onChange={(e) => updateProgramField(selectedProgram.id, "day", e.target.value)} style={inputStyle} />
                </LabeledField>
                <LabeledField label="Subtitle">
                  <input value={selectedProgram.subtitle ?? ""} onChange={(e) => updateProgramField(selectedProgram.id, "subtitle", e.target.value)} style={inputStyle} />
                </LabeledField>
                <LabeledField label="Tag">
                  <input value={selectedProgram.tag} onChange={(e) => updateProgramField(selectedProgram.id, "tag", e.target.value)} style={inputStyle} />
                </LabeledField>
              </div>

              <hr style={ES.rule} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0 14px" }}>
                <div style={ES.label}>Movements · {selectedProgram.exercises.length}</div>
                <button onClick={() => addExercise(selectedProgram.id)} style={{ ...secondaryBtn, padding: "8px 14px", fontSize: 11 }}>
                  + Add Movement
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${TE.ink}` }}>
                {selectedProgram.exercises.map((exercise, index) => (
                  <div key={index} style={{ padding: "16px 2px", borderBottom: `1px solid ${TE.ink4}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "24px minmax(160px,1.4fr) 100px 80px 80px 120px 60px", gap: 12, alignItems: "end" }}>
                      <div style={{ ...ES.monoNum, fontSize: 14, color: TE.ink3, paddingBottom: 10 }}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <LabeledField label="Name" small>
                        <input value={exercise.name} onChange={(e) => updateExerciseField(selectedProgram.id, index, "name", e.target.value)} style={inputStyle} />
                      </LabeledField>
                      <LabeledField label="Weight" small>
                        <input type="number" step="0.125" min="0" value={exercise.weight} onChange={(e) => updateExerciseField(selectedProgram.id, index, "weight", Number(e.target.value))} style={inputStyle} />
                      </LabeledField>
                      <LabeledField label="Unit" small>
                        <select value={exercise.unit} onChange={(e) => updateExerciseField(selectedProgram.id, index, "unit", e.target.value)} style={selectStyle}>
                          <option value="kg">kg</option>
                          <option value="bw">bw</option>
                          <option value="sec">sec</option>
                        </select>
                      </LabeledField>
                      <LabeledField label="Sets" small>
                        <input type="number" min="1" value={exercise.sets} onChange={(e) => updateExerciseField(selectedProgram.id, index, "sets", Number(e.target.value))} style={inputStyle} />
                      </LabeledField>
                      <LabeledField label="Reps" small>
                        <input value={exercise.repRange} onChange={(e) => updateExerciseField(selectedProgram.id, index, "repRange", e.target.value)} style={inputStyle} placeholder="8-12" />
                      </LabeledField>
                      <button
                        onClick={() => removeExercise(selectedProgram.id, index)}
                        style={{
                          background: "transparent",
                          border: `1px solid ${TE.ink4}`,
                          color: TE.accent,
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "8px 4px",
                          cursor: "pointer",
                          height: 34,
                        }}
                      >Del</button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ ...ES.label, fontSize: 10, marginBottom: 6 }}>Note</div>
                      <textarea
                        value={exercise.note ?? ""}
                        onChange={(e) => updateExerciseField(selectedProgram.id, index, "note", e.target.value)}
                        placeholder="Cueing, tempo, notes…"
                        rows={2}
                        style={textareaStyle}
                      />
                    </div>
                  </div>
                ))}
                {selectedProgram.exercises.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center", color: TE.ink3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                    No movements yet — press “+ Add Movement”.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function LabeledField({ label, children, small = false }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ ...ES.label, fontSize: small ? 10 : 11 }}>{label}</span>
      {children}
    </label>
  );
}
