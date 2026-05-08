import React, { useState, useMemo } from "react";
import { Button, Alert, FormGroup, Input } from "../../../../../../../components/bootstrap";
import { FormulaData } from "../../formulaBuilder";
import Icon from "../../../../../../../components/icon";

interface TestFormulaProps {
    formulaData: FormulaData;
    availableVariables: { name: string; example?: number }[];
    onTestResult?: (result: number) => void;
}

// Extract variable names from expression
const extractVariables = (expression: string): string[] => {
    const matches = expression?.match(/\b[a-zA-Z_]\w*\b/g);
    if (!matches) return [];

    return Array.from(new Set(matches)).filter((v) => isNaN(Number(v)));
};

const TestFormula: React.FC<TestFormulaProps> = ({
    formulaData,
    availableVariables,
    onTestResult,
}) => {
    const [testValues, setTestValues] = useState<Record<string, number | "">>({});
    const [testResult, setTestResult] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const variables = useMemo(
        () => extractVariables(formulaData.expression),
        [formulaData.expression]
    );

    // Check if all fields are filled
    const isFormValid =
        variables.length > 0 &&
        variables.every(
            (v) =>
                testValues[v] !== undefined &&
                testValues[v] !== null &&
                testValues[v] !== ""
        );

    const handleTestFormula = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // Required validation
        for (let variable of variables) {
            if (
                testValues[variable] === undefined ||
                testValues[variable] === null ||
                testValues[variable] === ""
            ) {
                setError(`"${variable}" is required`);
                setTestResult(null);
                return;
            }
        }

        try {
            const args = variables.map((v) => Number(testValues[v]));

            // Safe function execution
            const func = new Function(
                ...variables,
                `return ${formulaData.expression}`
            );

            const result = func(...args);

            if (typeof result === "number" && !isNaN(result)) {
                setTestResult(result);
                setError(null);
                onTestResult?.(result);
            } else {
                throw new Error("Invalid result");
            }
        } catch (err) {
            setError("Invalid formula expression");
            setTestResult(null);
        }
    };

    if (variables.length === 0) return null;

    return (
        <div className="border rounded p-4 mb-3">
            <div className="d-flex align-items-center gap-2 mb-3">
                <h5 className="mb-0">
                    <Icon icon="PlayArrow" /> Test Formula
                </h5>
            </div>

            <form>
                <div className="row g-3">
                    {variables.map((varName) => (
                        <div key={varName} className="col-md-6">
                            <FormGroup
                                id={`test-${varName}`}
                                label={varName}
                            >
                                <Input
                                    type="number"
                                    placeholder={
                                        availableVariables
                                            .find((v) => v.name === varName)
                                            ?.example?.toString() || "0"
                                    }
                                    value={testValues[varName] ?? ""}
                                    onChange={(e:any) => {
                                        const value = e.target.value;

                                        setTestValues({
                                            ...testValues,
                                            [varName]:
                                                value === ""
                                                    ? ""
                                                    : Number(value),
                                        });
                                    }}
                                    className={
                                        error &&
                                        (testValues[varName] === "" ||
                                            testValues[varName] === undefined)
                                            ? "is-invalid"
                                            : ""
                                    }
                                />
                            </FormGroup>
                        </div>
                    ))}
                </div>

                <Button
                    className="mt-3 w-100"
                    color="primary"
                    isLight
                    icon="PlayArrow"
                    onClick={handleTestFormula}
                    isDisable={!isFormValid}
                >
                    Calculate Result
                </Button>
            </form>

            {error && (
                <Alert
                    color="danger"
                    isLight
                    className="mt-3"
                >
                    {error}
                </Alert>
            )}

            {testResult !== null && !error && (
                <Alert
                    color="success"
                    isLight
                    className="mt-3 d-flex align-items-center gap-2"
                >
                    <div>
                        <p className="mb-1 small fw-semibold">
                            Formula Result:
                        </p>
                        <p className="mb-0 fs-5">
                            {testResult.toFixed(2)}
                        </p>
                    </div>
                </Alert>
            )}
        </div>
    );
};

export default TestFormula;