import { SITE } from './scoring-constants';

interface RankingItem {
	title: string;
	ssoc: string;
}

interface FaqItem {
	question: string;
	answer: string;
}

export function buildItemListJsonLd(
	name: string,
	description: string,
	items: RankingItem[]
): string {
	return `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name,
		description,
		numberOfItems: items.length,
		itemListElement: items.slice(0, 10).map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.title,
			url: SITE.url + '/occupation/' + item.ssoc
		}))
	})}<\/script>`;
}

export function buildFaqJsonLd(items: FaqItem[]): string {
	return `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map(item => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	})}<\/script>`;
}
