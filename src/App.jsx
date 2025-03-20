import React, { useState, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";
import levelsData from "./levels.json"; // Import the levels data

// Modal Component (No changes needed)
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          X
        </button>
        {children}
      </div>
    </div>
  );
};

const ChromaticShift = () => {
  // Game colors - expanded color palette (No changes needed)
  const BASE_COLORS = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-400",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
  ];
  const COLOR_NAMES = ["red", "blue", "yellow", "green", "purple", "orange"];

  // Game state (No changes needed)
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [gridSize, setGridSize] = useState(4);
  const [grid, setGrid] = useState([]);
  const [targetGrid, setTargetGrid] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTarget, setShowTarget] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colors, setColors] = useState(BASE_COLORS.slice(0, 3));

  // Load level on app start (No changes needed)
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

  // Save level whenever it changes (No changes needed)
  useEffect(() => {
    storeLevel(level);
  }, [level]);

  // Check if the current grid matches the target (No changes needed)
  useEffect(() => {
    if (grid.length > 0 && targetGrid.length > 0) {
      const matches = grid.every((row, rowIndex) =>
        row.every((cell, colIndex) => cell === targetGrid[rowIndex][colIndex])
      );

      if (matches && !isComplete && moves > 0) {
        setIsComplete(true);
        setIsModalOpen(true);
      }
    }
  }, [grid, targetGrid]);

  // --- Capacitor Preferences Functions --- (No changes needed)
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
    return 1;
  };
  // --- End Capacitor Preferences Functions ---

  // Initialize game with premade levels
  const initializeGame = () => {
    const currentLevelData = levelsData.find((lvl) => lvl.level === level);

    if (currentLevelData) {
      setGridSize(currentLevelData.gridSize);
      setColors(currentLevelData.colors);
      setGrid(currentLevelData.initialGrid);
      setTargetGrid(currentLevelData.targetGrid);
      setMoves(0);
      setIsComplete(false);
    } else {
      console.error(`Level data not found for level ${level}`);
      // Optionally, you could fall back to random generation here if a level is missing.
    }
  };

  // Shift colors in a row (No changes needed)
  const shiftRow = (currentGrid, rowIndex, currentColors) => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    newGrid[rowIndex] = newGrid[rowIndex].map((color) => {
      const currentIndex = currentColors.indexOf(color);
      const nextIndex = (currentIndex + 1) % currentColors.length;
      return currentColors[nextIndex];
    });
    return newGrid;
  };

  // Shift colors in a column (No changes needed)
  const shiftColumn = (currentGrid, colIndex, currentColors) => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    for (let row = 0; row < newGrid.length; row++) {
      const currentIndex = currentColors.indexOf(newGrid[row][colIndex]);
      const nextIndex = (currentIndex + 1) % currentColors.length;
      newGrid[row][colIndex] = currentColors[nextIndex];
    }
    return newGrid;
  };

  // Handle row shift (No changes needed)
  const handleRowShift = (rowIndex) => {
    if (isComplete) return;
    setGrid(shiftRow(grid, rowIndex, colors));
    setMoves(moves + 1);
  };

  // Handle column shift (No changes needed)
  const handleColumnShift = (colIndex) => {
    if (isComplete) return;
    setGrid(shiftColumn(grid, colIndex, colors));
    setMoves(moves + 1);
  };

  // Start next level (No changes needed)
  const nextLevel = () => {
    setLevel(level + 1);
    setIsModalOpen(false);
  };

  // Reset current level (No changes needed)
  const resetLevel = () => {
    initializeGame();
    setIsModalOpen(false);
  };

  // Cell size calculation based on grid size (No changes needed)
  const getCellSize = () => {
    return {
      width: `${64 / gridSize}vw`,
      height: `${64 / gridSize}vw`,
      maxWidth: `${256 / gridSize}px`,
      maxHeight: `${256 / gridSize}px`,
    };
  };

  const cellSize = getCellSize();

  // Rest of the JSX (No changes needed)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4 flex flex-col overflow-y-auto flex-grow flex-shrink">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800">Chromatic Shift</h1>
          <div className="space-x-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-md bg-purple-200 hover:bg-purple-300 "
            >
              ?
            </button>
            <button
              onClick={() => setShowTarget(!showTarget)}
              className="p-2 rounded-md bg-purple-200 hover:bg-purple-300"
            >
              {showTarget ? "Hide Target" : "Show Target"}
            </button>
          </div>
        </div>

        {/* Help Modal */}
        {showHelp && (
          <div className="mb-2 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-lg">How to Play:</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Click on row or column indicators (arrows) to shift colors
              </li>
              <li>Colors cycle: Red → Blue → Yellow → Red (and more!)</li>
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
        <div className="flex justify-between mb-2">
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

        {/* Game Controls */}
        <div className="flex justify-between">
          <button
            onClick={resetLevel}
            className="px-4 py-2 bg-amber-200 rounded hover:bg-amber-300"
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
        {colors.map((color, index) => (
          <div key={color} className="flex items-center">
            <div className={`${color} w-4 h-4 rounded mr-1`}></div>
            <span className="text-sm">
              {COLOR_NAMES[BASE_COLORS.indexOf(color)]}
            </span>
          </div>
        ))}
      </div>

      {/* Level Complete Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="font-bold text-lg text-green-800">Level Complete!</h3>
        <p className="text-green-700">You solved it in {moves} moves</p>
        <button
          onClick={nextLevel}
          className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Next Level
        </button>
      </Modal>
    </div>
  );
};

export default ChromaticShift;
