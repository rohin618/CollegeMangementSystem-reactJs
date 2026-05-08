import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardLabel,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
} from "../../../../../components/bootstrap";
import useDarkMode from "../../../../../hooks/useDarkMode";
import Swal from "sweetalert2";
import { useMultiSearch, useRemoveItemQueryListById } from "../../../../../hooks";
import { deleteRelationship, getAllRelationships } from "../../../../../common/api/relationship";
import { useQuery } from "@tanstack/react-query";
import { getColorNameWithIndex } from "../../../../../common/data/enumColors";
import { getFirstLetter, showAlert } from "../../../../../helpers/helpers";
import { RelationshipForm } from "../relationshipForm";

interface IRelationShip {
  search?: any;
}
export const RelationshipList: React.FC<IRelationShip> = ({search}) => {
  const { darkModeStatus } = useDarkMode();
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editItem, setEditItem] = useState<any>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: relationshipList = [], isLoading, isError } = useQuery({
    queryKey: ['relationshipList'],
    queryFn: getAllRelationships,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

    const filteredRelationShipList = useMultiSearch(relationshipList, { name: search });

  const { removeItemById } = useRemoveItemQueryListById<any>({ queryKey: ["relationshipList"] });

  const handleOpenForm = () => setIsOpenForm(true);

  const handleEdit = (data: any) => {
    setEditItem(data);
    setIsOpenForm(true);
  };

  const handleCloseRelationshipModel = ()=>{
    setIsOpenForm(false);
    setEditItem({});
  }

  const handleDelete = (id: string) => {
    showAlert({
      title: "Are you sure?",
      text: "You won’t be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",

      customClass: {
        confirmButton: "btn btn-light-info",
        cancelButton: "btn btn-light-danger"
      },

      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteRelationship(id);
          removeItemById(id);
        } catch (error) {

        } finally {
          setDeletingId(null);
        }
      }
    });

  };


  return (
    <Card>
      <CardHeader>
        <CardLabel icon="Group">
          <CardTitle>Relationship</CardTitle>
          <CardActions className="text-muted">Total records: {filteredRelationShipList?.length || 0}</CardActions>
        </CardLabel>
        <CardActions>
          <Button color="primary" isLight onClick={handleOpenForm}>
            Add New
          </Button>
        </CardActions>
      </CardHeader>

      <CardBody>
        {isLoading && (
          <div className="text-center py-5">
            <Spinner color="primary" size="lg" />
          </div>
        )}

        {!isLoading && !isError && filteredRelationShipList.length === 0 && (
          <div className="text-center text-muted py-4">No relationships found.</div>
        )}

        {!isLoading &&
          filteredRelationShipList.map((relation: any, i: number) => {
            const colorIndex = getColorNameWithIndex(i);
            return (
              <div className="row mb-4 border-bottom pb-1" key={relation.id}>
                <div className="col d-flex align-items-center">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="ratio ratio-1x1 me-3" style={{ width: "48px" }}>
                      <div
                        className={`bg-l${darkModeStatus ? "o25" : "25"}-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}
                      >
                        <span className="fw-bold">{getFirstLetter(relation?.name)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-grow-1">
                    <div className="fs-6 fw-semibold">{relation?.name || "NA"}</div>
                  </div>
                </div>

                <div className="col-auto text-end">
                  {deletingId === relation.id ? (
                    <Spinner />
                  ) : (
                    <Dropdown>
                      <DropdownToggle hasIcon={false}>
                        <Button
                          icon="MoreHoriz"
                          color="dark"
                          isLight
                          shadow="sm"
                          aria-label="More actions"
                        />
                      </DropdownToggle>
                      <DropdownMenu isAlignmentEnd>
                        <DropdownItem>
                          <Button icon="Edit" onClick={() => handleEdit(relation)}>
                            Edit
                          </Button>
                        </DropdownItem>
                        <DropdownItem isDivider />
                        <DropdownItem>
                          <Button icon="Delete" onClick={() => handleDelete(relation.id)}>
                            Delete
                          </Button>
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
              </div>
            );
          })}

        <RelationshipForm
          isOpen={isOpenForm}
          relationshipEditData={editItem}
          toggle={handleCloseRelationshipModel}
        />
      </CardBody>
    </Card>
  );
};

