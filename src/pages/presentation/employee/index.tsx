

import React, { useContext, useEffect, useState } from 'react';
import {
    SubHeaderLeft,
    SubheaderSeparator,
    SubHeader,
    Page,
    PageWrapper,
    SubHeaderRight,

} from '../../../layout';
import Icon from '../../../components/icon';
import {
    Input, Button, CardBody,
    Card
} from '../../../components/bootstrap';
import { UserCardList, UserForm } from './component'
import { useQuery } from '@tanstack/react-query';
import { getAllCompany } from '../../../common/api/company';
import { getAllUsers } from '../../../common/api/user';
import { useSearch } from '../../../hooks';

// import s from '../../../assets/img/'





const UserPage = () => {
    const [lastLargeNumer, setLastLargeNumber] = useState(0);
    const [isOpenUserFormModel, setIsOpenUserFormModel] = useState(false);
    const [userEditFormObject, setUserEditFormObject] = useState<any>(null);
    const {
        data: companyList = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["companyList"],
        queryFn: () => getAllCompany(),
    });

    const {
        data: usersList = [],
        isLoading: isLoadingUserList,
        isError: isErrorUserList,
        error: errorUserList,
    } = useQuery({
        queryKey: ["usersList"],
        queryFn: getAllUsers,
    });

    const { searchValue, setSearchValue, filteredList: filteredusersList } =useSearch(usersList || [], ["name", "email",]);
 // ✅ safe default





    const handleOpenModelCreateRoom = () => {
        if (usersList && usersList.length > 0) {
            const maxCode: number = Math.max(...usersList.map((r: any) => r.code));
            setLastLargeNumber(maxCode + 1);
        } else {
            setLastLargeNumber(1001);
        }

        setIsOpenUserFormModel(!isOpenUserFormModel);
    };

    const handleCloseUserFormModel = () => {
        setIsOpenUserFormModel(!isOpenUserFormModel);
        setLastLargeNumber(0);
        setUserEditFormObject(null)
    }


    const handOpenEditUserFormModel = (user: any) => {

        setUserEditFormObject(user);
        setIsOpenUserFormModel(!isOpenUserFormModel);
    }



    return (
        <PageWrapper title={'Users'}>
            <SubHeader>
                <SubHeaderLeft>
                    <label
                        className='border-0 bg-transparent cursor-pointer me-0'
                        htmlFor='searchInput'>
                        <Icon icon='Search' size='2x' color='primary' />
                    </label>
                    <Input
                        id='searchInput'
                        type='search'
                        className='border-0 shadow-none bg-transparent'
                        placeholder='Search User by name or email...'
                        value={searchValue}
                        onChange={(e:any) => setSearchValue(e.target.value)}
                    />
                    {/* <SubheaderSeparator /> */}
                    <SubheaderSeparator />

                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        icon='PersonAdd'
                        color='info'
                        isLight
                        onClick={handleOpenModelCreateRoom}
                    >
                        New User
                    </Button>
                </SubHeaderRight>

            </SubHeader>
            <Page container='fluid'>
                <UserCardList usersList={filteredusersList} isLoading={isLoadingUserList} isError={isErrorUserList} error={errorUserList} onEdit={handOpenEditUserFormModel} companyList={companyList} />
                <UserForm userEditFormObject={userEditFormObject} lastLargeNumer={lastLargeNumer} onSuccess={handleCloseUserFormModel} isOpen={isOpenUserFormModel} companyList={companyList} toggle={handleCloseUserFormModel} />
            </Page>

        </PageWrapper>
    );
};

export default UserPage;
