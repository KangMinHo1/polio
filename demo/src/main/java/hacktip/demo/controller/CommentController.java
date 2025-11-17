package hacktip.demo.controller;

import hacktip.demo.dto.CommentRequestDto;
import hacktip.demo.dto.CommentResponseDto;
import hacktip.demo.security.UserDetailsImpl; // Spring Security의 UserDetails 구현체
import hacktip.demo.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api") // 모든 API 경로에 /api 접두사 추가
public class CommentController {

    private final CommentService commentService;

    /**
     * 특정 게시글의 모든 댓글 조회 API
     * [GET] /api/posts/{postId}/comments
     */
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponseDto>> getComments(@PathVariable Long postId) {
        List<CommentResponseDto> comments = commentService.getComments(postId);
        return ResponseEntity.ok(comments);
    }

    /**
     * 댓글 생성 API
     * [POST] /api/posts/{postId}/comments
     */
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<String> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequestDto requestDto,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        // 현재 로그인한 사용자의 ID를 가져옴
        Long memberId = userDetails.getMember().getMemberId();

        commentService.createComment(postId, memberId, requestDto);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("댓글이 성공적으로 작성되었습니다.");
    }

    /**
     * 댓글 삭제 API
     * [DELETE] /api/comments/{commentId}
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<String> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        // 현재 로그인한 사용자의 ID를 가져옴
        Long memberId = userDetails.getMember().getMemberId();

        try {
            commentService.deleteComment(commentId, memberId);
            return ResponseEntity.ok("댓글이 성공적으로 삭제되었습니다.");
        } catch (AccessDeniedException e) {
            // 서비스 계층에서 권한 없음을 확인하고 예외를 던진 경우
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(e.getMessage());
        }
    }
}