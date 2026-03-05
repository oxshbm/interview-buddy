import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SetupPage from "./Setup";

describe("SetupPage", () => {
  it("renders meet-style setup shell with preview and controls", () => {
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Interview Setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Configure your session before entering the live interview/i)).toBeInTheDocument();
    expect(screen.getByText(/Camera Preview/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enable Camera & Mic/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset Device/i })).toBeInTheDocument();
  });

  it("keeps start disabled until setup conditions are met", async () => {
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>
    );

    const startButton = screen.getByRole("button", { name: /Start Interview/i });
    expect(startButton).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /Technical Interview/i }));
    expect(startButton).toBeDisabled();
  });
});
