// 勤怠管理ページ（安定版 v8）
// ・0表示なし
// ・土日色分けのみ
// ・左右スワイプで月移動
// ・コピペ一発

import { useState, useEffect } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

type RecordData = {
  overtime?: number;    // 分
  holidayWork?: number; // 分
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

  /* ---------- 保存 ---------- */
  useEffect(() => {
    const saved = localStorage.getItem("workRecords");
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  const saveRecords = (next: Record<string, RecordData>) => {
    setRecords(next);
    localStorage.setItem("workRecords", JSON.stringify(next));
  };

  /* ---------- 月情報 ---------- */
  const firstDay = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;

  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const totalOver = monthData.reduce((a, [, v]) => a + (v.overtime || 0), 0);
  const totalHolidayDays = monthData.filter(([, v]) => (v.holidayWork || 0) > 0).length;
  const totalPaidLeaveDays = monthData.filter(([, v]) => v.paidLeave).length;

  /* ---------- スワイプ ---------- */
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }));
      } else {
        setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }));
      }
    }
    setTouchStartX(null);
  };

  /* ---------- 入力 ---------- */
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

    if (overtime > 0 || holidayWork > 0 || paidLeave) {
      next[selected] = { overtime, holidayWork, paidLeave };
    } else {
      delete next[selected];
    }
    saveRecords(next);
    setOpen(false);
  };

  /* ---------- 表示 ---------- */
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
        <div style={styles.month}>{ym.y}年 {ym.m}月</div>
        <button onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
      </header>

      <div style={styles.weekRow}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ color: i === 0 ? "#E85A5A" : i === 6 ? "#3A7BFF" : "#555" }}>{w}</div>
        ))}
      </div>

      <div
        style={styles.calendar}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const key = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const rec = records[key];
          const day = new Date(ym.y, ym.m - 1, d).getDay();

          return (
            <div key={key} style={styles.day} onClick={() => openModal(key, rec)}>
              <div style={{ fontWeight: 700, fontSize: 12, color: day === 0 ? "#E85A5A" : day === 6 ? "#3A7BFF" : "#333" }}>
                {d}
              </div>
              {rec?.overtime && <div style={styles.ot}>{Math.floor(rec.overtime / 60)}h{rec.overtime % 60}m</div>}
              {rec?.holidayWork && <div style={styles.hw}>休出</div>}
              {rec?.paidLeave && <div style={styles.pl}>年休</div>}
            </div>
          );
        })}
      </div>

      <div style={styles.summary}>
        <div>残業 {Math.floor(totalOver / 60)}h{totalOver % 60}m</div>
        <div>休出 {totalHolidayDays}日</div>
        <div>年休 {totalPaidLeaveDays}日</div>
      </div>

      {open && (
        <div style={styles.modalBg}>
          <form style={styles.modal} onSubmit={e => { e.preventDefault(); saveCurrent(); }}>
            <div>残業 <input type="number" value={otH} onChange={e => setOtH(+e.target.value)} />h
              <input type="number" step={10} value={otM} onChange={e => setOtM(+e.target.value)} />m</div>
            <div>休出 <input type="number" value={hwH} onChange={e => setHwH(+e.target.value)} />h
              <input type="number" step={10} value={hwM} onChange={e => setHwM(+e.target.value)} />m</div>
            <label><input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休</label>
            <button type="submit">保存</button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- style ---------- */
const styles: any = {
  page: { background: "#FFF7EE", minHeight: "100vh", padding: 10, fontFamily: "-apple-system" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  month: { fontSize: 22, fontWeight: 700 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", fontSize: 11 },
  calendar: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 },
  day: { background: "#fff", borderRadius: 12, padding: 6, minHeight: 70 },
  ot: { fontSize: 11, color: "#FF7A00", fontWeight: 600 },
  hw: { fontSize: 10, color: "#FF9F1C" },
  pl: { fontSize: 10, color: "#666" },
  summary: { marginTop: 8, textAlign: "center", fontWeight: 600 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", padding: 16, borderRadius: 20, width: "90%" }
};
