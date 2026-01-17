import { useState, useEffect, useRef } from "react";

/* ===== 定数 ===== */
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/* 日本の祝日（必要年だけ追加でOK） */
const JP_HOLIDAYS: Record<number, string[]> = {
  2025: [
    "01-01","01-13","02-11","02-23","02-24",
    "03-20","04-29",
    "05-03","05-04","05-05","05-06",
    "07-21","08-11",
    "09-15","09-23",
    "10-13","11-03","11-23","11-24"
  ],
  2026: [
    "01-01","01-12","02-11","02-23",
    "03-20","04-29",
    "05-03","05-04","05-05","05-06",
    "07-20","08-11",
    "09-21","09-22","09-23",
    "10-12","11-03","11-23"
  ]
};

const isJPHoliday = (y: number, m: number, d: number) => {
  const list = JP_HOLIDAYS[y];
  if (!list) return false;
  const md = `${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  return list.includes(md);
};

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

  /* localStorage */
  useEffect(() => {
    const saved = localStorage.getItem("workRecords");
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const saveRecords = (next: Record<string, RecordData>) => {
    setRecords(next);
    localStorage.setItem("workRecords", JSON.stringify(next));
  };

  /* 月情報 */
  const firstDay = new Date(ym.y, ym.m - 1, 1).getDay();
  const days = new Date(ym.y, ym.m, 0).getDate();

  /* 月集計 */
  const monthKey = `${ym.y}-${String(ym.m).padStart(2,"0")}`;
  const monthData = Object.entries(records).filter(([k]) => k.startsWith(monthKey));
  const monthOver = monthData.reduce((a,[,v])=>a+(v.overtime||0),0);
  const monthHolidayDays = monthData.filter(([,v])=>(v.holidayWork||0)>0).length;

  /* 年休（年合計） */
  const yearKey = `${ym.y}-`;
  const yearPaidLeave = Object.entries(records)
    .filter(([k,v])=>k.startsWith(yearKey) && v.paidLeave)
    .length;

  /* モーダル */
  const openModal = (key: string, rec?: RecordData) => {
    setSelected(key);
    setOtH(Math.floor((rec?.overtime||0)/60));
    setOtM((rec?.overtime||0)%60);
    setHwH(Math.floor((rec?.holidayWork||0)/60));
    setHwM((rec?.holidayWork||0)%60);
    setPaidLeave(!!rec?.paidLeave);
    setOpen(true);
  };

  const saveCurrent = () => {
    if (!selected) return;
    const next = { ...records };
    const overtime = otH*60+otM;
    const holidayWork = hwH*60+hwM;

    if (overtime||holidayWork||paidLeave) {
      next[selected]={ overtime, holidayWork, paidLeave };
    } else {
      delete next[selected];
    }
    saveRecords(next);
    setOpen(false);
  };

  /* スワイプ */
  const startX = useRef(0);
  const onTouchStart = (e:any)=> startX.current = e.touches[0].clientX;
  const onTouchEnd = (e:any)=>{
    const diff = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(diff)<50) return;
    if (diff<0) nextMonth();
    else prevMonth();
  };

  const prevMonth = () =>
    setYm(v=>({ y: v.m===1? v.y-1:v.y, m: v.m===1?12:v.m-1 }));
  const nextMonth = () =>
    setYm(v=>({ y: v.m===12? v.y+1:v.y, m: v.m===12?1:v.m+1 }));

  return (
    <div style={styles.page} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* 上 */}
      <header style={styles.header}>
        <button onClick={prevMonth}>‹</button>
        <div style={styles.month}>{ym.y}年 {ym.m}月</div>
        <button onClick={nextMonth}>›</button>
      </header>

      {/* 曜日 */}
      <div style={styles.weekRow}>
        {WEEK.map((w,i)=>(
          <div key={w} style={{...styles.week,color:i===0?"#E85A5A":i===6?"#3A7BFF":"#555"}}>{w}</div>
        ))}
      </div>

      {/* カレンダー */}
      <div style={styles.calendar}>
        {Array.from({length:firstDay}).map((_,i)=><div key={i}/>)}
        {Array.from({length:days}).map((_,i)=>{
          const d=i+1;
          const key=`${ym.y}-${String(ym.m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const rec=records[key];
          const day=new Date(ym.y,ym.m-1,d).getDay();
          const isHoliday=isJPHoliday(ym.y,ym.m,d);

          return (
            <div key={key} style={styles.day} onClick={()=>openModal(key,rec)}>
              <div style={{
                fontWeight:700,
                fontSize:12,
                color: day===0||isHoliday||rec?.paidLeave ? "#E85A5A" : day===6 ? "#3A7BFF" : "#333"
              }}>{d}</div>

              {rec?.overtime ? <div style={styles.ot}>{Math.floor(rec.overtime/60)}h{rec.overtime%60}m</div> : null}
              {rec?.holidayWork ? <div style={styles.hw}>休出</div> : null}
              {rec?.paidLeave ? <div style={styles.pl}>年休</div> : null}
            </div>
          );
        })}
      </div>

      {/* 下 */}
      <div style={styles.bottom}>
        <div>残業合計：{Math.floor(monthOver/60)}h{monthOver%60}m</div>
        <div>休日出勤：{monthHolidayDays}日</div>
        <div>年休（年合計）：{yearPaidLeave}日</div>
      </div>

      {/* 入力 */}
      {open && (
        <div style={styles.modalBg}>
          <form style={styles.modal} onSubmit={e=>{e.preventDefault();saveCurrent();}}>
            <div style={styles.row}>
              残業
              <input style={styles.input} type="number" value={otH} onChange={e=>setOtH(+e.target.value)}/>h
              <input style={styles.input} type="number" step={10} value={otM} onChange={e=>setOtM(+e.target.value)}/>m
            </div>
            <div style={styles.row}>
              休出
              <input style={styles.input} type="number" value={hwH} onChange={e=>setHwH(+e.target.value)}/>h
              <input style={styles.input} type="number" step={10} value={hwM} onChange={e=>setHwM(+e.target.value)}/>m
            </div>
            <label>
              <input type="checkbox" checked={paidLeave} onChange={e=>setPaidLeave(e.target.checked)}/> 年休
            </label>
            <button style={styles.save}>保存</button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ===== styles ===== */
const styles:any={
  page:{background:"#FFF7EE",minHeight:"100vh",padding:8,fontFamily:"-apple-system"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  month:{fontSize:22,fontWeight:700},
  weekRow:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginTop:4},
  week:{textAlign:"center",fontSize:11},
  calendar:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4},
  day:{background:"#fff",borderRadius:10,padding:5,minHeight:64},
  ot:{fontSize:11,color:"#FF7A00",fontWeight:600},
  hw:{fontSize:10,color:"#FF9F1C"},
  pl:{fontSize:10,color:"#E85A5A"},
  bottom:{marginTop:6,fontSize:16,fontWeight:700},
  modalBg:{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"flex-end"},
  modal:{background:"#fff",width:"100%",padding:16,borderTopLeftRadius:20,borderTopRightRadius:20},
  row:{display:"flex",alignItems:"center",gap:6,marginBottom:10},
  input:{fontSize:16,padding:4},
  save:{marginTop:8,width:"100%",padding:12,fontSize:16,borderRadius:12,background:"#FFB703",border:"none"}
};
