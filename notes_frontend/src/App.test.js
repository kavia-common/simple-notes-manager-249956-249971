import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app chrome", () => {
  render(<App />);
  expect(screen.getByText(/Simple Notes/i)).toBeInTheDocument();
  expect(screen.getByText(/Editor/i)).toBeInTheDocument();
});
