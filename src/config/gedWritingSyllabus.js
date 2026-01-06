// src/config/gedWritingSyllabus.js

export const gedWritingSyllabus = {
  courseId: "ged-writing",
  courseTitle: "GED Writing – Extended Response Pathway",
  description:
    "A 10-chapter pathway that takes students from understanding the GED Extended Response task to planning, outlining, drafting, revising, and rehearsing for test day.",
  chapters: [
    {
      number: 1,
      slug: "ch1",
      title: "Welcome to the GED & How This Course Works",
      progressPercent: 10,
      studentFile: "/curriculum/ged-writing/ged-writing-ch1.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch1-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch1-family.html",
      artifact: {
        id: 1,
        name: "GED Writing Pathway Snapshot & Goal Sheet",
        portfolioKey: "gedWriting.artifact1",
        type: "planning",
      },
    },
    {
      number: 2,
      slug: "ch2",
      title: "How to Read GED Passages with a Purpose",
      progressPercent: 20,
      studentFile: "/curriculum/ged-writing/ged-writing-ch2.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch2-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch2-family.html",
      artifact: {
        id: 2,
        name: "Annotated Passages + Question Sheet",
        portfolioKey: "gedWriting.artifact2",
        type: "reading",
      },
    },
    {
      number: 3,
      slug: "ch3",
      title: "How to Compare Authors and Choose the Stronger Argument",
      progressPercent: 30,
      studentFile: "/curriculum/ged-writing/ged-writing-ch3.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch3-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch3-family.html",
      artifact: {
        id: 3,
        name: "Stronger Author Choice Paragraph",
        portfolioKey: "gedWriting.artifact3",
        type: "writing-short",
      },
    },
    {
      number: 4,
      slug: "ch4",
      title: "How to Plan the GED Extended Response (5-Box Plan)",
      progressPercent: 40,
      studentFile: "/curriculum/ged-writing/ged-writing-ch4.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch4-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch4-family.html",
      artifact: {
        id: 4,
        name: "5-Box Extended Response Plan",
        portfolioKey: "gedWriting.artifact4",
        type: "planning",
      },
    },
    {
      number: 5,
      slug: "ch5",
      title: "How to Outline the GED Extended Response",
      progressPercent: 50,
      studentFile: "/curriculum/ged-writing/ged-writing-ch5.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch5-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch5-family.html",
      artifact: {
        id: 5,
        name: "Extended Response Outline",
        portfolioKey: "gedWriting.artifact5",
        type: "outline",
      },
    },
    {
      number: 6,
      slug: "ch6",
      title: "How to Write the GED Extended Response Draft",
      progressPercent: 60,
      studentFile: "/curriculum/ged-writing/ged-writing-ch6.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch6-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch6-family.html",
      artifact: {
        id: 6,
        name: "Full Extended Response Draft",
        portfolioKey: "gedWriting.artifact6",
        type: "writing-long",
      },
    },
    {
      number: 7,
      slug: "ch7",
      title: "How to Revise and Improve Your Extended Response",
      progressPercent: 70,
      studentFile: "/curriculum/ged-writing/ged-writing-ch7.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch7-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch7-family.html",
      artifact: {
        id: 7,
        name: "Revised Extended Response (Before/After Pair)",
        portfolioKey: "gedWriting.artifact7",
        type: "revision",
      },
    },
    {
      number: 8,
      slug: "ch8",
      title: "Timed Practice: GED Extended Response Under the Clock",
      progressPercent: 80,
      studentFile: "/curriculum/ged-writing/ged-writing-ch8.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch8-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch8-family.html",
      artifact: {
        id: 8,
        name: "Timed Extended Response #1 (Cell Phone Prompt)",
        portfolioKey: "gedWriting.artifact8",
        type: "timed-draft",
      },
    },
    {
      number: 9,
      slug: "ch9",
      title: "Second Prompt Practice: New Topic, Same Strategy",
      progressPercent: 90,
      studentFile: "/curriculum/ged-writing/ged-writing-ch9.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch9-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch9-family.html",
      artifact: {
        id: 9,
        name: "Timed Extended Response #2 (New Topic)",
        portfolioKey: "gedWriting.artifact9",
        type: "timed-draft",
      },
    },
    {
      number: 10,
      slug: "ch10",
      title: "Full GED Writing Rehearsal & Test-Day Game Plan",
      progressPercent: 100,
      studentFile: "/curriculum/ged-writing/ged-writing-ch10.html",
      instructorFile:
        "/curriculum/ged-writing/instructor/ged-writing-ch10-instructor.html",
      familyFile:
        "/curriculum/ged-writing/family/ged-writing-ch10-family.html",
      artifact: {
        id: 10,
        name: "Final Extended Response + Test-Day Plan",
        portfolioKey: "gedWriting.artifact10",
        type: "capstone",
      },
    },
  ],
};

// Get chapter by number (1–10)
export function getGedWritingChapterByNumber(number) {
  return gedWritingSyllabus.chapters.find(
    (ch) => ch.number === Number(number)
  );
}

// Get chapter by slug ("ch1", "ch2", etc.)
export function getGedWritingChapterBySlug(slug) {
  return gedWritingSyllabus.chapters.find((ch) => ch.slug === slug);
}

// Simple list for menus / sidebars
export function getGedWritingChapterList() {
  return gedWritingSyllabus.chapters.map(
    ({ number, slug, title, progressPercent }) => ({
      number,
      slug,
      title,
      progressPercent,
    })
  );
}


