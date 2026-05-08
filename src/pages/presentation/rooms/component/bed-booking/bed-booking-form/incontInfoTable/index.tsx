import {
  Card,
  CardBody,
  CardHeader,
  CardLabel,
  CardTitle,
  Input,
  Button,
} from "../../../../../../../components/bootstrap";
import { DateTimePicker } from "../../../../../../../components/common";

import { getMinStartDate } from "../../../../../../../helpers/helpers";


export const IncontInfoTable = ({
  fundIndex,
  data,
  onAdd,
  onDelete,
  onChange,
  validator,
  isSubmited,
}: any) => {
  const incontList = data.incontDetails || [];
  //   const incontList = data;

  return (
    <Card shadow="none" borderSize={1}>
      <CardHeader>
        <CardLabel iconColor="danger">
          <CardTitle tag="div" className="h6">
            Incont Info
          </CardTitle>
        </CardLabel>
      </CardHeader>
      <CardBody>
        <table className="table table-modern table-hover mb-5">
          <thead>
            <tr>
              <th>Price Per Week</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incontList.map((incont: any, incontIndex: number) => {
              const minStartDate: any = getMinStartDate(incontList, incontIndex);
              const minEndDate: any = incont.sDate || "";

              return (
                <tr key={incontIndex}>
                  {/* Price Per Week */}
                  <td>
                    <Input
                      name="perWeek"
                      placeholder="Price Per Week"
                      value={incont.perWeek}
                      onChange={(e: any) =>
                        onChange(fundIndex, incontIndex, "perWeek", e.target.value)
                      }
                      isValid={validator.fieldValid(`Incont Price ${incontIndex + 1}`)}
                      isTouched={isSubmited}
                      invalidFeedback={validator.message(
                        `Incont Price ${incontIndex + 1}`,
                        incont.perWeek,
                        "required|numeric"
                      )}
                    />
                  </td>
                  {/* Start Date */}
                  <td>
                    <DateTimePicker
                      // type="date"
                      // onKeyDown={(e) => e.preventDefault()}
                      name="sDate"
                      value={incont.sDate}
                      minDate={minStartDate || data.fncSdate}
                      maxDate={data.eDate}
                      onChange={(e: any) =>
                        onChange(fundIndex, incontIndex, "sDate", e.target.value)
                      }
                      isValid={validator.fieldValid(`Incont Start Date ${incontIndex + 1}`)}
                      isTouched={isSubmited}
                      invalidFeedback={validator.message(
                        `Incont Start Date ${incontIndex + 1}`,
                        incont.sDate,
                        "required"
                      )}
                    />
                  </td>

                  {/* End Date */}
                  <td>
                    <DateTimePicker
                      // type="date"
                      // onKeyDown={(e) => e.preventDefault()}
                      name="eDate"
                      value={incont.eDate}
                      disabled={!incont.sDate}
                      minDate={minEndDate}
                      maxDate={data.eDate}
                      onChange={(e: any) =>
                        onChange(fundIndex, incontIndex, "eDate", e.target.value)
                      }
                      isValid={validator.fieldValid(`Incont End Date ${incontIndex + 1}`)}
                      isTouched={isSubmited}
                      invalidFeedback={validator.message(
                        `Incont End Date ${incontIndex + 1}`,
                        incont.eDate,
                        "required"
                      )}
                    />
                  </td>

                  {/* Action Buttons */}
                  <td>
                    {incont.sDate && incont.eDate && <Button
                      color="info"
                      isLight
                      icon="AddCircle"
                      onClick={() => onAdd(fundIndex)}
                    />}
                    {incontList.length > 1 && (
                      <Button
                        color="danger"
                        isLight
                        icon="Delete"
                        className="ms-2"
                        onClick={() => onDelete(fundIndex, incontIndex)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
};
