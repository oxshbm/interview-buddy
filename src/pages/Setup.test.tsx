import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SetupPage from "./Setup";

describe("SetupPage", () => {
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
