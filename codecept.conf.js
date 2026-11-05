import fs from "fs";
import path from "path";

/** @type {CodeceptJS.MainConfig} */
export const config = {
  // tests: "./codecept_tests/*_test.js",
  tests: "./codecept_tests/submit_proposal_test.js",
  output: "./codecept_output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost:5173/",
      show: false,
    },
    REST: {
      endpoint: "http://localhost:5000",
      defaultHeaders: {
        "Content-Type": "application/json",
      },
    },
  },
  include: {
    I: "./steps_file.js",
  },
  noGlobals: true,
  plugins: {
    customReporter: {
      enabled: true,
      onResult: (result) => {
        try {
          const outputPath = path.resolve("./codecept_output/result.json");
          const simplified = result.simplify();
          if (fs.existsSync(outputPath)) {
            const currentData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
            const currentTests = Array.isArray(currentData.tests)
              ? currentData.tests
              : [];
            const newTests = simplified.tests || [];

            for (const nTest of newTests) {
              const idx = currentTests.findIndex(
                (t) => t.title === nTest.title,
              );
              if (idx >= 0) {
                currentTests[idx] = nTest;
              } else {
                currentTests.push(nTest);
              }
            }

            const passes = currentTests.filter(
              (t) => t.state === "passed",
            ).length;
            const failures = currentTests.filter(
              (t) => t.state === "failed",
            ).length;

            currentData.tests = currentTests;
            currentData.hasFailed = failures > 0;
            currentData.stats = {
              ...currentData.stats,
              passes,
              failures,
              tests: currentTests.length,
              end: new Date().toISOString(),
            };
            fs.writeFileSync(
              outputPath,
              JSON.stringify(currentData, null, 2),
              "utf8",
            );
          } else {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(
              outputPath,
              JSON.stringify(simplified, null, 2),
              "utf8",
            );
          }
        } catch (e) {
          console.error("Failed to update result.json:", e);
        }
      },
      save: false,
    },
  },
  name: "KCPM",
};
