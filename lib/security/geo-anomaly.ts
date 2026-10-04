/**
 * IP Anomaly & Impossible-Travel Detection Engine
 * Evaluates geographic displacement velocities across session telemetry
 */

export interface GeoLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Known coordinates for common IP demo/production regions
const REGION_COORDINATES: Record<string, GeoLocation> = {
  hyderabad: { city: "Hyderabad", country: "India", lat: 17.385, lng: 78.4867 },
  bengaluru: { city: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946 },
  mumbai: { city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  delhi: { city: "Delhi", country: "India", lat: 28.6139, lng: 77.209 },
  london: { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  "new york": { city: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  frankfurt: { city: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821 },
  amsterdam: { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  tokyo: { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  bucharest: { city: "Bucharest", country: "Romania", lat: 44.4268, lng: 26.1025 },
  singapore: { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  "são paulo": { city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
};

function resolveCoordinates(locationStr: string): GeoLocation | null {
  const norm = locationStr.toLowerCase();
  for (const [key, val] of Object.entries(REGION_COORDINATES)) {
    if (norm.includes(key)) return val;
  }
  return null;
}

/**
 * Calculates Haversine great-circle distance between two coordinate pairs in kilometers
 */
function calculateDistanceKm(loc1: GeoLocation, loc2: GeoLocation): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface TravelAnalysisResult {
  isIpChanged: boolean;
  isImpossibleTravel: boolean;
  classification: "Normal IP Change" | "Suspicious IP Change" | "High-Risk Geographic Change" | "No Change";
  timeDifferenceMinutes: number;
  estimatedDistanceKm: number;
  requiredSpeedKmH: number;
  riskScore: number;
  explanation: string;
  disclaimer: string;
}

/**
 * Evaluates whether movement between two observed sessions or telemetry checks represents Impossible Travel
 */
export function analyzeTravelVelocity(
  previousLocation: string,
  previousIp: string,
  previousTimestamp: string | number | Date,
  currentLocation: string,
  currentIp: string,
  currentTimestamp: string | number | Date = new Date()
): TravelAnalysisResult {
  const disclaimer = "Note: Geolocation is based on approximate IP lookup; accuracy is not GPS-guaranteed.";

  if (previousIp === currentIp) {
    return {
      isIpChanged: false,
      isImpossibleTravel: false,
      classification: "No Change",
      timeDifferenceMinutes: 0,
      estimatedDistanceKm: 0,
      requiredSpeedKmH: 0,
      riskScore: 0,
      explanation: "Session originated from the same IP address.",
      disclaimer,
    };
  }

  const prevTime = new Date(previousTimestamp).getTime();
  const currTime = new Date(currentTimestamp).getTime();
  const timeDifferenceMinutes = Math.max(1, Math.round(Math.abs(currTime - prevTime) / (60 * 1000)));
  const timeDifferenceHours = timeDifferenceMinutes / 60;

  const loc1 = resolveCoordinates(previousLocation);
  const loc2 = resolveCoordinates(currentLocation);

  // If coordinates couldn't be parsed, evaluate based on string match & IP
  if (!loc1 || !loc2) {
    const isDifferentCity = previousLocation.toLowerCase() !== currentLocation.toLowerCase();
    return {
      isIpChanged: true,
      isImpossibleTravel: false,
      classification: isDifferentCity ? "Suspicious IP Change" : "Normal IP Change",
      timeDifferenceMinutes,
      estimatedDistanceKm: isDifferentCity ? 500 : 20,
      requiredSpeedKmH: 0,
      riskScore: isDifferentCity ? 15 : 10,
      explanation: isDifferentCity
        ? `IP changed from ${previousIp} (${previousLocation}) to ${currentIp} (${currentLocation}) over ${timeDifferenceMinutes} mins.`
        : `Dynamic IP reassignment from ${previousIp} to ${currentIp}.`,
      disclaimer,
    };
  }

  const distanceKm = Math.round(calculateDistanceKm(loc1, loc2));
  const speedKmH = Math.round(distanceKm / timeDifferenceHours);

  // Max commercial flight speed threshold is roughly 800 - 900 km/h
  const COMMERCIAL_FLIGHT_MAX_SPEED_KMH = 800;

  if (distanceKm > 100 && speedKmH > COMMERCIAL_FLIGHT_MAX_SPEED_KMH) {
    return {
      isIpChanged: true,
      isImpossibleTravel: true,
      classification: "High-Risk Geographic Change",
      timeDifferenceMinutes,
      estimatedDistanceKm: distanceKm,
      requiredSpeedKmH: speedKmH,
      riskScore: 35,
      explanation: `Impossible Travel anomaly: Relocation of ~${distanceKm} km from ${previousLocation} to ${currentLocation} in ${timeDifferenceMinutes} minutes would require travel speed of ${speedKmH} km/h (exceeds max commercial flight velocity ~800 km/h).`,
      disclaimer,
    };
  }

  if (distanceKm > 300) {
    return {
      isIpChanged: true,
      isImpossibleTravel: false,
      classification: "Suspicious IP Change",
      timeDifferenceMinutes,
      estimatedDistanceKm: distanceKm,
      requiredSpeedKmH: speedKmH,
      riskScore: 15,
      explanation: `Geographic change of ~${distanceKm} km from ${previousLocation} to ${currentLocation} in ${timeDifferenceMinutes} mins (${speedKmH} km/h). Plausible travel speed, but flagged for monitoring.`,
      disclaimer,
    };
  }

  return {
    isIpChanged: true,
    isImpossibleTravel: false,
    classification: "Normal IP Change",
    timeDifferenceMinutes,
    estimatedDistanceKm: distanceKm,
    requiredSpeedKmH: speedKmH,
    riskScore: 10,
    explanation: `Normal IP change within approximate vicinity (~${distanceKm} km) over ${timeDifferenceMinutes} mins. Likely mobile data carrier or ISP jump.`,
    disclaimer,
  };
}
