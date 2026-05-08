
import { BedInfoTable } from './room-form';


const RoomForm = ({ bedsByRoomIdList, isLoading, isError, error, onOpenEditBedInfo = () => { },onOpenBedPriceNewForm=()=>{} ,roomId}: any) => {


  return (
    <div className="row g-4">
      {isLoading && <p>Loading beds...</p>}
      {isError && <p>Error: {error.message}</p>}
      {bedsByRoomIdList?.length === 0 && !isLoading && !isError && (
        <h3>No beds found for this room.</h3>
      )}
      {bedsByRoomIdList?.map((bed: any, i: number) => (
        <div className="col-md-6" key={bed.id}>
          <BedInfoTable roomId={roomId} bedDetails={bed} onOpenBedPriceNewForm={() => onOpenBedPriceNewForm(bed, i)} onOpenBedEditForm={(index) => onOpenEditBedInfo(bed, index)} />
        </div>
      ))}
    </div>
  );
};

export default RoomForm;
