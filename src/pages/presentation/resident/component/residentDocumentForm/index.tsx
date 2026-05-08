import React, { useMemo, useRef, useState } from 'react';
import {
    Button,
    Input,
    OffCanvas,
    OffCanvasHeader,
    OffCanvasTitle,
    OffCanvasBody,
    FormGroup,
    Select,
    Option
} from '../../../../../components/bootstrap';
import { residentDocumentsModel } from '../../../../../common/model/residentDocument';
import SimpleReactValidator from 'simple-react-validator';
import { DOCUMENT_TYPE_LIST } from '../../../../../common/data/option';
import moment from 'moment';
import { createResidentDocument } from '../../../../../common/api/residentDocument';
import { SearchableSelect } from '../../../../../components/common';

export const ResidentDocumentForm = ({ isOpen = false, toggle = () => { }, residentData = {} }: any) => {
    const [formData, setFormData] = useState<any>({ ...residentDocumentsModel });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validator = useRef(new SimpleReactValidator({ autoForceUpdate: this }));

    // ✅ Unified handler for text/select
    const handleInputChange = (key: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [key]: value,
        }));
    };

    // ✅ File change handler with file + size
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFormData((prev: any) => ({
                ...prev,
                file,
                name: file.name,
                size: `${(file.size / 1024).toFixed(2)} KB`,
            }));
        } else {
            // If user clears file input
            setFormData((prev: any) => ({
                ...prev,
                file: null,
                fileName: '',
                size: '',
            }));
        }
    };

    const handleFormSubmit = async () => {
        setIsSubmitted(true);

        if (validator.current.allValid()) {
            try {
                setIsLoading(true); // ✅ Start loader

                const fundInfo = residentData.fundDetails[+formData.fundDates];
                const file = formData?.file;

                const reqBody = {
                    ...residentDocumentsModel,
                    fundSDate: fundInfo.sDate,
                    fundEDate: fundInfo.eDate,
                    size: formData.size,
                    status: formData.status,
                    type: formData.type, // fixed: was formData.status
                    name: formData.name,
                    residentId: residentData.id
                };

                await createResidentDocument(reqBody, file);


                // Optionally reset form or close OffCanvas
                // setFormData({ ...residentDocumentsModel });
                // toggle();
            } catch (error) {
                console.error('Error submitting form:', error);
            } finally {
                setIsLoading(false); // ✅ Stop loader
                toggle();
            }
        } else {
            validator.current.showMessages();
        }
    };


    const list = useMemo(() => {


        // residentData.fundDetails.map((funs)=>({value:i,label:}))

    }, [])

    return (
        <OffCanvas isOpen={isOpen} setOpen={toggle}>
            <OffCanvasHeader setOpen={toggle}>
                <OffCanvasTitle id='companyCanvasLabel'>Resident Document</OffCanvasTitle>
            </OffCanvasHeader>
            <OffCanvasBody>
                <div className='row'>

                    {/* Name */}
                    {/* <div className='col-12 mb-3'>
                        <FormGroup id='name' label='Name' isFloating>
                            <Input
                                type='text'
                                value={formData.name}
                                onChange={(e: any) => handleInputChange('name', e.target.value)}
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('name')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('name', formData.name, 'required')}
                            />
                        </FormGroup>
                    </div>

                  */}

                    <div className='col-12 mb-3'>
                        <FormGroup id='description' label='Description' isFloating>
                            <Input
                                type='text'
                                value={formData.description}
                                onChange={(e: any) => handleInputChange('description', e.target.value)}
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('description')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('description', formData.description, 'required')}
                            />
                        </FormGroup>
                    </div>
                    <div className='col-12 mb-3'>
                        <FormGroup id='fundDates' label='Fund Dates' isFloating>
                            <Select
                                ariaLabel='Fund Dates'
                                value={formData.fundDates}
                                onChange={(e: any) => handleInputChange('fundDates', e.target.value)}
                                isValid={validator.current.fieldValid('fundDates')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message(
                                    'fundDates',
                                    formData.fundDates,
                                    'required'
                                )}
                            >
                                <Option value=''>Select Fund Dates</Option>
                                {residentData.fundDetails?.map((el: any, i: number) => (
                                    <Option key={i} value={i}>
                                        {moment(el.sDate).format('DD MMM YYYY')} to {moment(el.eDate).format('DD MMM YYYY')}
                                    </Option>
                                ))}
                            </Select>
                        </FormGroup>
                    </div>



                    {/* Document Type */}
                    <div className='col-12 mb-3'>
                        <FormGroup id='type' label='Document Type' isFloating>
                            <SearchableSelect
                                placeholder='Select Document Type'
                                id='type'
                                value={formData.type}
                                onChange={(e: any) => handleInputChange('type', e.target.value)}
                                isValid={validator.current.fieldValid('type')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('type', formData.type, 'required')}
                                options={DOCUMENT_TYPE_LIST}
                            />
                              
                        </FormGroup>
                    </div>
                 

                    {/* Upload File */}
                    <div className='col-12 mb-3'>
                        <FormGroup id='file' label='Upload File'>
                            <Input
                                type='file'
                                onChange={handleFileChange}
                                 accept=".pdf,.doc,.docx"
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('file')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('file', formData.file, 'required')}
                            />
                        </FormGroup>

                        {/* Show file info */}
                        {formData.file && (
                            <div className='text-muted small mt-1'>
                                <div><strong>{formData.fileName}</strong></div>
                                <div>Size: {formData.size}</div>
                            </div>
                        )}
                    </div>
                </div>
                   <div className='col-12 mb-3'>
                        <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                            <div>
                                <label htmlFor="isSigned" className="form-label fw-semibold mb-0">
                                    Document Signed
                                </label>
                                <p className="text-muted small mb-0">
                                    Mark if this document has been signed
                                </p>
                            </div>

                            {/* Bootstrap Switch */}
                            <div className="form-check form-switch m-0">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isSigned"
                                    checked={formData.isSigned}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isSigned: e.target.checked })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                {/* Buttons */}
                <div className='row m-0'>
                    <div className='col-12 p-3 pb-0'>
                        <Button
                            color='info'
                            className='w-100'
                            onClick={handleFormSubmit}
                            isLoading={isLoading}
                            isDisable={isLoading}>
                            {formData.id ? 'Update' : 'Save'}
                        </Button>
                    </div>
                    <div className='col-12 p-3'>
                        <Button
                            isOutline
                            color='danger'
                            className='w-100'
                            onClick={toggle}
                            isDisable={isLoading}>
                            Close
                        </Button>
                    </div>
                </div>
            </OffCanvasBody>
        </OffCanvas>
    );
};
