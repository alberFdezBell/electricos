// SPA History API Client Router

// Global fetch interceptor to automatically handle 401 Unauthorized redirects
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);
  if (response.status === 401) {
    window.location.href = '/login';
  }
  return response;
};

const routes = {
  '/': () => loadLandingView(),
  '/plantilla': () => loadPlantillaView(),
  '/calendario': () => loadCalendarioView(),
  '/carteles': () => loadCartelesView(),
  '/directo': () => loadDirectoEspectadorView(),
  '/partido-en-directo': () => loadPartidoDirectoControlView()
};

function navigateTo(url) {
  window.history.pushState({}, '', url);
  handleRouting();
}

function handleRouting() {
  const path = window.location.pathname;

  // Active navigation highlight
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Dynamic match page routing: /partidos/:competicion/jornada-:jornada/:slug
  if (path.startsWith('/partidos/')) {
    if (path.endsWith('/partido-en-directo')) {
      if (typeof loadPartidoDirectoControlView === 'function') {
        loadPartidoDirectoControlView();
      }
    } else {
      if (typeof loadPartidoDetalleView === 'function') {
        loadPartidoDetalleView();
      }
    }
    return;
  }

  const routeHandler = routes[path] || routes['/'];
  routeHandler();
}

window.addEventListener('popstate', handleRouting);

document.addEventListener('DOMContentLoaded', () => {
  // Global click listener for internal link interception
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-link]');
    if (link) {
      e.preventDefault();
      navigateTo(link.getAttribute('href'));
    }
  });

  handleRouting();
});
