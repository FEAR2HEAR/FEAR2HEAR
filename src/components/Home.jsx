import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

      {/* ĐƯỜNG SÓNG */}
      <div className="wave-lines"></div>

      {/* NGÔI SAO */}
      <div className="star star-left">✦</div>
      <div className="star star-right">✦</div>

      {/* NỘI DUNG */}
      <div className="landing-content">

        <h1 className="landing-logo">
          FEAR2HEAR
        </h1>

        <p className="landing-slogan">
          Kiên trì tôi luyện hôm nay, tự tin cất lời ngày mai!
        </p>

        <button
          className="landing-btn"
          onClick={() => navigate("/register")}
        >
          BẮT ĐẦU
        </button>

      </div>

    </div>
  );
}