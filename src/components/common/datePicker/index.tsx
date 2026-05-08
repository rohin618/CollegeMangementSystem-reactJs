// import React, { useState, useRef, useEffect, JSX } from "react";
// import moment, { Moment } from "moment";
// // import "bootstrap/dist/css/bootstrap.min.css";
// import Icon from "../../icon";
// import { error } from "console";
// import { FormGroup, Input, InputGroup, InputGroupText, Select, Option, Button } from "../../bootstrap";
// import { SALUTATION_LIST } from "../../../common/data/option";
// import classNames from "classnames";
// import useDarkMode from "../../../hooks/useDarkMode";
// export interface FormChangeEvent {
//     target: {
//         name: string;
//         value: string;
//         id?: string;
//     };
// }


// interface DateTimePickerProps {
//     minDate?: Moment| string;
//     maxDate?: Moment | string;
//     value?: string;
//     initialView?: "days" | "months" | "years" | "decades";
//     onChange?: (e: FormChangeEvent | any) => void;


//     id?: string;
//     name?: string;
//     invalidFeedback?: string
//     dateFormat?: string,
//     label?: string,
//     isFloating?: boolean,
//     isValid?: boolean,
//     isTouched?: boolean,
//     placeholder?: string
//     disabled?:boolean;

// }

// export const DateTimePicker: React.FC<DateTimePickerProps> = ({
//     minDate,
//     maxDate,
//     value,
//     initialView = "days",
//     onChange,
//     id = '',
//     name = '',
//     invalidFeedback = '',
//     isValid,
//     isTouched,
//     dateFormat = 'DD-MM-YYYY',
//     label = '',
//     isFloating,
//     placeholder = 'DD-MM-YYYY',
//     disabled
// }) => {
//     const [viewMode, setViewMode] = useState<"days" | "months" | "years" | "decades">(initialView);
//     const [currentDate, setCurrentDate] = useState<Moment>(moment());
//     const [selectedDate, setSelectedDate] = useState<Moment | null>(moment(value) || null);
//     const [showPicker, setShowPicker] = useState<boolean>(false);
//     const {darkModeStatus} = useDarkMode();
//  useEffect(() => {
//   let baseDate = value ? moment(value) : moment();

//   // Clamp with minDate
//   if (minDate && baseDate.isBefore(minDate, "day")) {
//     baseDate = moment(minDate);
//   }

// //   // Clamp with maxDate
// //   if (maxDate && baseDate.isAfter(maxDate, "day")) {
// //     baseDate = moment(maxDate);
// //   }

//   setCurrentDate(baseDate);
//   setSelectedDate(value ? moment(value) : null);

// }, [value, minDate, maxDate]);



//     const inputRef = useRef<HTMLDivElement>(null);
//     const pickerRef = useRef<HTMLDivElement>(null);

//     // Close picker when clicking outside
//     useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//             if (
//                 pickerRef.current &&
//                 !pickerRef.current.contains(event.target as Node) &&
//                 inputRef.current &&
//                 !inputRef.current.contains(event.target as Node)
//             ) {
//                 setShowPicker(false);
//             }
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const isDisabled = (day: Moment): boolean => {
//         if (minDate && day.isBefore(minDate, "day")) return true;
//         if (maxDate && day.isAfter(maxDate, "day")) return true;
//         return false;
//     };


//   const canGoPrev = () => {
//     if (!minDate) return true;
//     return currentDate
//       .clone()
//       .subtract(1, "month")
//       .endOf("month")
//       .isSameOrAfter(minDate, "day");
//   };

//   const canGoNext = () => {
//     if (!maxDate) return true;
//     return currentDate
//       .clone()
//       .add(1, "month")
//       .startOf("month")
//       .isSameOrBefore(maxDate, "day");
//   };

//     const renderDays = () => {
//         const days: JSX.Element[] = [];
//         const start = currentDate.clone().startOf("month").weekday(0);
//         const end = currentDate.clone().endOf("month").weekday(6);
//         let day = start.clone();

//         // Weekday headers
//         days.push(
//             ...["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
//                 <div key={`header-${i}`} className="fw-bold small">
//                     {d}
//                 </div>
//             ))
//         );
//         while (day.isSameOrBefore(end, "day")) {
//             const disabled = isDisabled(day);
//             const classes = ["day"];

//             if (!day.isSame(currentDate, "month")) classes.push("text-muted");
//             if (day.isSame(moment(), "day")) classes.push("today");
//             if (selectedDate && day.isSame(selectedDate, "day")) classes.push("selected");
//             if (disabled) classes.push("disabled");

//             const selectedDay = day.clone(); // 🔴 important
//             days.push(
//                 <div
//                     key={selectedDay.format("YYYY-MM-DD")}
//                     className={classes.join(" ")}
//                     style={{
//                         pointerEvents: disabled ? "none" : "auto",
//                         opacity: disabled ? 0.4 : 1
//                     }}
//                     onClick={() => {
//                         if (!disabled) {
//                             setSelectedDate(selectedDay);
//                             onChange?.({
//                                 target: {
//                                     name,
//                                     id,
//                                     value: selectedDay.format("YYYY-MM-DD")
//                                 }
//                             });
//                             setShowPicker(false);
//                         }
//                     }}
//                 >
//                     {selectedDay.date()}
//                 </div>
//             );

//             day.add(1, "day");
//         }

//         return days;
//     };


//     const renderMonths = () =>
//         moment.monthsShort().map((m, idx) => (
//             <div
//                 key={m}
//                 className={`month ${currentDate.month() === idx ? "selected" : ""}`}
//                 onClick={() => {
//                     setCurrentDate(currentDate.clone().month(idx));
//                     setViewMode("days");
//                 }}
//             >
//                 {m}
//             </div>
//         ));

//     const renderYears = () => {
//         const year = currentDate.year();
//         const startYear = year - (year % 10);
//         const years: JSX.Element[] = [];
//         for (let y = startYear - 1; y <= startYear + 10; y++) {
//             const disabled =
//                 (minDate && moment(y, "YYYY").isBefore(minDate, "year")) ||
//                 (maxDate && moment(y, "YYYY").isAfter(maxDate, "year"));

//             years.push(
//                 <div
//                     key={y}
//                     className={`year ${y === year ? "selected" : ""} ${disabled ? "disabled" : ""}`}
//                     style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.4 : 1 }}
//                     onClick={() => {
//                         if (!disabled) {
//                             setCurrentDate(currentDate.clone().year(y));
//                             setViewMode("months");
//                         }
//                     }}
//                 >
//                     {y}
//                 </div>
//             );
//         }
//         return years;
//     };

//     const renderDecades = () => {
//         const year = currentDate.year();
//         const startDecade = year - (year % 100);
//         const decades: JSX.Element[] = [];
//         for (let y = startDecade; y < startDecade + 100; y += 10) {
//             decades.push(
//                 <div
//                     key={y}
//                     className="decade"
//                     onClick={() => {
//                         setCurrentDate(currentDate.clone().year(y));
//                         setViewMode("years");
//                     }}
//                 >
//                     {y}-{y + 9}
//                 </div>
//             );
//         }
//         return decades;
//     };

//     const renderContent = () => {
//         switch (viewMode) {
//             case "days":
//                 return (
//                     <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
//                         {renderDays()}
//                     </div>
//                 );
//             case "months":
//                 return (
//                     <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
//                         {renderMonths()}
//                     </div>
//                 );
//             case "years":
//                 return (
//                     <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
//                         {renderYears()}
//                     </div>
//                 );
//             case "decades":
//                 return (
//                     <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
//                         {renderDecades()}
//                     </div>
//                 );
//             default:
//                 return null;
//         }
//     };

//     const handlePrev = () => {
//         if (viewMode === "days") setCurrentDate(currentDate.clone().subtract(1, "month"));
//         else if (viewMode === "months") setCurrentDate(currentDate.clone().subtract(1, "year"));
//         else if (viewMode === "years") setCurrentDate(currentDate.clone().subtract(10, "years"));
//         else if (viewMode === "decades") setCurrentDate(currentDate.clone().subtract(100, "years"));
//     };

//     const handleNext = () => {
//         if (viewMode === "days") setCurrentDate(currentDate.clone().add(1, "month"));
//         else if (viewMode === "months") setCurrentDate(currentDate.clone().add(1, "year"));
//         else if (viewMode === "years") setCurrentDate(currentDate.clone().add(10, "years"));
//         else if (viewMode === "decades") setCurrentDate(currentDate.clone().add(100, "years"));
//     };

//     const getTitle = (): string => {
//         if (viewMode === "days") return currentDate.format("MMMM YYYY");
//         if (viewMode === "months") return currentDate.format("YYYY");
//         if (viewMode === "years") {
//             const year = currentDate.year();
//             const startYear = year - (year % 10);
//             return `${startYear} - ${startYear + 9}`;
//         }
//         if (viewMode === "decades") {
//             const year = currentDate.year();
//             const startDecade = year - (year % 100);
//             return `${startDecade} - ${startDecade + 99}`;
//         }
//         return "";
//     };

//     return (
//         <>
//             {/* {label && <label className="form-label fw-bold">{label}</label>} */}
//             <FormGroup id={id} label={label} isFloating={isFloating} >
//                 <InputGroup ref={inputRef} className="date-picker-wrapper">


//                     <Input
//                         isValidMessage={false}
//                         placeholder={!isFloating ? placeholder : ""}
//                         value={selectedDate ? selectedDate?.format(dateFormat) : ""}
//                         readOnly
//                         isValid={isValid}
//                         isTouched={isTouched}
//                         invalidFeedback={invalidFeedback}
//                         disabled={disabled}
//                         className={classNames({
//                          "text-light bg-dark": darkModeStatus,
//                         })}
//                     />


//                     <InputGroupText className='p-0'>

//                             <Button icon="DateRange" 

//                             onClick={() => {
//                                 if(disabled) return;
//                                 setShowPicker(!showPicker);
//                                 setViewMode(initialView);
//                             }}></Button>

//                     </InputGroupText>
//                 </InputGroup>
//             </FormGroup>



//             {/* <span className="text-danger">Infof text</span> */}

//             {showPicker && (
//                 <div
//                     ref={pickerRef}
//                     className="card shadow-lg mt-2 p-3 position-absolute"
//                     style={{ width: "320px", maxWidth: "100%", zIndex: 1050 }}
//                 >
//                     <div className="d-flex justify-content-between align-items-center mb-2">
//                         <button className="btn btn-sm btn-light" disabled={!canGoPrev()} onClick={handlePrev}>
//                             {/* <FaChevronLeft /> */}
//                             <Icon icon="ChevronLeft" />
//                         </button>
//                         <h6
//                             className="mb-0 fw-semibold"
//                             style={{ cursor: "pointer" }}
//                             onClick={() => {
//                                 if (viewMode === "days") setViewMode("months");
//                                 else if (viewMode === "months") setViewMode("years");
//                                 else if (viewMode === "years") setViewMode("decades");
//                             }}
//                         >
//                             {getTitle()}
//                         </h6>
//                         <button className="btn btn-sm btn-light" disabled={!canGoNext()}  onClick={handleNext}>
//                             {/* <FaChevronRight /> */}
//                             <Icon icon="ChevronRight" />
//                         </button>
//                     </div>
//                     {renderContent()}
//                 </div>
//             )}

//             <style>{`
//         .day, .month, .year, .decade {
//           cursor: pointer;
//           border-radius: 6px;
//           padding: 10px 0;
//           transition: background 0.2s;
//         }
//         .btn-date-icon {
//             background-color: ${darkModeStatus ? "#212529" : "#f8f9fa"};
//             border: 1px solid ${darkModeStatus ? "#212529" : "#f8f9fa"};
//         }
//          .day:hover, .month:hover, .year:hover, .decade:hover {
//            background: ${darkModeStatus ? "#2b3035" : "#f1f1f1"};
//         }
//         .today {
//           border: 1px solid #0d6efd;
//           border-radius: 50%;
//         }
//         .selected {
//           background: #0d6efd;
//           color: #fff !important;
//           font-weight: bold;
//         }
//         .disabled {
//           pointer-events: none;
//           opacity: 0.4;
//         }
//         @media (max-width: 576px) {
//           .card {
//             width: 100% !important;
//             left: 0 !important;
//             right: 0 !important;
//           }
//           .day, .month, .year, .decade {
//             padding: 14px 0;
//             font-size: 1rem;
//           }
//         }
//       `}</style>
//         </>
//     );
// };


import React, { useState, useRef, useEffect, JSX } from "react";
import moment, { Moment } from "moment";
import Icon from "../../icon";
import { FormGroup, Input, InputGroup, InputGroupText, Button } from "../../bootstrap";
import classNames from "classnames";
import useDarkMode from "../../../hooks/useDarkMode";

export interface FormChangeEvent {
    target: {
        name: string;
        value: string;
        id?: string;
    };
}

interface DateTimePickerProps {
    minDate?: Moment | string;
    maxDate?: Moment | string;
    value?: string;
    initialView?: "days" | "months" | "years" | "decades";
    onChange?: (e: FormChangeEvent | any) => void;
    id?: string;
    name?: string;
    invalidFeedback?: string;
    dateFormat?: string;
    label?: string;
    isFloating?: boolean;
    isValid?: boolean;
    isTouched?: boolean;
    placeholder?: string;
    disabled?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    minDate,
    maxDate,
    value,
    initialView = "days",
    onChange,
    id = "",
    name = "",
    invalidFeedback = "",
    isValid,
    isTouched,
    dateFormat = "DD-MM-YYYY",
    label = "",
    isFloating,
    placeholder = "DD-MM-YYYY",
    disabled,
}) => {
    const [viewMode, setViewMode] = useState<"days" | "months" | "years" | "decades">(initialView);
    const [currentDate, setCurrentDate] = useState<Moment>(moment());
    const [selectedDate, setSelectedDate] = useState<Moment | null>(null);
    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>("");
    const [inputError, setInputError] = useState<boolean>(false);
    const [inputFocused, setInputFocused] = useState<boolean>(false);

    const { darkModeStatus } = useDarkMode();

    useEffect(() => {
        let baseDate = value ? moment(value, ["YYYY-MM-DD", dateFormat], true) : null;
        if (baseDate && !baseDate.isValid()) baseDate = null;

        if (baseDate) {
            if (minDate && baseDate.isBefore(minDate, "day")) baseDate = moment(minDate);
            setCurrentDate(baseDate.clone());
            setSelectedDate(baseDate);
            setInputText(baseDate.format(dateFormat));
        } else {
            setSelectedDate(null);
            setInputText("");
        }
    }, [value, minDate, maxDate, dateFormat]);

    const inputRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isDisabledDay = (day: Moment): boolean => {
        if (minDate && day.isBefore(minDate, "day")) return true;
        if (maxDate && day.isAfter(maxDate, "day")) return true;
        return false;
    };

    const canGoPrev = () => {
        if (!minDate) return true;
        return currentDate.clone().subtract(1, "month").endOf("month").isSameOrAfter(minDate, "day");
    };

    const canGoNext = () => {
        if (!maxDate) return true;
        return currentDate.clone().add(1, "month").startOf("month").isSameOrBefore(maxDate, "day");
    };

    useEffect(() => {
        if (value) {
            const parsed = moment(value);
            if (parsed.isValid()) {
                setSelectedDate(parsed);
                setInputText(parsed.format(dateFormat));
            }
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputText(text);
        setInputError(false);
        const parsed = moment(text, dateFormat, true);
        if (parsed.isValid() && !isDisabledDay(parsed)) {
            setSelectedDate(parsed);
            setCurrentDate(parsed.clone());
            onChange?.({ target: { name, id, value: parsed.format("YYYY-MM-DD") } });
        }
    };

    const handleInputBlur = () => {
        setInputFocused(false);
        if (inputText === "") {
            setSelectedDate(null);
            setInputError(false);
            onChange?.({ target: { name, id, value: "" } });
            return;
        }
        const parsed = moment(inputText, dateFormat, true);
        if (!parsed.isValid() || isDisabledDay(parsed)) {
            setInputError(true);
            return;
        }
        setInputError(false);
        setSelectedDate(parsed);
        setCurrentDate(parsed.clone());
        // setInputText(parsed.format(dateFormat));
        onChange?.({ target: { name, id, value: parsed.format("YYYY-MM-DD") } });
    };

    const selectDay = (day: Moment) => {
        setSelectedDate(day);
        // setInputText(day.format(dateFormat));
        setInputError(false);
        onChange?.({ target: { name, id, value: day.format("YYYY-MM-DD") } });
        setShowPicker(false);
    };

    const renderDays = () => {
        const days: JSX.Element[] = [];
        const start = currentDate.clone().startOf("month").weekday(0);
        const end = currentDate.clone().endOf("month").weekday(6);
        let day = start.clone();

        days.push(
            ...["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                <div key={`header-${i}`} className="fw-bold small text-center">{d}</div>
            ))
        );

        while (day.isSameOrBefore(end, "day")) {
            const disabled = isDisabledDay(day);
            const classes = ["day"];
            if (!day.isSame(currentDate, "month")) classes.push("text-muted");
            if (day.isSame(moment(), "day")) classes.push("today");
            if (selectedDate && day.isSame(selectedDate, "day")) classes.push("selected");
            if (disabled) classes.push("disabled");
            const d = day.clone();
            days.push(
                <div
                    key={d.format("YYYY-MM-DD")}
                    className={classes.join(" ")}
                    style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.4 : 1 }}
                    onClick={() => !disabled && selectDay(d)}
                >
                    {d.date()}
                </div>
            );
            day.add(1, "day");
        }
        return days;
    };

    const renderMonths = () =>
        moment.monthsShort().map((m, idx) => (
            <div
                key={m}
                className={`month ${currentDate.month() === idx ? "selected" : ""}`}
                onClick={() => { setCurrentDate(currentDate.clone().month(idx)); setViewMode("days"); }}
            >
                {m}
            </div>
        ));

    const renderYears = () => {
        const year = currentDate.year();
        const startYear = year - (year % 10);
        const years: JSX.Element[] = [];
        for (let y = startYear - 1; y <= startYear + 10; y++) {
            const disabled =
                (minDate && moment(y, "YYYY").isBefore(minDate, "year")) ||
                (maxDate && moment(y, "YYYY").isAfter(maxDate, "year"));
            years.push(
                <div
                    key={y}
                    className={`year ${y === year ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                    style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.4 : 1 }}
                    onClick={() => {
                        if (!disabled) {
                            setCurrentDate(currentDate.clone().year(y));
                            setViewMode("months");
                        }
                    }}
                >
                    {y}
                </div>
            );
        }
        return years;
    };

    const renderDecades = () => {
        const year = currentDate.year();
        const startDecade = year - (year % 100);
        const decades: JSX.Element[] = [];
        for (let y = startDecade; y < startDecade + 100; y += 10) {
            decades.push(
                <div
                    key={y}
                    className="decade"
                    onClick={() => { setCurrentDate(currentDate.clone().year(y)); setViewMode("years"); }}
                >
                    {y}-{y + 9}
                </div>
            );
        }
        return decades;
    };

    const renderContent = () => {
        switch (viewMode) {
            case "days":
                return <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>{renderDays()}</div>;
            case "months":
                return <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>{renderMonths()}</div>;
            case "years":
                return <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>{renderYears()}</div>;
            case "decades":
                return <div className="d-grid text-center mt-2" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>{renderDecades()}</div>;
        }
    };

    const handlePrev = () => {
        if (viewMode === "days") setCurrentDate(currentDate.clone().subtract(1, "month"));
        else if (viewMode === "months") setCurrentDate(currentDate.clone().subtract(1, "year"));
        else if (viewMode === "years") setCurrentDate(currentDate.clone().subtract(10, "years"));
        else if (viewMode === "decades") setCurrentDate(currentDate.clone().subtract(100, "years"));
    };

    const handleNext = () => {
        if (viewMode === "days") setCurrentDate(currentDate.clone().add(1, "month"));
        else if (viewMode === "months") setCurrentDate(currentDate.clone().add(1, "year"));
        else if (viewMode === "years") setCurrentDate(currentDate.clone().add(10, "years"));
        else if (viewMode === "decades") setCurrentDate(currentDate.clone().add(100, "years"));
    };

    const getTitle = (): string => {
        if (viewMode === "days") return currentDate.format("MMMM YYYY");
        if (viewMode === "months") return currentDate.format("YYYY");
        if (viewMode === "years") {
            const s = currentDate.year() - (currentDate.year() % 10);
            return `${s} - ${s + 9}`;
        }
        if (viewMode === "decades") {
            const s = currentDate.year() - (currentDate.year() % 100);
            return `${s} - ${s + 99}`;
        }
        return "";
    };

    const computedIsValid = inputError ? false : isValid;
    const computedIsTouched = inputError ? true : isTouched;
    const computedFeedback = inputError
        ? `Please enter a valid date in ${dateFormat} format`
        : invalidFeedback;

    // Pre-compute error hint as a plain string so JSX never sees false/null
    const errorHint = inputError
        ? `Please enter a valid date in ${dateFormat} format${minDate ? ` (from ${moment(minDate).format(dateFormat)})` : ""
        }${maxDate ? ` to ${moment(maxDate).format(dateFormat)}` : ""}`
        : "";

    return (
        // Wrapping div ensures FormGroup receives exactly one ReactElement child,
        // and the error message / picker popup can live as siblings outside it.
        <div>
            <FormGroup id={id} label={label} isFloating={isFloating}>
                <InputGroup ref={inputRef} className="date-picker-wrapper">
                    <Input
                        isValidMessage={false}
                        placeholder={inputFocused ? dateFormat : (!isFloating ? placeholder : "")}
                        value={inputText}
                        onChange={handleInputChange}
                        onFocus={() => setInputFocused(true)}
                        onBlur={handleInputBlur}
                        isValid={computedIsValid}
                        isTouched={computedIsTouched}
                        invalidFeedback={computedFeedback}
                        disabled={disabled}
                        className={classNames({
                            "text-light bg-dark": darkModeStatus,
                            "border-danger": inputError,
                        })}
                    />
                    <InputGroupText className="p-0">
                        <Button
                            icon="DateRange"
                            onClick={() => {
                                if (disabled) return;
                                setShowPicker(!showPicker);
                                setViewMode(initialView);
                            }}
                        />
                    </InputGroupText>
                </InputGroup>
            </FormGroup>

            {/* Error hint — outside FormGroup, rendered only when errorHint is non-empty string */}
            {/* {errorHint !== "" && (
                <div className="text-danger small mt-1">{errorHint}</div>
            )} */}

            {showPicker && (
                <div
                    ref={pickerRef}
                    className="card shadow-lg mt-2 p-3 position-absolute"
                    style={{ width: "320px", maxWidth: "100%", zIndex: 1050 }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <button className="btn btn-sm btn-light" disabled={!canGoPrev()} onClick={handlePrev}>
                            <Icon icon="ChevronLeft" />
                        </button>
                        <h6
                            className="mb-0 fw-semibold"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (viewMode === "days") setViewMode("months");
                                else if (viewMode === "months") setViewMode("years");
                                else if (viewMode === "years") setViewMode("decades");
                            }}
                        >
                            {getTitle()}
                        </h6>
                        <button className="btn btn-sm btn-light" disabled={!canGoNext()} onClick={handleNext}>
                            <Icon icon="ChevronRight" />
                        </button>
                    </div>
                    {renderContent()}
                </div>
            )}

            <style>{`
        .day, .month, .year, .decade {
          cursor: pointer;
          border-radius: 6px;
          padding: 10px 0;
          transition: background 0.2s;
        }
        .day:hover, .month:hover, .year:hover, .decade:hover {
          background: ${darkModeStatus ? "#2b3035" : "#f1f1f1"};
        }
        .today { border: 1px solid #0d6efd; border-radius: 50%; }
        .selected { background: #0d6efd; color: #fff !important; font-weight: bold; }
        .disabled { pointer-events: none; opacity: 0.4; }
        @media (max-width: 576px) {
          .card { width: 100% !important; left: 0 !important; right: 0 !important; }
          .day, .month, .year, .decade { padding: 14px 0; font-size: 1rem; }
        }
      `}</style>
        </div>
    );
};