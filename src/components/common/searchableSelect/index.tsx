import React, { useEffect, useMemo, useRef, useState } from "react";
import "./style.scss";
import classNames from "classnames";
import Validation from "../../bootstrap/forms/Validation";

export interface SearchableSelectProps<T> {
  options: T[];

  value?: string | number | Array<string | number> | null;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;

  label?: string;

  /** used for search & fallback display */
  labelKey?: string;

  /** custom display formatter (optional) */
  renderLabel?: (item: T, index: number) => React.ReactNode;

  valueKey?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  multiple?: boolean;

  isTouched?: boolean;
  isValid?: boolean;
  invalidFeedback?: string;
  validFeedback?: string;
  isValidMessage?: boolean;
  isTooltipFeedback?: boolean;

  isLoading?: boolean;
  disabled?: boolean;
  className?: string
}

const SearchableSelect = <T extends Record<string, any>>({
  options,
  value,
  onChange,
  label,
  labelKey = "label",
  renderLabel,
  valueKey = "value",
  placeholder = "",
  multiple = false,
  name = "",
  id = "",

  isTouched,
  isValid,
  invalidFeedback,
  validFeedback,
  isValidMessage = true,
  isTooltipFeedback,

  isLoading = false,
  disabled = false,
}: SearchableSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  /* ================= HELPERS ================= */




  const getValue = (item: T) => item[valueKey];

  // const getLabel = (item: T) =>
  //   renderLabel ? renderLabel(item) : String(item[labelKey]);

  // const getSearchText = (item: T) =>
  //   String(item[labelKey] ?? "").toLowerCase();

  const getValueByPath = (obj: any, path: string) =>
    path.split('.').reduce((acc, key) => acc?.[key], obj);

  const getItemValue = (item: T) =>
    labelKey.includes('.')
      ? getValueByPath(item, labelKey)
      : (item as any)[labelKey];

  const getLabel = (item: T, index: number) =>
    renderLabel ? renderLabel(item, index) : String(getItemValue(item) ?? '');

  const getSearchText = (item: T) =>
    String(getItemValue(item) ?? '').toLowerCase();


  /* ================= RESOLVE VALUE ================= */

  const resolvedValue: any = useMemo(() => {
    if (multiple) {
      return Array.isArray(value)
        ? options.filter(o => value.includes(getValue(o)))
        : [];
    }

    return value !== null && value !== undefined
      ? options.find(o => getValue(o) === value) || null
      : null;
  }, [value, options, multiple]);

  const hasValue = multiple
    ? (resolvedValue as T[])?.length > 0
    : !!resolvedValue;

  /* ================= SEARCH ================= */

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter(opt =>
      getSearchText(opt).includes(search.toLowerCase())
    );
  }, [search, options]);

  /* ================= CHANGE EMITTER ================= */

  const triggerChange = (
    newValue: string | number | Array<string | number>
  ) => {
    if (disabled || isLoading) return;

    const event = {
      target: {
        name,
        id,
        value: newValue,
      },
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;

    onChange?.(event);
  };

  /* ================= SELECT ================= */

  const selectOption = (opt: T) => {
    if (disabled || isLoading) return;

    const optValue = getValue(opt);

    if (!multiple) {
      triggerChange(optValue);
      setOpen(false);
      return;
    }

    const current = Array.isArray(value) ? value : [];
    const newValue = current.includes(optValue)
      ? current.filter(v => v !== optValue)
      : [...current, optValue];

    triggerChange(newValue);
  };

  /* ================= OUTSIDE CLICK ================= */

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  /* ================= VALIDATION ================= */

  const VALIDATION = isValidMessage && (
    <Validation
      isTouched={isTouched}
      invalidFeedback={invalidFeedback}
      validFeedback={validFeedback}
      isTooltip={isTooltipFeedback}
    />
  );


  /* ================= UI ================= */

  return (
    <>
      <div
        ref={ref}
        className={classNames("searchable-select", {
          "has-value": hasValue,
          "is-disabled": disabled,
          "is-loading": isLoading,
        })}
      >
        {/* CONTROL */}
        <div
          id={id}
          className={classNames(
            "searchable-select__control",
            "form-control",
            {
              "is-invalid": isTouched && !isValid && !hasValue,
              "is-valid": isTouched && isValid,
            }
          )}
          onClick={e => {
            if (disabled || isLoading) return;
            e.stopPropagation();
            setOpen(p => !p);
          }}
        >
          <div className="searchable-select__value">
            {isLoading ? (
              <span className="searchable-select__placeholder">
                Loading...
              </span>
            ) : multiple ? (
              hasValue ? (
                (resolvedValue as T[]).map((item, i: number) => (
                  <div
                    key={String(getValue(item))}
                    className="searchable-select__tag"
                  >
                    {getLabel(item, i)}
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        selectOption(item);
                      }}
                    >
                      ×
                    </span>
                  </div>
                ))
              ) : (
                <span className="searchable-select__placeholder">
                  {placeholder}
                </span>
              )
            ) : resolvedValue ? (
              getLabel(resolvedValue,0)
            ) : (
              <span className="searchable-select__placeholder">
                {!label ? placeholder : ""} 
              </span>
            )}
          </div>

          <span
            className={classNames("searchable-select__arrow", {
              "searchable-select__arrow--open": open,
            })}
          />
        </div>

        {/* DROPDOWN */}
        {open && !disabled && !isLoading && (
          <div className="searchable-select__menu">
            {options?.length > 5 && <div className="searchable-select__search">
              <input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>}

            <div className="searchable-select__options">
              {filteredOptions.length === 0 && (
                <div className="searchable-select__empty">
                  No results
                </div>
              )}

              {filteredOptions.map((opt, i: number) => (
                <div
                  key={String(getValue(opt))}
                  className={classNames("searchable-select__option", {
                    "searchable-select__option--selected":
                      multiple
                        ? (resolvedValue as T[]).some(
                          v => getValue(v) === getValue(opt)
                        )
                        : resolvedValue &&
                        getValue(resolvedValue) === getValue(opt),
                  })}
                  onClick={e => {
                    e.stopPropagation();
                    selectOption(opt);
                  }}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={
                        multiple
                          ? (resolvedValue as T[]).some(
                            v => getValue(v) === getValue(opt)
                          )
                          : false
                      }
                      readOnly
                    />
                  )}
                  {getLabel(opt, i)}
                </div>
              ))}
            </div>
          </div>
        )}
        {VALIDATION}
      </div>

      {/* LABEL */}
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}


    </>
  );
};

export default SearchableSelect;
