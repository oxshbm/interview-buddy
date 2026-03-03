import { Navigate, Route, Routes } from "react-router-dom";
import IndexPage from "./pages/Index";
import SetupPage from "./pages/Setup";
import InterviewPage from "./pages/Interview";
import ResultsPage from "./pages/Results";
import NotFoundPage from "./pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/60 to-slate-100">
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </div>
  );
}
