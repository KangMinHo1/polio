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
      userText.textContent = `(${app.state.user.role}) ${app.state.user.name}님`;
      profileButton.href = `profile.html?user=${encodeURIComponent(app.state.user.name)}`;
      card.style.display = 'block';
    } else if (card) {
      card.style.display = 'none';
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
      <li class="post-item" data-post-id="${post.id}" onclick="location.href='post-detail.html?id=${post.id}'">
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

  // ✅ [추가] 인기 기술 스택 차트 렌더링 함수
  async function renderTrendChart() {
    const techCtx = document.getElementById('home-popular-tech-chart');
    if (!techCtx) return;

    try {
      // 서버 통신 오류로 인해 임시 비활성화
      const trends = { popularTechStacks: [] }; // await app.api.calculatePortfolioTrends();
      const techData = trends.popularTechStacks;

      if (techData && techData.length > 0) {
        new Chart(techCtx, {
          type: 'bar',
          data: {
            labels: techData.map(item => item.key),
            datasets: [{
              label: '언급 횟수',
              data: techData.map(item => item.value),
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
              ],
              borderWidth: 1
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false },
              title: { display: false }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
      } else {
        techCtx.parentElement.innerHTML = '<p>아직 데이터가 충분하지 않습니다.</p>';
      }
    } catch (error) {
      console.error("Error rendering trend chart:", error);
      techCtx.parentElement.innerHTML = '<p>차트 로딩에 실패했습니다.</p>';
    }
  }

  function initializeHomePage() {
    renderProfileSummary();
    renderPopularPosts();
    renderLatestNotices();
    renderImportantPosts();
    renderLatestPosts();
    renderLatestCaseStudies();
    renderTrendChart(); // ✅ 차트 렌더링 함수 호출
  }

  initializeHomePage();
});