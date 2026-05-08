
import {
    SubHeader,
    SubHeaderLeft,
    SubheaderSeparator,
    PageWrapper,
    Page
} from '../../../../layout';
import { CompanySettingsTab } from '../component';
import { useLocation, useParams } from 'react-router-dom'
const CompanyPage = () => {
    const location = useLocation();
    const { companyId } = useParams<{ companyId: string; }>();
    const query = new URLSearchParams(location.search);
    const companyName = query.get('companyName')


    return (
        <PageWrapper title={'Company'}>
            <SubHeader>
                <SubHeaderLeft>
                    <span className='h4 mb-0 fw-bold'>{companyName}</span>
                    <SubheaderSeparator />
                    <span>
                        12 items
                    </span>
                </SubHeaderLeft>

            </SubHeader>

            <Page >

                <CompanySettingsTab companyId={companyId} />

            </Page>
        </PageWrapper>
    );
};

export default CompanyPage;
