"use client";

import { Check, Users } from "lucide-react";
import type { Sport } from "@/lib/api";

type CourtKind = "football" | "basketball" | "tennis" | "table-tennis" | "court";
type Point = { x: number; y: number };

interface SportSlotPickerProps {
  sport: Sport;
  maxPlayers: number;
  takenSlots: Set<number>;
  selectedSlot: number | null;
  disabled: boolean;
  ownSlot: number | null;
  onSelect: (slot: number) => void;
}

function getCourtKind(sport: Sport): CourtKind {
  const name = `${sport.name} ${sport.slug}`.toLowerCase();
  if (/football|soccer|futsal/.test(name)) return "football";
  if (/basketball|hoops/.test(name)) return "basketball";
  if (/table.?tennis|ping.?pong/.test(name)) return "table-tennis";
  if (/\btennis\b/.test(name)) return "tennis";
  return "court";
}

function getRows(count: number, kind: CourtKind): number[] {
  const formations: Record<number, number[]> = kind === "football"
    ? { 1: [1], 2: [1, 1], 3: [1, 2], 4: [1, 2, 1], 5: [1, 2, 2], 6: [1, 2, 2, 1], 7: [1, 2, 3, 1], 8: [1, 3, 3, 1], 9: [1, 3, 3, 2], 10: [1, 3, 3, 3], 11: [1, 4, 3, 3] }
    : { 1: [1], 2: [1, 1], 3: [1, 2], 4: [2, 2], 5: [2, 3], 6: [2, 2, 2] };
  if (formations[count]) return formations[count];

  const rowCount = Math.min(5, Math.ceil(count / 3));
  const rows = Array.from({ length: rowCount }, () => Math.floor(count / rowCount));
  for (let index = 0; index < count % rowCount; index += 1) rows[index] += 1;
  return rows;
}

function getPoints(count: number, kind: CourtKind): Point[] {
  if (kind === "tennis" && count === 2) return [{ x: 24, y: 50 }, { x: 76, y: 50 }];
  if (kind === "tennis" && count === 4) {
    return [{ x: 23, y: 39 }, { x: 23, y: 61 }, { x: 77, y: 39 }, { x: 77, y: 61 }];
  }
  if (kind === "table-tennis" && count === 2) return [{ x: 30, y: 50 }, { x: 70, y: 50 }];
  if (kind === "table-tennis" && count === 4) {
    return [{ x: 28, y: 36 }, { x: 28, y: 64 }, { x: 72, y: 36 }, { x: 72, y: 64 }];
  }

  if (count > 22 || kind === "court") {
    const columns = Math.ceil(Math.sqrt(count * 1.55));
    const rows = Math.ceil(count / columns);
    return Array.from({ length: count }, (_, index) => ({
      x: 12 + (columns === 1 ? 38 : (index % columns) * 76 / (columns - 1)),
      y: 18 + (rows === 1 ? 32 : Math.floor(index / columns) * 64 / (rows - 1)),
    }));
  }

  const leftCount = Math.ceil(count / 2);
  const rightCount = Math.floor(count / 2);
  const getSidePoints = (sideCount: number, mirrored: boolean): Point[] => {
    if (!sideCount) return [];
    const rows = getRows(sideCount, kind);
    const sidePoints: Point[] = [];
    rows.forEach((rowSize, rowIndex) => {
      for (let index = 0; index < rowSize; index += 1) {
        const x = rows.length === 1
          ? 25
          : 7 + rowIndex * 38 / (rows.length - 1);
        const y = 50 + (index - (rowSize - 1) / 2) * Math.min(18, 68 / rowSize);
        sidePoints.push({ x: mirrored ? 100 - x : x, y });
      }
    });
    return sidePoints;
  };
  return [...getSidePoints(leftCount, false), ...getSidePoints(rightCount, true)];
}

function CourtMarkings({ kind }: { kind: CourtKind }) {
  if (kind === "football") {
    return <svg className="sport-court-lines" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="3" y="5" width="94" height="90" rx="2" />
      <path d="M50 5v90M3 50h94" />
      <circle cx="50" cy="50" r="13" />
      <circle className="court-dot" cx="50" cy="50" r="1" />
      <path d="M3 29h13v42H3m0-32h6v22H3M97 29H84v42h13m0-32h-6v22h6" />
      <path d="M3 38h4v24H3m94-24h-4v24h4" />
    </svg>;
  }
  if (kind === "basketball") {
    return <svg className="sport-court-lines" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="3" y="5" width="94" height="90" rx="2" />
      <path d="M50 5v90M3 50h94" />
      <circle cx="50" cy="50" r="12" />
      <path d="M3 32h17v36H3m0-28h9v20H3m94-28H80v36h17m0-28h-9v20h9" />
      <path d="M3 20a31 31 0 0 1 0 60m94-60a31 31 0 0 0 0 60" />
    </svg>;
  }
  if (kind === "tennis" || kind === "table-tennis") {
    return <svg className="sport-court-lines" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="8" y="6" width="84" height="88" rx="2" />
      <path d="M8 50h84M30 6v88M70 6v88M8 19h84M8 81h84" />
      {kind === "tennis" && <path d="M38 19v62M62 19v62" />}
    </svg>;
  }
  return <svg className="sport-court-lines" viewBox="0 0 100 100" aria-hidden="true">
    <rect x="3" y="5" width="94" height="90" rx="2" />
    <path d="M50 5v90M3 50h94" />
    <circle cx="50" cy="50" r="12" />
  </svg>;
}

export default function SportSlotPicker({
  sport,
  maxPlayers,
  takenSlots,
  selectedSlot,
  disabled,
  ownSlot,
  onSelect,
}: SportSlotPickerProps) {
  const kind = getCourtKind(sport);
  const points = getPoints(maxPlayers, kind);
  const caption = {
    football: "Choose your place on the pitch",
    basketball: "Choose your place on the court",
    tennis: "Choose a place on the court",
    "table-tennis": "Choose a place at the table",
    court: "Choose an available spot",
  }[kind];

  return (
    <div className={`sport-picker sport-picker-${kind}`}>
      <div className="sport-picker-heading">
        <span><Users aria-hidden="true" />{caption}</span>
        <strong>{takenSlots.size} / {maxPlayers} filled</strong>
      </div>
      <div className={`sport-court sport-court-${kind}`} role="group" aria-label={`${sport.name} player spots`}>
        <CourtMarkings kind={kind} />
        {Array.from({ length: maxPlayers }, (_, index) => {
          const slot = index + 1;
          const isTaken = takenSlots.has(slot);
          const isSelected = selectedSlot === slot;
          const point = points[index];
          const classes = [
            "sport-slot",
            isTaken ? "is-taken" : "",
            isSelected ? "is-selected" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              aria-pressed={isSelected}
              aria-label={`Spot ${slot}${isTaken ? slot === ownSlot ? ", yours" : ", taken" : ", open"}`}
              className={classes}
              disabled={isTaken || disabled}
              key={slot}
              onClick={() => onSelect(slot)}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              type="button"
            >
              {isSelected ? <Check aria-hidden="true" /> : String(slot).padStart(2, "0")}
            </button>
          );
        })}
      </div>
      <div className="sport-picker-footer">
        <div className="sport-picker-legend" aria-label="Spot status legend">
          <span><i className="legend-open" />Open</span>
          <span><i className="legend-selected" />Your pick</span>
          <span><i className="legend-taken" />Taken</span>
        </div>
        <p aria-live="polite">{selectedSlot ? `Spot ${String(selectedSlot).padStart(2, "0")} selected` : "Tap an open spot to select it"}</p>
      </div>
    </div>
  );
}
