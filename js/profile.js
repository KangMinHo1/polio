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
        postsList.innerHTML = userPosts.map(post => {
            let actionButtonHTML = '';
            if (currentUser && currentUser.id === profileUser.id && post.postType === 'feedback') {
                if (post.isHiredSuccess) {
                    actionButtonHTML = `<div class="profile-list-item-actions"><button class="btn btn--ghost btn-hire-action btn-revert-hire" data-post-id="${post.id}">되돌리기</button></div>`;
                } else {
                    actionButtonHTML = `<div class="profile-list-item-actions"><button class="btn btn--success btn-hire-action btn-mark-hired" data-post-id="${post.id}">🎉 취업 성공!</button></div>`;
                }
            }
            let tag = '';
            if (post.postType === 'casestudy') { tag = '<span style="color: var(--color-highlight);">[💡 스터디]</span>'; }
            else if (post.isHiredSuccess) { tag = '<span style="color: #D97706;">[🎉 성공]</span>'; }
            else if (post.isResolved) { tag = '<span style="color: #16A34A;">[해결]</span>'; }

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
                let statsHTML = '';
                if (postType === 'casestudy') { statsHTML = ` • 💡 ${(comment.insights || []).length}`; }
                else {
                    statsHTML = ` • 👍 ${(comment.upvotes || []).length}`;
                    if (comment.isBest) { statsHTML += ' • <span style="color: var(--color-primary);">🏆 베스트</span>'; }
                }
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
    const bookmarkCard = document.getElementById('bookmark-card');
    const bookmarksList = document.getElementById('profile-bookmarks-list');
    
    if (!currentUser || currentUser.id !== profileUser.id) {
        if (bookmarkCard) bookmarkCard.style.display = 'none';
        // JS로 2열 그리드 강제 (1024px 이상일 때만)
        if (window.innerWidth > 1024) { 
           document.querySelector('.profile-activity').style.gridTemplateColumns = 'repeat(2, 1fr)';
        }
        return;
    }

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
            else if (post.isHiredSuccess) { tag = '<span style="color: #D97706;">[🎉 성공]</span>'; }
            else if (post.isResolved) { tag = '<span style="color: #16A34A;">[해결]</span>'; }
            
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

function setupPostListEventHandlers(currentUser, profileUser) {
    const postsList = document.getElementById('profile-posts-list');
    if (!postsList) return;

    postsList.addEventListener('click', async (e) => {
        const app = window.CommunityApp;
        
        if (e.target.classList.contains('btn-mark-hired')) {
            const postId = parseInt(e.target.dataset.postId);
            if (confirm('정말로 이 포트폴리오로 취업에 성공하셨나요?\n이 글에 "베스트 피드백"을 남긴 멘토에게 감사가 전달됩니다.')) {
                await app.api.markAsHired(postId);
                app.utils.showNotification('축하합니다! 취업 성공이 기록되었습니다.', 'success');
                location.reload();
            }
        }

        if (e.target.classList.contains('btn-revert-hire')) {
            const postId = parseInt(e.target.dataset.postId);
            if (confirm('취업 성공 기록을 되돌리시겠습니까?\n멘토에게 부여된 보상이 회수됩니다.')) {
                await app.api.revertHired(postId);
                app.utils.showNotification('기록이 되돌려졌습니다.', 'info');
                location.reload();
            }
        }
    });
}

async function setupMentorToggle(app, profileUser, currentUser, isTrustedMentor) {
    const toggleArea = document.getElementById('mentor-status-toggle-area');
    const toggleInput = document.getElementById('mentor-status-toggle');

    if (!toggleArea || !toggleInput) return;

    if (isTrustedMentor && currentUser && currentUser.id === profileUser.id) {
        toggleArea.style.display = 'block';

        const onlineMentors = await app.api.getMentorStatusList();
        const isOnline = onlineMentors.some(m => m.userId === currentUser.id);
        toggleInput.checked = isOnline;

        toggleInput.addEventListener('change', async (e) => {
            const newStatus = e.target.checked;
            try {
                await app.api.setMentorStatus(currentUser.id, newStatus);
                app.utils.showNotification(
                    newStatus ? '피드백 가능 상태가 되었습니다. (2시간)' : '오프라인 상태가 되었습니다.',
                    'success'
                );
            } catch (error) {
                app.utils.showNotification('상태 변경에 실패했습니다.', 'danger');
                e.target.checked = !newStatus;
            }
        });
    }
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
        bestCount: document.getElementById('profile-best-count'),
        upvoteCount: document.getElementById('profile-upvote-count'),
        mentorCount: document.getElementById('profile-mentor-count'),
        insightCount: document.getElementById('profile-insight-count'),
        postsList: document.getElementById('profile-posts-list'),
        commentsList: document.getElementById('profile-comments-list')
    };

    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('user');

    if (!targetUserId) {
        elements.userId.textContent = '사용자를 찾을 수 없습니다.';
        return;
    }

    async function initializeProfilePage() {
        const allUsers = app.state.users;
        const allPosts = app.state.posts;
        const allComments = await app.api.fetchAllComments(); 

        const profileUser = allUsers.find(u => u.id === targetUserId);

        if (!profileUser) {
            elements.userId.textContent = '존재하지 않는 사용자입니다.';
            return;
        }

        elements.userId.textContent = profileUser.id;
        elements.userCategory.textContent = profileUser.category || '사용자';

        // --- 평판 계산 ---
        let totalUpvotes = 0;
        let totalBestAnswers = 0;
        let hiredMentorCount = 0;
        let totalInsights = 0;
        let isTrustedMentor = false;
        
        const userComments = allComments.filter(c => c.author === profileUser.id);
        const userPosts = allPosts.filter(p => p.author === profileUser.id);

        userComments.forEach(comment => {
            totalUpvotes += (comment.upvotes || []).length;
            if (comment.isBest) totalBestAnswers++;
            totalInsights += (comment.insights || []).length;
        });
        userPosts.forEach(post => {
            if (post.postType === 'casestudy') totalInsights += (post.insights || []).length;
        });
        const bestCommentPostIds = userComments.filter(c => c.isBest).map(c => c.postId);
        if (bestCommentPostIds.length > 0) {
            hiredMentorCount = allPosts.filter(post => bestCommentPostIds.includes(post.id) && post.isHiredSuccess).length;
        }

        elements.bestCount.textContent = totalBestAnswers;
        elements.upvoteCount.textContent = totalUpvotes;
        elements.mentorCount.textContent = hiredMentorCount;
        elements.insightCount.textContent = totalInsights;

        // --- 배지 렌더링 ---
        if (hiredMentorCount > 0) {
            elements.userBadge.textContent = `🚀 취업시킨 멘토 (${hiredMentorCount}회)`;
            elements.userBadge.className = 'profile-mentor-badge';
            elements.userBadge.style.display = 'inline-block';
            isTrustedMentor = true;
        } else if ((profileUser.category === '재직자' || profileUser.role === 'admin') && totalBestAnswers >= 5) {
            elements.userBadge.textContent = '🏅 신뢰하는 재직자';
            elements.userBadge.className = 'profile-trust-badge';
            elements.userBadge.style.display = 'inline-block';
            isTrustedMentor = true;
        } else if (profileUser.category === '재직자' || profileUser.role === 'admin') {
            // "신뢰" 배지는 없지만 멘토 자격은 됨 (예: 관리자)
            isTrustedMentor = true;
            elements.userBadge.style.display = 'none';
        } else {
            elements.userBadge.style.display = 'none';
        }
        
        // --- 멘토 토글 설정 ---
        await setupMentorToggle(app, profileUser, currentUser, isTrustedMentor);

        // --- 목록 렌더링 ---
        renderUserPosts(userPosts, currentUser, profileUser);
        renderUserComments(userComments, allPosts);
        renderBookmarks(allPosts, currentUser, profileUser);
        setupPostListEventHandlers(currentUser, profileUser);
    }

    initializeProfilePage();
});