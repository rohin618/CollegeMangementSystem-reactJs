import React, { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, {
    SubHeaderLeft,
    SubHeaderRight,
} from '../../../layout/SubHeader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Button from '../../../components/bootstrap/Button';
import Page from '../../../layout/Page';

import { createResident, updateResident, } from '../../../common/api/resident';
import { BED_STATUS } from '../../../common/constant';
import { pagesMenu } from '../../../menu';
import {
    generateUid,
    getActiveFundDetails,
} from '../../../helpers/helpers';
import {
    BOOKING_TYPE,
    RESIDENT_STATUS,
} from '../../../common/constant/app';
import { useGetAllRoomsWithBeds } from '../../../hooks/useGetAllRoomsWithBed';
import { BedBookingForm } from '../rooms/component/bed-booking';
import { IResidentModel } from '../../../common/interface';
import moment from 'moment';
import { useUpdateQueryObjectById } from '../../../hooks';

const ResidentForm: React.FC = () => {
    const navigate = useNavigate();
    const bedBookingFormRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentResidentData, setCurrentResidentData] = useState<any>(null);
    const [bookingType, setBookingType] = useState<number>(0);
    const { residentId } = useParams<{
        residentId?: string;
    }>();
    const location = useLocation();
    const isFromResidentPage = useMemo(() => {
        return location.pathname.includes('fromResidentPage');
    }, [location.pathname]);
    const updateResidentCache = useUpdateQueryObjectById(['residentDetails', residentId]);

    const {
        data: roomsList = [],
        isLoading: isRoomLoading,
        refetch: refetchRoomsWithBed,
    } = useGetAllRoomsWithBeds();

    const handleBookingSubmit = async () => {
        try {
            setIsLoading(true);
            const formData: IResidentModel = bedBookingFormRef.current?.residentSubmitForm();


            if (!formData) return;


            if (residentId) {
                // Update existing resident

                //  need to call update api

                const updatedData = {
                    ...formData,
                    // roomId: targetRoomId,
                    // bedId: targetBedId,
                    // roomHistory: updatedHistory,
                };



                const residentResponse = await updateResident(
                    residentId,
                    updatedData,
                    updatedData,
                );

                if(!residentResponse)
                updateResidentCache(residentResponse)

                navigate(-1);

                return
            }




            const newRoomHistoryEntry = {
                id: generateUid(),
                roomId: formData.roomId,
                bedId: formData.bedId,
                bookingType: formData.admission.bookingType,
                sDate: formData.admission.admissionDate,
                eDate: formData.admission.dateDischargeAndRip,
                status:
                    +formData.admission.bookingType === BOOKING_TYPE.SHARED
                        ? BED_STATUS.OCCUPIED
                        : BED_STATUS.PRIVATE_OCCUPIED,
                note: '',
            };

            // Final combined resident data
            const newResidentData = {
                ...formData,
                roomHistory: [newRoomHistoryEntry],
            };

            // return;
            const newResident = await createResident(newResidentData, true);
            if(!newResident)
            updateResidentCache(newResident)
            navigate(-1);
        } catch (err) {
            console.error('Booking Submit Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    /**  Update Bed & Room History */


    return (
        <PageWrapper title={'Resident Form'}>
            <SubHeader>
                <SubHeaderLeft>
                    <Breadcrumb
                        list={[
                            { title: pagesMenu.operations.subMenu.rooms.text, to: `/${pagesMenu.operations.subMenu.rooms.path}` },
                            { title: 'Bed Booking', to: `/${pagesMenu.operations.subMenu.rooms.path}/create` },
                        ]}
                    />
                </SubHeaderLeft>

                <SubHeaderRight>
                    <Button
                        color='danger'
                        isLight
                        onClick={() => navigate(-1)}
                        isDisable={isLoading}
                        icon='ArrowBackIos'>
                        Back
                    </Button>
                    <Button
                        color='info'
                        isLight
                        onClick={handleBookingSubmit}
                        isLoading={isLoading}
                        icon='Save'>
                        Book Now
                    </Button>
                </SubHeaderRight>
            </SubHeader>

            <Page>
                <BedBookingForm
                    ref={bedBookingFormRef}
                    onGetResidentData={setCurrentResidentData}
                    roomsList={roomsList}
                    setBookingType={setBookingType}
                    isFromResidentPage={isFromResidentPage}
                />
            </Page>
        </PageWrapper>
    );
};

export default ResidentForm;
