import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [submitted, setSubmitted] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // =========================
  // ĐĂNG NHẬP EMAIL + PASSWORD
  // =========================

  const handleLogin = async () => {
    setSubmitted(true);
    setLoginError("");

    if (!email.trim() || !password) {
      return;
    }

    try {
      setLoading(true);

      // =========================
      // FIREBASE PERSISTENCE
      // =========================

      await setPersistence(
        auth,
        rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      // =========================
      // FIREBASE LOGIN
      // =========================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      console.log(
        "Đăng nhập Firebase thành công:",
        userCredential.user
      );

      console.log(
        "Firebase UID:",
        userCredential.user.uid
      );

      console.log(
        "Firebase email:",
        userCredential.user.email
      );

      // =========================
      // CHUYỂN SANG INFO
      // =========================

      navigate("/info");

    } catch (error) {
      console.error(
        "Lỗi đăng nhập Firebase:",
        error
      );

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setLoginError(
          "Tài khoản hoặc mật khẩu không đúng."
        );
      }

      else if (
        error.code === "auth/invalid-email"
      ) {
        setLoginError(
          "Địa chỉ email không hợp lệ."
        );
      }

      else if (
        error.code === "auth/too-many-requests"
      ) {
        setLoginError(
          "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc rồi thử lại."
        );
      }

      else {
        setLoginError(
          `Đăng nhập thất bại: ${
            error.code || "Lỗi không xác định"
          }`
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // QUÊN MẬT KHẨU
  // =========================

  const handleForgotPassword = async () => {
    setLoginError("");

    if (!email.trim()) {
      setLoginError(
        "Vui lòng nhập địa chỉ email trước."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      setLoginError(
        "Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư của bạn."
      );

    } catch (error) {
      console.error(
        "Lỗi đặt lại mật khẩu:",
        error
      );

      if (
        error.code === "auth/invalid-email"
      ) {
        setLoginError(
          "Địa chỉ email không hợp lệ."
        );
      }

      else if (
        error.code === "auth/user-not-found"
      ) {
        setLoginError(
          "Không tìm thấy tài khoản với email này."
        );
      }

      else if (
        error.code === "auth/too-many-requests"
      ) {
        setLoginError(
          "Bạn đã yêu cầu quá nhiều lần. Vui lòng chờ một lúc rồi thử lại."
        );
      }

      else {
        setLoginError(
          `Không thể gửi email: ${
            error.code || "Lỗi không xác định"
          }`
        );
      }
    }
  };

  // =========================
  // GOOGLE LOGIN
  // =========================

  const handleGoogleLogin = async () => {
    setLoginError("");

    try {
      setGoogleLoading(true);

      // =========================
      // FIREBASE PERSISTENCE
      // =========================

      await setPersistence(
        auth,
        rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      // =========================
      // GOOGLE PROVIDER
      // =========================

      const provider =
        new GoogleAuthProvider();

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      console.log(
        "Google login Firebase thành công:",
        result.user
      );

      console.log(
        "Firebase UID:",
        result.user.uid
      );

      console.log(
        "Firebase email:",
        result.user.email
      );

      // =========================
      // CHUYỂN SANG INFO
      // =========================

      navigate("/info");

    } catch (error) {
      console.error(
        "Google login lỗi:",
        error
      );

      if (
        error.code ===
        "auth/popup-closed-by-user"
      ) {
        return;
      }

      if (
        error.code ===
        "auth/popup-blocked"
      ) {
        setLoginError(
          "Trình duyệt đã chặn cửa sổ đăng nhập Google."
        );
        return;
      }

      setLoginError(
        `Google đăng nhập thất bại: ${
          error.code ||
          "Lỗi không xác định"
        }`
      );

    } finally {
      setGoogleLoading(false);
    }
  };

  // =========================
  // GIAO DIỆN
  // =========================

  return (
    <div className="login-page">

      {/* LOGO */}

      <div className="login-logo">
        FEAR2HEAR
      </div>


      {/* WAVE */}

      <div className="login-wave-lines"></div>


      {/* LOGIN BOX */}

      <div className="login-box">

        {/* AVATAR */}

        <div className="login-avatar">
          <div className="login-avatar-head"></div>
          <div className="login-avatar-body"></div>
        </div>


        {/* EMAIL */}

        <input
          type="email"
          className={`login-input ${
            submitted && !email.trim()
              ? "login-input-error"
              : ""
          }`}
          placeholder="ĐỊA CHỈ EMAIL"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setLoginError("");
          }}
        />


        {/* PASSWORD */}

        <div className="login-password-wrapper">

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            className={`login-input login-password-input ${
              submitted && !password
                ? "login-input-error"
                : ""
            }`}
            placeholder="MẬT KHẨU"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLoginError("");
            }}
          />

          <button
            type="button"
            className="login-eye-button"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
          >
            {showPassword ? "◉" : "◯"}
          </button>

        </div>


        {/* ERROR */}

        {loginError && (
          <div className="login-error-message">
            {loginError}
          </div>
        )}


        {/* OPTIONS */}

        <div className="login-options">

          <label className="remember-label">

            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) =>
                setRememberMe(
                  e.target.checked
                )
              }
            />

            <span className="custom-check"></span>

            Ghi Nhớ Tôi

          </label>


          <button
            type="button"
            className="forgot-button"
            onClick={
              handleForgotPassword
            }
          >
            Quên Mật Khẩu?
          </button>

        </div>


        {/* LOGIN */}

        <button
          type="button"
          className="login-submit-button"
          onClick={handleLogin}
          disabled={
            loading ||
            googleLoading
          }
        >
          {loading
            ? "ĐANG ĐĂNG NHẬP..."
            : "ĐĂNG NHẬP"}
        </button>


        {/* REGISTER */}

        <button
          type="button"
          className="go-register-button"
          onClick={() =>
            navigate("/register")
          }
        >
          Chưa có Tài khoản?
        </button>


        {/* OR */}

        <div className="login-or">
          – Hoặc đăng nhập với? –
        </div>


        {/* GOOGLE */}

        <button
          type="button"
          className="google-button"
          onClick={
            handleGoogleLogin
          }
          disabled={
            loading ||
            googleLoading
          }
        >
          <span className="google-g">
            {googleLoading
              ? "..."
              : "G"}
          </span>
        </button>

      </div>

    </div>
  );
}