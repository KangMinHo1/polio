/**
 * profile.js
 * Handles the dynamic rendering of the user profile page.
 */

// --- 헬퍼 함수 ---

function renderUserPosts(userPosts, currentUser, profileUser) {
    const postsList = document.getElementById('profile-posts-list');
    if (userPosts.length === 0) {
        postsList.innerHTML = '<li>작성한 글이 없습니다.</li>';
    } else {
        postsList.innerHTML = userPosts.map(post => {            let actionButtonHTML = '';
            let tag = '';
            if (post.postType === 'casestudy') { tag = '<span style="color: var(--color-highlight);">[💡 스터디]</span>'; }

            return `
              <li class="profile-list-item">
                <a href="posts.html#post-${post.id}" style="text-decoration:none; color: inherit;">
                  <div class="post-item-title">${tag} [${post.category}] ${post.title}</div>
                  <div class="post-item-meta">
                    <span>${window.CommunityApp.utils.formatDate(post.createdAt)}</span> •
                    <span>조회 ${post.views || 0}</span> •
                    <span>${post.postType === 'casestudy' ? `💡 ${(post.insights || []).length}` : `❤️ ${post.likes || 0}`}</span>
                  </div>
                </a>
                ${actionButtonHTML}
              </li>
            `;
        }).join('');
    }
}

function renderUserComments(userComments, allPosts) {
    const commentsList = document.getElementById('profile-comments-list');
    if (userComments.length === 0) {
        commentsList.innerHTML = '<li>남긴 댓글이 없습니다.</li>';
    } else {
        commentsList.innerHTML = userComments
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(comment => {
                const originalPost = allPosts.find(p => p.id === comment.postId);
                const postTitle = originalPost ? originalPost.title : '삭제된 게시글';
                const postType = originalPost ? (originalPost.postType || 'feedback') : 'feedback';
                const shortComment = comment.content.length > 100 ? comment.content.substring(0, 100) + '...' : comment.content;
                let statsHTML = ` • 👍 ${(comment.upvotes || []).length}`;
                return `
                  <li class="profile-comment-item">
                    <div class="profile-comment-content">"${shortComment}"</div>
                    <div class="profile-comment-meta">
                      <a href="posts.html#post-${comment.postId}">"${postTitle}"</a> 글에 남김 • 
                      ${window.CommunityApp.utils.formatDate(comment.createdAt)}
                      ${statsHTML}
                    </div>
                  </li>
                `;
            }).join('');
    }
}

function renderBookmarks(allPosts, currentUser, profileUser) {
    const bookmarksTabBtn = document.getElementById('bookmarks-tab-btn');
    const bookmarksTabContent = document.getElementById('tab-content-bookmarks');
    const bookmarksList = document.getElementById('profile-bookmarks-list');
    
    if (!currentUser || currentUser.id !== profileUser.id) {
        if (bookmarksTabBtn) bookmarksTabBtn.style.display = 'none';
        return;
    }
    if (bookmarksTabBtn) bookmarksTabBtn.style.display = 'inline-block';

    if (!bookmarksList) return;

    const bookmarkedPosts = allPosts
        .filter(post => post.bookmarkedBy && post.bookmarkedBy.includes(currentUser.id))
        .sort((a, b) => b.createdAt - a.createdAt);
    
    if (bookmarkedPosts.length === 0) {
        bookmarksList.innerHTML = '<li>스크랩한 글이 없습니다.</li>';
    } else {
        bookmarksList.innerHTML = bookmarkedPosts.map(post => {
            let tag = '';
            if (post.postType === 'casestudy') { tag = '<span style="color: var(--color-highlight);">[💡 스터디]</span>'; }
            
            return `
              <li class="profile-list-item" onclick="location.href='posts.html#post-${post.id}'" style="cursor: pointer;">
                <div class="post-item-title">${tag} [${post.category}] ${post.title}</div>
                <div class="post-item-meta">
                  <span>스크랩한 글</span> •
                  <span>작성자: ${post.author}</span>
                </div>
              </li>
            `;
        }).join('');
    }
}

function renderTechStacks(stacks) {
    const container = document.getElementById('profile-tech-stacks');
    const listEl = document.getElementById('tech-stack-list');
    if (!container || !listEl) return;

    if (stacks && stacks.length > 0) {
        listEl.innerHTML = stacks.map(stack => `<span class="tech-stack-item">${stack}</span>`).join('');
        container.style.display = 'block';
    } else {
        listEl.innerHTML = '<p class="no-stacks-notice">등록된 기술 스택이 없습니다.</p>';
        container.style.display = 'block';
    }
}



async function setupMentorApplication(app, profileUser, currentUser, isMentor) {
    const applicationArea = document.getElementById('mentor-application-area');
    if (!applicationArea || !currentUser || currentUser.name !== profileUser.name || isMentor) {
        if(applicationArea) applicationArea.style.display = 'none';
        return;
    }

    applicationArea.style.display = 'block';
    const applications = await app.api.fetchMentorApplications();
    const myApplication = applications.find(app => app.userId === currentUser.name);

    if (myApplication) {
        if (myApplication.status === 'pending') {
            applicationArea.innerHTML = `<p style="font-size: 0.9rem; color: var(--text-secondary);">🚀 멘토 신청이 접수되어 검토 중입니다.</p>`;
        } else if (myApplication.status === 'rejected') {
            applicationArea.innerHTML = `
                <p style="font-size: 0.9rem; color: var(--color-danger); margin-bottom: 0.5rem;">멘토 신청이 반려되었습니다. 내용을 보완하여 다시 신청할 수 있습니다.</p>
                <button id="btn-apply-mentor" class="btn btn--primary">🚀 다시 신청하기</button>
            `;
        }
        // 'approved' 상태는 isMentor가 true가 되어 이 함수가 실행되지 않으므로 처리 불필요
    } else {
        applicationArea.innerHTML = `<button id="btn-apply-mentor" class="btn btn--primary">🚀 멘토 신청하기</button>`;
    }
    
    // 모달 관련 요소 및 이벤트 리스너 연결
    // '신규 신청' 또는 '다시 신청하기' 버튼이 화면에 존재할 경우에만 실행됩니다.
    const applyBtn = document.getElementById('btn-apply-mentor');
    if (!applyBtn) return; // 버튼이 없으면(예: 검토중 상태) 아래 로직을 실행하지 않습니다.
    
    const applyForm = document.getElementById('mentor-apply-form');
    
    // 멘토 신청 폼은 이제 별도 페이지가 없으므로, 폼 제출 시 바로 API를 호출합니다.
    // 간단한 이력 정보 없이 신청만 하는 방식으로 변경합니다.
    applyBtn.addEventListener('click', async () => { // 'id'를 사용하던 부분
        if (confirm('멘토로 활동을 신청하시겠습니까? 관리자 검토 후 승인됩니다.')) {
            try {
                await app.api.createMentorApplication(currentUser.name); // name으로 변경
                app.utils.showNotification('멘토 신청이 완료되었습니다. 검토 후 반영됩니다.', 'success');
                location.reload();
            } catch (error) {
                app.utils.showNotification(error.message || '멘토 신청에 실패했습니다.', 'danger');
            }
        }
    });
}


// --- 페이지 초기화 로직 ---
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    const elements = {
        userId: document.getElementById('profile-user-id'),
        userCategory: document.getElementById('profile-user-category'),
        userBadge: document.getElementById('profile-user-badge'),
        postsList: document.getElementById('profile-posts-list'),
        commentsList: document.getElementById('profile-comments-list'),
        resumeCard: document.getElementById('resume-card'),
        editResumeBtn: document.getElementById('edit-resume-btn'),
        resumeView: document.getElementById('resume-view'),
        resumeCompany: document.getElementById('resume-company'),
        resumeExperience: document.getElementById('resume-experience'),
        resumeSkills: document.getElementById('resume-skills'),
        resumeImageSection: document.getElementById('resume-image-section'),
        resumeImage: document.getElementById('resume-image'),
        bookmarkCard: document.getElementById('bookmark-card'),
    };
    elements.noResumeNotice = document.getElementById('no-resume-notice');

    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('user');

    if (!targetUserId) {
        elements.userId.textContent = '사용자를 찾을 수 없습니다.';
        return;
    }

    async function initializeProfilePage() {
        const allUsers = app.state.users;
        const allPosts = app.state.posts;

        const profileUser = allUsers.find(u => u.name === targetUserId); // ✅ [수정] id 대신 name으로 찾습니다.

        if (!profileUser) {
            elements.userId.textContent = '존재하지 않는 사용자입니다.';
            return;
        }

        // [수정] 하위 호환성을 위한 멘토 상태 보정
        // isMentor 속성이 없는 구버전 데이터의 경우, 재직자나 관리자이면 멘토로 간주합니다.
        // ✅ [수정] 영문 Enum 이름 대신 한글 역할명과 비교합니다.
        if (profileUser.isMentor === undefined) {
            profileUser.isMentor = (profileUser.role === '재직자' || profileUser.role === '관리자');
        }

        elements.userId.textContent = profileUser.name;
        elements.userCategory.textContent = profileUser.role || '사용자';

        // --- 평판 계산 ---
        const userComments = (await app.api.fetchAllComments() || []).filter(c => c.author === profileUser.name);
        const userPosts = allPosts.filter(p => p.author === profileUser.name);

        const totalBestAnswers = userComments.filter(c => c.isBest).length;

        // --- 배지 렌더링 ---
        // isTrustedMentor는 이제 멘토 자격 여부가 아닌, '신뢰도 높은' 멘토임을 나타내는 시각적 배지 표시용으로만 사용됩니다.
        if (profileUser.isMentor && totalBestAnswers >= 5) {
            elements.userBadge.textContent = '🏅 신뢰하는 멘토';
            elements.userBadge.className = 'profile-trust-badge';
            elements.userBadge.style.display = 'inline-block';
        } else if (profileUser.isMentor) {
            elements.userBadge.textContent = '멘토';
            elements.userBadge.className = 'profile-mentor-badge';
            elements.userBadge.style.display = 'inline-block';
        } else {
            if (elements.userBadge) elements.userBadge.style.display = 'none';
        }

        // --- 기술 스택 렌더링 ---
        // 프로필 주인의 기술 스택을 가져와서 표시합니다.
        try {
            let stacks = [];
            // ✅ [수정] 자신의 프로필을 볼 때만 기술 스택을 가져옵니다.
            // 다른 사용자의 스택을 가져오는 API는 백엔드 구현이 필요합니다.
            if (currentUser && currentUser.name === profileUser.name) {
                stacks = await app.api.getMyStacks();
            }
            renderTechStacks(stacks);
        } catch (error) {
            console.error("Failed to fetch tech stacks:", error);
        }
        
        // --- 멘토 토글 설정 ---
        // 멘토 기능 활성화 여부는 profileUser.isMentor 값으로 직접 판단합니다.
        
        const applications = await app.api.fetchMentorApplications();
        const userApplication = applications.find(a => a.userId === profileUser.name);

        // 멘토이거나, 자신의 프로필을 볼 때만 이력서 카드 표시
        if (profileUser.isMentor || (currentUser && currentUser.name === profileUser.name)) {
            elements.resumeCard.style.display = 'block';
        }

        if (userApplication && userApplication.resume) {
            // 이력서 정보가 있을 때
            elements.resumeView.style.display = 'block';
            elements.noResumeNotice.style.display = 'none';
            elements.resumeCompany.textContent = userApplication.resume.company || '정보 없음';
            elements.resumeExperience.textContent = userApplication.resume.experience || '정보 없음';
            elements.resumeSkills.textContent = userApplication.resume.skills || '정보 없음';

            if (userApplication.resume.projectImage) {
                elements.resumeImage.src = userApplication.resume.projectImage;
                elements.resumeImageSection.style.display = 'block';
            } else {
                elements.resumeImageSection.style.display = 'none';
            }
        } else {
            // 이력서 정보가 없을 때
            elements.resumeView.style.display = 'none';
            elements.noResumeNotice.style.display = 'block';
        }
        // 프로필 주인이 본인일 경우, 이력서 작성/수정 버튼 표시
        if (currentUser && currentUser.name === profileUser.name) {
            elements.editResumeBtn.style.display = 'inline-flex';
            elements.editResumeBtn.textContent = (userApplication && userApplication.resume) ? '✏️ 수정하기' : '✏️ 작성하기';
            elements.editResumeBtn.addEventListener('click', () => {
                window.location.href = 'edit-resume.html';
            });
        }

        // --- 목록 렌더링 ---
        renderUserPosts(userPosts, currentUser, profileUser);
        renderUserComments(userComments, allPosts);
        renderBookmarks(allPosts, currentUser, profileUser);

        // --- 탭 기능 설정 ---
        const tabContainer = document.querySelector('.profile-tabs');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                if (e.target.matches('.tab-btn')) {
                    const tabName = e.target.dataset.tab;

                    // 모든 탭 버튼과 컨텐츠에서 active 클래스 제거
                    tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });

                    // 클릭된 탭과 컨텐츠에 active 클래스 추가
                    e.target.classList.add('active');
                    const activeContent = document.getElementById(`tab-content-${tabName}`);
                    if (activeContent) activeContent.classList.add('active');
                }
            });
        }
    }

    initializeProfilePage();
});