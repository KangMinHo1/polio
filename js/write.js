
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    //글 쓰기/수정은 로그인이 된 회원만 가능
    if (!currentUser) { 
        app.utils.showNotification('로그인이 필요합니다.', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const elements = {
        form: document.getElementById('write-form'),
        pageTitle: document.getElementById('page-title'),
        pageDescription: document.getElementById('page-description'),
        submitButton: document.getElementById('submit-button'),
        postId: document.getElementById('write-post-id'),
        category: document.getElementById('write-category'),
        title: document.getElementById('write-title'),
        portfolioLink: document.getElementById('write-link'),
        importantCheckbox: document.getElementById('write-important'),
        postTypeSelector: document.getElementById('post-type-selector'), // 케이스 스터디 기능 제거로 불필요
        
        feedbackQuestions: document.getElementById('feedback-questions'),
    };

    // 수정요청인지, 작성요청인지 체크 
    // URLSearchParams => URL에서 물음표(?) 뒤에 오는 key=value 형태의 문자열을 map과 유사한 방식으로 저장
    //window.location.search 코드는 현재 웹 페이지 주소(URL)에서 물음표(?)로 시작하는 부분, 즉 '쿼리 스트링(query string)' 전체를 문자열로 가져오는 기능을 합니다.
    const urlParams = new URLSearchParams(window.location.search);
    const editPostIdParam = urlParams.get('edit'); // 값이 있으면 수정모드
    let isEditMode = false;
    let editPostData = null;

    //수정 요청일떄만 실행
    if (editPostIdParam) {
        const postId = parseInt(editPostIdParam, 10);
        
        try {
            // ✅ [수정] app.state.posts 대신, 서버에 직접 게시글의 전체 상세 정보를 요청합니다.
            editPostData = await app.api.fetchPostById(postId);
        } catch (error) {
            app.utils.showNotification('게시글 정보를 불러오는 데 실패했습니다.', 'danger');
            return;
        }
        
        if (editPostData) { //게시글 작성 본인, 관리자가 아니면 수정 불가
            if (editPostData.author !== currentUser.name && currentUser.role !== '관리자') {
                app.utils.showNotification('수정 권한이 없습니다.', 'danger');
                setTimeout(() => { window.location.href = `post-detail.html?id=${postId}`; }, 1500);
                return;
            }
            isEditMode = true;
        } else {
            app.utils.showNotification('존재하지 않는 게시글입니다.', 'danger');
        }
    }

    
    function initializeWritePage() {
        populateCategories(); //게시글 카테고리 드롭다운 메뉴()를 동적으로 채워주는 함수
        setupEventListeners();
        
        if (currentUser.role === '관리자') {
             const importantGroup = document.getElementById('important-group');
             if (importantGroup) importantGroup.style.display = 'block';
        }

        //수정 화면 띄우기
        if (isEditMode) { 
            loadPostDataForEdit();
        }
    }

    //직무 드롭다운 메뉴()를 동적으로 채워주는 함수
    function populateCategories() {
        if (!elements.category) return;
        const categories = app.state.categories || [];
        categories.forEach(category => {
            elements.category.add(new Option(category, category));
        });
        
        if (currentUser.role === '관리자') {
            const noticeOption = new Option('공지', '공지');
            elements.category.prepend(noticeOption);
        }
    }

    function loadPostDataForEdit() {
        elements.pageTitle.textContent = '게시글 수정하기';
        elements.pageDescription.textContent = '게시글 내용을 수정합니다.';
        elements.submitButton.textContent = '수정 완료';
        
        elements.postId.value = editPostData.id;
        // ✅ [수정] editPostData.categories 배열 대신, 단일 문자열인 editPostData.category를 사용합니다.
        elements.category.value = editPostData.category;
        elements.title.value = editPostData.title;
        elements.portfolioLink.value = editPostData.githubUrl || ''; // ✅ [수정] githubUrl 필드를 사용합니다.
        elements.importantCheckbox.checked = editPostData.isImportant;
        elements.feedbackQuestions.value = editPostData.content; // ✅ [수정] content 필드를 직접 사용합니다.
    }

    //사용자가 '피드백 요청'이나 '수정 완료' 버튼을 눌러 폼을 제출할 때  페이지를 새로고침하지 않고 서버에 데이터를 비동기적으로 전송하는 기능
    function setupEventListeners() {
        if (elements.form) elements.form.addEventListener('submit', handleFormSubmit);
    }
    
    async function handleFormSubmit(e) { 
        e.preventDefault(); 
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;        
        
        let contentData;
        let isContentValid = false;

        // ✅ [수정] contentData에 JSON 구조 대신 textarea의 텍스트 값을 직접 저장합니다.
        contentData = elements.feedbackQuestions.value.trim();
        isContentValid = !!contentData;

        const postData = {
            title: elements.title.value.trim(),
            content: contentData,
            category: elements.category.value,
            // ✅ [수정] 프론트엔드의 portfolioLink를 백엔드 DTO의 githubUrl 필드명과 일치시킵니다.
            githubUrl: elements.portfolioLink.value.trim() || null,
            isImportant: (currentUser.role === '관리자') ? elements.importantCheckbox.checked : (isEditMode ? editPostData.isImportant : false),
            file: isEditMode ? editPostData.file : null // 파일 관련 로직 제거
        };

        if (!postData.title || !isContentValid) {
            app.utils.showNotification('제목과 필수 내용(가장 피드백 받고 싶은 점)을 모두 입력해주세요.', 'warning');
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '수정 완료' : '피드백 요청';
            return;
        }
        
        try {
            if (isEditMode) {
                // --- UPDATE (수정) ---
                submitButton.textContent = '수정 중...';
                const postId = parseInt(elements.postId.value, 10);
                await app.api.updatePost(postId, postData);
                const postIndex = app.state.posts.findIndex(p => p.id === postId);
                if (postIndex > -1) {
                    app.state.posts[postIndex] = { ...app.state.posts[postIndex], ...postData };
                }
                app.utils.showNotification('게시글이 성공적으로 수정되었습니다!', 'success');
                setTimeout(() => { window.location.href = `posts.html#post-${postId}`; }, 1500);
            
            } else {
                // --- CREATE (새 글) ---
                submitButton.textContent = '등록 중...';
                const newPost = await app.api.createPost(postData);
                app.utils.showNotification('게시글이 성공적으로 등록되었습니다!', 'success');
                setTimeout(() => { window.location.href = `posts.html#post-${newPost.id}`; }, 1500);
            }
        } catch (error) {
            console.error('Submit error:', error);
            app.utils.showNotification('작업에 실패했습니다.', 'danger');
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '수정 완료' : '피드백 요청';
        }
    }

    // ✅ [수정] 페이지가 로드될 때 바로 실행하는 대신, shared.js에서 모든 데이터가 준비되었다는 신호를 받으면 실행합니다.
    // 데이터 로딩이 이 스크립트 실행보다 먼저 끝났을 경우를 대비하여, 이미 데이터가 있는지 확인합니다.
    if (app.state.categories && app.state.categories.length > 0) {
        initializeWritePage();
    } else {
        // 아직 데이터가 없다면, 데이터 로딩 완료 이벤트를 기다립니다.
        document.addEventListener('app-data-loaded', initializeWritePage, { once: true });
    }
});