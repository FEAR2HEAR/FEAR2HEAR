import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function SamQuestions() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "https://fear2hear.onrender.com";

  const getPresentationData = () => {
    const topic =
      localStorage.getItem("presentationTopic") || "";

    const transcript =
      localStorage.getItem("presentationTranscript") || "";

    return {
      topic: topic.trim(),
      transcript: transcript.trim(),
    };
  };

  const handleReady = async () => {
    console.log("========== SAM START ==========");

    setError("");

    const { topic, transcript } =
      getPresentationData();

    console.log("📌 Topic:", topic);
    console.log("📌 Transcript:", transcript);
    console.log(
      "📌 Transcript length:",
      transcript.length
    );

    if (!topic) {
      console.error(
        "❌ Không có presentationTopic"
      );

      setError(
        "Chưa có chủ đề bài thuyết trình."
      );

      return;
    }

    if (!transcript) {
      console.error(
        "❌ Không có presentationTranscript"
      );

      setError(
        "Chưa có nội dung bài thuyết trình. Hãy kiểm tra lại phần ghi âm."
      );

      return;
    }

    setLoading(true);

    try {
      console.log(
        "🚀 ĐANG GỌI SERVER..."
      );

     const response = await fetch(
  `${API_URL}/api/generate-questions`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      transcript,
    }),
  }
);
      console.log(
        "📡 Server status:",
        response.status
      );

      console.log(
        "📡 Server OK:",
        response.ok
      );

      const data = await response.json();

      console.log(
        "📥 SERVER TRẢ VỀ:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Server trả về lỗi ${response.status}`
        );
      }

      if (!Array.isArray(data.questions)) {
        throw new Error(
          "Server không trả về danh sách câu hỏi."
        );
      }

      if (data.questions.length !== 4) {
        throw new Error(
          `AI chỉ trả về ${data.questions.length} câu hỏi thay vì 4 câu.`
        );
      }

      console.log(
        "✅ AI tạo đủ 4 câu hỏi:"
      );

      data.questions.forEach(
        (question, index) => {
          console.log(
            `Câu ${index + 1}:`,
            question
          );
        }
      );

      /* ==========================================
         TẠO ID CHO LƯỢT LUYỆN TẬP
      ========================================== */

      const attemptId =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      localStorage.setItem(
        "practiceAttemptId",
        attemptId
      );

      /* ==========================================
         LƯU CÂU HỎI
      ========================================== */

      localStorage.setItem(
        "samQuestions",
        JSON.stringify(
          data.questions.slice(0, 4)
        )
      );

      /* ==========================================
         XÓA ANSWERS CŨ
      ========================================== */

      localStorage.setItem(
        "samAnswers",
        JSON.stringify(
          data.questions
            .slice(0, 4)
            .map(() => null)
        )
      );

      console.log(
        "💾 Đã lưu samQuestions."
      );

      console.log(
        "💾 Đã tạo practiceAttemptId:",
        attemptId
      );

      console.log(
        "➡️ Chuyển sang /sam-debate"
      );

      navigate("/sam-debate");

    } catch (err) {
      console.error(
        "❌ GENERATE QUESTIONS ERROR:"
      );

      console.error(
        "Message:",
        err?.message
      );

      console.error(
        "Full error:",
        err
      );

      if (err instanceof TypeError) {
        setError(
          "Không kết nối được với AI server. Hãy kiểm tra lại kết nối mạng hoặc server Render."
        );
      } else {
        setError(
          err?.message ||
            "Không thể tạo câu hỏi AI lúc này."
        );
      }

    } finally {
      setLoading(false);

      console.log(
        "========== SAM END =========="
      );
    }
  };

  return (
    <div className="sam-questions-page">

      <div className="sam-questions-logo">
        FEAR2HEAR
      </div>

      <div className="sam-questions-content">

        <div className="sam-questions-message">

          <div className="sam-questions-title">
            <span className="sam-questions-alarm">
              ⏰
            </span>

            <span>
              HẾT THỜI GIAN!
            </span>
          </div>

          <div className="sam-questions-subtitle">
            Bạn đã sẵn sàng để trả lời những câu hỏi từ SAM chưa?
          </div>

        </div>

        {error && (
          <div className="sam-questions-error">
            {error}
          </div>
        )}

        <button
          className="sam-questions-ready-btn"
          onClick={handleReady}
          disabled={loading}
        >
          {loading
            ? "SAM ĐANG CHUẨN BỊ..."
            : "SẴN SÀNG"}
        </button>

      </div>

    </div>
  );
}