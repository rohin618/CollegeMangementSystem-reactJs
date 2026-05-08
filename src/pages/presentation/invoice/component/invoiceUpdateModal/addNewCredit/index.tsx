import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { creditWaletModel } from '../../../../../../common/model/creditWalet';
import { INVOICE_TO_TYPE_LIST } from '../../../../../../common/data/option';
import { getLabelByValue, priceFormat } from '../../../../../../helpers/helpers';
import { Button, Input } from '../../../../../../components/bootstrap';
import SimpleReactValidator from "simple-react-validator";
import { ResidentProfileCard, SearchableSelect } from '../../../../../../components/common';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';


export const CreditCreate = forwardRef<any, any>(
    ({ availCredit, invoiceTo, credittWalletsPayedInfoList = [], residentListWithInvoice = [], isResidentListLoading = false }, ref) => {
        const [creditAdvance, setCreditAdvance] = useState<any[]>([
            { ...creditWaletModel },
        ]);
        const [, forceUpdate] = useState(0);
        const [isSubmitted, setIsSubmitted] = useState(false)
        const validator = useRef(
            new SimpleReactValidator({
                autoForceUpdate: { forceUpdate }, // ensures validation messages update when component re-renders
                className: 'text-danger',         // CSS class for error messages
            })
        );


        useEffect(() => {

            if (credittWalletsPayedInfoList.length > 0) {
                setCreditAdvance([...credittWalletsPayedInfoList])
            }

        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [credittWalletsPayedInfoList.length])


        // ✅ expose methods to parent via ref
        useImperativeHandle(ref, () => ({
            getCreditAdvance: () => handleSubmit(),
            reset: () => setCreditAdvance([{ ...creditWaletModel }]),
        }));

        // ✅ single handler for any change
        const handleChange = (index: number, name: string, value: any) => {
            setCreditAdvance((prev) =>
                prev.map((item, i) =>
                    i === index ? { ...item, [name]: value } : item
                )
            );
        };

        const handleAddRow = () => {
            setCreditAdvance((prev) => [...prev, { ...creditWaletModel }]);
        };

        const handleDeleteRow = (index: number) => {
            setCreditAdvance((prev) => prev.filter((_, i) => i !== index));
        };


        const residentOptions = useMemo(() => {
            return (
                residentListWithInvoice?.map((r: any) => ({
                    label: r.personal.name,
                    value: r.id,
                })) ?? []
            );
        }, [residentListWithInvoice]);


        const handleSubmit = () => {

            setIsSubmitted(true)
            const isValid = validator.current.allValid()
            if (!isValid) {
                validator.current.showMessages();
                forceUpdate(0);
                return
            }

            validator.current.hideMessages();
            forceUpdate(0);
            return creditAdvance

        }

        if (availCredit <= 0) return null;


        const getCreditApplyTotal = (wallet: any) => {
            return (wallet?.creditApply || [])
                .reduce((sum: number, { amount }: any) => sum + (Number(amount) || 0), 0);

        }

        return (
            <div>
                <table className="table table-modern table-hover mb-5">
                    <thead>
                        <tr>
                            <th>Resident</th>
                            <th>Fund Type</th>
                            <th>Advance Amount</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creditAdvance.map((row, index) => (
                            <tr key={index}>
                                <td className="mw-25">

                                    <SearchableSelect
                                        isValid={validator.current.fieldValid('Select resident')}
                                        isTouched={isSubmitted}
                                        invalidFeedback={validator.current.message('Select resident', row.residentId, 'required')}
                                        name="residentId"
                                        id="residentId"
                                        value={row.residentId}
                                        onChange={(e: any) =>
                                            handleChange(
                                                index,
                                                "residentId",
                                                e.target.value
                                            )
                                        }
                                        isLoading={isResidentListLoading}
                                        options={residentListWithInvoice}
                                        placeholder='SelectResident'
                                        labelKey='personal.name'
                                        valueKey='id'
                                        renderLabel={(r, i) =>
                                            <ResidentProfileCard resident={r} colorIndex={getColorNameWithIndex(i)} isNavigate={false}/>
                                        }

                                    />

                                </td>
                                <td>{getLabelByValue(INVOICE_TO_TYPE_LIST, invoiceTo) || "-"}</td>
                                <td>
                                    <Input
                                        type="number"
                                        name="creditAmount"
                                        value={row.creditAmount || ""}
                                        onChange={(e: any) =>
                                            handleChange(
                                                index,
                                                "creditAmount",
                                                Number(e.target.value)
                                            )
                                        }
                                        isValid={validator.current.fieldValid(`Credit Amount-${index + 1}`)}
                                        isTouched={isSubmitted}
                                        // invalidFeedback={validator.current.message("Credit Amount", row.creditAmount, "required")}
                                        invalidFeedback={validator.current.message(
                                            `Credit Amount-${index + 1}`,
                                            row.creditAmount,
                                            `required|numeric|min:${getCreditApplyTotal(row) || 0.01},num`
                                        )}


                                    />
                                    {row.id && <small className='form-text'>
                                        You’ve already used {priceFormat(getCreditApplyTotal(row))}. Please enter at least {priceFormat(getCreditApplyTotal(row))}.
                                    </small>}


                                </td>
                                <td>
                                    <Button
                                        icon="Delete"
                                        size='sm'
                                        color="danger"
                                        onClick={() => handleDeleteRow(index)}
                                        isDisable={creditAdvance.length === 1}
                                        isLight
                                    >
                                        {/* Delete */}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Button
                    icon="Add"
                    size='sm'
                    color="info"
                    onClick={handleAddRow}
                    isLight
                >
                    Add Row
                </Button>
            </div>
        );
    }
);
