package com.lms.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(nullable = false)
    private Long instructorId;

    private String instructorName;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private String duration;

    @Builder.Default
    private Boolean published = false;

    @Column(columnDefinition = "TEXT")
    private String videoUrl;

    @Column(columnDefinition = "TEXT")
    private String notesUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String notesContent;

    @Column(columnDefinition = "LONGTEXT")
    private String notesJson;

    @Column(columnDefinition = "LONGTEXT")
    private String videosJson;

    @Column(columnDefinition = "LONGTEXT")
    private String tableOfContents;

    @Column(columnDefinition = "LONGTEXT")
    private String quizJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
