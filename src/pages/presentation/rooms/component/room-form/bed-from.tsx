import { FC, useState, ChangeEvent, useRef, useEffect, useMemo } from 'react';
import { useParams } from "react-router-dom";
import {
    OffCanvasBody,
    OffCanvasHeader,
    OffCanvasTitle,
    OffCanvas,
    Input,
    FormGroup,
    Button,
    Option,
    Select
} from '../../../../../components/bootstrap';
import { bedModel } from '../../../../../common/model/bed';
import { PRICE_PERIOD_STATUS_LIST } from '../../../../../common/data/option';
import { createBed, updateBed } from '../../../../../common/api/bed';
import { useUpdateQueryListById } from '../../../../../hooks';
import SimpleReactValidator from 'simple-react-validator';
import { DateTimePicker, SearchableSelect } from '../../../../../components/common';
import moment, { Moment } from 'moment';

interface IBedFormProps {
    isOpen: boolean;
    toggle: () => void;
    bedName?: string;
    editBedIndex?: number;
    editBedObject?: any;
    onSuccess?: () => void;
    bedsByRoomIdList: any
}

export const BedForm: FC<IBedFormProps> = ({
    isOpen,
    toggle,
    onSuccess = () => { },
    editBedObject,
    editBedIndex = 0,
    bedName = '',
    bedsByRoomIdList = []
}) => {
    const { roomId } = useParams();
    const [bedFormObject, setBedFormObject] = useState<any>({ ...bedModel, bedName, roomId });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const updateBedsByRoomIdList = useUpdateQueryListById<any>(['bedsByRoomIdList', roomId]);
    const validator = useRef(new SimpleReactValidator());

    // Reset form when modal opens or edit object changes
    useEffect(() => {
        if (editBedObject?.id) {
            setBedFormObject({ ...editBedObject });
        } else {
            setBedFormObject({ ...bedModel, bedName, roomId });
        }
    }, [isOpen, editBedObject, bedName, roomId]);

    const updatePricePeriod = (key: string, value: string | number) => {
        if (editBedIndex === undefined) return;

        setBedFormObject((prev: any) => {
            const pricePeriods = [...(prev?.pricePeriods || [])];

            // Ensure the array has this index
            if (!pricePeriods[editBedIndex]) {
                pricePeriods[editBedIndex] = { ...bedModel.pricePeriods[0] };
            }

            let updatedPeriod = {
                ...pricePeriods[editBedIndex],
                [key]: value,
            };

            // ✅ Date validation & auto-adjustment
            const sDate = updatedPeriod.sDate ? new Date(updatedPeriod.sDate) : null;
            const eDate = updatedPeriod.eDate ? new Date(updatedPeriod.eDate) : null;

            if (key === "sDate" && eDate && sDate && sDate > eDate) {
                // If start date becomes later than end date → adjust end date
                updatedPeriod.eDate = value;
            }

            if (key === "eDate" && sDate && eDate && eDate < sDate) {
                // If end date is before start date → adjust start date
                updatedPeriod.sDate = value;
            }

            pricePeriods[editBedIndex] = updatedPeriod;

            return {
                ...prev,
                pricePeriods,
            };
        });
    };


    const handleChange = (e: any) => {
        const { id, value } = e.target;
        if (id === 'bedName') {
            setBedFormObject((prev: any) => ({ ...prev, bedName: value }));
        } else if (id === 'ppw') {
            updatePricePeriod('pricePerWeek', Number(value));
        } else if (id === 'MinPPW') {
            updatePricePeriod('minPricePerWeek', Number(value));
        } else if (id === 'priceStartDate') {
            updatePricePeriod('sDate', value);
        } else if (id === 'priceEndDate') {
            updatePricePeriod('eDate', value);
        }
    };

    const handleStatusChange = (e: ChangeEvent<any>) => {
        updatePricePeriod('status', Number(e.target.value));
    };

    const handleFormSubmit = async () => {
        setIsSubmitted(true);

        if (!validator.current.allValid()) {
            validator.current.showMessages();
            return;
        }

        if (!roomId) return;

        setIsLoading(true);

        try {
            const body = { ...bedFormObject };
            const res = body?.id
                ? await updateBed(body.id, body)
                : await createBed(body);

            if (res) {
                updateBedsByRoomIdList(res);
                onSuccess();
                setBedFormObject({ ...bedModel, bedName, roomId });
                toggle();
            }
        } finally {
            setIsSubmitted(false);
            setIsLoading(false);
        }
    };



    const isBedNumberExist = useMemo(() => {
        // Skip if no input or list empty
        if (!bedFormObject?.bedName || !bedsByRoomIdList?.length) return "";

        const alreadyExists = bedsByRoomIdList.some(
            (r: any) =>
                r.bedName?.toLowerCase().trim() === bedFormObject.bedName?.toLowerCase().trim() &&
                r.id !== bedFormObject.id // ✅ skip same record when editing
        );

        return alreadyExists ? `${bedFormObject.bedName} already exists` : "";
    }, [bedsByRoomIdList, bedFormObject?.bedName, bedFormObject?.id]);



    const pricePeriods = bedFormObject.pricePeriods ?? [];

    const minDate = useMemo<Moment>(() => {
        if (!isOpen) return moment();

        // Edit mode: next period must start after previous end date (+1 day)
        if (editBedIndex > 0) {
            const prevEndDate = pricePeriods?.[editBedIndex - 1]?.eDate;
            if (prevEndDate) {
                return moment(prevEndDate).add(1, "day"); // ✅ previous eDate + 1
            }
        }

        return moment(); // fallback: today
    }, [editBedIndex, pricePeriods, isOpen]);

    const computedMinDate = useMemo<Moment>(() => {
        if (!isOpen) return moment();

        const sDate = bedFormObject?.pricePeriods?.[editBedIndex]?.sDate;

        if (sDate) {
            return moment(sDate).add(1, "day"); // ✅ sDate + 1 day
        }

        return minDate ? moment(minDate).add(1, "day") : moment();
    }, [bedFormObject, editBedIndex, minDate, isOpen]);




    return (
        <OffCanvas
            setOpen={toggle}
            isOpen={isOpen}
            titleId="bedForm"
            isBodyScroll
            isBackdrop={false}
            placement="end"
        >
            <OffCanvasHeader setOpen={toggle}>
                <OffCanvasTitle id="bedForm">
                    {bedFormObject?.id ? 'Update' : 'Create'} Bed
                </OffCanvasTitle>
            </OffCanvasHeader>

            <OffCanvasBody>
                <div className="row m- g-3">
                    <div className="col-12">
                        <FormGroup id="bedName" label="Bed Name" isFloating>
                            <Input
                                id="bedName"
                                value={bedFormObject.bedName}
                                onChange={handleChange}
                                isValid={validator.current.fieldValid('Bed Name') && !isBedNumberExist}
                                isTouched={isSubmitted || !!isBedNumberExist}
                                invalidFeedback={validator.current.message(
                                    'Bed Name',
                                    bedFormObject.bedName,
                                    'required'
                                ) || isBedNumberExist}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup id="ppw" label="Price Per Week" isFloating>
                            <Input
                                id="ppw"
                                type="number"
                                value={bedFormObject.pricePeriods[editBedIndex]?.pricePerWeek || ''}
                                onChange={handleChange}
                                isValid={validator.current.fieldValid('Price Per Week')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message(
                                    'Price Per Week',
                                    bedFormObject.pricePeriods[editBedIndex]?.pricePerWeek,
                                    'required|numeric|min:1,num'
                                )}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12 " >


                        <FormGroup id="MinPPW" label="Minimum Price Per Week" isFloating>
                            <Input
                                id="MinPPW"
                                type="number"
                                value={bedFormObject.pricePeriods[editBedIndex]?.minPricePerWeek || ''}
                                onChange={handleChange}
                                isValid={validator.current.fieldValid('Minimum Price Per Week')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message(
                                    'Minimum Price Per Week',
                                    bedFormObject.pricePeriods[editBedIndex]?.minPricePerWeek,
                                    `required|numeric|min:1,num|max:${bedFormObject.pricePeriods[editBedIndex]?.pricePerWeek || 1
                                    },num`
                                )}
                            />
                        </FormGroup>
                    </div>

                    <div className="col-md-12 col-sm-12" >
                        <DateTimePicker isFloating id="priceStartDate"
                            label="Price Start Date" value={bedFormObject.pricePeriods[editBedIndex]?.sDate || ''}
                            onChange={handleChange}
                            // ✅ Add max date = selected end date (if any)
                            minDate={minDate}
                            //  {/* ✅ was commented out — now enabled */}
                            maxDate={
                                bedFormObject.pricePeriods[editBedIndex]?.eDate
                                    ? moment(bedFormObject.pricePeriods[editBedIndex].eDate).subtract(1, "day")
                                    : undefined
                            }
                            isValid={validator.current.fieldValid('Price Start Date')}
                            isTouched={isSubmitted}
                            invalidFeedback={validator.current.message(
                                'Price Start Date',
                                bedFormObject.pricePeriods[editBedIndex]?.sDate,
                                'required'
                            )} />

                    </div>

                    <div className="col-md-12 col-sm-12 ">
                        <DateTimePicker isFloating
                            id="priceEndDate"
                            label="Price End Date"
                            value={bedFormObject.pricePeriods[editBedIndex]?.eDate || ''}
                            onChange={handleChange}
                            // ✅ Add min date = selected start date (if any)
                            minDate={computedMinDate || minDate}
                            isValid={validator.current.fieldValid('Price End Date')}
                            isTouched={isSubmitted}
                            invalidFeedback={validator.current.message(
                                'Price End Date',
                                bedFormObject.pricePeriods[editBedIndex]?.eDate,
                                'required'
                            )}
                        />

                    </div>
                    <div className="col-md-12 col-sm-12">
                        <FormGroup id="status" label="Status" isFloating >
                            <SearchableSelect
                                id="status"
                                onChange={handleStatusChange}
                                value={bedFormObject.pricePeriods[editBedIndex]?.status || ''}
                                isValid={validator.current.fieldValid('Status')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message(
                                    'Status',
                                    bedFormObject.pricePeriods[editBedIndex]?.status,
                                    'required'
                                )}
                                options={PRICE_PERIOD_STATUS_LIST}
                            />
                            {/* <Option value="">-- Select Status --</Option>
                                {PRICE_PERIOD_STATUS_LIST.map((key) => (
                                    <Option key={key.value} value={key.value}>
                                        {key.label}
                                    </Option>
                                ))}
                            </Select> */}
                        </FormGroup>
                    </div>
                </div>
            </OffCanvasBody>

            <div className="row m-0">
                <div className="col-12 p-3 pb-0">
                    <Button
                        color="info"
                        className="w-100"
                        onClick={handleFormSubmit}
                        isLoading={isLoading}
                    >
                        Save
                    </Button>
                </div>
                <div className="col-12 p-3">
                    <Button
                        isOutline
                        color="danger"
                        className="w-100"
                        onClick={toggle}
                        isDisable={isLoading}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </OffCanvas>
    );
};
