import React, { useEffect, useState } from "react";
import { Button } from "../../../../../../components/bootstrap";
import TestFormula from "./testFormula";

export interface FormulaData {
    name?: string;
    description?: string;
    expression: string;
}

interface FormulaBuilderProps {
    // value: FormulaData;
    value: string;
    isValid: string;
    // setFormData: React.Dispatch<React.SetStateAction<FormulaData>>;
    onChange?: (newValue: FormulaData) => void; // fires on every change
}

interface Variable {
    name: string;
    label: string;
}

const AVAILABLE_VARIABLES: Variable[] = [
    { name: "weekPrice", label: "Weekly Fee" },
    { name: "days", label: "Days" },
    { name: "months", label: "Months" },
    { name: "weeks", label: "Weeks" },
];

const QUICK_TEMPLATES = [
    {
        label: "Monthly from weekly",
        expression: "weekPrice * 52 / 12",
        description: "When converting weekly rate to consistent monthly rate",
    },
    {
        label: "Average monthly rate",
        expression: "weekPrice / 7 * 365 / 12",
        description: "When billing monthly using 365-day year",
    },
    {
        label: "Pro-rata",
        expression: "weekPrice / 7 * days",
        description: "When billing based on actual days in a period",
    },
];

const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
    isValid,
    value,
    onChange,
}) => {
    const [formData, setFormData] = useState({ expression: '', label: '', description: '', name: "" });


    useEffect(() => {
        if (value) {
            setFormData((prev) => ({
                ...prev,
                formula: value ,// Make sure the key matches your formData model
                expression: value,
            }));
        }
    }, [value]);


    const updateExpression = (value: string | number) => {
        const updated = {
            ...formData,
            expression:
                formData.expression +
                (formData.expression &&
                    !formData.expression.endsWith(" ") &&
                    !formData.expression.endsWith("(")
                    ? " "
                    : "") +
                value,
        };
        setFormData(updated);
        onChange?.(updated); // notify parent on every change
    };

    const setExpressionDirectly = (value: string, name?: string, description?: string) => {
        const updated = {
            ...formData,
            expression: value,
            name: name || formData.name,
            description: description || formData.description,
            value
        };
        setFormData(updated);
        onChange?.(updated);
    };

    return (
        <>
            <div className="mb-3">
                <label className="form-label fw-semibold">Formula Builder *</label>

                <div className="border rounded p-3  mb-3">
                    {/* Formula Display */}
                    <div
                        className={`bg-white border rounded p-2 mb-3${isValid && ' border-danger '}`}
                        style={{
                            minHeight: "60px",
                            fontFamily: "monospace",
                            fontSize: "0.9rem",
                        }}
                    >
                        {formData.expression ? (
                            formData.expression
                        ) : (
                            <span className="text-muted">
                                Click Buttons below to build your formula...
                            </span>
                        )}
                    </div>
                    {isValid &&  <span className="invalid-feedback d-block mb-2">{isValid}</span>}
                   

                    <div className="d-grid gap-3">
                        {/* Variables */}
                        <div>
                            <label className="form-text text-muted small mb-1 d-block">
                                Add Variable
                            </label>
                            <div className="d-flex flex-wrap gap-2">
                                {AVAILABLE_VARIABLES.map((variable) => (
                                    <Button
                                        key={variable.name}
                                        color="dark"

                                        size="sm"
                                        isLight
                                        onClick={() => updateExpression(variable.name)}
                                    >
                                        {variable.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Operators */}
                        <div>
                            <label className="form-text text-muted small mb-1 d-block">
                                Add Operator
                            </label>
                            <div className="d-flex flex-wrap gap-2">
                                {["+", "-", "*", "/", "(", ")"].map((op) => (
                                    <Button
                                        key={op}
                                        color="dark"
                                        size="sm"
                                        isLight
                                        onClick={() => updateExpression(op)}
                                    >
                                        {op === "*" ? "× (Multiply)" : op === "/" ? "÷ (Divide)" : op}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Add Number */}
                        <div>
                            <label
                                htmlFor="numberInput"
                                className="form-text text-muted small mb-1 d-block"
                            >
                                Add Number
                            </label>
                            <div className="mb-2 d-flex gap-2">
                                <input
                                    id="numberInput"
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm flex-grow-1"
                                    placeholder="Type number and press Enter..."
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const value = (e.target as HTMLInputElement).value;
                                            if (value) {
                                                updateExpression(value);
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    color="dark"
                                    size="sm"
                                    isLight
                                    onClick={() => {
                                        const input = document.getElementById(
                                            "numberInput"
                                        ) as HTMLInputElement | null;
                                        if (input && input.value) {
                                            updateExpression(input.value);
                                            input.value = "";
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </div>

                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <span className="text-muted small">Common:</span>
                                {[7, 12, 13, 30, 52, 365].map((num) => (
                                    <Button
                                        key={num}
                                        color="dark"
                                        size="sm"
                                        isLight
                                        onClick={() => updateExpression(num)}
                                    >
                                        {num}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Templates */}
                        <div>
                            <label className="form-text text-muted small mb-1 d-block">
                                Quick Templates
                            </label>
                            <div className="d-flex flex-wrap gap-2">
                                {QUICK_TEMPLATES.map((tmpl) => (
                                    <Button
                                        key={tmpl.label}
                                        color='info'
                                        size="sm"
                                        isLight
                                        onClick={() =>
                                            setExpressionDirectly(
                                                tmpl.expression,
                                                tmpl.label,
                                                tmpl.description
                                            )
                                        }
                                    >
                                        {tmpl.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2 pt-2 border-top">
                            <Button
                                color='danger'
                                size="sm"
                                isLight

                                onClick={() => {
                                    const expression = formData.expression.trim();
                                    if (expression) {
                                        setExpressionDirectly(expression.slice(0, -1).trim());
                                    }
                                }}
                            >
                                ← Backspace
                            </Button>
                            <Button
                                color='info'
                                size="sm"
                                isLight
                                onClick={() =>
                                    setExpressionDirectly(formData.expression + " ")
                                }
                            >
                                Space
                            </Button>
                            <Button
                                color="danger"
                                size="sm"
                                isLight
                                className="ms-auto"
                                onClick={() => setExpressionDirectly("")}
                            >
                                Clear All
                            </Button>
                        </div>
                    </div>
                </div>

                <p className="text-muted small">
                    Build your formula using the Buttons above. Click “Quick Templates” for
                    common formulas.
                </p>
            </div>

            <TestFormula
                formulaData={formData}
                availableVariables={[
                    { name: "weekPrice", example: 100 },
                    { name: "days", example: 30 },
                    { name: "months", example: 12 },
                ]}
                onTestResult={(res) => console.log("Test Result:", res)}
            />
            {/* </div > */}
        </>
    );
};

export default FormulaBuilder;
