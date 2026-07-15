import { useState, useEffect, useRef, useCallback } from "react";
import {
  BoardSocket,
  boardApi,
  type Stroke,
  type CursorMessage,
} from "../services/boardSocket";

/**
 * Hook that manages a collaborative whiteboard connection.
 *
 * Phase 1: Fetch or create the board via REST.
 * Phase 2: Connect via STOMP and sync strokes/cursors in real-time.
 */
export function useBoard(canvasId: string | null, userId: string) {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, CursorMessage>
  >({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<BoardSocket | null>(null);
  const pendingStrokesRef = useRef<Set<string>>(new Set());

  // Phase 1: Fetch or create board
  useEffect(() => {
    if (!canvasId) return;
    let cancelled = false;

    (async () => {
      try {
        let resp;
        try {
          resp = await boardApi.getBoard(canvasId);
        } catch {
          resp = await boardApi.createBoard(canvasId);
          resp = await boardApi.getBoard(canvasId);
        }
        if (!cancelled) {
          setBoardId(resp.boardId);
          setStrokes(resp.strokes ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load board");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canvasId]);

  // Phase 2: Connect WebSocket
  useEffect(() => {
    if (!boardId) return;

    const socket = new BoardSocket(boardId, {
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onStroke: (stroke) => {
        // Deduplicate — skip strokes we sent ourselves
        if (pendingStrokesRef.current.has(stroke.id)) {
          pendingStrokesRef.current.delete(stroke.id);
          return;
        }
        setStrokes((prev) => [...prev, stroke]);
      },
      onClear: () => {
        setStrokes([]);
      },
      onCursor: (cursor) => {
        if (cursor.userId === userId) return;
        setRemoteCursors((prev) => ({ ...prev, [cursor.userId]: cursor }));
      },
    });

    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [boardId, userId]);

  const sendStroke = useCallback(
    (stroke: Stroke) => {
      // Optimistic local add
      pendingStrokesRef.current.add(stroke.id);
      setStrokes((prev) => [...prev, stroke]);
      // Broadcast
      socketRef.current?.sendStroke(stroke);
    },
    []
  );

  const sendCursor = useCallback((cursor: CursorMessage) => {
    socketRef.current?.sendCursor(cursor);
  }, []);

  const clearBoard = useCallback(async () => {
    if (!boardId) return;
    setStrokes([]);
    try {
      await boardApi.clearBoard(boardId);
    } catch (err) {
      console.warn("[useBoard] clearBoard failed:", err);
    }
  }, [boardId]);

  return {
    boardId,
    strokes,
    remoteCursors,
    isConnected,
    error,
    sendStroke,
    sendCursor,
    clearBoard,
  };
}
