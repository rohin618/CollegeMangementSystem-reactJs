import { useState } from "react";
import { getColorNameWithIndex } from "../../../../../common/data/enumColors";
import { Button, Card, CardActions, CardBody, CardHeader, CardLabel, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Spinner } from "../../../../../components/bootstrap";
import { getFirstLetter, showAlert } from "../../../../../helpers/helpers";
import useDarkMode from "../../../../../hooks/useDarkMode";
import { MiscellaneousServicesForm } from "../miscellaneousServicesForm";
import { useMultiSearch, useRemoveItemQueryListById } from "../../../../../hooks";
import Swal from "sweetalert2";
import { deleteMiscellaneous } from "../../../../../common/api/miscellaneous";
import { useMasterData } from "../../../../../contexts/mastersContext";


export const MiscellaneousServicesList = ({search}:any) => {
    const [isOpenMiscellaneousServicesFormModal, setIsOpenMiscellaneousServicesFormModal] = useState(false);
    const [lastLargeNumer, setLastLargeNumber] = useState(0);
    const [editMiscellaneousObject, setEditMiscellaneousObject] = useState<any>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null);


    const { miscellaneousList, isLoading, isError } = useMasterData();
    const { removeItemById, clearList } = useRemoveItemQueryListById<any>({
        queryKey: ['miscellaneousList'],
    });

    const filteredMiscellaneousList = useMultiSearch(miscellaneousList, { name: search });

    const { darkModeStatus } = useDarkMode();


    const handleOpenMiscellaneousServicesForm = () => {
        if (miscellaneousList && miscellaneousList.length > 0) {
            const maxRoom: number = Math.max(...miscellaneousList.map((r: any) => r.code));
            setLastLargeNumber(maxRoom + 1);
        } else {
            setLastLargeNumber(1001);
        }
        setIsOpenMiscellaneousServicesFormModal(true);
    };

    const handleCloseMiscellaneousServicesForm = () => {
        setIsOpenMiscellaneousServicesFormModal(false);
        setEditMiscellaneousObject({})

    };

    const handleOpenEditFormModal = (miscellaneous: any) => {
        setEditMiscellaneousObject(miscellaneous);
        setIsOpenMiscellaneousServicesFormModal(true);

    };


    const handleDeleteMiscellaneous = (id: string) => {
        showAlert({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",

            onConfirm: async () => {
                setDeletingId(id); // mark row as deleting
                try {
                    await deleteMiscellaneous(id);
                    removeItemById(id);
                } catch (error) {

                } finally {
                    setDeletingId(null);
                }
            }
        });

    }


    return (
        <Card>
            <CardHeader>
                <CardLabel icon="Receipt">
                    <CardTitle >
                        Miscellaneous
                    </CardTitle>
                    <CardActions tag="div" className="text-muted">
                        Total records: {filteredMiscellaneousList?.length ?? 0}
                    </CardActions>
                </CardLabel>
                <CardActions>
                    <Button color='primary' isLight onClick={handleOpenMiscellaneousServicesForm}>
                        Add New
                    </Button>
                </CardActions>
            </CardHeader>
            <CardBody>
                <div className="row">

                    <div className="col-md-12">
                        <div className='row g-3 justify-content-center'>
                            <div className='col-10'>
                                {/* Loader State */}
                                {isLoading && (
                                    <div className='text-center py-5'>
                                        <Spinner color='primary' size='lg' />
                                    </div>
                                )}

                                {/* Error State */}
                                {isError && (
                                    <div className='text-center text-danger'>
                                        Failed to load miscellaneous.
                                        <small className='d-block mt-1'>
                                            'Please try again later.'
                                        </small>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!isLoading && !isError && filteredMiscellaneousList.length === 0 && (
                                    <div className='text-center text-muted py-4'>No miscellaneous found.</div>
                                )}

                                {/* Company List */}
                                {!isLoading &&
                                    !isError &&
                                    filteredMiscellaneousList?.map((miscellaneous: any, i: number) => {
                                        const colorIndex = getColorNameWithIndex(i);
                                        return (
                                            <div className='row mb-4 border-bottom pb-1' key={miscellaneous.id}>
                                                {/* Left Section - Avatar + Title */}
                                                <div className='col d-flex align-items-center'>
                                                    {/* Avatar */}
                                                    <div className='flex-shrink-0'>
                                                        <div
                                                            className='ratio ratio-1x1 me-3'
                                                            style={{ width: '48px' }}>
                                                            <div
                                                                className={`bg-l${darkModeStatus ? 'o25' : '25'
                                                                    }-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
                                                                <span className='fw-bold'>
                                                                    {getFirstLetter(miscellaneous?.name)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Title + Subtitle */}
                                                    <div className='flex-grow-1'>
                                                        <div className='fs-6'>{miscellaneous?.name || ''}</div>
                                                        <div className='text-muted'>
                                                            <small>{miscellaneous.code}</small>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section - Button */}
                                                <div className='col-auto text-end'>
                                                    {deletingId === miscellaneous.id ? <Spinner /> : miscellaneous.id !== 'D1001' &&
                                                        <Dropdown>
                                                            <DropdownToggle hasIcon={false}>
                                                                <Button icon='MoreHoriz'
                                                                    color='dark'
                                                                    isLight
                                                                    shadow='sm'
                                                                    aria-label='More actions' />
                                                            </DropdownToggle>
                                                            <DropdownMenu isAlignmentEnd>
                                                                <DropdownItem>
                                                                    <Button icon="Edit" onClick={() => handleOpenEditFormModal(miscellaneous)}>Edit</Button>
                                                                </DropdownItem>

                                                                <DropdownItem isDivider />
                                                                <DropdownItem>
                                                                    <Button icon="Delete" onClick={() => handleDeleteMiscellaneous(miscellaneous.id)}>Delete</Button>
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>

                </div>
                <MiscellaneousServicesForm editMiscellaneousObject={editMiscellaneousObject} lastLargeNumer={lastLargeNumer} isOpen={isOpenMiscellaneousServicesFormModal} toggle={handleCloseMiscellaneousServicesForm} />
            </CardBody>
        </Card>
    )

}