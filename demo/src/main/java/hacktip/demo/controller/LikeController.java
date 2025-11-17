package hacktip.demo.controller;

import hacktip.demo.security.UserDetailsImpl;
import hacktip.demo.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts/{postId}/like") // 게시글(posts) 하위 리소스로 경로 설정
public class LikeController {

    private final LikeService likeService;

    @PostMapping
    public ResponseEntity<String> toggleLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long memberId = userDetails.getMember().getMemberId();
        likeService.toggleLike(postId, memberId);
        return ResponseEntity.ok("좋아요 처리가 완료되었습니다.");
    }
}