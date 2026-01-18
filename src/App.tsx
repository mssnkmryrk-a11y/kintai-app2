import { useState, useEffect } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

type RecordData = {
  overtime?: number; // 分
  holidayWork?: number; // 分
  paidLeave?: boolean;
};

export default function App() {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });
  const [records, setRecords] = useState<Record<string, RecordData>>({});

  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");

  const [otH, setOtH] = useState(0);
  const [otM, setOtM] = useState(0);
  const [hwH, setHwH] = useState(0);
  const [hwM, setHwM] = useState(0);
  const [paidLeave, setPaidLeave] = useState(false);

  /* --- load/save --- */
  useEffect(() => {
    const s = localStorage.getItem("records");
    if (s) setRecords(JSON.parse(s));
  }, []);

  const saveAll = (next: any) => {
    setRecords(next);
    localStorage.setItem("records", JSON.stringify(next));
  };

  /* --- calendar --- */
  const first = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;
  const yearKey = `${ym.y}-`;

  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const yearData = Object.entries(records).filter(([k]) => k.startsWith(yearKey));

  const totalOT = monthData.reduce((a, [, v]) => a + (v.overtime || 0), 0);
  const totalHW = monthData.filter(([, v]) => (v.holidayWork || 0) > 0).length;
  const totalPL = yearData.filter(([, v]) => v.paidLeave).length;

  /* --- swipe --- */
  let startX = 0;
  const onStart = (e: any) => (startX = e.touches[0].clientX);
  const onEnd = (e: any) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) < 50) return;
    setYm(v =>
      diff > 0
        ? { y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }
        : { y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }
    );
  };

  /* --- input --- */
  const openInput = (k: string, r?: RecordData) => {
    setKey(k);
    setOtH(Math.floor((r?.overtime || 0) / 60));
    setOtM((r?.overtime || 0) % 60);
    setHwH(Math.floor((r?.holidayWork || 0) / 60));
    setHwM((r?.holidayWork || 0) % 60);
    setPaidLeave(!!r?.paidLeave);
    setOpen(true);
  };

  const save = () => {
    const next = { ...records };
    const overtime = otH * 60 + otM;
    const holidayWork = hwH * 60 + hwM;

    if (overtime || holidayWork || paidLeave) {
      next[key] = { overtime, holidayWork, paidLeave };
    } else {
      delete next[key];
    }
    saveAll(next);
    setOpen(false);
  };

  return (
    <div style={S.page}>
      {/* header */}
      <div style={S.header}>
        <button onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
        <div style={S.month}>{ym.y}年 {ym.m}月</div>
        <button onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
      </div>

      {/* week */}
      <div style={S.week}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ color: i === 0 ? "#E55" : i === 6 ? "#36F" : "#555" }}>{w}</div>
        ))}
      </div>

      {/* calendar */}
      <div style={S.cal} onTouchStart={onStart} onTouchEnd={onEnd}>
        {Array.from({ length: first }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const k = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const r = records[k];
          const wd = new Date(ym.y, ym.m - 1, d).getDay();

          return (
            <div key={k} style={S.day} onClick={() => openInput(k, r)}>
              <div style={{ fontWeight: 700, color: wd === 0 ? "#E55" : wd === 6 ? "#36F" : "#333" }}>{d}</div>
              {r?.overtime ? <div style={S.ot}>{Math.floor(r.overtime / 60)}h{r.overtime % 60}m</div> : null}
              {r?.holidayWork ? <div style={S.hw}>休出</div> : null}
              {r?.paidLeave ? <div style={S.pl}>年休</div> : null}
            </div>
          );
        })}
      </div>

      {/* summary */}
      <div style={S.sum}>
        <div>残業合計：{Math.floor(totalOT / 60)}h{totalOT % 60}m</div>
        <div>休日出勤：{totalHW}日</div>
        <div>年休（年間）：{totalPL}日</div>
      </div>

      {/* modal */}
      {open && (
        <div style={S.modalBg}>
          <form style={S.modal} onSubmit={e => { e.preventDefault(); save(); }}>
            <div style={S.row}>
              残業
              <input type="number" value={otH} onChange={e => setOtH(+e.target.value)} />h
              <input type="number" step={10} value={otM} onChange={e => setOtM(+e.target.value)} />m
            </div>
            <div style={S.row}>
              休出
              <input type="number" value={hwH} onChange={e => setHwH(+e.target.value)} />h
              <input type="number" step={10} value={hwM} onChange={e => setHwM(+e.target.value)} />m
            </div>
            <label>
              <input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休
            </label>
            <button type="submit">保存（Enter）</button>
          </form>
        </div>
      )}
    </div>
  );
}

const S: any = {
  page: { minHeight: "100dvh", background: "#FFF7EE", padding: 8 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  month: { fontSize: 24, fontWeight: 700 },
  week: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", fontSize: 12 },
  cal: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 },
  day: { background: "#fff", borderRadius: 12, padding: 6, minHeight: 70 },
  ot: { fontSize: 11, color: "#F80" },
  hw: { fontSize: 11, color: "#F90" },
  pl: { fontSize: 11 },
  sum: { marginTop: 10, textAlign: "center", fontSize: 16, fontWeight: 700 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", padding: 16, borderRadius: 16, width: "85%", fontSize: 16 },
  row: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }
};
