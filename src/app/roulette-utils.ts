export function computeWinningIndex(rotationDegrees: number, prizeCount: number, pointerOffset = 270) {
  const baseModulo = ((rotationDegrees % 360) + 360) % 360;
  const segmentAngle = 360 / prizeCount;

  // Precompute centers for each segment (angle at which segment's center sits when wheel = 0)
  const centers: number[] = Array.from({ length: prizeCount }, (_, i) => {
    return (i * segmentAngle + segmentAngle / 2) % 360;
  });

  // Compute the angle on the wheel that aligns with the pointer after rotation
  // If a center + rotationDegrees === pointerOffset (mod 360) then that center is at the pointer.
  // Rearranged: center === pointerOffset - rotation (mod 360)
  const targetAngle = ((pointerOffset - baseModulo) + 360) % 360;

  // Find closest center to the targetAngle using wrapped shortest distance
  let closestIndex = 0;
  let closestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    let diff = Math.abs(((centers[i] - targetAngle + 540) % 360) - 180);
    if (diff < closestDist) {
      closestDist = diff;
      closestIndex = i;
    }
  }

  return {
    index: closestIndex,
    centers,
    targetAngle,
    baseModulo,
    segmentAngle
  } as const;
}
