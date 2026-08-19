import siteStatusData from './site-status.json';
import releasesData from './releases.json';
import experimentalMethodology from './experimental-methodology-v43.json';

// The public site-status artifact is intentionally V9-only. This adapter keeps
// the archived V4.3 report renderable from its own frozen artifact without
// republishing archived model state as current release status.
const archivedExperimentalRelease = {
	version: experimentalMethodology.version,
	label: `${experimentalMethodology.version} archived shadow model`,
	status: experimentalMethodology.shadow_readiness.status,
	artifact: 'experimental-methodology-v43.json'
} as const;

export const siteStatus = {
	...siteStatusData,
	experimental_release: archivedExperimentalRelease
};
export const releases = releasesData;

export type SiteStatus = typeof siteStatus;
export type SiteRelease = (typeof releases)[number];
