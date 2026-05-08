import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardLabel,
  CardSubTitle,
  CardTitle,
  Button,
  CardFooter,
  CardFooterLeft,
} from '../../../../../components/bootstrap';
import { TColor } from '../../../../../type/color-type';

type TTabs = 'Name Of LA' | 'ICB' | 'FNC Details' | 'information' | 'Bank Details' | 'VAT Config';
const TABS = {
  NAME_OF_LA: 'Name Of LA',
  ICB: 'ICB',
  FNM_DETAILS: 'FNC Details',
  BANK_DETAILS: 'Bank Details',
  VAT_CONFIG: 'VAT Config',
  INFORMATION: 'information',
} as const;
import { NameOfLAList, FNMDetails, BankDetails, VATConfigList, CompanyInfoDetails } from './tabs'

export const CompanySettingsTab = ({ companyId ='' }: any) => {
  const [activeTab, setActiveTab] = useState<TTabs>(TABS.FNM_DETAILS);

  const renderTabButton = (
    label: TTabs,
    icon: string,
    color: TColor
  ) => (
    <div className="col-12">
      <Button
        icon={icon}
        color={color}
        className="w-100 p-3"
        isLight={label !== activeTab}
        onClick={() => setActiveTab(label)}
      >
        {label}
      </Button>
    </div>
  );

  return (
    <div className="row h-100">
      <div className="col-xl-3 col-lg-4 col-md-6">
        <Card stretch>
          <CardHeader>
            <CardLabel icon="Person" iconColor="info">
              <CardTitle tag="div" className="h5">Company Settings</CardTitle>
              <CardSubTitle tag="div" className="h6">Account Information</CardSubTitle>
            </CardLabel>
          </CardHeader>
          <CardBody isScrollable>
            <div className="row g-3">
              {/* {renderTabButton(TABS.NAME_OF_LA, 'Contacts', 'info')}
              {renderTabButton(TABS.ICB, 'Place', 'info')} */}
              {renderTabButton(TABS.FNM_DETAILS, 'Style', 'info')}
              {renderTabButton(TABS.VAT_CONFIG, 'AutoAwesomeMotion', 'info')}
              {renderTabButton(TABS.BANK_DETAILS, 'AccountBalance', 'info')}
              <div className="col-12 border-bottom" />
              {renderTabButton(TABS.INFORMATION, 'Info', 'success')}
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="col-xl-9 col-lg-8 col-md-6">
        {/* <Card hasTab> */}
        {/* <CardTabItem id='profile' title='Profile' icon='Contacts'> */}
        {/* Tab content goes here */}
        {/* {activeTab === TABS.NAME_OF_LA && <NameOfLAList companyId={companyId} />}
        {activeTab === TABS.ICB && <NameOfLAList isFromICBTab companyId={companyId}/>} */}
        {activeTab === TABS.FNM_DETAILS && <FNMDetails companyId={companyId}/>}
        {activeTab === TABS.BANK_DETAILS && <BankDetails companyId={companyId}/>}
        {activeTab === TABS.VAT_CONFIG && <VATConfigList companyId={companyId}/>}
        {activeTab === TABS.INFORMATION && <CompanyInfoDetails companyId={companyId}/>}

        {/* </CardTabItem> */}

        {/* </Card> */}
      </div>
    </div>
  );
};
