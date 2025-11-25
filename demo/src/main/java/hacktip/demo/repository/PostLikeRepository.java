package hacktip.demo.repository;

import hacktip.demo.domain.post.PostLike;
import hacktip.demo.domain.post.PostLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {
    Optional<PostLike> findByPost_PostIdAndMember_MemberId(Long postId, Long memberId);
    int countByPost_PostId(Long postId);
}