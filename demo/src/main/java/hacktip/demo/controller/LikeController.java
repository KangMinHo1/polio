package hacktip.demo.controller;

import hacktip.demo.dto.postDto.LikeResponseDto;
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
    public ResponseEntity<LikeResponseDto> toggleLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        String email = userDetails.getMember().getEmail();
        int updatedLikes = likeService.toggleLike(postId, email);
        return ResponseEntity.ok(new LikeResponseDto(updatedLikes));
    }
}