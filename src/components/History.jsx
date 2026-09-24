import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function History() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        navigate("/login");
        return;
      }

      const userId = currentUser.uid;

      const saved = JSON.parse(
        localStorage.getItem("practiceHistory") || "[]"
      );

      if (Array.isArray(saved)) {
        const userHistory = saved.filter(
          (item) => item.userId === userId
        );

        setHistory(userHistory);
      }
    } catch (error) {
      console.error(
        "Không thể lấy lịch sử luyện tập:",
        error
      );
    }
  }, [navigate]);

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

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "32px 7% 60px",
        background:
          "radial-gradient(circle at 50% 0%, #2a0b45 0%, #10051d 48%, #08030e 100%)",
        color: "#fff",
        fontFamily: '"Poppins", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* =========================
          SAO TRANG TRÍ
      ========================= */}

      <div
        style={{
          position: "absolute",
          top: "95px",
          left: "7%",
          fontSize: "20px",
          color: "#fff",
          opacity: 0.8,
          textShadow:
            "0 0 12px rgba(255,255,255,0.8)",
          pointerEvents: "none",
        }}
      >
        ✦
      </div>

      <div
        style={{
          position: "absolute",
          top: "170px",
          right: "8%",
          fontSize: "14px",
          color: "#fff",
          opacity: 0.65,
          textShadow:
            "0 0 10px rgba(255,255,255,0.7)",
          pointerEvents: "none",
        }}
      >
        ✦
      </div>

      <div
        style={{
          position: "absolute",
          top: "390px",
          left: "3%",
          fontSize: "12px",
          color: "#b987ff",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      >
        ✦
      </div>

      <div
        style={{
          position: "absolute",
          top: "520px",
          right: "4%",
          fontSize: "18px",
          color: "#fff",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      >
        ✦
      </div>

      {/* =========================
          LOGO
      ========================= */}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          fontFamily: '"Poppins", sans-serif',
          fontSize: "28px",
          fontWeight: 900,
          letterSpacing: "1.5px",
          color: "#fff",
          textShadow:
            "0 0 18px rgba(174,108,255,0.45)",
          marginBottom: "45px",
        }}
      >
        FEAR2HEAR
      </div>

      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          marginBottom: "48px",
        }}
      >
        <div
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "4px",
            opacity: 0.65,
            marginBottom: "10px",
          }}
        >
          YOUR PRACTICE
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily:
              '"Paytone One", sans-serif',
            fontSize: "48px",
            fontWeight: 400,
            letterSpacing: "1px",
            color: "#fff",
            textShadow:
              "0 0 20px rgba(169,91,255,0.35)",
          }}
        >
          LỊCH SỬ LUYỆN TẬP
        </h1>

        <div
          style={{
            width: "80px",
            height: "3px",
            margin: "18px auto",
            borderRadius: "10px",
            background:
              "linear-gradient(90deg, transparent, #fff, transparent)",
            boxShadow:
              "0 0 12px rgba(255,255,255,0.45)",
          }}
        />

        <p
          style={{
            margin: 0,
            fontFamily:
              '"Poppins", sans-serif',
            fontSize: "15px",
            color: "#d8cde0",
          }}
        >
          Xem lại những lần bạn đã luyện tập cùng SAM.
        </p>
      </div>

      {/* =========================
          CHƯA CÓ LỊCH SỬ
      ========================= */}

      {history.length === 0 ? (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "650px",
            margin: "75px auto",
            padding: "55px 35px",
            textAlign: "center",
            borderRadius: "28px",
            background:
              "linear-gradient(145deg, rgba(67,16,113,0.92), rgba(38,7,72,0.95))",
            border:
              "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 20px 55px rgba(0,0,0,0.35), 0 0 35px rgba(92,25,150,0.18)",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              marginBottom: "20px",
              color: "#fff",
              textShadow:
                "0 0 18px rgba(255,255,255,0.7)",
            }}
          >
            ✦
          </div>

          <div
            style={{
              fontFamily:
                '"Paytone One", sans-serif',
              fontSize: "26px",
              fontWeight: 400,
              marginBottom: "12px",
            }}
          >
            CHƯA CÓ LỊCH SỬ
          </div>

          <div
            style={{
              fontFamily:
                '"Poppins", sans-serif',
              color: "#d8cde0",
              fontSize: "15px",
              lineHeight: 1.7,
            }}
          >
            Hãy hoàn thành một buổi luyện tập
            để lịch sử của bạn xuất hiện ở đây.
          </div>

          {/* =========================
              NÚT BẮT ĐẦU LUYỆN TẬP
          ========================= */}

          <button
            type="button"
            onClick={() => navigate("/topic")}
            style={{
              marginTop: "30px",
              width: "210px",
              height: "55px",
              border: "none",
              borderRadius: "16px",

              background: "#fff",
              color: "#321348",

              fontFamily:
                '"Baloo 2", cursive',
              fontSize: "17px",
              fontWeight: 700,
              fontStyle: "normal",
              lineHeight: "1",
              letterSpacing: "0px",
              textTransform: "none",

              cursor: "pointer",

              boxShadow:
                "0 8px 25px rgba(0,0,0,0.25)",

              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}
          >
            BẮT ĐẦU LUYỆN TẬP
          </button>
        </div>
      ) : (

        /* =========================
           HISTORY LIST
        ========================= */

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "950px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {history.map((item, index) => (
            <button
              type="button"
              key={item.id || index}
              onClick={() =>
                navigate(
                  `/history/${encodeURIComponent(item.id)}`
                )
              }
              style={{
                width: "100%",
                padding: "24px 28px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "22px",
                background:
                  "linear-gradient(135deg, rgba(61,13,101,0.95), rgba(40,8,75,0.95))",
                color: "#fff",
                fontFamily:
                  '"Poppins", sans-serif',
                textAlign: "left",
                cursor: "pointer",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.25)",
                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily:
                        '"Poppins", sans-serif',
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "2.5px",
                      color: "#cbb5d8",
                      marginBottom: "8px",
                    }}
                  >
                    LẦN LUYỆN TẬP #{history.length - index}
                  </div>

                  <div
                    style={{
                      fontFamily:
                        '"Paytone One", sans-serif',
                      fontSize: "23px",
                      fontWeight: 400,
                      letterSpacing: "0.3px",
                      marginBottom: "8px",
                    }}
                  >
                    {item.topic || "Chưa có chủ đề"}
                  </div>

                  <div
                    style={{
                      fontFamily:
                        '"Poppins", sans-serif',
                      fontSize: "13px",
                      color: "#d8cde0",
                    }}
                  >
                    {formatDate(item.date)}
                  </div>
                </div>

                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background:
                      "rgba(255,255,255,0.08)",
                    border:
                      "1px solid rgba(255,255,255,0.08)",
                    fontSize: "22px",
                    color: "#fff",
                  }}
                >
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* =========================
          BACK
      ========================= */}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          marginTop: "42px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/main")}
          style={{
            border: "none",
            background: "transparent",
            color: "#d8cde0",
            fontFamily:
              '"Poppins", sans-serif',
            fontSize: "14px",
            fontWeight: 700,
            fontStyle: "normal",
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          ← VỀ TRANG CHÍNH
        </button>
      </div>

    </div>
  );
}