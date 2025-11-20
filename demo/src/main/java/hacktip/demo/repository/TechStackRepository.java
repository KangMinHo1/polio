package hacktip.demo.repository;

import hacktip.demo.domain.TechStack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TechStackRepository extends JpaRepository<TechStack, Long> {
    // 스택 이름으로 조회 (예: "Java", "React")
    Optional<TechStack> findByStackName(String stackName);
}
