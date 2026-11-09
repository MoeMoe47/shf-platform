// @ts-check
import React, { useMemo, useRef } from 'react';
import assets from 'virtual:avalon-phase3h-vehicles';
import useMetaverseTrafficAllRoutesReview from '@/hooks/metaverse/useMetaverseTrafficAllRoutesReview.js';
import { createTrafficContinuitySignatures } from '@/system/metaverse/traffic/metaverseTrafficContinuity.js';
import { createSeasonalTrafficCalibration } from '@/system/metaverse/avalonSeasonalTrafficCalibration.js';
import { eligibleSeasonalCalibration } from '@/system/metaverse/avalonSeasonalTrafficVerification.js';
import { seasonalTrafficPreviewAllowed } from '@/system/metaverse/avalonSeasonalTrafficPreview.js';
import { reconcileSeasonalFleetModels } from '@/system/metaverse/avalonSeasonalFleetModels.js';
import { createAvalonG3Schedule } from '@/system/metaverse/avalonTrafficG3Scheduler.js';
import TrafficVehicleMarker from './traffic/TrafficVehicleMarker.jsx';

const EMPTY_ROUTES=[],EMPTY_OPTIONS={};
export default function AvalonSeasonalTrafficLayer({ background, environment, reducedMotion, compactViewport }) {
  const allowed=seasonalTrafficPreviewAllowed({isDev:import.meta.env.DEV,search:window.location.search,background});
  const key=`${background.seasonalSeason}/${background.resolvedTimeOfDay}`;
  const calibration=useMemo(()=>allowed?eligibleSeasonalCalibration(createSeasonalTrafficCalibration(key),assets):null,[allowed,key]);
  const routes=calibration?.routes || EMPTY_ROUTES,options=calibration?.options || EMPTY_OPTIONS;
  const g3=useMemo(()=>{
    if(!allowed || !routes.length) return null;
    const schedule=createAvalonG3Schedule(routes);
    const slotActivation=new Map();
    const routeOptions={};

    for(const route of routes){
      const entries=schedule.get(route.id);
      if(!entries?.length) continue;
      for(const entry of entries){
        slotActivation.set(entry.key,entry.activateAtSeconds);
      }
      routeOptions[route.id]={
        ...options[route.id],
        offsets:entries.map(()=>0),
        startDelay:0,
      };
    }

    return {slotActivation,routeOptions};
  },[allowed,routes,options]);

  const fleetOptions={enabled:allowed&&routes.length>0,reducedMotion,
    vehicleCountPerRoute:3,
    slotActivation:g3?.slotActivation ?? null,
    routeSource:routes,routeOptions:g3?.routeOptions ?? options,allowCalibrated:true,preserveCompatibleRoutes:true,
    playing:environment.playback.playing&&!environment.playback.freeze,
    quality:compactViewport?'Low':environment.playback.quality};
  const traffic=useMetaverseTrafficAllRoutesReview(fleetOptions);
  const signatures=useMemo(()=>createTrafficContinuitySignatures(routes,options),[routes,options]);
  const slots=useRef(new Map());
  const modelIds=reconcileSeasonalFleetModels({vehicles:traffic.renderedVehicles,routes,signatures,slots:slots.current});
  const vehicles=traffic.renderedVehicles.map(v=>{
    const route=routes.find(r=>r.id===v.routeId);
    const modelId=modelIds.get(v.key),image=assets[modelId][route.view];
    // Existing marker's ground-coordinate convention; no image rotation,
    // independent x/y distortion or global fleet-size factor is introduced.
    return {...v,x:v.x*1584/1670,y:v.y*993/942,modelId,
      pngPresentation:{...image,view:route.view,imageScale:image.baseScale*v.scale}};
  }).sort((a,b)=>a.y-b.y);
  if(!allowed)return null;
  return <div className="met-living-layer" data-seasonal-traffic-scene={key}
    data-seasonal-traffic-state={routes.length?'VERIFIED_FOR_PRIVATE_REVIEW':'WITHHELD'}
    data-withheld-route-count={(calibration?.results.length||0)-routes.length} data-intersection-controls="OFF"
    data-traffic-behavior="BLOCKED_UNVERIFIED_STOP_GEOMETRY"
    aria-hidden="true" style={{pointerEvents:'none',zIndex:4,overflow:'hidden'}}>
    <svg viewBox="0 0 1584 993" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
      {vehicles.map(vehicle=><TrafficVehicleMarker key={vehicle.key} vehicle={vehicle} timeOfDay={background.resolvedTimeOfDay}/>)}
    </svg>
  </div>;
}
