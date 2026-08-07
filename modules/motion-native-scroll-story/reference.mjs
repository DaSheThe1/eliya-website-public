export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function evaluateMotionEligibility(
  {
    siteMotion = "motion",
    saveData = false,
    documentVisible = true,
    finePointer = true,
  } = {},
  { heavyMedia = false, pointerEffect = false } = {},
) {
  if (siteMotion === "reduced") {
    return { eligible: false, reason: "site-opt-out" };
  }
  if (heavyMedia && saveData) {
    return { eligible: false, reason: "save-data" };
  }
  if (pointerEffect && !finePointer) {
    return { eligible: false, reason: "no-fine-pointer" };
  }
  if (!documentVisible) {
    return { eligible: false, reason: "document-hidden" };
  }
  return { eligible: true, reason: "eligible" };
}

export function nativeScrollProgress({
  trackTop,
  trackHeight,
  stageHeight,
}) {
  const travel = Math.max(1, trackHeight - stageHeight);
  return clamp(-trackTop / travel);
}

export function copyRailPosition(
  progress,
  stationCount,
  holdStart = 0.34,
  holdEnd = 0.66,
) {
  if (!Number.isInteger(stationCount) || stationCount < 2) {
    throw new Error("stationCount must be an integer of at least two");
  }
  const position = clamp(progress) * (stationCount - 1);
  const from = Math.min(
    stationCount - 1,
    Math.max(0, Math.floor(position)),
  );
  if (from === stationCount - 1) return from;
  const local = position - from;
  const travel = clamp((local - holdStart) / (holdEnd - holdStart));
  const eased = travel * travel * (3 - 2 * travel);
  return from + eased;
}

export function touchIntentThreshold(
  viewportHeight,
  ratio = 0.06,
  minimum = 42,
  maximum = 64,
) {
  return clamp(viewportHeight * ratio, minimum, maximum);
}

export function resolveSettleTarget({
  stationCount,
  startStation = null,
  startScrollY = 0,
  endScrollY,
  rawProgress,
  viewportHeight,
  progressTolerance = 0,
}) {
  if (!Number.isInteger(stationCount) || stationCount < 2) {
    throw new Error("stationCount must be an integer of at least two");
  }
  const withinJourney =
    rawProgress >= -progressTolerance &&
    rawProgress <= 1 + progressTolerance;

  if (startStation !== null) {
    const distance = endScrollY - startScrollY;
    if (Math.abs(distance) >= touchIntentThreshold(viewportHeight)) {
      const direction = distance > 0 ? 1 : -1;
      const leavingFromFirst = startStation === 0 && direction < 0;
      const leavingFromLast =
        startStation === stationCount - 1 && direction > 0;
      const completedReverseExit =
        startStation === stationCount - 1 &&
        direction < 0 &&
        rawProgress < -progressTolerance &&
        !withinJourney;

      if (leavingFromFirst || leavingFromLast || completedReverseExit) {
        return { kind: "native-exit" };
      }
      return {
        kind: "station",
        station: clamp(startStation + direction, 0, stationCount - 1),
      };
    }
  }

  if (!withinJourney) return { kind: "native-exit" };
  return {
    kind: "station",
    station: Math.round(clamp(rawProgress) * (stationCount - 1)),
  };
}
