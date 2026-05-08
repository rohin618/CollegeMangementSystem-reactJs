import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    FormGroup,
    Select,
    Option,
    Input,
    Textarea,
} from "../../../../components/bootstrap";

import OffCanvas, {
    OffCanvasBody,
    OffCanvasHeader,
    OffCanvasTitle,
} from "../../../../components/bootstrap/OffCanvas";

import SimpleReactValidator from "simple-react-validator";
import {
    CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
    CHART_OF_ACCOUNTS_STATUS_LIST,
} from "../../../../common/data/option";

import { chartOfAccountModel } from "../../../../common/model/chartOfAccount";
import { IChartOfAccount } from "../../../../common/interface/chartOfAccount";
import { SearchableSelect } from "../../../../components/common";

const ChartOfAccountsCreateForm = ({
    isOpen,
    toggle,
    onSave,
    editData,
    isSaving = false,
}: any) => {
    const [form, setForm] = useState<IChartOfAccount>({
        ...chartOfAccountModel,
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const validator = useRef(
        new SimpleReactValidator({
            className: "text-danger",
        })
    );

    useEffect(() => {
        if (editData) {
            setForm(editData);
            validator.current.hideMessages();
        } else {
            setForm({
                ...chartOfAccountModel,
                code: "",
                categoryType: undefined,
                accountName: "",
                description: "",
                status: 1,
            });
            validator.current.hideMessages();
            setIsSubmitted(false);
        }
    }, [editData, isOpen]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const submit = () => {
        setIsSubmitted(true);

        if (!validator.current.allValid()) {
            validator.current.showMessages();
            return;
        }

        onSave(form);
        toggle();
    };

    return (
        <OffCanvas
            id="coaCanvas"
            titleId="coaCanvasTitle"
            placement="end"
            isOpen={isOpen}
            setOpen={toggle}
        >
            {/* Header */}
            <OffCanvasHeader setOpen={toggle}>
                <OffCanvasTitle id="coaCanvasTitle">
                    {editData ? "Edit Account" : "Add Account"}
                </OffCanvasTitle>
            </OffCanvasHeader>

            {/* Body */}
            <OffCanvasBody>
                <div className="d-flex flex-column gap-3">
                    {/* CATEGORY TYPE */}
                    <FormGroup id="categoryType" label="Account Category *">
                        <SearchableSelect
                            id="categoryType"
                            name="categoryType"
                            value={form.categoryType}
                            onChange={handleChange}
                            isValid={validator.current.fieldValid("Account Category")}
                            isTouched={isSubmitted}
                            invalidFeedback={validator.current.message(
                                "Account Category",
                                form.categoryType,
                                "required"
                            )}
                            placeholder="Select Category"
                            options={CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST}
                        />

                    </FormGroup>

                    {/* Account Name */}
                    <FormGroup id="accountName" label="Account Name *">
                        <Input
                            name="accountName"
                            value={form.accountName}
                            onChange={handleChange}
                            isValid={validator.current.fieldValid("Account Name")}
                            isTouched={isSubmitted}
                            invalidFeedback={validator.current.message(
                                "Account Name",
                                form.accountName,
                                "required"
                            )}
                        />
                    </FormGroup>

                    {/* Description */}
                    <FormGroup id="description" label="Description *">
                        <Textarea
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={handleChange}
                            isValid={validator.current.fieldValid("Description")}
                            isTouched={isSubmitted}
                            invalidFeedback={validator.current.message(
                                "Description",
                                form.description,
                                "required"
                            )}
                        />
                    </FormGroup>

                    
                </div>

                {/* Footer (OffCanvas has no separate footer, so we place inside body) */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button color="danger" isOutline onClick={toggle} isDisable={isSaving}>
                        Cancel
                    </Button>

                    <Button
                        color="info"
                        onClick={submit}
                        isLoading={isSaving}
                        isDisable={isSaving}
                    >
                        {editData ? "Update" : "Save"}
                    </Button>
                </div>
            </OffCanvasBody>
        </OffCanvas>
    );
};

export default ChartOfAccountsCreateForm;
