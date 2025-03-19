import React, { useState, useEffect } from "react";
import { Storage } from "@capacitor/storage";
import { Preferences } from "@capacitor/preferences";

const ChromaticShift = () => {
  // Game colors
  const COLORS = ["bg-red-500", "bg-blue-500", "bg-yellow-400"];
  const COLOR_NAMES = ["red", "blue", "yellow"];

  // Game state
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [gridSize, setGridSize] = useState(4);
  const [grid, setGrid] = useState([]);
  const [targetGrid, setTargetGrid] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTarget, setShowTarget] = useState(true);

  // Load level on app start
  useEffect(() => {
    const loadLevel = async () => {
      const savedLevel = await getLevel();
      setLevel(savedLevel);
    };
    loadLevel();
  }, []);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [level]);

  // Save level whenever it changes
  useEffect(() => {
    storeLevel(level);
  }, [level]);

  // Check if the current grid matches the target
  useEffect(() => {
    if (grid.length > 0 && targetGrid.length > 0) {
      const matches = grid.every((row, rowIndex) =>
        row.every((cell, colIndex) => cell === targetGrid[rowIndex][colIndex])
      );

      if (matches && !isComplete && moves > 0) {
        setIsComplete(true);
      }
    }
  }, [grid, targetGrid]);

  // --- Capacitor Preferences Functions ---
  const storeLevel = async (value) => {
    try {
      await Preferences.set({
        key: "level",
        value: value.toString(),
      });
    } catch (e) {
      console.error("Error storing level:", e);
    }
  };

  const getLevel = async () => {
    try {
      const { value } = await Preferences.get({ key: "level" });
      if (value !== null) {
        return parseInt(value);
      }
    } catch (e) {
      console.error("Error getting level:", e);
    }
    return 1; // Default to level 1 if no level is found
  };
  // --- End Capacitor Preferences Functions ---

  // Initialize game with random grid and solvable target
  const initializeGame = () => {
    // Determine grid size based on level
    const newSize = Math.min(3 + Math.floor(level / 5), 8);
    setGridSize(newSize);

    // Create initial grid
    const newGrid = Array(newSize)
      .fill()
      .map(() =>
        Array(newSize)
          .fill()
          .map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
      );

    setGrid(newGrid);

    // Create target grid by applying random shifts to the initial grid
    // This ensures the puzzle is solvable
    const randomShifts = 5 + level;
    let targetGrid = JSON.parse(JSON.stringify(newGrid));

    for (let i = 0; i < randomShifts; i++) {
      const isRow = Math.random() > 0.5;
      const index = Math.floor(Math.random() * newSize);

      if (isRow) {
        targetGrid = shiftRow(targetGrid, index);
      } else {
        targetGrid = shiftColumn(targetGrid, index);
      }
    }

    setTargetGrid(targetGrid);
    setMoves(0);
    setIsComplete(false);
  };

  // Shift colors in a row
  const shiftRow = (currentGrid, rowIndex) => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    newGrid[rowIndex] = newGrid[rowIndex].map((color) => {
      const currentIndex = COLORS.indexOf(color);
      const nextIndex = (currentIndex + 1) % COLORS.length;
      return COLORS[nextIndex];
    });
    return newGrid;
  };

  // Shift colors in a column
  const shiftColumn = (currentGrid, colIndex) => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    for (let row = 0; row < newGrid.length; row++) {
      const currentIndex = COLORS.indexOf(newGrid[row][colIndex]);
      const nextIndex = (currentIndex + 1) % COLORS.length;
      newGrid[row][colIndex] = COLORS[nextIndex];
    }
    return newGrid;
  };

  // Handle row shift
  const handleRowShift = (rowIndex) => {
    if (isComplete) return;
    setGrid(shiftRow(grid, rowIndex));
    setMoves(moves + 1);
  };

  // Handle column shift
  const handleColumnShift = (colIndex) => {
    if (isComplete) return;
    setGrid(shiftColumn(grid, colIndex));
    setMoves(moves + 1);
  };

  // Start next level
  const nextLevel = () => {
    setLevel(level + 1);
  };

  // Reset current level
  const resetLevel = () => {
    initializeGame();
  };

  // Cell size calculation based on grid size
  const getCellSize = () => {
    return {
      width: `${64 / gridSize}vw`,
      height: `${64 / gridSize}vw`,
      maxWidth: `${256 / gridSize}px`,
      maxHeight: `${256 / gridSize}px`,
    };
  };

  const cellSize = getCellSize();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Chromatic Shift</h1>
          <div className="space-x-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              ?
            </button>
            <button
              onClick={() => setShowTarget(!showTarget)}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              {showTarget ? "Hide Target" : "Show Target"}
            </button>
          </div>
        </div>

        {/* Help Modal */}
        {showHelp && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-lg">How to Play:</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Click on row or column indicators (arrows) to shift colors
              </li>
              <li>Colors cycle: Red → Blue → Yellow → Red</li>
              <li>Match your grid to the target pattern below</li>
              <li>Complete the level in as few moves as possible</li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-3 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        )}

        {/* Game Status */}
        <div className="flex justify-between mb-4">
          <div className="font-medium">Level: {level}</div>
          <div className="font-medium">Moves: {moves}</div>
        </div>

        {/* Main Game Grid */}
        <div className="mb-6">
          {/* Game Grid */}
          <div className="flex">
            {/* Row Shift Controls */}
            <div className="flex flex-col justify-center mr-2 mt-6">
              {grid.map((_, rowIndex) => (
                <button
                  key={`row-${rowIndex}`}
                  onClick={() => handleRowShift(rowIndex)}
                  className="flex-1 my-px text-gray-600 hover:text-gray-900"
                  disabled={isComplete}
                  style={{ height: cellSize.height }}
                >
                  →
                </button>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="flex-1">
              {grid.map((row, rowIndex) => {
                const arrowRow = (
                  <div className="flex justify-center mb-2 ">
                    {grid.length > 0 &&
                      grid[0].map((_, colIndex) => (
                        <button
                          key={`col-${colIndex}`}
                          onClick={() => handleColumnShift(colIndex)}
                          className="flex-1 mx-px text-gray-600 hover:text-gray-900"
                          disabled={isComplete}
                        >
                          ↓
                        </button>
                      ))}
                  </div>
                );

                return (
                  <div className="w-min">
                    {rowIndex === 0 && arrowRow}
                    <div key={`grid-row-${rowIndex}`} className="flex">
                      {row.map((cell, colIndex) => (
                        <div
                          key={`cell-${rowIndex}-${colIndex}`}
                          className={`${cell} m-px rounded transition-colors duration-200`}
                          style={cellSize}
                        ></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Target Grid */}
        {showTarget && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Target Pattern:
            </h3>
            <div className="flex justify-center">
              <div>
                {targetGrid.map((row, rowIndex) => (
                  <div key={`target-row-${rowIndex}`} className="flex">
                    {row.map((cell, colIndex) => (
                      <div
                        key={`target-cell-${rowIndex}-${colIndex}`}
                        className={`${cell} m-px rounded transition-colors duration-200`}
                        style={{
                          width: `${cellSize.width.replace("vw", "") * 0.5}vw`,
                          height: `${
                            cellSize.height.replace("vw", "") * 0.5
                          }vw`,
                          maxWidth: `${
                            cellSize.maxWidth.replace("px", "") * 0.5
                          }px`,
                          maxHeight: `${
                            cellSize.maxHeight.replace("px", "") * 0.5
                          }px`,
                        }}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Level Complete Message */}
        {isComplete && (
          <div className="mb-4 p-4 bg-green-100 rounded-lg text-center">
            <h3 className="font-bold text-lg text-green-800">
              Level Complete!
            </h3>
            <p className="text-green-700">You solved it in {moves} moves</p>
            <button
              onClick={nextLevel}
              className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Next Level
            </button>
          </div>
        )}

        {/* Game Controls */}
        <div className="flex justify-between">
          <button
            onClick={resetLevel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Reset
          </button>
          <div className="space-x-2">
            <button
              onClick={() => level > 1 && setLevel(level - 1)}
              disabled={level <= 1}
              className={`px-4 py-2 rounded ${
                level <= 1
                  ? "bg-gray-200 text-gray-400"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Previous
            </button>
            <button
              onClick={nextLevel}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Skip
            </button>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="mt-6 flex items-center justify-center space-x-4">
        {COLORS.map((color, index) => (
          <div key={color} className="flex items-center">
            <div className={`${color} w-4 h-4 rounded mr-1`}></div>
            <span className="text-sm">{COLOR_NAMES[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChromaticShift;
