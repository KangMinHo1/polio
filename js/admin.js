document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp;

  const elements = {
    userList: document.getElementById('user-list'),
    postList: document.getElementById('post-management-list'),
    statsTotalUsers: document.getElementById('stats-total-users'),
    statsTotalPosts: document.getElementById('stats-total-posts'),
    statsPostsByCategory: document.getElementById('stats-posts-by-category'),
  };

  function initializeAdminPage() {
    if (!app.state.user || app.state.user.role !== '관리자') {
      app.utils.showNotification('접근 권한이 없습니다.', 'danger');
      setTimeout(() => { window.location.href = 'mainview.html'; }, 1500);
      return;
    }

    renderSiteStats();
    renderUserList();
    renderPostManagementList();
  }

  async function renderSiteStats() {
    if (!elements.statsTotalUsers || !elements.statsTotalPosts || !elements.statsPostsByCategory) return;

    const users = app.state.users || [];
    const posts = app.state.posts || [];
    elements.statsTotalUsers.textContent = users.length;
    elements.statsTotalPosts.textContent = posts.length;

    try {
      const categoryStats = await app.api.getPostStatsByCategory();

      if (categoryStats && categoryStats.length > 0) {
        elements.statsPostsByCategory.innerHTML = categoryStats.map(stat => `
            <li>
                <span class="category-name">${stat.category}</span>
                <span class="category-count">${stat.count}건</span>
            </li>
        `).join('');
      } else {
        elements.statsPostsByCategory.innerHTML = '<li>게시글 데이터가 없습니다.</li>';
      }
    } catch (error) {
      console.error('카테고리별 통계 데이터 로딩 실패:', error);
      elements.statsPostsByCategory.innerHTML = '<li>통계 로딩에 실패했습니다.</li>';
    }
  }


  function renderUserList() {
    if (!elements.userList) return;
    const users = app.state.users || [];
    const currentAdminName = app.state.user.name;

    const usersToDisplay = users.filter(user => user.name !== currentAdminName);

    elements.userList.innerHTML = usersToDisplay.map(user => {
      return `
      <li class="list-item">
        <div class="item-info">
          <div class="item-title">${user.name}</div>
          <div class="item-meta">(${user.role})</div>
        </div>
        <div class="item-actions">
          <button class="btn btn--danger btn-delete-user" data-user-id="${user.id}" data-user-name="${user.name}" style="margin-left: 0.5rem;">
            삭제
          </button>
        </div>
      </li>
    `;
    }).join('');

    elements.userList.querySelectorAll('.btn-delete-user').forEach(button => {
      button.removeEventListener('click', handleDeleteUser);
      button.addEventListener('click', handleDeleteUser);
    });
  }

  function renderPostManagementList() {
    if (!elements.postList) return;
    const posts = app.state.posts || [];

    elements.postList.innerHTML = posts.map(post => `
      <li class="list-item">
        <div class="item-info">
          <div class="item-title">[${post.category}] ${post.title}</div>
          <div class="item-meta">
            <span>작성자: (${post.authorCategory || '사용자'}) ${post.author}</span> •
            <span>작성일: ${app.utils.formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn--danger btn-delete-post" data-post-id="${post.id}">삭제</button>
        </div>
      </li>
    `).join('');

    elements.postList.querySelectorAll('.btn-delete-post').forEach(button => {
       button.removeEventListener('click', handleDeletePost);
      button.addEventListener('click', handleDeletePost);
    });
  }

  async function handleDeleteUser(e) {
    const userId = e.target.dataset.userId;
    const userName = e.target.dataset.userName;
    if (confirm(`정말로 '${userName}' 사용자를 삭제하시겠습니까?\n이 사용자가 작성한 모든 게시글과 댓글이 함께 삭제됩니다.`)) {
      try {
        await app.api.deleteUser(userId);
        app.utils.showNotification('사용자가 삭제되었습니다.', 'success');
        await app.initialize();
        initializeAdminPage();
      } catch (error) {
         app.utils.showNotification('사용자 삭제에 실패했습니다.', 'danger');
      }
    }
  }

  async function handleDeletePost(e) {
    const postId = parseInt(e.target.dataset.postId, 10);
    if (confirm(`정말로 이 게시글을 삭제하시겠습니까?`)) {
       try {
        await app.api.deletePost(postId);
        app.utils.showNotification('게시글이 삭제되었습니다.', 'success');
        await app.initialize();
        initializeAdminPage();
       } catch (error) {
            app.utils.showNotification('게시글 삭제에 실패했습니다.', 'danger');
       }
    }
  }

  initializeAdminPage();
});