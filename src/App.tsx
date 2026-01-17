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

  const [otH, setOtH] = useState<number | "">("");
  const [otM, setOtM] = useState<number | "">("");
  const [hwH, setHwH] = useState<number | "">("");
  const [hwM, setHwM] = useState<number | "">("");
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
  const totalHoliday = monthData.reduce((a, [, v]) => a + (v.holidayWork || 0), 0);
  const totalLeave = monthData.filter(([, v]) => v.paidLeave).length;

  const openModal = (key: string, rec?: RecordData) => {
    setSelected(key);
    setOtH(rec?.overtime ? Math.floor(rec.overtime / 60) : "");
    setOtM(rec?.overtime ? rec.overtime % 60 : "");
    setHwH(rec?.holidayWork ? Math.floor(rec.holidayWork / 60) : "");
    setHwM(rec?.holidayWork ? rec.holidayWork % 60 : "");
    setPaidLeave(!!rec?.paidLeave);
    setOpen(true);
  };

  const saveCurrent = () => {
    if (!selected) return;
    const next = { ...records };
    const overtime = (Number(otH) || 0) * 60 + (Number(otM) || 0);
    const holidayWork = (Number(hwH) || 0) * 60 + (Number(hwM) || 0);

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
      {/* 月表示 */}
      <div style={styles.monthNav}>
        <button onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
        <div style={styles.monthText}>{ym.y}年 {ym.m}月</div>
        <button onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
      </div>

      {/* 曜日 */}
      <div style={styles.weekRow}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ ...styles.week, color: i === 0 ? "#E85A5A" : i === 6 ? "#3A7BFF" : "#333" }}>
            {w}
          </div>
        ))}
      </div>

      {/* カレンダー */}
      <div style={styles.calendar}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const key = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const rec = records[key];
          return (
            <div key={key} style={styles.day} onClick={() => openModal(key, rec)}>
              <div style={styles.dayNum}>{d}</div>
              {rec?.overtime && <div style={styles.badge}>残</div>}
              {rec?.holidayWork && <div style={styles.badge}>休</div>}
              {rec?.paidLeave && <div style={styles.badge}>年</div>}
            </div>
          );
        })}
      </div>

      {/* 合計表示（1行ずつ・大きく） */}
      <div style={styles.summaryBox}>
        <div>残業：{Math.floor(totalOver / 60)}時間 {totalOver % 60}分</div>
        <div>休日出勤：{Math.floor(totalHoliday / 60)}時間 {totalHoliday % 60}分</div>
        <div>年休：{totalLeave}日</div>
      </div>

      {/* モーダル */}
      {open && (
        <div style={styles.modalBg}>
          <form style={styles.modal} onSubmit={e => { e.preventDefault(); saveCurrent(); }}>
            <div style={styles.row}>
              残業
              <input style={styles.input} type="number" value={otH} onChange={e => setOtH(e.target.value === "" ? "" : +e.target.value)} />h
              <input style={styles.input} type="number" value={otM} onChange={e => setOtM(e.target.value === "" ? "" : +e.target.value)} />m
            </div>
            <div style={styles.row}>
              休出
              <input style={styles.input} type="number" value={hwH} onChange={e => setHwH(e.target.value === "" ? "" : +e.target.value)} />h
              <input style={styles.input} type="number" value={hwM} onChange={e => setHwM(e.target.value === "" ? "" : +e.target.value)} />m
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
  page: { background: "#FFF7EE", minHeight: "100vh", padding: 8, fontFamily: "-apple-system" },
  monthNav: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  monthText: { fontSize: 24, fontWeight: 700 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", fontSize: 13 },
  week: { textAlign: "center" },
  calendar: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 },
  day: { background: "#fff", borderRadius: 12, padding: 4, minHeight: 52 },
  dayNum: { fontSize: 14, fontWeight: 700 },
  badge: { fontSize: 11 },
  summaryBox: { marginTop: 6, fontSize: 18, fontWeight: 700 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-end" },
  modal: { background: "#fff", width: "100%", padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  row: { display: "flex", gap: 6, marginBottom: 10 },
  input: { fontSize: 16, width: 60 },
  save: { width: "100%", padding: 12, fontSize: 16 }
};
