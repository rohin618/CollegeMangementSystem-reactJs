import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Option,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalTitle,
  Select,
  Input,
  Card,
  CardBody,
  Checks,
  Alert,
  Textarea,
} from '../../../../../components/bootstrap';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { getAllResidentWithInvoice } from '../../../../../common/api/resident';
import { createInvoice, getAllInvoicesList, updateInvoice } from '../../../../../common/api/invoice';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { DateTimePicker, ResidentProfileCard, SearchableSelect } from '../../../../../components/common';
import { creditWaletModel } from '../../../../../common/model/creditWalet';
import SimpleReactValidator from 'simple-react-validator';
import { PAYMENT_METHOD_LIST, INVOICE_TO_TYPE_LIST, INVOICE_CATEGORY_LIST } from '../../../../../common/data/option';
import { generateUid, getLabelByValue, getResidentInvoiceAddress, getResidetByAllAvilableFundList, getVatAmount, mergeArrayOfObjectUniqueByKey, priceFormat } from '../../../../../helpers/helpers';
import { CREDIT_TO, CREDIT_TYPE, INVOICE_CATEGORY, INVOICE_STATUS, INVOICE_TO_TYPE, PREBOOK_TYPE } from '../../../../../common/constant';
import moment from 'moment';
import { createCreditWallet, updateCreditWallet } from '../../../../../common/api/creditWalet';
import { useUpdateQueryListById } from '../../../../../hooks';
import { ICreditApply, ICreditWalletModel, IinvoiceCreditApply } from '../../../../../common/interface';

interface InvoicePayment {
  invoiceId: string;
  value: number;
}

interface Props {
  isOpen?: boolean;
  toggle?: () => void;
  editCreditDetailInfo?: ICreditWalletModel
}

export const CreditNotesForm: React.FC<Props> = ({
  isOpen = false,
  toggle = () => { },
  editCreditDetailInfo
}) => {

  const [formData, setFormData] = useState<ICreditWalletModel>({
    ...creditWaletModel,
    date: moment().format('YYYY-MM-DD'),
    items: [
      {
        id: generateUid(),               // uuid or ref id
        category: INVOICE_CATEGORY.BED, // BED | ROOM | MISC
        description: "",
        qty: 1,
        weekPrice: 0,
        amount: 0,
        vatId: "",
        vatRate: 0,
        vatAmount: 0,
        period: { from: moment().format('YYYY-MM-DD'), to: moment().format('YYYY-MM-DD') },
      }
    ],
  });
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [invoicePayment, setInvoicePayment] = useState<InvoicePayment[]>([]);

  const validator = useRef(
    new SimpleReactValidator({
      className: 'text-danger',
    })
  );

  const {
    miscellaneousList,
    fNCDetails,
    bankList,
    vatList,
    dueDateList,
    isLoading: isMasterLoading,
    localAuthorityList,
    localICBList,
  } = useMasterData();

  // Residents with invoices (for ReactSelect)
  const {
    data: residentListWithInvoice = [],
    isLoading: isResidentListLoading,
  } = useQuery({
    queryKey: ['residentListWithInvoice'],
    queryFn: getAllResidentWithInvoice,
  });

  const updateCreditNotesListByCompanyIdList = useUpdateQueryListById<any>(['creditNotesListByCompanyId']);



  useEffect(() => {

    if (isOpen && editCreditDetailInfo) {
      setFormData({ ...editCreditDetailInfo })
    }

  }, [editCreditDetailInfo, isOpen])







  // // Resident options for ReactSelect
  // const residentOptions = useMemo(() => {
  //   return (
  //     residentListWithInvoice?.map((r: any, i: number) => {
  //       const colorIndex = getColorNameWithIndex(i);
  //       return {
  //         label: <ResidentProfileCard resident={r} colorIndex={colorIndex} />,
  //         value: r.id,
  //       };
  //     }) ?? []
  //   );
  // }, [residentListWithInvoice]);

  const handleChangeResident = (data: any) => {
    setFormData((prev: any) => ({ ...prev, residentId: data?.value ?? '' }));
    // reset invoice-related states when resident changes
    setInvoicePayment([]);
  };

  const handleChangeInput = (event: any) => {
    const { name, value } = event.target;



    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Derived list: available "credit to" options for selected resident
  const resdientAvialbleCreditToList: any[] = useMemo(() => {
    if (!formData.residentId) return [];
    const selectedResident = residentListWithInvoice?.find((r: any) => r.id === formData.residentId);
    return getResidetByAllAvilableFundList(selectedResident) ?? [];
  }, [formData.residentId, residentListWithInvoice]);

  // Fund list depending on creditTo and resident funds
  const creditToAginesFunfList: any[] = useMemo(() => {
    const creditTo = Number(formData.creditTo);
    if (!creditTo) return [];

    const fundInfo: any = resdientAvialbleCreditToList?.find((fund: any) => {
      const val = fund?.value;
      if (Array.isArray(val)) return val.includes(creditTo);
      if (typeof val === 'string') return val.split?.(',').map((s: string) => Number(s.trim())).includes(creditTo);
      return val === creditTo;
    });

    const ids: string[] = Array.isArray(fundInfo?.fundTypeIds) ? fundInfo.fundTypeIds : [];
    if (!ids.length) return [];

    const sourceList = creditTo === INVOICE_TO_TYPE.CHC ? localICBList : creditTo === INVOICE_TO_TYPE.LA || creditTo === INVOICE_TO_TYPE.THIRD_PARTY_TOPUP ? localAuthorityList : [];

    if (!Array.isArray(sourceList)) return [];


    return ids.map((id) => sourceList.find((item: any) => item?.id === id)).filter(Boolean);
  }, [formData.creditTo, resdientAvialbleCreditToList, localICBList, localAuthorityList]);



  const createEmptyItem = () => ({
    id: generateUid(),
    category: INVOICE_CATEGORY.BED,
    description: '',
    qty: 1,
    weekPrice: 0,
    amount: 0,
    vatId: '',
    vatRate: 0,
    vatAmount: 0,
    period: { from: '', to: '' },
  });



  useEffect(() => {

    if (!isOpen) {

      setFormData({
        ...creditWaletModel,
        date: moment().format('YYYY-MM-DD'),
        items: [
          {
            id: generateUid(),               // uuid or ref id
            category: INVOICE_CATEGORY.BED, // BED | ROOM | MISC
            description: "",
            qty: 1,
            weekPrice: 0,
            amount: 0,
            vatId: "",
            vatRate: 0,
            vatAmount: 0,
            period: { from: '', to: '' },
          }
        ],
      })
    }


  }, [isOpen])




  /** 🔹 Submit form (Save) */
  const handleFormSubmit = async () => {
    setIsSubmitted(true);

    /** Validate */
    if (!validator.current.allValid()) {
      validator.current.showMessages();
      return;
    }
    const selectedResident = residentListWithInvoice?.find(
      (r: any) => r.id === formData.residentId,
    );


    const body = {
      ...formData,
      type: CREDIT_TYPE.ADJUSTMENT_CREDIT,
      vatTotal,
      creditAmount,
      subTotal: (creditAmount - vatTotal)
    };

    const creditNotesAddress: any = getResidentInvoiceAddress(
      selectedResident,
      +formData.creditTo,
      formData?.fundTypeId,
      { localAuthorityList, localICBList, fNCDetails }
    );
    setIsLoadingForm(true)
    const resWallet = await (formData?.id
      ? updateCreditWallet(formData.id, body)
      : createCreditWallet(body, creditNotesAddress.shortName)
    );

    updateCreditNotesListByCompanyIdList({ ...resWallet, residentData: selectedResident })
    toggle();
    setIsLoadingForm(false)

  };


  const creditAmount = useMemo(() => {
    return (formData.items ?? []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [formData.items]);
  const vatTotal = useMemo(() => {
    return (formData.items ?? []).map((vat) => ({ ...vat, vatAmount: getVatAmount(vat.amount, vat.vatRate) })).reduce(
      (sum, item) => sum + Number(item.vatAmount || 0),
      0
    );
  }, [formData.items]);


  const updateItem = (itemId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items ?? []).map((item) => {
        if (item.id !== itemId) return item;

        // ✅ handle nested period.from
        if (field === 'from') {
          return {
            ...item,
            period: {
              ...item.period,
              from: value,
              to: value, // if this is intended
            },
          };
        }

        if (field === 'vatId') {
          const vatRate = vatList.find((vat) => vat.id === value);
          return {
            ...item,
            [field]: value,
            vatRate: +Number(vatRate?.rate || 0).toFixed(2),
          }
        }


        // ✅ normal field update
        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  };


  /* ============================================================
   ITEM HANDLERS (ADD / UPDATE / DELETE)
============================================================ */
  const addItem = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      items: [...(formData.items ?? []), createEmptyItem()],
    }));
  }, [formData.items]);

  const deleteItem = useCallback((itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items:
        (formData.items ?? []).length > 1
          ? (formData.items ?? []).filter((i) => i.id !== itemId)
          : prev.items,
    }));
  }, [formData.items]);








  return (
    <Modal setIsOpen={toggle} isOpen={isOpen} fullScreen titleId="transfer-modal">
      <ModalHeader setIsOpen={toggle}>
        <ModalTitle id="transfer-modal">Add Credit Notes</ModalTitle>
      </ModalHeader>

      <ModalBody className="">
        <div className="row mb-4">
          <div className="col-3">
            <FormGroup id="residentId" label="Resident Name">

              <SearchableSelect
                isValid={validator.current.fieldValid('Select resident')}
                isTouched={isSubmitted}
                invalidFeedback={validator.current.message('Select resident', formData.residentId, 'required')}
                name="residentId"
                id="residentId"
                value={formData.residentId}
                onChange={handleChangeInput}
                isLoading={isResidentListLoading}
                options={residentListWithInvoice}
                placeholder='SelectResident'
                labelKey='personal.name'
                valueKey='id'
                renderLabel={(r, i) =>
                  <ResidentProfileCard resident={r} colorIndex={getColorNameWithIndex(i)} isNavigate={false}/>
                }

              />

              {validator.current.message('Select resident', formData.residentId, 'required')}
            </FormGroup>
          </div>

          <div className="col-3">
            <FormGroup id="searchList" label="credit To">
              <SearchableSelect
                isValid={validator.current.fieldValid('credit To')}
                isTouched={isSubmitted}
                invalidFeedback={validator.current.message('credit To', formData.creditTo, 'required')}
                name="creditTo"
                id="creditTo"
                value={formData.creditTo}
                onChange={handleChangeInput}
                disabled={!formData.residentId || isResidentListLoading}
                isLoading={isResidentListLoading}
                options={resdientAvialbleCreditToList}
                placeholder='Select Credit To'
              />

            </FormGroup>
          </div>

          <div className="col-3">
           {  (formData?.creditTo === INVOICE_TO_TYPE.CHC ||  formData?.creditTo === INVOICE_TO_TYPE.LA ) &&
             <FormGroup id="fundTypeId" label="Fund Name">
              <SearchableSelect
                isValid={
                  creditToAginesFunfList?.length > 0
                    ? validator.current.fieldValid('fundTypeId')
                    : true
                }

                isTouched={isSubmitted}
                invalidFeedback={creditToAginesFunfList?.length > 0
                  ? validator.current.message(
                    'fundTypeId',
                    formData.fundTypeId,
                    'required'
                  )
                  : ''
                }
                name="fundTypeId"
                id="fundTypeId"
                value={String(formData.fundTypeId ?? '')}
                onChange={handleChangeInput}
                disabled={!formData.creditTo}
                options={creditToAginesFunfList}
                placeholder='Select Fund Name'
                valueKey='id'
                labelKey='name'

              />

            </FormGroup>
           }
          </div>

          <div className="col-3">
            <div className="row">
              <div className="col-6">

              </div>

              <div className="col-6 text-end">
                <h5 className="h5">Amount Received</h5>
                <h2 className="fw-bold fs-3 mb-0">{priceFormat(Number(creditAmount || 0))}</h2>
                {/* <h5 className="h5 mt-3">Customer Balance</h5>
                                <span className="fs-4">{priceFormat(overallResidentBalance)}</span> */}
              </div>
            </div>
          </div>
         
        </div>

        {/* Payment Form */}
        <div className="row mb-4">
          <div className="col-3">
            {/* <FormGroup id="date" label="Credit Note Date"> */}
            <DateTimePicker
              // minDate={moment()}
              name="date"
              label="Credit Note Date"
              value={formData.date}
              onChange={handleChangeInput}
              isValid={validator.current.fieldValid('Credit Note Date')}
              isTouched={isSubmitted}
              invalidFeedback={validator.current.message('Credit Note Date', formData.date, 'required')}

            />
            {/* </FormGroup> */}
          </div>
 <div className='col-3'>
            <FormGroup id='notes' label='Notes'>
              <Textarea

                rows={3}
                id='notes'
                name='notes'
                placeholder='Enter Notes'
                value={formData?.notes}
                onChange={handleChangeInput}
                ></Textarea>

            </FormGroup>
          </div>
        </div>



        {/* Outstanding Transactions */}
        <div className="row mt-5">
          {/* <div className="col-md-12 mb-4">
                        <h1>Outstanding Transaction</h1>
                    </div> */}

          <div className="col-md-12">



            <table className="table table-modern table-hover mb-5">
              <thead>
                <tr>
                  {/* <th>Date</th> */}
                  <th>Category</th>
                  <th>DESCRIPTION</th>
                  <th>VAT</th>
                  <th>AMOUNT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.items?.map((item, i) =>
                  <tr key={i}>
                    {/* <td>
                        <DateTimePicker value={item.period.from} onChange={(e) =>
                          updateItem(
                            item.id,
                            'from',
                            e.target.value
                          )
                        } 
                        
                        minDate={moment(formData.date)}
                        isValid={validator.current.fieldValid('Date' + i)}
                          isTouched={isSubmitted}
                          invalidFeedback={validator.current.message('Date' + i, item.period.from, 'required')} />
                      </td> */}
                    <td>
                      <SearchableSelect
                        isValid={validator.current.fieldValid('Category' + i)}
                        isTouched={isSubmitted}
                        invalidFeedback={validator.current.message('Category' + i, item.category, 'required')}
                        placeholder='Select Category'
                        name='category'
                        id='category'
                        value={item.category}
                        onChange={(e: any) =>
                          updateItem(
                            item.id,
                            'category',
                            e.target.value
                          )
                        }
                        options={INVOICE_CATEGORY_LIST}
                      />

                    </td>
                    <td>
                      <Textarea
                        rows={1}
                        value={item.description}
                        isValid={validator.current.fieldValid('description' + i)}
                        isTouched={isSubmitted}
                        invalidFeedback={validator.current.message('description' + i, item.description, 'required')}
                        onChange={(e: any) =>
                          updateItem(
                            item.id,
                            'description',
                            e.target.value
                          )
                        } />
                    </td>
                    <td>
                      {/* {Number(item.vatRate || 0).toFixed(1)}% */}
                      <SearchableSelect
                        isValid={validator.current.fieldValid('vat Rate' + i)}
                        isTouched={isSubmitted}
                        invalidFeedback={validator.current.message('vat Rate' + i, item.vatId, 'required')}

                        name='vatId'
                        id='vatId'
                        value={item.vatId}
                        onChange={(e: any) =>
                          updateItem(
                            item.id,
                            'vatId',
                            e.target.value
                          )
                        }
                        options={vatList}
                        isLoading={isMasterLoading}
                        placeholder='Select VAT Rate'
                        labelKey='rate'
                        valueKey='id'
                        renderLabel={(vat) =>
                          `${Number(vat.rate).toFixed(1)}% - ${vat.name}`
                        } />

                    </td>
                    <td>
                      <Input isValid={validator.current.fieldValid('amount' + i)}
                        isTouched={isSubmitted}
                        invalidFeedback={validator.current.message('amount' + i, item.amount, 'required')} value={item.amount} onChange={(e: any) =>
                          updateItem(
                            item.id,
                            'amount',
                            Number(e.target.value)
                          )
                        } />
                      <small className='text-muted'>Enter Amount include VAT</small>
                    </td>
                    <td>
                      <Button
                        color='info'
                        isLight
                        icon='AddCircle'
                        onClick={addItem}
                      />

                      {(formData.items ?? []).length > 1 && (
                        <Button
                          color='danger'
                          isLight
                          className='ms-2'
                          icon='Delete'
                          onClick={() => deleteItem(item.id)}
                        />
                      )}
                    </td>
                  </tr>
                )}


              </tbody>
            </table>
            {/* </div> */}

          </div>
        </div>

        {creditAmount ? (
          <div className="row sticky-bottom position-absolute w-100">
            <div className="col-12 text-end">
              <Card>
                <CardBody>

                  <div className="row">

                    <div className="col-12 text-end">
                      <Button color="danger" className="me-2" isDisable={isLoadingForm} onClick={toggle}>
                        Cancel
                      </Button>
                      <Button
                        color="info"
                        isLoading={isLoadingForm}
                        isDisable={isLoadingForm}
                        onClick={handleFormSubmit}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        ) : ""}
      </ModalBody>
    </Modal>
  );
};

