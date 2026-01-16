import { useState, useEffect } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

type RecordData = {
  overtime?: number;
  holidayWork?: number;
  paidLeave?: boolean;
};

export default function App() {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });
  const [records, setRecords] = useState<Record<string, RecordData>>({});
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const [otH, setOtH] = useState(0);
  const [otM, setOtM] = useState(0);
  const [hwH, setHwH] = useState(0);
  const [hwM, setHwM] = useState(0);
  const [paidLeave, setPaidLeave] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("workRecords");
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const firstDay = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;

  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const totalOver = monthData.reduce((a, [, v]) => a + (v.overtime || 0), 0);

  const openModal = (key: string, rec?: RecordData) => {
    setSelected(key);
    setOtH(Math.floor((rec?.overtime || 0) / 60));
    setOtM((rec?.overtime || 0) % 60);
    setHwH(Math.floor((rec?.holidayWork || 0) / 60));
    setHwM((rec?.holidayWork || 0) % 60);
    setPaidLeave(!!rec?.paidLeave);
    setOpen(true);
  };

  const saveCurrent = () => {
    if (!selected) return;
    const next = { ...records };
    const overtime = otH * 60 + otM;
    const holidayWork = hwH * 60 + hwM;

    if (overtime || holidayWork || paidLeave) {
      next[selected] = { overtime, holidayWork, paidLeave };
    } else {
      delete next[selected];
    }

    setRecords(next);
    localStorage.setItem("workRecords", JSON.stringify(next));
    setOpen(false);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
        <span>{ym.y}年 {ym.m}月</span>
        <button onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
        <div style={styles.summary}>
          残業 {Math.floor(totalOver / 60)}h{totalOver % 60}m
        </div>
      </header>

      <div style={styles.weekRow}>
        {WEEK.map(w => <div key={w}>{w}</div>)}
      </div>

      <div style={styles.calendar}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const key = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const rec = records[key];

          return (
            <div key={key} style={styles.day} onClick={() => openModal(key, rec)}>
              <div style={{ fontWeight: 700 }}>{d}</div>

              {rec?.overtime && rec.overtime > 0 && (
                <div style={styles.overtime}>
                  {Math.floor(rec.overtime / 60)}h{rec.overtime % 60}m
                </div>
              )}

              {rec?.holidayWork && rec.holidayWork > 0 && (
                <div style={styles.holiday}>休出</div>
              )}

              {rec?.paidLeave && <div style={styles.leave}>年休</div>}
            </div>
          );
        })}
      </div>

      {open && (
        <div style={styles.modalBg}>
          <form style={styles.modal} onSubmit={e => { e.preventDefault(); saveCurrent(); }}>
            <input type="number" value={otH} onChange={e => setOtH(+e.target.value)} />
            <input type="number" value={otM} onChange={e => setOtM(+e.target.value)} />
            <label>
              <input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休
            </label>
            <button type="submit">保存</button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  page: { padding: 10 },
  header: { marginBottom: 10 },
  summary: { fontSize: 12 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" },
  calendar: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  day: { background: "#fff", padding: 6, borderRadius: 10 },
  overtime: { color: "#FF7A00", fontSize: 12 },
  holiday: { color: "#FF9F1C", fontSize: 11 },
  leave: { color: "#E85A5A", fontSize: 11 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)" },
  modal: { background: "#fff", padding: 16 }
};
