import { useState, useEffect, useRef } from "react";

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

  const touchX = useRef<number | null>(null);

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
  const totalHolidayDays = monthData.filter(([, v]) => (v.holidayWork || 0) > 0).length;

  const yearKey = `${ym.y}-`;
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
    localStorage.setItem("workRecords", JSON.stringify(next));
    setRecords(next);
    setOpen(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(diff) > 50) {
      setYm(v =>
        diff < 0
          ? { y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }
          : { y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }
      );
    }
    touchX.current = null;
  };

  return (
    <div style={styles.page}>
      <div style={styles.centerWrap}>
        <header style={styles.header}>
          <button onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
          <div style={styles.title}>{ym.y}年 {ym.m}月</div>
          <button onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
        </header>

        <div style={styles.weekRow}>
          {WEEK.map((w, i) => (
            <div key={w} style={{ ...styles.week, color: i === 0 ? "#E85A5A" : i === 6 ? "#3A7BFF" : "#555" }}>{w}</div>
          ))}
        </div>

        <div
          style={styles.calendar}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const key = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const rec = records[key];
            const day = new Date(ym.y, ym.m - 1, d).getDay();

            return (
              <div key={key} style={styles.day} onClick={() => openModal(key, rec)}>
                <div style={{ fontWeight: 700, fontSize: 12, color: day === 0 || rec?.paidLeave ? "#E85A5A" : day === 6 ? "#3A7BFF" : "#333" }}>
                  {d}
                </div>
                {rec?.overtime && <div style={styles.overtime}>{Math.floor(rec.overtime / 60)}h{rec.overtime % 60}m</div>}
              </div>
            );
          })}
        </div>

        <div style={styles.summaryBottom}>
          <div>残業合計：{Math.floor(totalOver / 60)}h{totalOver % 60}m</div>
          <div>休日出勤：{totalHolidayDays}日</div>
          <div>年休（年）：{totalPaidLeaveYear}日</div>
        </div>
      </div>

      {open && (
        <div style={styles.modalBg}>
          <form style={styles.modal} onSubmit={e => { e.preventDefault(); saveCurrent(); }}>
            <div style={styles.row}>
              残業
              <input style={styles.input} type="number" value={otH} onChange={e => setOtH(+e.target.value)} />h
              <input style={styles.input} type="number" value={otM} step={10} onChange={e => setOtM(+e.target.value)} />m
            </div>
            <div style={styles.row}>
              <input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休
            </div>
            <button type="submit" style={styles.save}>保存</button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#FFF7EE",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "-apple-system",
  },
  centerWrap: {
    width: "100%",
    maxWidth: 420,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: 700 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 },
  week: { textAlign: "center", fontSize: 12 },
  calendar: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  day: { background: "#fff", borderRadius: 12, padding: 6, minHeight: 68 },
  overtime: { fontSize: 11, color: "#FF7A00", fontWeight: 600 },
  summaryBottom: { marginTop: 10, textAlign: "center", fontSize: 15, fontWeight: 600 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center" },
  modal: { background: "#fff", padding: 16, borderRadius: 20, width: "90%" },
  row: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  input: { fontSize: 16, padding: 4 },
  save: { width: "100%", padding: 12, borderRadius: 12, background: "#FFB703", border: "none", fontSize: 16 },
};
