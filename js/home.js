document.addEventListener('DOMContentLoaded', async () => {
  // shared.js에서 app 초기화를 기다립니다.
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp;

  /**
   * 서버에 인기 기술 스택 통계를 요청하는 함수
   * @returns {Promise<Array<{stackName: string, userCount: number}>>}
   */
  async function fetchPopularTechStacks() {
    try {
      // app.api.get은 shared.js에 정의된 API 호출 함수로 가정합니다.
      const techData = await app.api.fetchPopularTechStacks();
      return techData || []; // 데이터가 null일 경우 빈 배열 반환

    } catch (error) {
      console.error('인기 기술 스택 데이터를 불러오는 데 실패했습니다:', error);
      app.utils.showNotification('인기 기술 스택 정보를 가져오는 데 실패했습니다.', 'error');
      // 에러 발생 시 빈 배열을 반환하여 차트가 비어있도록 합니다.
      return [];
    }
  }

  /**
   * 인기 기술 스택 차트를 생성하고 렌더링하는 함수
   * @param {Array<{stackName: string, userCount: number}>} techData - 기술 스택 데이터
   */
  function renderTechStackChart(techData) {
    const ctx = document.getElementById('home-popular-tech-chart');
    if (!ctx) return;

    if (!techData || techData.length === 0) {
      const cardContent = ctx.parentElement;
      cardContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">인기 기술 스택 데이터가 없습니다.</p>';
      return;
    }

    // 서버 응답(PopularTechStackDto)의 userCount 필드를 기준으로 내림차순 정렬하고 상위 6개만 사용합니다.
    const sortedData = techData.sort((a, b) => b.userCount - a.userCount).slice(0, 6);

    // 서버 응답(PopularTechStackDto)의 stackName 필드를 차트 라벨로 사용합니다.
    const labels = sortedData.map(item => item.stackName);
    // 서버 응답(PopularTechStackDto)의 userCount 필드를 차트 데이터로 사용합니다.
    const data = sortedData.map(item => item.userCount);

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: '사용자 수',
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        }
      }
    });
  }

  /**
   * 로그인한 사용자의 프로필 요약 정보를 렌더링하는 함수
   */
  function renderProfileSummary() {
    const profileCard = document.getElementById('profile-summary-card');
    if (!profileCard) return;

    const user = app.state.user;
    if (user) {
      const userNameEl = document.getElementById('profile-user-name');
      const userRoleEl = document.getElementById('profile-user-role');
      const profileButton = document.getElementById('profile-goto-button');

      if (userNameEl) userNameEl.textContent = user.name;
      if (userRoleEl) {
        // ✅ [수정] '일반회원'으로 고정하는 대신, 서버에서 받은 사용자 역할(role)을 그대로 표시합니다.
        userRoleEl.textContent = user.role;
      }
      // ✅ [수정] '내 프로필 보기' 버튼의 링크에 현재 로그인한 사용자의 이름을 파라미터로 추가합니다.
      if (profileButton) profileButton.href = `profile.html?user=${encodeURIComponent(user.name)}`;

      profileCard.style.display = 'block';
    } else {
      profileCard.style.display = 'none';
    }
  }

  /**
   * 최신 피드백 요청 목록을 렌더링하는 함수
   */
  function renderLatestPosts() {
    const postList = document.getElementById('home-post-list');
    if (!postList) return;

    // app.state.posts에서 최신순으로 정렬 후 상위 5개만 가져옵니다.
    const latestPosts = [...app.state.posts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (latestPosts.length === 0) {
      postList.innerHTML = '<li><p style="text-align: center; color: var(--text-secondary);">아직 등록된 피드백 요청이 없습니다.</p></li>';
      return;
    }

    postList.innerHTML = latestPosts.map(post => `
      <li class="post-item">
        <a href="post-detail.html?id=${post.id}" class="post-item-link" style="text-decoration: none;">
          <div class="post-item-header">
            <span class="post-item-category">${post.category}</span>
            <h4 class="post-item-title">${post.title}</h4>
          </div>
          <div class="post-item-meta">
            <span>${post.author}</span>
            <span>${app.utils.formatDate(post.createdAt)}</span>
          </div>
        </a>
      </li>
    `).join('');
  }

  /**
   * 최신 공지사항 목록을 렌더링하는 함수
   */
  function renderNotices() {
    const noticeList = document.getElementById('notice-list');
    if (!noticeList) return;

    // app.state.posts에서 카테고리가 '공지'인 게시글을 최신순으로 정렬 후 상위 3개만 가져옵니다.
    const latestNotices = [...app.state.posts]
      .filter(post => post.category === '공지')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    if (latestNotices.length === 0) {
      noticeList.innerHTML = '<li><p style="text-align: center; color: var(--text-secondary);">등록된 공지사항이 없습니다.</p></li>';
      return;
    }

    noticeList.innerHTML = latestNotices.map(notice => `
      <li class="notice-item">
        <a href="post-detail.html?id=${notice.id}" class="notice-item-link">${notice.title}</a>
      </li>
    `).join('');
  }

  // 함수 실행
  // ✅ [수정] 로그인 상태와 관계없이 항상 API를 호출합니다.
  renderProfileSummary(); // 프로필 요약 카드 렌더링
  const popularTechs = await fetchPopularTechStacks();
  renderTechStackChart(popularTechs);
  renderLatestPosts(); // 최신 피드백 요청 목록 렌더링 함수 호출
  renderNotices(); // 최신 공지사항 목록 렌더링 함수 호출
});