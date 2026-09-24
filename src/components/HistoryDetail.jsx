import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { auth } from "../firebase";

export default function HistoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null);

  useEffect(() => {
    try {
      // =========================
      // KIỂM TRA TÀI KHOẢN
      // =========================

      const currentUser = auth.currentUser;

      if (!currentUser) {
        navigate("/login");
        return;
      }

      const userId = currentUser.uid;

      // =========================
      // LẤY HISTORY
      // =========================

      const history = JSON.parse(
        localStorage.getItem("practiceHistory") || "[]"
      );

      const found = history.find(
        (entry) =>
          String(entry.id) === String(id) &&
          entry.userId === userId
      );

      setItem(found || null);
    } catch (error) {
      console.error(
        "Không thể lấy chi tiết lịch sử:",
        error
      );
    }
  }, [id, navigate]);

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString(
        "vi-VN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "Không xác định";
    }
  };

  const cardStyle = {
    background: "#2d0758",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "20px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.25)",
  };

  // =========================
  // KHÔNG TÌM THẤY
  // =========================

  if (!item) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#10051d",
          color: "#fff",
          fontFamily: '"Poppins", sans-serif',
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontSize: "26px",
            fontWeight: 800,
            marginBottom: "20px",
          }}
        >
          Không tìm thấy buổi luyện tập.
        </div>

        <button
          onClick={() => navigate("/history")}
          style={{
            width: "200px",
            height: "55px",
            border: "none",
            borderRadius: "16px",
            background: "#fff",
            color: "#321348",
            fontFamily: '"Baloo 2", cursive',
            fontSize: "17px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          VỀ LỊCH SỬ
        </button>
      </div>
    );
  }

  const questions = Array.isArray(item.questions)
    ? item.questions
    : [];

  const answers = Array.isArray(item.answers)
    ? item.answers
    : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#10051d",
        color: "#fff",
        fontFamily: '"Poppins", sans-serif',
        padding: "35px 7% 60px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "45px",
        }}
      >
        <div
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "1.5px",
          }}
        >
          FEAR2HEAR
        </div>

        <button
          onClick={() => navigate("/history")}
          style={{
            border: "none",
            background: "transparent",
            color: "#d8cde0",
            fontFamily: '"Baloo 2", cursive',
            fontSize: "17px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← LỊCH SỬ
        </button>
      </div>

      {/* TITLE */}

      <div
        style={{
          textAlign: "center",
          marginBottom: "45px",
        }}
      >
        <div
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "3px",
            opacity: 0.7,
            marginBottom: "10px",
          }}
        >
          PRACTICE DETAIL
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: '"Baloo 2", cursive',
            fontSize: "45px",
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {item.topic || "Chưa có chủ đề"}
        </h1>

        <div
          style={{
            marginTop: "15px",
            color: "#cfc4d8",
            fontFamily: '"Poppins", sans-serif',
            fontSize: "14px",
          }}
        >
          {formatDate(item.date)}
        </div>
      </div>

      {/* PRESENTATION */}

      <section style={cardStyle}>
        <div
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontSize: "17px",
            fontWeight: 800,
            letterSpacing: "2px",
            color: "#cbb5d8",
            marginBottom: "12px",
          }}
        >
          BÀI THUYẾT TRÌNH
        </div>

        <div
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#f2edf5",
            whiteSpace: "pre-wrap",
            fontWeight: 400,
          }}
        >
          {item.presentationTranscript ||
            "Không có nội dung bài nói."}
        </div>
      </section>

      {/* QUESTIONS + ANSWERS */}

      <section style={cardStyle}>
        <div
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontSize: "17px",
            fontWeight: 800,
            letterSpacing: "2px",
            color: "#cbb5d8",
            marginBottom: "22px",
          }}
        >
          PHẦN PHẢN BIỆN VỚI SAM
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {questions.map((question, index) => {
            const answerItem = answers[index];

            const answer =
              answerItem &&
              typeof answerItem === "object"
                ? answerItem.answer
                : typeof answerItem === "string"
                ? answerItem
                : "";

            return (
              <div
                key={index}
                style={{
                  padding: "20px",
                  borderRadius: "18px",
                  background:
                    "rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Baloo 2", cursive',
                    fontSize: "16px",
                    fontWeight: 800,
                    marginBottom: "8px",
                  }}
                >
                  CÂU {index + 1}
                </div>

                <div
                  style={{
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: "16px",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    marginBottom: "14px",
                  }}
                >
                  {question}
                </div>

                <div
                  style={{
                    height: "1px",
                    background:
                      "rgba(255,255,255,0.12)",
                    marginBottom: "14px",
                  }}
                />

                <div
                  style={{
                    fontFamily: '"Baloo 2", cursive',
                    fontSize: "16px",
                    color: "#cbb5d8",
                    fontWeight: 700,
                    marginBottom: "5px",
                  }}
                >
                  CÂU TRẢ LỜI CỦA BẠN
                </div>

                <div
                  style={{
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "#f2edf5",
                    fontWeight: 400,
                  }}
                >
                  {answer || "Không có câu trả lời."}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI FEEDBACK */}

      <section style={cardStyle}>
        <div
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontSize: "17px",
            fontWeight: 800,
            letterSpacing: "2px",
            color: "#cbb5d8",
            marginBottom: "25px",
          }}
        >
          NHẬN XÉT TỪ SAM
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          {/* ĐIỂM MẠNH */}

          <div
            style={{
              padding: "22px",
              borderRadius: "18px",
              background:
                "rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontFamily: '"Baloo 2", cursive',
                fontSize: "18px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              ĐIỂM MẠNH
            </div>

            <div
              style={{
                fontFamily: '"Poppins", sans-serif',
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#e7dfea",
                fontWeight: 400,
              }}
            >
              {item.feedback?.strength ||
                "Không có nhận xét."}
            </div>
          </div>

          {/* ĐIỂM CẦN CẢI THIỆN */}

          <div
            style={{
              padding: "22px",
              borderRadius: "18px",
              background:
                "rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontFamily: '"Baloo 2", cursive',
                fontSize: "18px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              ĐIỂM CẦN CẢI THIỆN
            </div>

            <div
              style={{
                fontFamily: '"Poppins", sans-serif',
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#e7dfea",
                fontWeight: 400,
              }}
            >
              {item.feedback?.weakness ||
                "Không có nhận xét."}
            </div>
          </div>

          {/* GỢI Ý */}

          <div
            style={{
              padding: "22px",
              borderRadius: "18px",
              background:
                "rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontFamily: '"Baloo 2", cursive',
                fontSize: "18px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              GỢI Ý CHO LẦN SAU
            </div>

            <div
              style={{
                fontFamily: '"Poppins", sans-serif',
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#e7dfea",
                fontWeight: 400,
              }}
            >
              {item.feedback?.suggestion ||
                "Không có nhận xét."}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}