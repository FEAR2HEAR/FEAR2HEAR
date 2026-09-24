import { useNavigate } from "react-router-dom";
import "../App.css";

function info() {
  const navigate = useNavigate();

  return (
    <div className="info-page">

      {/* LOGO */}
      <div className="info-logo">
        FEAR2HEAR
      </div>


      {/* TWO CARDS */}
      <div className="info-content">

        {/* ================= THÔNG TIN ================= */}
        <div className="info-column">

          <h2 className="info-heading">
            Thông tin
          </h2>

          <div className="info-section">

            <p>
              <strong>FEAR2HEAR</strong> là nền tảng kết hợp AI (Trí tuệ nhân tạo)
              hỗ trợ luyện tập thuyết trình, được phát triển nhằm giúp người
              dùng chủ động chuẩn bị trước các bài thuyết trình thực tế.
            </p>

            <p>
              Người dùng có thể nhập chủ đề hoặc nội dung của bài thuyết
              trình sắp thực hiện, sau đó luyện tập trong môi trường mô
              phỏng với nhân vật <strong>SAM</strong>. Hệ thống sẽ tương
              tác, đặt câu hỏi và đưa ra phản hồi về phần trình bày,
              giúp người dùng rèn luyện kỹ năng diễn đạt và từng
              bước nâng cao sự tự tin khi nói trước đám đông.
            </p>

          </div>

        </div>


        {/* ================= CHÍNH SÁCH ================= */}
        <div className="info-column">

          <h2 className="info-heading">
            Chính sách
          </h2>

          <div className="info-section">

            <p>
              <strong>FEAR2HEAR</strong> tôn trọng quyền riêng tư của bạn.
            </p>

            <p>
              🎥 <strong>Camera & microphone:</strong> Chỉ được sử dụng
              khi bạn cho phép để hỗ trợ quá trình luyện tập.
            </p>

            <p>
              🔒 <strong>Dữ liệu:</strong> Thông tin và nội dung bài
              thuyết trình chỉ được sử dụng để phục vụ luyện tập.
            </p>

            <p>
              🛡️ <strong>Bảo mật:</strong> Dữ liệu của bạn được bảo vệ
              và không sử dụng cho mục đích khác.
            </p>

            <p className="info-note">
              Bạn luôn có quyền kiểm soát quyền truy cập
              và dữ liệu của mình.
            </p>

          </div>

        </div>

      </div>


      {/* BUTTON */}
      <button
        className="info-continue-btn"
        onClick={() => navigate("/main")}
      >
        TIẾP TỤC
      </button>

    </div>
  );
}

export default info;