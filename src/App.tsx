import { useState } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export default function App() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [data, setData] = useState<Record<string, { work?: string; paid?: boolean }>>({});

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const keyOf = (d: number) => `${year}-${month + 1}-${d}`;

  return (
    <div style={styles.app}>
      <h2 style={{ margin: "8px 0" }}>
        {year}年 {month + 1}月
      </h2>

      <div style={styles.week}>
        {WEEK.map((w) => (
          <div key={w} style={styles.weekCell}>{w}</div>
        ))}
      </div>

      <div style={styles.grid}>
        {days.map((d, i) =>
          d ? (
            <div key={i} style={styles.day}>
              <div style={styles.date}>{d}</div>

              <input
                type="number"
                inputMode="numeric"
                placeholder="時間"
                value={data[keyOf(d)]?.work ?? ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    [keyOf(d)]: {
                      ...data[keyOf(d)],
                      work: e.target.value === "" ? undefined : e.target.value,
                    },
                  })
                }
                style={styles.input}
              />

              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={data[keyOf(d)]?.paid ?? false}
                  onChange={(e) =>
                    setData({
                      ...data,
                      [keyOf(d)]: {
                        ...data[keyOf(d)],
                        paid: e.target.checked,
                      },
                    })
                  }
                />
                年休
              </label>
            </div>
          ) : (
            <div key={i} />
          )
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    maxWidth: 420,
    margin: "0 auto",
    padding: 8,
    fontFamily: "system-ui",
  },
  week: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    fontWeight: "bold",
  },
  weekCell: {
    padding: 4,
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  },
  day: {
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: 4,
    minHeight: 90,
    fontSize: 12,
  },
  date: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    fontSize: 16,          // ← iPhone拡大防止
    padding: 4,
    boxSizing: "border-box",
  },
  label: {
    display: "flex",
    gap: 4,
    marginTop: 4,
    fontSize: 12,
    alignItems: "center",
  },
};
