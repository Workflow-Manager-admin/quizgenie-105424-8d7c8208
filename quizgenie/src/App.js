import React, { useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  // State for quiz topic input
  const [topic, setTopic] = useState('');
  // State for quiz questions (array of {question, options, answer, explanation})
  const [quiz, setQuiz] = useState([]);
  // State to indicate loading
  const [loading, setLoading] = useState(false);
  // State for error (API or fetch failures)
  const [error, setError] = useState('');
  // State: index of the current question
  const [currentIdx, setCurrentIdx] = useState(0);
  // State: user selected answers (array, answer index or null)
  const [userAnswers, setUserAnswers] = useState([]);
  // State: whether quiz is completed
  const [completed, setCompleted] = useState(false);

  // Dummy fallback quiz data (4 questions)
  const DUMMY_QUIZ = [
    {
      question: "What is the capital of France?",
      options: ["Paris", "Rome", "Madrid", "Berlin"],
      answer: 0,
      explanation: "Paris is the capital and largest city of France."
    },
    {
      question: "Who wrote 'Hamlet'?",
      options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"],
      answer: 2,
      explanation: "'Hamlet' is one of Shakespeare's most famous plays."
    },
    {
      question: "What is the process by which plants make food using sunlight?",
      options: ["Fermentation", "Photosynthesis", "Respiration", "Digestion"],
      answer: 1,
      explanation: "Photosynthesis is the process by which plants make food using sunlight."
    },
    {
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Oxygen", "Silver", "Iron"],
      answer: 1,
      explanation: "The symbol 'O' represents Oxygen."
    }
  ];

  // Helper: minimal LLM API interaction (replace with actual endpoint if available)
  async function fetchQuizLLM(topic) {
    // This is a placeholder; adapt if/when a real API endpoint is available.
    // Expected result: [{question, options, answer, explanation}, ...]
    // Here, we simulate a failure (no backend), to require dummy fallback.
    // To simulate success, set shouldFail = false
    const shouldFail = true;
    if (shouldFail) throw new Error('Simulated API unavailable');
    // Replace below with actual API implementation when API is ready:
    /*
    const response = await fetch('YOUR_LLM_QUIZ_ENDPOINT', {
      method: 'POST',
      body: JSON.stringify({ topic }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.quiz; // shape: [{question, options, answer, explanation}]
    */
    return [];
  }

  // Generate quiz handler (tries LLM, falls back to dummy)
  // PUBLIC_INTERFACE
  async function generateQuiz(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCompleted(false);
    setCurrentIdx(0);
    setUserAnswers([]);
    let questions = [];
    try {
      // Attempt LLM API (might fail)
      questions = await fetchQuizLLM(topic);
      if (!questions.length) throw new Error('LLM API returned empty quiz');
    } catch (err) {
      // Fallback to dummy data
      questions = DUMMY_QUIZ;
      setError('Could not generate a quiz from LLM API. Loaded a fallback quiz.');
    }
    setQuiz(questions);
    setLoading(false);
  }

  // Handler when user selects an answer for current question
  // PUBLIC_INTERFACE
  function handleAnswer(optionIdx) {
    // Already answered? No effect.
    if (userAnswers[currentIdx] != null) return;

    const updated = [...userAnswers];
    updated[currentIdx] = optionIdx;
    setUserAnswers(updated);

    // If last question, mark as complete after a short pause for feedback
    if (currentIdx === quiz.length - 1) {
      setTimeout(() => setCompleted(true), 500);
    }
  }

  // Go to next question
  function handleNext() {
    if (currentIdx < quiz.length - 1) setCurrentIdx(idx => idx + 1);
  }

  // Go to previous question (optional, supports back navigation)
  function handleBack() {
    if (currentIdx > 0) setCurrentIdx(idx => idx - 1);
  }

  // Reset and return to topic selection
  function resetQuiz() {
    setQuiz([]);
    setCurrentIdx(0);
    setUserAnswers([]);
    setCompleted(false);
    setTopic('');
    setError('');
  }

  // Color scheme (from requirements)
  const colors = {
    primary: '#222222',
    secondary: '#ffffff',
    accent: '#4F8EF7'
  };

  // Inline minimal card/question style
  const cardStyle = {
    background: colors.secondary,
    color: colors.primary,
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(34,34,34,0.07)',
    padding: '32px',
    maxWidth: '420px',
    margin: '32px auto 0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  };
  const btnStyle = {
    background: colors.accent,
    color: colors.secondary,
    border: 'none',
    borderRadius: '5px',
    padding: '0.5rem 1.5rem',
    fontWeight: 500,
    marginTop: 8,
    cursor: 'pointer',
    fontSize: '1rem'
  };
  const selectedOpt = optionIdx =>
    userAnswers[currentIdx] === optionIdx;
  const correctOpt = optionIdx =>
    userAnswers[currentIdx] != null &&
    optionIdx === quiz[currentIdx].answer;
  const wrongOpt = optionIdx =>
    userAnswers[currentIdx] === optionIdx &&
    userAnswers[currentIdx] !== quiz[currentIdx].answer;
  const optionButtonStyle = (optionIdx) => {
    // Style for selected/correct/wrong answers after selection
    if (userAnswers[currentIdx] == null) return {
      ...btnStyle,
      border: `1px solid ${colors.accent}`,
      background: colors.secondary,
      color: colors.primary,
    };
    if (correctOpt(optionIdx)) return {
      ...btnStyle,
      background: '#A7ED94', // green for correct
      color: colors.primary
    };
    if (wrongOpt(optionIdx)) return {
      ...btnStyle,
      background: '#F89D91', // red for incorrect
      color: colors.primary
    };
    // for other unselected options after answer
    return {
      ...btnStyle,
      background: '#e4e8ef',
      color: colors.primary,
      border: '1px solid #c3cbde'
    };
  };

  return (
    <div className="app" style={{background: colors.secondary, minHeight: '100vh'}}>
      <nav className="navbar" style={{background: colors.primary, color: colors.secondary}}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol" style={{color: colors.accent, fontWeight: 600, fontSize: 22}}>★</span>
              <span style={{fontWeight: 700, marginLeft: 5}}>QuizGenie</span>
            </div>
            <div style={{alignSelf:'center', color: colors.secondary, opacity: 0.85, fontSize: '0.95rem'}}>by Kavia AI</div>
          </div>
        </div>
      </nav>
      <main style={{marginTop: 74, marginBottom: 40, minHeight: 400}}>
        <div className="container">
          {/* Topic Input & Quiz Generator */}
          {quiz.length === 0 ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight: '65vh'}}>
              <h2 style={{color: colors.primary, fontSize: '2.2rem', textAlign: 'center', letterSpacing: '-1px', marginBottom: 4, fontWeight: 650}}>
                Generate a Quiz with <span style={{color: colors.accent}}>Genie</span>
              </h2>
              <p style={{fontWeight: 400, color: '#6E7A90', marginBottom: 36, fontSize: '1.07rem', textAlign:'center'}}>Enter a topic and QuizGenie will create a multiple-choice quiz for you!</p>
              <form style={{display:'flex', gap:10, alignItems:'center'}} onSubmit={generateQuiz}>
                <input
                  style={{
                    padding: '11px 14px',
                    borderRadius: '5px',
                    border: `1.5px solid ${colors.primary}`,
                    fontSize: '1.05rem',
                    minWidth: 220,
                    outline: 'none',
                    background: colors.secondary,
                    color: colors.primary
                  }}
                  type="text"
                  value={topic}
                  placeholder="e.g. Quantum Physics"
                  onChange={e => setTopic(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  className="btn"
                  style={{
                    ...btnStyle,
                    background: colors.accent,
                    color: colors.secondary,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    fontSize: '1.03rem',
                    borderRadius: '5px'
                  }}
                  type="submit"
                  disabled={loading || !topic}
                >
                  {loading ? 'Generating...' : 'Generate Quiz'}
                </button>
              </form>
              {error && <div style={{color: '#f67219', marginTop: 14}}>{error}</div>}
            </div>
          ) : (
            <div>
              {/* Quiz In Progress */}
              <div style={cardStyle}>
                <div style={{display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8}}>
                  <span style={{fontWeight: 500, fontSize: 18, letterSpacing: 0.2, color: colors.accent}}>
                    Question {currentIdx + 1} of {quiz.length}
                  </span>
                  <button
                    onClick={resetQuiz}
                    style={{
                      ...btnStyle,
                      background: colors.primary,
                      color: colors.secondary,
                      padding: '7px 15px',
                      fontSize: '0.97rem'
                    }}
                  >Restart</button>
                </div>
                <div style={{fontSize: '1.15rem', fontWeight: 600, marginBottom:10, color: colors.primary, textAlign:'left'}}>
                  {quiz[currentIdx].question}
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:15}}>
                  {quiz[currentIdx].options.map((opt, idx) => (
                    <button
                      key={idx}
                      style={optionButtonStyle(idx)}
                      onClick={() => handleAnswer(idx)}
                      disabled={userAnswers[currentIdx] != null}
                    >
                      {opt}
                      {userAnswers[currentIdx] != null && correctOpt(idx) && <span style={{marginLeft:6}}>✔️</span>}
                      {userAnswers[currentIdx] != null && wrongOpt(idx) && <span style={{marginLeft:6}}>✗</span>}
                    </button>
                  ))}
                </div>
                {/* Answer/explanation reveal for this question */}
                {userAnswers[currentIdx] != null && (
                  <div style={{
                    borderTop: `1.5px solid #eaeaea`,
                    paddingTop: 14,
                    marginTop: 8,
                    color: correctOpt(userAnswers[currentIdx]) ? '#2B914A' : '#B20D2A',
                    fontWeight: 500,
                    minHeight: 44,
                  }}>
                    {correctOpt(userAnswers[currentIdx])
                      ? 'Correct!'
                      : `Incorrect. The correct answer is: ${quiz[currentIdx].options[quiz[currentIdx].answer]}`}
                    <div style={{color:colors.primary, marginTop:5, fontWeight:400, fontSize: '1.04rem'}}>
                      <strong>Explanation:</strong> {quiz[currentIdx].explanation}
                    </div>
                  </div>
                )}
                {/* Navigation */}
                <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
                  <button
                    style={{...btnStyle, opacity: currentIdx === 0 ? 0.6 : 1, background: '#e4e8ef', color: colors.primary}}
                    disabled={currentIdx === 0}
                    onClick={handleBack}
                  >
                    Previous
                  </button>
                  {currentIdx < quiz.length - 1 ? (
                    <button
                      style={{...btnStyle, background: colors.accent, color: colors.secondary}}
                      disabled={userAnswers[currentIdx] == null}
                      onClick={handleNext}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      style={{...btnStyle, background: colors.primary, color: colors.secondary}}
                      disabled={!userAnswers.every(ans => ans != null)}
                      onClick={() => setCompleted(true)}
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
              {/* Completed screen */}
              {completed && (
                <div style={{
                  ...cardStyle,
                  marginTop:20,
                  textAlign:'center',
                  background:'#F4F8FA',
                  color: colors.primary
                }}>
                  <h2 style={{marginBottom: 8, color: colors.primary}}>Quiz Complete!</h2>
                  <div style={{fontWeight:500, fontSize:'1.12rem', marginBottom:10}}>
                    You scored {userAnswers.reduce((sc, ans, idx) =>
                      ans === quiz[idx].answer ? sc+1 : sc, 0)} / {quiz.length}
                  </div>
                  <button style={{...btnStyle, marginTop:12}} onClick={resetQuiz}>Try Another Quiz</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;