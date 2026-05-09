const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-menu-toggle]');

const currentFile = window.location.pathname.split('/').pop() || 'index.html';
document.body.classList.add('is-loaded');

nav?.querySelectorAll('a[href]').forEach((link) => {
  const href = link.getAttribute('href') || '';
  const linkFile = href.split('#')[0].split('/').pop() || 'index.html';
  const isHome = currentFile === 'index.html' && (href === './' || href === 'index.html');
  if (linkFile === currentFile || isHome) {
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
  }
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  const url = new URL(href, window.location.href);
  const sameOrigin = url.origin === window.location.origin;
  const isLocalPage = sameOrigin && url.pathname.endsWith('.html');
  const isSamePageHash = url.pathname === window.location.pathname && url.hash;
  const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target;

  if (!modified && isLocalPage && !isSamePageHash) {
    event.preventDefault();
    document.body.classList.add('is-leaving');
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 170);
  }
});

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    nav.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('scroll', () => {
  header?.classList.toggle('is-compact', window.scrollY > 24);
}, { passive: true });
