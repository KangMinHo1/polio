package hacktip.demo.service;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.post.Post;
import hacktip.demo.domain.post.PostLike;
import hacktip.demo.dto.postDto.LikeResponseDto;
import hacktip.demo.repository.MemberRepository;
import hacktip.demo.repository.PostLikeRepository;
import hacktip.demo.repository.PostRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostLikeRepository likeRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public LikeResponseDto toggleLike(Long postId, String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("해당 이메일의 회원을 찾을 수 없습니다: " + email));

        // 1. 사용자가 해당 게시글에 이미 '좋아요'를 눌렀는지 확인
        Optional<PostLike> likeOptional = likeRepository.findByPost_PostIdAndMember_MemberId(postId, member.getMemberId());

        boolean isLiked;

        if (likeOptional.isPresent()) {
            // 2. '좋아요'가 이미 존재하면, 삭제 (좋아요 취소)
            likeRepository.delete(likeOptional.get());
            isLiked = false;
        } else {
            // 3. '좋아요'가 없으면, 생성 (좋아요 누르기)
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new EntityNotFoundException("해당 ID의 게시글을 찾을 수 없습니다: " + postId));

            PostLike newLike = PostLike.builder()
                    .post(post)
                    .member(member)
                    .build();

            likeRepository.save(newLike);
            isLiked = true;
        }
        int likesCount = likeRepository.countByPost_PostId(postId);
        // 4. 업데이트된 좋아요 수 반환
        return new LikeResponseDto(likesCount, isLiked);
    }
}