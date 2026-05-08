import { useMemo } from "react";
import moment from "moment";

export const useMinStartDate = (priceInfo: any[], index: number) => {
  return useMemo(() => {
    if (index === 0) return ""; // No min for first row
    const prevE = priceInfo[index - 1]?.eDate;
    return prevE
      ? moment(prevE, "YYYY-MM-DD").add(1, "day").format("YYYY-MM-DD")
      : "";
  }, [index, priceInfo]); // ✅ re-run when index or list changes
};

