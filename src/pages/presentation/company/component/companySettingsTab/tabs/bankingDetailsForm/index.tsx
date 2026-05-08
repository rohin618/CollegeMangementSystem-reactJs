import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    OffCanvas,
    OffCanvasBody,
    OffCanvasHeader,
    OffCanvasTitle,
    FormGroup,
    Input,
} from "../../../../../../../components/bootstrap";

import SimpleReactValidator from "simple-react-validator";
import { BankDetails } from "../bankingDetails";
import { bankModel } from "../../../../../../../common/model/bank";
import {
    createBankDetails,
    updateBankDetails,
} from "../../../../../../../common/api/bank";

import { useUpdateQueryListById } from "../../../../../../../hooks";
import { BANK_STATUS } from "../../../../../../../common/constant";


interface BankDetailsFormProps {
    isOpenForm: boolean;
    handleCloseFormModule: () => void;
    companyId: string;
    editBankObject: BankDetails | null;
    onSaveSuccess: (bank: BankDetails) => void;
}

export const BankDetailsForm: React.FC<BankDetailsFormProps> = ({
    isOpenForm,
    handleCloseFormModule,
    companyId,
    editBankObject,
    onSaveSuccess,
}) => {
    const validator = useRef(new SimpleReactValidator());
    const [formData, setFormData] = useState<BankDetails>({
        ...bankModel,
        companyId,
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isFormLoading, setIsFormLoading] = useState(false);

    const updateBankList = useUpdateQueryListById<any>(["bankDetails", companyId]);


    // Populate data when editing or opening new form
    useEffect(() => {
        if (editBankObject && Object.keys(editBankObject).length > 0) {
            setFormData(editBankObject);
        } else {
            setFormData({ ...bankModel, companyId });
        }
    }, [editBankObject, companyId]);

        useEffect(() => {
            if (!isOpenForm) {
                validator.current.hideMessages();
                setIsSubmitted(false);
                setFormData({ ...bankModel,companyId });
            }
        }, [isOpenForm]);

    // Input change handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    // Save handler
    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSubmitted(true);

        if (!validator.current.allValid()) {
            validator.current.showMessages();
            return;
        }

        setIsFormLoading(true);

        try {
            const payload = { ...formData};
            const res = formData?.id
                ? await updateBankDetails(formData?.id, payload)
                : await createBankDetails(payload);

            updateBankList(res);
            onSaveSuccess(res);
            handleCloseFormModule();
        } catch (err) {
            console.error("Failed to save bank details:", err);
        } finally {
            setIsFormLoading(false);
            setIsSubmitted(false);
            validator.current.hideMessages();
        }
    };

    return (
        <>
            {/* OffCanvas Form for Add/Edit */}
            <OffCanvas
                id="bankCanvas"
                titleId="bankCanvasLabel"
                placement="end"
                isOpen={isOpenForm}
                setOpen={handleCloseFormModule}
                isBackdrop={false}
            >
                <OffCanvasHeader setOpen={handleCloseFormModule}>
                    <OffCanvasTitle id="bankCanvasLabel">
                        {formData?.id ? "Update Bank Details" : "Add Bank Details"}
                    </OffCanvasTitle>
                </OffCanvasHeader>
                <OffCanvasBody>
                    <form className="row g-3" onSubmit={handleSave} noValidate>
                        {/* Bank Name */}
                        <div className="col-12">
                            <FormGroup id="bankName" label="Bank Name" isFloating>
                                <Input
                                    id="bankName"
                                    placeholder="Enter Bank Name"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("bankName")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "bankName",
                                        formData.bankName,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Account Name */}
                        <div className="col-12">
                            <FormGroup id="accountName" label="Account Name" isFloating>
                                <Input
                                    id="accountName"
                                    placeholder="Enter Account Name"
                                    value={formData.accountName}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("accountName")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "accountName",
                                        formData.accountName,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Account Number */}
                        <div className="col-12">
                            <FormGroup id="accountNumber" label="Account Number" isFloating>
                                <Input
                                    id="accountNumber"
                                    placeholder="Enter Account Number"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("accountNumber")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "accountNumber",
                                        formData.accountNumber,
                                        "required|numeric"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Sort Code */}
                        <div className="col-12">
                            <FormGroup id="sortCode" label="Sort Code" isFloating>
                                <Input
                                    id="sortCode"
                                    placeholder="Enter Sort Code"
                                    value={formData.sortCode}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("sortCode")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "sortCode",
                                        formData.sortCode,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* IBAN */}
                        <div className="col-12">
                            <FormGroup id="IBAN" label="IBAN" isFloating>
                                <Input
                                    id="IBAN"
                                    placeholder="Enter IBAN"
                                    value={formData.IBAN}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("IBAN")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "IBAN",
                                        formData.IBAN,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* BIC */}
                        <div className="col-12">
                            <FormGroup id="BIC" label="BIC" isFloating>
                                <Input
                                    id="BIC"
                                    placeholder="Enter BIC"
                                    value={formData.BIC}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("BIC")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "BIC",
                                        formData.BIC,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Opening Balance */}
                        <div className="col-12">
                            <FormGroup id="openingBalance" label="Opening Balance" isFloating>
                                <Input
                                    id="openingBalance"
                                    placeholder="Enter Opening Balance"
                                    value={formData.openingBalance}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("openingBalance")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "openingBalance",
                                        formData.openingBalance,
                                        "required|numeric"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Bank Address */}
                        <div className="col-12">
                            <FormGroup id="bankAddress" label="Bank Address" isFloating>
                                <Input
                                    id="bankAddress"
                                    placeholder="Enter Bank Address"
                                    value={formData.bankAddress}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("bankAddress")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "bankAddress",
                                        formData.bankAddress,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Buttons */}
                        <div className="row mt-3">
                            <div className="col-12 p-3 pb-0">
                                <Button
                                    color="info"
                                    className="w-100"
                                    type="submit"
                                    isLoading={isFormLoading}
                                    isDisable={isFormLoading}
                                >
                                    {formData?.id ? "Update" : "Save"}
                                </Button>
                            </div>
                            <div className="col-12 p-3">
                                <Button
                                    isOutline
                                    color="danger"
                                    className="w-100"
                                    onClick={handleCloseFormModule}
                                    isDisable={isFormLoading}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </form>
                </OffCanvasBody>
            </OffCanvas>
        </>
    );
};
