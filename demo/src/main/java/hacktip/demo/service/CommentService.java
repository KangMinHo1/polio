package hacktip.demo.service;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.post.Post;
import hacktip.demo.domain.post.PostComment;
import hacktip.demo.dto.CommentRequestDto;
import hacktip.demo.dto.CommentResponseDto;
import hacktip.demo.repository.MemberRepository;
import hacktip.demo.repository.PostCommentRepository;
import hacktip.demo.repository.PostRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본적으로는 읽기 전용 트랜잭션으로 설정
public class CommentService {

    private final PostCommentRepository commentRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository; // 작성자 정보를 위해 MemberRepository 주입

    @GetMapping
    public List<CommentResponseDto>findAll(){
        List<PostComment> comments = commentRepository.findAll();

        return comments.stream()
                .map(CommentResponseDto::new)
                .toList();
    }

    /**
     * 특정 게시글의 모든 댓글 조회
     * @param postId 게시글 ID
     * @return 댓글 목록
     */
    public List<CommentResponseDto> getComments(Long postId) {
        // 게시글 존재 여부 확인 (선택적)
        if (!postRepository.existsById(postId)) {
            throw new EntityNotFoundException("해당 ID의 게시글을 찾을 수 없습니다: " + postId);
        }

        return commentRepository.findByPost_PostIdOrderByCreateDateAsc(postId)
                .stream()
                .map(CommentResponseDto::new) // PostComment 엔티티를 CommentResponseDto로 변환
                .collect(Collectors.toList());
    }

    /**
     * 댓글 생성
     * @param postId 게시글 ID
     * @param email 작성자 이메일
     * @param requestDto 댓글 내용
     * @return 생성된 댓글의 ID
     */
    @Transactional // 데이터 변경이 있으므로 쓰기 트랜잭션 적용
    public Long createComment(Long postId, String email, CommentRequestDto requestDto) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 게시글을 찾을 수 없습니다: " + postId));
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("해당 이메일의 회원을 찾을 수 없습니다: " + email));

        PostComment comment = PostComment.builder()
                .post(post)
                .member(member)
                .contents(requestDto.getContents())
                .build();

        PostComment savedComment = commentRepository.save(comment);
        return savedComment.getCommentId();
    }

    /**
     * 댓글 삭제
     * @param commentId 댓글 ID
     * @param email 요청자 이메일 (삭제 권한 확인용)
     */
    @Transactional
    public void deleteComment(Long commentId, String email) throws AccessDeniedException {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 댓글을 찾을 수 없습니다: " + commentId));

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("해당 이메일의 회원을 찾을 수 없습니다: " + email));

        // 댓글 작성자와 삭제 요청자가 동일한지 확인
        if (!comment.getMember().getMemberId().equals(member.getMemberId())) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다.");
        }

        commentRepository.delete(comment);
    }
}