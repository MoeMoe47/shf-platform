// @ts-check
// Private presentation allocation only. The shared Traffic Engine owns movement.
// A model may change only at initial spawn, incompatible mapping, or off-screen
// lifecycle recycle. Eligibility/perspective/body clearance are owned by D/F.
/**
 * @param {{vehicles:any[], routes:any[], signatures:Map<string,string>, slots:Map<string,any>}} input
 * @returns {Map<string,string>}
 */
export function reconcileSeasonalFleetModels({ vehicles, routes, signatures, slots }) {
  for (const [key, slot] of slots) {
    if (signatures.get(slot.routeId) !== slot.signature) slots.delete(key);
  }
  const chosen = new Map(), occupied = new Set();
  const pending = [];
  for (const vehicle of vehicles) {
    const routeIndex = routes.findIndex(r => r.id === vehicle.routeId);
    const route = routes[routeIndex], signature = signatures.get(vehicle.routeId);
    if (!route?.eligibleModels?.length || !signature) throw Error('Missing verified seasonal model mapping');
    const previous = slots.get(vehicle.key);
    if (previous && previous.signature === signature && vehicle.progress >= previous.progress) {
      previous.progress = vehicle.progress;
      chosen.set(vehicle.key, previous.modelId); occupied.add(previous.modelId);
    } else pending.push({ vehicle, route, routeIndex, signature, previous });
  }
  // Selection must not depend on render depth or engine output order.
  pending.sort((a,b) => a.routeIndex-b.routeIndex || a.vehicle.key.localeCompare(b.vehicle.key));
  for (const { vehicle, route, routeIndex, signature, previous } of pending) {
    const models = route.eligibleModels;
    const start = previous?.signature === signature ? (previous.index+1)%models.length : routeIndex%models.length;
    const indexes = models.map((_,i) => (start+i)%models.length);
    const index = indexes.find(i => !occupied.has(models[i])) ?? start;
    const modelId = models[index];
    slots.set(vehicle.key, { routeId:route.id, signature, index, modelId, progress:vehicle.progress });
    chosen.set(vehicle.key, modelId); occupied.add(modelId);
  }
  return chosen;
}
