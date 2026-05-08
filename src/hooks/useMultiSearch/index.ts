import { useMemo } from "react";

export const useMultiSearch = <T extends Record<string, any>>(
  data: T[] = [],
  searchCriteria: Record<string, any> = {}
): T[] => {
  return useMemo(() => {
    try {
      const criteriaKeys = Object.keys(searchCriteria).filter(
        (key) =>
          searchCriteria[key] !== "" &&
          searchCriteria[key] !== undefined &&
          searchCriteria[key] !== null
      );

      if (!criteriaKeys.length) return data; // No filter applied

      const filDate =data.filter((item) =>
        criteriaKeys.every((key) => {
          const value = searchCriteria[key];
          const itemValue = item[key];
          

          if (typeof value === "string") {
        
            return itemValue
              ? String(itemValue).toLowerCase().includes(value.toLowerCase())
              : false;
          }

          if (typeof value === "number" && Array.isArray(itemValue)) {
            return itemValue.includes(value);
          }
          return itemValue === value;
        })
      );

      return filDate
    } catch (e) {
      console.error("Error in useMultiSearch:", e);
      return data;
    }
  }, [data, searchCriteria]);
};
