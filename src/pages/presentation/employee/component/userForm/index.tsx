import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    OffCanvas,
    OffCanvasBody,
    OffCanvasHeader,
    OffCanvasTitle,
    FormGroup,
    Input,
    Button,
    InputGroup,
    InputGroupText,
    Select,
    Option
} from '../../../../../components/bootstrap';
import { userModel } from '../../../../../common/model/user';
import { SALUTATION_LIST, USER_STATUS_LIST, USER_TYPE_LIST } from '../../../../../common/data/option';
import { createUser, updateUser } from '../../../../../common/api/user';
import { useUpdateQueryListById } from '../../../../../hooks';
import SimpleReactValidator from 'simple-react-validator';
import { MultiSelect, SearchableSelect } from '../../../../../components/common';

export const UserForm = ({ isOpen, toggle, onSuccess = () => { }, companyList = [], lastLargeNumer = 1001, userEditFormObject = null }: any) => {
    const [userForm, setUserForm] = useState<any>({ ...userModel });
    const updateUsersList = useUpdateQueryListById<any>(['usersList']);
    const [isLoading, setIsLoading] = useState(false);
    const validator = useRef(new SimpleReactValidator());
    const [isSubmited, setIsSubmited] = useState(false);

    useEffect(() => {
        let formData = { ...userModel };

        if (userEditFormObject) {
            formData = { ...formData, ...userEditFormObject };
        }

        if (lastLargeNumer) {
            formData.code = lastLargeNumer;
        }



        setUserForm(formData);
    }, [userEditFormObject, lastLargeNumer, isOpen]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | any) => {
        const { id, value } = e.target;
        setUserForm((prev: any) => ({
            ...prev,
            [id]: value,
        }));
    }, []);

    const handleFormSubmit = useCallback(async () => {
        try {
            setIsSubmited(true)
            setIsLoading(true);
            const isValid = validator.current.allValid();
            if (!isValid) {
                validator.current.showMessages();
                return;
            }
            const body: any = {
                ...userForm
            };
            // return
            // const res = await createUser(body)
            const res = userForm?.id ? await updateUser(userForm?.id, body) : await createUser(body);
            validator.current.hideMessages();
            updateUsersList(res)
            setIsSubmited(false)
            onSuccess(); // close drawer
        } catch (err) {
            console.error('Error saving user:', err);
        } finally {
            setIsLoading(false);

        }
    }, [userForm, toggle]);

    return (
        <OffCanvas
            id="userCanvas"
            titleId="userCanvasLabel"
            placement="end"
            isOpen={isOpen}
            setOpen={toggle}
        >
            <OffCanvasHeader setOpen={toggle}>
                <OffCanvasTitle id="userCanvasLabel">
                    {userEditFormObject ? 'Edit User' : 'Create User'}
                </OffCanvasTitle>
            </OffCanvasHeader>

            <OffCanvasBody>
                <div className="row g-3">
                    <div className="col-12">

                        <InputGroup>
                            <InputGroupText className='p-0'>
                                {/* <FormGroup id='salutation'> */}
                                <SearchableSelect
                                    id='salutation'
                                    placeholder="Select Salutation"
                                    className="shadow-none"
                                    value={userForm.salutation}
                                    onChange={handleChange}
                                    options={SALUTATION_LIST}
                                />

                                {/* </FormGroup> */}
                            </InputGroupText>
                            <FormGroup id='name' label='Name' isFloating>
                                <Input
                                    placeholder='Name'
                                    value={userForm.name}

                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid('Name') && validator.current.fieldValid('Salutation')}
                                    isTouched={isSubmited}
                                    invalidFeedback={validator.current.message('Name', userForm.name, 'required') || validator.current.message('Salutation', userForm.salutation, 'required')}
                                />
                            </FormGroup>
                        </InputGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup id="email" label="Email" isFloating>
                            <Input
                                id="email"
                                value={userForm.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('Email')}
                                isTouched={isSubmited}
                                invalidFeedback={validator.current.message('Email', userForm.email, 'required|email')}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup id="phone" label="Phone" isFloating>
                            <Input
                                id="phone"
                                type='number'
                                value={userForm.phone}
                                onChange={handleChange}
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('Phone')}
                                isTouched={isSubmited}
                                invalidFeedback={validator.current.message('Phone', userForm.phone, 'required')}
                            />
                        </FormGroup>
                    </div>
                    <div className="col-12">
                        <FormGroup id="companyIds" isFloating>
                            <SearchableSelect
                                value={userForm.companyIds}
                                id="companyIds"
                                onChange={handleChange}
                                // isFloating 
                                multiple
                                label='Company'
                                // placeholder="Select Company"
                                labelKey='tradeName' valueKey='id' options={companyList}
                                isValid={validator.current.fieldValid('Company')}
                                isTouched={isSubmited}
                                invalidFeedback={validator.current.message('Company', userForm.companyIds, 'required')}
                            />
                        </FormGroup>
                        {/* <MultiSelect
                            value={userForm.companyIds}
                            id="companyIds" onChange={handleChange}
                            isFloating label="Select Company"
                            labelKey='name' valueKey='id' options={companyList}
                            isValid={validator.current.fieldValid('Company')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.current.message('Company', userForm.companyIds, 'required')}
                        /> */}
                        {/* </FormGroup> */}

                        {/* <div className="bg-l10-success text-success fw-bold py-2 rounded-pill me-3 text-center" style={{ width: 100 }}>Paid</div> */}
                    </div>
                    <div className="col-12">
                        <FormGroup id="userType" label="Select User Type" isFloating>
                            <SearchableSelect
                                id="userType"
                                className="shadow-none"
                                value={userForm.userType}
                                onChange={handleChange}
                                disabled={isLoading}
                                isValid={validator.current.fieldValid('User Type')}
                                isTouched={isSubmited}
                                invalidFeedback={validator.current.message('User Type', userForm.userType, 'required')}
                                options={USER_TYPE_LIST}
                                placeholder='Select User Type'
                            />


                        </FormGroup>
                        {/* <div className="bg-l10-success text-success fw-bold py-2 rounded-pill me-3 text-center" style={{ width: 100 }}>Paid</div> */}
                    </div>
                    <div className="col-12">
                        <FormGroup id="status" label="Select Status" isFloating>
                            <SearchableSelect
                                id="status"
                                className="shadow-none"
                                value={userForm.status}
                                onChange={handleChange}
                                isValid={validator.current.fieldValid('Status')}
                                isTouched={isSubmited}
                                invalidFeedback={validator.current.message('Status', userForm.status, 'required')}
                                placeholder='Select Status'
                                options={USER_STATUS_LIST}
                            />

                        </FormGroup>
                        {/* <div className="bg-l10-success text-success fw-bold py-2 rounded-pill me-3 text-center" style={{ width: 100 }}>Paid</div> */}
                    </div>

                </div>

                <div className="row m-0">
                    <div className="col-12 p-3 pb-0">
                        <Button
                            color="info"
                            className="w-100"
                            onClick={handleFormSubmit}
                            isLoading={isLoading}
                            isDisable={isLoading}
                        >
                            {userEditFormObject?.id ? 'Update' : 'Save'}
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
            </OffCanvasBody>
        </OffCanvas>
    );
};
