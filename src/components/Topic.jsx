import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Topic() {
  const navigate = useNavigate();

  // =========================
  // DỮ LIỆU CHỦ ĐỀ + THỜI GIAN
  // =========================

  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [showTimeSettings, setShowTimeSettings] = useState(false);


  // =========================
  // ĐỔI PHÚT → HH:MM:SS
  // =========================

  const formatTime = (totalMinutes) => {
    const totalSeconds = Number(totalMinutes || 0) * 60;

    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [
      hours,
      mins,
      secs,
    ]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };


  // =========================
  // XÁC NHẬN THỜI GIAN
  // =========================

  const handleConfirmTime = () => {
    if (!minutes || Number(minutes) <= 0) {
      alert("Vui lòng nhập thời gian thuyết trình hợp lệ.");
      return;
    }

    setMinutes(Number(minutes));
    setShowTimeSettings(false);
  };


  // =========================
  // TIẾP TỤC
  // =========================

  const handleContinue = () => {
    const cleanTopic = topic.trim();
    const selectedMinutes = Number(minutes);

    // Không cho để trống chủ đề
    if (!cleanTopic) {
      alert("Vui lòng nhập chủ đề bạn muốn thuyết trình.");
      return;
    }

    // Kiểm tra thời gian
    if (!selectedMinutes || selectedMinutes <= 0) {
      alert("Vui lòng chọn thời gian thuyết trình hợp lệ.");
      return;
    }

    // =========================
    // LƯU CHỦ ĐỀ
    // =========================

    localStorage.setItem(
      "presentationTopic",
      cleanTopic
    );

    // =========================
    // LƯU THỜI GIAN
    // =========================

    localStorage.setItem(
      "presentationMinutes",
      String(selectedMinutes)
    );

    // =========================
    // SANG TRANG PRACTICE
    // =========================

    navigate("/practice");
  };


  return (
    <div className="topic-page">

      {/* =========================
          LOGO
      ========================= */}

      <div className="topic-logo">
        FEAR2HEAR
      </div>


      {/* =========================
          TIMER + ĐIỀU CHỈNH
      ========================= */}

      <div className="topic-timer-box">

        <div className="topic-timer">
          {formatTime(minutes)}
        </div>

        <button
          className="topic-time-button"
          onClick={() =>
            setShowTimeSettings(!showTimeSettings)
          }
        >
          ĐIỀU CHỈNH THỜI GIAN
        </button>


        {/* =========================
            KHUNG CÀI THỜI GIAN
        ========================= */}

        {showTimeSettings && (
          <div className="topic-time-settings">

            <label>
              Thời gian thuyết trình
            </label>

            <div className="topic-time-input-row">

              <input
                type="number"
                min="1"
                value={minutes}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "") {
                    setMinutes("");
                    return;
                  }

                  const numberValue = Number(value);

                  if (numberValue > 0) {
                    setMinutes(numberValue);
                  }
                }}
              />

              <span>phút</span>

            </div>


            <button
              className="topic-time-confirm"
              onClick={handleConfirmTime}
            >
              XÁC NHẬN
            </button>

          </div>
        )}

      </div>


      {/* =========================
          NỘI DUNG CHÍNH
      ========================= */}

      <main className="topic-content">

        <h1 className="topic-title">
          CHỌN CHỦ ĐỀ
        </h1>


        <input
          type="text"
          className="topic-input"
          placeholder="Ví dụ: Vấn nạn bạo lực học đường ngày nay"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />


        <button
          className="topic-continue-btn"
          onClick={handleContinue}
        >
          TIẾP TỤC
        </button>

      </main>

    </div>
  );
}