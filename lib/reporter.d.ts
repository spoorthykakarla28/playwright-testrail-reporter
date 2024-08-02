import { FullConfig, FullResult, Reporter, Suite, TestCase, TestError, TestResult } from "@playwright/test/reporter";
export declare class TestRailReporter implements Reporter {
    onBegin?(config: FullConfig, suite: Suite): Promise<void>;
    onTestEnd(test: TestCase, result: TestResult): void;
    onEnd(result: FullResult): Promise<void>;
    onError(error: TestError): void;
}
/**
 * Get list of matching Test IDs
 */
export declare function getTestCaseName(testname: string): RegExpMatchArray | null;
