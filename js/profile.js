function renderUserPosts(userPosts, currentUser, profileUser) {
    const postsList = document.getElementById('profile-posts-list');
    if (userPosts.length === 0) {
        postsList.innerHTML = '<li>작성한 글이 없습니다.</li>';
    } else {
        postsList.innerHTML = userPosts.map(post => {            
            let actionButtonHTML = '';
            return `
              <li class="profile-list-item" style="cursor: pointer;" onclick="location.href='post-detail.html?id=${post.id}'">
                <a href="post-detail.html?id=${post.id}" style="text-decoration:none; color: inherit;">
                  <div class="post-item-title">[${post.category}] ${post.title}</div>
                  <div class="post-item-meta">
                    <span>${window.CommunityApp.utils.formatDate(post.createdAt)}</span> •
                    <span>조회 ${post.views || 0}</span> •
                    <span>❤️ ${post.likes || 0}</span>
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
                const originalPost = allPosts.find(p => p.id == comment.postId);
                const postTitle = originalPost ? originalPost.title : '삭제된 게시글';
                const shortComment = (comment.content || '').length > 100 ? comment.content.substring(0, 100) + '...' : (comment.content || '');
                return `
                  <li class="profile-comment-item">
                    <div class="profile-comment-content">"${shortComment}"</div>
                    <div class="profile-comment-meta">
                      <a href="post-detail.html?id=${comment.postId}">"${postTitle}"</a> 글에 남김 • 
                      ${window.CommunityApp.utils.formatDate(comment.createdAt)}
                    </div>
                  </li>
                `;
            }).join('');
    }
}

function renderTechStacks(stacks, isOwner, profileUser) {
    const container = document.getElementById('profile-tech-stacks');
    const listEl = document.getElementById('tech-stack-list');
    if (!container || !listEl) return;

    if (!document.getElementById('tech-stack-actions')) {
        const actionsContainer = document.createElement('div');
        actionsContainer.id = 'tech-stack-actions';
        actionsContainer.className = 'tech-stack-actions';
        container.appendChild(actionsContainer);
    }
    const actionsContainer = document.getElementById('tech-stack-actions');

    if (stacks && stacks.length > 0) {
        listEl.innerHTML = stacks.map(stack => `<span class="tech-stack-item">${stack}</span>`).join('');
    } else {
        listEl.innerHTML = '<p class="no-stacks-notice">등록된 기술 스택이 없습니다.</p>';
    }
    container.style.display = 'block';

    if (isOwner) {
        actionsContainer.innerHTML = `<button id="edit-stacks-btn" class="btn btn--ghost">수정</button>`;
        document.getElementById('edit-stacks-btn').addEventListener('click', () => showStackEditMode(stacks, profileUser));
    } else {
        actionsContainer.innerHTML = '';
    }
}

async function showStackEditMode(currentStacks, profileUser) {
    const listEl = document.getElementById('tech-stack-list');
    const actionsContainer = document.getElementById('tech-stack-actions');
    const app = window.CommunityApp;

    try {
        const allStacks = await app.api.fetchAllTechStacks();

        listEl.innerHTML = `
            <div class="tech-stack-edit-grid">
                ${allStacks.map(stack => `
                    <label class="tech-stack-checkbox-label">
                        <input type="checkbox" name="techStack" value="${stack.stackName}" 
                               ${currentStacks.includes(stack.stackName) ? 'checked' : ''}>
                        ${stack.stackName}
                    </label>
                `).join('')}
            </div>
        `;

        actionsContainer.innerHTML = `
            <button id="save-stacks-btn" class="btn btn--primary">저장</button>
            <button id="cancel-stacks-btn" class="btn btn--ghost">취소</button>
        `;

        document.getElementById('save-stacks-btn').addEventListener('click', () => handleSaveStacks(profileUser));
        document.getElementById('cancel-stacks-btn').addEventListener('click', () => {
            renderTechStacks(currentStacks, true, profileUser);
        });
    } catch (error) {
        app.utils.showNotification('기술 스택 목록을 불러오는 데 실패했습니다.', 'danger');
    }
}

async function handleSaveStacks(profileUser) {
    const app = window.CommunityApp;
    const saveButton = document.getElementById('save-stacks-btn');
    saveButton.disabled = true;
    saveButton.textContent = '저장 중...';

    const selectedStacks = Array.from(document.querySelectorAll('input[name="techStack"]:checked'))
                                .map(checkbox => checkbox.value);

    try {
        await app.api.updateMyStacks(selectedStacks);
        app.utils.showNotification('기술 스택이 성공적으로 업데이트되었습니다.', 'success');

        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        app.utils.showNotification('기술 스택 업데이트에 실패했습니다.', 'danger');
        saveButton.disabled = false;
        saveButton.textContent = '저장';
    }
}

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
        bookmarkCard: document.getElementById('bookmark-card'),
    };

    const urlParams = new URLSearchParams(window.location.search);
    let targetUserName = urlParams.get('user');

    if (!targetUserName && currentUser) {
        targetUserName = currentUser.name;
        history.replaceState({}, '', `profile.html?user=${encodeURIComponent(targetUserName)}`);
    }

    if (!targetUserName) {
        elements.userId.innerHTML = '<p>프로필을 조회할 사용자를 지정해주세요. (예: .../profile.html?user=admin)</p>';
        return;
    }

    async function initializeProfilePage() {
        const allUsers = app.state.users;
        const allPosts = app.state.posts;

        const profileUser = allUsers.find(u => u.name === targetUserName);

        if (!profileUser) {
            elements.userId.textContent = '존재하지 않는 사용자입니다.';
            return;
        }

        elements.userId.textContent = profileUser.name;
        elements.userCategory.textContent = profileUser.role || '사용자';

        if (elements.userBadge) elements.userBadge.style.display = 'none';

        const startChatButton = document.getElementById('start-chat-btn');
        const isOwner = currentUser && currentUser.name === profileUser.name;

        if (startChatButton && !isOwner && currentUser) {
            startChatButton.style.display = 'inline-block';
            startChatButton.addEventListener('click', async () => {
                try {
                    const room = await app.api.findOrCreate1on1Room(profileUser.id); // profileUser.id는 숫자 ID

                    if (room && room.roomId) {
                        window.location.href = `chat.html?roomId=${room.roomId}`;
                    } else {
                        app.utils.showNotification('채팅방을 열 수 없습니다.', 'danger');
                    }
                } catch (error) {
                    console.error('Failed to create or find chat room:', error);
                    app.utils.showNotification(error.message || '채팅방을 여는 데 실패했습니다.', 'danger');
                }
            });
        }

        try {
            const userStacks = await app.api.getStacksByUserName(profileUser.name);
            renderTechStacks(userStacks, isOwner, profileUser);
        } catch (error) {
            console.error("Failed to fetch tech stacks for user:", error);
            document.getElementById('profile-tech-stacks').innerHTML = '<p>기술 스택을 불러오는 데 실패했습니다.</p>';
        }

        const userPosts = allPosts.filter(p => p.author === profileUser.name);
        const allCommentsRaw = await app.api.fetchAllComments() || [];
        const allComments = allCommentsRaw.map(c => ({
            id: c.commentId,
            content: c.contents,
            author: c.authorName,
            createdAt: c.createDate,
            postId: c.postId 
        }));
        const userComments = allComments.filter(c => c.author === profileUser.name);
        renderUserPosts(userPosts, currentUser, profileUser);
        renderUserComments(userComments, allPosts);

        const tabContainer = document.querySelector('.profile-tabs');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                if (e.target.matches('.tab-btn')) {
                    const tabName = e.target.dataset.tab;

                    tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });

                    e.target.classList.add('active');
                    const activeContent = document.getElementById(`tab-content-${tabName}`);
                    if (activeContent) activeContent.classList.add('active');
                }
            });
        }
    }

    const style = document.createElement('style');
    style.innerHTML = `
        .tech-stack-item {
            display: inline-block;
            background-color: var(--color-primary-light, #e0e7ff);
            color: var(--color-primary-dark, #3730a3);
            padding: 0.3rem 0.8rem;
            margin: 0.25rem;
            border-radius: var(--radius-full, 9999px);
            font-size: 0.9rem;
            font-weight: 500;
            line-height: 1.2;
            transition: transform 0.2s ease;
        }

        .tech-stack-item:hover {
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);

    initializeProfilePage();
});