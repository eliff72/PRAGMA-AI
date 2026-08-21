import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("ana sayfada proje basligini gosterir", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(screen.getByText("PRAGMA-AI")).toBeInTheDocument();
  });
});
