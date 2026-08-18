package com.lms.courseservice.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Long instructorId;
    private String instructorName;
    private BigDecimal price;
    private String duration;
    private Boolean published;
    private String videoUrl;
    private String notesUrl;
    private String notesContent;
    private String notesJson;
    private String videosJson;
    private String tableOfContents;
    private String quizJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
