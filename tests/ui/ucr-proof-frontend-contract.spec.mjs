import { test, expect } from "@playwright/test";

const baseUrl = String(
  process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173",
).replace(/\/$/, "");

const lessonId = "ucr-13-verbal-written-digital-communication";
const unitStableKey = "ucr-communication";
const assignmentId = "assignment_ucr_frontend_contract";
const activityId = "ucr-professional-communication-proof";

test(
  "UCR draft preview exposes proof content but never calls Prepare/Prove",
  async ({ page }) => {
    const prepareProveRequests = [];

    await page.route("**/api/prepare-prove/**", async (route) => {
      prepareProveRequests.push({
        method: route.request().method(),
        url: route.request().url(),
      });

      // Never allow a preview regression to reach a writer.
      await route.abort();
    });

    await page.goto(
      `${baseUrl}/curriculum.html#/curriculum/preview/lessons/${lessonId}`,
      { waitUntil: "networkidle" },
    );

    await expect(
      page.getByRole("heading", {
        name: "Verbal, Written & Digital Communication",
      }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Apply" }).click();

    await expect(
      page.getByTestId("prepare-prove-proof-activity"),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Prove: workplace communication",
      }),
    ).toBeVisible();

    await expect(
      page.getByText(
        /Draft preview only\. Proof submission, evidence creation, review/,
      ),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Submit evidence for review",
      }),
    ).toHaveCount(0);

    // Give effects a chance to run. A preview must still make zero calls.
    await page.waitForTimeout(250);

    expect(prepareProveRequests).toEqual([]);
  },
);

test(
  "assigned UCR proof sends canonical assignment and lesson lineage",
  async ({ page }) => {
    let resultPayload = null;
    let evidencePayload = null;
    let submitted = false;
    const statusRequests = [];

    await page.route("**/assignments", async (route) => {
      if (route.request().method() !== "GET") {
        return route.continue();
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            items: [
              {
                id: assignmentId,
                status: "published",
                accessState: "AVAILABLE",
                curriculumRelease: {
                  releaseId: "release_ucr_frontend_contract",
                  versionNumber: 1,
                  courseId: "course_ucr_frontend_contract",
                  courseTitle: "SHU Universal Career Readiness",
                  courseStableKey: "shu-universal-career-readiness",
                },
                assignedContent: {
                  type: "COURSE",
                  title: "SHU Universal Career Readiness",
                },
                nextLesson: {
                  unitStableKey,
                  lessonStableKey: lessonId,
                  title: "Verbal, Written & Digital Communication",
                  sequence: 13,
                  completed: false,
                },
                scopeLessons: [
                  {
                    unitStableKey,
                    lessonStableKey: lessonId,
                    title: "Verbal, Written & Digital Communication",
                    sequence: 13,
                    completed: false,
                  },
                ],
              },
            ],
          },
        }),
      });
    });

    await page.route(
      "**/activity-domains/assignments/**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: {},
          }),
        });
      },
    );

    await page.route(
      "**/api/prepare-prove/proof-status**",
      async (route) => {
        const url = new URL(route.request().url());

        statusRequests.push({
          activityId: url.searchParams.get("activity_id"),
          assignmentId: url.searchParams.get("assignment_id"),
        });

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: submitted
              ? {
                  result: {
                    result_id: "result_ucr_frontend_contract",
                    activity_id: activityId,
                    assignment_id: assignmentId,
                  },
                  evidence: {
                    evidence_id: "evidence_ucr_frontend_contract",
                  },
                  decision: null,
                }
              : {
                  result: null,
                  evidence: null,
                  decision: null,
                },
          }),
        });
      },
    );

    await page.route(
      "**/api/prepare-prove/activity-results",
      async (route) => {
        resultPayload = route.request().postDataJSON();
        submitted = true;

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: {
              result_id: "result_ucr_frontend_contract",
            },
          }),
        });
      },
    );

    await page.route(
      "**/api/prepare-prove/evidence",
      async (route) => {
        evidencePayload = route.request().postDataJSON();

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: {
              evidence_id: "evidence_ucr_frontend_contract",
            },
          }),
        });
      },
    );

    await page.goto(
      `${baseUrl}/curriculum.html#/curriculum/lessons/${lessonId}?assignmentId=${assignmentId}`,
      { waitUntil: "networkidle" },
    );

    await expect(
      page.getByRole("heading", {
        name: "Verbal, Written & Digital Communication",
      }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Apply" }).click();

    await expect(
      page.getByTestId("prepare-prove-proof-activity"),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Prove: workplace communication",
      }),
    ).toBeVisible();

    // UCR must not inherit Data Center monitoring UI.
    await expect(
      page.getByText("Synthetic monitoring data"),
    ).toHaveCount(0);

    await expect(
      page.getByText("Evidence status: Not submitted"),
    ).toBeVisible();

    await page
      .getByLabel("Relevant workplace facts or message requirements")
      .fill(
        "The supervisor requested written confirmation before the schedule change.",
      );

    await page
      .getByLabel("Communication approach or message")
      .fill(
        "Send a concise written confirmation through the approved workplace channel.",
      );

    await page
      .getByLabel(
        "What assumptions, missing context, or uncertainty remain?",
      )
      .fill(
        "The scenario does not establish whether any additional approval is required.",
      );

    await page
      .getByLabel("Appropriate follow-up or confirmation step")
      .fill(
        "Confirm receipt and verify whether further approval is required.",
      );

    await page
      .getByRole("button", {
        name: "Submit evidence for review",
      })
      .click();

    await expect(
      page.getByTestId("prepare-prove-proof-status"),
    ).toContainText("pending review");

    expect(resultPayload).not.toBeNull();
    expect(resultPayload.result.activity_id).toBe(activityId);
    expect(resultPayload.result.assignment_id).toBe(assignmentId);
    expect(resultPayload.result.unit_stable_key).toBe(unitStableKey);
    expect(resultPayload.result.lesson_stable_key).toBe(lessonId);

    expect(evidencePayload).toEqual({
      source_result_id: "result_ucr_frontend_contract",
      criterion: "professional-workplace-communication",
    });

    expect(statusRequests.length).toBeGreaterThanOrEqual(2);

    for (const request of statusRequests) {
      expect(request.activityId).toBe(activityId);
      expect(request.assignmentId).toBe(assignmentId);
    }

    // Submission creates an evidence candidate only. No review decision
    // is invented by the learner-facing frontend.
    await expect(
      page.getByText("Criteria demonstrated"),
    ).toHaveCount(0);
  },
);
