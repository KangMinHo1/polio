package hacktip.demo.controller;

import hacktip.demo.dto.postDto.PostCreateRequestDto;
import hacktip.demo.dto.postDto.PostResponseDto;
import hacktip.demo.dto.postDto.PostSimpleResponseDto;
import hacktip.demo.dto.postDto.PostUpdateRequestDto;
import hacktip.demo.security.UserDetailsImpl;
import hacktip.demo.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    /**
     * 1. 게시물 생성 (POST /posts)
     * (인증된 사용자만)
     */
    @PostMapping                                                                                        // 2. (보안) 인증된 사용자 이메일
    public ResponseEntity<PostResponseDto> createPost(@Valid @RequestBody PostCreateRequestDto requestDto, @AuthenticationPrincipal UserDetailsImpl userDetails){
        String email = userDetails.getUsername(); // UserDetails에서 이메일 추출
        PostResponseDto responseDto = postService.createPost(requestDto, email);

        // 3. 201 Created 응답과 함께 생성된 게시물 정보 반환
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    /**
     * 2. 게시물 전체 목록 조회 (GET /posts)
     * (누구나)
     */
    @GetMapping
    public ResponseEntity<List<PostSimpleResponseDto>> getAllPosts(){
        List<PostSimpleResponseDto> posts = postService.getAllPosts();

        // 4. 200 OK 응답과 함께 목록 반환
        return ResponseEntity.ok(posts);
    }


    /**
     * 3. 게시물 상세 조회 (GET /posts/{postId})
     * (누구나)
     */
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponseDto> getPostById(@PathVariable("postId") Long postId){
        PostResponseDto responseDto = postService.getPostById(postId);

        // 5. 200 OK 응답과 함께 상세 정보 반환
        return ResponseEntity.ok(responseDto);
    }

    /**
     * 4. 게시물 수정 (PATCH /posts/{postId})
     * (인증된 작성자 본인만)
     */
    @PatchMapping("/{postId}")
    public ResponseEntity<PostResponseDto> updatePost(@PathVariable("postId") Long postId, @Valid @RequestBody PostUpdateRequestDto requestDto, @AuthenticationPrincipal UserDetailsImpl userDetails){
        String email = userDetails.getUsername(); // UserDetails에서 이메일 추출

        // 7. (인가) 수정 권한 검사는 Service 계층에서 이미 처리 (AccessDeniedException)
        PostResponseDto responseDto = postService.updatePost(postId, requestDto, email);

        // 8. 200 OK 응답과 함께 수정된 정보 반환
        return ResponseEntity.ok(responseDto);
    }

    /**
     * 5. 게시물 삭제 (DELETE /posts/{postId})
     * (인증된 작성자 본인만)
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<String> deletePost(@PathVariable("postId") Long postId, @AuthenticationPrincipal UserDetailsImpl userDetails){
        String email = userDetails.getUsername(); // UserDetails에서 이메일 추출
        postService.deletePost(postId, email);

        return ResponseEntity.ok("게시물이 삭제되었습니다.");
    }

}
