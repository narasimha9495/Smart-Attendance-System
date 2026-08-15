// Compare two 128-dimensional face embeddings.
// The frontend (face-api.js) produces the embeddings; the server decides the
// match so a tampered client cannot fake a pass.

function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// threshold default 0.5: lower is stricter.
function isMatch(enrolled, live, threshold) {
  const t = threshold || 0.5;
  const dist = euclideanDistance(enrolled, live);
  return { match: dist <= t, distance: Number(dist.toFixed(4)) };
}

module.exports = { euclideanDistance, isMatch };
