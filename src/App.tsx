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
  const [key, setKey] = useState("");

  const [otH, setOtH] = useState("0");
  const [otM, setOtM] = useState("0");
  const [hwH, setHwH] = useState("0");
  const [hwM, setHwM] = useState("0");
  const [paidLeave, setPaidLeave] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("records");
    if (s) setRecords(JSON.parse(s));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const saveAll = (next: any) => {
    setRecords(next);
    localStorage.setItem("records", JSON.stringify(next));
  };

  const first = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;
  const yearKey = `${ym.y}-`;

  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const yearData = Object.entries(records).filter(([k]) => k.startsWith(yearKey));

  const totalOT = monthData.reduce((a, [, v]) => a + (v.overtime || 0), 0);
  const totalHW = monthData.filter(([, v]) => (v.holidayWork || 0) > 0).length;
  const totalPL = yearData.filter(([, v]) => v.paidLeave).length;

  const openInput = (k: string, r?: RecordData) => {
    setKey(k);
    setOtH(String(Math.floor((r?.overtime || 0) / 60)));
    setOtM(String((r?.overtime || 0) % 60));
    setHwH(String(Math.floor((r?.holidayWork || 0) / 60)));
    setHwM(String((r?.holidayWork || 0) % 60));
    setPaidLeave(!!r?.paidLeave);
    setOpen(true);
  };

  const save = () => {
    const next = { ...records };
    const overtime = Number(otH) * 60 + Number(otM);
    const holidayWork = Number(hwH) * 60 + Number(hwM);

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
        <button style={S.navBtn} onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
        <div style={S.month}>{ym.y}年 {ym.m}月</div>
        <button style={S.navBtn} onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
      </div>

      {/* week */}
      <div style={S.week}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ color: i === 0 ? "#E55" : i === 6 ? "#36F" : "#555" }}>{w}</div>
        ))}
      </div>

      {/* calendar */}
      <div style={S.cal}>
        {Array.from({ length: first }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const k = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const r = records[k];
          const wd = new Date(ym.y, ym.m - 1, d).getDay();

          return (
            <div key={k} style={S.day} onClick={() => openInput(k, r)}>
              <div style={{ fontWeight: 700, fontSize: 12, color: wd === 0 ? "#E55" : wd === 6 ? "#36F" : "#333" }}>{d}</div>
              {r?.overtime ? <div style={S.ot}>{Math.floor(r.overtime / 60)}h{r.overtime % 60}m</div> : null}
              {r?.holidayWork ? <div style={S.hw}>休出</div> : null}
              {r?.paidLeave ? <div style={S.pl}>年休</div> : null}
            </div>
          );
        })}
      </div>

      {/* summary */}
      <div style={S.sum}>
        <div>残業 {Math.floor(totalOT / 60)}h{totalOT % 60}m</div>
        <div>休日出勤 {totalHW}日</div>
        <div>年休（年間）{totalPL}日</div>
      </div>

      {/* modal */}
      {open && (
        <div style={S.modalBg}>
          <form style={S.modal} onSubmit={e => { e.preventDefault(); save(); }}>
            <div style={S.row}>
              <span>残業</span>
              <input inputMode="numeric" value={otH} onChange={e => setOtH(e.target.value)} />h
              <input inputMode="numeric" step={10} value={otM} onChange={e => setOtM(e.target.value)} />m
            </div>
            <div style={S.row}>
              <span>休出</span>
              <input inputMode="numeric" value={hwH} onChange={e => setHwH(e.target.value)} />h
              <input inputMode="numeric" step={10} value={hwM} onChange={e => setHwM(e.target.value)} />m
            </div>
            <label style={S.check}>
              <input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休
            </label>
            <button style={S.saveBtn} type="submit">保存（Enter）</button>
          </form>
        </div>
      )}
    </div>
  );
}

const S: any = {
  page: { minHeight: "100dvh", background: "#FFF7EE", padding: 8, fontFamily: "-apple-system" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  month: { fontSize: 24, fontWeight: 700 },
  navBtn: { fontSize: 20, background: "none", border: "none" },

  week: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", fontSize: 12 },
  cal: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 },
  day: { background: "#fff", borderRadius: 14, padding: 6, minHeight: 70, boxShadow: "0 1px 4px rgba(0,0,0,.08)" },
  ot: { fontSize: 11, color: "#F80", fontWeight: 600 },
  hw: { fontSize: 11, color: "#F90" },
  pl: { fontSize: 11, color: "#E55" },

  sum: { marginTop: 10, textAlign: "center", fontSize: 16, fontWeight: 700 },

  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", justifyContent: "center", alignItems: "center" },
  modal: {
    background: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,.2)",
    fontSize: 16
  },
  row: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  check: { display: "block", marginBottom: 12, fontSize: 16 },
  saveBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#FFB703",
    fontSize: 16,
    fontWeight: 700
  }
};
