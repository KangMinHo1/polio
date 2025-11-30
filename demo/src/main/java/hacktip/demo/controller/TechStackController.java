package hacktip.demo.controller;

import hacktip.demo.dto.PopularTechStackDto;
import hacktip.demo.dto.TechStackDto;
import hacktip.demo.service.TechStackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tech-stacks")
@RequiredArgsConstructor
public class TechStackController {

    private final TechStackService techStackService;

    /**
     * 모든 기술 스택 조회 API
     * [GET] /api/tech-stacks
     */
    @GetMapping
    public ResponseEntity<List<TechStackDto>> getAllTechStacks() {
        return ResponseEntity.ok(techStackService.getAllTechStacks());
    }


}
