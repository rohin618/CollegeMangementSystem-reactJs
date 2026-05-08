import moment from "moment";
import {
    Card,
    CardBody,
    CardHeader,
    CardLabel,
    CardSubTitle,
    CardTitle,
    FormGroup,
    Input,
    Textarea
} from "../../../../../../../components/bootstrap";

export const AdvancePaymentSection = ({ data, onChange, validator, isSubmited }: any) => (

    <Card>
        <CardHeader>
            <CardLabel icon="Receipt" iconColor="info">
                <CardTitle tag="div" className="h5">
                    Resident Deposit Payment Details
                </CardTitle>
                <CardSubTitle tag="div" className="h6">
                    Resident Deposit Information
                </CardSubTitle>
            </CardLabel>
        </CardHeader>

        <CardBody>
            <div className="row g-4">
                {/* Total Amount */}
                <div className="col-md-6">
                    <FormGroup id="totalAmount" label="Total Amount" isFloating>
                        <Input
                            id="totalAmount"
                            type="number"
                            placeholder="Enter total amount"
                            value={data.advancePayment.totalAmount || ""}
                            onChange={onChange}
                            // isValid={validator.fieldValid("Total Amount")}
                            isTouched={isSubmited}
                            // invalidFeedback={validator.message(
                            //     "Total Amount",
                            //     data.advancePayment.totalAmount,
                            //     "required"
                            // )}
                        />
                    </FormGroup>
                </div>

                {/* Date */}
                <div className="col-md-6">
                    <FormGroup id="date" label="Date" isFloating>
                        <Input
                            id="date"
                            type="date"
                            placeholder="Select date"
                            value={data.advancePayment.date || ""}
                            onChange={onChange}
                            // isValid={validator.fieldValid("Date")}
                            isTouched={isSubmited}
                            // invalidFeedback={validator.message(
                            //     "Date",
                            //     data.advancePayment.date,
                            //     "required"
                            // )}
                            min={moment(
                                data?.admission?.admissionDate,
                            ).format('YYYY-MM-DD')}
                        />
                    </FormGroup>
                </div>

                {/* Remarks */}
                <div className="col-md-12">
                    <FormGroup id="remarks" label="Remarks" isFloating>
                        <Textarea
                            id="remarks"
                            //   rows={5}
                            placeholder="Enter remarks"
                            value={data.advancePayment.remarks || ""}
                            onChange={onChange}
                            // isValid={validator.fieldValid("Remarks")}
                            isTouched={isSubmited}
                            // invalidFeedback={validator.message(
                            //     "Remarks",
                            //     data.advancePayment.remarks,
                            //     "required"
                            // )}
                        ></Textarea>
                    </FormGroup>
                </div>
            </div>
        </CardBody>
    </Card>
);
