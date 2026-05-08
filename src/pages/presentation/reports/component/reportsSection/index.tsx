import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	FormGroup,
	Select,
	Option,
	Button,
} from '../../../../../components/bootstrap';
import { ReportPeriodSelector } from '../reportPeriodSelector/ReportPeriodSelector';
import { REPORT_TYPE_LIST } from '../../../../../common/data/option'; // import your list
import { SearchableSelect } from '../../../../../components/common';

export const ReportsSection = ({
	data,
	onPeriodChange,
	onDateRangeChange,
	validator,
	isSubmited,
	handleSubmit,
	isYearBasedReport,
	YEARS,
}: any) => (
	<Card>
		<CardHeader>
			<CardLabel icon='FileText' iconColor='info'>
				<CardTitle tag='div' className='h5'>
					Reports
				</CardTitle>
				<CardSubTitle tag='div' className='h6'>
					Select Report Type & Date Range
				</CardSubTitle>
			</CardLabel>
		</CardHeader>
		<CardBody>
			<div className='row g-4'>
				{/* Report Type */}
				<div className='col-md-4'>
					<FormGroup id='reportType' label='Reports Type' isFloating>
						<SearchableSelect
							id='reportType'
							placeholder='Select Reports Type'
							onChange={onPeriodChange}
							value={data.report.reportType || ''}
							isValid={validator.fieldValid('Reports Type')}
							// isTouched={isSubmited}
							invalidFeedback={validator.message(
								'Reports Type',
								data.report.reportType,
								'required',
							)}
							options={REPORT_TYPE_LIST}
						/>
					</FormGroup>
				</div>

				{/* Report Period Selector */}
				<div className='col-md-6 d-flex gap-3'>
					{isYearBasedReport && (
						<FormGroup id='year' label='Year' isFloating className='col-md-3'>
							<Select
								id='year'
								value={data.report.year || new Date().getFullYear()}
								onChange={onPeriodChange}>
								{YEARS.map((y: any) => (
									<Option key={y.value} value={y.value}>
										{y.label}
									</Option>
								))}
							</Select>
						</FormGroup>
					)}
					<div className='col-md-6 flex-grow-1'>
						<ReportPeriodSelector
							data={data.report}
							onPeriodChange={onPeriodChange}
							onDateRangeChange={onDateRangeChange}
							validator={validator}
							yearLimit={isYearBasedReport ? data.report.year || new Date().getFullYear() : undefined}
						/>
					</div>
				</div>
				<Button color='info' isLight className='col-2' onClick={handleSubmit}>
					Show Report
				</Button>
			</div>
		</CardBody>
	</Card>
);
