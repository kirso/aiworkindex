export type ReviewedCapabilityRelation = 'exactMatch' | 'closeMatch';

export interface ReviewedCapabilityMapping {
	ssoc2024: string;
	expected_ssoc_title: string;
	onet_soc_code: string;
	expected_onet_title: string;
	relation: ReviewedCapabilityRelation;
	reviewed_at: '2026-08-21';
	review_rationale: string;
}

/**
 * Human-reviewed detailed identities that the conservative contiguous-title rule cannot express.
 *
 * Every row must still be present in the official SSOC -> ISCO -> ESCO/O*NET candidate chain.
 * The builder verifies the code, titles and declared relation before publishing it. This file is
 * deliberately small: it is an audited allow-list, not a fuzzy-title exception mechanism.
 */
export const reviewedCapabilityMappings: readonly ReviewedCapabilityMapping[] = [
	{
		ssoc2024: '22200',
		expected_ssoc_title:
			'Registered nurse and related nursing professional (excluding enrolled nurse)',
		onet_soc_code: '29-1141.00',
		expected_onet_title: 'Registered Nurses',
		relation: 'exactMatch',
		reviewed_at: '2026-08-21',
		review_rationale:
			'The source occupation is the named registered-nurse component of this detailed SSOC occupation; enrolled nurses are explicitly excluded on both sides of the decision.'
	},
	{
		ssoc2024: '22621',
		expected_ssoc_title: 'Pharmacist (patient care)',
		onet_soc_code: '29-1051.00',
		expected_onet_title: 'Pharmacists',
		relation: 'closeMatch',
		reviewed_at: '2026-08-21',
		review_rationale:
			'The O*NET occupation is broader than the patient-care qualifier, but its pharmacist work identity contains the detailed SSOC role without changing occupation family.'
	},
	{
		ssoc2024: '22640',
		expected_ssoc_title: 'Physiotherapist',
		onet_soc_code: '29-1123.00',
		expected_onet_title: 'Physical Therapists',
		relation: 'exactMatch',
		reviewed_at: '2026-08-21',
		review_rationale:
			'Physiotherapist and Physical Therapist are the Singapore and United States titles for the same regulated therapy occupation.'
	},
	{
		ssoc2024: '24214',
		expected_ssoc_title: 'Sustainability project development/management professional',
		onet_soc_code: '13-1199.05',
		expected_onet_title: 'Sustainability Specialists',
		relation: 'closeMatch',
		reviewed_at: '2026-08-21',
		review_rationale:
			'The source role is the closest detailed sustainability-specialist identity and covers sustainability project development and management rather than a generic environmental occupation.'
	},
	{
		ssoc2024: '25111',
		expected_ssoc_title: 'Systems designer/analyst',
		onet_soc_code: '15-1211.00',
		expected_onet_title: 'Computer Systems Analysts',
		relation: 'closeMatch',
		reviewed_at: '2026-08-21',
		review_rationale:
			'The O*NET role matches the systems-analysis component and its design-and-analysis definition; no broader computer occupation is included.'
	},
	{
		ssoc2024: '25113',
		expected_ssoc_title: 'Enterprise/Solution/Software architect',
		onet_soc_code: '15-1299.08',
		expected_onet_title: 'Computer Systems Engineers/Architects',
		relation: 'exactMatch',
		reviewed_at: '2026-08-21',
		review_rationale:
			'The source detailed occupation explicitly covers computer systems architects, matching the architecture work named in the SSOC title and definition.'
	},
	{
		ssoc2024: '25213',
		expected_ssoc_title: 'Data engineer',
		onet_soc_code: '15-1243.01',
		expected_onet_title: 'Data Warehousing Specialists',
		relation: 'exactMatch',
		reviewed_at: '2026-08-21',
		review_rationale:
			'The source role covers the data-pipeline, storage and warehousing work that defines the detailed SSOC Data Engineer occupation; the unrelated database-administrator candidate is excluded.'
	}
] as const;
