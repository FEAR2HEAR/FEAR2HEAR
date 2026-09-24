import "./App.css";
import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import Register from "./components/register";
import Login from "./components/Login";
import Info from "./components/info";
import MainPage from "./components/MainPage";
import Topic from "./components/Topic";
import Practice from "./components/Practice";
import Presentation from "./components/Presentation";
import SamQuestions from "./components/SamQuestions";
import SamDebate from "./components/SamDebate";
import Feedback from "./components/Feedback";
import History from "./components/History";
import HistoryDetail from "./components/HistoryDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/info"
        element={<Info />}
      />

      <Route
        path="/main"
        element={<MainPage />}
      />

      <Route
        path="/topic"
        element={<Topic />}
      />

      <Route
        path="/practice"
        element={<Practice />}
      />

      <Route
        path="/presentation"
        element={<Presentation />}
      />

      <Route
        path="/sam-questions"
        element={<SamQuestions />}
      />

      <Route
        path="/sam-debate"
        element={<SamDebate />}
      />

      <Route
        path="/feedback"
        element={<Feedback />}
      />

      <Route
        path="/history"
        element={<History />}
      />

      <Route
        path="/history/:id"
        element={<HistoryDetail />}
      />
    </Routes>
  );
}

export default App;