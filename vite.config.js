import { writeFileSync } from 'node:fs';

// 每次 build 產生新的版本號：寫進程式（__BUILD_ID__）也寫成 version.json
// 遊戲會定期比對兩者，不一致就跳「有新版本」提醒
const BUILD_ID = Date.now().toString(36);

export default {
  base: './',                 // 讓遊戲部署在任何子路徑（如 GitHub Pages）都能載入
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    {
      name: 'gecko-version-file',
      closeBundle() {
        writeFileSync('dist/version.json', JSON.stringify({ v: BUILD_ID }));
      },
    },
  ],
};
