import React, { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { Page, PageWrapper } from '../../../layout';
import {  CardBody, Card,  } from '../../../components/bootstrap';
import Logo from '../../../components/Logo';
import {  getLabelByValue, setStorage } from '../../../helpers/helpers';
import { useGetCurrentUser } from '../../../hooks';
import { SALUTATION_LIST } from '../../../common/data/option';
import { getAllCompany } from '../../../common/api/company';
import { useQuery } from '@tanstack/react-query';
import useDarkMode from '../../../hooks/useDarkMode';
import { EXIST_SESSION_STORAGE_NAMES } from '../../../common/constant';
import { SwitchCompanyList } from '../../_layout/_headers/component';


interface ILoginProps {
    isSignUp?: boolean;
}

const LoginCompany: FC<ILoginProps> = () => {
    const navigate = useNavigate();
    const { darkModeStatus } = useDarkMode();
    const currentUser = useGetCurrentUser();

    const {
        data: companyList = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['companyList', { ids: currentUser?.companyIds }],
        queryFn: () => getAllCompany({ companyIds: currentUser?.companyIds }),
        enabled: currentUser?.companyIds?.length > 0,
    });


    const hadleNavigateDashboard = (company: any) => {
        if (!company) return;
        setStorage(EXIST_SESSION_STORAGE_NAMES.CURENT_COMPANY_ID, company);
        navigate(`/dashboard`)
    }

    return (
        <PageWrapper isProtected={false} title="Company" className="light">
            <Page className="p-0">
                <div className="row h-100 align-items-center justify-content-center">
                    <div className="col-xl-4 col-lg-6 col-md-8 shadow-3d-container">
                        <Card className="shadow-3d-dark" data-tour="login-page">
                            <CardBody>
                                {/* Logo */}
                                <div className="text-center my-5">
                                    <Link
                                        to="/"
                                        className={classNames(
                                            'text-decoration-none fw-bold display-2 text-dark'
                                        )}
                                        aria-label="Facit"
                                    >
                                        <Logo width={150}  height={150}  />
                                    </Link>
                                </div>

                                {/* Title */}
                                <div className="text-center h1 fw-bold mt-5">
                                    Welcome Back,
                                </div>
                                <div className="text-center h4 text-muted mb-5">
                                    {`${getLabelByValue(
                                        SALUTATION_LIST,
                                        currentUser?.salutation
                                    )} ${currentUser?.name}`}
                                </div>
                                <SwitchCompanyList isLoading={isLoading} isError={isError} error={error} companyList={companyList} onClick={hadleNavigateDashboard}/>
                                
                            </CardBody>
                        </Card>

                        {/* Footer Links */}
                        <div className="text-center mt-3">
                            <a
                                href="/"
                                className={classNames('text-decoration-none me-3 link-light')}
                            >
                                Privacy policy
                            </a>
                            <a
                                href="/"
                                className={classNames(
                                    'link-light text-decoration-none link-light'
                                )}
                            >
                                Terms of use
                            </a>
                        </div>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default LoginCompany;
