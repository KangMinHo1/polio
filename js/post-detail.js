document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    const elements = {
        container: document.getElementById('post-detail-container'),
    };

    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'), 10);

    if (!postId || isNaN(postId)) {
        elements.container.innerHTML = '<p>잘못된 접근입니다. 게시글 ID가 없습니다.</p>';
        return;
    }

    let post;
    let originalPostData;
    try {
        originalPostData = await app.api.fetchPostById(postId);

        // 서버 응답 데이터를 프론트엔드 모델로 변환합니다.
        post = {
            id: originalPostData.id,
            title: originalPostData.title,
            content: originalPostData.content,
            author: originalPostData.author,
            views: originalPostData.views,
            likes: originalPostData.likesCount,
            createdAt: originalPostData.createDate,
            category: originalPostData.category,
            portfolioLink: originalPostData.githubUrl,
            isLiked: originalPostData.isLiked
        };
    } catch (error) {
        console.error("Failed to fetch post:", error);
        elements.container.innerHTML = `<p>${error.message || '게시글을 불러오는 데 실패했습니다.'}</p>`;
        return;
    }

    if (!post) {
        elements.container.innerHTML = '<p>해당 게시글을 찾을 수 없습니다.</p>';
        return;
    }

    // 작성자 이름 클릭 시 프로필 페이지로 이동합니다.
    function handleAuthorClick(e) {
        const authorId = e.target.dataset.authorId;
        if (!authorId) return;
        window.location.href = `profile.html?user=${encodeURIComponent(authorId)}`;
    }

    async function handleCommentSubmit(e, post) {
        e.preventDefault();
        const contentEl = document.getElementById('comment-content');
        const content = contentEl.value.trim();
        if (!content) return;

        await app.api.createComment(post.id, { contents: content });
        
        contentEl.value = '';
        loadComments(post);
    }

    async function handleDeleteComment(commentId) {
        if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            try {
                await app.api.deleteComment(commentId);
                app.utils.showNotification('댓글이 삭제되었습니다.', 'success');
                loadComments(post);
            } catch (error) {
                app.utils.showNotification('댓글 삭제에 실패했습니다.', 'danger');
            }
        }
    }

    function handleEditComment(commentId, currentContent) {
        const commentItem = document.getElementById(`comment-${commentId}`);
        const contentWrapper = commentItem.querySelector('.comment-content-wrapper');
        
        contentWrapper.innerHTML = `
            <div class="comment-edit-form">
                <textarea class="comment-edit-textarea">${currentContent}</textarea>
                <div class="comment-edit-actions">
                    <button class="btn btn--ghost btn-cancel-edit">취소</button>
                    <button class="btn btn--primary btn-save-edit">저장</button>
                </div>
            </div>
        `;

        contentWrapper.querySelector('.btn-save-edit').addEventListener('click', async () => {
            const newContent = contentWrapper.querySelector('.comment-edit-textarea').value.trim();
            if (newContent) {
                try {
                    await app.api.updateComment(commentId, newContent);
                    app.utils.showNotification('댓글이 수정되었습니다.', 'success');
                    loadComments(post);
                } catch (error) {
                    app.utils.showNotification('댓글 수정에 실패했습니다.', 'danger');
                }
            }
        });

        contentWrapper.querySelector('.btn-cancel-edit').addEventListener('click', () => {
            contentWrapper.innerHTML = `<div class="comment-content">${currentContent.replace(/\n/g, '<br>')}</div>`;
        });
    }

    async function loadComments(post) {
        const commentList = document.getElementById('comment-list');
        if (!commentList) return;
        
        const commentsFromServer = await app.api.fetchComments(post.id);
        const comments = commentsFromServer.map(c => ({
            id: c.commentId,
            content: c.contents,
            authorName: c.authorName,
            createdAt: c.createDate,
            isBest: c.isBest || false
        }));

        const isPostAuthor = currentUser && currentUser.name === post.author;

        commentList.innerHTML = comments.length > 0 ? comments.map(comment => {
            const isCommentAuthor = currentUser && currentUser.name === comment.authorName;
            let authorActions = '';
            if (isCommentAuthor) {
                authorActions = `
                    <button class="btn-comment-action btn-edit-comment" data-comment-id="${comment.id}" data-comment-content="${escape(comment.content)}">수정</button>
                    <button class="btn-comment-action btn-delete-comment" data-comment-id="${comment.id}">삭제</button>
                `;
            }

            return `
                <li class="comment-item ${comment.isBest ? 'is-best' : ''}" id="comment-${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author" data-author-id="${comment.authorName}">${comment.authorName}</span>
                        <span class="comment-date">${app.utils.formatDate(comment.createdAt)}</span>
                        <div class="comment-author-actions">${authorActions}</div>
                    </div>
                    <div class="comment-content-wrapper"><div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div></div>
                    <div class="comment-actions"></div>
                </li>
            `;
        }).join('') : '<li>아직 댓글이 없습니다.</li>';

        commentList.querySelectorAll('.comment-author').forEach(el => el.addEventListener('click', handleAuthorClick));
        commentList.querySelectorAll('.btn-delete-comment').forEach(btn => btn.addEventListener('click', () => handleDeleteComment(parseInt(btn.dataset.commentId))));
        commentList.querySelectorAll('.btn-edit-comment').forEach(btn => btn.addEventListener('click', () => handleEditComment(parseInt(btn.dataset.commentId), unescape(btn.dataset.commentContent))));
    }

    async function renderPostDetail() {

        const authorInfo = app.state.users.find(u => u.name === post.author);
        const authorCategory = authorInfo ? authorInfo.role : '사용자'; // 작성자 역할(role) 정보

        let portfolioLinkHTML = '';
        if (post.portfolioLink) {
            portfolioLinkHTML = `<a href="${post.portfolioLink.startsWith('http') ? post.portfolioLink : 'http://' + post.portfolioLink}" class="btn btn--primary" target="_blank" rel="noopener noreferrer" style="margin-bottom: 1.5rem; display: inline-block;">🔗 포트폴리오/이력서 보러가기</a>`;
        }
        const authorHTML = `<span class="post-author-link" data-author-id="${post.author}" title="클릭해서 프로필 보기">(${authorCategory}) ${post.author}</span>`;

        let actionsHTML = '';
        const isPostAuthor = currentUser && currentUser.name === post.author;

        if (isPostAuthor) {
            const editButtonHTML = `<a href="write.html?edit=${post.id}" class="btn btn--ghost" style="margin-right: 0.5rem;">✏️ 수정하기</a>`
            const deleteButtonHTML = `<button id="btn-delete-post" class="btn btn--danger">🗑️ 삭제하기</button>`;
            actionsHTML = `<div class="post-actions" style="margin-bottom: 1.5rem;">${editButtonHTML}${deleteButtonHTML}</div>`;
        }

        let postActionsHTML = '';
        // ✅ [수정] '좋아요' 버튼 전용 클래스명(btn-like)을 사용하고, 활성화 상태를 is-liked 클래스로 제어합니다.
        // 페이지 로드 시 서버에서 직접 받아온 'post.isLiked' 값을 사용하여 버튼의 초기 상태를 결정합니다.
        const hasLiked = post.isLiked;
        postActionsHTML = `<button id="like-button-${post.id}" class="btn btn-like ${hasLiked ? 'is-liked' : ''}">❤️ 좋아요 (${post.likes || 0})</button>`;

        let contentHTML = '';
        
        const escapeHTML = (str) => (str || '').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        contentHTML += `<h3 class="template-header">가장 피드백 받고 싶은 점</h3>`;
        contentHTML += `<div class="template-content-box is-question">${escapeHTML(post.content)}</div>`;

        elements.container.innerHTML = `
            <h1>${post.title}</h1>
            <div class="post-meta">
                <span>작성자: ${authorHTML}</span>
                <span>${app.utils.formatDate(post.createdAt)}</span>
            </div>
            ${actionsHTML}
            ${portfolioLinkHTML}
            <div class="post-content">
                ${contentHTML}
            </div>
            <div class="post-actions">
                ${postActionsHTML}
            </div>
            <div class="comment-section">
              <h3 class="comment-title">💬 피드백</h3>
              <form id="comment-form" class="comment-form">
                <textarea id="comment-content" rows="3" placeholder="${currentUser ? '피드백을 남겨주세요... (예: @admin)' : '로그인 후 댓글을 남길 수 있습니다.'}" ${!currentUser ? 'disabled' : ''}></textarea>
                <div class="comment-form-actions">
                  <button type="submit" class="btn btn--primary" ${!currentUser ? 'disabled' : ''}>피드백 등록</button>
                </div>
              </form>
              <ul id="comment-list" class="comment-list"><li>댓글 로딩 중...</li></ul>
            </div>
        `;

        const authorLink = elements.container.querySelector('.post-author-link');
        if (authorLink) authorLink.addEventListener('click', handleAuthorClick);

        const likeButton = document.getElementById(`like-button-${post.id}`);
        if (likeButton) {
            likeButton.addEventListener('click', async () => {
                if (!currentUser) {
                    app.utils.showNotification('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                    return;
                }
                try {
                    const response = await app.api.toggleLike(post.id);
                    
                    post.likes = response.likesCount;
                    post.isLiked = response.isLiked;

                    likeButton.textContent = `❤️ 좋아요 (${post.likes || 0})`;

                    if (post.isLiked) {
                        // 'is-liked' 클래스를 추가하여 활성화 스타일을 적용합니다.
                        likeButton.classList.add('is-liked'); 
                    } else {
                        // 'is-liked' 클래스를 제거하여 비활성화 스타일을 적용합니다.
                        likeButton.classList.remove('is-liked'); 
                    }
                } catch (error) {
                    app.utils.showNotification(error.message || '좋아요 처리에 실패했습니다.', 'danger');
                }
            });
        }

        const deleteButton = document.getElementById('btn-delete-post');
        if (deleteButton) {
            deleteButton.addEventListener('click', async () => {
                if (confirm('정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    try {
                        await app.api.deletePost(post.id);
                        app.utils.showNotification('게시글이 삭제되었습니다.', 'success');
                        setTimeout(() => { window.location.href = 'posts.html'; }, 1000);
                    } catch (error) {
                        app.utils.showNotification(error.message || '게시글 삭제에 실패했습니다.', 'danger');
                    }
                }
            });
        }

        loadComments(post);
        const commentForm = document.getElementById('comment-form');
        if (commentForm) commentForm.addEventListener('submit', (e) => handleCommentSubmit(e, post));
    }

    renderPostDetail();
});