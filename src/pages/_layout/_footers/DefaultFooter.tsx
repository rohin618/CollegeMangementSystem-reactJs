import React from 'react';
import classNames from 'classnames';
import useDarkMode from '../../../hooks/useDarkMode';
import Footer from '../../../layout/Footer/Footer';
import moment from 'moment';

const DefaultFooter = () => {
	const { darkModeStatus } = useDarkMode();

	return (
		<Footer>
			<div className='container-fluid'>
				<div className='row'>
					<div className='col'>
						<span className='fw-light'>Copyright © {moment().format('YYYY')} - Version 0.1</span>
					</div>
					<div className='col-auto'>
						<div
							className={classNames('text-decoration-none', {
								'link-dark': !darkModeStatus,
								'link-light': darkModeStatus,
							})}>
							<small className='fw-bold'>College Project <a target='_blank' href="">CMS</a></small>
						</div>
					</div>
				</div>
			</div>
		</Footer>
	);
};

export default DefaultFooter;
