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

  const [ot, setOt] = useState("");
  const [hw, setHw] = useState("");
  const [paidLeave, setPaidLeave] = useState(false);

  /* --- 保存データ --- */
  useEffect(() => {
    const s = localStorage.getItem("records");
    if (s) setRecords(JSON.parse(s));
  }, []);

  const saveAll = (next: any) => {
    setRecords(next);
    localStorage.setItem("records", JSON.stringify(next));
  };

  /* --- 月計算 --- */
  const first = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;
  const yearKey = `${ym.y}-`;

  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const yearData = Object.entries(records).filter(([k]) => k.startsWith(yearKey));

  const totalOT = monthData.reduce((a, [, v]) => a + (v.overtime || 0), 0);
  const totalHW = monthData.filter(([, v]) => (v.holidayWork || 0) > 0).length;
  const totalPL = yearData.filter(([, v]) => v.paidLeave).length;

  /* --- スワイプ --- */
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

  /* --- 入力 --- */
  const openInput = (k: string, r?: RecordData) => {
    setKey(k);
    setOt(r?.overtime ? String(r.overtime) : "");
    setHw(r?.holidayWork ? String(r.holidayWork) : "");
    setPaidLeave(!!r?.paidLeave);
    setOpen(true);
  };

  const save = () => {
    const next = { ...records };
    const otMin = Number(ot || 0);
    const hwMin = Number(hw || 0);

    if (otMin || hwMin || paidLeave) {
      next[key] = { overtime: otMin, holidayWork: hwMin, paidLeave };
    } else {
      delete next[key];
    }
    saveAll(next);
    setOpen(false);
  };

  return (
    <div style={S.page}>
      {/* ヘッダー */}
      <div style={S.header}>
        <button onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
        <div style={S.month}>{ym.y}年 {ym.m}月</div>
        <button onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
      </div>

      {/* 曜日 */}
      <div style={S.week}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ color: i === 0 ? "#E55" : i === 6 ? "#36F" : "#555" }}>{w}</div>
        ))}
      </div>

      {/* カレンダー */}
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
              {r?.overtime ? <div style={S.ot}>{r.overtime}分</div> : null}
              {r?.holidayWork ? <div style={S.hw}>休出</div> : null}
              {r?.paidLeave ? <div style={S.pl}>年休</div> : null}
            </div>
          );
        })}
      </div>

      {/* 集計 */}
      <div style={S.sum}>
        <div>残業合計：{Math.floor(totalOT / 60)}h{totalOT % 60}m</div>
        <div>休日出勤：{totalHW}日</div>
        <div>年休（年間）：{totalPL}日</div>
      </div>

      {/* 入力モーダル */}
      {open && (
        <div style={S.modalBg}>
          <form style={S.modal} onSubmit={e => { e.preventDefault(); save(); }}>
            <div>残業（分・10分刻み）
              <input inputMode="numeric" step={10} value={ot} onChange={e => setOt(e.target.value)} />
            </div>
            <div>休出（分・10分刻み）
              <input inputMode="numeric" step={10} value={hw} onChange={e => setHw(e.target.value)} />
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

/* --- style --- */
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
  modal: { background: "#fff", padding: 16, borderRadius: 16, width: "85%", fontSize: 16 }
};
