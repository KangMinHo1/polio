/**
 * 알림 기능 JS
 * 서버 API: /api/notifications
 */

document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    // 로그인하지 않은 경우 실행하지 않음
    if (!currentUser) return;

    const elements = {
        bellIcon: document.getElementById('bell-icon'),
        badge: document.getElementById('notification-badge'),
        listContainer: document.getElementById('notification-list'),
        itemsUl: document.getElementById('notification-items-container')
    };

    if (!elements.bellIcon || !elements.listContainer) return;

    // 알림 데이터 가져오기
    async function fetchNotifications() {
        try {
            // 서버에서 모든 알림(읽은 것 + 안 읽은 것)을 최신순으로 가져옵니다.
            const notifications = await app.api.fetchNotifications();
            // 읽지 않은 알림만 카운트 (JSON 필드명이 isRead 또는 read 일 수 있음)
            const unreadCount = notifications.filter(n => !(n.isRead || n.read)).length;
            updateBadge(unreadCount);
            renderNotifications(notifications);
        } catch (error) {
            console.error('알림 로드 실패:', error);
        }
    }

    // 뱃지 업데이트
    function updateBadge(count) {
        if (!elements.badge) return;
        
        if (count > 0) {
            elements.badge.textContent = count > 99 ? '99+' : count;
            elements.badge.style.display = 'flex';
            elements.badge.classList.add('show');
        } else {
            elements.badge.style.display = 'none';
            elements.badge.classList.remove('show');
        }
    }

    // 알림 목록 렌더링
    function renderNotifications(notifications) {
        if (!elements.itemsUl) return;

        if (notifications.length === 0) {
            elements.itemsUl.innerHTML = '<li class="notification-empty" style="padding:15px; text-align:center; color:#888;">새로운 알림이 없습니다.</li>';
            return;
        }

        elements.itemsUl.innerHTML = notifications.map(noti => {
            // 서버 응답에 따라 isRead 또는 read 필드 사용
            const isRead = noti.isRead || noti.read || false;
            
            return `
                <li class="notification-item ${isRead ? 'read' : 'unread'}" data-id="${noti.id}" data-post-id="${noti.postId}">
                    <div class="notification-content">
                        <div class="notification-message">${noti.message}</div>
                        <div class="notification-date">${app.utils.formatDate(noti.createdDate)}</div>
                    </div>
                </li>
            `;
        }).join('');

        // 클릭 이벤트 연결
        elements.itemsUl.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const notificationId = item.dataset.id;
                const postId = item.dataset.postId;

                // 읽지 않은 알림이라면 서버에 읽음 처리 요청
                if (notificationId && item.classList.contains('unread')) {
                    try {
                        await app.api.readNotification(notificationId);
                    } catch (error) {
                        console.error('알림 읽음 처리 실패:', error);
                    }
                }

                if (postId) {
                    // 클릭 시 해당 게시글로 이동
                    window.location.href = `post-detail.html?id=${postId}`;
                }
            });
        });
    }

    // 벨 아이콘 클릭 시 목록 토글
    elements.bellIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.listContainer.classList.toggle('show');
    });

    // 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (!elements.listContainer.contains(e.target) && !elements.bellIcon.contains(e.target)) {
            elements.listContainer.classList.remove('show');
        }
    });

    // 스타일 동적 추가 (읽지 않은 알림 강조)
    const style = document.createElement('style');
    style.innerHTML = `
        .notification-item { padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; }
        .notification-item:hover { background-color: #f9fafb; }
        .notification-item.unread { background-color: #eff6ff; } /* 읽지 않은 알림 연한 파란색 배경 */
        .notification-item.unread .notification-message { font-weight: 600; color: #111; }
        .notification-date { font-size: 0.8rem; color: #888; margin-top: 4px; }
        .notification-list.show { display: block; } /* 토글용 클래스 */
    `;
    document.head.appendChild(style);

    // 초기 로드 및 1분마다 갱신
    fetchNotifications();
    setInterval(fetchNotifications, 60000);
});