window.APP_INITIALIZATION = (async () => {
  await new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  const loadPartial = async (placeholderId, filePath) => {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`${filePath} 로드 실패`);
      placeholder.innerHTML = await response.text();
    } catch (error) {
      console.error(error);
      placeholder.innerHTML = `<p style="color:red;text-align:center;">${placeholderId} 로드 실패</p>`;
    }
  };

  await Promise.all([
    loadPartial('header-placeholder', 'header.html'),
    loadPartial('footer-placeholder', 'footer.html')
  ]);
  
  await window.CommunityApp.initialize();
  console.log("CommunityApp 초기화 완료.");

  const chatNavButton = document.querySelector('#main-nav a[href="chat.html"]');
  if (chatNavButton) {
    if (!window.CommunityApp.state.user) {
      chatNavButton.style.display = 'none';
    }
  }

  const searchInput = document.getElementById('header-search-input');
  const searchButton = document.getElementById('header-search-button');

  if (searchInput && searchButton) {
    const performSearch = () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        window.location.href = `posts.html?search=${encodeURIComponent(searchTerm)}`;
      } else {
        window.CommunityApp.utils.showNotification('검색어를 입력해주세요.', 'warning');
      }
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  async function initializeNotificationBell() {
    const app = window.CommunityApp;
    if (!app.state.user) return;

    const elements = {
      bellIcon: document.getElementById('bell-icon'),
      badge: document.getElementById('notification-badge'),
      listContainer: document.getElementById('notification-list'),
      itemsUl: document.getElementById('notification-items-container')
    };

    if (!elements.bellIcon) return;

    async function renderNotificationList() {
      const notifications = await app.api.fetchNotifications(app.state.user.id);
      
      if (notifications.length === 0) {
        elements.itemsUl.innerHTML = '<li>새로운 알림이 없습니다.</li>';
        return;
      }

      elements.itemsUl.innerHTML = notifications.map(n => {
        const author = n.authorCategory ? `(${n.authorCategory}) ${n.authorId}` : n.authorId;
        const shortContent = n.content.length > 50 ? n.content.substring(0, 50) + '...' : n.content;
        
        return `
          <li>
            <a href="${n.link}" class="notification-item ${n.isRead ? '' : 'is-unread'}" data-notification-id="${n.id}">
              <div class="notification-item-content">
                <strong>${author}</strong>님이 회원님을 멘션했습니다: "${shortContent}"
              </div>
              <div class="notification-item-date">${app.utils.formatDate(n.createdAt)}</div>
            </a>
          </li>
        `;
      }).join('');
    }

    elements.bellIcon.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isListVisible = elements.listContainer.classList.toggle('show');

      if (isListVisible) {
        await renderNotificationList();
        await app.api.markNotificationsAsRead(app.state.user.id);
        app.ui.updateNotificationBadge(0);
      }
    });

    elements.itemsUl.addEventListener('click', (e) => {
      const item = e.target.closest('.notification-item');
      if (item) {
        elements.listContainer.classList.remove('show');
      }
    });

    document.addEventListener('click', (e) => {
      if (!elements.listContainer.contains(e.target) && !elements.bellIcon.contains(e.target)) {
        elements.listContainer.classList.remove('show');
      }
    });
  }

  // initializeNotificationBell(); // notification.js에서 처리하므로 중복 실행 방지
})();