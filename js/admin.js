/**
 * admin.js
 * 관리자 페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // ✅ [수정] APP_INITIALIZATION을 기다려서 app.state 데이터 로딩 보장
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
    if (!app.state.user || app.state.user.role !== 'admin') {
      app.utils.showNotification('접근 권한이 없습니다.', 'danger');
      setTimeout(() => { window.location.href = 'mainview.html'; }, 1500);
      return;
    }

    renderSiteStats();
    renderUserList();
    renderPostManagementList();
  }

  // ✅ [수정] app.state 데이터를 직접 사용하도록 변경
  function renderSiteStats() {
    if (!elements.statsTotalUsers || !elements.statsTotalPosts || !elements.statsPostsByCategory) return;

    // app.state에서 직접 데이터를 가져옴 (initialize 후이므로 로드 보장됨)
    const users = app.state.users || [];
    const posts = app.state.posts || [];

    elements.statsTotalUsers.textContent = users.length;
    elements.statsTotalPosts.textContent = posts.length;

    const postsByCategory = posts.reduce((acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    }, {});

    const categoryOrder = ['공지', '프론트엔드', '백엔드', 'UX/UI 디자인', '데이터 분석', '기타'];

    elements.statsPostsByCategory.innerHTML = categoryOrder
        .filter(cat => postsByCategory[cat] !== undefined)
        .map(category => `
            <li>
                <span class="category-name">${category}</span>
                <span class="category-count">${postsByCategory[category]}건</span>
            </li>
        `).join('');

    if (elements.statsPostsByCategory.innerHTML === '') {
        elements.statsPostsByCategory.innerHTML = '<li>게시글 데이터가 없습니다.</li>';
    }
  }


  function renderUserList() {
    if (!elements.userList) return;
    const users = app.state.users || []; // 데이터 없을 경우 대비
    const currentAdminId = app.state.user.id;

    elements.userList.innerHTML = users.map(user => {
      const isCurrentUser = user.id === currentAdminId;
      return `
      <li class="list-item">
        <div class="item-info">
          <div class="item-title">${user.id} (${user.name} / ${user.email})</div>
          <div class="item-meta">카테고리: ${user.category}</div>
        </div>
        <div class="item-actions">
          <select class="select role-select" data-user-id="${user.id}" ${isCurrentUser ? 'disabled' : ''}>
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
          <button class="btn btn--danger btn-delete-user" data-user-id="${user.id}" ${isCurrentUser ? 'disabled' : ''}>
            삭제
          </button>
        </div>
      </li>
    `;
    }).join('');

    elements.userList.querySelectorAll('.btn-delete-user').forEach(button => {
      button.removeEventListener('click', handleDeleteUser); // 기존 리스너 제거 (중복 방지)
      button.addEventListener('click', handleDeleteUser);
    });
    elements.userList.querySelectorAll('.role-select').forEach(select => {
       select.removeEventListener('change', handleRoleChange); // 기존 리스너 제거
      select.addEventListener('change', handleRoleChange);
    });
  }

  function renderPostManagementList() {
    if (!elements.postList) return;
    const posts = app.state.posts || []; // 데이터 없을 경우 대비

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
          <a href="write.html?edit=${post.id}" class="btn btn--ghost">수정</a>
          <button class="btn btn--danger btn-delete-post" data-post-id="${post.id}">삭제</button>
        </div>
      </li>
    `).join('');

    elements.postList.querySelectorAll('.btn-delete-post').forEach(button => {
       button.removeEventListener('click', handleDeletePost); // 기존 리스너 제거
      button.addEventListener('click', handleDeletePost);
    });
  }

  async function handleDeleteUser(e) {
    const userId = e.target.dataset.userId;
    if (confirm(`정말로 '${userId}' 사용자를 삭제하시겠습니까?\n이 사용자가 작성한 모든 게시글과 댓글이 함께 삭제됩니다.`)) {
      try {
        await app.api.deleteUser(userId);
        app.utils.showNotification('사용자가 삭제되었습니다.', 'success');
        // Re-initialize state and re-render (simplest way to ensure consistency)
        await app.initialize(); // Reload all data
        initializeAdminPage(); // Re-render the admin page
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
        await app.initialize(); // Reload all data
        initializeAdminPage(); // Re-render the admin page
       } catch (error) {
            app.utils.showNotification('게시글 삭제에 실패했습니다.', 'danger');
       }
    }
  }

  async function handleRoleChange(e) {
    const userId = e.target.dataset.userId;
    const newRole = e.target.value;
    const originalRole = app.state.users.find(u => u.id === userId)?.role || 'user'; // Find original role

    if (confirm(`'${userId}' 사용자의 역할을 '${newRole}'(으)로 변경하시겠습니까?`)) {
        try {
            // Simulate API call for role update (replace with actual API if available)
            let users = await app.api.fetchAllUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex > -1) {
                users[userIndex].role = newRole;
                localStorage.setItem('users', JSON.stringify(users)); // Save
                app.state.users = users; // Update state
                app.utils.showNotification('사용자 역할이 변경되었습니다.', 'success');
                // No need to re-render the whole list, the select value is already changed
            } else {
                 throw new Error('User not found');
            }
        } catch (error) {
            app.utils.showNotification('역할 변경에 실패했습니다.', 'danger');
            e.target.value = originalRole; // Revert select value on failure
        }
    } else {
        e.target.value = originalRole; // Revert select value on cancel
    }
  }

  // initializeAdminPage(); // Called after await APP_INITIALIZATION completes
  // Call initializeAdminPage explicitly after ensuring APP_INITIALIZATION is done.
  initializeAdminPage();
});