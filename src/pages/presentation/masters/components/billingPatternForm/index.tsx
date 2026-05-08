import { useEffect, useRef, useState } from 'react';
import {
    Button,
    FormGroup,
    OffCanvas,
    OffCanvasBody,
    OffCanvasHeader,
    OffCanvasTitle,
    Input,
    Textarea,
} from '../../../../../components/bootstrap';
import FormulaBuilder from './formulaBuilder';
import { billingPatternModel } from '../../../../../common/model/billingPattern';
import SimpleReactValidator from 'simple-react-validator';
import { createBillingPatternMaster, updateBillingPatternMaster } from '../../../../../common/api/billingPattern';
import { useUpdateQueryListById } from '../../../../../hooks';
import { BILLING_PATTERN_STATUS } from '../../../../../common/constant';

;

export const BillingPatternFrom = ({ toggle = () => { }, isOpen = false, editBillFormulaObject = {} }: any) => {
    const validator = useRef(new SimpleReactValidator({ autoForceUpdate: this }));
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState<any>({ ...billingPatternModel });
    const updateBillingPatternList = useUpdateQueryListById<any>(["billingPatternList"]);



    useEffect(() => {


        if (editBillFormulaObject && isOpen) {
            setFormData({ ...editBillFormulaObject })
        } else {
            setFormData({ ...billingPatternModel })
        }


    }, [editBillFormulaObject, isOpen])

    useEffect(() => {
        if (!isOpen) {
            setFormData({ ...billingPatternModel });
            setIsSubmitted(false)
            validator.current.hideMessages();
        };
    }, [isOpen])


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [id]: value
        }));
        // setErrors(prev => ({ ...prev, [id]: '' })); // Clear error on change
    };


    const handleUpdateFormula = (data: any) => {
        setFormData((prev: any) => ({
            ...prev,
            billingFormula: data?.expression
        }));
    }
    const handleFormSubmit = async () => {
        try {
            setIsSubmitted(true);

            // ✅ Validate form
            if (!validator.current.allValid()) {
                validator.current.showMessages();
                return;
            }

            setIsLoading(true);

            // ✅ Prepare request body
            const reqBody = { ...formData,status:BILLING_PATTERN_STATUS.ACTIVE };

            // ✅ Decide API call based on `id`
            const res = formData.id
                ? await updateBillingPatternMaster(formData.id, reqBody)
                : await createBillingPatternMaster(reqBody);

            // ✅ Update parent list after success
            updateBillingPatternList(res);

            // ✅ Reset form and close modal
            setFormData({ ...billingPatternModel });
            toggle();
        } catch (error) {
            console.error("Error saving billing pattern:", error);
            // Optionally show toast or alert here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <OffCanvas isOpen={isOpen} setOpen={toggle} className='w-25' isBackdrop={false}>
            <OffCanvasHeader setOpen={toggle}>
                <OffCanvasTitle id='companyCanvasLabel'>Create New Formula</OffCanvasTitle>
            </OffCanvasHeader>
            <OffCanvasBody>
                <p>Due Date Form</p>
                <div className='row'>
                    {/* Name Field */}
                    <div className='col-12 mb-3'>
                        <FormGroup id='name' label='Formula Name' isFloating>
                            <Input
                                id='name'
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('name')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message(
                                    'name',
                                    formData.name,
                                    'required',
                                )}
                            />
                        </FormGroup>
                    </div>

                    <div className='col-12 mb-3'>
                        <FormGroup id='description' label='Description' isFloating>
                            <Textarea
                                id='description'
                                value={formData.description}
                                onChange={handleChange}
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('description')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message(
                                    'description',
                                    formData.description,
                                    'required',
                                )}
                            />
                        </FormGroup>
                    </div>



                    <div className='col-12'>
                        <FormulaBuilder
                            value={formData?.billingFormula}
                            //  isValid={validator.current.fieldValid('billingFormula')}
                            isValid={validator.current.message(
                                'billingFormula',
                                formData.billingFormula,
                                'required',
                            )}
                            onChange={(updated) => handleUpdateFormula(updated)}
                        />

                        {validator.current.message(
                            'billingFormula',
                            formData.billingFormula,
                            'required',
                        )}
                    </div>


                </div>

                {/* Buttons */}
                <div className='row m-0'>
                    <div className='col-12 text-end'>

                        <Button
                            isOutline
                            color='danger'
                            className='px-4 me-2'
                            onClick={toggle}
                            isDisable={isLoading}>
                            Close
                        </Button>
                        <Button
                            color='info'
                            className=' px-4'
                            onClick={handleFormSubmit}
                            isLoading={isLoading}
                            isDisable={isLoading}
                        >
                            {formData?.id ? 'Update' : 'Create'}
                        </Button>
                    </div>

                </div>
            </OffCanvasBody>
        </OffCanvas>
    )


}