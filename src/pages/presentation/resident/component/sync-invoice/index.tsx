import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";

import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
} from "../../../../../components/bootstrap";

import Icon from "../../../../../components/icon";
import useDarkMode from "../../../../../hooks/useDarkMode";

import {
  getFundTypes,
  priceFormat,
  getLabelByValue,
  getResidentInvoiceAddress,
  createInvoiceDataByDate,
  getInvoiceDescriptions,
} from "../../../../../helpers/helpers";

import {
    INVOICE_STATUS,
  INVOICE_TYPE,
  PAYMENT_STATUS,
  RESIDENT_STATUS_TYPE
} from "../../../../../common/constant";

import {
  INVOICE_CATEGORY_LIST,
  INVOICE_TO_TYPE_LIST,
} from "../../../../../common/data/option";

import { invoiceModel } from "../../../../../common/model/invoice";
import { createBlockBedInvoiceByDate } from "../../../../../helpers/createBlockBedInvoice";
import { useUpdateQueryListById } from "../../../../../hooks";
import { useMasterData } from "../../../../../contexts/mastersContext";
import { IInvoiceModel, ILaAndICBModel } from "../../../../../common/interface";
import { mergeInvoice } from "../../../../../helpers";
import { updateInvoice } from "../../../../../common/api/invoice";
import { getColorNameWithIndex } from "../../../../../common/data/enumColors";

interface SyncInvoiceProps {
  toggle?: () => void;
  isOpen?: boolean;
  residentData?: any;
  invoiceList?: IInvoiceModel[];
  fNCDetails?: any;
  vatList: any[];
  localAuthorityList: any[];
  localICBList: any[];
  laOrICBfundDetails?: ILaAndICBModel;
  isBlockBed?: boolean;
}

export const SyncInvoice: React.FC<SyncInvoiceProps> = ({
  toggle = () => {},
  isOpen = false,
  residentData,
  invoiceList = [],
  fNCDetails = {},
  vatList = [],
  localAuthorityList = [],
  localICBList = [],
  laOrICBfundDetails,
  isBlockBed = false,
}) => {
  const { darkModeStatus } = useDarkMode();
  const [isLoading, setIsLoading] = useState(false);
  const [updatedInvoices, setUpdatedInvoices] = useState<IInvoiceModel[]>([]);

  const updateInvoiceList = useUpdateQueryListById<any>([
    "invoiceList",
    residentData?.id,
  ]);

  const { billingPatternList } = useMasterData();
  const { fundSource, fundType, incontStatus, fncStatus } =
    getFundTypes(residentData) || {};

  /* ================= Billing Formula ================= */
  const billingFormula = useMemo(() => {
    const company = billingPatternList?.[0];
    return {
      privateBillingFormula: company?.privateBillingFormula,
      ccBillingFormula: company?.ccBillingFormula,
    };
  }, [billingPatternList]);

  /* ================= Sync Logic ================= */
  useEffect(() => {
    if (!invoiceList.length) {
      setUpdatedInvoices([]);
      return;
    }

    const synced: IInvoiceModel[] = invoiceList
      .filter(
        (inv) =>
          (inv.type === INVOICE_TYPE.NORMAL ||
            inv.type === INVOICE_TYPE.BLOCK_BED) &&
          inv.status === INVOICE_STATUS.DRAFT
      )
      .map((invoice) => {
        let endDate = moment(invoice.eDate);

        if (!isBlockBed && residentData) {
          const residentStatus =
            +residentData?.admission?.residentStatus;
          const dischargeDate =
            residentData?.admission?.dateDischargeAndRip;

          if (
            residentStatus !== RESIDENT_STATUS_TYPE.ACTIVE &&
            dischargeDate
          ) {
            const d = moment(dischargeDate);
            if (d.isSame(endDate, "month") || d.isBefore(endDate)) {
              endDate = d.clone();
            }
          }
        }

        const formData = {
          sDate: invoice.sDate,
          eDate: endDate.format("YYYY-MM-DD"),
        };

        const generated = isBlockBed
          ? createBlockBedInvoiceByDate({
              formData,
              fundType: invoice.invoiceTo,
              laOrICBfundDetails,
              vatList,
            })
          : createInvoiceDataByDate({
              formData,
              residentData,
              invoiceModel,
              fundSource,
              fncStatus,
              incontStatus,
              fundType,
              localAuthorityList,
              localICBList,
              vatList,
              fNCDetails,
              billingFormula,
              isShowBlockBednotify: false,
            });

        const updated = generated?.find(
          (g) =>
            +g.invoiceTo === +invoice.invoiceTo &&
            g.fundTypeId === invoice.fundTypeId
        );

        if (!updated || updated.totalPrice === invoice.totalPrice) {
          return null;
        }

        return mergeInvoice(invoice, updated);
      })
      .filter((inv): inv is IInvoiceModel => inv !== null);

    setUpdatedInvoices(synced);
  }, [invoiceList, isBlockBed, residentData, isOpen]);

  /* ================= Submit ================= */
  const handleInvoiceGenerate = async () => {
    if (!updatedInvoices.length) return;

    try {
      setIsLoading(true);
      await Promise.all(
        updatedInvoices
          .filter((i) => i.id)
          .map((i) => updateInvoice(i.id!, i))
      );

      updatedInvoices.forEach((inv) => updateInvoiceList(inv));
      toggle();
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= Render ================= */
  return (
    <Modal isOpen={isOpen} setIsOpen={toggle} size="xl">
      <ModalHeader setIsOpen={toggle}>
        <ModalTitle id="--">Sync Invoices</ModalTitle>
      </ModalHeader>

      <ModalBody>
        {updatedInvoices.length === 0 && (
          <h4 className="text-center">No Sync invoices found</h4>
        )}

        {updatedInvoices.map((row:IInvoiceModel, index) => {
          const color = getColorNameWithIndex(index);
          const invoiceAddress = getResidentInvoiceAddress(
            residentData,
            +row.invoiceTo,
            row.fundTypeId,
            { localAuthorityList, localICBList, fNCDetails }
          );

          return (
            <Card key={row.id} className="border" shadow="none">
              <CardHeader>
                <CardTitle>
                  <Badge isLight color={color} className="px-3 py-2">
                    {getLabelByValue(INVOICE_TO_TYPE_LIST, row.invoiceTo)} (
                    {invoiceAddress?.shortName})
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardBody>
                <table className="table mb-0">
                  <tbody>
                    {row.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Badge
                            isLight
                            color={darkModeStatus ? "light" : "dark"}
                          >
                            {getLabelByValue(
                              INVOICE_CATEGORY_LIST,
                              item.category
                            )}
                          </Badge>
                        </td>
                        <td>
                          {item.description ??
                            getInvoiceDescriptions(
                              invoiceAddress,
                              priceFormat(item.weekPrice),
                              row?.invoiceTo
                            )}
                        </td>
                        <td>{priceFormat(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          );
        })}
      </ModalBody>

      <ModalFooter>
        <Button color="danger" isLink onClick={toggle}>
          Cancel
        </Button>
        <Button
          color="success"
          isLight
          isLoading={isLoading}
          isDisable={!updatedInvoices.length}
          onClick={handleInvoiceGenerate}
        >
          Sync Invoice
        </Button>
      </ModalFooter>
    </Modal>
  );
};
