import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResultsPage from "./Results";

describe("ResultsPage", () => {
  it("shows fallback when no state is present", () => {
    sessionStorage.clear();
    render(
      <MemoryRouter initialEntries={["/results"]}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/No interview data found/i)).toBeInTheDocument();
  });

  it("renders report for valid route state", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/results",
            state: {
              interviewType: "technical",
              totalQuestions: 5,
              answeredQuestions: 4,
              responsesMeta: [
                { questionId: "t1", durationSec: 100, startedAt: "x", endedAt: "y", pauseCount: 0 },
                { questionId: "t2", durationSec: 80, startedAt: "x", endedAt: "y", pauseCount: 1 }
              ]
            }
          }
        ]}
      >
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Overall Score:/i)).toBeInTheDocument();
    expect(screen.getByText(/Question Breakdown/i)).toBeInTheDocument();
  });
});
