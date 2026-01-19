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
  const [selectedKey, setSelectedKey] = useState("");

  // 入力（文字列で管理＝ズーム防止）
  const [otH, setOtH] = useState("");
  const [otM, setOtM] = useState("");
  const [hwH, setHwH] = useState("");
  const [hwM, setHwM] = useState("");
  const [paidLeave, setPaidLeave] = useState(false);

  // スワイプ
  const [touchX, setTouchX] = useState<number | null>(null);

  // localStorage
  useEffect(() => {
    const s = localStorage.getItem("workRecords");
    if (s) setRecords(JSON.parse(s));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const saveAll = (next: Record<string, RecordData>) => {
    setRecords(next);
    localStorage.setItem("workRecords", JSON.stringify(next));
  };

  // 日付計算
  const firstDay = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();
  const monthKey = `${ym.y}-${String(ym.m).padStart(2, "0")}`;
  const yearKey = `${ym.y}-`;

  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const yearData = Object.entries(records).filter(([k]) => k.startsWith(yearKey));

  const totalOT = monthData.reduce((a, [, v]) => a + (v.overtime || 0), 0);
  const totalHW = monthData.filter(([, v]) => (v.holidayWork || 0) > 0).length;
  const totalPL = yearData.filter(([, v]) => v.paidLeave).length;
  const totalHWMinutes = monthData.reduce((a, [, v]) => a + (v.holidayWork || 0), 0);

  // 入力を開く
  const openInput = (key: string, r?: RecordData) => {
    setSelectedKey(key);
    setOtH(r?.overtime ? String(Math.floor(r.overtime / 60)) : "");
    setOtM(r?.overtime ? String(r.overtime % 60) : "");
    setHwH(r?.holidayWork ? String(Math.floor(r.holidayWork / 60)) : "");
    setHwM(r?.holidayWork ? String(r.holidayWork % 60) : "");
    setPaidLeave(!!r?.paidLeave);
    setOpen(true);
  };

  // 保存
  const save = () => {
    const next = { ...records };
    const overtime = (Number(otH) || 0) * 60 + (Number(otM) || 0);
    const holidayWork = (Number(hwH) || 0) * 60 + (Number(hwM) || 0);

    if (overtime || holidayWork || paidLeave) {
      next[selectedKey] = { overtime, holidayWork, paidLeave };
    } else {
      delete next[selectedKey];
    }
    saveAll(next);
    setOpen(false);
  };

  // スワイプ
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchX(e.touches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return;
    const diff = e.changedTouches[0].clientX - touchX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }));
      } else {
        setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }));
      }
    }
    setTouchX(null);
  };

  return (
    <div style={S.page}>
      {/* ヘッダー */}
      <div style={S.header}>
        <button style={S.nav} onClick={() => setYm(v => ({ y: v.m === 1 ? v.y - 1 : v.y, m: v.m === 1 ? 12 : v.m - 1 }))}>‹</button>
        <div style={S.month}>{ym.y}年 {ym.m}月</div>
        <button style={S.nav} onClick={() => setYm(v => ({ y: v.m === 12 ? v.y + 1 : v.y, m: v.m === 12 ? 1 : v.m + 1 }))}>›</button>
      </div>

      {/* 曜日 */}
      <div style={S.week}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ color: i === 0 ? "#E55" : i === 6 ? "#36F" : "#555" }}>{w}</div>
        ))}
      </div>

      {/* カレンダー */}
      <div style={S.cal} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const key = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const r = records[key];
          const wd = new Date(ym.y, ym.m - 1, d).getDay();

          return (
            <div key={key} style={S.day} onClick={() => openInput(key, r)}>
              <div style={{ fontSize: 12, fontWeight: 700, color: wd === 0 ? "#E55" : wd === 6 ? "#36F" : "#333" }}>{d}</div>
              {r?.overtime ? <div style={S.ot}>{Math.floor(r.overtime / 60)}h{r.overtime % 60}m</div> : null}
              {r?.holidayWork ? <div style={S.hw}>休出</div> : null}
              {r?.paidLeave ? <div style={S.pl}>年休</div> : null}
            </div>
          );
        })}
      </div>

      {/* 集計 */}
      <div style={S.sum}>
        <div>残業 {Math.floor(totalOT / 60)}h{totalOT % 60}m</div>
        <div>
  休日出勤 {totalHW}日
  {totalHWMinutes > 0
    ? `（${Math.floor(totalHWMinutes / 60)}h${totalHWMinutes % 60}m）`
    : ""}
</div>
        <div>年休（年間）{totalPL}日</div>
      </div>

      {/* 入力 */}
      {open && (
        <div style={S.modalBg}>
          <form style={S.modal} onSubmit={e => { e.preventDefault(); save(); }}>
            <div style={S.row}>
              残業
              <input style={S.input} inputMode="numeric" value={otH} onChange={e => setOtH(e.target.value)} />h
              <input style={S.input} inputMode="numeric" value={otM} onChange={e => setOtM(e.target.value)} />m
            </div>
            <div style={S.row}>
              休出
              <input style={S.input} inputMode="numeric" value={hwH} onChange={e => setHwH(e.target.value)} />h
              <input style={S.input} inputMode="numeric" value={hwM} onChange={e => setHwM(e.target.value)} />m
            </div>
            <label style={S.check}>
              <input type="checkbox" checked={paidLeave} onChange={e => setPaidLeave(e.target.checked)} /> 年休
            </label>
            <button type="submit" style={S.save}>保存（Enter）</button>
          </form>
        </div>
      )}
    </div>
  );
}

const S: any = {
  page: {
  minHeight: "100dvh",
  background: "#FFF7EE",
  padding: 8,
  fontFamily: "-apple-system",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center"
}
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  month: { fontSize: 24, fontWeight: 700 },
  nav: { fontSize: 20, background: "none", border: "none" },

  week: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", fontSize: 12 },
  cal: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 },
  day: { background: "#fff", borderRadius: 14, padding: 6, minHeight: 70 },

  ot: { fontSize: 11, color: "#F80", fontWeight: 600 },
  hw: { fontSize: 11, color: "#F90" },
  pl: { fontSize: 11, color: "#E55" },

  sum: {
  marginTop: 12,
  textAlign: "center",
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.6
}

  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", width: "85%", borderRadius: 16, padding: 16, fontSize: 16 },
  row: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  input: { fontSize: 16, padding: 4, width: 40 },
  check: { display: "block", marginBottom: 12, fontSize: 16 },
  save: { width: "100%", padding: 12, borderRadius: 12, background: "#FFB703", border: "none", fontSize: 16 }
};
