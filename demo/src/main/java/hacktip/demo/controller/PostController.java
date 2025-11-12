package hacktip.demo.controller;

import hacktip.demo.domain.Post;
import hacktip.demo.dto.PostRequestDto;
import hacktip.demo.dto.PostResponseDto;
import hacktip.demo.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 'POSTS' 관련 HTTP 요청을 처리하는 컨트롤러.
 * SecurityConfig에 의해 "/api/posts" 경로는 인증이 필요합니다.
 */
@RestController
@RequestMapping("/api/posts") // write.js의 API 경로
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    /**
     * 새 게시글을 생성합니다. (write.js의 app.api.createPost)
     *
     * @param postRequestDto @RequestBody: write.js의 postData 객체 (title, content 등)
     * @param email @AuthenticationPrincipal: JwtAuthenticationFilter가 검증하여
     * SecurityContext에 저장한 사용자의 이메일
     * @return 생성된 게시글의 상세 정보 (PostResponseDto)
     */
    @PostMapping
    public ResponseEntity<PostResponseDto> createPost(
            @Valid @RequestBody PostRequestDto postRequestDto,
            @AuthenticationPrincipal String email) { // JWT 토큰에서 이메일 추출

        // 서비스 레이어를 호출하여 게시글 생성
        Post newPost = postService.createPost(postRequestDto, email);

        // 생성된 엔티티를 DTO로 변환하여 201 Created 응답 반환
        return new ResponseEntity<>(PostResponseDto.fromEntity(newPost), HttpStatus.CREATED);
    }

    // TODO: 게시글 조회(@GetMapping), 수정(@PutMapping), 삭제(@DeleteMapping) API 엔드포인트 추가
}