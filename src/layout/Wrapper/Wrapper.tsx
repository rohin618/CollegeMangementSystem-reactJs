import React, { FC, ReactNode, useContext } from 'react';
import { Provider } from 'react-redux';
import classNames from 'classnames';
import Content from '../Content/Content';
import WrapperOverlay from './WrapperOverlay';
import HeaderRoutes from '../Header/HeaderRoutes';
import FooterRoutes from '../Footer/FooterRoutes';
import ThemeContext from '../../contexts/themeContext';
import { MasterDataProvider } from '../../contexts/mastersContext';
import { AuthContextProvider } from '../../contexts/authContext';
import { store } from '../../store/store';

interface IWrapperContainerProps {
	children: ReactNode;
	className?: string;
}
export const WrapperContainer: FC<IWrapperContainerProps> = ({ children, className, ...props }) => {
	const { rightPanel } = useContext(ThemeContext);
	return (
		<div
			className={classNames(
				'wrapper',
				{ 'wrapper-right-panel-active': rightPanel },
				className,
			)}
			{...props}>
			{children}
		</div>
	);
};

const Wrapper = () => {
	return (
		<>
			<AuthContextProvider>
				{/* <MasterDataProvider> */}
				<Provider store={store}>
					<WrapperContainer>
						<HeaderRoutes />
						<Content />
						<FooterRoutes />
					</WrapperContainer>
					<WrapperOverlay />
					</Provider>
				{/* </MasterDataProvider> */}
			</AuthContextProvider>
		</>
	);
};

export default Wrapper;
