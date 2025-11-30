package hacktip.demo.service;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.post.Category;
import hacktip.demo.domain.post.Post;
import hacktip.demo.dto.CategoryPostCountDto;
import hacktip.demo.dto.postDto.PostCreateRequestDto;
import hacktip.demo.dto.postDto.PostResponseDto;
import hacktip.demo.dto.postDto.PostSimpleResponseDto;
import hacktip.demo.dto.postDto.PostUpdateRequestDto;
import hacktip.demo.repository.CategoryRepository;
import hacktip.demo.repository.MemberRepository;
import hacktip.demo.repository.PostLikeRepository;
import hacktip.demo.repository.PostRepository;
import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final MemberRepository memberRepository;

    private final CategoryRepository categoryRepository;
    private final PostLikeRepository postLikeRepository;

    /**
     * 1. 게시물 생성
     * (Service가 DTO와 email을 받아 Entity를 조립)
     */
    @Transactional
    public PostResponseDto createPost(PostCreateRequestDto requestDto, String email){

        // 1. (인증) 토큰의 email로 작성자(Member) 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Category category = categoryRepository.findByCategoryName(requestDto.getCategory())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));

        // 2. (조립) DTO의 내용물과 Member 엔티티를 Post.builder()에 주입
        Post post = Post.builder()
                .member(member) // 3. (중요) 엔티티는 DTO가 아닌 Member 객체를 받음
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .category(category)
                .githubUrl(requestDto.getGithubUrl())
                .build();

        Post savedPost = postRepository.save(post);


        // 생성 시점에는 '좋아요'를 누르지 않았으므로 isLiked는 항상 false
        return new PostResponseDto(savedPost, false);
    }

    /**
     * 2. 게시물 전체 목록 조회 (최신순)
     * (content가 빠진 Simple DTO 사용)
     */
    @Transactional // (읽기 전용이지만, Lazy Loading을 위해 @Transactional 사용)
    public List<PostSimpleResponseDto>  getAllPosts(){

        // 1. 쿼리 메서드 사용 (최신순)
        List<Post> posts = postRepository.findAllByOrderByCreateDateDesc();

        // 2. (변환) List<Post> -> List<PostSimpleResponseDto>
        return posts.stream()
                .map(PostSimpleResponseDto::new)
                .collect(Collectors.toList());
    }

    /**
     * 3. 게시물 상세 조회 (+ 조회수 1 증가)
     */
    @Transactional
    public PostResponseDto getPostById(Long postId, String email){

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 Id의 게시물이 없습니다. postId : " + postId));

        // '좋아요' 여부는 로그인한 사용자(email != null)에 한해서만 확인합니다.
        // Optional을 활용하여 email과 member가 모두 존재할 경우에만 '좋아요' 상태를 조회합니다.
        boolean isLiked = memberRepository.findByEmail(email)
                .map(member -> postLikeRepository.existsByPost_PostIdAndMember_MemberId(postId, member.getMemberId()))
                .orElse(false); // 사용자가 없거나 비로그인 상태이면 false

        // 조회수 1 증가 (Dirty Checking)
        post.increaseViewCount();

        // Post -> PostResponseDto 변환 (isLiked 상태와 함께)
        return new PostResponseDto(post, isLiked);
    }


    /**
     * 4. 게시물 수정
     * (수정 권한이 있는지 "인가" 검사 포함)
     */
    @Transactional
    public PostResponseDto updatePost(Long postId, PostUpdateRequestDto requestDto, String email){

        // 1. (조회) 수정할 게시물 조회
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 Id의 게시물이 없습니다. postId : " + postId));

        // 2. (인증) 토큰의 email로 사용자(Member) 조회
        Member requestingMember = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Category category = categoryRepository.findByCategoryName(requestDto.getCategory())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));

        // 3. (핵심: 인가) "요청한 사용자"와 "게시물 작성자"가 일치하는지 검사
        if (!post.getMember().getMemberId().equals(requestingMember.getMemberId())) {
            // 4. (실패) 일치하지 않으면 "접근 거부(403)" 예외 발생
            throw new AccessDeniedException("이 게시물을 수정할 권한이 없습니다.");
        }

        // --- (인가 통과) ---
        post.update(requestDto.getTitle(), requestDto.getContent(), category);

        // 수정 후 '좋아요' 상태는 변하지 않으므로, 현재 상태를 다시 조회하여 DTO 생성
        boolean isLiked = postLikeRepository.existsByPost_PostIdAndMember_MemberId(postId, requestingMember.getMemberId());
        return new PostResponseDto(post, isLiked);
    }

    /**
     * 5. 게시물 삭제
     * (삭제 권한이 있는지 "인가" 검사 포함)
     */
    @Transactional
    public void deletePost(Long postId, String email){

        // 1. (조회) 삭제할 게시물 조회
        Post post = postRepository.findById(postId)
                .orElseThrow(()-> new IllegalArgumentException("해당 Id의 게시물이 없습니다. postId : " + postId));

        // 2. (인증) 토큰의 email로 사용자(Member) 조회
        Member requestingMember = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));


        // 3. (핵심: 인가) "요청한 사용자"가 '게시물 작성자'도 아니고 '관리자'도 아닌지 검사
        boolean isAuthor = post.getMember().getMemberId().equals(requestingMember.getMemberId());
        boolean isAdmin = requestingMember.getRole() == hacktip.demo.domain.Role.ADMIN;

        if (!isAuthor && !isAdmin) { // 작성자도 아니고, 관리자도 아니면
            throw new AccessDeniedException("이 게시물을 삭제할 권한이 없습니다.");
        }

        // --- (인가 통과) ---
        // 5. (삭제) DB에서 게시물 삭제
        postRepository.delete(post);
    }

    /**
     * 6. 카테고리별 게시물 목록 조회 (최신순)
     * @param categoryName 조회할 카테고리 이름
     * @return 해당 카테고리의 게시물 목록
     */
    @Transactional
    public List<PostSimpleResponseDto> getPostsByCategory(String categoryName) {
        // 1. 카테고리 존재 여부 확인 (선택적이지만, 유효하지 않은 카테고리 요청에 대해 빠른 실패를 유도)
        if (!categoryRepository.existsByCategoryName(categoryName)) {
            throw new IllegalArgumentException("존재하지 않는 카테고리입니다: " + categoryName);
        }

        // 2. Repository에 추가한 쿼리 메서드를 호출하여 게시물 목록 조회
        List<Post> posts = postRepository.findAllByCategory_CategoryNameOrderByCreateDateDesc(categoryName);

        // 3. (변환) List<Post> -> List<PostSimpleResponseDto>
        return posts.stream().map(PostSimpleResponseDto::new).collect(Collectors.toList());
    }

    /**
     * [신규] 카테고리별 게시물 수 통계 조회
     * @return 카테고리 이름과 게시물 수를 담은 DTO 리스트
     */
    @Transactional(readOnly = true)
    public List<CategoryPostCountDto> getPostCountByCategory() {
        // 2단계에서 만든 Repository 메서드를 그대로 호출하여 결과를 반환합니다.
        return postRepository.countPostsByCategory();
    }

}
