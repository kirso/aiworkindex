/**
 * Common modern job title aliases mapped to SSOC codes.
 * Used for search — when someone types "product manager" we match them
 * to the relevant SSOC occupations even though MOM uses different titles.
 */
export const jobAliases: Record<string, string[]> = {
	'product manager': ['12222', '24211', '24313'],
	'project manager': ['24213', '24211'],
	'recruiter': ['24232', '24233'],
	'ux designer': ['21664'],
	'ui designer': ['21664', '21661'],
	'devops engineer': ['25231', '25232'],
	'scrum master': ['24211'],
	'data engineer': ['25211', '25212', '25220'],
	'product owner': ['12222', '24313'],
	'growth hacker': ['24314'],
	'content writer': ['26413'],
	'full stack developer': ['25121', '25122'],
	'frontend developer': ['25122', '25121'],
	'backend developer': ['25121', '25140'],
	'mobile developer': ['25122', '25123'],
	'qa engineer': ['25151'],
	'site reliability engineer': ['25232', '25231'],
	'technical writer': ['26413'],
	'business analyst': ['25112'],
	'solutions architect': ['25113'],
	'cloud engineer': ['25231'],
	'machine learning engineer': ['25220', '25121'],
	'ai engineer': ['25220', '25121'],
	'data analyst': ['25220', '24112'],
	'financial analyst': ['24131'],
	'management consultant': ['24211'],
	'hr manager': ['12121'],
	'operations manager': ['12112'],
	'marketing manager': ['12222'],
	'sales manager': ['12211'],
	'software developer': ['25121', '25122'],
	'software engineer': ['25121', '25122'],
	'web developer': ['25122', '25121'],
	'graphic designer': ['21661'],
	'interior designer': ['21662'],
	'accountant': ['24112'],
	'auditor': ['24112'],
	'lawyer': ['26112'],
	'nurse': ['22200', '32200'],
	'doctor': ['22110', '22143'],
	'pharmacist': ['22621'],
	'teacher': ['23300', '36100', '23622'],
	'lecturer': ['23101'],
	'chef': ['51201'],
	'cook': ['51201', '51202'],
	'barista': ['51322'],
	'waiter': ['51311', '51312'],
	'receptionist': ['42241'],
	'secretary': ['41201'],
	'personal assistant': ['41201'],
	'executive assistant': ['41201'],
	'copywriter': ['26413'],
	'journalist': ['26411'],
	'photographer': ['34310'],
	'videographer': ['26542'],
	'social media manager': ['24314', '12222'],
	'digital marketer': ['24314'],
	'seo specialist': ['24314'],
	'cybersecurity analyst': ['25232'],
	'security engineer': ['25232'],
	'network engineer': ['25231'],
	'database administrator': ['25211'],
	'system administrator': ['25231'],
	'it manager': ['13301'],
	'cto': ['13301'],
	'cio': ['13301'],
	'cso': ['13301'],
	'chief information officer': ['13301'],
	'chief technology officer': ['13301'],
	'chief security officer': ['13301'],
	'cfo': ['12111'],
	'chief financial officer': ['12111'],
	'ceo': ['11201'],
	'chief executive officer': ['11201'],
	'coo': ['11203'],
	'chief operating officer': ['11203'],
	'general manager': ['11203', '12112'],
	'managing director': ['11201'],
	'data scientist': ['25220', '21222'],
	'actuary': ['21213'],
	'statistician': ['21221'],
	'research scientist': ['21491'],
	'civil engineer': ['21421'],
	'mechanical engineer': ['21430'],
	'electrical engineer': ['21511'],
	'architect': ['21610'],
	'urban planner': ['21641'],
	'physiotherapist': ['22640'],
	'dentist': ['22611'],
	'psychologist': ['26341', '26343'],
	'social worker': ['26351'],
	'counsellor': ['26373', '26374'],
	'real estate agent': ['33340'],
	'property agent': ['33340'],
	'insurance agent': ['33211'],
	'financial planner': ['33211', '24121'],
	'wealth manager': ['24121'],
	'bank teller': ['42111'],
	'cashier': ['52301'],
	'retail assistant': ['14201'],
	'delivery driver': ['83211', '83212'],
	'logistics coordinator': ['33461'],
	'supply chain manager': ['13241'],
	'warehouse manager': ['13241'],
	'customer service': ['42245', '12241'],
	'call center agent': ['12242'],
	'customer success manager': ['12241', '24212'],
	'account executive': ['33211'],
	'account manager': ['12213', '12211'],
	'business intelligence analyst': ['25220'],
	'analytics engineer': ['25220', '25211'],
	'compliance manager': ['24132'],
	'fp&a analyst': ['24131'],
	'program manager': ['24213', '24211'],
	'programme manager': ['24213', '24211'],
	'sre': ['25232', '25231'],
	'platform engineer': ['25232', '25231'],
	'product designer': ['21664', '21632'],
	'ux researcher': ['21664'],
	'growth marketer': ['24314'],
	'performance marketer': ['24314'],
	'demand generation': ['24314', '24313'],
	'talent acquisition': ['24232', '24233'],
	'hr business partner': ['24231', '12121'],
	'people operations': ['12121', '24233'],
	'compensation analyst': ['24231'],
	'learning and development': ['24231'],
	'chief of staff': ['24213', '12112'],
	'strategy manager': ['24211', '24213'],
	'business operations': ['12112', '24211'],
	'treasury analyst': ['24134'],
	'privacy officer': ['24132'],
	'fraud analyst': ['24132', '24131'],
	'content designer': ['21664', '26413'],
	'technical support engineer': ['35121'],
	'test engineer': ['25151'],
	'prompt engineer': ['25121', '25220'],
	'venture capitalist': ['24133', '24131', '24211'],
	'vc': ['24133', '24131', '24211'],
	'solutions engineer': ['24331', '25113', '25121'],
	'operations analyst': ['21212', '24212', '12112'],
	'brand manager': ['12222', '24314', '24313'],
	'community manager': ['24314', '26413', '24212'],
	'sales engineer': ['24331', '25113', '25121'],
	'developer advocate': ['25121', '26413', '24314'],
	'developer relations': ['25121', '26413', '24314'],
	'devrel': ['25121', '26413', '24314'],
	'investment banker': ['24133', '24131', '24211'],
	'golf marshal': ['96255'],
	'golf caddie': ['96255'],
	'swimming pool attendant': ['96255'],
	'clinical nurse': ['22200'],
	'nurse educator': ['22200'],
	'enrolled nurse': ['32200'],
	'digital marketing': ['24314'],
	'ecommerce': ['24314'],
	'e-commerce': ['24314'],
	'social media marketing': ['24314'],
	'equities analyst': ['24131'],
	'credit analyst': ['24131'],
	'investment research analyst': ['24131'],
	'yoga instructor': ['34223'],
	'aerobics instructor': ['34223'],
	'fitness instructor': ['34223'],
	'personal trainer': ['34223'],
	'wedding planner': ['33320'],
	'event planner': ['33320'],
	'conference planner': ['33320'],
	'exhibition planner': ['33320'],
	'tax accountant': ['24113'],
	'robotics engineer': ['21413'],
	'automation engineer': ['21413'],
	'partnerships manager': ['12212', '24211', '12213'],
	'partner manager': ['12212', '24211', '12213'],
	'supply chain analyst': ['13241', '21212', '24212'],
	'ml engineer': ['25220', '25121', '25211'],
	'machine learning': ['25220', '25121'],
	'technical product manager': ['25112', '25121', '12222'],
	'technical pm': ['25112', '25121', '12222'],
	'people partner': ['24231', '12121', '24233'],
	'people ops': ['24231', '12121', '24233'],
	'revops manager': ['12211', '24212', '25112', '24111'],
	'revops': ['12211', '24212', '25112', '24111'],
	'revenue operations': ['12211', '24212', '25112', '24111'],
	'procurement manager': ['13242', '24211', '24212'],
	'procurement': ['13242', '24211', '24212'],
	'consultant': ['24211', '24212', '24213', '24314'],
	'investor': ['24121', '24131'],
	'investment': ['24121', '24131']
};

/**
 * Find alias matches for a search query.
 *
 * Matching strategy:
 * - Exact match: "cto" matches alias "cto" exactly
 * - Word-start match: "soft" matches "software developer" (starts with query)
 * - Contains match (query ≥ 4 chars): "account" matches "tax accountant"
 * - Reverse contains: "software developer" query matches "software" alias
 *
 * Short queries (< 4 chars) require exact or word-start match to prevent
 * false positives like "cto" matching "doctor".
 */
export function findAliasMatches(query: string): { alias: string; ssocs: string[] }[] {
	const q = query.trim().toLowerCase();
	if (!q || q.length < 2) return [];

	const matches: { alias: string; ssocs: string[] }[] = [];
	for (const [alias, ssocs] of Object.entries(jobAliases)) {
		// Exact match — always works
		if (alias === q) {
			matches.push({ alias, ssocs });
			continue;
		}

		// Word-start match: query matches the start of alias or any word in alias
		const aliasWords = alias.split(/\s+/);
		if (aliasWords.some(w => w.startsWith(q))) {
			matches.push({ alias, ssocs });
			continue;
		}

		// For longer queries (≥ 4 chars), allow substring matching in both directions
		if (q.length >= 4) {
			if (alias.includes(q) || q.includes(alias)) {
				matches.push({ alias, ssocs });
			}
		}
	}
	return matches;
}
