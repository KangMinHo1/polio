package hacktip.demo.repository;

import hacktip.demo.domain.post.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCategoryName(String categoryName); //카테고리 이름으로 조회
    boolean existsByCategoryName(String categoryName); //카테고리 이름으로 존재 여부 확인
}
