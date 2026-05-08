

import React, { useContext, useEffect, useState } from 'react';
import {
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeader,
	Page,
	PageWrapper
} from '../../../layout';
import Icon from '../../../components/icon';
import { Input } from '../../../components/bootstrap';





const EmployeePage = () => {
	return (
		<PageWrapper title={'demoPagesMenu.sales.subMenu.dashboard.text'}>
			<SubHeader>
				<SubHeaderLeft>
                    <label
                        className='border-0 bg-transparent cursor-pointer me-0'
                        htmlFor='searchInput'>
                        <Icon icon='Search' size='2x' color='primary' />
                    </label>
                    <Input
                        id='searchInput'
                        type='search'
                        className='border-0 shadow-none bg-transparent'
                        placeholder='Search customer...'
                    // onChange={formik.handleChange}
                    // value={formik.values.searchInput}
                    />
                    {/* <SubheaderSeparator /> */}
                    <SubheaderSeparator />
                  
                </SubHeaderLeft>

			</SubHeader>
			<Page container='fluid'>

				<h4>-</h4>
			</Page>
		</PageWrapper>
	);
};

export default EmployeePage;
