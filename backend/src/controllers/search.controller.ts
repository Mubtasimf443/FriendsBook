/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { IDistrict } from '../lib/types/location.types';
import { Districts } from '../lib/data/districts';
import { IAuthSession } from '../models/AuthSession';


// Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get nearest districts
export function findNearestDistricts(lat: number, lon: number, count = 5): IDistrict[] {
  return Districts
    .map((district) => ({
      ...district,
      distance: getDistance(lat, lon, district.lat, district.long),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

export function searchHeightGenerator(min: number, max: number): string[] {
  let heights:string[] = [];
  let d = max -min;
  for (let i = 0; i <= d; i++) {
    let foot = min +i;
    for (let inc = 0; inc <= 11; inc++) {
      heights.push(`${foot} foot ${inc} inch`);
    }
  }
  return heights;
}
// Add this at the top of search.ts
export function getBaseSearchQuery(userData: IAuthSession['value']) {
  return {
    'suspension.isSuspended': false,
    '_id': { $ne: userData.userId },
    'enhancedSettings.blocked.userId': { $ne: userData.userId },
    'gender': { $ne: userData.gender },
    religion: userData.religion
  };
}