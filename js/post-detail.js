/**
 * post-detail.js
 * 게시글 상세 페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    const elements = {
        container: document.getElementById('post-detail-container'),
    };

    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'), 10); //게시글 PK 문자열 -> 숫자로 변환

    if (!postId || isNaN(postId)) { // 게시글 pk가 없으면 오류
        elements.container.innerHTML = '<p>잘못된 접근입니다. 게시글 ID가 없습니다.</p>';
        return;
    }

    
    let post;
    try {
        post = await app.api.fetchPostById(postId); // 서버에 해당 게시글에 내용 요청
        // 서버 DTO 필드명을 프론트엔드에서 사용하는 필드명으로 변환.
        post.createdAt = post.createDate;
        post.portfolioLink = post.githubUrl;
    } catch (error) {
        console.error("Failed to fetch post:", error);
        elements.container.innerHTML = `<p>${error.message || '게시글을 불러오는 데 실패했습니다.'}</p>`;
        return;
    }

    if (!post) {
        elements.container.innerHTML = '<p>해당 게시글을 찾을 수 없습니다.</p>';
        return;
    }

    //함수 정의
    
    //게시글이나 댓글의 작성자 이름을 클릭했을 때, 해당 사용자의 프로필 페이지로 이동시켜주는 기능
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

        const newComment = await app.api.createComment({ postId: post.id, content });
        await app.utils.parseMentionsAndCreateNotifications(content, `post-detail.html?id=${post.id}#comment-${newComment.id}`, currentUser);
        
        contentEl.value = '';
        loadComments(post); // Re-load comments
    }

    // 댓글 삭제 핸들러
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

    // 댓글 수정 UI 토글 핸들러
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
        
        const comments = await app.api.fetchComments(post.id);
        // ✅ [수정] currentUser.id 대신 currentUser.name과 비교합니다.
        const isPostAuthor = currentUser && currentUser.name === post.author;

        commentList.innerHTML = comments.length > 0 ? comments.map(comment => {
            const isCommentAuthor = currentUser && currentUser.name === comment.author;
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
                        <span class="comment-author" data-author-id="${comment.author}">${comment.author}</span>
                        <span class="comment-date">${app.utils.formatDate(comment.createdAt)}</span>
                        <div class="comment-author-actions">${authorActions}</div>
                    </div>
                    <div class="comment-content-wrapper"><div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div></div>
                    <div class="comment-actions"></div>
                </li>
            `;
        }).join('') : '<li>아직 댓글이 없습니다.</li>';

        // 이벤트 리스너 동적 바인딩
        commentList.querySelectorAll('.comment-author').forEach(el => el.addEventListener('click', handleAuthorClick));
        commentList.querySelectorAll('.btn-delete-comment').forEach(btn => btn.addEventListener('click', () => handleDeleteComment(parseInt(btn.dataset.commentId))));
        commentList.querySelectorAll('.btn-edit-comment').forEach(btn => btn.addEventListener('click', () => handleEditComment(parseInt(btn.dataset.commentId), unescape(btn.dataset.commentContent))));
    }

    // --- 상세 페이지 렌더링 함수 ---
    async function renderPostDetail() {
        // ✅ [수정] 조회수 증가 로직을 클라이언트 측에서만 처리하고, 서버 업데이트 API 호출을 제거합니다.
        // 페이지를 방문할 때마다 로컬 state의 조회수만 1 증가시킵니다.
        post.views = (post.views || 0) + 1;

        const postType = 'feedback'; // ✅ [수정] 케이스 스터디 제거
        const authorCategory = post.authorCategory || '사용자';

        let portfolioLinkHTML = '';
        if (post.portfolioLink) {
            portfolioLinkHTML = `<a href="${post.portfolioLink.startsWith('http') ? post.portfolioLink : 'http://' + post.portfolioLink}" class="btn btn--primary" target="_blank" rel="noopener noreferrer" style="margin-bottom: 1.5rem; display: inline-block;">🔗 포트폴리오/이력서 보러가기</a>`;
        }
        let fileAttachmentHTML = '';
        if (post.file && post.file.name && post.file.content) {
            fileAttachmentHTML = `<div class="post-attachment"><div class="post-attachment-title">📎 첨부파일</div><a href="${post.file.content}" download="${post.file.name}" class="post-attachment-link">${post.file.name} 다운로드</a></div>`;
        }
        const authorHTML = `<span class="post-author-link" data-author-id="${post.author}" title="클릭해서 프로필 보기">(${authorCategory}) ${post.author}</span>`;

        let actionsHTML = '';
        // ✅ [수정] currentUser.id 대신 currentUser.name과 비교합니다.
        const isPostAuthor = currentUser && currentUser.name === post.author;

        if (isPostAuthor) {
            const editButtonHTML = `<a href="write.html?edit=${post.id}" class="btn btn--ghost" style="margin-right: 0.5rem;">✏️ 수정하기</a>`;
            actionsHTML = `<div class="post-actions" style="margin-bottom: 1.5rem;">${editButtonHTML}</div>`;
        }

        let postActionsHTML = '';
        let bookmarkButtonHTML = '';
        if (currentUser) {
            const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(currentUser.id);
            bookmarkButtonHTML = `<button id="btn-bookmark" class="btn btn--ghost btn-bookmark ${isBookmarked ? 'is-active' : ''}" data-post-id="${post.id}">${isBookmarked ? '📌 스크랩 취소' : '📌 스크랩하기'}</button>`;
        }
        const likedPostIds = JSON.parse(localStorage.getItem('likedPostIds') || '[]');
        const hasLiked = likedPostIds.includes(postId);
        // ✅ [수정] 케이스 스터디 제거, '좋아요' 버튼으로 통일
        postActionsHTML = `<button id="like-button-${post.id}" class="btn ${hasLiked ? 'btn--primary' : ''}">❤️ 좋아요 (${post.likes || 0})</button>`;

        let contentHTML = '';
        
        // ✅ [수정] content가 순수 문자열이므로, JSON 파싱 없이 바로 표시합니다.
        const escapeHTML = (str) => (str || '').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        contentHTML += `<h3 class="template-header">가장 피드백 받고 싶은 점</h3>`;
        contentHTML += `<div class="template-content-box is-question">${escapeHTML(post.content)}</div>`;

        elements.container.innerHTML = `
            <h1>${post.title}</h1>
            <div class="post-meta">
                {/* ✅ [수정] post.categories 배열 대신, 일관성을 위해 단일 문자열 post.category를 사용합니다. */}
                <span>[${post.category || '기타'}]</span>
                <span>작성자: ${authorHTML}</span>
                <span>${app.utils.formatDate(post.createdAt)}</span>
            </div>
            ${actionsHTML}
            ${portfolioLinkHTML}
            ${fileAttachmentHTML}
            <div class="post-content">
                ${contentHTML}
            </div>
            <div class="post-actions">
                ${postActionsHTML}
                ${bookmarkButtonHTML}
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

        // 이벤트 리스너 동적 바인딩
        const authorLink = elements.container.querySelector('.post-author-link');
        if (authorLink) authorLink.addEventListener('click', handleAuthorClick);

        loadComments(post);
        const commentForm = document.getElementById('comment-form');
        if (commentForm) commentForm.addEventListener('submit', (e) => handleCommentSubmit(e, post));
    }

    renderPostDetail();
});