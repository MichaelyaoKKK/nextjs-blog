(() => {
  if (location.protocol === 'file:') return;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function art(item, extraClass, labelText) {
    const card = element('article', `${extraClass} art ${item.theme}${item.image ? ' has-image' : ''}`);
    if (item.image) {
      const image = element('img', 'uploaded-image');
      image.src = item.image;
      image.alt = item.title;
      image.loading = 'lazy';
      card.append(image);
    }
    card.append(element('span', 'art-mark', item.mark));
    if (labelText) card.append(element('span', 'art-label', labelText));
    return card;
  }

  function render(data) {
    const preview = document.querySelector('.mini-gallery');
    const works = document.querySelector('.bento');
    const daily = document.querySelector('.daily-list');
    preview.replaceChildren(...data.preview.map((item) => art(item, 'mini-art', item.title)));
    works.replaceChildren(...data.works.map((item, index) => art(item, `work${index === 0 ? ' tall' : index === 3 ? ' wide' : ''}`, `${item.title} · ${item.category}`)));
    daily.replaceChildren(...data.daily.map((item) => {
      const card = element('article', 'daily-card');
      const image = art(item, 'daily-image');
      const body = element('div', 'daily-body');
      const copy = element('div');
      copy.append(element('h3', '', item.title), element('p', '', item.description));
      const link = element('a', '', '回到作品预览');
      link.href = '#top';
      body.append(copy, link);
      card.append(image, body);
      return card;
    }));
    if (window.gsap && window.ScrollTrigger) {
      gsap.utils.toArray('.work, .daily-card').forEach((item) => gsap.fromTo(item, { opacity: .25, scale: .88 }, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 88%', end: 'bottom 30%', scrub: .6 } }));
    }
  }

  fetch('/api/content', { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error('内容服务不可用'); return response.json(); })
    .then(render)
    .catch(() => { /* 静态预览仍可直接使用。 */ });
})();
