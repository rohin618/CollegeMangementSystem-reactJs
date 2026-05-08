import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { execSync } from 'node:child_process';


// 🔐 Safe Git commit fetch
function getGitCommitId() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'no-git';
  }
}


// https://vitejs.dev/config/
export default defineConfig({
	base: '/', // <--- important
	plugins: [react(),  {
      name: 'html-build-meta',
      transformIndexHtml(html) {
        const timestamp = new Date().toISOString();
        const commitId = getGitCommitId();

        return `<!-- Build Time: ${timestamp} | Commit: ${commitId} -->\n${html}`;
      },
    },],
	optimizeDeps: {
		include: [
			'@tanstack/react-query',
			'@tanstack/react-query-devtools'
		]
	},
	build: {
		outDir: 'build'
	},
	css: {
		preprocessorOptions: {
			scss: {
				quietDeps: true,
			},
		},
	},
});
