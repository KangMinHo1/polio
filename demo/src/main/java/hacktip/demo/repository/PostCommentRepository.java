package hacktip.demo.repository;

import hacktip.demo.domain.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    // 특정 게시글(PostId)에 해당하는 모든 댓글을 생성일 오름차순으로 조회
    List<PostComment> findByPost_PostIdOrderByCreateDateAsc(Long postId);
}