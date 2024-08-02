"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestCaseName = exports.TestRailReporter = void 0;
const testrail_1 = __importDefault(require("@dlenroc/testrail"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Mapping status within Playwright & TestRail
 */
const StatusMap = new Map([
    ["failed", 5],
    ["passed", 1],
    ["skipped", 3],
    ["timedout", 5],
    ["interrupted", 5],
]);
/**
 * Initialise TestRail API credential auth
 */
const executionDateTime = Date().toString().slice(4, 25);
const api = new testrail_1.default({
    host: process.env.TESTRAIL_HOST,
    password: process.env.TESTRAIL_PASSWORD,
    username: process.env.TESTRAIL_USERNAME
});
const runName = process.env.TESTRAIL_RUN_NAME + " - Created On " + executionDateTime;
const projectId = parseInt(process.env.TESTRAIL_PROJECT_ID);
const suiteId = parseInt(process.env.TESTRAIL_SUITE_ID);
const testResults = [];
class TestRailReporter {
    onBegin(config, suite) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!process.env.TESTRAIL_RUN_ID) {
                (0, logger_1.default)("No Existing 'TESTRAIL_RUN_ID' provided by user...");
                (0, logger_1.default)("Automatically creating a run...");
                yield addTestRailRun(projectId);
            }
            else {
                (0, logger_1.default)("Existing Test Run with ID " + process.env.TESTRAIL_RUN_ID + " will be used");
            }
        });
    }
    onTestEnd(test, result) {
        (0, logger_1.default)(`Test Case Completed : ${test.title} Status : ${result.status}`);
        //Return no test case match with TestRail Case ID Regex
        const testCaseMatches = getTestCaseName(test.title);
        if (testCaseMatches != null) {
            testCaseMatches.forEach(testCaseMatch => {
                const testId = parseInt(testCaseMatch.substring(1), 10);
                //Update test status if test case is not skipped
                if (result.status != "skipped") {
                    const testComment = setTestComment(result);
                    const payload = {
                        case_id: testId,
                        status_id: StatusMap.get(result.status),
                        comment: testComment
                    };
                    testResults.push(payload);
                }
            });
        }
    }
    onEnd(result) {
        return __awaiter(this, void 0, void 0, function* () {
            const runId = parseInt(process.env.TESTRAIL_RUN_ID);
            (0, logger_1.default)("Updating test status for the following TestRail Run ID: " + runId);
            yield updateResultCases(runId, testResults);
        });
    }
    onError(error) {
        (0, logger_1.default)(error.message);
    }
}
exports.TestRailReporter = TestRailReporter;
/**
 * Get list of matching Test IDs
 */
function getTestCaseName(testname) {
    const testCaseIdRegex = /\bC(\d+)\b/g;
    const testCaseMatches = [testname.match(testCaseIdRegex)];
    if (testCaseMatches[0] != null) {
        testCaseMatches[0].forEach((testCaseMatch) => {
            const testCaseId = parseInt(testCaseMatch.substring(1), 10);
            (0, logger_1.default)("Matched Test Case ID: " + testCaseId);
        });
    }
    else {
        (0, logger_1.default)("No test case matches available");
    }
    return testCaseMatches[0];
}
exports.getTestCaseName = getTestCaseName;
/**
 * Create TestRail Test Run ID
 * @param projectId
 * @returns
 */
function addTestRailRun(projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield api.addRun(projectId, {
            include_all: false,
            name: runName,
            suite_id: suiteId,
        }).then((res) => {
            (0, logger_1.default)("New TestRail run has been created: " + process.env.TESTRAIL_HOST +
                "/index.php?/runs/view/" + res.id);
            process.env.TESTRAIL_RUN_ID = (res.id).toString();
        }, (reason) => {
            (0, logger_1.default)("Failed to create new TestRail run: " + reason);
        });
    });
}
/**
 * Add Test Result for TestSuite by Test Case ID/s
 * @param api
 * @param runId
 * @param caseId
 * @param status
 */
function addResultForSuite(api, runId, caseId, status, comment) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api.addResultForCase(runId, caseId, {
            status_id: status,
            comment: comment
        }).then((res) => { (0, logger_1.default)("Updated status for caseId " + caseId + " for runId " + runId); }, (reason) => { (0, logger_1.default)("Failed to call Update Api due to " + JSON.stringify(reason)); });
    });
}
/**
 * Set Test comment for TestCase Failed | Passed
 * @param result
 * @returns
 */
function setTestComment(result) {
    if (result.status == "failed" || result.status == "timedOut" || result.status == "interrupted") {
        return "Test Status is " + result.status + " " + JSON.stringify(result.error);
    }
    else {
        return "Test Passed within " + result.duration + " ms";
    }
}
/**
 * Update TestResult for Multiple Cases
 * @param api
 * @param runId
 * @param payload
 */
function updateResultCases(runId, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api.addResultsForCases(runId, {
            results: payload,
        }).then((result) => {
            (0, logger_1.default)("Updated test results for Test Run: " + process.env.TESTRAIL_HOST +
                "/index.php?/runs/view/" + runId);
        }, (reason) => {
            (0, logger_1.default)("Failed to update test results: " + JSON.stringify(reason));
        });
    });
}
//# sourceMappingURL=reporter.js.map