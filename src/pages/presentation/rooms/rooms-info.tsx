import { PageWrapper, SubHeader, SubHeaderLeft, SubHeaderRight, Page } from '../../../layout';
import { Breadcrumb, Button } from '../../../components/bootstrap';
import RoomForm from './component/room-info';
import { BedForm } from './component/room-form';
import { pagesMenu } from '../../../menu';
import { useState } from 'react';
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBedsByRoomId } from '../../../common/api/bed';
import { useLocation } from 'react-router-dom'
import { PRICE_PERIOD_STATUS } from '../../../common/constant';
import { generateUid, getActiveBedDetails } from '../../../helpers/helpers';

const RoomsFormPage = () => {
  const [isOpenBedForm, setIsOpenBedForm] = useState(false);
  const [editBedObject, setEditBedObject] = useState(null);
  const [editBedIndex, setEditBedIndex] = useState(0);
  const [bedName, setBedName] = useState('');
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const roomNumber = query.get('roomNumber')

  const { roomId }: any = useParams();
  const { data: bedsByRoomIdList, isLoading, isError, error } = useQuery({
    queryKey: ['bedsByRoomIdList', roomId], // include roomId in key so it refetches when it changes
    queryFn: () => getBedsByRoomId(roomId), // pass as a function
    enabled: !!roomId, // only run if roomId exists
  });


  const handleCloseBedForm = () => {
    setBedName('')
    setIsOpenBedForm(!isOpenBedForm)
    setEditBedIndex(0)
    setEditBedObject(null)

  }
  const handleOpenEditBedForm = (bedInfo: any, selectBedIndex: number) => {
    setIsOpenBedForm(!isOpenBedForm)
    setEditBedObject(bedInfo);
    setEditBedIndex(selectBedIndex)
  }
  // const handleDeleteBed = (bedIndex: number) => {

  //   setIsOpenBedForm(!isOpenBedForm)

  // }
  const handleUpdateData = () => {
    setBedName('')
    setIsOpenBedForm(!isOpenBedForm)
    setEditBedIndex(0)
    setEditBedObject(null)

  };


  const handleOpenModelCreateBed = () => {




    setIsOpenBedForm(!isOpenBedForm);
  };

  const handleOpenBedPriceNewForm = (bed: any, i: number) => {


    // const active = getActiveBedDetails(bed?.pricePeriods);
    // if (active) {
    //   alert("Current Price Periods is active or the end date has not expired. You cannot add a new Price Periods.");
    //   return; // 🚫 don't update if active exists
    // }

    const newPricePeriod = {
      sDate: '', // will be adapted with toLocaleString later if needed
      eDate: '',
      pricePerWeek: 0,
      minPricePerWeek: 0,
      status: PRICE_PERIOD_STATUS.ACTIVE,
       id:generateUid(),
    };

    // Clone bed and append new price period
    const updatedBed = {
      ...bed,
      pricePeriods: [...(bed?.pricePeriods || []), newPricePeriod],
    };

    setEditBedIndex(updatedBed.pricePeriods.length - 1); // index of the new one
    setEditBedObject(updatedBed);
    setIsOpenBedForm(!isOpenBedForm);

  }

  return (
    <PageWrapper title={`${roomNumber} Room`}>
      <SubHeader>
        <SubHeaderLeft>
          <Breadcrumb
            list={[
              {
                title: pagesMenu.operations.subMenu.rooms.text,
                to: `/${pagesMenu.operations.subMenu.rooms.path}`,
              },
              {
                title: 'Create New Room',
                to: `/${pagesMenu.operations.subMenu.rooms.path}/create`,
              },
            ]}
          />
        </SubHeaderLeft>

        <SubHeaderRight>
          <Button color="info" isLight icon="AddCircle" onClick={handleOpenModelCreateBed}>
            Add Bed
          </Button>
        </SubHeaderRight>
      </SubHeader>

      <Page>
        <RoomForm roomId={roomId} onOpenBedPriceNewForm={handleOpenBedPriceNewForm} bedsByRoomIdList={bedsByRoomIdList} isLoading={isLoading} isError={isError} error={error} onOpenEditBedInfo={handleOpenEditBedForm} />
      </Page>
      <BedForm bedName={bedName} bedsByRoomIdList={bedsByRoomIdList} isOpen={isOpenBedForm} editBedIndex={editBedIndex} editBedObject={editBedObject} onSuccess={handleUpdateData} toggle={handleCloseBedForm} />
    </PageWrapper>
  );
};

export default RoomsFormPage;
