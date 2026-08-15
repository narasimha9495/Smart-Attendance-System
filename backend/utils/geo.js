// Haversine formula: great-circle distance between two lat/lng points, in meters.
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000; // earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Returns true if the student's point is within `radius` meters of the room.
function isInsideGeofence(studentLat, studentLng, roomLat, roomLng, radius) {
  const dist = haversine(studentLat, studentLng, roomLat, roomLng);
  return { inside: dist <= radius, distance: Math.round(dist) };
}

module.exports = { haversine, isInsideGeofence };
