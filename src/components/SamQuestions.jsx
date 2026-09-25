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

    const endpoint =
      `${API_URL}/api/generate-questions`;

    console.log(
      "🚀 ĐANG GỌI SERVER..."
    );

    console.log(
      "🌐 AI SERVER:",
      API_URL
    );

    console.log(
      "🚀 POST:",
      endpoint
    );

    console.log(
      "📌 Topic:",
      topic
    );

    console.log(
      "📌 Transcript length:",
      transcript.length
    );

    if (!topic) {
      setError(
        "Chưa có chủ đề bài thuyết trình."
      );
      return;
    }

    if (!transcript) {
      setError(
        "Chưa có nội dung bài thuyết trình. Hãy kiểm tra lại phần ghi âm."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        endpoint,
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
        "📡 HTTP STATUS:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "📥 SERVER RESPONSE:",
        responseText
      );

      let data;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Server trả về dữ liệu không hợp lệ. HTTP ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Server trả về lỗi HTTP ${response.status}`
        );
      }

      if (
        !Array.isArray(
          data?.questions
        )
      ) {
        throw new Error(
          "Server không trả về danh sách câu hỏi."
        );
      }

      if (
        data.questions.length !== 4
      ) {
        throw new Error(
          `AI trả về ${data.questions.length} câu hỏi thay vì 4 câu.`
        );
      }

      const questions =
        data.questions
          .slice(0, 4)
          .map((question) =>
            String(question).trim()
          )
          .filter(Boolean);

      if (
        questions.length !== 4
      ) {
        throw new Error(
          "Danh sách câu hỏi AI trả về không hợp lệ."
        );
      }

      console.log(
        "✅ AI QUESTIONS:",
        questions
      );

      const attemptId =
        `attempt_${Date.now()}`;

      localStorage.setItem(
        "practiceAttemptId",
        attemptId
      );

      localStorage.setItem(
        "samQuestions",
        JSON.stringify(questions)
      );

      localStorage.setItem(
        "samAnswers",
        JSON.stringify(
          questions.map(() => null)
        )
      );

      console.log(
        "💾 practiceAttemptId:",
        attemptId
      );

      console.log(
        "💾 samQuestions:",
        questions
      );

      console.log(
        "➡️ Navigate /sam-debate"
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

      if (
        err instanceof TypeError &&
        err.message === "Failed to fetch"
      ) {
        setError(
          "Không kết nối được với AI server Render. Vui lòng thử lại."
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

      <div className="sam-questions-card">

        <h1>SAM</h1>

        <p>
          AI đã sẵn sàng đặt câu hỏi cho
          bài thuyết trình của bạn.
        </p>

        {error && (
          <div className="sam-error">
            {error}
          </div>
        )}

        <button
          className="sam-ready-btn"
          onClick={handleReady}
          disabled={loading}
        >
          {loading
            ? "AI đang suy nghĩ..."
            : "Sẵn sàng"}
        </button>

      </div>

    </div>
  );
}