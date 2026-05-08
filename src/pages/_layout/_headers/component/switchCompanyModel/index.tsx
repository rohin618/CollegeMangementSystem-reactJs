import React from 'react';

import { Modal, ModalBody, ModalHeader } from '../../../../../components/bootstrap';
import SwitchCompanyList from '../switchCompanyList';
import useDarkMode from '../../../../../hooks/useDarkMode';



interface SwitchCompanyModalProps {
	isOpen: boolean;
	toggle: () => void;
	companyList: any[];
	onSwitch: (company: any) => void;
	isLoadingCompanyList: boolean;
	isErrorCompanyList: boolean;
	errorCompanyLoading: any;
}

const SwitchCompanyModal: React.FC<SwitchCompanyModalProps> = ({
	isOpen,
	toggle,
	companyList,
	onSwitch,
	isLoadingCompanyList,
	isErrorCompanyList,
	errorCompanyLoading,
}) => {
	const { darkModeStatus } = useDarkMode();

	return (
		<Modal isOpen={isOpen} setIsOpen={toggle} titleId='switch-company-modal'>
			<ModalHeader setIsOpen={toggle}>
				<h5>Select Company</h5>
			</ModalHeader>

			<ModalBody>
				<SwitchCompanyList
					isLoading={isLoadingCompanyList}
					isError={isErrorCompanyList}
					error={errorCompanyLoading}
					companyList={companyList}
					onClick={onSwitch}
				/>
			</ModalBody>
		</Modal>
	);
};

export default SwitchCompanyModal;
