import { DateRangePicker as ReactDateRangePicker } from 'react-date-range';
import { enGB } from 'date-fns/locale';
import { Button, Popovers } from '../../bootstrap';
import { useEffect, useRef, useState } from 'react';
import moment from 'moment';

export interface DateRangeValue {
    startDate: Date;
    endDate: Date;
}

interface DateRangePickerPopoverProps {
    value?: DateRangeValue;
    onApply: (range: DateRangeValue) => void;
    buttonLabel?: (range: DateRangeValue) => string;
    placement?: any;
}

const DateRangePickerPopover = ({
    value,
    onApply,
    buttonLabel,
    placement = 'bottom-end',
}: DateRangePickerPopoverProps) => {
    const popoverRef = useRef<any | null>(null);

    // 🔹 Applied range (single source of truth)
    const [appliedRange, setAppliedRange] = useState<DateRangeValue>(
        value ?? {
            startDate: moment("2025-01-01").toDate(),
            endDate: moment().add('1','year').endOf('year').toDate(),
        },
    );

    // 🔹 Temp range (picker interaction)
    const [tempRange, setTempRange] = useState<any>({
        selection: {
            startDate: appliedRange.startDate,
            endDate: appliedRange.endDate,
            key: 'selection',
        },
    });

    // Sync external value
    useEffect(() => {
        if (value) {
            setAppliedRange(value);
            setTempRange({
                selection: { ...value, key: 'selection' },
            });
        }
    }, [value]);

    const handleApply = () => {
        const range = tempRange.selection;
        setAppliedRange(range);
        popoverRef.current.toggle();
        onApply(range);
    };

    const handleReset = () => {
        const reset = {
            startDate: moment("2025-01-01").toDate(),
            endDate: moment().add('1','year').endOf('year').toDate(),
            key: 'selection',
        };
        onApply(reset);
        setTempRange({ selection: reset });
    };

    const datePicker = (
        <div style={pickerWrapperStyle}>
            <ReactDateRangePicker
                onChange={(item) => setTempRange(item)}
                moveRangeOnFirstSelection={false}
                retainEndDateOnFirstSelection={false}
                months={2}
                ranges={[tempRange.selection]}
                direction='horizontal'
                rangeColors={[
                    String(import.meta.env.VITE_PRIMARY_COLOR),
                    String(import.meta.env.VITE_SECONDARY_COLOR),
                    String(import.meta.env.VITE_SUCCESS_COLOR),
                ]}
                locale={enGB}
            />

            {/* Footer */}
            <div style={footerStyle}>
                <Button color='dark' onClick={handleReset} isLight >
                    Reset
                </Button>
                <Button color='info' onClick={handleApply} isLight >
                    Apply
                </Button>
            </div>
        </div>
    );

    const defaultLabel = `${moment(appliedRange.startDate).format(
        'DD MMM YYYY',
    )} - ${moment(appliedRange.endDate).format('DD MMM YYYY')}`;

    return (
        <Popovers
            ref={popoverRef}
            placement={placement}
            className='mw-100 overflow-hidden'
            bodyClassName='p-0'
            trigger='click'
            desc={datePicker}>
            <Button color='dark' isLight>
                {buttonLabel ? buttonLabel(appliedRange) : defaultLabel}
            </Button>
        </Popovers>
    );
};

export default DateRangePickerPopover;




const pickerWrapperStyle = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    width: "fit-content",
    background: "#fff",
};

const footerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    padding: "10px",
    borderTop: "1px solid #eee",
    gap: "10px",
};

