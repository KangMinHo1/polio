package hacktip.demo.repository;

import hacktip.demo.domain.post.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    // 2. (추가) 게시물 전체 목록 조회 (최신순 정렬)
    //    JPA 쿼리 파생: 'CreateDate' 필드를 'Desc'(내림차순)로 정렬하여 'FindAll'
    List<Post> findAllByOrderByCreateDateDesc();

    List<Post> findAllByCategory_CategoryNameOrderByCreateDateDesc(String categoryName);
}
