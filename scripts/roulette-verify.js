// Simple verification script to simulate many random spins and report any anomalies
const { writeFileSync } = require('fs');

function computeWinningIndex(rotationDegrees, prizeCount, pointerOffset = 270) {
  const baseModulo = ((rotationDegrees % 360) + 360) % 360;
  const segmentAngle = 360 / prizeCount;
  const centers = Array.from({ length: prizeCount }, (_, i) => (i * segmentAngle + segmentAngle / 2) % 360);
  const targetAngle = ((pointerOffset - baseModulo) + 360) % 360;
  let closestIndex = 0;
  let closestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    let diff = Math.abs(((centers[i] - targetAngle + 540) % 360) - 180);
    if (diff < closestDist) { closestDist = diff; closestIndex = i; }
  }
  return { index: closestIndex, centers, targetAngle, baseModulo, segmentAngle };
}

function runTests(prizeCount = 6, iterations = 200000) {
  const histogram = Array(prizeCount).fill(0);
  const seen = new Set();

  for (let k = 0; k < iterations; k++) {
    const spins = 5;
    const degrees = Math.floor(Math.random() * 360);
    const totalRotationBase = spins * 360 + degrees;
    const r = computeWinningIndex(totalRotationBase, prizeCount);
    histogram[r.index]++;
    // sanity: ensure index within range
    if (r.index < 0 || r.index >= prizeCount) {
      seen.add(`BAD_INDEX ${r.index} for rot ${totalRotationBase}`);
    }
  }

  console.log('Prize distribution after', iterations, 'spins:');
  histogram.forEach((c, i) => console.log(`  [${i}] => ${c}`));
  if (seen.size) {
    console.log('Anomalies:');
    console.log(Array.from(seen).slice(0, 20).join('\n'));
  } else {
    console.log('No index anomalies detected.');
  }
}

if (require.main === module) {
  const prizeCount = parseInt(process.argv[2] || '6', 10);
  const iterations = parseInt(process.argv[3] || '20000', 10);
  runTests(prizeCount, iterations);
}
