package hacktip.demo.service;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.Post;
import hacktip.demo.domain.PostLike;
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
    public void toggleLike(Long postId, Long memberId) {
        // 1. 사용자가 해당 게시글에 이미 '좋아요'를 눌렀는지 확인
        Optional<PostLike> likeOptional = likeRepository.findByPost_PostIdAndMember_MemberId(postId, memberId);

        if (likeOptional.isPresent()) {
            // 2. '좋아요'가 이미 존재하면, 삭제 (좋아요 취소)
            likeRepository.delete(likeOptional.get());
        } else {
            // 3. '좋아요'가 없으면, 생성 (좋아요 누르기)
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new EntityNotFoundException("해당 ID의 게시글을 찾을 수 없습니다: " + postId));
            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new EntityNotFoundException("해당 ID의 회원을 찾을 수 없습니다: " + memberId));

            PostLike newLike = PostLike.builder()
                    .post(post)
                    .member(member)
                    .build();

            likeRepository.save(newLike);
        }
    }
}