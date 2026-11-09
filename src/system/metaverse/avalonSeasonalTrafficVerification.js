// @ts-check
// Pure, fail-closed calibration checks. Motion and lifecycle stay in the shared
// Traffic Engine. Dimensions are native artwork pixels, never world placement.
import { sampleRouteAtProgress, interpolatePerspectiveScale } from './traffic/metaverseTrafficAuthoringModel.js';
import { seasonalTraceY } from './avalonSeasonalTrafficCalibration.js';

export function seasonalVehicleBody(route, image, t) {
  const p = sampleRouteAtProgress(route.points, t);
  const scale = image.baseScale * interpolatePerspectiveScale(route.perspective, t);
  const axle = image.contacts[1].map((v,i) => v-image.contacts[0][i]);
  return [[0,-.3,-.075],[1,.3,-.075],[1,.3,.925],[0,-.3,.925]].map(([end,over,gauge]) =>
    image.contacts[end].map((v,i) => (i ? p.y*9.93 : p.x*15.84)+(v+axle[i]*over+image.gaugeVector[i]*gauge-image.anchor[i])*scale));
}

export function seasonalSpriteBounds(route, image, t) {
  const p = sampleRouteAtProgress(route.points, t), scale = image.baseScale*interpolatePerspectiveScale(route.perspective,t);
  const left=p.x*15.84-image.anchor[0]*scale, top=p.y*9.93-image.anchor[1]*scale;
  return { left, top, right:left+image.width*scale, bottom:top+image.height*scale };
}
export const seasonalBoundsVisible = b => b.right>0 && b.left<1584 && b.bottom>0 && b.top<993;

function inside([x,y], polygon) {
  let result=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) result=!result;
  }
  return result;
}
function pointDistance(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy);
}
function signedTraceDistance(p,trace) {
  const delta=.01, slope=(seasonalTraceY(trace,p[0]+delta)-seasonalTraceY(trace,p[0]-delta))/(2*delta);
  return (p[1]-seasonalTraceY(trace,p[0]))/Math.hypot(1,slope);
}
export function verifySeasonalRoute(route, calibration, image, samples=1600) {
  const findings=[];
  const assetNumbers=image?[image.width,image.height,image.baseScale,...(image.anchor||[]),...(image.gaugeVector||[]),...(image.contacts||[]).flat()]:[];
  if(!image || image.contacts?.length!==2 || image.gaugeVector?.length!==2 || image.anchor?.length!==2 || !assetNumbers.every(Number.isFinite) || image.baseScale<=0 || image.width<=0 || image.height<=0) return { enabled:false, findings:['ASSETS_UNAVAILABLE'], minCurb:0, minLane:0, maxHeading:180 };
  const options=calibration.options[route.id];
  if(options?.offsets?.length!==1 || options.offsets[0]!==0 || route.points.length!==2 || !route.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)) || !route.perspective.every(p=>Number.isFinite(p.t)&&p.t>=0&&p.t<=1&&Number.isFinite(p.scale)&&p.scale>0)) return {enabled:false,findings:['INVALID_ROUTE_OR_INITIAL_OFFSET'],minCurb:0,minLane:0,maxHeading:180};
  let minCurb=Infinity,minLane=Infinity,maxHeading=0;
  const curbs=calibration.roadPolygon.map((a,i)=>[a,calibration.roadPolygon[(i+1)%calibration.roadPolygon.length]])
    .filter(([a,b])=>!((a[0]===b[0]&&(a[0]===0||a[0]===1584))||(a[1]===993&&b[1]===993)));
  const axle=image.contacts[1].map((v,i)=>v-image.contacts[0][i]), axleAngle=Math.atan2(axle[1],axle[0])*180/Math.PI;
  const rear=route.view==='rear-west';
  const upper=rear?calibration.westUpper:calibration.eastUpper;
  const center=rear?calibration.westCenter:calibration.eastCenter;
  let witness=null,laneWitness=null,curbWitness=null,visibleBodySamples=0;
  for(let j=0;j<=samples;j++) {
    const t=j/samples, body=seasonalVehicleBody(route,image,t), sample=sampleRouteAtProgress(route.points,t);
    const angle=Math.atan2(route.points[1].y*9.93-route.points[0].y*9.93,route.points[1].x*15.84-route.points[0].x*15.84)*180/Math.PI;
    maxHeading=Math.max(maxHeading,Math.abs(((angle-axleAngle)%180+270)%180-90));
    const vertices=[...body];
    for(let k=0;k<4;k++) {
      const a=body[k],b=body[(k+1)%4];
      const divisions=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4));
      for(let d=1;d<divisions;d++) vertices.push([a[0]+(b[0]-a[0])*d/divisions,a[1]+(b[1]-a[1])*d/divisions]);
      for(const x of [0,1584,...calibration.roadPolygon.map(p=>p[0]),...center.map(p=>p[0])]) {
        const u=(x-a[0])/(b[0]-a[0]);if(u>0&&u<1)vertices.push([x,a[1]+u*(b[1]-a[1])]);
      }
      for(const y of [0,993]){const u=(y-a[1])/(b[1]-a[1]);if(u>0&&u<1)vertices.push([a[0]+u*(b[0]-a[0]),y]);}
    }
    for(const p of vertices) {
      if(p[0]<0||p[0]>1584||p[1]<0||p[1]>=993) continue;
      visibleBodySamples++;
      if(!inside([Math.max(.000001,Math.min(1584-.000001,p[0])),p[1]],calibration.roadPolygon)&&!findings.includes('BODY_OUTSIDE_ASPHALT')) {findings.push('BODY_OUTSIDE_ASPHALT');witness={t,point:p};}
      for(const [a,b]of curbs) { const distance=pointDistance(p,a,b); if(distance<minCurb){minCurb=distance;curbWitness={t,point:p};} }
      if(rear?p[0]<=400:p[0]>=1200) {const distance=Math.min(signedTraceDistance(p,upper),-signedTraceDistance(p,center));if(distance<minLane){minLane=distance;laneWitness={t,point:p};}}
    }
    if((t<=.03||t>=.97)&&seasonalBoundsVisible(seasonalSpriteBounds(route,image,t))&&!findings.includes('VISIBLE_ENDPOINT_FADE')) findings.push('VISIBLE_ENDPOINT_FADE');
    if(!Number.isFinite(sample.x)||!Number.isFinite(sample.y)) findings.push('INVALID_SAMPLE');
  }
  const required=calibration.uncertaintyPx+2;
  if(!visibleBodySamples)findings.push('NO_VISIBLE_JOURNEY');
  if(minCurb<required)findings.push('CURB_CLEARANCE');
  if(minLane<required)findings.push('LANE_CLEARANCE');
  if(maxHeading>8)findings.push('HEADING_MISMATCH');
  return {enabled:findings.length===0,minCurb,minLane,maxHeading,requiredClearancePx:required,findings,witness,laneWitness,curbWitness};
}

export function eligibleSeasonalCalibration(calibration, assets) {
  const results=calibration.routes.map(route=>({routeId:route.id, models:Object.fromEntries(route.candidates.map(id=>[id,verifySeasonalRoute(route,calibration,assets[id]?.[route.view])]))}));
  return {...calibration, results, routes:calibration.routes.map((route,i)=>({...route,
    eligibleModels:route.candidates.filter(id=>results[i].models[id].enabled)})).filter(route=>route.eligibleModels.length)};
}
