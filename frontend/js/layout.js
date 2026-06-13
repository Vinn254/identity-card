/* =================================================================
     UEAB IMS - Sidebar / app layout for dashboard pages
     ================================================================= */

function buildAppLayout({ active, title, breadcrumb }) {
  const user = Auth.getUser();
  if (!user) {
    location.href = 'login.html';
    return;
  }

  const isAdmin = user.role === 'admin';

  const links = [
    { href: 'dashboard.html', label: 'Dashboard' },
    { href: 'report-lost.html', label: 'Report Lost' },
    { href: 'report-found.html', label: 'Report Found' },
    { href: 'search.html', label: 'Search Documents' },
    { href: 'notifications.html', label: 'Notifications', badgeId: 'notif-badge' },
    { href: 'my-reports.html', label: 'My Reports' },
    ...(isAdmin ? [{ href: 'admin.html', label: 'Admin Dashboard' }] : []),
  ];

  // Get main content and wrap it
  const main = document.querySelector('main.main');
  if (main) {
    main.innerHTML = `
      <div class="page-head">
        <div>
          <h1>${title}</h1>
          ${breadcrumb ? `<div class="breadcrumb">${breadcrumb}</div>` : ''}
        </div>
        <div class="user-chip">
          <div>
            <div class="name">${user.full_name}</div>
            <div class="role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
          </div>
          <div class="avatar">${initials(user.full_name)}</div>
        </div>
      </div>
      ${main.innerHTML}
    `;
  }

  // Create wrapper for sidebar + main
  const wrapper = document.createElement('div');
  wrapper.className = 'app';
  
  // Move existing body content (except sidebar-slot) into wrapper
  const toMove = [];
  Array.from(document.body.children).forEach(child => {
    if (child.id !== 'sidebar-slot') toMove.push(child);
  });
  
  // Insert sidebar first, then main content
  wrapper.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">UEAB</div>
        <div>
          <div class="brand-name">UEAB IMS</div>
          <div style="font-size:11px;color:#9bb; font-weight:400;">Lost &amp; Found</div>
        </div>
      </div>
      ${links.map(l => `
        <a href="${l.href}" class="${active === l.href ? 'active' : ''}">
          <span>${l.label}</span>
          ${l.badgeId ? `<span class="badge badge-pending" id="${l.badgeId}" style="display:none">0</span>` : ''}
        </a>
      `).join('')}
      <div class="spacer"></div>
      <a href="#" id="logout-link" class="logout">
        <span>↩</span><span>Logout</span>
      </a>
    </aside>
  `;
  
  // Move content into wrapper
  toMove.forEach(child => wrapper.appendChild(child));
  
  // Clear body and add wrapper
  while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
  document.body.appendChild(wrapper);

  document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clear();
    location.href = 'index.html';
  });
}

async function loadNotifBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  try {
    const { count } = await API.unreadCount();
    badge.style.display = count > 0 ? 'inline-block' : 'none';
    badge.textContent = count;
  } catch (e) { /* silent */ }
}