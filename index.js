const datumParams = {
  default: {
    semiMajorAxis: 0,
    flattening: 0,
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
  },
  sad69: {
    semiMajorAxis: 6378160,
    flattening: 0.00335289187,
    deltaX: -67.35,
    deltaY: 3.88,
    deltaZ: -38.22,
  },
  corregoalegre: {
    semiMajorAxis: 6378388,
    flattening: 0.00336700337,
    deltaX: -206.05,
    deltaY: 168.28,
    deltaZ: -3.82,
  },
  astrochua: {
    semiMajorAxis: 6378388,
    flattening: 0.00336700337,
    deltaX: -144.35,
    deltaY: 243.37,
    deltaZ: -33.22,
  },
  wgs84: {
    semiMajorAxis: 6378137,
    flattening: 0.00335281066,
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
  },
  sirgas2000: {
    semiMajorAxis: 6378137,
    flattening: 0.00335281068,
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
  },
};

function degreeToRadian(degree, minute, second, hemisphere) {
  // Convertendo graus, minutos e segundos para decimal
  let decimal = degree + minute / 60 + second / 3600;

  // Convertendo decimal para radianos
  let radian = decimal * (Math.PI / 180);

  if (hemisphere === "sul" || hemisphere === "oeste") {
    radian = -radian;
  }

  return radian;
}

function radianToDegree(radian, { mask, fixed } = {}) {
  const absAngle = Math.abs(radian);
  const degrees = Math.floor((absAngle * 180) / Math.PI);
  const minutes = Math.floor(((absAngle * 180) / Math.PI - degrees) * 60);
  let seconds = (((absAngle * 180) / Math.PI - degrees) * 60 - minutes) * 60;
  const signal = radian < 0 ? "-" : "";

  if (fixed && typeof fixed === "number") seconds = seconds.toFixed(fixed);
  if (mask)
    return mask
      .replace("[signal]", signal)
      .replace("[dd]", degrees)
      .replace("[mm]", minutes)
      .replace("[ss]", seconds);
  return `${signal}${degrees}° ${minutes}' ${seconds}"`;
}

function radianToDecimalDegree(rad) {
  return rad * (180 / Math.PI);
}

function getZoneGeographic(longitude) {
  return Math.floor((longitude + 180) / 6) + 1;
}

/*
  -Entradas:
    latitude		coordenadas geodesicas (grau, minuto e segundo)
    longitude		coordenadas geodesicas (grau, minuto e segundo)
    datum   sistema de referência
    hemisphereLongitude		oeste ou leste
    hemisphereLatitude		norte ou sul
*/
function geographicToUTM(
  { latitude, longitude, datum, hemisphereLongitude, hemisphereLatitude },
  config
) {
  const latitudeRadian = degreeToRadian(
    latitude.degree,
    latitude.minute,
    latitude.second,
    hemisphereLatitude
  );
  const longitudeRadian = degreeToRadian(
    longitude.degree,
    longitude.minute,
    longitude.second,
    hemisphereLongitude
  );
  const longitudeDecimalDegree = radianToDecimalDegree(longitudeRadian);
  const zone = getZoneGeographic(longitudeDecimalDegree);
  const centralMeridian = 6 * zone - 183;
  const centralMeridianRadian = degreeToRadian(centralMeridian, 0, 0);
  return convertGeographicToUTM(
    latitudeRadian,
    longitudeRadian,
    datum,
    hemisphereLatitude,
    centralMeridianRadian,
    config
  );
}

/*
  -Entradas:
    latitude		coordenadas geodesicas (em radianos)
    longitude		coordenadas geodesicas (em radianos)
    datum   sistema de referência
    hemisphereLatitude		norte ou sul
    centralMeridianRadian	meridiano central (em radianos)
  -Saidas:
    x y coordenadas UTM (em metros)
*/
function convertGeographicToUTM(
  latitude,
  longitude,
  datum,
  hemisphereLatitude,
  centralMeridianRadian,
  { mask, fixed } = {}
) {
  const semiMajorAxis = datumParams[datum].semiMajorAxis;
  const flattening = datumParams[datum].flattening;

  // verifica hemisfério
  let offy;
  if (hemisphereLatitude == "norte") {
    offy = 0;
  } else {
    offy = 10000000;
  }

  // Converte latitude/longitude em UTM
  const k0 = 1 - 1 / 2500;
  const equad = 2 * flattening - Math.pow(flattening, 2);
  const elinquad = equad / (1 - equad);
  const aux1 = equad * equad;
  const aux2 = aux1 * equad;
  const aux3 = Math.sin(2 * latitude);
  const aux4 = Math.sin(4 * latitude);
  const aux5 = Math.sin(6 * latitude);
  const aux6 = (1 - equad / 4 - (3 * aux1) / 64 - (5 * aux2) / 256) * latitude;
  const aux7 = ((3 * equad) / 8 + (3 * aux1) / 32 + (45 * aux2) / 1024) * aux3;
  const aux8 = ((15 * aux1) / 256 + (45 * aux2) / 1024) * aux4;
  const aux9 = ((35 * aux2) / 3072) * aux5;

  const n =
    semiMajorAxis / Math.sqrt(1 - equad * Math.pow(Math.sin(latitude), 2));
  const t = Math.pow(Math.tan(latitude), 2);
  const c = elinquad * Math.pow(Math.cos(latitude), 2);
  const ag = (longitude - centralMeridianRadian) * Math.cos(latitude);
  const m = semiMajorAxis * (aux6 - aux7 + aux8 - aux9);

  const aux10 = ((1 - t + c) * Math.pow(ag, 3)) / 6;
  const aux11 =
    ((5 - 18 * t + Math.pow(t, 2) + 72 * c - 58 * elinquad) * Math.pow(ag, 5)) /
    120;
  const aux12 = ((5 - t + 9 * c + 4 * Math.pow(c, 2)) * Math.pow(ag, 4)) / 24;
  const aux13 =
    ((61 - 58 * t + Math.pow(t, 2) + 600 * c - 330 * elinquad) *
      Math.pow(ag, 6)) /
    720;

  let x = 500000 + k0 * n * (ag + aux10 + aux11);
  let y =
    offy +
    k0 * (m + n * Math.tan(latitude) * (Math.pow(ag, 2) / 2 + aux12 + aux13));

  if (fixed && typeof fixed === "number") {
    x = x.toFixed(fixed);
    y = y.toFixed(fixed);
  }
  if (mask) return mask.replace("[x]", x).replace("[y]", y);
  return { x, y };
}

/*
  -Entradas: 
    x		coordenadas UTM (em metros)
    y		coordenadas UTM (em metros)
    datum   sistema de referência
    hemisphereLatitude		norte ou sul
    fuso		fuso
  -Saidas: 
    latitude	longitude coordenadas geodesicas (em grau, minuto e segundo)
*/
function UTMToGeographic({ x, y, datum, hemisphereLatitude, zone }, config) {
  const centralMeridian = 6 * zone - 183;
  const centralMeridianRadian = degreeToRadian(centralMeridian, 0, 0);
  return convertUTMToGeographic(
    { x, y, datum, hemisphereLatitude, centralMeridianRadian },
    config
  );
}

/*
  -Entradas: 
    x		coordenadas UTM (em metros)
    y		coordenadas UTM (em metros)
    datum   sistema de referência
    hemisphereLatitude		norte ou sul
    centralMeridianRadian	meridiano central (em radianos)
  -Saidas: 
    latitude	longitude coordenadas geodesicas (em grau, minuto e segundo)
*/
function convertUTMToGeographic(
  { x, y, datum, hemisphereLatitude, centralMeridianRadian },
  config
) {
  const semiMajorAxis = datumParams[datum].semiMajorAxis;
  const flattening = datumParams[datum].flattening;

  // verifica hemisfério
  if (hemisphereLatitude == "norte") {
    y = y + 10000000;
  }

  // Converte UTM para latitude/longitude;
  const k0 = 1 - 1 / 2500;
  const equad = 2 * flattening - Math.pow(flattening, 2);
  const elinquad = equad / (1 - equad);
  const e1 = (1 - Math.sqrt(1 - equad)) / (1 + Math.sqrt(1 - equad));

  const aux1 = equad * equad;
  const aux2 = aux1 * equad;
  const aux3 = e1 * e1;
  const aux4 = e1 * aux3;
  const aux5 = aux4 * e1;

  const m = (y - 10000000) / k0;
  const mi =
    m / (semiMajorAxis * (1 - equad / 4 - (3 * aux1) / 64 - (5 * aux2) / 256));

  const aux6 = ((3 * e1) / 2 - (27 * aux4) / 32) * Math.sin(2 * mi);
  const aux7 = ((21 * aux3) / 16 - (55 * aux5) / 32) * Math.sin(4 * mi);
  const aux8 = ((151 * aux4) / 96) * Math.sin(6 * mi);

  const lat1 = mi + aux6 + aux7 + aux8;
  const c1 = elinquad * Math.pow(Math.cos(lat1), 2);
  const t1 = Math.pow(Math.tan(lat1), 2);
  const n1 = semiMajorAxis / Math.sqrt(1 - equad * Math.pow(Math.sin(lat1), 2));
  const quoc = Math.pow(1 - equad * Math.pow(Math.sin(lat1), 2), 3);
  const r1 = (semiMajorAxis * (1 - equad)) / Math.sqrt(quoc);
  const d = (x - 500000) / (n1 * k0);

  const aux9 =
    ((5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * elinquad) * Math.pow(d, 4)) / 24;
  const aux10 =
    ((61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * elinquad - 3 * c1 * c1) *
      Math.pow(d, 6)) /
    720;
  const aux11 = d - ((1 + 2 * t1 + c1) * Math.pow(d, 3)) / 6;
  const aux12 =
    ((5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * elinquad + 24 * t1 * t1) *
      Math.pow(d, 5)) /
    120;

  const latitude =
    lat1 - ((n1 * Math.tan(lat1)) / r1) * (Math.pow(d, 2) / 2 - aux9 + aux10);
  const longitude = centralMeridianRadian + (aux11 + aux12) / Math.cos(lat1);

  const latDegree = radianToDegree(latitude, config);
  const lonDegree = radianToDegree(longitude, config);

  return { latitude: latDegree, longitude: lonDegree };
}

module.exports = { geographicToUTM, UTMToGeographic };
