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
        // ✅ [수정] 좋아요 수도 필드명을 변환해줍니다. (likesCount -> likes) - 이전에 적용되었어야 할 코드입니다.
        post.likes = post.likesCount; 
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

        // ✅ [수정] postId는 첫 번째 인자로, 요청 본문에는 백엔드 DTO와 일치하는 'contents' 필드명으로 전달합니다.
        // 백엔드가 생성된 댓글 객체를 반환하지 않으므로, 반환값을 사용하지 않습니다.
        await app.api.createComment(post.id, { contents: content });
        
        // 멘션 알림 기능은 생성된 댓글의 ID가 필요하므로, 댓글 목록을 다시 불러온 후에 처리해야 합니다. (일단 주석 처리)
        // await app.utils.parseMentionsAndCreateNotifications(content, `post-detail.html?id=${post.id}#comment-???`, currentUser);
        
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
        
        const commentsFromServer = await app.api.fetchComments(post.id);
        // ✅ [수정] 백엔드 DTO 필드명을 프론트엔드에서 사용하는 필드명으로 변환합니다.
        const comments = commentsFromServer.map(c => ({
            id: c.commentId,
            content: c.contents,
            authorName: c.authorName,
            createdAt: c.createDate,
            isBest: c.isBest || false // isBest 필드가 없을 경우를 대비
        }));

        // ✅ [수정] currentUser.id 대신 currentUser.name과 비교합니다.
        const isPostAuthor = currentUser && currentUser.name === post.author;

        commentList.innerHTML = comments.length > 0 ? comments.map(comment => {
            const isCommentAuthor = currentUser && currentUser.name === comment.authorName; // ✅ [수정] comment.author -> comment.authorName
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

        // 이벤트 리스너 동적 바인딩
        commentList.querySelectorAll('.comment-author').forEach(el => el.addEventListener('click', handleAuthorClick));
        commentList.querySelectorAll('.btn-delete-comment').forEach(btn => btn.addEventListener('click', () => handleDeleteComment(parseInt(btn.dataset.commentId))));
        commentList.querySelectorAll('.btn-edit-comment').forEach(btn => btn.addEventListener('click', () => handleEditComment(parseInt(btn.dataset.commentId), unescape(btn.dataset.commentContent))));
    }

    // --- 상세 페이지 렌더링 함수 ---
    async function renderPostDetail() {

        // ✅ [개선] post.author 이름을 사용해 전체 사용자 목록(app.state.users)에서 역할(role) 정보를 찾습니다.
        const authorInfo = app.state.users.find(u => u.name === post.author);
        const authorCategory = authorInfo ? authorInfo.role : '사용자';

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
        const isPostAuthor = currentUser && currentUser.name === post.author;

        if (isPostAuthor) {
            const editButtonHTML = `<a href="write.html?edit=${post.id}" class="btn btn--ghost" style="margin-right: 0.5rem;">✏️ 수정하기</a>`
            const deleteButtonHTML = `<button id="btn-delete-post" class="btn btn--danger">🗑️ 삭제하기</button>`;
            actionsHTML = `<div class="post-actions" style="margin-bottom: 1.5rem;">${editButtonHTML}${deleteButtonHTML}</div>`;
        }

        let postActionsHTML = '';
        let bookmarkButtonHTML = '';
        if (currentUser) {
            const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(currentUser.id);
            bookmarkButtonHTML = `<button id="btn-bookmark" class="btn btn--ghost btn-bookmark ${isBookmarked ? 'is-active' : ''}" data-post-id="${post.id}">${isBookmarked ? '📌 스크랩 취소' : '📌 스크랩하기'}</button>`;
        }
        // ✅ [수정] 사용자별로 '좋아요' 목록을 관리하기 위해 키에 사용자 이름을 추가합니다.
        const likedPostIds = currentUser ? JSON.parse(localStorage.getItem(`likedPostIds_${currentUser.name}`) || '[]') : [];
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

        // ✅ [추가] 좋아요 버튼 이벤트 리스너 바인딩
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
                    // ✅ [개선] 서버에 좋아요 토글을 요청하고, 응답으로 최신 좋아요 수를 받습니다.
                    const response = await app.api.toggleLike(post.id);
                    
                    const originalLikes = post.likes;
                    post.likes = response.likes; // 응답 받은 최신 좋아요 수로 업데이트

                    likeButton.textContent = `❤️ 좋아요 (${post.likes || 0})`;

                    // ✅ [수정] 서버 응답 후, 최신 상태를 기준으로 localStorage와 버튼 스타일을 업데이트합니다.
                    // 서버 응답(좋아요 수)이 이전보다 증가했으면 '좋아요'를 누른 것으로 간주합니다.
                    let likedPostIds = JSON.parse(localStorage.getItem(`likedPostIds_${currentUser.name}`) || '[]')
                    const isNowLiked = post.likes > originalLikes;
                    const postIndex = likedPostIds.indexOf(post.id);
                    
                    if (isNowLiked && postIndex === -1) { // '좋아요'를 눌렀고, localStorage에 없다면
                        likedPostIds.push(post.id); // 배열에 추가
                        likeButton.classList.add('btn--primary');
                    } else if (!isNowLiked && postIndex > -1) { // '좋아요'를 취소했고, localStorage에 있다면
                        likedPostIds.splice(postIndex, 1); // 배열에서 제거
                        likeButton.classList.remove('btn--primary');
                    }

                    localStorage.setItem(`likedPostIds_${currentUser.name}`, JSON.stringify(likedPostIds));
                } catch (error) {
                    app.utils.showNotification(error.message || '좋아요 처리에 실패했습니다.', 'danger');
                }
            });
        }

        // ✅ [추가] 삭제 버튼 이벤트 리스너 바인딩
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