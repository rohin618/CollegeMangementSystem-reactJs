import moment from 'moment';
import { evaluateMonthlyPrice, getActiveFundBlockBed, getActiveFundDetails, getActiveRespiteDetails, getActiveWeekInfoByEndDate, getLabelByValue, priceFormat } from '../../../helpers/helpers'
import { FUND_SOURCE_TYPE, FUND_TYPE, } from '../../constant';
import { SALUTATION_LIST } from '../../data/option';
import '../../../pages/presentation/resident/component/residentDocuments/printDoc.scss'
import { BLOCK_BEDS_TYPE, FAMILY_OR_THIRD_PARTY_TOPUP_STATUS } from '../../constant/app';
import { getActiveBlockBedByFund, getActiveFundDetailsByJointFund, getActiveFundDetailsByLAOrICB } from '../../../helpers/resident';



export const permanentAgreementDocument = (residentData: any,
    comapanyDetails: any,
    roomInfo: any,
    theme: any,
    billingFormulas: any,
    localAuthorityList: any,
    localICBList: any,

) => {
    let fundDetails = getActiveFundDetails(residentData?.fundDetails);
    // const localAuthority = +fundDetails?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY
    //     ? fundDetails
    //     : {};

    // const icb = +fundDetails?.fundSource === FUND_SOURCE_TYPE.CHC
    //     ? fundDetails
    //     : {};

    const isLocalAuthority = +fundDetails?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY;
    const isCHC = +fundDetails?.fundSource === FUND_SOURCE_TYPE.CHC;

    const isPrivate = +fundDetails?.fundSource === FUND_SOURCE_TYPE.PRIVATE;


    // Joint Fund Logic
    const isJointFund = +fundDetails?.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG;
    const jointFundLaPrice = fundDetails?.jfLaRoomPrice || 0;
    const jointFundIcbPrice = fundDetails?.jfIcbRoomPrice || 0;

    const isClientContribution = fundDetails?.clientContribution > 0;
    const isFamilyTopUp = +fundDetails?.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES;


    // block Bed Yes means swift the Room Price to Active BlockBed Price
    let roomPrice = roomInfo?.perWeek;
    if (+fundDetails?.blockBedStatus === BLOCK_BEDS_TYPE.YES) {
        const authorityDetails = getActiveFundDetailsByLAOrICB(
            fundDetails,
            localAuthorityList,
            localICBList,
        );
        const activeBlockBed = getActiveFundBlockBed(authorityDetails?.blockBeds);
        roomPrice = activeBlockBed?.perWeek || 0;
    }
    


    // For getting the funding Authorithy Name
    let fundingNameIcb = '';
    let fundingNameLA = '';
    if (isJointFund) {
        const { la: laDetails, icb: icbDetails } = getActiveFundDetailsByJointFund(
            fundDetails,
            localAuthorityList,
            localICBList,
        );

        fundingNameIcb = icbDetails?.name || '';
        fundingNameLA = laDetails?.name || '';
    } else if (!isPrivate) {
        const funding = getActiveFundDetailsByLAOrICB(
            fundDetails,
            localAuthorityList,
            localICBList,
        );

        if (isCHC) {
            fundingNameIcb = funding?.name || '';
        }

        if (isLocalAuthority) {
            fundingNameLA = funding?.name || '';
        }
    }



    const laMonthlyPrice = isLocalAuthority ? evaluateMonthlyPrice(
        isClientContribution ?
            billingFormulas.find((item: any) => item.id === comapanyDetails?.ccBillingPattern).formula :
            billingFormulas.find((item: any) => item.id === comapanyDetails?.familyTopupPattern).formula,
        isClientContribution ? fundDetails?.clientContribution : fundDetails?.familyTopupPrice
    ) : 0;

    const icbMonthlyPrice = isCHC ? evaluateMonthlyPrice(
        billingFormulas.find((item: any) => item.id === comapanyDetails?.familyTopupPattern).formula,
        fundDetails?.familyTopupPrice
    ) : 0;

    const privateMonthlyPrice = isPrivate ? evaluateMonthlyPrice(
        billingFormulas.find((item: any) => item.id === comapanyDetails?.privateBillingPattern).formula,
        roomInfo?.perWeek,
    ) : 0;

    const admissionDate = residentData?.admission?.admissionDate;
    const fundStartDate = fundDetails?.sDate;
    const activePermanent = getActiveRespiteDetails(residentData?.admission?.respiteStatusList);

    const displayDate = moment.max(
        moment(admissionDate),
        moment(activePermanent?.sDate || fundStartDate)
    );

    return `   <div
  class=" py-4 mt-5"
  style="
    background:${theme.bg};
    color:${theme.text};
    border-radius:10px;
    margin-bottom:30px;
  "
>

        
        <div
  class="contract"
  style="
    background:${theme.surface};
    
    padding:2rem;
    margin-bottom:2rem;
    text-align: justify;
    line-height:1.8;
  "
>

            <header class="mb-5 header-contract">
                <div class="text-center">
                    <h1>Resident’s Contract</h1>
                    <p class="small-muted" style="color:${theme.mutedText};font-size:.92rem">
(Terms and Conditions for Residence)
                    </p>
                </div>
                 <div class="row mb-3 mt-5 mx-auto" style="max-width: 900px;">
                    <h4 class="col-md-12 text-center "><strong>Resident’s Name:</strong> ${getLabelByValue(SALUTATION_LIST, residentData?.personal.salutation)}. ${residentData?.personal.name}</h4>
                    
                </div>
            </header>
            <!-- section A -->
            <section class="mb-4 marginTop-space-doc" id="section-a" style="break-before: page; page-break-before: always;">
                <h4
  class="section-title"
  style="
    background:${theme.sectionBg};
    padding:.5rem .75rem;
    border-radius:.35rem;
    margin-bottom:2rem;
    margin-top:3rem;
    text-align:center;

  "
>

                    Section A </h4>
                <h4>ABOUT ${comapanyDetails?.tradeName?.toUpperCase() || ''} </h4>
                <p class="clause" style="margin-bottom:1rem">${comapanyDetails?.tradeName} (the "Home")  is owned and operated by ${comapanyDetails?.name} (the "Company") . The
                    Home aims to provide high quality services tailored as closely as possible to meet the resident’s
                    individual needs and choices. Above all, the wishes of the people we care for are of primary
                    importance. Residents are involved as much as possible in making decisions about the way the ${comapanyDetails?.name}
                     is run. The Company’s reputation depends on ensuring that we provide the quality of
                    service and care that our residents and their families require.</p>
                <h4>ABOUT THIS DOCUMENT</h4>
                <p class="clause" style="margin-bottom:1rem">This document is important as it is your contract with the
                    Company. You should read it
                    carefully as it is legally binding. You may like to seek independent legal advice as it is important
                    that you have read and understood these terms and conditions before entering into this agreement.
                </p>
                <p class="clause" style="margin-bottom:1rem">This document sets out our general terms and conditions
                    that will apply. From time to
                    time we make amendments to our terms and conditions to reflect changing circumstances that affect
                    the Home and the way in which it is operated. We will always give residents at least one month’s
                    notice of any changes to our terms and conditions and the amended terms and conditions will then
                    apply.</p>
                <p class="clause" style="margin-bottom:1rem">The acceptance of a person to stay in a care home involves
                    a special relationship. We
                    value the personal quality of this relationship and do our utmost to care for our residents. To do
                    so, we have to maintain an extensive infrastructure at a substantial financial cost and therefore we
                    have to define the relationship in contractual terms. These terms are intended to protect you and us
                    from any misunderstandings and are for our mutual benefit.</p>
                <h4>IMPORTANT INFORMATION FOR REPRESENTATIVES OF RESIDENTS</h4>
                <p class="clause" style="margin-bottom:1rem">If you are the representative of a resident and sign the
                    resident’s admission
                    agreement on the resident’s behalf, the terms and conditions in this document will apply to you in
                    the same way as they apply to the resident. You will be personally bound by these terms and
                    conditions unless you have signed the admission agreement in the capacity of:</p>
                <ul>
                    <li>the resident’s validly appointed attorney under either an enduring or lasting power of attorney
                        and that power of attorney remains valid; or</li>
                    <li>the resident’s validly appointed receiver.</li>
                </ul>
                <p class="clause" style="margin-bottom:1rem">If you are the resident’s validly appointed attorney or
                    receiver at the time of
                    signing the admission agreement it is your responsibility to ensure that your appointment remains
                    valid (for example by registering an unregistered enduring power of attorney at the time it becomes
                    registrable). If your appointment as the resident’s attorney or receiver ceases to be valid, you
                    will immediately become personally responsible for the resident’s obligations under these terms and
                    conditions.</p>
            </section>
            <!-- section B -->
            <section class="mb-4 marginTop-space-doc" id="section-b" style="break-before: page; page-break-before: always;">
               <h4
  class="section-title"
  style="
    background:${theme.sectionBg};
    padding:.5rem .75rem;
    border-radius:.35rem;
    margin-bottom:2rem;
    margin-top:3rem;
    text-align:center;
    border:1px solid ${theme.border};
  "
>

                    Section B </h4>
                <h4>OUR CHARGES</h4>
                <ol class="contract-list">
                    <li class="pt-3">
                        <strong class="head-text">IF YOU PAY OUR CHARGES YOURSELF</strong>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>1.1</b></span>
                                <span class="list-text">
                                <b>Room ${residentData?.bedDetails?.bedName}</b> at <b>${comapanyDetails?.tradeName}</b> has been reserved for <b>${getLabelByValue(SALUTATION_LIST, residentData?.personal.salutation)}. ${residentData?.personal.name}.</b> The weekly
                                nursing fee is <b>${isPrivate ? priceFormat(roomInfo?.perWeek) : "NA"}</b> excluding the FNC from <b> ${isPrivate ? moment(displayDate).format('DD/MM/YYYY') : "NA"}</b> and the monthly fee is <b>${isPrivate ? priceFormat(privateMonthlyPrice) : "NA"}.</b>
                                </span>
                            </li>
                            <li class="pt-3 d-flex">
                               <span class="list-number"><b>1.2</b></span>
                               
                               <span class="list-text">The charge that applies to you as a resident of the Home depends on your assessed
                                care needs and type of accommodation. We review the amount of our charges periodically,
                                normally annually (in January), and you will be given at least one-month notice of any
                                periodic
                                increase. At the end of the notice period the increased charge will apply. Apart from
                                the periodic
                                increases in our charges, our charges will change if the level of care you require
                                changes. We will
                                have a meeting with the resident or the representative and go through the change the
                                level of
                                care the associated cost. The new rate will be agreed with the resident or the
                                representative
                                before it is applied. You will be charged the appropriate rate for the new level of care
                                from the
                                date of the change. </span>
                            </li>
                            <li class="pt-3 d-flex">
                               <span class="list-number"><b>1.3</b></span>
                               
                               <span class="list-text">
                               If you are unable to move into the Nursing Home straightaway and we agree to hold
                                a room for you, we require one-week nursing fee as deposit. For the first week (from the
                                date the deposit is agreed) there won’t be any charge to hold the room but if the room
                                is not
                                occupied in the second week, we will charge 50% of the weekly charge. If the room is not
                                occupied after
                                two weeks, the full charge will be applied thereafter. If you pay the deposit for the
                                room and
                                don’t take the room, you will lose the full deposit.
                                </span>
                            </li>
                            <li class="pt-3 d-flex">
                               <span class="list-number"><b>1.4</b></span>
                               <span class="list-text">
                                What if your funds diminish to the point where you will become eligible for all or
                                part of the Home’s charges to be paid by a local authority and there is a shortfall
                                between the Home’s full fee and the amount that the local authority will pay (together
                                with the amount of your assessed contribution). The answer to this question depends on
                                how much notice we have been given of you becoming eligible for public funding.
                                </span>
                            </li>

                            
                            <ul style="list-style: none;">
                                    <li class="mt-3 d-flex">
                                       <span class="list-number"><b>1.4.1</b></span> 
                                       <span class="list-text">
                                         If, at least one year before you become eligible for local authority
                                        funding you have given the Home:

                                        <ul class="sub-bullets">
                                            <li class="mt-3">
                                                written notice that you anticipate becoming eligible for local
                                                authority funding at the end of one year; and
                                            </li>
                                            <li class="mb-3">
                                                a detailed statement of your financial position at the time of giving
                                                notice which demonstrates to the Home's satisfaction that you will
                                                become eligible for local authority funding at the end of one year
                                            </li>
                                        </ul>

                                        If you have given one year notice we will move the resident to a social services
                                        room when you become eligible for local authority funding (when a room becomes
                                        available) and you will be able to stay in the Home and we will not seek to
                                        recover the shortfall in fees from you or from anyone else.
                                       </span>

                                    </li>
                                    <li  class="marginTop-space-doc" style="break-before: page; page-break-before: always;">
                                       <div class="mt-3 d-flex">
                                       <span class="list-number"><b>1.4.2</b></span> 
                                       <span class="list-text">
                                        If you have given us less than one-year written notice or not given us any
                                        notice of becoming eligible for local authority funding (supported by a detailed
                                        statement of your financial position), any shortfall in fees must be paid by a
                                        third party on your behalf from the date that the local authority starts paying
                                        for you. During the notice period if a social services room becomes available we
                                        will move the residents to the social services and will not seek to recover the
                                        shortfall from you or from anyone else. If the shortfall cannot be paid by a
                                        third party during the notice period then we reserve the right not to accept you
                                        as a local authority funded resident, in which case you will either have to
                                        leave the Home or will have to continue paying the Home’s full fee from your own
                                        funds without any contribution from the local authority.
                                       </span>
                                       </div>
                                    </li>
                                    <li class="mt-3 d-flex">
                                       <span class="list-number"><b>1.4.3</b></span> 
                                        <span class="list-text">
                                            During any period that there is a shortfall in your fees it may be
                                        necessary for you to move to a less expensive room.
                                        </span>
                                    </li>
                                    <li class="mt-3 d-flex">
                                       <span class="list-number"><b>1.4.4</b></span> 
                                       <span class="list-text">
                                           During contractual period, any changes to appointeeship/POA/LPA needs to
                                        be informed in writing to us immediately. This contract will be deemed not valid
                                        from the date we are informed, and new contract will be issued respectively.
                                       </span>
                                    
                                    </li>
                                </ul>
                        </ul>
                    </li>
                    <li class="pt-3">
                        <strong class="head-text">IF NHS PAYS FOR SOME OR ALL OF OUR CHARGES</strong>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>2.1</b></span>
                                <span class="list-text">
                                <b>Room ${residentData?.bedDetails?.bedName}</b> at <b>${comapanyDetails?.tradeName}</b> has been reserved for <b>${getLabelByValue(SALUTATION_LIST, residentData?.personal.salutation)}. ${residentData?.personal.name}.</b> The weekly nursing fee paid by the ${fundingNameIcb ? fundingNameIcb : 'NHS'} is 
                                
                                <b>${isCHC ? priceFormat(+fundDetails?.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES
        ? (roomPrice || 0) - (fundDetails?.familyTopupPrice || 0)
        : (roomPrice || 0)
    ) : isJointFund ? priceFormat(jointFundIcbPrice) : "NA"}</b>. 
                                </span>
                            </li>

                            <li class="pt-3 d-flex">
                             <span class="list-number"><b>2.2</b></span>
                                 <span class="list-text">
                                    The family contributes <b>${isCHC ? +fundDetails?.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES ? priceFormat(fundDetails?.familyTopupPrice || 0) : 0.00 : "NA"}</b> per week for a larger, enhanced room with additional features, which they prefer over a standard CHC-funded room. The Monthly family Top-up contribution is <b>${isCHC ? priceFormat(icbMonthlyPrice) : 'NA'}</b>.
                                 </span>
                            </li>


                            <li class="pt-3 d-flex">
                             <span class="list-number"><b>2.3</b></span>
                                 <span class="list-text">
                                  What if your care needs change so that you become eligible for continuing NHS
                                healthcare but the amount that the NHS will pay is less than the full amount of the
                                Home’s charges? In this event, the shortfall will represent the cost of the additional
                                facilities and
                                enhanced accommodation provided by the Home which are not required to meet your health
                                care needs
                                and you will continue to be liable for the shortfall. If you decide not to accept this
                                liability
                                to pay the shortfall, then we reserve the right not to accept you as a NHS funded
                                resident, in
                                which case you will have to leave the Home.
                                 </span>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>2.4</b></span>
                                <span class="list-text">
                                If you are unable to move into the Nursing Home straightaway and we agree to hold
                                a room for you, we require one-week nursing fee as deposit. For the first week (from the
                                date the deposit is agreed) there won’t be any charge to hold the room but if the room
                                is not
                                occupied in the second week we will charge 50% of the weekly charge. If the room is not
                                occupied after
                                two weeks, the full charge will be applied thereafter until the admission date. If you
                                pay the
                                deposit for the room and don’t take the room, you will lose the full deposit.
                                </span>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>2.5</b></span>
                                <span class="list-text">
                                If the PCT decides that you are no longer eligible for continuing NHS healthcare
                                you will be responsible for paying the Home’s Total Weekly Fee as specified in the
                                Admission Agreement. This means that:

                                <ul style="list-style: none; padding-left: 0;">
                                    <li class="pt-3 d-flex">
                                    <span class="list-number"><b>2.5.1</b></span>
                                    <span class="list-text">
                                     If you are not eligible for all or part of the Home’s charges to be
                                        paid by a local
                                        authority and you are unwilling or unable to pay the Home’s charges then we will
                                        be entitled to require you to leave the Home. You will be given not less than
                                        one month’s
                                        notice and you will have to leave the Home at the end of the notice period;</span>
                                    </li>
                                    <li class="marginTop-space-doc" style="break-before: page; page-break-before: always;">
                                        <div class="pt-3 d-flex">
                                            <span class="list-number"><b>2.5.2</b></span>
                                            <span class="list-text">
                                            If you are eligible for all or part of the Home’s charges to be paid by a local
                                        authority (NHS) and there is a shortfall between the Home’s Total Weekly Fee and
                                        the
                                        amount that the local authority will pay (together with the amount of your
                                        assessed contribution) any
                                        shortfall in fees must be paid by a third party on your behalf from the date
                                        that the local
                                        authority starts paying for you, until a less expensive room becomes available.
                                        After that
                                        period, you will be able to stay in the Home. If the shortfall cannot be paid by
                                        a third party
                                        whilst waiting for the less expensive room then we reserve the right not to
                                        accept you as a local
                                        authority funded resident, in which case you will either have to leave the Home
                                        or you will have
                                        to pay the Home’s Total Weekly Fee from your own funds without any contribution
                                        from the
                                        local authority.
                                        </span>
                                        </div>
                                    </li>
                                </ul>
                                </span>
                            </li>
                        </ul>
                    </li>
                    <li class="pt-3">
                        <strong class="head-text">IF A LOCAL AUTHORITY CONTRIBUTES TO OUR CHARGES</strong>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>3.1</b></span>
                                <span class="list-text">
                                <b>Room ${residentData?.bedDetails?.bedName}</b> at <b>${comapanyDetails?.tradeName}</b> has been reserved for <b>${getLabelByValue(SALUTATION_LIST, residentData?.personal.salutation)}. ${residentData?.personal.name}.
                                </b> 
                                The weekly nursing fee is <b>${(isLocalAuthority || isJointFund) ? priceFormat(roomPrice) : "NA"}</b> from <b>${(isLocalAuthority || isJointFund) ? moment(fundDetails?.sDate).format('DD/MM/YYYY') : 'NA'} </b> excluding FNC.
                                The weekly ${isFamilyTopUp ? 'Family Topup' : 'Client Contribution'} is

                                <b>${isFamilyTopUp ? priceFormat(fundDetails?.familyTopupPrice || 0) : priceFormat(fundDetails?.clientContribution || 0)},</b> weekly
                                Third-Party Top-Up is <b>${(isLocalAuthority || isJointFund) ? priceFormat(fundDetails?.thirdPartyTopupPrice || 0) : 'NA'},</b> and the weekly Local Council Contribution is
                                <b>${(isLocalAuthority || isJointFund)
            ? priceFormat(
                (isJointFund
                    ? Number(jointFundLaPrice ?? 0)
                    : Number(roomPrice ?? 0)) -
                (
                    Number(fundDetails?.thirdPartyTopupPrice ?? 0) +
                    (isFamilyTopUp
                        ? Number(fundDetails?.familyTopupPrice ?? 0)
                        : Number(fundDetails?.clientContribution ?? 0))
                )
            )
            : 'NA'}.</b>
                                The Monthly ${isFamilyTopUp ? 'Family Topup' : 'Client Contribution'} is <b>${isLocalAuthority ? priceFormat(laMonthlyPrice) : 'NA'}</b>.
                                </span>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>3.2</b></span>
                                <span class="list-text">
                                If the local authority has agreed to pay a contribution to our charges for a
                                temporary period while your house or flat is being sold (e.g. for a “12-week property
                                disregard” period or under a deferred payment agreement) or for any other reason and
                                there is a
                                shortfall between the amount that the local authority pays and the full amount of our
                                charges, you
                                will be responsible for paying us the shortfall. However, the Home will provide you with
                                credit
                                on this shortfall interest free for the first 12 weeks and after 12 weeks at an interest
                                rate of
                                8% per annum, provided that this debt can be secured with a legal charge against your
                                property.
                                The legal charge gives the Home the right to sell your property at auction if it is not
                                sold
                                within nine months and ensures that the debt is paid to the Home from the proceeds of
                                the property
                                sale. 
                                </span>
                                
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>3.3</b></span>
                                <span class="list-text">
                                The local authority’s assessment of the amount of its contribution towards our
                                charges may include an amount that you are required to contribute from your own
                                resources (a “Client Contribution”). We are not involved in the local authority’s
                                assessment of your
                                contribution and if you have any queries about this you should raise them directly with
                                your local
                                authority.
                                </span>    
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>3.4</b></span>
                                <span class="list-text">
                                If you have been assessed by the local authority to pay a Client Contribution,
                                this is payable monthly in advance; if you have agreed to pay a Third-Party Top-Up, this
                                is also payable monthly in advance.
                                </span>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>3.5</b></span>
                                <span class="list-text"> 
                                If you are unable to move into the Nursing Home straightaway and we agree to hold
                                a room for you, we require one-week nursing fee as deposit. For the first week (from the
                                 date the deposit is agreed) there won’t be any charge to hold the room but if the room
                                is not
                                occupied in the second week we will charge 50% of the weekly charge. If the room is not
                                occupied after
                                two weeks, the full charge will be applied thereafter until the date of admission. If
                                you pay the
                                deposit for the room and don’t take the room, you will lose the full deposit.
                                </span>
                            </li>
                        </ul>
                    </li>
                    <li class="marginTop-space-doc" style="break-before: page; page-break-before: always;">
                        <strong class="head-text">INVOICING AND PAYMENT ARRANGEMENTS</strong>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>4.1</b></span>
                                <span class="list-text">
                                For convenience and regularity of payments, our charges are payable monthly
                                in advance on the first of each month by Standing order. A returnable deposit of one
                                month’s fee must be paid in addition with the first month’s fee. This deposit will be
                                returned when the
                                resident leaves for whatever reason subject to it being set against the final account
                                outstanding. On signing a contract for admission to the Home and in advance of admission
                                you and any third party
                                paying a Third-Party Top-Up on your behalf will also be required to sign the contract.
                                </span>
                            </li>
                            <li >
                                <div class="pt-3 d-flex">
                                    <span class="list-number"><b>4.2</b></span>
                                <span class="list-text">
                                If our charges (including any Third-Party Top-Up) remain unpaid 14 days after due
                                date (invoice date), we reserve the right to charge interest at a rate of 2% per month
                                above LIBOR, calculated on a daily accrued basis from the due date up to the date of
                                actual payment.
                                In addition to the interest, late payment fee will apply.
                                </span>
                                </div>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>4.3</b></span>
                                <span class="list-text">
                                At the end of your stay we will provide a statement of account. If this shows that
                                there has been an overpayment of any charges, the amount of the overpayment will be
                                refunded. Alternatively, if the statement shows an outstanding amount due to the Home in
                                respect
                                of any charges, the outstanding amount will be payable.</span>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>4.4</b></span>
                                <span class="list-text">
                                If the invoice is disputed, this must be notified in writing to the Head Office
                                within 7 days of the invoice date and it is the responsibility of the resident or the
                                representative to ensure Head Office received their letter.</span>
                            </li>

                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>4.5</b></span>
                                <span class="list-text">
                                Each year, we review our operating costs and strive to keep fee increases to a minimum. However, due to rising food, fuel, and staffing costs, a modest increase is necessary to maintain the quality of care and support annual staff salary reviews. 
                                <ul style="list-style: none; padding-left: 0;">
                                    <li class="pt-3 d-flex">
                                        <span class="list-number"><b>4.5.1</b></span>
                                        <span class="list-text">
                                        For private residents, an annual increase of 8% will apply to weekly fees (subject to change).
                                        </span>
                                    </li>
                                    <li class="pt-3 d-flex">
                                        <span class="list-number"><b>4.5.2</b></span>
                                        <span class="list-text">
                                        For residents funded with a family top-up, an annual increase of 6% will apply to weekly fees (subject to change).
                                        </span>
                                    </li>
                                </ul>
                                </span>
                            </li>
                        </ul>
                    </li>
                    <li class="pt-3">
                        <strong class="head-text">NURSING CARE</strong>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="pt-3 d-flex">
                                 <span class="list-number"><b>5.1</b></span>
                                <span class="list-text">
                                Under the provisions of the Health and Social Care Act 2001 (the “Act”) if
                                you are a resident who has been assessed as requiring nursing care some (but not all) of
                                the
                                nursing care provided to you by the Home will be funded by the NHS instead of by you.
                                The amount of
                                your nursing care that is funded by the NHS is assessed periodically by an NHS appointed
                                registered
                                nurse carrying out an assessment of your requirement for “nursing care” as defined in
                                the Act.
                                This requirement for “nursing care” is described as your “Funded Nursing Care
                                Contribution”
                                or “FNCC”. The Department of Health has developed a “tool” for the registered nurses to
                                use when
                                carrying out these assessments, to ensure consistency.
                                </span>    
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>5.2</b></span>
                                <span class="list-text">
                                The weekly amount that the NHS will pay is fixed according to whether your Funded
                                Nursing Care Contribution is assessed as being medium or high. It should be noted that
                                NHS funding does NOT extend to nursing care provided by care assistants or to the
                                provision of
                                personal care services. It covers only a small portion of the cost of the registered
                                nurse input in
                                monitoring care delegated to residents.
                                </span>
                            </li>
                            <li  class="marginTop-space-doc" style="break-before: page; page-break-before: always;" >
                                <div class="pt-3 d-flex">
                                    <span class="list-number"><b>5.3</b></span>
                                <span class="list-text">
                                In most, if not all cases, the amount paid by the NHS for your nursing care will
                                be insufficient to cover the cost of the nursing care actually provided to you by the
                                Home. Any FNCC payable in respect of your nursing care will be paid directly to the Home
                                by the NHS.
                                </span>
                                </div>
                            </li>
                        </ul>
                    </li>
                    <li class="pt-3">
                        <strong class="head-text">OUR CHARGES WHEN YOU LEAVE THE HOME</strong>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>6.1</b></span>
                                <span class="list-text">
                                You will be charged the full fee for your room during any period that you
                                have temporarily vacated the Home, for example if you are admitted to hospital or visit
                                relatives.
                                </span>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>6.2</b></span>
                                <span class="list-text">
                                If you want to leave the Home on a permanent basis, for whatever reason, you must
                                give one-month notice (unless notice is given during trial period). Our charges end one
                                month from the date written notice is given or later if the resident moves out at a
                                later date.
                                </span>
                            </li>
                            <li >
                                <div class="pt-3 d-flex">
                                    <span class="list-number"><b>6.3</b></span>
                                <span class="list-text">
                                In the event of decease, management reserves the right to charge minimum between
                                three days up to 10 days or maximum of one calendar month’s charges from the day after
                                deceased. Charges over 3 days will be assessed on a case by case by the management.
                                These charges
                                are to cover the various costs associated with the changeover to a new resident (e.g. 72
                                hours deep
                                cleaning after death to comply with our infection control policies and Care Standard
                                Act,
                                decoration of the room, damages to joinery etc.), hence it covers much more than just
                                the charges for the
                                room while it is unoccupied. If family is unable to clear the room, please advise nurse
                                in charge
                                and provide permission for staff to clear the room. We don’t hold responsibility for any
                                missing or
                                damaged property if the room is cleared by us. We can only store personal belongings up
                                to two
                                weeks from the date of death.
                                </span>
                                </div>
                            </li>
                            <li class="pt-3 d-flex">
                                <span class="list-number"><b>6.4</b></span>
                                <span class="list-text">
                                CHC only pays up to the date of the deceased. Local authority (this can vary by
                                councils) pays for their contribution for three days after the deceased. Any differences
                                between CHC/local authority contribution and the weekly room rate will be payable to the
                                nursing
                                home from the resident’s estate.
                                </span>
                            </li>
                        </ul>
                    </li>
                </ol>
            </section>
            <!-- Section-C -->
            <section class="mb-4" id="section-c" >
               <h4
  class="section-title"
  style="
    background:${theme.sectionBg};
    padding:.5rem .75rem;
    border-radius:.35rem;
    margin-bottom:2rem;
    margin-top:3rem;
    text-align:center;
    border:1px solid ${theme.border};
  "
>

                    Section C </h4>
                <h4>SERVICES COVERED BY OUR CHARGES (no additional payment required)</h4>
                <p class="clause" style="margin-bottom:1rem">Services include:</p>
                <ul>
                    <li>Full board and accommodation in a room for your exclusive use (or, if you have chosen to share,
                        in a double room). The room can be provided with all necessary furniture, or if you prefer, you
                        can bring your own furniture provided it complies with the relevant fire and health and safety
                        regulations.</li>
                    <li>A choice of meals, plus snacks and drinks. We will also cater for special dietary requirements
                        by arrangement with the Home Manager and Chef.</li>
                    <li>Full use of all the communal lounges, dining rooms, bathrooms and any other communal facilities
                        in the home.</li>
                    <li>The opportunity to join in with activities run by the Home and the use of recreational
                        facilities (you may be asked to make a financial contribution to the cost of some activities or
                        excursions).</li>
                    <li class="marginTop-space-doc" style="break-before: page; page-break-before: always;">Assistance with washing, bathing, medication and other personal services, as reasonably
                        required. Staff are on duty throughout the day and night to assist you.</li>
                    <li>A complete laundry service (excluding dry cleaning). Missing clothing due to poor labelling has
                        been a long standing issue. Independent provider has been appointed to provide labelling cost at
                        £25 which includes 48 button labels attached to each clothing which does not come off during
                        numerous wash. All residents must purchase the labelling with our independent provider.</li>
                    <li>Liaison with your GP, social worker, district nurse, dentist, chiropodist and other
                        professionals, but any charge that any of these makes must be met by you.</li>
                    <li>We provide 24-hour nursing care but we do not provide one to one care on a 24 hour basis. As we
                        don’t provide 24 hours one to one care, we cannot prevent any falls at the home. We will
                        complete falls risk assessment and also include detail mobility care plan where we will try and
                        minimize fall but we can’t completely prevent falls.</li>
                </ul>
                <h4 >ADDITIONAL THINGS THAT WILL BE CHARGED TO YOU</h4>
                <p class="clause" style="margin-bottom:1rem">We expect you to pay separately for transport outside the
                    home, one-to-one staff
                    assistance outside the home and all personal items such as clothing, newspapers/magazines,
                    toiletries, hairdressing, medications, chiropodist, special continence aids. Assistance with
                    purchasing personal items may be available by arrangement with the staff, if required. You may be
                    entitled to receive certain items (e.g. medications and continence aids) free of charge from the NHS
                    but, if this is not the case, you will need to pay for them yourself.</p>
                <p class="clause" style="margin-bottom:1rem">The needs of individual residents vary from time to time;
                    the Home Manager and staff
                    will work
                    closely with you and your relatives/representatives to identify your needs and wishes and to meet
                    them wherever possible.

                <h4>PERSONAL POSSESSIONS AND PETS</h4>
                <p class="clause" style="margin-bottom:1rem">The Home makes every effort to provide a secure environment
                    but cannot take
                    responsibility for loss or damage to personal effects brought into the Home. </p>
                <p class="clause" style="margin-bottom:1rem">Within reason, you can bring with you, your furniture and
                    possessions to make your
                    room as personal as you wish (provided
                    that any furniture and electrical items comply with relevant fire and health and safety regulations
                    and the Home’s policies).</p>
                <ul>
                    <li>If you wish to bring any electrical items or your own furniture, you should discuss
                        and agree this with the Home Manager. For example, your bed must be capable of use with the
                        Home’s hoist and must meet our requirements for the health and safety of the Home’s staff.</li>
                    <li>Electrical items can become damaged and this may result in an electric shock or
                        sometimes a fire. For safety reasons all portable electrical machinery, equipment and appliances
                        brought into the Home by you or your relative(s) etc must be safe and have been tested by a
                        competent contractor no more than one month prior to the item being brought into the Home. The
                        exception to this is an electrical item which is brand new, boxed, unused and purchased within
                        the previous six months. Items which have been appropriately checked and passed as safe must
                        carry a sticker and be accompanied by a recognized certificate of safety.</li>
                    <li class="marginTop-space-doc" style="break-before: page; page-break-before: always;">Portable Appliance Testing (PAT) is arranged by the Home each year to satisfy us that
                        electrical items belonging to the Home and to residents are safe. The cost of this testing is
                        normally borne by the Home, but we reserve the right to re-charge to you the cost of testing
                        your appliances. Unless an electrical item is new, as above, all electrical items must be
                        checked by the Manager or their deputy for a relevant PAT certificate when they are brought into
                        the Home.
                        The Manager will enter details of <u>all</u> electrical items onto an inventory for you this
                        will ensure
                        that these items are checked each year.</li>
                    <li><b>The Home reserves the right to immediately withdraw from use any electrical item
                            belonging to you which is considered by the Home Manager to be unsafe for any reason or
                            untested
                            in accordance with the above.</b></li>
                    <li><b>Should you require insurance for specific items please ensure that suitable
                            arrangements are made.</b> You or your representative will be required to complete and sign
                        an
                        inventory of the items that you bring with you.</li>
                    <li>The Home is unable to accept pets unless by special agreement with the Manager for
                        the pets to visit the residents.</li>
                    <li>When you leave the Home, for whatever reason, you or your relatives or
                        representatives will be responsible for the removal of your personal possessions on the same day
                        of you leaving. If this does not happen, we reserve the right to clear your room and put your
                        personal effects into storage and cost of storage will be included in the final invoice.</li>
                </ul>
                <h4 >CHANGE OF ROOM </h4>
                <p class="clause" style="margin-bottom:1rem">Our charges vary according to your care needs and the size
                    and specification of the
                    room you occupy and depending on whether or not you share a room. If you become unable to afford the
                    charge that applies to your room we will, if possible, offer you an alternative room at a lower
                    charge that you can afford. If there is no such alternative room that we can offer you, or if you
                    decline the alternative room offered then, with regret, we may ask you to leave the Home (see
                    below).</p>
                <h4 >RIGHTS OF RESIDENCY</h4>
                <p class="clause" style="margin-bottom:1rem">Your residence in the Home does not give you a tenancy or
                    an assured tenancy under the
                    Housing Act 1988, neither does it create or imply any right to security of tenure. You will be
                    allocated a room on admission which you will occupy as a licensee only. We will not normally ask you
                    to move from one room to another; however, we reserve the right to relocate you to a different room
                    at any time if we think this is necessary to enable us to deliver effective and efficient care
                    services in line with your assessed needs. If we do need to move you to a different room we will
                    give you a reasonable period of notice. If the move is unacceptable to you, you will have the right
                    to terminate your contract with us with immediate effect and without penalty, but this will mean
                    that you will have to leave the Home.</p>
                <p class="clause" style="margin-bottom:1rem">We have, and require, full, free and unrestricted access to
                    your room in order,
                    amongst other things, to provide the services referred to in this document.</p>
                <h4 class="marginTop-space-doc" style="break-before: page; page-break-before: always;">TRIAL PERIOD</h4>
                <p class="clause" style="margin-bottom:1rem">Before moving into the Home, you are welcome to visit, to
                    meet staff and residents,
                    stay for lunch or tea and find out all you need to know about the Home. Once you have moved into the
                    Home, it is important that you are able to decide if it is the right home for you; the first month
                    is really a trial period to enable you to make sure you have made the correct decision. You are
                    never under any obligation to stay if you do not feel the home is right for you. During the first
                    month you can give one week notice and terminate the contract.</p>
                <h4>WHAT WE ASK OF YOU</h4>
                <p class="clause" style="margin-bottom:1rem">Whenever a group of people live together in a community,
                    such as in the Home, it is
                    important for the smooth running of the home and for the comfort and happiness of all residents that
                    some simple rules are observed by everyone. These rules will always be reasonable and are made
                    either to implement the Home’s statutory obligations or for the general comfort of all residents
                    (they are not made for the convenience of the Home and its staff).</p>
                <p class="clause" style="margin-bottom:1rem">On this basis, you are required to agree to the following
                    rules:</p>
                <h5>Care Planning</h5>
                <ul>
                    <li><b>On-going amendments:</b> The home will review care plans on a monthly basis or
                        earlier to make changes to the care plan as the need arises. The residents or resident’s
                        representative will be requested on admission whether they want to be involved in the care plan
                        and their wish/decision will be followed.</li>
                    <li><b>Photographs:</b> The home is permitted to hold photographs of the resident for identification
                        purposes and care records.</li>
                    <li><b>Procedure on Death:</b> This will take full account of the known wishes of the resident and
                        family,
                        as notified at the time of the resident’s admission.</li>
                    <li ><b>Smoking</b> – for safety reasons you are not permitted to smoke within the premises. There is
                        a
                        designated smoking area outside the premises if you wish to smoke.</li>
                    <li><b>Keeping your medication in the locked cupboard provided</b> – the Home is required to ensure
                        that
                        all medication is kept in a locked cupboard. If you wish to administer your own medication we
                        are happy for you to do so, if we believe you are able, and we will provide you with a suitable
                        lockable cupboard in your room for you to keep your medication in. You are required to ensure
                        that your medication is always kept in the cupboard and that the cupboard is kept locked. If you
                        fail to observe this rule we will have to administer your medication for you. The Manager will
                        go through with you the self-medication procedure and you will be required to sign
                        self-medication form.</li>
                    <li><b>Fire safety measures</b> – for your own safety and that of other residents you are required
                        to
                        observe the home’s fire regulations.</li>
                    <li><b>Gifts and bequests to members of staff</b> – the Home operates a strict rule whereby the
                        Home’s
                        staff are <b>not</b> permitted to accept gifts or bequests from residents. We ask you,
                        therefore, not
                        to offer gifts or make bequests to members of staff. If you would like to show your appreciation
                        in some way, you should discuss this with the Home Manager.</li>
                    <li class="marginTop-space-doc" style="break-before: page; page-break-before: always;"><b>The signing of legal documents</b> – the Home’s staff are not permitted to sign as a witness
                        to any
                        legal documentation that relates to you.</li>
                    <li><b>Taking care of your personal possessions (including clothing)</b> – we cannot accept
                        liability for
                        items of clothing and other personal possessions that become lost or damaged. We ask that you
                        keep all items of your clothing properly labeled with your name. This is a simple precaution
                        that will minimize the risk of your clothing being mislaid or lost.</li>
                </ul>
                <h4>CIRCUMSTANCES IN WHICH YOU MAY BE ASKED TO LEAVE</h4>
                <ol>
                    <li>
                        <p class="clause" style="margin-bottom:1rem"> <b>If the Home is unable to provide the level of
                                care you need:</b> We hope
                            we can
                            accommodate all our residents’ needs, including terminal care where this becomes necessary
                            and is in the best
                            interest of the individual. </p>
                        <p class="clause" style="margin-bottom:1rem">If your needs exceed those the Home can provide,
                            the Home Manager
                            will explain to you and your relatives or representatives the type of care arrangements that
                            you need and assistance will be given in making alternative arrangements for your future
                            care.
                            The decision to move you from the Home will only be made following consultation with you,
                            your
                            family and relevant health professionals.</p>
                        <p class="clause" style="margin-bottom:1rem">No period of notice is required (either from you or
                            from the home) if you leave the Home in these circumstances.</p>
                    </li>
                    <li><b>If our charges are not paid in full when they are due:</b> If for any reason our charges are
                        not
                        paid at the times we have agreed with you and you are unable to satisfy us that the reason for
                        the non or late payment is temporary and will not continue for more than one month, with all
                        arrears being paid in full, you will have to leave the Home. We will give you at least one
                        week’s notice.</li>
                    <li ><b>If you become eligible, and apply, for funding by the local authority and have given us less
                            than one-year notice of your eligibility for local authority funding:</b> We appreciate that
                        there
                        may come a time when you become eligible to apply to the local authority to pay our charges. In
                        the event that:

                        <ol class="clause" style="margin-top: 1rem;;margin-bottom:1rem" type="a"  >
                            <li>You have given us less than one-year written notice of you becoming eligible for local
                                authority funding (during which one year period our charges have been paid in full); and
                            </li>
                            <li>the amount the local authority is willing to pay (together with your assessed
                                contribution (if any) is less than our full charges; and</li>
                            <li>the shortfall is not made up on your behalf</li>
                        </ol>
                        We reserve the right to require you to leave the Home. We will give you at least one month’s
                        notice. See also Section B paragraph 1.4 of for more information.
                    </li>
                    <li><b>Incompatibility:</b> If we feel that you are not compatible with the Home, for example if you
                        find
                        it difficult to adhere to the Home’s rules which causes friction between you and the other
                        residents or between you and the staff, we may consider that it will be in your best interests
                        and in the best interests of the Home for you to leave. In the unlikely event that this were to
                        happen we would give you at least one week’s notice and you would be required to leave the Home
                        at the end of the notice period.</li>
                    <li style="break-before: page; page-break-before: always;" class="marginTop-space-doc"><b>Emergency closure of the Home:</b> In the unlikely event that the Home has to be closed in an
                        emergency situation, you will be required to leave the Home. We will give you as much notice as
                        reasonably possible in all the circumstances but certain emergencies may necessitate your
                        leaving the Home on immediate notice. If this were to happen you would be responsible for
                        finding an alternative home but we would give you as much assistance as possible to do this.

                    </li>
                    <li><b>Other reasons:</b> There may be other reasons why we would need to ask you to leave the Home,
                        e.g.
                        if we needed to close the Home for any (non-emergency) reason. In this event we would give you
                        at least one months’ notice.</li>
                </ol>
                <h4>PROCEDURE ON THE DEATH OF A RESIDENT</h4>
                <p class="clause" style="margin-bottom:1rem">Our objective is to enable residents to enjoy a high
                    quality of life and talk of death
                    may appear inappropriate. However, it is the wish of many of our residents and their families when
                    deciding to move into the Homes that they will live in the Home and be cared for there for the rest
                    of their lives.</p>
                <p class="clause" style="margin-bottom:1rem">The care of a resident who is close to death requires
                    sensitivity and special skills,
                    and the Home’s staff provide all possible support and assistance with arrangements for any
                    specialist help required for the physical, emotional and spiritual care for the resident. To enable
                    us to fulfill this important aspect of care, it would be helpful if you could advise us of any
                    particular requests you may have, including any social or cultural traditions you would wish to be
                    observed.</p>
                <h4>SOME GENERAL INFORMATION ABOUT THE HOME</h4>
                <p class="clause" style="margin-bottom:1rem">The Company is registered with the Care Quality Commission
                    in respect of its ownership
                    and operation of the Home. Inspectors have a statutory responsibility to inspect the Home to ensure
                    that it is being operated in accordance with current legislation and to assess the standard of
                    service we are providing. Their reports are published at www.cqc.org.uk.</p>
                <h4 >DATA PROTECTION</h4>
                <p class="clause" style="margin-bottom:1rem">In order to care for you we need to hold certain records
                    about you. Your (or your
                    attorney’s) signature on your contract with us constitutes your express consent for us to hold this
                    information and use it for the purpose of caring for you. You have the right under the Data
                    Protection Act to ask to see a record of the information we hold about you. We will comply with our
                    obligations under the Act to respond to your request within the prescribed period.</p>
                <h4>CONTRACTS (RIGHTS OF THIRD PARTIES) ACT 1999</h4>
                <p class="clause" style="margin-bottom:1rem">Any rights that would be conferred on third parties by
                    operation of the Contracts
                    (Rights of Third Parties) Act 1999 are expressly excluded from any contract entered into between the
                    Company and any resident, any resident’s attorney or any person personally contracting with the
                    Company in respect of a resident.</p>
                <h4 style="break-before: page; page-break-before: always;" class="marginTop-space-doc">COMPLAINTS PROCEDURE</h4>
                <p class="clause" style="margin-bottom:1rem">We welcome your comments, both positive and negative,
                    regarding the service you
                    receive. If you are in any way dissatisfied with our service and would like to register a formal
                    complaint, it is vital you follow our Complaints Procedure to ensure we fully consider your
                    grievance. Our Complaints Procedure is in the ‘Service Users Guide’ and also complaint procedure is
                    posted on the wall at the entrance.</p>
                <p class="clause" style="margin-bottom:1rem">You may also take your concerns to the Care Quality
                    Commission; whose telephone number
                    is 0300 061 6161.</p>
                <div class="footerContract-section">
                <hr class="mt-5" />
                <p class="mb-3 mt-3 " >
                    <strong>I HAVE READ AND UNDERSTOOD THE CONDITIONS OF ADMISSION AND ACCEPT THEM:</strong>
                </p>
                <p>Client's Name: <span
                    class="sig-line"
                    style="
                        border-bottom:1px solid ${theme.text};
                        min-width:260px;
                        display:inline-block;
                        height:1.6rem;
                    "
                    ></span>

                </p>
                <div class="d-flex flex-wrap justify-content-between">
                    <div>
                        <p class="mb-2">Client's Signature: <span
                    class="sig-line"
                    style="
                        border-bottom:1px solid ${theme.text};
                        min-width:260px;
                        display:inline-block;
                        height:1.6rem;
                    "
                    ></span>

                                            </p>
                                            <p class="small-muted" style="color:${theme.mutedText};font-size:.92rem">
                    (On behalf of the client)</p>
                                        </div>
                                        <p class="mb-2">Date: <span
                    class="sig-line"
                    style="
                        border-bottom:1px solid ${theme.text};
                        min-width:260px;
                        display:inline-block;
                        height:1.6rem;
                    "
                    ></span>

                    </p>
                </div>
                </div>
                
            </section>
        </div>
    </div>`
};
