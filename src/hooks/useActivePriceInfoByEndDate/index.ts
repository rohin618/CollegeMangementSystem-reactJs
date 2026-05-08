import { useMemo } from "react";
import moment from "moment";

interface PriceInfo {
  perWeek?: number | '';
  sDate ?: string;
  eDate?: string;
  status?:string;
}

export const useActivePriceInfoByEndDate = (priceInfoList: PriceInfo[] = []) => {
  const activePrice = useMemo(() => {
    const today = moment().startOf("day");
    return (
      priceInfoList.find((item) =>
        moment(item.eDate, "YYYY-MM-DD").isSameOrAfter(today, "day")
      ) || null
    );
  }, [priceInfoList]);
  return activePrice;
};
