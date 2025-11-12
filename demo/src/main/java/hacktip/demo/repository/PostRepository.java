package hacktip.demo.repository;

import hacktip.demo.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 'POSTS' 테이블에 대한 Spring Data JPA Repository
 */
@Repository
public interface PostRepository extends JpaRepository<Post, Long> { // PK는 Long (postId)
    // 기본적인 CRUD (save, findById, findAll, deleteById 등) 메서드가 자동 제공됩니다.
}