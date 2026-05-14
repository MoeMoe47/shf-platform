export function centerCamera(globeRef) {

  if (!globeRef.current) return;

  globeRef.current.pointOfView(
    {
      lat: 39.9612,
      lng: -82.9988,
      altitude: 1.7
    },
    0
  );

}
