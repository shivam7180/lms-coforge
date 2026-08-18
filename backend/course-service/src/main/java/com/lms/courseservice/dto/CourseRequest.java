package com.lms.courseservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be positive or zero")
    private BigDecimal price;

    private String instructorName;

    private String duration;

    private String videoUrl;

    private String notesUrl;

    private String notesContent;

    private String notesJson;

    private String videosJson;

    private String tableOfContents;

    private String quizJson;
}
