/**
 * layout.js
 * 모든 페이지의 공통 레이아웃(헤더, 푸터)을 동적으로 로드하고
 * 앱의 전역 초기화를 담당합니다.
 */

window.APP_INITIALIZATION = (async () => {
  await new Promise(resolve => {
    if (document.readyState === 'loading') { //만약 로딩중이라면 
      document.addEventListener('DOMContentLoaded', resolve); // 문서가 모두 준비되었을때 resolve 함수 실행
    } else { //이미 로딩이 완료되었다면 resolve 함수 실행
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

  //헤더 푸터 로드
  await Promise.all([
    loadPartial('header-placeholder', 'header.html'),
    loadPartial('footer-placeholder', 'footer.html')
  ]);
  
  // CommunityApp의 핵심 기능이 먼저 초기화될 때까지 기다립니다.
  await window.CommunityApp.initialize();
  console.log("CommunityApp 초기화 완료.");

  // --- 검색 기능 ---
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

  // ✅ [추가] 알림 벨 기능 초기화
  async function initializeNotificationBell() {
    const app = window.CommunityApp;
    if (!app.state.user) return; // 로그인 안 했으면 실행 안 함

    const elements = {
      bellIcon: document.getElementById('bell-icon'),
      badge: document.getElementById('notification-badge'),
      listContainer: document.getElementById('notification-list'),
      itemsUl: document.getElementById('notification-items-container')
    };

    if (!elements.bellIcon) return;

    // 1. 알림 목록 렌더링
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

    // 2. 벨 아이콘 클릭 이벤트
    elements.bellIcon.addEventListener('click', async (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      const isListVisible = elements.listContainer.classList.toggle('show');

      if (isListVisible) {
        // 목록을 열 때: 
        // 1. 목록을 다시 렌더링하고 (새 알림 확인)
        await renderNotificationList();
        // 2. API를 호출하여 모든 알림을 "읽음"으로 처리
        await app.api.markNotificationsAsRead(app.state.user.id);
        // 3. UI의 배지를 0으로 업데이트
        app.ui.updateNotificationBadge(0);
      }
    });

    // 3. 알림 아이템 클릭 시 페이지 이동 (이벤트 위임)
    elements.itemsUl.addEventListener('click', (e) => {
      const item = e.target.closest('.notification-item');
      if (item) {
        // 링크 기본 동작(페이지 이동)을 막지 않고 그대로 둡니다.
        // 드롭다운 메뉴를 닫습니다.
        elements.listContainer.classList.remove('show');
      }
    });

    // 4. 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!elements.listContainer.contains(e.target) && !elements.bellIcon.contains(e.target)) {
        elements.listContainer.classList.remove('show');
      }
    });

    // 5. 초기 알림 배지 업데이트 (shared.js의 initialize()에서도 호출됨)
    // app.ui.updateNotificationBadge(); // (shared.js에서 이미 호출)
  }

  // --- 알림 기능 실행 ---
  initializeNotificationBell();

})();