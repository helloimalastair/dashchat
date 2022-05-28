import type Room from ".";

export default async function analyticsUpdate(room: Room) {
  if(!room.ids.external) return false;
  const data: AnalyticsDeliverable = {
    room: room.ids.external,
    data: room.connections.reduce((a, b) => {
      if(b.location) a[b.location] = (a[b.location] || 0) + 1;
      return a;
    }, {} as AnalyticsCountries)
  };
  await room.env.ANALYTICS.get(room.env.ANALYTICS.idFromName("analytics")).fetch(new Request(JSON.stringify(data)));
  return true;
}