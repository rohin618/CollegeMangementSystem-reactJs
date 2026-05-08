import { generateUid } from "../../helpers/helpers";
import { ADVANCE_STATUS, BOOKING_TYPE, PREBOOK_TYPE, SALUTATION, FAMILY_OR_THIRD_PARTY_TOPUP_STATUS, BLOCK_BEDS_TYPE, PRICE_PERIOD_STATUS } from "../constant/app";

export const residentModel = {
    bedId: '',
    roomId: '',
    notes:'',
    depositInvoiceId:'',
    personal: {
        name: '',
        gender: '',
        dob: '',
        email: '',
        phone: '',
        addres: '',
        salutation: SALUTATION.MR,
    },
    admission: {
        admissionDate: '',
        typeOfPlacement: '',
        respiteSDate: "",
        respiteEDate: "",
        respiteStatusList: [{
            id: generateUid(),
            status: '',
            sDate: '',
            eDate: '',
        }],
        invoiceRequest: "",
        invoiceMode: '',
        residentStatus: '',
        dateDischargeAndRip: '',
        contractStatus: '',
        noOfRespiteWeeks: '',
        bookingType: BOOKING_TYPE.SHARED,  // shared | private
        feesIncrementInfo: [
            {
                id: generateUid(),
                percentage: "",
                date: '',
            }
        ]

    },
    fundDetails: [
        {
            currentBlockBedId: "",
            currentBlockHistoryId: "",
            blockBedStatus: BLOCK_BEDS_TYPE.NO,

            id: generateUid(),
            fundSource: "",//from ENEM
            clientId: '',
            icbClientId:'',
            nameOfLa: '', // from 
            nameIbc: '',
            jfLaRoomPrice:'',  // joint fund la price
            jfIcbRoomPrice:'',  // joint fund iCB price
            laContribution: 0,
            fundType: '',
            clientContribution: '',
            clientContributionSdate: '',
            fncStatus: '',//From Enem
            fncSdate: '',//From Enem
            incontStatus: '',
            incontDetails: [
                {
                    id: generateUid(),
                    perWeek: '', //number
                    sDate: '',//Date,
                    eDate: '',

                }
            ],
            sDate: '',//Date,
            eDate: '',
            status: '',
            familyTopupStatus: FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.NO,
            familyTopupEffectiveDate: '',
            familyTopupPrice: '',
            thirdPartyTopupStatus: FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.NO,
            thirdPartyTopupEffectiveDate: '',
            thirdPartyTopupPrice: '',
        }

    ],
    // guardian: {
    //     name: '',
    //     email: '',
    //     phone: '',
    //     relation: '',
    //     emergencyPhone: '',
    //     emergencyName: ''

    // },
    nok: [
        {
            id: generateUid(),
            salutation: 1,
            name: "",
            email: "",
            address: "",
            phone: '',
            relation: '',
            lpa: '',
            lpaSdate: "",
            townOrCity: '',
            county: '',
            postcode: '',
            invoiceRequired: '',
            emailType:'',


        }
    ],
    roomPrice: [
        {
            id: generateUid(),
            perWeek: '',
            sDate: '',
            eDate: '',
            status: PRICE_PERIOD_STATUS.ACTIVE,
            isBelowMinPrice: false,
            laOrContributionInfo: [
                //  {
                //            sDate: '',
                //         eDate: '',
                //         perWeek: ''
                //  }
            ]
        }
    ],
    billing: {
        salutation: SALUTATION.MR,
        name: "",   
        email:'',          // e.g., "John Smith"
        addressLine1: "",         // e.g., "221B Baker Street"
        addressLine2: "",         // optional, e.g., "Flat 2"
        townOrCity: "",           // e.g., "London"
        county: "",               // optional, e.g., "Greater London"
        postcode: "",             // e.g., "NW1 6XE"
        country: "United Kingdom",
        phoneNumber: ""           // e.g., "+44 7700 900123"

    },
    // advancePayment: {
    //     totalAmount: 0,             // total advance paid by resident
    //     // modeOfPayment: "",          // e.g., Cash, Bank Transfer, Card, UPI, etc.
    //     status: ADVANCE_STATUS.ACTIVE,           // ACTIVE | PARTIALLY_USED | CLOSED | REFUNDED
    //     remarks: "",                // optional notes
    //     date: "",            // when advance was received
    //     // referenceNo: "",            // bank ref, transaction id, etc.
    //     balanceAmount: 0,           // system calculated (total - used - refunded)
    //     usageHistory: [
    //         // {
    //         //     type: "",               // Invoice | Refund | Adjustment | Other
    //         //     amount: 0,
    //         //     date: "",
    //         //     invoiceId: "",          // link to invoice if used for billing
    //         //     transactionId: "",      // for refund or accounting link (optional)
    //         //     note: ""                // free text for clarity
    //         // }
    //     ]
    // }
    roomHistory: [
        //          {
        //     id: "UID_1",
        //     roomId: "ROOM_101",
        //     bedId: "BED_A",
        //     bookingType: "SHARED",
        //     sDate: "2025-11-02",
        //     eDate: null,
        //     status: "OCCUPIED",
        //     note: "Moved from previous room"
        //   }
    ]

};
