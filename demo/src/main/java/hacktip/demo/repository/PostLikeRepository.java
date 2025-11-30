package hacktip.demo.repository;

import hacktip.demo.domain.post.PostLike;
import hacktip.demo.domain.post.PostLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {
    Optional<PostLike> findByPost_PostIdAndMember_MemberId(Long postId, Long memberId);
    int countByPost_PostId(Long postId);

    // [추가] 특정 사용자가 특정 게시물에 좋아요를 눌렀는지 존재 여부만 확인 (성능 최적화)
    boolean existsByPost_PostIdAndMember_MemberId(Long postId, Long memberId);
}