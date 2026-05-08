import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    CardLabel,
    CardTitle,
    Button,
    CardActions,
    Input,
    FormGroup,
    Select,
    Option
} from "../../../../../../../components/bootstrap";
import SimpleReactValidator from "simple-react-validator";
import { fnmModel } from "../../../../../../../common/model/fnm";
import { createFNM, getAllFNMByCompany, updateFNM } from "../../../../../../../common/api/fnm";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { generateUid, getMinStartDate, notifyEntity } from "../../../../../../../helpers/helpers";
import { useMasterData } from "../../../../../../../contexts/mastersContext";
import VATConfiguration from "../../../VatConfiguration";
import { NOTIFY_TYPE, VAT_CONFIG_STATUS } from "../../../../../../../common/constant";
import { useUpdateQueryListById, useUpdateQueryObjectById } from "../../../../../../../hooks";
import { DateTimePicker } from "../../../../../../../components/common";
import { IFNCModel } from "../../../../../../../common/interface";

export const FNMDetails = ({ companyId = "" }: any) => {
    const [formData, setFormData] = useState<any>({ ...fnmModel, companyId });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const validator = useRef(new SimpleReactValidator({ autoForceUpdate: this }));
    const { vatList, isLoading: isMasterLoader, isError: isMasterError } = useMasterData();


    const {
        data: fNCDetails,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['fncDetailsByCompanyId', companyId],
        queryFn: () => getAllFNMByCompany(companyId),
        enabled: !!companyId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false, 
    });




    const updatedFNCDetailsByCompanyId = useUpdateQueryObjectById<any>(['fncDetailsByCompanyId', companyId]);



    useEffect(() => {
        if (!(isLoading) && fNCDetails) {
            setFormData({ ...fnmModel, ...fNCDetails });
        }
    }, [isLoading, fNCDetails]);

    // Generic input change handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    // Handle Price Info Change
    const handlePriceChange = (index: number, field: string, value: string) => {
        const updatedList = [...formData.priceInfo];
        updatedList[index][field] = value;
        setFormData((prev: any) => ({ ...prev, priceInfo: updatedList }));
    };

    // Add New Price Row
    const handleAddPriceRow = () => {
        setFormData((prev: any) => ({
            ...prev,
            priceInfo: [...prev.priceInfo, { perWeek: "", sDate: "", eDate: "" }],
        }));
    };

    // Delete Price Row
    const handleDeletePriceRow = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            priceInfo: prev.priceInfo.filter((_: any, i: number) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (validator.current.allValid()) {
            try {
                setIsFormLoading(true);
                const vatConfigList = formData.vatConfigList.map((item: any) => ({
                    ...item,
                    id: item?.id ? item?.id : generateUid()
                }));


                const resFnc:IFNCModel = formData?.id ? await updateFNM(formData.id, { ...formData, vatConfigList }) as IFNCModel : await createFNM({ ...formData, vatConfigList }) as IFNCModel;
                
                setIsFormLoading(false);
                validator.current.hideMessages();
                if(resFnc?.id){
                    updatedFNCDetailsByCompanyId(resFnc);
                }
            } catch (error) {
                console.error("Failed to create/update FNM:", error);
            } finally {
                validator.current.showMessages();
                setIsFormLoading(false);
            }
        }
        else {
            validator.current.showMessages();
            setFormData((prev: any) => ({ ...prev })); // force re-render
        }
    };


    const handleVATAdd = () => {
        setFormData((prev: any) => {
            return {
                ...prev,
                vatConfigList: [
                    ...prev.vatConfigList,
                    { id: '', vatId: '', vatEffectiveDate: '', status: VAT_CONFIG_STATUS.ACTIVE },
                ],
            }
        });
    };

    const handleVATDelete = (index: number) => {
        validator.current.purgeFields();
        setFormData((prev: any) => ({
            ...prev,
            vatConfigList: prev.vatConfigList.map((item: any, i: number) => {

                if (i === index) {
                    if (!item.id) return
                    return {
                        ...item,
                        status: VAT_CONFIG_STATUS.DELETE,
                    };
                }
                validator.current.purgeFields();
                return item;
            }).filter(Boolean),
        }));
        notifyEntity('VAT Configuration', NOTIFY_TYPE.DELETE, 'This Vat Configuration Mark as deleted');
    };

    const handleVATChange = (index: number, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            vatConfigList: prev.vatConfigList.map((item: any, i: number) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const companyVATs = useMemo(() => {
        if (!companyId) return [];
        return vatList.filter((vat: any) =>
            vat?.companyIds?.some((c: any) => c.id === companyId && !c.endDate && c.isActive)
        );
    }, [vatList, companyId]);

    const canAddFNCPrice = formData?.priceInfo?.every((fnc: any, index: number) =>
        fnc?.perWeek.trim() && fnc?.sDate !== '' && fnc?.eDate !== ''
    )
    return (
        <Card stretch noValidate >
            <CardHeader>
                <CardLabel icon="Contacts" iconColor="info">
                    <CardTitle tag="div" className="h5">
                        FNC Details
                    </CardTitle>
                </CardLabel>
                <CardActions>
                    <Button
                        color="info"
                        isLight
                        type="submit"
                        icon="Save"
                        isLoading={isFormLoading}
                        onClick={handleSubmit}
                    >
                        {formData?.id ? "Update" : "Save"}
                    </Button>
                </CardActions>
            </CardHeader>

            <CardBody isScrollable>
                {isLoading && (
                    <div className="text-center p-3">
                        <span className="spinner-border spinner-border-sm" /> Loading FNC
                        details...
                    </div>
                )}

                {isError && (
                    <div className="alert alert-danger">
                        Failed to load FNC details
                    </div>
                )}

                {!isLoading && !isError && (
                    <div className="row g-3">
                        {/* Phone */}
                        <div className="col-6">
                            <FormGroup id="phone" label="Phone" isFloating>
                                <Input
                                    id="phone"
                                    placeholder="Enter Phone Number"
                                    value={formData?.phone}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("Phone")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "Phone",
                                        formData?.phone,
                                        "required|numeric"
                                    )}
                                />
                            </FormGroup>
                        </div>
                        <div className="col-6">
                            <FormGroup id="email" label="Email" isFloating>
                                <Input
                                    id="email"
                                    placeholder="Enter Email Number"
                                    value={formData?.email}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("Email")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "Email",
                                        formData?.email,
                                        "required|email"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Building Number */}
                        <div className="col-6">
                            <FormGroup id="buildingNumber" label="Building Number" isFloating>
                                <Input
                                    id="buildingNumber"
                                    placeholder="Enter Building Number"
                                    value={formData?.buildingNumber}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("Building Number")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "Building Number",
                                        formData?.buildingNumber,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Area */}
                        <div className="col-6">
                            <FormGroup id="area" label="Area" isFloating>
                                <Input
                                    id="area"
                                    placeholder="Enter Area"
                                    value={formData?.area}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("Area")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "Area",
                                        formData?.area,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Post Code */}
                        <div className="col-6">
                            <FormGroup id="postCode" label="Post Code" isFloating>
                                <Input
                                    id="postCode"
                                    placeholder="Enter Post Code"
                                    value={formData?.postCode}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("Post Code")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "Post Code",
                                        formData?.postCode,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Address */}
                        <div className="col-12">
                            <FormGroup id="address" label="Address" isFloating>
                                <Input
                                    id="address"
                                    placeholder="Enter Address"
                                    value={formData?.address}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("Address")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "Address",
                                        formData?.address,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        {/* Country */}
                        <div className="col-6">
                            <FormGroup id="country" label="Country" isFloating>
                                <Input
                                    id="country"
                                    placeholder="Enter Country"
                                    value={formData?.country}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid("Country")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message(
                                        "Country",
                                        formData?.country,
                                        "required"
                                    )}
                                />
                            </FormGroup>
                        </div>

                        <div className="col-12">
                            <VATConfiguration vatConfigList={formData?.vatConfigList}
                                companyVATs={companyVATs}
                                onAdd={handleVATAdd}
                                onDelete={handleVATDelete}
                                onChange={handleVATChange}
                                validator={validator.current}
                                isSubmited={isSubmitted} />
                        </div>

                        {/* Price Info Section */}
                        <div className="col-12">
                            <Card shadow="none" borderSize={1}>
                                <CardHeader>
                                    <CardLabel iconColor="danger">
                                        <CardTitle tag="div" className="h6">
                                            FNC Price Info
                                        </CardTitle>
                                    </CardLabel>
                                    <CardActions>
                                        <Button color='info' isLight icon='AddCircle' onClick={handleAddPriceRow} isDisable={!canAddFNCPrice}>
                                            Add FNC Price
                                        </Button>
                                    </CardActions>
                                </CardHeader>
                                <CardBody>
                                    <table className="table table-modern table-hover mb-5">
                                        <thead>
                                            <tr>
                                                <th>Price Per Week</th>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData?.priceInfo?.map((priceInfo: any, index: number) => {
                                                // Get previous row's eDate if it exists
                                                // Compute previous row's eDate + 1 day
                                                const minStartDate: any = getMinStartDate(formData.priceInfo, index);
                                                return (
                                                    <tr key={index}>
                                                        <td>
                                                            <Input
                                                                name="perWeek"
                                                                placeholder="Price Per Week"
                                                                value={priceInfo.perWeek}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                    handlePriceChange(index, "perWeek", e.target.value)
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <DateTimePicker

                                                                name="sDate"
                                                                minDate={minStartDate} // ✅ Ensure start date can't be before previous end date
                                                                value={priceInfo.sDate}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                    handlePriceChange(index, "sDate", e.target.value)
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <DateTimePicker

                                                                name="eDate"
                                                                minDate={priceInfo.sDate} // ✅ Ensure end date can't be before sDate
                                                                value={priceInfo.eDate}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                    handlePriceChange(index, "eDate", e.target.value)
                                                                }
                                                            />
                                                        </td>
                                                        <td>


                                                            <Button
                                                                isDisable={formData.priceInfo.length <= 1}
                                                                color="danger"
                                                                isLight
                                                                icon="Delete"
                                                                className="ms-2"
                                                                onClick={() => handleDeletePriceRow(index)}
                                                            />

                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                        </tbody>
                                    </table>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};
