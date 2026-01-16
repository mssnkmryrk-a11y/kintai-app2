// 勤怠管理ページ（安定版 v6・iPhone Safari対策済）
// ズーム防止 / キーボード追従 / カレンダー固定

import { useState } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export default function App() {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });

  const [records, setRecords] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem("workRecords") || "{}");
    } catch {
      return {};
    }
  });

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const [otH, setOtH] = useState(0);
  const [otM, setOtM] = useState(0);
  const [hwH, setHwH] = useState(0);
  const [hwM, setHwM] = useState(0);
  const [paidLeave, setPaidLeave] = useState(false);

  const save = (next: Record<string, any>) => {
    setRecords(next);
    localStorage.setItem("workRecords", JSON.stringify(next));
  };

  const firstDay = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;

  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const totalOver = monthData.reduce((a, [, v]: any) => a + (v.overtime || 0), 0);
  const totalHolidayWorkDays = monthData.filter(([, v]: any) => v.holidayWork && v.holidayWork > 0).length;
  const totalPaidLeaveDays = monthData.filter(([, v]: any) => v.paidLeave).length;

  const openModal = (key: string, rec: any) => {
    setSelected(key);
    const ot = rec?.overtime || 0;
    const hw = rec?.holidayWork || 0;
    setOtH(Math.floor(ot / 60));
    setOtM(ot % 60);
    setHwH(Math.floor(hw / 60));
    setHwM(hw % 60);
    setPaidLeave(rec?.paidLeave || false);
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
    save(next);
    setOpen(false);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}> 
        <div style={styles.monthNav}>
          <button onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
          <span>{ym.y}年 {ym.m}月</span>
          <button onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
        </div>
        <div style={styles.summary}>
          今月の残業 {Math.floor(totalOver / 60)}h{totalOver % 60}m ／ 休出 {totalHolidayWorkDays}日 ／ 年休 {totalPaidLeaveDays}日
        </div>
      </header>

      <div style={styles.weekRow}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ ...styles.week, color: i === 0 ? "#E85A5A" : i === 6 ? "#3A7BFF" : "#555" }}>{w}</div>
        ))}
      </div>

      <div style={styles.calendar}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const key = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const rec: any = records[key];
          const day = new Date(ym.y, ym.m - 1, d).getDay();

          return (
            <div key={key} style={styles.day} onClick={() => openModal(key, rec)}>
              <div style={{ fontWeight: 600, fontSize: 13, color: day === 0 || rec?.paidLeave ? "#E85A5A" : day === 6 ? "#3A7BFF" : "#222" }}>{d}</div>
              {rec?.overtime > 0 && <div style={styles.overtime}>{Math.floor(rec.overtime / 60)}h{rec.overtime % 60}m</div>}
              {rec?.holidayWork > 0 && <div style={styles.holidayWork}>休出</div>}
              {rec?.paidLeave && <div style={styles.paidLeave}>年休</div>}
            </div>
          );
        })}
      </div>

      {open && (
        <div style={styles.modalBg} onClick={() => setOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <form onSubmit={e => { e.preventDefault(); saveCurrent(); }}>
              <div style={styles.row}>
                <label>残業</label>
                <input style={styles.input} type="number" value={otH} min={0} onChange={e => setOtH(+e.target.value)} />h
                <input style={styles.input} type="number" value={otM} min={0} step={10} onChange={e => setOtM(+e.target.value)} />m
              </div>
              <div style={styles.row}>
                <label>休日出勤</label>
                <input style={styles.input} type="number" value={hwH} min={0} onChange={e => setHwH(+e.target.value)} />h
                <input style={styles.input} type="number" value={hwM} min={0} step={10} onChange={e => setHwM(+e.target.value)} />m
              </div>
              <div style={styles.row}>
                <label><input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休・祝日</label>
              </div>
              <button type="submit" style={styles.save}>保存（Enter）</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  page: { background: "#FFF7EE", minHeight: "100vh", padding: 12, fontFamily: "-apple-system", overflowX: "hidden" },
  header: { marginBottom: 8 },
  monthNav: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summary: { fontSize: 12, color: "#555", marginTop: 4 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 },
  week: { textAlign: "center", fontSize: 12 },
  calendar: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 },
  day: { background: "#fff", borderRadius: 14, padding: 6, minHeight: 70 },
  overtime: { marginTop: 2, fontSize: 11, color: "#FF7A00", fontWeight: 600 },
  holidayWork: { fontSize: 10, color: "#FF9F1C" },
  paidLeave: { fontSize: 10, color: "#E85A5A" },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)" },
  modal: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  row: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  input: { fontSize: 16, padding: 6, width: 60 },
  save: { width: "100%", padding: 12, borderRadius: 12, background: "#FFB703", border: "none", fontSize: 16 }
};
