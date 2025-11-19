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
    mentorApplicationList: document.getElementById('mentor-application-list'),
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
    renderMentorApplicationList();
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

    // 현재 로그인한 관리자 자신을 목록에서 제외
    const usersToDisplay = users.filter(user => user.id !== currentAdminId);

    // [추가] 하위 호환성을 위한 멘토 상태 보정
    usersToDisplay.forEach(user => {
      if (user.isMentor === undefined) {
        user.isMentor = (user.category === '재직자' || user.role === 'admin');
      }
    });

    elements.userList.innerHTML = usersToDisplay.map(user => {
      const mentorBadge = user.isMentor ? '<span class="profile-mentor-badge" style="font-size: 0.7rem; padding: 0.1rem 0.5rem; margin-left: 0.5rem;">멘토</span>' : '';
      // 멘토인 경우에만 '멘토 취소' 버튼을 생성합니다.
      const mentorButtonHTML = user.isMentor 
        ? `<button class="btn btn--ghost btn-toggle-mentor" data-user-id="${user.id}" style="margin-left: 0.5rem;">멘토 취소</button>`
        : '';
        
      return `
      <li class="list-item">
        <div class="item-info">
          <div class="item-title">${user.id} (${user.name} / ${user.email})${mentorBadge}</div>
        </div>
        <div class="item-actions">
          <select class="select category-select" data-user-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''} style="width: 100px;">
            <option value="취준생" ${user.category === '취준생' ? 'selected' : ''}>취준생</option>
            <option value="재직자" ${user.category === '재직자' ? 'selected' : ''}>재직자</option>
          </select>
          <select class="select role-select" data-user-id="${user.id}" style="width: 90px; margin-left: 0.5rem;">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
          ${mentorButtonHTML}
          <button class="btn btn--danger btn-delete-user" data-user-id="${user.id}" style="margin-left: 0.5rem;">
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
    elements.userList.querySelectorAll('.btn-toggle-mentor').forEach(button => {
      button.removeEventListener('click', handleMentorStatusChange);
      button.addEventListener('click', handleMentorStatusChange);
    });
    elements.userList.querySelectorAll('.category-select').forEach(select => {
      select.removeEventListener('change', handleCategoryChange);
      select.addEventListener('change', handleCategoryChange);
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

  async function renderMentorApplicationList() {
    if (!elements.mentorApplicationList) return;

    const applications = await app.api.fetchMentorApplications();
    const pendingApplications = applications.filter(a => a.status === 'pending');

    if (pendingApplications.length === 0) {
      elements.mentorApplicationList.innerHTML = '<li>새로운 멘토 신청이 없습니다.</li>';
      return;
    }

    elements.mentorApplicationList.innerHTML = pendingApplications.map(app => {
      let resumeHTML = '';
      if (app.resume) {
        resumeHTML = `
          <div class="item-meta" style="margin-top: 0.75rem; display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; font-size: 0.85rem;">
            <strong style="color: var(--text-secondary);">직장:</strong> <span>${app.resume.company || '-'}</span>
            <strong style="color: var(--text-secondary);">경력:</strong> <span>${app.resume.experience || '-'}</span>
            <strong style="color: var(--text-secondary);">기술:</strong> <span>${app.resume.skills || '-'}</span>
          </div>
          ${app.resume.projectImage ? `<div style="margin-top: 1rem;"><strong style="font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">첨부 이미지:</strong><img src="${app.resume.projectImage}" alt="프로젝트 이미지" style="max-width: 100%; border-radius: var(--radius-md); border: 1px solid var(--border-light);"></div>` : ''}
        `;
      }
      return `
      <li class="list-item">
        <div class="item-info">
          <div class="item-title">${app.userId} 님의 멘토 신청</div>
          <div class="item-meta">
            <span>신청일: ${window.CommunityApp.utils.formatDate(app.createdAt)}</span>
          </div>
          ${resumeHTML}
        </div>
        <div class="item-actions">
          <a href="profile.html?user=${app.userId}" class="btn btn--ghost" target="_blank">프로필 보기</a>
          <button class="btn btn--success btn-approve-mentor" data-user-id="${app.userId}">승인</button>
          <button class="btn btn--danger btn-reject-mentor" data-user-id="${app.userId}">거절</button>
        </div>
      </li>
      `;
    }).join('');

    elements.mentorApplicationList.querySelectorAll('.btn-approve-mentor').forEach(button => {
      button.addEventListener('click', handleApplicationDecision);
    });
    elements.mentorApplicationList.querySelectorAll('.btn-reject-mentor').forEach(button => {
      button.addEventListener('click', handleApplicationDecision);
    });
  }

  async function handleApplicationDecision(e) {
    const userId = e.target.dataset.userId;
    const isApprove = e.target.classList.contains('btn-approve-mentor');
    const actionText = isApprove ? '승인' : '거절';

    if (confirm(`'${userId}' 님의 멘토 신청을 ${actionText}하시겠습니까?`)) {
      const newStatus = isApprove ? 'approved' : 'rejected';
      await app.api.updateMentorApplicationStatus(userId, newStatus);
      app.utils.showNotification(`멘토 신청을 ${actionText} 처리했습니다.`, 'success');
      await app.initialize(); // 데이터 새로고침
      initializeAdminPage(); // 페이지 다시 렌더링
    }
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

  async function handleMentorStatusChange(e) {
    const userId = e.target.dataset.userId;
    const user = app.state.users.find(u => u.id === userId);
    if (!user) return;

    const actionText = user.isMentor ? '멘토 자격을 해제' : '멘토로 지정';
    if (confirm(`'${userId}' 사용자를 ${actionText}하시겠습니까?`)) {
        try {
            await app.api.toggleUserMentorStatus(userId);
            app.utils.showNotification('사용자 멘토 상태가 변경되었습니다.', 'success');
            await app.initialize();
            initializeAdminPage();
        } catch (error) {
            app.utils.showNotification('멘토 상태 변경에 실패했습니다.', 'danger');
        }
    }
  }

  async function handleCategoryChange(e) {
    const userId = e.target.dataset.userId;
    const newCategory = e.target.value;
    const user = app.state.users.find(u => u.id === userId);
    if (!user) return;

    const originalCategory = user.category;

    if (confirm(`'${userId}' 사용자의 직업 상태를 '${newCategory}'(으)로 변경하시겠습니까?`)) {
        try {
            await app.api.updateUserCategory(userId, newCategory);
            app.utils.showNotification('사용자 직업 상태가 변경되었습니다.', 'success');
            await app.initialize();
            initializeAdminPage();
        } catch (error) {
            app.utils.showNotification('상태 변경에 실패했습니다.', 'danger');
            e.target.value = originalCategory;
        }
    } else {
        e.target.value = originalCategory;
    }
  }

  // initializeAdminPage(); // Called after await APP_INITIALIZATION completes
  // Call initializeAdminPage explicitly after ensuring APP_INITIALIZATION is done.
  initializeAdminPage();
});