(function () {
  function clean(value) {
    return (value || '').toString().replace(/\s+/g, ' ').trim();
  }

  function sectionName(element) {
    var current = element;
    while (current && current !== document.documentElement) {
      if (current.id) return current.id;
      var labelled = current.getAttribute && (current.getAttribute('aria-label') || current.getAttribute('data-section'));
      if (labelled) return clean(labelled);
      current = current.parentElement;
    }
    return '';
  }

  function hrefType(href) {
    if (!href) return 'none';
    if (href.indexOf('tel:') === 0) return 'phone';
    if (href.indexOf('mailto:') === 0) return 'email';
    if (href.indexOf('#') === 0) return 'anchor';
    try {
      var url = new URL(href, window.location.href);
      return url.hostname === window.location.hostname ? 'internal' : 'external';
    } catch (error) {
      return 'other';
    }
  }

  function labelFor(target) {
    var explicit = target.getAttribute('data-umami-event') || target.getAttribute('aria-label') || target.getAttribute('title');
    if (explicit) return clean(explicit);
    var img = target.querySelector && target.querySelector('img[alt]');
    if (img && img.alt) return clean(img.alt);
    return clean(target.innerText || target.textContent || target.href || target.tagName);
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest('a, button, [role="button"], [data-umami-event]');
    if (!target || !window.umami || typeof window.umami.track !== 'function') return;

    var href = target.getAttribute('href') || '';
    var type = hrefType(href);
    var label = labelFor(target).slice(0, 80) || target.tagName.toLowerCase();
    var eventName = 'click: ' + (type === 'none' ? 'button' : type) + ': ' + label;

    window.umami.track(eventName, {
      event_category: 'click',
      label: label,
      href: href,
      href_type: type,
      tag: target.tagName.toLowerCase(),
      section: sectionName(target),
      page_path: window.location.pathname,
      page_title: document.title,
      outbound: type === 'external'
    });
  }, true);
})();
