/* UEAB IMS - Layout Builder */

window.buildAppLayout = function(opts = {}) {
  const { active = '', title = '', breadcrumb = '' } = opts;

  const header = document.createElement('header');
  header.className = 'page-head';
  header.innerHTML = `
    <div>
      <h1>${title}</h1>
      ${breadcrumb ? `<div class="breadcrumb">${breadcrumb}</div>` : ''}
    </div>
    <div class="user-chip">
      <span class="name" id="user-name"></span>
      <button onclick="Auth.clear(); location.href='login.html'" class="btn btn-outline btn-sm">Logout</button>
    </div>
  `;

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="brand">UEAB IMS</div>
    <nav style="display: flex; flex-direction: column; gap: 4px;">
      <a href="dashboard.html" class="${active === 'dashboard.html' ? 'active' : ''}">Dashboard</a>
      <a href="report-lost.html" class="${active === 'report-lost.html' ? 'active' : ''}">Report Lost</a>
      <a href="report-found.html" class="${active === 'report-found.html' ? 'active' : ''}">Report Found</a>
      <a href="my-reports.html" class="${active === 'my-reports.html' ? 'active' : ''}">My Reports</a>
      <a href="search.html" class="${active === 'search.html' ? 'active' : ''}">Search</a>
      <a href="notifications.html" style="position:relative;">Notifications<span id="notif-badge" style="position:absolute;top:8px;right:8px;background:#dc3545;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;display:flex;align-items:center;justify-content:center;">3</span></a>
    </nav>
  `;

  const app = document.createElement('div');
  app.className = 'app';
  app.appendChild(sidebar);

  const mainEl = document.createElement('main');
  mainEl.className = 'main';
  mainEl.appendChild(header);

  const bodyChildren = Array.from(document.body.children);
  bodyChildren.forEach(child => {
    mainEl.appendChild(child);
  });

  app.appendChild(mainEl);
  document.body.innerHTML = '';
  document.body.appendChild(app);

  const user = Auth.getUser();
  if (user) {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) userNameEl.textContent = user.full_name;
  }
};

window.loadNotifBadge = async function() {
  try {
    const { count } = await API.unreadCount();
    const badge = document.getElementById('notif-badge');
    if (badge) badge.textContent = count;
  } catch (e) {}
};