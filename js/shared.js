/**
 * CommunityApp - Shared JavaScript
 */
window.CommunityApp = {
  state: {
    posts: [],
    users: [],
    categories: ['공지', '프론트엔드', '백엔드', 'UX/UI 디자인', '데이터 분석', '기타'],
    user: null,
    isDarkMode: false,
  },

  utils: {
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = (now - date) / 1000;
      if (diff < 60) return '방금 전';
      if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
      return date.toLocaleDateString('ko-KR');
    },
    debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },
    showNotification(message, type = 'info') {
      document.querySelectorAll('.notification').forEach(n => n.remove());
      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.textContent = message;
      Object.assign(notification.style, {
        position: 'fixed', top: '20px', right: '20px', padding: '1rem',
        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
        borderLeft: `4px solid var(--color-${type}, var(--color-primary))`,
        borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '1001', transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: 'translateX(100%)', opacity: '0',
      });
      document.body.appendChild(notification);
      setTimeout(() => {
        Object.assign(notification.style, { transform: 'translateX(0)', opacity: '1' });
      }, 10);
      setTimeout(() => {
        Object.assign(notification.style, { transform: 'translateX(100%)', opacity: '0' });
        notification.addEventListener('transitionend', () => notification.remove());
      }, 3000);
    },
    async parseMentionsAndCreateNotifications(content, link, authorUser) {
        const users = await window.CommunityApp.api.fetchAllUsers();
        const mentions = content.match(/@(\w+)/g);
        if (!mentions) return;
        const mentionedUserIds = new Set();
        for (const mention of mentions) {
            const userId = mention.substring(1);
            if (userId === authorUser.id) continue;
            const userExists = users.some(u => u.id === userId);
            if (userExists) {
                mentionedUserIds.add(userId);
            }
        }
        for (const userId of mentionedUserIds) {
            const notificationData = { id: Date.now() + Math.random(), targetUserId: userId, authorId: authorUser.id, authorCategory: authorUser.category, content: content, link: link, isRead: false, createdAt: Date.now() };
            await window.CommunityApp.api.createNotification(notificationData);
        }
    }
  },

  api: {
    // --- API 기본 설정 ---
    BASE_URL: 'http://localhost:8080',

    // --- 인증 및 요청 헬퍼 ---
    getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: '알 수 없는 서버 오류가 발생했습니다.' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return null; // 내용이 없는 성공적인 응답 처리
        }

        return response.json();
    },

    // --- 실제 API 호출 함수들 ---

    async fetchPosts() {
      return this.request('/posts');
    },
    async createPost(postData) {
      return this.request('/posts', { method: 'POST', body: JSON.stringify(postData) });
    },
    async updatePost(postId, updatedData) {
      return this.request(`/posts/${postId}`, { method: 'PUT', body: JSON.stringify(updatedData) });
    },
    async loginUser(email, password) {
        const response = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response && response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
            // 백엔드에서 /me 같은 엔드포인트를 만들어 사용자 정보를 반환받아야 합니다.
            // 임시로 email을 id로 사용합니다.
            const user = { id: email.split('@')[0], email: email, name: '사용자', category: '미지정', role: 'user' }; // 이 부분은 /me API 응답으로 대체되어야 합니다.
            return user;
        }
        throw new Error('로그인에 실패했습니다.');
    },
    async fetchAllUsers() {
      return this.request('/users');
    },
    async signupUser(userData) {
      // API 명세서에 id 필드가 없으므로 제거하고 요청합니다.
      const { id, ...signupData } = userData;
      return this.request('/signup', { method: 'POST', body: JSON.stringify(signupData) });
    },
    async toggleUserMentorStatus(userId) {
        return this.request(`/admin/users/${userId}/toggle-mentor`, { method: 'POST' });
    },
    async updateUserCategory(userId, newCategory) {
        return this.request(`/admin/users/${userId}/category`, { method: 'PUT', body: JSON.stringify({ category: newCategory }) });
    },
    async deleteUser(userId) {
      return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
    },
    async deletePost(postId) {
      return this.request(`/posts/${postId}`, { method: 'DELETE' });
    },
    async fetchComments(postId) {
      return this.request(`/posts/${postId}/comments`);
    },
    async fetchAllComments() {
      // 모든 댓글을 한번에 가져오는 API는 성능상 좋지 않으므로, 필요 시 백엔드에 페이지네이션을 적용한 API를 요청해야 합니다.
      // 여기서는 기존 로직을 유지하기 위해 임시로 posts.js 등에서 개별적으로 호출하도록 둡니다.
      console.warn("fetchAllComments is deprecated. Fetch comments per post.");
      return [];
    },
    async createComment(commentData) {
       return this.request(`/posts/${commentData.postId}/comments`, { method: 'POST', body: JSON.stringify(commentData) });
    },
    async updateComment(commentId, newContent) {
        return this.request(`/comments/${commentId}`, { method: 'PUT', body: JSON.stringify({ content: newContent }) });
    },
    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, { method: 'DELETE' });
    },
    async fetchChatMessages() {
      // API 명세에 따라 수정
      // 예: GET /chat/room/{roomId}/messages
      // 이 함수를 호출하는 곳에서 roomId를 받아야 합니다.
      console.warn("fetchChatMessages requires a roomId.");
      return [];
    },
    async sendChatMessage(messageData) {
      // WebSocket 로직으로 처리되어야 함. 여기서는 REST API가 아님.
      console.warn("sendChatMessage should be handled by WebSocket.");
    },
    async fetchNotifications(userId) {
        return this.request(`/notifications`);
    },
    async createNotification(notificationData) {
        return this.request('/notifications', { method: 'POST', body: JSON.stringify(notificationData) });
    },
    async markNotificationsAsRead(userId) {
        return this.request('/notifications/read', { method: 'POST' });
    },
    async upvoteComment(commentId, userId) {
        return this.request(`/comments/${commentId}/upvote`, { method: 'POST' });
    },
    async selectBestComment(postId, commentId) {
        return this.request(`/posts/${postId}/comments/${commentId}/best`, { method: 'POST' });
    },
    async markPostAsResolved(postId) {
        return this.request(`/posts/${postId}/resolve`, { method: 'POST' });
    },
    async markAsHired(postId) {
        return this.request(`/posts/${postId}/hired`, { method: 'POST' });
    },
    async revertHired(postId) {
        return this.request(`/posts/${postId}/revert-hired`, { method: 'POST' });
    },
    async addInsightPost(postId, userId) {
        return this.request(`/posts/${postId}/insight`, { method: 'POST' });
    },
    async addInsightComment(commentId, userId) {
        return this.request(`/comments/${commentId}/insight`, { method: 'POST' });
    },
    async toggleBookmark(postId, userId) {
        return this.request(`/posts/${postId}/bookmark`, { method: 'POST' });
    },
    async getMentorStatusList() {
        return this.request('/mentors/online');
    },
    async setMentorStatus(userId, isOnline) {
        return this.request('/mentors/status', { method: 'POST', body: JSON.stringify({ isOnline }) });
    },
    async getOnlineMentors() {
        return this.request('/mentors/online');
    },

    async fetchMentorApplications() {
        return this.request('/admin/mentor-applications');
    },

    async createMentorApplication(userId) {
        return this.request('/mentors/apply', { method: 'POST' });
    },

    async updateMentorApplicationStatus(userId, newStatus) {
        return this.request(`/admin/mentor-applications/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    },

    async updateMentorResume(userId, resumeData) {
        return this.request('/resumes', { method: 'PUT', body: JSON.stringify(resumeData) });
    },

    // ✅ [수정] 트렌드 분석 로직 (feedbackTags 집계 수정)
    async calculatePortfolioTrends() {
      return this.request('/trends');
    }
  },

  ui: {
    updateLoginStatus() {
      const userActions = document.getElementById('user-actions');
      if (!userActions) return;
      const user = window.CommunityApp.state.user;
      if (user && typeof user === 'object' && user.id) { // category는 없을 수 있음
        const userDisplay = `(${user.category}) ${user.id}님`;
        const adminButtonHTML = user.role === 'admin' ? `<a class="nav-btn" href="admin.html">관리자</a>` : '';
        userActions.innerHTML = `${adminButtonHTML}<a id="user-display-link" class="nav-btn" href="profile.html?user=${user.id}">${userDisplay}</a><button id="logout-button" class="btn btn--ghost">로그아웃</button>`;
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton && !logoutButton.dataset.listenerAttached) {
             logoutButton.addEventListener('click', async () => { 
                try {
                    await window.CommunityApp.api.request('/logout', { method: 'POST' });
                } catch (error) {
                    console.error("Logout failed on server:", error);
                } finally {
                    localStorage.removeItem('user'); 
                    localStorage.removeItem('accessToken');
                    window.CommunityApp.state.user = null; 
                    window.CommunityApp.utils.showNotification('로그아웃되었습니다.', 'info'); 
                    setTimeout(() => window.location.href = 'mainview.html', 1000); 
                }
             });
             logoutButton.dataset.listenerAttached = 'true';
        }
      } else {
        userActions.innerHTML = `<a class="nav-btn" href="signup.html">회원가입</a><a class="nav-btn btn--login" href="login.html">로그인</a>`;
        if (window.CommunityApp.state.user) {
             console.warn("Invalid user object found, logging out:", window.CommunityApp.state.user);
             window.CommunityApp.state.user = null;
             localStorage.removeItem('user'); localStorage.removeItem('accessToken');
        }
      }
    },
    updateActiveNav() {
      const navLinks = document.querySelectorAll('#main-nav .nav-btn');
      if (navLinks.length === 0) return;
      const currentPage = window.location.pathname.split('/').pop() || 'mainview.html';
      navLinks.forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) { link.classList.add('active'); }
        else if (currentPage.startsWith('posts.html') && linkHref.startsWith('posts.html')) { link.classList.add('active'); }
        else if (currentPage.startsWith('trends.html') && linkHref.startsWith('trends.html')) { link.classList.add('active'); }
        else if (currentPage === 'mainview.html' && linkHref === 'mainview.html') { link.classList.add('active'); }
      });
    },
    async updateNotificationBadge(forceCount = null) {
      if (!window.CommunityApp.state.user) return;
      const badge = document.getElementById('notification-badge');
      if (!badge) return;
      let unreadCount = 0;
      if (forceCount !== null) { unreadCount = forceCount; }
      else { const notifications = await window.CommunityApp.api.fetchNotifications(window.CommunityApp.state.user.id); unreadCount = notifications.filter(n => !n.isRead).length; }
      if (unreadCount > 0) { badge.textContent = unreadCount > 9 ? '9+' : unreadCount; badge.classList.add('show'); }
      else { badge.classList.remove('show'); }
    }
  },

  async initialize() {
    // 1. Load User State
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        this.state.user = JSON.parse(savedUser);
    } else { this.state.user = null; }

    // 토큰이 있으면 사용자 정보 다시 가져오기 (페이지 새로고침 시 정보 동기화)
    if (localStorage.getItem('accessToken') && !this.state.user) {
        try {
            // 백엔드에 /me 엔드포인트가 필요합니다.
            const userInfo = await this.api.request('/me');
            this.state.user = userInfo;
            localStorage.setItem('user', JSON.stringify(userInfo));
        } catch (e) {
            console.error("Failed to fetch user info with token, logging out.", e);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            this.state.user = null;
        }
    }

    // 2. Load Theme
    const savedTheme = localStorage.getItem('isDarkMode') === 'true';
    this.state.isDarkMode = savedTheme;
    document.documentElement.classList.toggle('dark', savedTheme);

    // 3. Load Core Data (이제 각 페이지에서 필요 시 로드)
    // try { this.state.posts = await this.api.fetchPosts(); } catch(e) { console.error("Failed to load posts", e); this.state.posts = []; }
    // try { this.state.users = await this.api.fetchAllUsers(); } catch(e) { console.error("Failed to load users", e); this.state.users = []; }

    // 4. Update UI
    this.ui.updateLoginStatus();
    this.ui.updateActiveNav();

    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget && !this.state.user) {
      chatWidget.style.display = 'none';
    }

    // 5. Update Notification Badge
    if (this.state.user) {
      this.ui.updateNotificationBadge().catch(e => console.error("Failed to update notification badge", e));
    }

    console.log('CommunityApp initialized.');
  },
};