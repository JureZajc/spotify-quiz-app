// /app/quiz/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Type Definitions ---
interface QuizOption {
  id: string;
  name: string;
  artist: string;
}

interface QuizQuestion {
  preview_url: string;
  correct_answer_id: string;
  options: QuizOption[];
}

type GameState = "loading" | "playing" | "finished";

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // useRef for the audio element to control it directly
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchQuizData = async () => {
      setGameState("loading");
      try {
        const res = await fetch("/api/quiz", { credentials: "include" });
        if (!res.ok) {
          throw new Error(
            "Failed to load quiz. Do you have enough listening history?"
          );
        }
        const data: QuizQuestion[] = await res.json();
        setQuestions(data);
        setGameState("playing");
      } catch (error) {
        console.error(error);
        alert(
          error instanceof Error ? error.message : "An unknown error occurred."
        );
        router.push("/dashboard");
      }
    };
    fetchQuizData();
  }, [router]);

  // --- Audio Control Effect ---
  useEffect(() => {
    if (gameState === "playing" && audioRef.current) {
      audioRef.current
        .play()
        .catch((error) => console.error("Audio play failed:", error));
    }
  }, [currentQuestionIndex, gameState]);

  // --- Event Handlers ---
  const handleAnswerClick = (answerId: string) => {
    if (isAnswered) return; // Prevent changing answer

    setSelectedAnswer(answerId);
    setIsAnswered(true);

    if (answerId === questions[currentQuestionIndex].correct_answer_id) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameState("finished");
    }
  };

  const handlePlayAgain = () => {
    // Reset all states to start a new quiz
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameState("loading");
    setIsAnswered(false);
    setSelectedAnswer(null);
    // Re-trigger the fetch
    const fetchQuizData = async () => {
      try {
        const res = await fetch("/api/quiz", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load quiz.");
        const data = await res.json();
        setQuestions(data);
        setGameState("playing");
      } catch (error) {
        router.push("/dashboard");
      }
    };
    fetchQuizData();
  };

  // --- Rendering Logic ---
  if (gameState === "loading") {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading Your Quiz...</p>
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div style={styles.container}>
        <div style={styles.resultsCard}>
          <h1>Quiz Finished!</h1>
          <p style={styles.scoreText}>
            Your Final Score: {score} / {questions.length}
          </p>
          <button onClick={handlePlayAgain} style={styles.actionButton}>
            Play Again
          </button>
          <Link href="/dashboard" style={styles.linkButton}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Preparing questions...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.quizCard}>
        <h2>
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <p>Guess the song!</p>

        {/* Hidden audio player */}
        <audio ref={audioRef} src={currentQuestion.preview_url} loop />

        <div style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => {
            const isCorrect = option.id === currentQuestion.correct_answer_id;
            let backgroundColor = "#f0f0f0"; // Default
            if (isAnswered) {
              if (isCorrect) backgroundColor = "#28a745"; // Green for correct
              else if (selectedAnswer === option.id)
                backgroundColor = "#dc3545"; // Red for wrong selected
            }

            return (
              <button
                key={option.id}
                onClick={() => handleAnswerClick(option.id)}
                disabled={isAnswered}
                style={{
                  ...styles.optionButton,
                  backgroundColor,
                  color: isAnswered ? "white" : "black",
                }}
              >
                <strong>{option.name}</strong>
                <br />
                <small>{option.artist}</small>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <button onClick={handleNextQuestion} style={styles.actionButton}>
            {currentQuestionIndex < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Basic Styling ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#191414",
    fontFamily: "sans-serif",
    color: "white",
  },
  loadingText: { fontSize: "2em" },
  quizCard: {
    background: "#282828",
    padding: "2em",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "500px",
    textAlign: "center",
  },
  resultsCard: {
    background: "#282828",
    padding: "2em",
    borderRadius: "10px",
    textAlign: "center",
  },
  scoreText: { fontSize: "1.5em", margin: "20px 0" },
  optionsContainer: {
    margin: "20px 0",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  optionButton: {
    padding: "15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    textAlign: "left",
    transition: "background-color 0.3s",
  },
  actionButton: {
    padding: "15px 30px",
    marginTop: "20px",
    border: "none",
    borderRadius: "50px",
    background: "#1DB954",
    color: "white",
    fontSize: "1em",
    cursor: "pointer",
    fontWeight: "bold",
  },
  linkButton: {
    display: "inline-block",
    padding: "15px 30px",
    marginTop: "10px",
    textDecoration: "none",
    borderRadius: "50px",
    background: "#555",
    color: "white",
    fontSize: "1em",
    cursor: "pointer",
  },
};
