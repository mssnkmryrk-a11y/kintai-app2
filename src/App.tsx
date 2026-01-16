import { useState } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export default function App() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  return (
    <>
      <style>{styles}</style>

      <div className="page">
        {/* ===== カレンダー（完全固定） ===== */}
        <div className="calendarArea">
          <h2 className="title">勤怠管理</h2>

          <div className="calendar">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(
                today.getFullYear(),
                today.getMonth(),
                day
              );
              const isSelected = day === selectedDate;

              return (
                <button
                  key={day}
                  className={`day ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="week">{WEEK[date.getDay()]}</span>
                  <span className="num">{day}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== 入力フォーム（ここだけ動く） ===== */}
        <div className="formArea">
          <h3>{selectedDate}日の勤怠</h3>

          <label>
            出勤
            <input type="number" inputMode="numeric" />
          </label>

          <label>
            退勤
            <input type="number" inputMode="numeric" />
          </label>

          <label>
            休憩（分）
            <input type="number" inputMode="numeric" />
          </label>

          <button className="save">保存</button>
        </div>
      </div>
    </>
  );
}

/* ===== iPhone最適化CSS（超重要） ===== */
const styles = `
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
  background: #fff;
}

.page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== カレンダー固定 ===== */
.calendarArea {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.title {
  margin: 0 0 8px;
  font-size: 18px;
  text-align: center;
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  border: none;
  background: #f2f2f2;
  border-radius: 6px;
  padding: 6px 0;
  font-size: 12px;
}

.day.active {
  background: #007aff;
  color: #fff;
}

.week {
  display: block;
  font-size: 10px;
}

.num {
  font-size: 14px;
  font-weight: bold;
}

/* ===== フォームだけスクロール ===== */
.formArea {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  margin-top: 4px;
}

/* iPhone拡大防止 */
input,
button {
  font-size: 16px;
}

.save {
  width: 100%;
  padding: 12px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
}
`;
