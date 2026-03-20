import siteStatusData from './site-status.json';
import releasesData from './releases.json';

export const siteStatus = siteStatusData;
export const releases = releasesData;

export type SiteStatus = typeof siteStatus;
export type SiteRelease = (typeof releases)[number];
