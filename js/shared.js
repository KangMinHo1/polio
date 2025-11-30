window.CommunityApp = {
  state: {
    posts: [],
    users: [],
    categories: [],
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
            if (userId === authorUser.name) continue;
            const userExists = users.some(u => u.name === userId);
            if (userExists) {
                mentionedUserIds.add(userId);
            }
        }
        for (const userId of mentionedUserIds) {
            const notificationData = { id: Date.now() + Math.random(), targetUserId: userId, authorId: authorUser.name, authorCategory: authorUser.role, content: content, link: link, isRead: false, createdAt: Date.now() };
            await window.CommunityApp.api.createNotification(notificationData);
        }
    }
  },

  api: {
    BASE_URL: 'http://localhost:8080',

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
            return null;
        }

        return response.json();
    },


    async fetchPosts() {
      return this.request('/api/posts');
    }
    ,async fetchPostById(postId) {
      return this.request(`/api/posts/${postId}`);
    },
    async fetchAllUsers() {
      return this.request('/api/users');
    },
    async deleteUser(userName) {
      return this.request(`/api/admin/users/${userName}`, { method: 'DELETE' });
    },
    async updateUserRole(userName, newRole) {
      return this.request(`/api/admin/users/${userName}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
    },
    async createPost(postData) {
      return this.request('/api/posts', { method: 'POST', body: JSON.stringify(postData) });
    },
    async updatePost(postId, updatedData) {
      return this.request(`/api/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(updatedData) });
    },
    async loginUser(email, password) {
        const response = await this.request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response && response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
            
            const user = await this.request('/api/me');
            
            window.CommunityApp.state.user = user; // 사용자의 정보 로컬에 저장하기

            localStorage.setItem('user', JSON.stringify(user)); 

            return user;
        }
        throw new Error('로그인에 실패했습니다.');
    },
    async signupUser(userData) {
      const { id, ...signupData } = userData;
      return this.request('/api/signup', { method: 'POST', body: JSON.stringify(signupData) });
    },
    async deletePost(postId) {
      const response = await fetch(`${this.BASE_URL}/api/posts/${postId}`, { method: 'DELETE', headers: this.getAuthHeaders() });
      if (!response.ok) { throw new Error('게시글 삭제에 실패했습니다.'); }
      return null;
    },
    async fetchComments(postId) {
      return this.request(`/api/posts/${postId}/comments`);
    },
    async createComment(postId, commentData) {
       const response = await fetch(`${this.BASE_URL}/api/posts/${postId}/comments`, { method: 'POST', headers: this.getAuthHeaders(), body: JSON.stringify(commentData) });
       if (!response.ok) { throw new Error('댓글 생성에 실패했습니다.'); }
       return null;
    },
    async deleteComment(commentId) {
        const response = await fetch(`${this.BASE_URL}/api/comments/${commentId}`, { method: 'DELETE', headers: this.getAuthHeaders() });
        if (!response.ok) { throw new Error('댓글 삭제에 실패했습니다.'); }
        return null;
    },
    async fetchChatMessages() {
      const rooms = await this.request('/chat/rooms');
      if (rooms && rooms.length > 0) {
        return this.request(`/chat/room/${rooms[0].id}/messages`);
      }
      return [];
    },
    async sendChatMessage(messageData) {
      console.warn("sendChatMessage should be handled by WebSocket.");
      return messageData;
    },
    async toggleLike(postId) {
        return this.request(`/api/posts/${postId}/like`, { method: 'POST' });
    },
    async getMyStacks() {
      return this.request('/api/members/me/stacks');
    },
    async fetchAllTechStacks() {
      return this.request('/api/tech-stacks');
    },
    async updateMyStacks(stackNames) {
      return this.request('/api/members/me/stacks', { method: 'PUT', body: JSON.stringify({ stackNames: stackNames }) });
    },
    async fetchAllComments() {
      return this.request('/api/comments');
    },
    async getStacksByUserName(userName) {
      return this.request(`/api/members/${userName}/stacks`);
    },
    async fetchPopularTechStacks() {
      return this.request('/api/stats/tech-stacks/popular');
    },
    async getPostStatsByCategory() {
      return this.request('/api/stats/posts-by-category');
    }
    ,async fetchMyChatRooms() {
      return this.request('/chat/rooms');
    }
    ,async findOrCreate1on1Room(targetMemberId) {
      const requestBody = { targetMemberId: targetMemberId };
      return this.request('/chat/room/1on1', { method: 'POST', body: JSON.stringify(requestBody) });
    }
  },

  ui: {
    updateLoginStatus() {
      const userActions = document.getElementById('user-actions');
      if (!userActions) return;
      const user = window.CommunityApp.state.user;
      if (user && typeof user === 'object' && user.name) {
        // 기본적으로 로그아웃 버튼을 생성합니다.
        let userActionsHTML = `<button id="logout-button" class="btn btn--ghost">로그아웃</button>`;

        // ✅ [추가] 로그인한 사용자의 역할이 '관리자'일 경우, '관리자 페이지' 링크를 추가합니다.
        if (user.role === '관리자') {
          const adminLinkHTML = `<a href="admin.html" class="nav-btn">관리자</a>`;
          // 관리자 링크를 로그아웃 버튼 앞에 추가합니다.
          userActionsHTML = adminLinkHTML + userActionsHTML;
        }
        userActions.innerHTML = userActionsHTML;
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton && !logoutButton.dataset.listenerAttached) {
             logoutButton.addEventListener('click', async () => { 
                try {
                    await window.CommunityApp.api.request('/api/logout', { method: 'POST' });
                } catch (error) {
                    console.error("Logout failed on server:", error);
                } finally {
                    localStorage.removeItem('user'); 
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('refreshTokenExpirationMs');
                    window.CommunityApp.state.user = null; 
                    window.CommunityApp.utils.showNotification('로그아웃되었습니다.', 'info'); 
                    setTimeout(() => window.location.href = 'mainview.html', 1000); 
                }
             });
             logoutButton.dataset.listenerAttached = 'true';
        }
      } else {
        userActions.innerHTML = `<a class="nav-btn" href="signup.html">회원가입</a><a class="nav-btn btn--login" href="login.html">로그인</a>`;
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
      else {
        // 서버 통신 오류로 인해 임시 비활성화
        // const notifications = await window.CommunityApp.api.fetchNotifications(window.CommunityApp.state.user.id); 
        // unreadCount = notifications.filter(n => !n.isRead).length; 
      }
      if (unreadCount > 0) { badge.textContent = unreadCount > 9 ? '9+' : unreadCount; badge.classList.add('show'); }
      else { badge.classList.remove('show'); }
    }
  },

  async initialize() {
    const savedUser = localStorage.getItem('user'); 
    if (savedUser) {
        this.state.user = JSON.parse(savedUser);
    } else { this.state.user = null; }

    if (localStorage.getItem('accessToken')) {
        try {
            const userInfo = await this.api.request('/api/me');
            this.state.user = userInfo;
            localStorage.setItem('user', JSON.stringify(userInfo));
        } catch (e) {
            console.error("Failed to fetch user info with token, logging out.", e);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('refreshTokenExpirationMs');
            localStorage.removeItem('user');
            this.state.user = null;
        }
    }

    const savedTheme = localStorage.getItem('isDarkMode') === 'true';
    this.state.isDarkMode = savedTheme;
    document.documentElement.classList.toggle('dark', savedTheme);


    try {
      const response = await this.api.request("/api/posts/categorys");
      this.state.categories = response.categorys;
    } catch(e) {
      console.error("Failed to load categories", e);
      this.state.categories = [];
    }

    try {
      const posts = await this.api.fetchPosts();
      this.state.posts = posts.map(post => ({
        id: post.postId, 
        author: post.authorName,
        createdAt: post.createDate,
        likes: post.likesCount,
        isLiked: post.isLiked || false, // isLiked가 없는 경우를 대비하여 기본값 설정
        ...post // 나머지 서버 응답 속성들을 그대로 복사
      }));
    } catch(e) {
      console.error("Failed to load posts", e);
      this.state.posts = [];
    }

    try {
      const usersFromServer = await this.api.fetchAllUsers();
      this.state.users = usersFromServer.map(user => {
        return {
          id: user.id,
          name: user.name,
          role: user.role || '사용자',
          memberStack: user.memberStack || []
        };
      });
    } catch (e) {
      console.warn("Failed to load all users. This might be due to permissions.", e.message);
      this.state.users = [];
    }

    this.ui.updateLoginStatus();
    this.ui.updateActiveNav();

    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget && !this.state.user) {
      chatWidget.style.display = 'none';
    }

    if (this.state.user) {
      this.ui.updateNotificationBadge().catch(e => console.error("Failed to update notification badge", e));
    }

    document.dispatchEvent(new CustomEvent('app-data-loaded'));

    console.log('CommunityApp initialized.');
  },
};