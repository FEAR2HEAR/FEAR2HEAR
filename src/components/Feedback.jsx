import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "../App.css";

export default function Feedback() {
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function generateFeedback() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          navigate("/login");
          return;
        }

        const userId = currentUser.uid;

        const topic =
          localStorage.getItem("presentationTopic") ||
          "Chưa có chủ đề";

        const presentationTranscript =
          localStorage.getItem(
            "presentationTranscript"
          ) || "";

        const questions = JSON.parse(
          localStorage.getItem("samQuestions") || "[]"
        );

        const answers = JSON.parse(
          localStorage.getItem("samAnswers") || "[]"
        );

        const presentationMetrics = JSON.parse(
          localStorage.getItem(
            "presentationPerformanceMetrics"
          ) || "null"
        );

        const samMetrics = JSON.parse(
          localStorage.getItem(
            "samPerformanceMetrics"
          ) || "null"
        );

        const response = await fetch(
          "http://localhost:3001/api/generate-feedback",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              topic,
              presentationTranscript,
              questions: questions.slice(0, 4),
              answers: answers.slice(0, 4),
              performance: {
                presentation: presentationMetrics,
                debate: samMetrics,
              },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.feedback) {
          throw new Error(
            data.error ||
              "Không thể tạo nhận xét AI."
          );
        }

        setFeedback(data.feedback);

        /* =========================
           LƯU LỊCH SỬ
        ========================= */

        const attemptId =
          localStorage.getItem("practiceAttemptId") ||
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        const historyItem = {
          id: attemptId,
          userId,
          date: new Date().toISOString(),
          topic,
          presentationTranscript,
          questions: questions.slice(0, 4),
          answers: answers.slice(0, 4),
          feedback: data.feedback,
          performance: {
            presentation: presentationMetrics,
            debate: samMetrics,
          },
        };

        const oldHistory = JSON.parse(
          localStorage.getItem("practiceHistory") ||
            "[]"
        );

        const alreadyExists = oldHistory.some(
          (item) =>
            item.id === attemptId &&
            item.userId === userId
        );

        if (!alreadyExists) {
          const newHistory = [
            historyItem,
            ...oldHistory,
          ];

          localStorage.setItem(
            "practiceHistory",
            JSON.stringify(newHistory)
          );
        }
      } catch (err) {
        console.error(
          "Lỗi tạo feedback:",
          err
        );

        setError(
          err.message ||
            "Không thể tạo nhận xét AI."
        );
      } finally {
        setLoading(false);
      }
    }

    generateFeedback();
  }, [navigate]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div
        className="feedback-page"
        style={{
          minHeight: "100vh",
          boxSizing: "border-box",
          background: "#10051d",
          color: "#fff",
          fontFamily: '"Poppins", sans-serif',
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "5%",
            fontFamily:
              '"Poppins", sans-serif',
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "1.5px",
            color: "#fff",
            textShadow:
              "0 0 18px rgba(174,108,255,0.45)",
          }}
        >
          FEAR2HEAR
        </div>

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily:
              '"Baloo 2", cursive',
            fontSize: "26px",
            fontWeight: 700,
          }}
        >
          SAM đang phân tích bài luyện tập...
        </div>
      </div>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <div
        className="feedback-page"
        style={{
          minHeight: "100vh",
          boxSizing: "border-box",
          background: "#10051d",
          color: "#fff",
          fontFamily: '"Poppins", sans-serif',
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "5%",
            fontFamily:
              '"Poppins", sans-serif',
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "1.5px",
            color: "#fff",
            textShadow:
              "0 0 18px rgba(174,108,255,0.45)",
          }}
        >
          FEAR2HEAR
        </div>

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "25px",
          }}
        >
          <div
            style={{
              fontFamily:
                '"Baloo 2", cursive',
              fontSize: "24px",
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
            }}
          >
            {error}
          </div>

          <button
            type="button"
            onClick={() => navigate("/main")}
            style={{
              width: "225px",
              height: "58px",
              border: "none",
              borderRadius: "16px",
              background: "#3b0878",
              color: "#fff",
              fontFamily:
                '"Baloo 2", cursive',
              fontSize: "18px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.3)",
            }}
          >
            VỀ TRANG CHÍNH
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     MAIN FEEDBACK
  ========================= */

  return (
    <div
      className="feedback-page"
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "28px 5% 55px",
        background:
          "radial-gradient(circle at 50% 0%, #2a0b45 0%, #10051d 48%, #08030e 100%)",
        color: "#fff",
        fontFamily: '"Poppins", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* =========================
          LOGO
      ========================= */}

      <div
        style={{
          position: "relative",
          zIndex: 5,
          fontFamily:
            '"Poppins", sans-serif',
          fontSize: "28px",
          fontWeight: 900,
          letterSpacing: "1.5px",
          color: "#fff",
          textShadow:
            "0 0 18px rgba(174,108,255,0.45)",
          marginBottom: "58px",
        }}
      >
        FEAR2HEAR
      </div>

      {/* =========================
          TITLE
      ========================= */}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginBottom: "36px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily:
              '"Paytone One", sans-serif',
            fontSize: "48px",
            fontWeight: 400,
            lineHeight: 1.1,
            color: "#fff",
            textShadow:
              "0 0 20px rgba(169,91,255,0.35)",
          }}
        >
          NHẬN XÉT CỦA SAM
        </h1>

        <div
          style={{
            width: "85px",
            height: "3px",
            marginTop: "18px",
            borderRadius: "10px",
            background:
              "linear-gradient(90deg, #fff, transparent)",
            boxShadow:
              "0 0 12px rgba(255,255,255,0.45)",
          }}
        />
      </div>

      {/* =========================
          FEEDBACK CARDS
      ========================= */}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "1320px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >

        {/* =========================
            ĐIỂM MẠNH
        ========================= */}

        <div
          style={{
            width: "100%",
            minHeight: "148px",
            boxSizing: "border-box",
            padding: "28px 32px",
            display: "grid",
            gridTemplateColumns:
              "150px 1fr",
            alignItems: "center",
            gap: "28px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(61,20,91,0.96), rgba(39,13,59,0.96))",
            border:
              "1px solid rgba(255,255,255,0.09)",
            boxShadow:
              "0 12px 35px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              fontFamily:
                '"Baloo 2", cursive',
              fontSize: "22px",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#fff",
              textShadow:
                "0 0 12px rgba(255,255,255,0.25)",
            }}
          >
            ĐIỂM
            <br />
            MẠNH
          </div>

          <div
            style={{
              fontFamily:
                '"Poppins", sans-serif',
              fontSize: "17px",
              lineHeight: 1.65,
              color: "#e6dced",
            }}
          >
            {feedback?.strength ||
              "Chưa có dữ liệu."}
          </div>
        </div>

        {/* =========================
            ĐIỂM CẦN CẢI THIỆN
        ========================= */}

        <div
          style={{
            width: "100%",
            minHeight: "148px",
            boxSizing: "border-box",
            padding: "28px 32px",
            display: "grid",
            gridTemplateColumns:
              "150px 1fr",
            alignItems: "center",
            gap: "28px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(61,20,91,0.96), rgba(39,13,59,0.96))",
            border:
              "1px solid rgba(255,255,255,0.09)",
            boxShadow:
              "0 12px 35px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              fontFamily:
                '"Baloo 2", cursive',
              fontSize: "22px",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#fff",
              textShadow:
                "0 0 12px rgba(255,255,255,0.25)",
            }}
          >
            ĐIỂM CẦN
            <br />
            CẢI THIỆN
          </div>

          <div
            style={{
              fontFamily:
                '"Poppins", sans-serif',
              fontSize: "17px",
              lineHeight: 1.65,
              color: "#e6dced",
            }}
          >
            {feedback?.weakness ||
              "Chưa có dữ liệu."}
          </div>
        </div>

        {/* =========================
            GỢI Ý LUYỆN TẬP
        ========================= */}

        <div
          style={{
            width: "100%",
            minHeight: "148px",
            boxSizing: "border-box",
            padding: "28px 32px",
            display: "grid",
            gridTemplateColumns:
              "150px 1fr",
            alignItems: "center",
            gap: "28px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(61,20,91,0.96), rgba(39,13,59,0.96))",
            border:
              "1px solid rgba(255,255,255,0.09)",
            boxShadow:
              "0 12px 35px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              fontFamily:
                '"Baloo 2", cursive',
              fontSize: "22px",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#fff",
              textShadow:
                "0 0 12px rgba(255,255,255,0.25)",
            }}
          >
            GỢI Ý
            <br />
            LUYỆN TẬP
          </div>

          <div
            style={{
              fontFamily:
                '"Poppins", sans-serif',
              fontSize: "17px",
              lineHeight: 1.65,
              color: "#e6dced",
            }}
          >
            {feedback?.suggestion ||
              "Chưa có dữ liệu."}
          </div>
        </div>

      </div>

      {/* =========================
          BUTTONS
      ========================= */}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginTop: "36px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/main")}
          style={{
            width: "225px",
            height: "58px",
            border: "none",
            borderRadius: "16px",
            background: "#3b0878",
            color: "#fff",
            fontFamily:
              '"Baloo 2", cursive',
            fontSize: "18px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.28)",
          }}
        >
          VỀ TRANG CHÍNH
        </button>

        <button
          type="button"
          onClick={() => navigate("/history")}
          style={{
            width: "225px",
            height: "58px",
            border: "none",
            borderRadius: "16px",
            background: "#3b0878",
            color: "#fff",
            fontFamily:
              '"Baloo 2", cursive',
            fontSize: "18px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.28)",
          }}
        >
          XEM LỊCH SỬ
        </button>
      </div>

    </div>
  );
}