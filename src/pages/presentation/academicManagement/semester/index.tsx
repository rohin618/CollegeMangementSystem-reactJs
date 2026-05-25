
import {
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
	Page,
} from '../../../../layout';

import { Button,} from '../../../../components/bootstrap';

import Icon from '../../../../components/icon';






const SemesterPage = () => {
	

	return (
		<PageWrapper title='Departments'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='departmentSearch'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>

				

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						icon='FilterAlt'
						color='dark'
						isLight
						className='btn-only-icon position-relative'
						>
						
						
					</Button>

					<SubheaderSeparator />

						
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				
			gf
			</Page>

			
		</PageWrapper>
	);
};

export default SemesterPage;
