/**
 * home.js (mainview.html의 스크립트)
 * 홈페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;

  const app = window.CommunityApp;

  function renderProfileSummary() {
    const card = document.getElementById('profile-summary-card');
    const userText = document.getElementById('profile-welcome-user');
    const profileButton = document.getElementById('profile-goto-button');
    
    if (app.state.user && card && userText && profileButton) {
      userText.textContent = `(${app.state.user.category}) ${app.state.user.id}님`;
      profileButton.href = `profile.html?user=${encodeURIComponent(app.state.user.id)}`;
      card.style.display = 'block';
    } else if (card) {
      card.style.display = 'none';
    }
  }

  // 온라인 멘토 렌더링 함수
  async function renderOnlineMentors() {
    const card = document.getElementById('online-mentor-card');
    const listEl = document.getElementById('online-mentor-list');
    if (!card || !listEl) return;
    
    try {
        const mentors = await app.api.getOnlineMentors();
        
        if (mentors.length === 0) {
            listEl.innerHTML = '<li style="font-size: 0.9rem; color: var(--text-secondary); padding: 0.5rem;">지금 활동 중인 멘토가 없습니다.</li>';
        } else {
            listEl.innerHTML = mentors.map(mentor => {
                let badgeHTML = '';
                if (mentor.badge) {
                    const isRocket = mentor.badge.includes('🚀');
                    badgeHTML = `<span class="mentor-badge ${isRocket ? 'mentor-rocket' : ''}">${mentor.badge}</span>`;
                } else {
                    // 배지가 없는 멘토 (예: 카테고리만 있는 경우)
                    badgeHTML = `<span class="mentor-badge">(${mentor.category})</span>`;
                }

                // 멘토 ID만 표시 (카테고리는 배지에 포함됨)
                const mentorIdDisplay = mentor.badge ? mentor.id : `(${mentor.category}) ${mentor.id}`;
                
                return `
                    <li>
                        <a href="profile.html?user=${encodeURIComponent(mentor.id)}" class="online-mentor-item" title="${mentor.id} 프로필 보기">
                            <span class="quick-link-icon">🟢</span>
                            <div class="mentor-info">
                                <span class="mentor-id">${mentor.id}</span>
                                ${badgeHTML}
                            </div>
                        </a>
                    </li>
                `;
            }).join('');
        }
        card.style.display = 'block'; // 데이터 로드 후 카드 표시
    } catch (error) {
        console.error("Error fetching online mentors:", error);
        listEl.innerHTML = '<li style="font-size: 0.9rem; color: var(--text-secondary); padding: 0.5rem;">멘토 목록을 불러오는 데 실패했습니다.</li>';
        card.style.display = 'block';
    }
  }

  function renderPopularPosts() {
    const popularPostList = document.querySelector('.card-grid--solid');
    if (!popularPostList) return;
    const topPostsByLikes = [...app.state.posts]
      .filter(post => post.category !== '공지' && post.postType !== 'casestudy')
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 4);
    if (topPostsByLikes.length === 0) {
        popularPostList.innerHTML = `<p style="grid-column: 1 / -1; color: var(--text-secondary); text-align: center; padding: 1rem;">인기 포트폴리오가 없습니다.</p>`;
        return;
    }
    popularPostList.innerHTML = topPostsByLikes.map(post => `
      <a href="posts.html#post-${post.id}" class="grid-item" title="${post.title}">${post.title}</a>
    `).join('');
  }
  
  function renderLatestNotices() {
    const noticeList = document.getElementById('notice-list');
    if (!noticeList) return;
    const notices = app.state.posts.filter(post => post.category === '공지');
    const latestNotices = notices
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
    if (latestNotices.length === 0) {
        noticeList.innerHTML = `<li style="padding: 0.75rem; color: var(--text-secondary);">공지사항이 없습니다.</li>`;
        return;
    }
    noticeList.innerHTML = latestNotices.map((notice, index) => `
      <a href="posts.html#post-${notice.id}" style="text-decoration: none; color: inherit;">
        <li class="notice-item ${index < 2 ? 'is-important' : ''}">
          <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${notice.title}">${notice.title}</div>
          <div class="notice-date" style="flex-shrink: 0;">${app.utils.formatDate(notice.createdAt)}</div>
        </li>
      </a>
    `).join('');
  }

  function renderImportantPosts() {
    const importantPostList = document.getElementById('home-important-post-list');
    if (!importantPostList) return;
    const importantPosts = app.state.posts.filter(post => post.isImportant === true && post.category !== '공지');
    const latestImportantPosts = importantPosts
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
    if (latestImportantPosts.length === 0) {
      importantPostList.innerHTML = `<li style="padding: 1rem 0; color: var(--text-secondary);">추천 포트폴리오가 없습니다.</li>`;
      return;
    }
    importantPostList.innerHTML = latestImportantPosts.map(post => `
      <li class="post-item" data-post-id="${post.id}" onclick="location.href='posts.html#post-${post.id}'">
        <div class="post-item-title">[${post.category}] ${post.title}</div>
        <div class="post-item-meta">
          <span>(${post.authorCategory || '사용자'}) ${post.author}</span> •
          <span>${app.utils.formatDate(post.createdAt)}</span> •
          <span>조회 ${post.views || 0}</span>
        </div>
      </li>
    `).join('');
  }
  
  function renderLatestPosts() {
    const postList = document.getElementById('home-post-list');
    if (!postList) return;
    const latestPosts = app.state.posts
        .filter(post => post.category !== '공지' && post.postType === 'feedback')
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
    if (latestPosts.length === 0) {
        postList.innerHTML = `<li style="padding: 1rem 0; color: var(--text-secondary);">최신 피드백 요청이 없습니다.</li>`;
        return;
    }
    postList.innerHTML = latestPosts.map(post => `
      <li class="post-item" data-post-id="${post.id}" onclick="location.href='posts.html#post-${post.id}'">
        <div class="post-item-title">[${post.category}] ${post.title}</div>
        <div class="post-item-meta">
           <span>(${post.authorCategory || '사용자'}) ${post.author}</span> •
          <span>${app.utils.formatDate(post.createdAt)}</span> •
          <span>조회 ${post.views || 0}</span>
        </div>
      </li>
    `).join('');
  }
  
  function renderLatestCaseStudies() {
    const caseStudyList = document.getElementById('home-casestudy-list');
    if (!caseStudyList) return; 
    const latestCaseStudies = app.state.posts
        .filter(post => post.postType === 'casestudy')
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
    if (latestCaseStudies.length === 0) {
        caseStudyList.innerHTML = `<li style="padding: 1rem 0; color: var(--text-secondary);">최신 케이스 스터디가 없습니다.</li>`;
        return;
    }
    caseStudyList.innerHTML = latestCaseStudies.map(post => `
      <li class="post-item" data-post-id="${post.id}" onclick="location.href='posts.html#post-${post.id}'">
        <div class="post-item-title">[${post.category}] ${post.title}</div>
        <div class="post-item-meta">
           <span>(${post.authorCategory || '사용자'}) ${post.author}</span> •
           <span>${app.utils.formatDate(post.createdAt)}</span> •
           <span>💡 ${(post.insights || []).length}</span>
        </div>
      </li>
    `).join('');
  }

  function initializeHomePage() {
    renderProfileSummary();
    renderOnlineMentors(); // ✅ 온라인 멘토 로드
    renderPopularPosts();
    renderLatestNotices();
    renderImportantPosts();
    renderLatestPosts();
    renderLatestCaseStudies();
  }

  initializeHomePage();
});