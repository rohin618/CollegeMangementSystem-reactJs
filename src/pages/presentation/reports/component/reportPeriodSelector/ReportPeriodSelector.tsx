import React, { useState, useRef, useEffect } from 'react';
import { FormGroup, Input } from '../../../../../components/bootstrap';
import { DateRange } from 'react-date-range';
import { enGB } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { SearchableSelect } from '../../../../../components/common';

/* =====================================================
   TYPES
===================================================== */

interface ReportPeriodSelectorProps {
  data: {
    reportPeriod: string;
    asOfDate: string; // yyyy-MM-dd
    startDate?: string | Date;
    endDate?: string | Date;
  };
  onPeriodChange: (e: any) => void;
  onDateRangeChange: (range: { startDate: Date; endDate: Date }) => void;
  validator?: any;
  yearLimit?: number;
}

/* =====================================================
   COMPONENT
===================================================== */

export const ReportPeriodSelector: React.FC<ReportPeriodSelectorProps> = ({
  data,
  onPeriodChange,
  onDateRangeChange,
  validator,
  yearLimit,
}) => {
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  /* ---------------- DISPLAY FORMAT ---------------- */

  const formatDisplayDate = (value: Date | string) =>
    format(new Date(value), 'dd/MM/yyyy');

  const getDisplayValue = () => {
    if (data.reportPeriod === 'custom' && data.startDate && data.endDate) {
      return `${formatDisplayDate(data.startDate)} – ${formatDisplayDate(data.endDate)}`;
    }
    return formatDisplayDate(data.asOfDate || todayISO);
  };

  /* ---------------- STATE ---------------- */

  const [showPicker, setShowPicker] = useState(false);

  const [localRange, setLocalRange] = useState({
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : new Date(),
    key: 'selection',
  });

  const isManualDateChange = useRef(false);
  const pickerWrapperRef = useRef<HTMLDivElement>(null);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    if (!data.reportPeriod) {
      onPeriodChange({ target: { id: 'reportPeriod', value: 'today' } });
      onPeriodChange({ target: { id: 'asOfDate', value: todayISO } });
      onDateRangeChange({ startDate: new Date(), endDate: new Date() });
    }
  }, []);

  /* ---------------- OUTSIDE CLICK ---------------- */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerWrapperRef.current && !pickerWrapperRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ---------------- AUTO PERIOD CHANGE ---------------- */

  useEffect(() => {
    if (isManualDateChange.current) {
      onPeriodChange({ target: { id: 'reportPeriod', value: 'custom' } });
      isManualDateChange.current = false;
    }
  }, [data.startDate, data.endDate]);

  /* ---------------- HANDLERS ---------------- */

  const handlePeriodChange = (e: React.ChangeEvent<any>) => {
    const { value } = e.target;
    let date = new Date();

    isManualDateChange.current = false;

    switch (value) {
      case 'today':
        date = new Date();
        break;

      case 'lastWeek':
        date = new Date();
        date.setDate(date.getDate() - 7);
        break;

      case 'lastMonth':
        date = new Date();
        date.setMonth(date.getMonth() - 1);
        break;

      case 'custom':
        setShowPicker(true);
        onPeriodChange({ target: { id: 'reportPeriod', value } });
        return;
    }

    setLocalRange({ startDate: date, endDate: date, key: 'selection' });
    onDateRangeChange({ startDate: date, endDate: date });

    onPeriodChange({ target: { id: 'reportPeriod', value } });
    onPeriodChange({
      target: { id: 'asOfDate', value: format(date, 'yyyy-MM-dd') },
    });
  };

  const handleDateRangeChange = (ranges: any) => {
    const start = ranges.selection.startDate;
    const end = ranges.selection.endDate;

    setLocalRange({ startDate: start, endDate: end, key: 'selection' });

    onPeriodChange({ target: { id: 'reportPeriod', value: 'custom' } });

    onPeriodChange({
      target: { id: 'asOfDate', value: format(start, 'yyyy-MM-dd') },
    });

    onDateRangeChange({ startDate: start, endDate: end });
  };

  /* ---------------- OPTIONS ---------------- */

  const PERIOD_LIST = [
    { value: 'today', label: 'Today' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom' },
  ];

  /* ---------------- MIN/MAX DATES ---------------- */
  let calendarProps: any = {};
  if (yearLimit) {
      calendarProps.minDate = new Date(yearLimit, 0, 1);
      calendarProps.maxDate = new Date(yearLimit, 11, 31);
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="row g-4">
      {/* Report Period */}
      <div className="col-md-6">
        <FormGroup id="reportPeriod" label="Report Period" isFloating>
          <SearchableSelect
            id="reportPeriod"
            value={data.reportPeriod || 'today'}
            onChange={handlePeriodChange}
            options={PERIOD_LIST}
            isValid={validator?.fieldValid?.('Report Period')}
          />
        </FormGroup>
      </div>

      {/* Date Input */}
      <div className="col-md-6 position-relative" ref={pickerWrapperRef}>
        <FormGroup id="asOfDate" label={data.reportPeriod} isFloating>
          <Input
            readOnly
            value={getDisplayValue()}
            onClick={() => {
              isManualDateChange.current = true;
              setShowPicker(true);
            }}
            isValid={validator?.fieldValid?.('Date')}
          />
        </FormGroup>

        {showPicker && (
          <div
            className="border rounded-3 p-2 shadow-sm position-absolute bg-white"
            style={{ zIndex: 999, top: '100%', left: 0 }}
          >
            <DateRange
              ranges={[localRange]}
              onChange={handleDateRangeChange}
              locale={enGB}
              months={1}
              direction="horizontal"
              editableDateInputs
              {...calendarProps}
            />
          </div>
        )}
      </div>
    </div>
  );
};
