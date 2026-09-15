#!/usr/bin/env node

/**
 * Simple Auto-Labeling Script
 * Detects issue type and applies appropriate labels
 * - Detects: bug, enhancement, documentation, question
 * - Marks incomplete issues
 */

const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_REPOSITORY_OWNER;
const repo = process.env.GITHUB_REPOSITORY.split("/")[1];
const issueNumber = process.env.GITHUB_EVENT_ISSUE_NUMBER;

async function autoLabel() {
  try {
    const issue = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    const { title, body } = issue.data;
    const content = `${title} ${body || ""}`.toLowerCase();
    const currentLabels = issue.data.labels.map((l) => l.name);

    const labelsToAdd = [];

    // Detect issue type
    if (content.includes("bug") || content.includes("error") || content.includes("broken")) {
      if (!currentLabels.includes("bug")) {
        labelsToAdd.push("bug");
      }
    } else if (
      content.includes("feature") ||
      content.includes("enhancement") ||
      content.includes("request")
    ) {
      if (!currentLabels.includes("enhancement")) {
        labelsToAdd.push("enhancement");
      }
    } else if (content.includes("doc") || content.includes("readme") || content.includes("guide")) {
      if (!currentLabels.includes("documentation")) {
        labelsToAdd.push("documentation");
      }
    } else if (content.includes("?") || content.includes("how to") || content.includes("question")) {
      if (!currentLabels.includes("question")) {
        labelsToAdd.push("question");
      }
    }

    // Check for incomplete issues
    if (!body || body.trim().length < 20) {
      if (!currentLabels.includes("needs-info")) {
        labelsToAdd.push("needs-info");
      }
    }

    // Apply labels
    if (labelsToAdd.length > 0) {
      await octokit.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels: labelsToAdd,
      });
      console.log(`✓ Added labels: ${labelsToAdd.join(", ")}`);
    }
  } catch (error) {
    console.error("❌ Auto-label failed:", error.message);
    process.exit(1);
  }
}

autoLabel();
