// @ts-check
// Checkpoint D: image-specific private calibration candidates. Native artwork
// pixels are converted to the existing Traffic Engine's percentages only here.
// No world coordinates, clock, artwork, intersection controls or production registry.
import { sampleRouteAtProgress } from './traffic/metaverseTrafficAuthoringModel.js';

export const AVALON_SEASONAL_ROADS = {
  'AUTUMN/DAY': {
    sha256: '66b85c0ac4b713d34a6fba0034791093dfc567fdc03b366ff413247ced9a68c8', uncertaintyPx: 8,
    westUpper: [[0,430],[100,502],[200,576],[300,649],[400,721],[500,793],[550,816]],
    westCenter: [[0,511],[100,591.5],[200,671.5],[300,750.5],[400,828.5]],
    eastUpper: [[1584,520],[1500,560],[1400,607],[1300,653],[1200,699],[1030,778]],
    eastCenter: [[1584,585],[1500,631],[1400,686],[1300,739.5],[1200,794.5]],
    plazaTip: [[650,838],[740,847],[820,844],[900,825]],
    outerWest: [[0,711],[100,797],[200,884],[235,925],[250,953],[242,993]],
    outerEast: [[1584,715],[1450,802],[1327,888],[1315,916],[1360,952],[1445,993]],
    crosswalks: [[[215,891],[550,810],[653,848],[267,970]],[[1000,779],[1360,865],[1327,921],[928,831]]],
    rearWheelbase: [[0,36.5],[250,54.2],[550,75.5]], eastWheelbase: [[1584,42],[1350,53],[950,72]],
  },
  'AUTUMN/DUSK': {
    sha256: '75d65872168f795ace704a5af162bbd500d6c6df5d967c28cadcec98b1be09dd', uncertaintyPx: 8,
    westUpper: [[0,429],[100,503],[200,579],[300,652],[400,724],[500,795],[550,818]],
    westCenter: [[0,505],[100,590],[200,674],[300,754.5],[400,832.5]],
    eastUpper: [[1584,521],[1500,561],[1400,609],[1300,656],[1200,703],[1030,781]],
    eastCenter: [[1584,585],[1500,632],[1400,690],[1300,745.5],[1200,800]],
    plazaTip: [[650,840],[740,849],[820,846],[900,828]],
    outerWest: [[0,713],[100,800],[200,887],[236,928],[252,956],[244,993]],
    outerEast: [[1584,717],[1450,805],[1328,891],[1316,919],[1363,954],[1448,993]],
    crosswalks: [[[216,893],[551,813],[654,851],[268,972]],[[1002,782],[1361,868],[1328,923],[930,834]]],
    rearWheelbase: [[0,36.3],[250,54],[550,75.2]], eastWheelbase: [[1584,41.8],[1350,52.8],[950,71.8]],
  },
  'AUTUMN/NIGHT': {
    sha256: '9994519910da04df14499c6329957fcbcfcc3ab3bab6e27407218c03638a523d', uncertaintyPx: 8,
    westUpper: [[0,432],[100,505],[200,581],[300,654],[400,726],[500,797],[550,820]],
    westCenter: [[0,509],[100,592.5],[200,675],[300,754.5],[400,833]],
    eastUpper: [[1584,522],[1500,562],[1400,610],[1300,658],[1200,705],[1030,783]],
    eastCenter: [[1584,584],[1500,632],[1400,689.5],[1300,746],[1200,801]],
    plazaTip: [[650,842],[740,851],[820,848],[900,830]],
    outerWest: [[0,715],[100,802],[200,889],[237,930],[253,958],[245,993]],
    outerEast: [[1584,719],[1450,807],[1330,893],[1318,921],[1365,956],[1450,993]],
    crosswalks: [[[218,895],[553,815],[656,853],[270,974]],[[1004,784],[1363,870],[1330,925],[932,836]]],
    rearWheelbase: [[0,36.4],[250,54.1],[550,75.3]], eastWheelbase: [[1584,39],[1350,52.5],[950,71.5]], eastPathOffsetPx: -1,
  },
  'WINTER/DAY': {
    sha256: 'cd8097a9c6be166068f9dde9f48b5ef8edc0903ec3252ed3ca4f021cc13bee58', uncertaintyPx: 10,
    westUpper: [[0,446],[100,524],[200,594],[300,669],[400,742],[500,813],[550,833]],
    westCenter: [[0,506],[100,590],[200,672],[300,751],[400,827.5]],
    eastUpper: [[1584,536],[1500,575],[1400,620],[1300,664],[1200,709],[1030,784]],
    eastCenter: [[1584,590],[1500,638.5],[1400,694.5],[1300,749],[1200,803.5]],
    plazaTip: [[650,850],[740,858],[820,854],[900,837]],
    outerWest: [[0,719],[100,806],[200,892],[238,933],[251,960],[240,993]],
    outerEast: [[1584,727],[1450,814],[1333,899],[1323,925],[1368,958],[1454,993]],
    crosswalks: [[[217,898],[551,822],[652,858],[268,973]],[[1005,788],[1363,875],[1331,927],[933,841]]],
    rearWheelbase: [[0,34],[250,51],[550,74]], eastWheelbase: [[1584,28],[1350,50],[950,71.5]], eastPathOffsetPx: -2,
  },
  'WINTER/DUSK': {
    sha256: '3bba9d3f16af9be33b10ad30e42505be0cdee1105f1bd9f1b98cb90c5ac21f02', uncertaintyPx: 10,
    westUpper: [[0,441],[100,520],[200,591],[300,666],[400,740],[500,812],[550,831]],
    westCenter: [[0,508],[100,592],[200,675],[300,753],[400,830]],
    eastUpper: [[1584,534],[1500,573],[1400,618],[1300,662],[1200,708],[1030,783]],
    eastCenter: [[1584,589],[1500,637.5],[1400,692.5],[1300,747],[1200,804]],
    plazaTip: [[650,849],[740,857],[820,854],[900,836]],
    outerWest: [[0,718],[100,804],[200,891],[237,932],[252,959],[241,993]],
    outerEast: [[1584,725],[1450,812],[1332,898],[1322,924],[1366,957],[1452,993]],
    crosswalks: [[[216,897],[550,820],[651,857],[267,972]],[[1004,787],[1362,874],[1330,926],[932,840]]],
    rearWheelbase: [[0,34.2],[250,51.2],[550,74.2]], eastWheelbase: [[1584,28.2],[1350,50.2],[950,71.7]], eastPathOffsetPx: -2,
  },
  'WINTER/NIGHT': {
    sha256: 'c00dff71b05a86360d4820840e3c3a8f18a59aae4958e53d6283c55d73d72cce', uncertaintyPx: 10,
    westUpper: [[0,444],[100,522],[200,594],[300,668],[400,742],[500,814],[550,833]],
    westCenter: [[0,510],[100,593],[200,676],[300,754.5],[400,831]],
    eastUpper: [[1584,537],[1500,576],[1400,621],[1300,665],[1200,711],[1030,785]],
    eastCenter: [[1584,592],[1500,639.5],[1400,694.5],[1300,749.5],[1200,804]],
    plazaTip: [[650,851],[740,859],[820,856],[900,838]],
    outerWest: [[0,720],[100,807],[200,894],[239,935],[253,962],[243,993]],
    outerEast: [[1584,728],[1450,815],[1334,901],[1324,927],[1370,960],[1455,993]],
    crosswalks: [[[218,899],[552,823],[653,859],[269,974]],[[1006,789],[1364,876],[1332,928],[934,842]]],
    rearWheelbase: [[0,34.1],[250,51.1],[550,74.1]], eastWheelbase: [[1584,28.1],[1350,50.1],[950,71.6]], eastPathOffsetPx: -2,
  },
};

export function seasonalTraceY(trace, x) {
  const sorted = trace[0][0] < trace.at(-1)[0] ? trace : [...trace].reverse();
  const index = sorted.findIndex((p, i) => i < sorted.length - 1 && x <= sorted[i + 1][0]);
  const [a, b] = index < 0 ? sorted.slice(-2) : [sorted[index], sorted[index + 1]];
  return a[1] + (x - a[0]) * (b[1] - a[1]) / (b[0] - a[0]);
}

function atNativeX(points, x) {
  let low = 0, high = 1;
  for (let i = 0; i < 45; i++) {
    const t = (low + high) / 2;
    if (sampleRouteAtProgress(points, t).x * 15.84 > x) low = t; else high = t;
  }
  return (low + high) / 2;
}

export function createSeasonalTrafficCalibration(key) {
  const measured = AVALON_SEASONAL_ROADS[key];
  if (!measured) return null;
  const build = (view, xs, edge, center, wheelbases, referenceWheelbaseAtScale1) => {
    const measuredX = view === 'rear-west' ? [0,100,200,300,400] : [1200,1300,1400,1500,1584];
    const midpoints = measuredX.map(x => [x, (seasonalTraceY(edge, x) + seasonalTraceY(center, x)) / 2]);
    const meanX = midpoints.reduce((s,p) => s+p[0],0)/midpoints.length;
    const meanY = midpoints.reduce((s,p) => s+p[1],0)/midpoints.length;
    const slope = midpoints.reduce((s,p) => s+(p[0]-meanX)*(p[1]-meanY),0)/midpoints.reduce((s,p) => s+(p[0]-meanX)**2,0);
    const intercept = meanY-slope*meanX+(view==='front-garden' ? measured.eastPathOffsetPx || 0 : 0);
    // A straight independently fitted lane avoids steering a fixed camera-view
    // sprite through noisy trace knots. Safety still uses the raw measured edges.
    const points = [xs[0],xs.at(-1)].map(x => ({ x: x / 15.84, y: (intercept+slope*x) / 9.93 }));
    const sorted = [...wheelbases].sort((a, b) => b[0] - a[0]);
    const scales = [[xs[0], Math.max(12, seasonalTraceY(sorted, xs[0]))], ...sorted,
      [xs.at(-1), Math.max(12, seasonalTraceY(sorted, xs.at(-1)))]];
    return { id: `avalon-seasonal-d-${key.replace('/', '-').toLowerCase()}-${view}`, view,
      name: `${key} ${view} private calibration`, notes: 'Checkpoint D candidate; owner visual approval pending',
      status: 'CALIBRATED', direction: 'FORWARD', vehicle_classes: ['CAR', 'SUV', 'VAN'],
      speed_class: 'URBAN_SLOW', points, occlusion_segments: [],
      laneFit: { slope, intercept, maxResidualPx: Math.max(...midpoints.map(([x,y]) => Math.abs(y-intercept-slope*x))) },
      perspective: scales.map(([x, wheelbase]) => ({ t: x === xs[0] ? 0 : x === xs.at(-1) ? 1 : atNativeX(points, x), scale: wheelbase / referenceWheelbaseAtScale1 })),
      candidates: ['sedan-blue', 'suv-white', 'pickup-red', 'delivery-truck-brown'],
    };
  };
  const rear = build('rear-west', [1100,550,400,300,200,100,0,-350], measured.westUpper, measured.westCenter, measured.rearWheelbase, 99.66870711931195);
  const east = build('front-garden', [2100,1584,1500,1400,1300,1200,1030,-350], measured.eastUpper, measured.eastCenter, measured.eastWheelbase, 68.21149259716944);
  return { key, ...measured, roadPolygon: [...measured.westUpper, ...measured.plazaTip,
    ...[...measured.eastUpper].reverse(), ...measured.outerEast, ...[...measured.outerWest].reverse()],
    routes: [rear, east], options: Object.fromEntries([rear, east].map(r => [r.id, {
      offsets: [0], progressPerSecond: .018, startDelay: 0, vehicleClasses: ['CAR'], worldAspectRatio: 1584 / 993,
    }])) };
}
