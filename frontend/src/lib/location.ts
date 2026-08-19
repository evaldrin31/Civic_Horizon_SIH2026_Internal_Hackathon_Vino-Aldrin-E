export function calculateEta(distanceKm: number, mode: 'driving' | 'walking' = 'driving'): { timeString: string, minutes: number } {
  const speedKmh = mode === 'driving' ? 40 : 4;
  let hours = distanceKm / speedKmh;
  if (mode === 'driving') {
    hours += 0.05;
  } else {
    hours += 0.02;
  }
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 1) return { timeString: '< 1 min', minutes: 0 };
  if (totalMinutes < 60) return { timeString: totalMinutes + ' min', minutes: totalMinutes };
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return { 
    timeString: mins > 0 ? hrs + 'h ' + mins + 'm' : hrs + 'h',
    minutes: totalMinutes 
  };
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return Math.round(distanceKm * 1000) + ' m';
  }
  return distanceKm.toFixed(1) + ' km';
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI/180);
  const dLon = (lon2 - lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}
