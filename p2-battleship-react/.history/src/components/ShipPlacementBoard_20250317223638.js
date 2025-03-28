import React, { useState } from "react";
import { useGame } from "../context/GameContext";

const ShipPlacementBoard = () => {
  const { state, dispatch } = useGame();
  const [draggedShip, setDraggedShip] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  // 处理船只拖动开始
  const handleDragStart = (e, shipId) => {
    setDraggedShip(shipId);
    dispatch({
      type: "SELECT_SHIP",
      payload: { shipId },
    });

    // 设置拖动图像（可选）
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      const transparentImage = new Image();
      transparentImage.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      e.dataTransfer.setDragImage(transparentImage, 0, 0);
    }
  };

  // 处理拖动结束
  const handleDragEnd = () => {
    setDraggedShip(null);
    setHoverCell(null);
  };

  // 处理拖动悬停在单元格上
  const handleDragOver = (e, row, col) => {
    e.preventDefault(); // 允许放置
    setHoverCell({ row, col });
  };

  // 处理离开拖放区域
  const handleDragLeave = () => {
    setHoverCell(null);
  };

  // 处理放置船只
  const handleDrop = (e, row, col) => {
    e.preventDefault();

    if (!state.selectedShip) return;

    // 放置船只
    dispatch({
      type: "PLACE_SHIP",
      payload: {
        row,
        col,
        shipId: state.selectedShip,
      },
    });

    setDraggedShip(null);
    setHoverCell(null);
  };

  // 单元格点击 - 放置船只
  const handleCellClick = (row, col) => {
    if (!state.selectedShip) return;

    dispatch({
      type: "PLACE_SHIP",
      payload: {
        row,
        col,
        shipId: state.selectedShip,
      },
    });
  };

  // 切换船只方向
  const toggleOrientation = () => {
    dispatch({ type: "TOGGLE_ORIENTATION" });
  };

  // 选择船只
  const selectShip = (shipId) => {
    dispatch({
      type: "SELECT_SHIP",
      payload: { shipId },
    });
  };

  // 开始游戏
  const startGame = () => {
    dispatch({
      type: "START_GAME_WITH_PLACED_SHIPS",
      payload: { gameMode: "normal" },
    });
  };

  // 检查船只放置位置是否有效
  const isValidPlacement = (
    board,
    startRow,
    startCol,
    shipSize,
    orientation
  ) => {
    // 检查是否超出边界
    if (orientation === "horizontal" && startCol + shipSize > 10) return false;
    if (orientation === "vertical" && startRow + shipSize > 10) return false;

    // 检查是否与其他船只重叠
    for (let i = 0; i < shipSize; i++) {
      const row = orientation === "horizontal" ? startRow : startRow + i;
      const col = orientation === "horizontal" ? startCol + i : startCol;

      // 超出边界
      if (row >= 10 || col >= 10) return false;

      // 已有船只
      if (board[row][col]?.hasShip) return false;
    }

    return true;
  };

  // 获取放置预览
  const getPlacementHelper = (row, col) => {
    if (!state.selectedShip) return null;

    const selectedShip = state.shipsToPlace.find(
      (ship) => ship.id === state.selectedShip
    );
    if (!selectedShip) return null;

    // 检查位置是否有效
    const isValid = isValidPlacement(
      state.playerBoard,
      row,
      col,
      selectedShip.size,
      state.shipOrientation
    );

    // 显示辅助提示
    const cells = [];
    for (let i = 0; i < selectedShip.size; i++) {
      const posRow = state.shipOrientation === "horizontal" ? row : row + i;
      const posCol = state.shipOrientation === "horizontal" ? col + i : col;

      if (posRow < 10 && posCol < 10) {
        cells.push({ row: posRow, col: posCol });
      }
    }

    return { isValid, cells };
  };

  // 显示船只预览和放置指南
  const renderShipPreview = () => {
    if (!state.shipsToPlace.length) {
      return (
        <div className="ship-placement-complete">
          <p>All ships placed!</p>
          <button className="start-game-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      );
    }

    return (
      <div className="ship-placement-controls">
        <h3>Place your ships</h3>
        <div className="orientation-toggle">
          <label>Orientation: </label>
          <button onClick={toggleOrientation}>
            {state.shipOrientation === "horizontal" ? "Horizontal" : "Vertical"}
          </button>
        </div>

        <div className="ships-container">
          {state.shipsToPlace.map((ship) => (
            <div
              key={ship.id}
              className={`ship-item ${
                state.selectedShip === ship.id ? "selected" : ""
              }`}
              onClick={() => selectShip(ship.id)}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, ship.id)}
              onDragEnd={handleDragEnd}
            >
              <span>
                {ship.id} ({ship.size})
              </span>
              <div
                className="ship-preview"
                style={{
                  flexDirection:
                    state.shipOrientation === "horizontal" ? "row" : "column",
                }}
              >
                {Array(ship.size)
                  .fill()
                  .map((_, i) => (
                    <div
                      key={i}
                      className="ship-cell"
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "black",
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 获取当前悬停位置的预览
  const getHoverPreview = () => {
    if (!hoverCell || !draggedShip) return null;

    return getPlacementHelper(hoverCell.row, hoverCell.col);
  };

  return (
    <div className="ship-placement">
      <h2>Place Your Ships</h2>

      <div className="placement-container">
        <div className="board-container">
          <table className="game-board">
            <tbody>
              {state.playerBoard.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => {
                    // 获取放置预览
                    const helper =
                      hoverCell &&
                      hoverCell.row === rowIndex &&
                      hoverCell.col === colIndex
                        ? getHoverPreview()
                        : getPlacementHelper(rowIndex, colIndex);

                    // 检查当前单元格是否在预览中
                    const isPreview =
                      helper &&
                      helper.cells.some(
                        (pos) => pos.row === rowIndex && pos.col === colIndex
                      );

                    // 构建预览样式
                    const previewStyle = isPreview
                      ? {
                          backgroundColor: helper.isValid
                            ? "rgba(0, 255, 0, 0.3)"
                            : "rgba(255, 0, 0, 0.3)",
                          cursor: helper.isValid ? "pointer" : "not-allowed",
                        }
                      : {};

                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        className={cell?.hasShip ? "ship" : ""}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onDragOver={(e) =>
                          handleDragOver(e, rowIndex, colIndex)
                        }
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                        style={previewStyle}
                      >
                        {cell?.hasShip ? "■" : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ship-selection">
          {renderShipPreview()}
          <div className="placement-instructions">
            <h4>Instructions:</h4>
            <ul>
              <li>Click or drag ships to place them on the board</li>
              <li>Use the orientation button to rotate ships</li>
              <li>Place all ships to continue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipPlacementBoard;
