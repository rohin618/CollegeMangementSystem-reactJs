import React, { useState, useRef, useEffect } from "react";
import { Input, Checks, Badge } from "../../bootstrap";
import Icon from "../../icon";

interface MultiSelectProps<T> {
    options: T[];
    labelKey: keyof T;
    valueKey: keyof T;
    placeholder?: string;
    label?: string;          // Floating label text
    isFloating?: boolean;    // Enable floating label
    onChange?: (id: object) => void;
    defaultValue?: T[];
    value?: T[];   // Pre-selected values (optional)
    id?: string,
    isValid?: boolean,
    isTouched?: boolean,
    invalidFeedback?: string
}

function MultiSelect<T extends Record<string, any>>({
    options,
    labelKey,
    valueKey,
    placeholder = "Select...",
    label,
    isFloating = false,
    defaultValue = [],
    value = [],
    onChange,
    id = '',
    isValid = false,
    isTouched = false,
    invalidFeedback = ''
}: MultiSelectProps<T>) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<T[]>(defaultValue);
    const [isOpen, setIsOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);


    useEffect(() => {

        if (value?.length > 0) {
            const updated: any = value?.map((v) => {
                return options.find(({ id }) => id === v)
            });
            setSelected(updated);


        }

    }, [value, isOpen, options])

    // Filtered options
    const filtered = options.filter((o) =>
        String(o[labelKey]).toLowerCase().includes(search.toLowerCase())
    );

    // Toggle selection
    const toggleSelect = (option: T) => {
        let updated: T[];
        if (selected.find((s) => s[valueKey] === option[valueKey])) {
            updated = selected.filter((s) => s[valueKey] !== option[valueKey]);
        } else {
            updated = [...selected, option];
        };

        setSelected(updated);
        const value = updated.map(({ id }) => id);
        const e = {
            target: {
                value: value,
                id
            }
        }
        onChange?.(e);
    };

    // Remove tag
    const removeTag = (value: T[keyof T]) => {
        const updated = selected.filter((s) => s[valueKey] !== value);
        const updatedValue = updated.map(({ id }) => id)
        setSelected(updated);
        const e = {
            target: {
                value: updatedValue,
                id
            }
        }
        onChange?.(e);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);


    const input = (
        <Input
            className="flex-grow-1"
            style={{ minWidth: "50px", outline: "none" }}
            placeholder={selected.length || isFloating ? "" : placeholder}
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            // onFocus={() => setIsOpen(true)}
            id={id}
            isValid={isValid}
            isTouched={isTouched}
            invalidFeedback={invalidFeedback}
        />
    )


    // Main Input UI
    const inputField = (
        <div
            className={`border-0 rounded  d-flex flex-wrap gap-1 `}
            onClick={() => setIsOpen((prev) => !prev)}
            style={{ cursor: "pointer" }}
        >

            {isFloating && label ? (<div className="form-floating w-100">
                {input}
                {isFloating && label && (<label htmlFor={id}>{label}</label>)}
            </div>
            ) : input}
            {selected.map((opt) => (
                <Badge key={String(opt[valueKey])} color="info" isLight >
                    {String(opt[labelKey])}

                    <Icon icon="Close" className="fs-5" onClick={(e: any) => {
                        e.stopPropagation();
                        removeTag(opt[valueKey]);
                    }} />
                    {/* </button> */}
                </Badge>
            ))}
        </div>
    );

    return (
        <div className="position-relative" ref={dropdownRef}>
            {inputField}
            {/* Dropdown */}
            {
                isOpen && (
                    <div
                        className="dropdown-menu show w-100 mt-1"
                        style={{ maxHeight: 200, overflowY: "auto" }}
                    >
                        {filtered.length > 0 ? (
                            filtered.map((opt) => (
                                <label
                                    key={String(opt[valueKey])}
                                    className="dropdown-item d-flex align-items-center"
                                >
                                    <Checks
                                        type="checkbox"
                                        className="form-check-input me-2"
                                        checked={selected.some((s) => s[valueKey] === opt[valueKey])}
                                        onChange={() => toggleSelect(opt)}
                                    />
                                    {String(opt[labelKey])}
                                </label>
                            ))
                        ) : (
                            <div className="dropdown-item text-muted">No results</div>
                        )}
                    </div>
                )
            }
        </div >
    );
}

export default MultiSelect;
