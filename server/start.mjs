import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 8787);
createApp().listen(port, '127.0.0.1', () => {
  process.stdout.write(`Alisa 网站已启动：http://127.0.0.1:${port}\n`);
});
