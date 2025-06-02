import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// Helper for scoping queries to a group of buttons
const getOptionButtons = () =>
  screen.getByText(/Question \d+ of \d+/)
    .closest("div")
    .querySelectorAll("button:not([style*='background: #e4e8ef'])"); // Avoid navigation buttons

describe("QuizGenie Main App - End-to-End & UI/Logic Tests", () => {
  it("renders topic input and quiz generator button", () => {
    render(<App />);
    expect(
      screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate quiz/i })).toBeInTheDocument();
    expect(screen.getByText(/generate a quiz with genie/i)).toBeInTheDocument();
  });

  it("disables submit with no topic entered", () => {
    render(<App />);
    const button = screen.getByRole("button", { name: /generate quiz/i });
    expect(button).toBeDisabled();
  });

  it("submits topic, falls back to dummy data if API fails, and displays quiz UI", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i);
    const button = screen.getByRole("button", { name: /generate quiz/i });
    // Enter topic
    userEvent.type(input, "General Knowledge");
    expect(button).not.toBeDisabled();

    userEvent.click(button);
    expect(await screen.findByText("Could not generate a quiz from LLM API. Loaded a fallback quiz.", {}, {timeout: 2000})).toBeInTheDocument();

    // The first question should display
    expect(screen.getByText(/Question 1 of 4/)).toBeInTheDocument();
    // There should be 4 option buttons (options change by fallback schematic)
    expect(screen.getByRole("button", { name: /paris/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rome/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /madrid/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /berlin/i })).toBeInTheDocument();
  });

  it("selects an answer and reveals explanation/correctness", async () => {
    render(<App />);
    userEvent.type(screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i), "Fallback");
    userEvent.click(screen.getByRole("button", { name: /generate quiz/i }));

    // Wait for quiz UI and option
    await screen.findByText(/question 1 of 4/i);

    // Click on an incorrect answer ("Rome" - idx 1, but correct is 0)
    const romeBtn = screen.getByRole("button", { name: /rome/i });
    userEvent.click(romeBtn);

    // Explanation, "Incorrect", correct answer show up
    expect(await screen.findByText(/incorrect\. the correct answer is: Paris/i, {}, {timeout: 1000})).toBeInTheDocument();
    expect(screen.getByText(/explanation:/i)).toBeInTheDocument();
    // Ensure buttons are all disabled after answering
    expect(romeBtn).toBeDisabled();
    // A correct selection gets "Correct!" and disables the button
    userEvent.click(screen.getByRole("button", { name: /next/i })); // Go to next question
    expect(screen.getByText(/question 2 of 4/i)).toBeInTheDocument();
    const shakespeareBtn = screen.getByRole("button", { name: /william shakespeare/i });
    userEvent.click(shakespeareBtn);
    expect(await screen.findByText(/correct!/i)).toBeInTheDocument();
  });

  it("Navigates between questions (Previous/Next/Finish) and shows completed UI", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i);
    userEvent.type(input, "Anything");
    userEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
    await screen.findByText(/question 1 of 4/i);

    // Select and navigate all questions
    for (let q = 1; q <= 4; ++q) {
      // Choose first option every time
      const optionBtns = Array.from(screen.getAllByRole("button"))
        .filter(btn => !["Previous", "Next", "Finish", "Restart"].includes(btn.textContent));
      userEvent.click(optionBtns[0]);
      // If not at last, hit next
      if (q < 4) {
        const nextBtn = screen.getByRole("button", { name: /next/i });
        expect(nextBtn).not.toBeDisabled();
        userEvent.click(nextBtn);
        expect(screen.getByText(new RegExp(`question ${q + 1} of 4`, "i"))).toBeInTheDocument();
      } else {
        // Last question, "Finish" should be available
        const finishBtn = screen.getByRole("button", { name: /finish/i });
        expect(finishBtn).not.toBeDisabled();
        userEvent.click(finishBtn);
      }
    }

    // Quiz completed screen appears
    await screen.findByText(/quiz complete!/i);
    expect(screen.getByText(/you scored/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try another quiz/i })).toBeInTheDocument();
  });

  it("lets user reset/restart quiz at any time", async () => {
    render(<App />);
    userEvent.type(screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i), "Something");
    userEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
    const restart = await screen.findByRole("button", { name: /restart/i });
    userEvent.click(restart);
    // Back to topic selection
    expect(screen.getByRole("button", { name: /generate quiz/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i)).toHaveValue("");
  });

  it("does not allow answering the same question twice", async () => {
    render(<App />);
    userEvent.type(screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i), "AA");
    userEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
    await screen.findByText(/question 1 of 4/i);

    const optionBtns = screen.getAllByRole("button").filter(
      btn => btn.textContent === "Paris"
    );
    userEvent.click(optionBtns[0]);
    expect(optionBtns[0]).toBeDisabled();
    // Try to click "Paris" again
    userEvent.click(optionBtns[0]);
    // No errors, no change in selected value (already disabled)
    expect(optionBtns[0]).toBeDisabled();
  });

  it("shows disabled navigation 'Previous' on first question and disallows moving before first", async () => {
    render(<App />);
    userEvent.type(screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i), "Yes");
    userEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
    await screen.findByText(/question 1 of 4/i);

    const prevBtn = screen.getByRole("button", { name: /previous/i });
    expect(prevBtn).toBeDisabled();
  });

  it("has basic minimal layout, with visible logo and byline", () => {
    render(<App />);
    expect(screen.getByText(/quizgenie/i, { selector: ".logo" }) || screen.getByText(/quizgenie/i)).toBeInTheDocument();
    expect(screen.getByText(/by kavia ai/i)).toBeInTheDocument();
  });

  it("matches text content and react structure after fallback error (visual assertion)", async () => {
    render(<App />);
    userEvent.type(screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i), "Zebra history");
    userEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
    await screen.findByText(/loaded a fallback quiz/i);
    // Card structure check: question and options in a flex column
    expect(screen.getByText(/what is the capital of france\?/i)).toBeInTheDocument();
    // All 4 option buttons must be rendered
    ["Paris", "Rome", "Madrid", "Berlin"].forEach(text => {
      expect(screen.getByRole("button", { name: new RegExp(text, "i") })).toBeInTheDocument();
    });
  });

  it("handles edge case: cannot finish until all answers are selected", async () => {
    render(<App />);
    userEvent.type(screen.getByPlaceholderText(/e\.g\.\s*Quantum Physics/i), "WW");
    userEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
    await screen.findByText(/question 1 of 4/i);

    // Answer 3 out of 4 questions
    for (let q = 1; q <= 3; ++q) {
      const btns = Array.from(screen.getAllByRole("button"))
        .filter(btn => !["Previous", "Next", "Finish", "Restart"].includes(btn.textContent));
      userEvent.click(btns[0]);
      const nextBtn = screen.getByRole("button", { name: /next/i });
      userEvent.click(nextBtn);
    }
    // On Q4, do not answer, see "Finish" is disabled
    expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();
    // Now answer and finish enabled
    const btns = Array.from(screen.getAllByRole("button"))
      .filter(btn => !["Previous", "Next", "Finish", "Restart"].includes(btn.textContent));
    userEvent.click(btns[0]);
    expect(screen.getByRole("button", { name: /finish/i })).not.toBeDisabled();
  });
});

