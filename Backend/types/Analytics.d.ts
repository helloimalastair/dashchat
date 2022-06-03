declare interface AnalyticsCountries {
  [country: string]: number;
}

declare interface AnalyticsData {
  [room: string]: AnalyticsCountries;
}

declare interface AnalyticsDeliverable {
  room: string;
  data: AnalyticsCountries;
}