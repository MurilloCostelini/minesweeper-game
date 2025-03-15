import { useState, useEffect } from "react";
import "./App.css";

const GRID_SIZE = 10;
const MINES_COUNT = 15;

type Cell = {
  isMine: boolean;
  revealed: boolean;
  adjacentMines: number;
  flagged: boolean;
  exploding: boolean;
};

function generateGrid(excludeX?: number, excludeY?: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      isMine: false,
      revealed: false,
      adjacentMines: 0,
      flagged: false,
      exploding: false,
    }))
  );

  let minesPlaced = 0;
  while (minesPlaced < MINES_COUNT) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);

    if (
      !grid[x][y].isMine &&
      (excludeX === undefined || excludeY === undefined || Math.abs(x - excludeX) > 1 || Math.abs(y - excludeY) > 1)
    ) {
      grid[x][y].isMine = true;
      minesPlaced++;
    }
  }

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!grid[x][y].isMine) {
        let adjacentMines = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[nx][ny].isMine) {
              adjacentMines++;
            }
          }
        }
        grid[x][y].adjacentMines = adjacentMines;
      }
    }
  }
  return grid;
}

export default function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>(generateGrid);
  const [gameOver, setGameOver] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [time, setTime] = useState(0);
  const [flagsLeft, setFlagsLeft] = useState(MINES_COUNT);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  function revealCell(x: number, y: number) {
    if (gameOver || grid[x][y].revealed || grid[x][y].flagged) return;
    let newGrid = grid;

    if (firstClick) {
      newGrid = generateGrid(x, y);
      setFirstClick(false);
    }

    if (newGrid[x][y].isMine) {
      triggerExplosion(newGrid, x, y);
      return;
    }

    reveal(newGrid, x, y);
    setGrid([...newGrid]);
  }

  function toggleFlag(x: number, y: number, event: React.MouseEvent) {
    event.preventDefault();
    if (grid[x][y].revealed) return;

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    newGrid[x][y].flagged = !newGrid[x][y].flagged;

    setFlagsLeft((prev) => prev + (newGrid[x][y].flagged ? -1 : 1));
    setGrid(newGrid);
  }

  function triggerExplosion(grid: Cell[][], x: number, y: number) {
    setGameOver(true);
    const explode = (cx: number, cy: number, delay: number) => {
      setTimeout(() => {
        if (!grid[cx][cy].revealed) {
          grid[cx][cy].exploding = true;
          setGrid([...grid]);
        }
      }, delay);
    };
    let delay = 0;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          explode(nx, ny, delay);
          delay += 100;
        }
      }
    }
  }

  function reveal(grid: Cell[][], x: number, y: number) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || grid[x][y].revealed || grid[x][y].flagged) return;
    grid[x][y].revealed = true;
    if (grid[x][y].adjacentMines === 0) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx !== 0 || dy !== 0) {
            reveal(grid, x + dx, y + dy);
          }
        }
      }
    }
  }

  function handleDoubleClick(x: number, y: number) {
    if (grid[x][y].adjacentMines > 0 && grid[x][y].revealed) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !grid[nx][ny].revealed && !grid[nx][ny].flagged) {
            reveal(grid, nx, ny);
          }
        }
      }
      setGrid([...grid]);
    }
  }

  return (
    <div className="minesweeper-container">
      <h1>Campo Minado</h1>
      <div className="game-info">
        <p>⏳ Tempo: {time}s</p>
        <p>🚩 Flags restantes: {flagsLeft}</p>
      </div>
      <button className="reset-button" onClick={() => window.location.reload()}>
        Resetar Jogo
      </button>
      <div className="grid">
        {grid.map((row, x) =>
          row.map((cell, y) => (
            <button
              key={`${x}-${y}`}
              className={`cell ${cell.revealed ? (cell.isMine ? "mine" : "revealed") : ""} ${cell.exploding ? "exploding" : ""}`}
              onClick={() => revealCell(x, y)}
              onContextMenu={(e) => toggleFlag(x, y, e)}
              onDoubleClick={() => handleDoubleClick(x, y)}
            >
              {cell.flagged ? "🚩" : cell.revealed && cell.isMine ? "💥" : cell.revealed ? cell.adjacentMines || "" : ""}
            </button>
          ))
        )}
      </div>
      {gameOver && <p className="game-over-message">BOOM! Você explodiu tudo! Melhor sorte na próxima. 😈</p>}
    </div>
  );
}