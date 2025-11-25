/**
 * CommunityApp - Shared JavaScript
 */
window.CommunityApp = { // ◀ 최상위 객체
  //로그인 시 정보가 채워짐 => 사용자의 정보 저장하기 (서버는 영구적으로 저장하는 반면에 서버의 부담을 줄이기 위해 캐시 같은 역할로 사용)
  //데이터를 저장하는 '객체' ==> 임시저장소 페이지를 이동하면 초기화 됌
  state: {
    posts: [], // 전체 게시글 목록
    // ✅ [역할 변경] 앱 전역에서 사용될 모든 사용자의 기본 정보(id, name, role 등)를 담는 캐시.
    // - 관리자 페이지: 사용자 관리 목록으로 사용.
    // - 게시글/프로필 페이지: 작성자의 역할(role) 등 부가 정보를 표시하는 데 사용.
    users: [],
    categories: [], //게시글의 카테고리 목록 (서버에서 받아와 채워짐)
    user: null, //로그인한 사용자의 정보           localStorage  
    isDarkMode: false,                           //localStorage
  },

  //utils: 유용한 함수들을 모아놓은 '객체'
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
    //이 함수는 특정 이벤트(예: 검색어 입력, 창 크기 조절)가 짧은 시간 안에 너무 많이 발생하는 것을 막아주는 역할을 합니다.
    debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },
    //화면 우측 상단에 잠시 나타났다가 사라지는 작은 알림 창을 보여주는 함수입니다
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

    //사용자가 글 내용에 @사용자ID 형식으로 다른 사람을 언급(멘션)했을 때, 이를 감지하여 해당 사용자에게 알림을 보내는 복잡한 로직을 처리합니다
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
            // ✅ [수정] authorUser.category 대신 authorUser.role을 사용합니다.
            const notificationData = { id: Date.now() + Math.random(), targetUserId: userId, authorId: authorUser.name, authorCategory: authorUser.role, content: content, link: link, isRead: false, createdAt: Date.now() };
            await window.CommunityApp.api.createNotification(notificationData);
        }
    }
  },

  //api: 서버 통신 함수들을 모아놓은 '객체'
  api: {
    // --- API 기본 설정 ---
    BASE_URL: 'http://localhost:8080',

    //서버에 API 요청을 보낼 때 필요한 "인증서"가 포함된 HTTP 헤더를 만드는 역할을 합니다.
    getAuthHeaders() {
        const token = localStorage.getItem('accessToken'); 
        const headers = { 'Content-Type': 'application/json' }; //내가 보내는 데이터는 JSON 형식이야 라고 서버에 알려주는 역할을 합니다.
        if (token) {  // 로그인된 사람이라면 headers 객체에 'Authorization'이라는 속성(토큰)을 추가.
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    //url 인수로 받은 후 서버에 실제로 API 요청을 보내고 응답을 역직렬화하여 반환하는 함수
    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        };

        const response = await fetch(url, config); //url로 API 요청

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: '알 수 없는 서버 오류가 발생했습니다.' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return null; // 내용이 없는 성공적인 응답 처리
        }

        return response.json();   //응답(Response)의 본문 → JavaScript 객체
    },


    // --- 실제 API 호출 함수들 --- 반환 타입이 Promis 객체이기 떄문에 후 처리 응답을 받은 후 필요
    async fetchPosts() { //게시물 전체 목록 조회
      return this.request('/api/posts');
    },
    async fetchPostById(postId) { // ✅ [추가] 단일 게시물 조회
      return this.request(`/api/posts/${postId}`);
    },
    // ✅ [수정] 백엔드에서 List<ResponseUserDataDto>를 반환합니다.
    // ResponseUserDataDto: { id, name, role, memberStack }
    async fetchAllUsers() {
      return this.request('/api/admin/users');
    },
    async createPost(postData) {
      return this.request('/api/posts', { method: 'POST', body: JSON.stringify(postData) });
    },
    async updatePost(postId, updatedData) {
      return this.request(`/api/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(updatedData) });
    },
    async loginUser(email, password) {
        const response = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response && response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
            // ✅ [수정] refreshToken과 만료 시간도 함께 저장합니다.
            if (response.refreshToken) {
                localStorage.setItem('refreshToken', response.refreshToken);
            }
            if (response.refreshTokenExpirationMs) {
                localStorage.setItem('refreshTokenExpirationMs', response.refreshTokenExpirationMs);
            }
            
            // 로그인 성공 후, /me API를 호출하여 실제 사용자 정보를 가져옵니다.
            // 이 요청에는 위에서 저장한 accessToken이 자동으로 포함됩니다.

            const user = await this.request('/me'); // 로그인한 사용자의 name, role, memberStack의 정보가 담김
            
            window.CommunityApp.state.user = user; // 사용자의 정보 로컬에 저장하기

            //JavaScript 객체 → JSON 텍스트
            //{"name":"admin","role":"admin"}' 이라는 텍스트로 변환하여 저장
            localStorage.setItem('user', JSON.stringify(user)); 

            return user; //사용자의 정보를 객체로 리턴
        }
        throw new Error('로그인에 실패했습니다.');
    },
    async signupUser(userData) {
      // API 명세서에 id 필드가 없으므로 제거하고 요청합니다.
      const { id, ...signupData } = userData;
      return this.request('/signup', { method: 'POST', body: JSON.stringify(signupData) });
    },
    async deletePost(postId) {
      return this.request(`/api/posts/${postId}`, { method: 'DELETE' });
    },
    async fetchComments(postId) {
      return this.request(`/api/posts/${postId}/comments`);
    },
    async createComment(postId, commentData) { // ✅ [수정] postId를 별도 인자로 받습니다.
       // ✅ [수정] 댓글 생성 API는 JSON이 아닌 텍스트를 반환하므로, request 함수를 직접 사용하지 않고 fetch를 사용합니다.
       const response = await fetch(`${this.BASE_URL}/api/posts/${postId}/comments`, { method: 'POST', headers: this.getAuthHeaders(), body: JSON.stringify(commentData) });
       if (!response.ok) { throw new Error('댓글 생성에 실패했습니다.'); }
       return null; // 성공 시 null 반환
    },
    async deleteComment(commentId) {
        // ✅ [수정] 댓글 삭제 API는 텍스트를 반환하므로, JSON 파싱을 시도하지 않도록 fetch를 직접 사용합니다.
        const response = await fetch(`${this.BASE_URL}/api/comments/${commentId}`, { method: 'DELETE', headers: this.getAuthHeaders() });
        if (!response.ok) { throw new Error('댓글 삭제에 실패했습니다.'); }
        return null; // 성공 시 null 반환
    },
    async fetchChatMessages() {
      // 실제 채팅방 목록 조회 후 roomId를 동적으로 가져와야 합니다.
      const rooms = await this.request('/chat/rooms');
      if (rooms && rooms.length > 0) {
        return this.request(`/chat/room/${rooms[0].id}/messages`);
      }
      return []; // 채팅방이 없으면 빈 배열 반환
    },
    async sendChatMessage(messageData) {
      // WebSocket 로직으로 처리되어야 함. 여기서는 REST API가 아님.
      console.warn("sendChatMessage should be handled by WebSocket.");
      // 실제로는 WebSocket을 통해 메시지를 보내야 합니다.
      return messageData; // 시뮬레이션을 위해 임시로 반환
    },
    async toggleLike(postId) {
        return this.request(`/api/posts/${postId}/like`, { method: 'POST' });
    },
    async getMyStacks() {
      return this.request('/members/me/stacks'); // 내 스택을 가져오는 API
    },
    async getStacksByUserName(userName) { // ✅ [추가] 사용자 이름으로 기술 스택을 가져오는 API
      return this.request(`/api/members/${userName}/stacks`);
    }
  },

  ui: {
    updateLoginStatus() { //로그인 상태에 따라 헤더의 오른쪽 상단 메뉴를 변경합니다.
      const userActions = document.getElementById('user-actions');
      if (!userActions) return;
      const user = window.CommunityApp.state.user; // name, role
      if (user && typeof user === 'object' && user.name) {
        const userDisplay = `(${user.role}) ${user.name}님`;
        // ✅ [수정] 'admin' 대신 백엔드에서 받은 한글 역할명 '관리자'와 비교합니다.
        const adminButtonHTML = user.role === '관리자' ? `<a class="nav-btn" href="admin.html">관리자</a>` : '';
        userActions.innerHTML = `${adminButtonHTML}<a id="user-display-link" class="nav-btn" href="profile.html?user=${user.name}">${userDisplay}</a><button id="logout-button" class="btn btn--ghost">로그아웃</button>`;
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
                    // [수정] refreshToken 관련 정보도 모두 삭제합니다.
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
      else {
        // 서버 통신 오류로 인해 임시 비활성화
        // const notifications = await window.CommunityApp.api.fetchNotifications(window.CommunityApp.state.user.id); 
        // unreadCount = notifications.filter(n => !n.isRead).length; 
      }
      if (unreadCount > 0) { badge.textContent = unreadCount > 9 ? '9+' : unreadCount; badge.classList.add('show'); }
      else { badge.classList.remove('show'); }
    }
  },

  //설정 초기화 함수 (생성자 같은 기능)
  async initialize() {
    // (빠른 UI 표시를 위해) 일단 localStorage에 저장된 사용자 정보로 state를 채웁니다.
    const savedUser = localStorage.getItem('user'); 
    if (savedUser) {
        this.state.user = JSON.parse(savedUser); //JSON 텍스트 → JavaScript 객체 (역직렬화)
    } else { this.state.user = null; }

    // 로그인 토큰이 존재한다면, 항상 서버에 최신 사용자 정보를 요청하여 데이터를 동기화합니다.
    // 이렇게 하면 관리자가 역할을 변경했을 때도 새로고침 시 즉시 반영됩니다.
    if (localStorage.getItem('accessToken')) {
        try {
            // 서버에서 받은 최신 정보로 state와 localStorage를 모두 덮어씁니다.
            const userInfo = await this.api.request('/me');
            this.state.user = userInfo;
            localStorage.setItem('user', JSON.stringify(userInfo));
        } catch (e) {
            console.error("Failed to fetch user info with token, logging out.", e);
            // 토큰이 유효하지 않다면 모든 로그인 정보를 깨끗하게 지웁니다.
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('refreshTokenExpirationMs');
            localStorage.removeItem('user');
            this.state.user = null;
        }
    }

    // 다크모드 정보 
    const savedTheme = localStorage.getItem('isDarkMode') === 'true';
    this.state.isDarkMode = savedTheme;
    document.documentElement.classList.toggle('dark', savedTheme);


    try {
      // 로그인 여부와 상관없이 카테고리 데이터를 항상 불러옴
      // ✅ [수정] 백엔드 컨트롤러의 @GetMapping("categorys")와 일치하도록 URL을 수정합니다.
      const response = await this.api.request("/api/posts/categorys");
      // ✅ [수정] 응답 객체에서 'categorys' 배열을 추출하여 state에 저장합니다.
      this.state.categories = response.categorys;
    } catch(e) {
      console.error("Failed to load categories", e);
      this.state.categories = []; // 실패 시 빈 배열로 초기화
    }

    try {
      // 게시글 전체 목록을 불러와 app.state.posts에 저장합니다.
      const posts = await this.api.fetchPosts();
      // ✅ [수정] 백엔드 DTO 필드명을 프론트엔드에서 사용하는 필드명으로 변환합니다.
      // - createDate -> createdAt
      // - likesCount -> likes
      this.state.posts = posts.map(post => ({
        ...post,
        createdAt: post.createDate,
        likes: post.likesCount 
      }));
    } catch(e) {
      console.error("Failed to load posts", e);
      this.state.posts = []; // 실패 시 빈 배열로 초기화
    }

    // ✅ [추가] 관리자 또는 프로필 페이지에서 사용하기 위해 모든 사용자 정보를 미리 불러옵니다.
    try {
      // 이 API는 관리자 권한이 필요할 수 있으므로, 실패하더라도 앱 실행에 영향을 주지 않도록 처리합니다.
      const usersFromServer = await this.api.fetchAllUsers();
      // ✅ [수정] 백엔드에서 @JsonValue를 통해 이미 한글 역할명(e.g., "취준생")을 반환하므로,
      // 불필요한 switch 변환 로직을 제거하고 받은 값을 그대로 사용합니다.
      this.state.users = usersFromServer.map(user => {
        return {
          id: user.id,
          name: user.name,
          role: user.role || '사용자', // 서버에서 받은 값을 그대로 사용
          memberStack: user.memberStack || []
        };
      });
    } catch (e) {
      console.warn("Failed to load all users. This might be due to permissions.", e.message);
      this.state.users = [];
    }

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

    // ✅ [추가] 모든 핵심 데이터 로딩이 완료되었음을 알리는 이벤트를 발생시킵니다.
    // 각 페이지(write.js, posts.js 등)는 이 이벤트를 수신하여 UI를 렌더링합니다.
    document.dispatchEvent(new CustomEvent('app-data-loaded'));

    console.log('CommunityApp initialized.');
  },
};