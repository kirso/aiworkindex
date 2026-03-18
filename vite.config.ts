import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5174
	},
	preview: {
		port: 4174
	},
	build: {
		chunkSizeWarningLimit: 1100,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('occupations.json')) return 'occupation-data';
				}
			}
		}
	}
});
