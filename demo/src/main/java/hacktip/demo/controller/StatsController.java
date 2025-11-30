package hacktip.demo.controller;

import hacktip.demo.dto.CategoryPostCountDto;
import hacktip.demo.dto.PopularTechStackDto;
import hacktip.demo.repository.TechStackRepository;
import hacktip.demo.service.PostService;
import hacktip.demo.service.TechStackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final PostService postService;
    private final TechStackService techStackService;


    /**
     *  카테고리 별 게시글 수 통계 조회 API
     * [GET] /api/stats-stacks/popular
     */
    @GetMapping("/posts-by-category")
    public ResponseEntity<List<CategoryPostCountDto>> getPostCountByCategory() {
        List<CategoryPostCountDto> stats = postService.getPostCountByCategory();
        return ResponseEntity.ok(stats);
    }

    /**
     *  인기 기술 스택 통계 조회 API
     * [GET] /api/stats/tech-stacks/popular
     */
    @GetMapping("/tech-stacks/popular")
    public ResponseEntity<List<PopularTechStackDto>> getPopularTechStacks() {
        List<PopularTechStackDto> popularStacks = techStackService.getPopularTechStacks();
        return ResponseEntity.ok(popularStacks);
    }
}
