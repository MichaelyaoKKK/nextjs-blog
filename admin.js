(() => {
  const authPanel = document.querySelector('#auth-panel');
  const authForm = document.querySelector('#auth-form');
  const authTitle = document.querySelector('#auth-title');
  const setupHint = document.querySelector('#setup-hint');
  const editor = document.querySelector('#editor');
  const message = document.querySelector('#message');
  const logout = document.querySelector('#logout');
  const accountName = document.querySelector('#account-name');
  let content;
  let setupRequired = false;

  function feedback(text, ok = false) {
    message.textContent = text;
    message.classList.toggle('saved', ok);
  }
  async function api(path, method = 'GET', body) {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '操作失败');
    return result;
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }
  function field(labelText, name, value, multiline = false) {
    const label = node('label', '', labelText);
    const input = node(multiline ? 'textarea' : 'input');
    input.name = name;
    input.value = value;
    if (!multiline) input.maxLength = name === 'mark' ? 4 : name === 'category' ? 40 : 80;
    if (name === 'title') input.required = true;
    if (multiline) input.maxLength = 500;
    label.append(input);
    return label;
  }
  function photoPreview(container, item) {
    container.replaceChildren();
    if (item.image) {
      const image = node('img');
      image.src = item.image;
      image.alt = item.title;
      container.append(image);
    } else container.textContent = item.mark || '画';
  }
  function renderGroup(group) {
    const container = document.querySelector(`#${group}-list`);
    container.replaceChildren(...content[group].map((item, index) => {
      const panel = node('article', 'panel module');
      const preview = node('div', 'preview');
      photoPreview(preview, item);
      let draftImage = item.image;
      const form = node('form', 'module-fields');
      form.append(field('标题', 'title', item.title));
      const fields = node('div', 'fields');
      fields.append(field('分类', 'category', item.category), field('占位字', 'mark', item.mark));
      form.append(fields);
      if (group === 'daily') form.append(field('内容', 'description', item.description, true));
      const uploadLabel = node('label', '', '替换图片');
      const upload = node('input');
      upload.type = 'file';
      upload.accept = 'image/png,image/jpeg,image/webp';
      uploadLabel.append(upload);
      form.append(uploadLabel);
      const actions = node('div', 'module-actions');
      const save = node('button', '', '保存更改');
      save.type = 'submit';
      const remove = node('button', 'secondary', '移除图片');
      remove.type = 'button';
      remove.addEventListener('click', () => {
        draftImage = '';
        upload.value = '';
        photoPreview(preview, { ...item, image: draftImage });
        feedback('图片已在编辑器中移除，请点击“保存更改”完成保存。');
      });
      actions.append(save, remove);
      form.append(actions);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        save.disabled = true;
        feedback('正在保存…');
        try {
          const data = new FormData(form);
          const next = structuredClone(content);
          const edited = next[group][index];
          edited.title = String(data.get('title')).trim();
          edited.category = String(data.get('category')).trim();
          edited.mark = String(data.get('mark')).trim();
          edited.image = draftImage;
          if (group === 'daily') edited.description = String(data.get('description')).trim();
          const file = upload.files[0];
          if (file) {
            if (file.size > 3_000_000) throw new Error('图片不能超过 3 MB');
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('仅支持 PNG、JPEG 或 WebP');
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error('无法读取图片'));
              reader.readAsDataURL(file);
            });
            const uploaded = await api('/api/upload', 'POST', { mime: file.type, data: dataUrl.split(',')[1] });
            edited.image = uploaded.url;
          }
          await api('/api/content', 'POST', next);
          content = next;
          draftImage = edited.image;
          upload.value = '';
          photoPreview(preview, edited);
          feedback(`“${edited.title}”已保存。刷新网站即可看到更新。`, true);
        } catch (error) { feedback(error.message); }
        finally { save.disabled = false; }
      });
      panel.append(preview, form);
      return panel;
    }));
  }
  async function showEditor() {
    content = await api('/api/content');
    for (const group of ['preview', 'works', 'daily']) renderGroup(group);
    authPanel.hidden = true;
    editor.hidden = false;
    logout.hidden = false;
  }
  async function refreshSession() {
    const status = await api('/api/session');
    setupRequired = status.setupRequired;
    authTitle.textContent = setupRequired ? '创建管理员账户' : '管理员登录';
    authForm.querySelector('button').textContent = setupRequired ? '创建账户' : '登录';
    authForm.elements.password.autocomplete = setupRequired ? 'new-password' : 'current-password';
    setupHint.hidden = !setupRequired;
    if (status.authenticated) await showEditor();
    else { authPanel.hidden = false; editor.hidden = true; logout.hidden = true; }
  }
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(authForm);
    const username = String(data.get('username')).trim();
    const password = String(data.get('password'));
    try {
      await api(setupRequired ? '/api/setup' : '/api/login', 'POST', { username, password });
      accountName.textContent = username;
      feedback(setupRequired ? '管理员账户已创建。' : '登录成功。', true);
      authForm.reset();
      await refreshSession();
    } catch (error) { feedback(error.message); }
  });
  logout.addEventListener('click', async () => {
    await api('/api/logout', 'POST');
    accountName.textContent = '';
    feedback('已退出登录。', true);
    await refreshSession();
  });
  refreshSession().catch((error) => feedback(`无法连接内容管理服务：${error.message}。请使用 npm run start 启动网站。`));
})();
