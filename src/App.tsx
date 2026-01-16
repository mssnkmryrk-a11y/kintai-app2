import { useState, useEffect } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

type RecordData = {
  overtime?: number;    // 分
  holidayWork?: number; // 分
  paidLeave?: boolean;  // 年休
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

  /* ===== localStorage ===== */
  useEffect(() => {
    const saved = localStorage.getItem("kintai-records");
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const saveRecords = (next: Record<string, RecordData>) => {
    setRecords(next);
    localStorage.setItem("kintai-records", JSON.stringify(next));
  };

  /* ===== 日付計算 ===== */
  const firstDay = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;
  const yearKey = `${ym.y}-`;

  /* ===== 月集計 ===== */
  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const totalOver = monthData.reduce((a, [, v]) => a + (v.overtime || 0), 0);
  const totalHolidayDays = monthData.filter(([, v]) => (v.holidayWork || 0) > 0).length;

  /* ===== 年休：年間合計（★重要） ===== */
  const totalPaidLeaveYear = Object.entries(records).filter(
    ([k, v]) => k.startsWith(yearKey) && v.paidLeave
  ).length;

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
    saveRecords(next);
    setOpen(false);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.nav}>
          <button onClick={() => setYm(v => ({
            y: v.m === 1 ? v.y - 1 : v.y,
            m: v.m === 1 ? 12 : v.m - 1
          }))}>‹</button>
          <span>{ym.y}年 {ym.m}月</span>
          <button onClick={() => setYm(v => ({
            y: v.m === 12 ? v.y + 1 : v.y,
            m: v.m === 12 ? 1 : v.m + 1
          }))}>›</button>
        </div>
        <div style={styles.summary}>
          残業 {Math.floor(totalOver / 60)}h{totalOver % 60}m ／
          休出 {totalHolidayDays}日 ／
          年休（年間） {totalPaidLeaveYear}日
        </div>
      </header>

      <div style={styles.weekRow}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ ...styles.week, color: i === 0 ? "#E85A5A" : i === 6 ? "#3A7BFF" : "#555" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={styles.calendar}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const key = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const rec = records[key];
          const day = new Date(ym.y, ym.m - 1, d).getDay();

          return (
            <div key={key} style={styles.day} onClick={() => openModal(key, rec)}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: day === 0 || rec?.paidLeave ? "#E85A5A" : day === 6 ? "#3A7BFF" : "#333"
              }}>{d}</div>

              {rec?.overtime && <div style={styles.ot}>{Math.floor(rec.overtime / 60)}h{rec.overtime % 60}m</div>}
              {rec?.holidayWork && <div style={styles.hw}>休出</div>}
              {rec?.paidLeave && <div style={styles.pl}>年休</div>}
            </div>
          );
        })}
      </div>

      {open && (
        <div style={styles.modalBg}>
          <form style={styles.modal} onSubmit={e => { e.preventDefault(); saveCurrent(); }}>
            <div style={styles.row}>
              残業
              <input style={styles.input} type="number" value={otH} onChange={e => setOtH(+e.target.value)} />h
              <input style={styles.input} type="number" step={10} value={otM} onChange={e => setOtM(+e.target.value)} />m
            </div>
            <div style={styles.row}>
              休出
              <input style={styles.input} type="number" value={hwH} onChange={e => setHwH(+e.target.value)} />h
              <input style={styles.input} type="number" step={10} value={hwM} onChange={e => setHwM(+e.target.value)} />m
            </div>
            <label>
              <input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休
            </label>
            <button style={styles.save}>保存</button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  page: { background: "#FFF7EE", minHeight: "100vh", padding: 10, fontFamily: "-apple-system" },
  header: { marginBottom: 6 },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summary: { fontSize: 12, color: "#555", marginTop: 4 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 },
  week: { textAlign: "center", fontSize: 11 },
  calendar: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  day: { background: "#fff", borderRadius: 12, padding: 6, minHeight: 70 },
  ot: { fontSize: 11, color: "#FF7A00", fontWeight: 600 },
  hw: { fontSize: 10, color: "#FF9F1C" },
  pl: { fontSize: 10, color: "#E85A5A" },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-end" },
  modal: { background: "#fff", width: "100%", padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  row: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  input: { fontSize: 16, padding: 4 },
  save: { width: "100%", padding: 12, borderRadius: 12, background: "#FFB703", border: "none", fontSize: 16 }
};
